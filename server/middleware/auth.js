const jwt = require('jsonwebtoken');

// JWT 密钥 - 生产环境中应使用环境变量
const JWT_SECRET = process.env.JWT_SECRET || 'campus_secondhand_jwt_secret_2024_secure';

// 验证 JWT Token 的中间件
const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: '未登录，请先登录' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    
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
const optionalAuthMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = {
        userId: decoded.userId,
        username: decoded.username,
        role: decoded.role
      };
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
