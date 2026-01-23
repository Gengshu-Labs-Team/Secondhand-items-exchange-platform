const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

// 数据库文件路径
const dbPath = path.join(__dirname, '..', 'data', 'campus.db');

// 确保 data 目录存在
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// 创建数据库连接
const db = new Database(dbPath);

// 启用外键约束
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// bcrypt 加密轮数（越高越安全但越慢，10-12是推荐值）
const BCRYPT_ROUNDS = 10;

// 密码加密函数（使用 bcrypt）
function hashPassword(password) {
  return bcrypt.hashSync(password, BCRYPT_ROUNDS);
}

// 密码验证函数
function verifyPassword(password, hashedPassword) {
  // 兼容旧的 SHA256 密码（用于迁移）
  if (hashedPassword.length === 64) {
    // 旧的 SHA256 格式
    const crypto = require('crypto');
    const oldHash = crypto.createHash('sha256').update(password + 'campus_salt_2024').digest('hex');
    return oldHash === hashedPassword;
  }
  // 新的 bcrypt 格式
  return bcrypt.compareSync(password, hashedPassword);
}

// 初始化数据库表
function initDatabase() {
  // 创建用户表
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username VARCHAR(50) NOT NULL UNIQUE,
      password VARCHAR(64) NOT NULL,
      dorm_location VARCHAR(100) DEFAULT '',
      contact_info VARCHAR(100) DEFAULT '',
      role VARCHAR(20) DEFAULT 'user',
      status INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 创建商品表
  db.exec(`
    CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title VARCHAR(50) NOT NULL,
      price DECIMAL(10,2) NOT NULL,
      category_id INTEGER NOT NULL,
      description TEXT,
      contact_info VARCHAR(100) NOT NULL,
      admin_password VARCHAR(20) DEFAULT '',
      image_urls TEXT NOT NULL,
      condition VARCHAR(20) DEFAULT '',
      dormitory VARCHAR(50) DEFAULT '',
      views INTEGER DEFAULT 0,
      status INTEGER DEFAULT 1,
      user_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // 检查并添加新字段（兼容已有数据库）
  try {
    db.exec(`ALTER TABLE items ADD COLUMN dormitory VARCHAR(50) DEFAULT ''`);
    console.log('✅ 添加 dormitory 字段');
  } catch (e) {
    // 字段已存在，忽略错误
  }
  
  try {
    db.exec(`ALTER TABLE items ADD COLUMN views INTEGER DEFAULT 0`);
    console.log('✅ 添加 views 字段');
  } catch (e) {
    // 字段已存在，忽略错误
  }

  try {
    db.exec(`ALTER TABLE items ADD COLUMN user_id INTEGER`);
    console.log('✅ 添加 user_id 字段');
  } catch (e) {
    // 字段已存在，忽略错误
  }

  // 创建分类表
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name VARCHAR(20) NOT NULL,
      icon VARCHAR(50) DEFAULT '',
      sort_order INTEGER DEFAULT 0,
      status INTEGER DEFAULT 1
    )
  `);

  // 检查是否有分类数据
  const count = db.prepare('SELECT COUNT(*) as count FROM categories').get();
  if (count.count === 0) {
    // 插入初始分类
    const insertCategory = db.prepare('INSERT INTO categories (id, name, icon, sort_order) VALUES (?, ?, ?, ?)');
    insertCategory.run(1, '教材书籍', 'bookmark-o', 1);
    insertCategory.run(2, '数码电子', 'phone-o', 2);
    insertCategory.run(3, '生活用品', 'home-o', 3);
    insertCategory.run(4, '服饰鞋包', 'bag-o', 4);
    insertCategory.run(5, '运动户外', 'fire-o', 5);
    insertCategory.run(6, '其他', 'more-o', 6);
    console.log('✅ 分类数据初始化完成');
  }

  // 检查是否有管理员账户
  const adminCount = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'admin'").get();
  if (adminCount.count === 0) {
    // 创建默认管理员账户
    const insertUser = db.prepare('INSERT INTO users (username, password, dorm_location, contact_info, role) VALUES (?, ?, ?, ?, ?)');
    insertUser.run('admin', hashPassword('admin123'), '管理员', '系统管理员', 'admin');
    console.log('✅ 默认管理员账户已创建 (用户名: admin, 密码: admin123)');
  }

  // 检查是否有测试商品
  const itemCount = db.prepare('SELECT COUNT(*) as count FROM items').get();
  if (itemCount.count === 0) {
    // 插入测试数据
    const insertItem = db.prepare(`
      INSERT INTO items (title, price, category_id, description, contact_info, admin_password, image_urls, condition, dormitory, views)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    insertItem.run('高等数学同济第七版上下册', 35.00, 1, '九成新，无笔记无划痕，考研必备教材。上下两册打包出售。', 'wx_math2024', '123456', '["https://picsum.photos/400/400?random=1"]', '九成新', '沁苑学生公寓东13舍703', 128);
    insertItem.run('小米充电宝20000mAh', 89.00, 2, '用了半年，功能完好，22.5W快充。换新款了，这个便宜出。', 'qq_12345678', '1234', '["https://picsum.photos/400/400?random=2"]', '八成新', '韵苑学生公寓9栋201', 56);
    insertItem.run('宿舍小风扇USB款', 25.00, 3, '毕业清仓，风力够用，三档调节，静音效果好。', 'wx_fan_sale', '2024', '["https://picsum.photos/400/400?random=3"]', '八成新', '紫菘学生公寓3栋512', 89);
    insertItem.run('耐克运动鞋42码', 150.00, 4, '穿了几次，码数买大了，基本全新。原价599。', 'wx_nike42', '666666', '["https://picsum.photos/400/400?random=4"]', '全新', '沁苑学生公寓西8舍302', 234);
    insertItem.run('羽毛球拍尤尼克斯', 200.00, 5, '正品尤尼克斯，手感很好，送三个羽毛球。', 'qq_badminton', '8888', '["https://picsum.photos/400/400?random=5"]', '九成新', '韵苑学生公寓12栋608', 67);
    insertItem.run('线性代数教材', 20.00, 1, '大一用的教材，有少量笔记，不影响使用。', 'wx_linear', '1111', '["https://picsum.photos/400/400?random=6"]', '明显使用', '紫菘学生公寓1栋101', 45);
    
    console.log('✅ 测试商品数据初始化完成');
  }

  console.log('✅ SQLite 数据库初始化完成');
}

// 封装成类似 mysql2/promise 的接口
const pool = {
  execute: async (sql, params = []) => {
    try {
      // 判断是查询还是修改
      const isSelect = sql.trim().toUpperCase().startsWith('SELECT');
      
      if (isSelect) {
        const stmt = db.prepare(sql);
        const rows = stmt.all(...params);
        return [rows];
      } else {
        const stmt = db.prepare(sql);
        const result = stmt.run(...params);
        return [{ insertId: result.lastInsertRowid, affectedRows: result.changes }];
      }
    } catch (error) {
      console.error('SQL 执行错误:', error);
      throw error;
    }
  }
};

// 测试连接
async function testConnection() {
  try {
    initDatabase();
    console.log('✅ SQLite 数据库连接成功');
    return true;
  } catch (error) {
    console.error('❌ SQLite 数据库连接失败:', error.message);
    return false;
  }
}

module.exports = {
  db,
  pool,
  testConnection,
  hashPassword,
  verifyPassword
};
