const express = require('express');
const router = express.Router();
const { pool, hashPassword } = require('../config/db');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

// 所有用户管理接口都需要管理员权限
router.use(authMiddleware, adminMiddleware);

// 获取所有用户列表
router.get('/', async (req, res) => {
  try {
    const { page = 1, pageSize = 20, keyword = '', role = '', status = '' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(pageSize);

    let whereClause = '1=1';
    const params = [];

    if (keyword) {
      whereClause += ' AND (username LIKE ? OR dorm_location LIKE ? OR contact_info LIKE ?)';
      params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
    }

    if (role) {
      whereClause += ' AND role = ?';
      params.push(role);
    }

    if (status !== '') {
      whereClause += ' AND status = ?';
      params.push(parseInt(status));
    }

    // 查询总数
    const [countResult] = await pool.execute(
      `SELECT COUNT(*) as total FROM users WHERE ${whereClause}`,
      params
    );
    const total = countResult[0].total;

    // 查询列表
    const [users] = await pool.execute(
      `SELECT id, username, dorm_location, contact_info, role, status, created_at, updated_at 
       FROM users WHERE ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(pageSize), offset]
    );

    res.json({
      success: true,
      data: {
        list: users,
        total,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      }
    });
  } catch (error) {
    console.error('获取用户列表失败:', error);
    res.status(500).json({ success: false, message: '获取用户列表失败' });
  }
});

// 获取单个用户详情
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [users] = await pool.execute(
      'SELECT id, username, dorm_location, contact_info, role, status, created_at, updated_at FROM users WHERE id = ?',
      [id]
    );

    if (users.length === 0) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }

    res.json({
      success: true,
      data: users[0]
    });
  } catch (error) {
    console.error('获取用户详情失败:', error);
    res.status(500).json({ success: false, message: '获取用户详情失败' });
  }
});

// 创建新用户（管理员添加）
router.post('/', async (req, res) => {
  try {
    const { username, password, dorm_location, contact_info, role = 'user' } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: '用户名和密码不能为空' });
    }

    if (username.length < 3 || username.length > 20) {
      return res.status(400).json({ success: false, message: '用户名需要3-20个字符' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: '密码至少需要6个字符' });
    }

    // 检查用户名是否已存在
    const [existingUsers] = await pool.execute(
      'SELECT id FROM users WHERE username = ?',
      [username]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ success: false, message: '用户名已存在' });
    }

    const hashedPassword = hashPassword(password);
    const [result] = await pool.execute(
      'INSERT INTO users (username, password, dorm_location, contact_info, role) VALUES (?, ?, ?, ?, ?)',
      [username, hashedPassword, dorm_location || '', contact_info || '', role]
    );

    res.json({
      success: true,
      message: '用户创建成功',
      data: { id: result.insertId }
    });
  } catch (error) {
    console.error('创建用户失败:', error);
    res.status(500).json({ success: false, message: '创建用户失败' });
  }
});

// 更新用户信息
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { username, dorm_location, contact_info, role, status } = req.body;

    // 检查用户是否存在
    const [existingUsers] = await pool.execute(
      'SELECT id, username, dorm_location, contact_info, role, status FROM users WHERE id = ?',
      [id]
    );

    if (existingUsers.length === 0) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }

    // 防止修改最后一个管理员的角色
    if (existingUsers[0].role === 'admin' && role !== 'admin') {
      const [adminCount] = await pool.execute(
        'SELECT COUNT(*) as count FROM users WHERE role = ?',
        ['admin']
      );
      if (adminCount[0].count <= 1) {
        return res.status(400).json({ success: false, message: '无法修改最后一个管理员的角色' });
      }
    }

    // 如果修改用户名，检查是否重复
    if (username) {
      const [duplicateUsers] = await pool.execute(
        'SELECT id FROM users WHERE username = ? AND id != ?',
        [username, id]
      );
      if (duplicateUsers.length > 0) {
        return res.status(400).json({ success: false, message: '用户名已被使用' });
      }
    }

    // 获取当前用户信息
    const currentUser = existingUsers[0];
    
    // 使用新值或保留原值
    const updatedUsername = username !== undefined ? username : currentUser.username;
    const updatedDormLocation = dorm_location !== undefined ? dorm_location : currentUser.dorm_location;
    const updatedContactInfo = contact_info !== undefined ? contact_info : currentUser.contact_info;
    const updatedRole = role !== undefined ? role : currentUser.role;
    const updatedStatus = status !== undefined ? status : currentUser.status;

    await pool.execute(
      `UPDATE users SET 
        username = ?,
        dorm_location = ?,
        contact_info = ?,
        role = ?,
        status = ?,
        updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [updatedUsername, updatedDormLocation, updatedContactInfo, updatedRole, updatedStatus, id]
    );

    res.json({
      success: true,
      message: '用户信息更新成功'
    });
  } catch (error) {
    console.error('更新用户失败:', error);
    res.status(500).json({ success: false, message: '更新用户失败' });
  }
});

// 重置用户密码
router.put('/:id/password', async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, message: '密码至少需要6个字符' });
    }

    const [existingUsers] = await pool.execute(
      'SELECT id FROM users WHERE id = ?',
      [id]
    );

    if (existingUsers.length === 0) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }

    await pool.execute(
      'UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [hashPassword(password), id]
    );

    res.json({
      success: true,
      message: '密码重置成功'
    });
  } catch (error) {
    console.error('重置密码失败:', error);
    res.status(500).json({ success: false, message: '重置密码失败' });
  }
});

// 删除用户
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // 检查用户是否存在
    const [existingUsers] = await pool.execute(
      'SELECT id, role FROM users WHERE id = ?',
      [id]
    );

    if (existingUsers.length === 0) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }

    // 不能删除管理员账户
    if (existingUsers[0].role === 'admin') {
      return res.status(400).json({ success: false, message: '不能删除管理员账户' });
    }

    // 删除用户（用户发布的商品会保留，但 user_id 会变成孤立数据）
    await pool.execute('DELETE FROM users WHERE id = ?', [id]);

    res.json({
      success: true,
      message: '用户删除成功'
    });
  } catch (error) {
    console.error('删除用户失败:', error);
    res.status(500).json({ success: false, message: '删除用户失败' });
  }
});

// 批量启用/禁用用户
router.post('/batch-status', async (req, res) => {
  try {
    const { ids, status } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: '请选择要操作的用户' });
    }

    if (status !== 0 && status !== 1) {
      return res.status(400).json({ success: false, message: '无效的状态值' });
    }

    // 不能禁用管理员
    const [admins] = await pool.execute(
      `SELECT id FROM users WHERE id IN (${ids.map(() => '?').join(',')}) AND role = 'admin'`,
      ids
    );

    if (admins.length > 0 && status === 0) {
      return res.status(400).json({ success: false, message: '不能禁用管理员账户' });
    }

    await pool.execute(
      `UPDATE users SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id IN (${ids.map(() => '?').join(',')})`,
      [status, ...ids]
    );

    res.json({
      success: true,
      message: status === 1 ? '用户已启用' : '用户已禁用'
    });
  } catch (error) {
    console.error('批量操作失败:', error);
    res.status(500).json({ success: false, message: '批量操作失败' });
  }
});

module.exports = router;
