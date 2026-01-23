const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const config = require('./config');
const { testConnection } = require('./config/db');

// 路由
const itemRoutes = require('./routes/items');
const uploadRoutes = require('./routes/upload');
const categoryRoutes = require('./routes/categories');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');

const app = express();

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静态文件服务 - 图片访问
const uploadDir = path.join(__dirname, config.upload.dir);
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
app.use('/uploads', express.static(uploadDir));

// 静态文件服务 - 前端页面
const clientDist = path.join(__dirname, '../client/dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
}

// API 路由
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/categories', categoryRoutes);

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 前端路由回退（SPA支持）
app.get('*', (req, res) => {
  if (fs.existsSync(clientDist)) {
    res.sendFile(path.join(clientDist, 'index.html'));
  } else {
    res.json({ message: '校园二手交易平台 API 服务运行中' });
  }
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  res.status(500).json({
    success: false,
    message: '服务器内部错误',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 启动服务器
const PORT = config.server.port;

async function startServer() {
  // 测试数据库连接
  await testConnection();
  
  app.listen(PORT, () => {
    console.log(`🚀 服务器运行在 http://localhost:${PORT}`);
    console.log(`📦 API 地址: http://localhost:${PORT}/api`);
  });
}

startServer();
