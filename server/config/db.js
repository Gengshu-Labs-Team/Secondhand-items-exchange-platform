// 使用 SQLite 作为数据库（无需安装 MySQL）
const { pool, testConnection, hashPassword, verifyPassword } = require('./sqlite');

module.exports = {
  pool,
  testConnection,
  hashPassword,
  verifyPassword
};
