const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const config = require('../config');

// 配置 multer 存储
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '..', config.upload.dir);
    // 按日期分目录存储
    const dateDir = new Date().toISOString().split('T')[0];
    const fullDir = path.join(uploadDir, dateDir);
    
    if (!fs.existsSync(fullDir)) {
      fs.mkdirSync(fullDir, { recursive: true });
    }
    cb(null, fullDir);
  },
  filename: (req, file, cb) => {
    // 生成唯一文件名
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  }
});

// 文件过滤器
const fileFilter = (req, file, cb) => {
  if (config.upload.allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('不支持的文件类型'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.upload.maxFileSize
  }
});

// 单图上传
router.post('/', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: '请选择要上传的图片' });
    }
    
    // 构建图片访问URL
    const dateDir = new Date().toISOString().split('T')[0];
    const imageUrl = `/uploads/${dateDir}/${req.file.filename}`;
    
    res.json({
      success: true,
      data: {
        url: imageUrl,
        filename: req.file.filename,
        size: req.file.size
      }
    });
  } catch (error) {
    console.error('上传图片失败:', error);
    res.status(500).json({ success: false, message: '上传图片失败' });
  }
});

// 多图上传
router.post('/multiple', upload.array('images', 9), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: '请选择要上传的图片' });
    }
    
    const dateDir = new Date().toISOString().split('T')[0];
    const urls = req.files.map(file => `/uploads/${dateDir}/${file.filename}`);
    
    res.json({
      success: true,
      data: {
        urls,
        count: req.files.length
      }
    });
  } catch (error) {
    console.error('上传图片失败:', error);
    res.status(500).json({ success: false, message: '上传图片失败' });
  }
});

// 错误处理
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ success: false, message: '文件大小超过限制（最大5MB）' });
    }
    return res.status(400).json({ success: false, message: error.message });
  }
  res.status(500).json({ success: false, message: error.message });
});

module.exports = router;
