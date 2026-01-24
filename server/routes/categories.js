const express = require('express');
const router = express.Router();

// 商品分类（静态数据，可后续改为数据库存储）
const categories = [
  { id: 0, name: '全部', icon: 'apps-o' },
  { id: 1, name: '教材书籍', icon: 'bookmark-o' },
  { id: 2, name: '数码电子', icon: 'phone-o' },
  { id: 3, name: '生活用品', icon: 'home-o' },
  { id: 4, name: '服饰鞋包', icon: 'bag-o' },
  { id: 5, name: '运动户外', icon: 'fire-o' },
  { id: 6, name: '其他', icon: 'more-o' }
];

// 获取分类列表
router.get('/', (req, res) => {
  res.json({
    success: true,
    data: categories
  });
});

// 根据ID获取分类
router.get('/:id', (req, res) => {
  const { id } = req.params;
  const category = categories.find(c => c.id === parseInt(id));
  
  if (!category) {
    return res.status(404).json({ success: false, message: '分类不存在' });
  }
  
  res.json({ success: true, data: category });
});

module.exports = router;
