const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { pool, hashPassword, verifyPassword } = require('../config/db');
const { JWT_SECRET } = require('../middleware/auth');

// JWT 有效期
const JWT_EXPIRES_IN = '7d';

// 用户注册
router.post('/register', async (req, res) => {
  try {
    const { username, password, dorm_location, contact_info } = req.body;

    // 参数校验
    if (!username || !password) {
      return res.status(400).json({ success: false, message: '用户名和密码不能为空' });
    }

    if (username.length < 3 || username.length > 20) {
      return res.status(400).json({ success: false, message: '用户名需要3-20个字符' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: '密码至少需要6个字符' });
    }

    if (!dorm_location) {
      return res.status(400).json({ success: false, message: '请填写宿舍位置' });
    }

    // 宿舍格式验证
    const validDorms = ['紫菘', '沁苑', '韵苑'];
    if (!validDorms.some(dorm => dorm_location.includes(dorm))) {
      return res.status(400).json({ success: false, message: '宿舍位置必须包含"紫菘"、"沁苑"或"韵苑"' });
    }

    if (!contact_info) {
      return res.status(400).json({ success: false, message: '请填写联系方式' });
    }

    // 检查用户名是否已存在
    const [existingUsers] = await pool.execute(
      'SELECT id FROM users WHERE username = ?',
      [username]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ success: false, message: '用户名已被注册' });
    }

    // 加密密码并创建用户
    const hashedPassword = hashPassword(password);
    const [result] = await pool.execute(
      'INSERT INTO users (username, password, dorm_location, contact_info, role, token_version) VALUES (?, ?, ?, ?, ?, ?)',
      [username, hashedPassword, dorm_location, contact_info, 'user', 1]
    );

    // 生成 JWT（包含 token 版本）
    const token = jwt.sign(
      { userId: result.insertId, username, role: 'user', tokenVersion: 1 },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({
      success: true,
      message: '注册成功',
      data: {
        token,
        user: {
          id: result.insertId,
          username,
          dorm_location,
          contact_info,
          role: 'user'
        }
      }
    });
  } catch (error) {
    console.error('注册失败:', error);
    res.status(500).json({ success: false, message: '注册失败，请稍后重试' });
  }
});

// 用户登录
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: '用户名和密码不能为空' });
    }

    // 查找用户
    const [users] = await pool.execute(
      'SELECT id, username, password, dorm_location, contact_info, role, status, token_version FROM users WHERE username = ?',
      [username]
    );

    if (users.length === 0) {
      return res.status(401).json({ success: false, message: '用户名或密码错误' });
    }

    const user = users[0];

    // 检查账户状态
    if (user.status !== 1) {
      return res.status(403).json({ success: false, message: '账户已被禁用，请联系管理员' });
    }

    // 验证密码（支持 bcrypt 和旧的 SHA256 格式）
    if (!verifyPassword(password, user.password)) {
      return res.status(401).json({ success: false, message: '用户名或密码错误' });
    }

    // 更新 token 版本（使其他设备上的 token 失效）
    const newTokenVersion = (user.token_version || 0) + 1;
    await pool.execute(
      'UPDATE users SET token_version = ? WHERE id = ?',
      [newTokenVersion, user.id]
    );

    // 生成 JWT（包含 token 版本）
    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role, tokenVersion: newTokenVersion },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({
      success: true,
      message: '登录成功',
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          dorm_location: user.dorm_location,
          contact_info: user.contact_info,
          role: user.role
        }
      }
    });
  } catch (error) {
    console.error('登录失败:', error);
    res.status(500).json({ success: false, message: '登录失败，请稍后重试' });
  }
});

// 获取当前用户信息
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ success: false, message: '未登录' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    const [users] = await pool.execute(
      'SELECT id, username, dorm_location, contact_info, role, status, created_at FROM users WHERE id = ?',
      [decoded.userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }

    const user = users[0];
    
    if (user.status !== 1) {
      return res.status(403).json({ success: false, message: '账户已被禁用' });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: '登录已过期，请重新登录' });
    }
    console.error('获取用户信息失败:', error);
    res.status(500).json({ success: false, message: '获取用户信息失败' });
  }
});

// 更新当前用户信息
router.put('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ success: false, message: '未登录' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const { dorm_location, contact_info } = req.body;

    await pool.execute(
      'UPDATE users SET dorm_location = ?, contact_info = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [dorm_location || '', contact_info || '', decoded.userId]
    );

    res.json({
      success: true,
      message: '更新成功'
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: '登录已过期，请重新登录' });
    }
    console.error('更新用户信息失败:', error);
    res.status(500).json({ success: false, message: '更新失败' });
  }
});

// 修改密码
router.put('/password', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ success: false, message: '未登录' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ success: false, message: '请填写原密码和新密码' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: '新密码至少需要6个字符' });
    }

    // 验证原密码
    const [users] = await pool.execute(
      'SELECT password FROM users WHERE id = ?',
      [decoded.userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }

    if (!verifyPassword(oldPassword, users[0].password)) {
      return res.status(400).json({ success: false, message: '原密码错误' });
    }

    // 更新密码（使用 bcrypt 加密）
    await pool.execute(
      'UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [hashPassword(newPassword), decoded.userId]
    );

    res.json({
      success: true,
      message: '密码修改成功'
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: '登录已过期，请重新登录' });
    }
    console.error('修改密码失败:', error);
    res.status(500).json({ success: false, message: '修改密码失败' });
  }
});

module.exports = router;
module.exports.JWT_SECRET = JWT_SECRET;
