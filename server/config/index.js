require('dotenv').config();

module.exports = {
  // 服务器配置
  server: {
    port: process.env.PORT || 3001
  },
  
  // 数据库配置
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'campus_secondhand',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  },
  
  // 上传配置
  upload: {
    dir: process.env.UPLOAD_DIR || 'uploads',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  }
};
