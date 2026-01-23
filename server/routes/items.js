const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const { authMiddleware, optionalAuthMiddleware, adminMiddleware } = require('../middleware/auth');

// 管理后台 - 获取所有商品（包括已下架）- 需要管理员权限
router.get('/admin', authMiddleware, adminMiddleware, async (req, res) => {
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

// 获取当前用户发布的商品
router.get('/my', authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    const userId = req.user.userId;
    
    const [rows] = await pool.execute(
      `SELECT id, title, price, category_id, description, image_urls, \`condition\`, dormitory, views, status, created_at
       FROM items WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [userId, parseInt(limit), parseInt(offset)]
    );
    
    const items = rows.map(item => ({
      ...item,
      image_urls: item.image_urls ? JSON.parse(item.image_urls) : [],
      cover_image: item.image_urls ? JSON.parse(item.image_urls)[0] : null
    }));
    
    const [countResult] = await pool.execute(
      'SELECT COUNT(*) as total FROM items WHERE user_id = ?',
      [userId]
    );
    
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
    console.error('获取我的商品列表失败:', error);
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

// 获取商品详情（公开，但登录用户可以看到是否是自己发布的）
router.get('/:id', optionalAuthMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    // 浏览次数+1
    await pool.execute('UPDATE items SET views = views + 1 WHERE id = ?', [id]);
    
    const [rows] = await pool.execute(
      `SELECT i.id, i.title, i.price, i.category_id, i.description, i.contact_info, i.image_urls, 
              i.\`condition\`, i.dormitory, i.views, i.status, i.created_at, i.user_id,
              u.username as publisher_name, u.contact_info as user_contact, u.dorm_location as user_dorm
       FROM items i 
       LEFT JOIN users u ON i.user_id = u.id 
       WHERE i.id = ? AND i.status = 1`,
      [id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: '商品不存在或已下架' });
    }
    
    const item = rows[0];
    item.image_urls = item.image_urls ? JSON.parse(item.image_urls) : [];
    
    // 使用发布者的联系方式（如果商品没有单独设置的话优先使用用户信息）
    if (!item.contact_info && item.user_contact) {
      item.contact_info = item.user_contact;
    }
    if (!item.dormitory && item.user_dorm) {
      item.dormitory = item.user_dorm;
    }
    
    // 判断当前用户是否是发布者或管理员
    item.canEdit = false;
    item.canDelete = false;
    if (req.user) {
      if (req.user.userId === item.user_id || req.user.role === 'admin') {
        item.canEdit = true;
        item.canDelete = true;
      }
    }
    
    // 移除敏感信息
    delete item.user_contact;
    delete item.user_dorm;
    
    res.json({ success: true, data: item });
  } catch (error) {
    console.error('获取商品详情失败:', error);
    res.status(500).json({ success: false, message: '获取商品详情失败' });
  }
});

// 发布商品（需要登录）
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { title, price, category_id, description, image_urls, condition } = req.body;
    const userId = req.user.userId;
    
    // 获取用户信息
    const [users] = await pool.execute(
      'SELECT dorm_location, contact_info FROM users WHERE id = ?',
      [userId]
    );
    
    if (users.length === 0) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }
    
    const user = users[0];
    
    // 参数校验
    if (!title || !price || !category_id) {
      return res.status(400).json({ success: false, message: '请填写商品标题、价格和分类' });
    }
    
    if (!condition) {
      return res.status(400).json({ success: false, message: '请选择新旧程度' });
    }
    
    if (!image_urls || image_urls.length === 0) {
      return res.status(400).json({ success: false, message: '请至少上传一张图片' });
    }
    
    // 使用用户的宿舍和联系方式
    const dormitory = user.dorm_location;
    const contact_info = user.contact_info;
    
    if (!dormitory) {
      return res.status(400).json({ success: false, message: '请先在个人信息中填写宿舍位置' });
    }
    
    if (!contact_info) {
      return res.status(400).json({ success: false, message: '请先在个人信息中填写联系方式' });
    }
    
    const [result] = await pool.execute(
      `INSERT INTO items (title, price, category_id, description, contact_info, admin_password, image_urls, \`condition\`, dormitory, user_id) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, price, category_id, description || '', contact_info, '', JSON.stringify(image_urls), condition, dormitory, userId]
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

// 删除商品（发布者或管理员）
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const isAdmin = req.user.role === 'admin';
    
    // 检查商品是否存在
    const [rows] = await pool.execute(
      'SELECT user_id FROM items WHERE id = ?',
      [id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: '商品不存在' });
    }
    
    // 检查权限：只有发布者或管理员可以删除
    if (rows[0].user_id !== userId && !isAdmin) {
      return res.status(403).json({ success: false, message: '没有权限删除此商品' });
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
router.put('/:id/status', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    await pool.execute('UPDATE items SET status = ? WHERE id = ?', [status, id]);
    
    res.json({ success: true, message: status === 1 ? '已上架' : '已下架' });
  } catch (error) {
    console.error('更新商品状态失败:', error);
    res.status(500).json({ success: false, message: '更新商品状态失败' });
  }
});

// 管理员 - 永久删除商品
router.delete('/:id/force', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    await pool.execute('DELETE FROM items WHERE id = ?', [id]);
    
    res.json({ success: true, message: '商品已永久删除' });
  } catch (error) {
    console.error('删除商品失败:', error);
    res.status(500).json({ success: false, message: '删除商品失败' });
  }
});

module.exports = router;
