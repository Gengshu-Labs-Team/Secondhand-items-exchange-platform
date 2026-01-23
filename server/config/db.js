// 使用 SQLite 作为数据库（无需安装 MySQL）
const { pool, testConnection } = require('./sqlite');

module.exports = {
  pool,
  testConnection
};
