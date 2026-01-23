# 阿里云服务器部署指南

## 一、服务器准备

### 1. 购买阿里云 ECS 服务器
- 推荐配置：2核4G（学生机 1核2G 也可以）
- 操作系统：**Ubuntu 22.04**（推荐）或 Ubuntu 20.04
- 开放端口：22(SSH)、80(HTTP)、443(HTTPS)

### 2. 安全组配置
在阿里云控制台 -> 云服务器 ECS -> 安全组，添加以下入方向规则：
- 端口 22：允许 0.0.0.0/0（SSH）
- 端口 80：允许 0.0.0.0/0（HTTP）
- 端口 443：允许 0.0.0.0/0（HTTPS，可选）

---

## 二、快速部署（推荐）

### 步骤 1：连接服务器
```bash
ssh root@你的服务器IP
```

### 步骤 2：上传项目文件

**方法 A：使用 Git（推荐）**
```bash
# 安装 Git
apt update && apt install -y git

# 克隆项目
mkdir -p /var/www
cd /var/www
git clone https://github.com/你的用户名/Secondhand-items-exchange-platform.git campus-trade
```

**方法 B：使用 SCP 上传**
```powershell
# 在本地 PowerShell 中执行
cd E:\HUST\Secondhand-items-exchange-platform
scp -r * root@服务器IP:/var/www/campus-trade/
```

### 步骤 3：运行部署脚本
```bash
cd /var/www/campus-trade/deploy
chmod +x deploy.sh
sudo bash deploy.sh
```

### 步骤 4：访问网站
部署完成后，在浏览器访问：`http://你的服务器IP`

---

## 三、更新代码

修改代码后，重新部署：

### 方法 A：使用更新脚本（推荐）
```bash
cd /var/www/campus-trade/deploy
sudo bash update.sh
```

### 方法 B：手动更新
```bash
cd /var/www/campus-trade

# 如果使用 Git
git pull

# 更新后端
cd server && npm install
pm2 restart campus-api

# 更新前端
cd ../client && npm install && npm run build
cp -r dist/* /var/www/html/
```

---

## 四、数据安全

### 📁 数据存储位置
```
/var/www/campus-trade/persistent-data/
├── database/       # SQLite 数据库
│   └── campus.db
└── uploads/        # 用户上传的图片
    ├── 2026-01-22/
    └── 2026-01-23/
```

⚠️ **重要**：更新代码时，`persistent-data` 目录中的数据会自动保留！

### 备份数据
```bash
# 创建备份
cd /var/www/campus-trade
tar -czf backup_$(date +%Y%m%d).tar.gz persistent-data/

# 下载到本地（在本地执行）
scp root@服务器IP:/var/www/campus-trade/backup_*.tar.gz ./
```

---

## 五、常用命令

```bash
# 查看后端日志
pm2 logs campus-api

# 重启后端服务
pm2 restart campus-api

# 查看服务状态
pm2 status

# 重启 Nginx
systemctl restart nginx

# 查看 Nginx 日志
tail -f /var/log/nginx/error.log
```

---

## 六、故障排查

### 问题 1：网站无法访问
```bash
# 检查后端是否运行
pm2 status

# 检查 Nginx 是否运行
systemctl status nginx

# 检查端口是否监听
netstat -tlnp | grep -E '80|3001'
```

### 问题 2：图片无法显示
```bash
# 检查上传目录权限
ls -la /var/www/campus-trade/persistent-data/uploads/

# 修复权限
chmod -R 755 /var/www/campus-trade/persistent-data/
```

### 问题 3：API 请求失败
```bash
# 查看后端日志
pm2 logs campus-api --lines 50

# 测试 API
curl http://localhost:3001/api/health
```

---

## 七、域名配置（可选）

1. 购买域名并完成 ICP 备案
2. 在阿里云 DNS 解析中添加 A 记录指向服务器 IP
3. 修改 Nginx 配置中的 `server_name`
4. 申请免费 SSL 证书配置 HTTPS（可选）
