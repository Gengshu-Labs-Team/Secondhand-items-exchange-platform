const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');

// JWT 密钥 - 生产环境中应使用环境变量
const JWT_SECRET = process.env.JWT_SECRET || 'campus_secondhand_jwt_secret_2024_secure';

// 验证 JWT Token 的中间件（支持单设备登录检查）
const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: '未登录，请先登录' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // 检查 token 版本是否匹配（单设备登录）
    const [users] = await pool.execute(
      'SELECT token_version, status FROM users WHERE id = ?',
      [decoded.userId]
    );
    
    if (users.length === 0) {
      return res.status(401).json({ success: false, message: '用户不存在' });
    }
    
    const user = users[0];
    
    // 检查账号状态
    if (user.status !== 1) {
      return res.status(403).json({ success: false, message: '账户已被禁用' });
    }
    
    // 检查 token 版本（如果不匹配说明在其他设备登录了）
    if (decoded.tokenVersion !== undefined && decoded.tokenVersion !== user.token_version) {
      return res.status(401).json({ success: false, message: '您的账号已在其他设备登录，请重新登录' });
    }
    
    // 将用户信息附加到请求对象
    req.user = {
      userId: decoded.userId,
      username: decoded.username,
      role: decoded.role
    };
    
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: '登录已过期，请重新登录' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, message: '无效的登录凭证' });
    }
    console.error('认证中间件错误:', error);
    return res.status(500).json({ success: false, message: '认证失败' });
  }
};

// 可选的认证中间件 - 如果有 token 就解析，没有也放行
const optionalAuthMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET);
      
      // 检查 token 版本
      const [users] = await pool.execute(
        'SELECT token_version, status FROM users WHERE id = ?',
        [decoded.userId]
      );
      
      if (users.length > 0 && users[0].status === 1) {
        // 如果 token 版本匹配，才设置用户信息
        if (decoded.tokenVersion === undefined || decoded.tokenVersion === users[0].token_version) {
          req.user = {
            userId: decoded.userId,
            username: decoded.username,
            role: decoded.role
          };
        }
      }
    }
    
    next();
  } catch (error) {
    // 即使 token 无效也放行，只是不设置 user
    next();
  }
};

// 管理员权限验证中间件
const adminMiddleware = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: '未登录，请先登录' });
  }
  
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: '权限不足，需要管理员权限' });
  }
  
  next();
};

module.exports = {
  authMiddleware,
  optionalAuthMiddleware,
  adminMiddleware,
  JWT_SECRET
};
