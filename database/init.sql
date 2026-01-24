-- ========================================
-- 校园二手交易平台 - 数据库初始化脚本
-- ========================================

-- 创建数据库
CREATE DATABASE IF NOT EXISTS `campus_secondhand` 
DEFAULT CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE `campus_secondhand`;

-- ========================================
-- 商品表 (items)
-- ========================================
DROP TABLE IF EXISTS `items`;
CREATE TABLE `items` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '商品ID',
  `title` varchar(50) NOT NULL COMMENT '商品标题',
  `price` decimal(10,2) NOT NULL COMMENT '价格',
  `category_id` int(11) NOT NULL COMMENT '分类ID',
  `description` text COMMENT '商品描述',
  `contact_info` varchar(100) NOT NULL COMMENT '联系方式（微信/QQ）',
  `admin_password` varchar(20) NOT NULL COMMENT '管理密码（4-6位）',
  `image_urls` text NOT NULL COMMENT '图片URL（JSON数组）',
  `condition` varchar(20) DEFAULT '' COMMENT '新旧程度',
  `status` tinyint(4) DEFAULT 1 COMMENT '状态：1-展示中，0-已下架',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_category` (`category_id`),
  KEY `idx_status` (`status`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='商品表';

-- ========================================
-- 分类表 (categories) - 可选，当前使用静态数据
-- ========================================
DROP TABLE IF EXISTS `categories`;
CREATE TABLE `categories` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT '分类ID',
  `name` varchar(20) NOT NULL COMMENT '分类名称',
  `icon` varchar(50) DEFAULT '' COMMENT '图标名称',
  `sort_order` int(11) DEFAULT 0 COMMENT '排序',
  `status` tinyint(4) DEFAULT 1 COMMENT '状态：1-启用，0-禁用',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='分类表';

-- 初始化分类数据
INSERT INTO `categories` (`id`, `name`, `icon`, `sort_order`) VALUES
(1, '教材书籍', 'bookmark-o', 1),
(2, '数码电子', 'phone-o', 2),
(3, '生活用品', 'home-o', 3),
(4, '服饰鞋包', 'bag-o', 4),
(5, '运动户外', 'fire-o', 5),
(6, '其他', 'more-o', 6);

-- ========================================
-- 插入测试数据
-- ========================================
INSERT INTO `items` (`title`, `price`, `category_id`, `description`, `contact_info`, `admin_password`, `image_urls`, `condition`) VALUES
('高等数学同济第七版上下册', 35.00, 1, '九成新，无笔记无划痕，考研必备教材。上下两册打包出售，单买价格另议。', 'wx_math2024', '123456', '["/uploads/demo/math-book.jpg"]', '九成新'),
('小米充电宝20000mAh', 89.00, 2, '用了半年，功能完好，22.5W快充。换新款了，这个便宜出。', 'qq_12345678', '1234', '["/uploads/demo/powerbank.jpg"]', '八成新'),
('宿舍小风扇USB款', 25.00, 3, '毕业清仓，风力够用，三档调节，静音效果好。', 'wx_fan_sale', '2024', '["/uploads/demo/fan.jpg"]', '八成新'),
('耐克运动鞋42码', 150.00, 4, '穿了几次，码数买大了，基本全新。原价599。', 'wx_nike42', '666666', '["/uploads/demo/nike.jpg"]', '九五新'),
('羽毛球拍尤尼克斯', 200.00, 5, '正品尤尼克斯，手感很好，送三个羽毛球。', 'qq_badminton', '8888', '["/uploads/demo/badminton.jpg"]', '九成新');

-- 查看数据
SELECT * FROM items;
SELECT * FROM categories;
