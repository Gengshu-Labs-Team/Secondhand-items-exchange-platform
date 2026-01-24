# 校园二手交易平台 (MVP)

> 提供一个"信息持久化"的展示空间，解决校园二手物品交易中信息流失快、无法检索的痛点。

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | Vue 3 + Vant 4 + Vite |
| 后端 | Node.js + Express |
| 数据库 | MySQL 8.0 |
| 部署 | Docker + Docker Compose |

## 快速开始

### 方式一：Docker 一键部署（推荐）

```bash
# 启动所有服务
docker-compose up -d

# 访问
# 前端: http://localhost:3000
# 后端API: http://localhost:3001
```

### 方式二：本地开发

```bash
# 1. 安装所有依赖
npm run install:all

# 2. 配置数据库
# 修改 server/.env 中的数据库连接信息
# 执行 database/init.sql 初始化数据库

# 3. 启动后端服务
npm run dev:server

# 4. 启动前端服务（新终端）
npm run dev:client
```

## 项目结构

```
├── client/                 # 前端 Vue 项目
│   ├── src/
│   │   ├── views/         # 页面组件
│   │   ├── api/           # API 接口
│   │   ├── utils/         # 工具函数
│   │   └── router/        # 路由配置
│   └── ...
├── server/                 # 后端 Express 项目
│   ├── routes/            # API 路由
│   ├── config/            # 配置文件
│   └── uploads/           # 图片存储
├── database/              # 数据库脚本
│   └── init.sql           # 初始化 SQL
├── docker-compose.yml     # Docker 编排
└── README.md
```

## 功能特性

- ✅ 商品列表（分类筛选、瀑布流展示）
- ✅ 商品发布（多图上传、前端压缩）
- ✅ 商品详情（图片轮播、联系卖家）
- ✅ 商品删除（管理密码验证）

## API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/items | 获取商品列表 |
| GET | /api/items/:id | 获取商品详情 |
| POST | /api/items | 发布商品 |
| DELETE | /api/items/:id | 删除商品 |
| POST | /api/upload | 上传图片 |
| GET | /api/categories | 获取分类列表 |
