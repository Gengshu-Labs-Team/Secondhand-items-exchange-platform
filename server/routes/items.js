const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');

// 管理员密码（实际项目应存数据库或环境变量）
const ADMIN_PASSWORD = 'admin888';

// 管理后台 - 获取所有商品（包括已下架）
router.get('/admin', async (req, res) => {
  try {
    const { category_id, status, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    
    let sql = 'SELECT id, title, price, category_id, image_urls, status, created_at FROM items WHERE 1=1';
    const params = [];
    
    if (status !== undefined && status !== 'all') {
      sql += ' AND status = ?';
      params.push(parseInt(status));
    }
    
    if (category_id && category_id !== '0') {
      sql += ' AND category_id = ?';
      params.push(category_id);
    }
    
    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    
    const [rows] = await pool.execute(sql, params);
    
    // 获取总数
    let countSql = 'SELECT COUNT(*) as total FROM items WHERE 1=1';
    const countParams = [];
    if (status !== undefined && status !== 'all') {
      countSql += ' AND status = ?';
      countParams.push(parseInt(status));
    }
    if (category_id && category_id !== '0') {
      countSql += ' AND category_id = ?';
      countParams.push(category_id);
    }
    const [countResult] = await pool.execute(countSql, countParams);
    
    res.json({
      success: true,
      data: {
        items: rows,
        total: countResult[0].total,
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('获取管理商品列表失败:', error);
    res.status(500).json({ success: false, message: '获取商品列表失败' });
  }
});

// 获取商品列表
router.get('/', async (req, res) => {
  try {
    const { category_id, page = 1, limit = 20, sort = 'latest', dormitory } = req.query;
    const offset = (page - 1) * limit;
    
    let sql = `
      SELECT id, title, price, category_id, description, image_urls, \`condition\`, dormitory, views, status, created_at
      FROM items
      WHERE status = 1
    `;
    const params = [];
    
    if (category_id && category_id !== '0') {
      sql += ' AND category_id = ?';
      params.push(category_id);
    }
    
    // 宿舍筛选（支持多选，逗号分隔）
    if (dormitory) {
      const dorms = dormitory.split(',').filter(d => d.trim());
      if (dorms.length > 0) {
        const dormConditions = dorms.map(() => 'dormitory LIKE ?').join(' OR ');
        sql += ` AND (${dormConditions})`;
        dorms.forEach(d => params.push(`%${d.trim()}%`));
      }
    }
    
    // 排序方式
    switch (sort) {
      case 'price_asc':
        sql += ' ORDER BY price ASC';
        break;
      case 'price_desc':
        sql += ' ORDER BY price DESC';
        break;
      case 'condition':
        // 按新旧程度排序（全新 > 几乎全新 > 轻微使用 > 明显使用 > 较旧）
        sql += ` ORDER BY 
          CASE 
            WHEN \`condition\` LIKE '%全新%' AND \`condition\` NOT LIKE '%几乎%' THEN 5
            WHEN \`condition\` LIKE '%九五新%' OR \`condition\` LIKE '%几乎全新%' THEN 4
            WHEN \`condition\` LIKE '%九成新%' OR \`condition\` LIKE '%轻微%' THEN 3
            WHEN \`condition\` LIKE '%八成新%' OR \`condition\` LIKE '%明显%' THEN 2
            ELSE 1
          END DESC, created_at DESC`;
        break;
      default: // 'latest'
        sql += ' ORDER BY created_at DESC';
    }
    
    sql += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    
    const [rows] = await pool.execute(sql, params);
    
    // 处理图片URL
    const items = rows.map(item => ({
      ...item,
      image_urls: item.image_urls ? JSON.parse(item.image_urls) : [],
      cover_image: item.image_urls ? JSON.parse(item.image_urls)[0] : null
    }));
    
    // 获取总数
    let countSql = 'SELECT COUNT(*) as total FROM items WHERE status = 1';
    const countParams = [];
    if (category_id && category_id !== '0') {
      countSql += ' AND category_id = ?';
      countParams.push(category_id);
    }
    const [countResult] = await pool.execute(countSql, countParams);
    
    res.json({
      success: true,
      data: {
        items,
        total: countResult[0].total,
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('获取商品列表失败:', error);
    res.status(500).json({ success: false, message: '获取商品列表失败' });
  }
});

// 获取商品详情
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // 浏览次数+1
    await pool.execute('UPDATE items SET views = views + 1 WHERE id = ?', [id]);
    
    const [rows] = await pool.execute(
      'SELECT id, title, price, category_id, description, contact_info, image_urls, `condition`, dormitory, views, status, created_at FROM items WHERE id = ? AND status = 1',
      [id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: '商品不存在或已下架' });
    }
    
    const item = rows[0];
    item.image_urls = item.image_urls ? JSON.parse(item.image_urls) : [];
    
    res.json({ success: true, data: item });
  } catch (error) {
    console.error('获取商品详情失败:', error);
    res.status(500).json({ success: false, message: '获取商品详情失败' });
  }
});

// 发布商品
router.post('/', async (req, res) => {
  try {
    const { title, price, category_id, description, contact_info, admin_password, image_urls, condition, dormitory } = req.body;
    
    // 参数校验
    if (!title || !price || !category_id || !contact_info || !admin_password) {
      return res.status(400).json({ success: false, message: '请填写所有必填项' });
    }
    
    if (!dormitory) {
      return res.status(400).json({ success: false, message: '请填写宿舍信息' });
    }
    
    if (!condition) {
      return res.status(400).json({ success: false, message: '请选择新旧程度' });
    }
    
    if (admin_password.length < 4 || admin_password.length > 6) {
      return res.status(400).json({ success: false, message: '管理密码需要4-6位' });
    }
    
    if (!image_urls || image_urls.length === 0) {
      return res.status(400).json({ success: false, message: '请至少上传一张图片' });
    }
    
    const [result] = await pool.execute(
      `INSERT INTO items (title, price, category_id, description, contact_info, admin_password, image_urls, \`condition\`, dormitory) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, price, category_id, description || '', contact_info, admin_password, JSON.stringify(image_urls), condition, dormitory]
    );
    
    res.json({
      success: true,
      message: '发布成功',
      data: { id: result.insertId }
    });
  } catch (error) {
    console.error('发布商品失败:', error);
    res.status(500).json({ success: false, message: '发布商品失败' });
  }
});

// 删除商品（需要管理密码）
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { admin_password } = req.body;
    
    if (!admin_password) {
      return res.status(400).json({ success: false, message: '请输入管理密码' });
    }
    
    // 验证密码
    const [rows] = await pool.execute(
      'SELECT admin_password FROM items WHERE id = ? AND status = 1',
      [id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: '商品不存在或已下架' });
    }
    
    if (rows[0].admin_password !== admin_password) {
      return res.status(403).json({ success: false, message: '管理密码错误' });
    }
    
    // 软删除：更新状态为已下架
    await pool.execute('UPDATE items SET status = 0 WHERE id = ?', [id]);
    
    res.json({ success: true, message: '商品已下架' });
  } catch (error) {
    console.error('删除商品失败:', error);
    res.status(500).json({ success: false, message: '删除商品失败' });
  }
});

// 管理员 - 更新商品状态（上架/下架）
router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, admin_password } = req.body;
    
    if (admin_password !== ADMIN_PASSWORD) {
      return res.status(403).json({ success: false, message: '管理员密码错误' });
    }
    
    await pool.execute('UPDATE items SET status = ? WHERE id = ?', [status, id]);
    
    res.json({ success: true, message: status === 1 ? '已上架' : '已下架' });
  } catch (error) {
    console.error('更新商品状态失败:', error);
    res.status(500).json({ success: false, message: '更新商品状态失败' });
  }
});

// 管理员 - 永久删除商品
router.delete('/:id/force', async (req, res) => {
  try {
    const { id } = req.params;
    const { admin_password } = req.body;
    
    if (admin_password !== ADMIN_PASSWORD) {
      return res.status(403).json({ success: false, message: '管理员密码错误' });
    }
    
    await pool.execute('DELETE FROM items WHERE id = ?', [id]);
    
    res.json({ success: true, message: '商品已永久删除' });
  } catch (error) {
    console.error('删除商品失败:', error);
    res.status(500).json({ success: false, message: '删除商品失败' });
  }
});

module.exports = router;
