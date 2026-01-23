# 📦 数据持久化部署指南

本文档说明如何在修改网站代码后重新部署，同时**保留数据库和上传的图片**。

---

## 🏗️ 项目数据结构

```
项目根目录/
├── persistent-data/          # 🔒 持久化数据（不会被重新部署覆盖）
│   ├── database/
│   │   └── campus.db         # SQLite 数据库文件
│   └── uploads/              # 用户上传的图片
│       ├── 2026-01-22/
│       └── 2026-01-23/
├── backups/                  # 📁 备份文件夹
│   └── backup_20260123_*.tar.gz
├── docker-compose.yml
├── data-manager.sh           # Linux/Mac 数据管理脚本
└── data-manager.bat          # Windows 数据管理脚本
```

---

## 🚀 部署方式

### 方式一：Docker 部署（推荐）

#### 首次部署
```bash
# 1. 初始化数据目录
mkdir -p persistent-data/database persistent-data/uploads

# 2. 构建并启动
docker-compose up -d --build

# 3. 查看状态
docker-compose ps
```

#### 更新代码后重新部署
```bash
# 数据会自动保留！只需重新构建
docker-compose down
docker-compose up -d --build
```

**原理**：`docker-compose.yml` 将数据目录挂载到容器外部的 `persistent-data/` 文件夹，即使容器被删除重建，数据也会保留。

---

### 方式二：直接部署（不用 Docker）

#### 首次部署
```bash
# 后端
cd server
npm install
npm start

# 前端（另一个终端）
cd client
npm install
npm run build
```

#### 更新代码后重新部署
```bash
# 1. 停止服务（如果使用 PM2）
pm2 stop campus-api

# 2. 更新代码
git pull  # 或手动覆盖文件

# 3. 重新安装依赖（如果 package.json 有变化）
cd server && npm install
cd ../client && npm install && npm run build

# 4. 重启服务
pm2 restart campus-api
```

**数据位置**：
- 数据库：`server/data/campus.db`
- 图片：`server/uploads/`

⚠️ **注意**：更新代码时，不要删除 `server/data/` 和 `server/uploads/` 目录！

---

## 📋 数据管理脚本使用

### Windows
```cmd
# 查看帮助
data-manager.bat help

# 备份数据
data-manager.bat backup

# 恢复数据
data-manager.bat restore

# 部署（自动询问是否备份）
data-manager.bat deploy

# 查看数据状态
data-manager.bat status
```

### Linux/Mac
```bash
# 添加执行权限
chmod +x data-manager.sh

# 查看帮助
./data-manager.sh help

# 备份数据
./data-manager.sh backup

# 恢复数据
./data-manager.sh restore

# 部署
./data-manager.sh deploy

# 查看状态
./data-manager.sh status
```

---

## 🔄 常见场景

### 场景 1：修改了前端页面，需要更新

```bash
# Docker 方式
docker-compose down
docker-compose up -d --build

# 直接部署方式
cd client && npm run build
# 如果使用 Nginx，重启 Nginx
sudo systemctl restart nginx
```

✅ 数据库和图片不受影响

### 场景 2：修改了后端代码

```bash
# Docker 方式
docker-compose down
docker-compose up -d --build

# 直接部署方式
pm2 restart campus-api
```

✅ 数据库和图片不受影响

### 场景 3：需要迁移到新服务器

```bash
# 1. 在旧服务器备份
./data-manager.sh backup
# 会生成 backups/backup_xxx.tar.gz

# 2. 复制备份文件到新服务器
scp backups/backup_xxx.tar.gz user@new-server:/path/to/project/backups/

# 3. 在新服务器恢复
./data-manager.sh restore
# 输入备份文件名

# 4. 启动服务
docker-compose up -d
```

### 场景 4：定期自动备份（Linux）

```bash
# 编辑 crontab
crontab -e

# 每天凌晨 3 点自动备份
0 3 * * * cd /path/to/project && ./data-manager.sh backup
```

---

## ⚠️ 重要提醒

1. **永远不要删除** `persistent-data/` 目录
2. **定期备份** - 建议每周至少备份一次
3. **测试恢复** - 定期测试备份文件是否可以正常恢复
4. **版本控制** - 将 `persistent-data/` 和 `backups/` 添加到 `.gitignore`

---

## 🆘 故障恢复

如果不小心删除了数据：

1. 检查是否有备份文件
   ```bash
   ls backups/
   ```

2. 恢复备份
   ```bash
   ./data-manager.sh restore
   ```

3. 如果没有备份，检查服务器回收站或联系云服务商
