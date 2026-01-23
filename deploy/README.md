# 阿里云服务器部署指南

## 一、服务器准备

### 1. 购买阿里云 ECS 服务器
- 推荐配置：2核4G（学生机 1核2G 也可以）
- 操作系统：Ubuntu 22.04 或 CentOS 7.9
- 开放端口：22(SSH)、80(HTTP)、443(HTTPS)、3001(API)

### 2. 安全组配置
在阿里云控制台 -> 云服务器 ECS -> 安全组，添加以下入方向规则：
- 端口 80：允许 0.0.0.0/0
- 端口 443：允许 0.0.0.0/0
- 端口 3001：允许 0.0.0.0/0（或仅允许特定IP）

---

## 二、服务器环境配置

### 1. 连接服务器
```bash
ssh root@你的服务器IP
```

### 2. 安装 Node.js（Ubuntu）
```bash
# 更新系统
apt update && apt upgrade -y

# 安装 Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt install -y nodejs

# 验证安装
node -v
npm -v
```

### 3. 安装 PM2（进程管理器）
```bash
npm install -g pm2
```

### 4. 安装 Nginx
```bash
apt install -y nginx
systemctl enable nginx
systemctl start nginx
```

---

## 三、上传项目文件

### 方法1：使用 Git
```bash
# 在服务器上
cd /var/www
git clone 你的仓库地址 campus-trade
cd campus-trade
```

### 方法2：使用 SCP 上传
```bash
# 在本地电脑执行（Windows PowerShell）
scp -r E:\HUST\task\* root@你的服务器IP:/var/www/campus-trade/
```

### 方法3：使用 FTP 工具
- 推荐使用 FileZilla 或 WinSCP
- 上传整个项目到 `/var/www/campus-trade/`

---

## 四、后端部署

```bash
# 进入后端目录
cd /var/www/campus-trade/server

# 安装依赖
npm install --production

# 创建数据目录
mkdir -p data uploads

# 使用 PM2 启动
pm2 start app.js --name "campus-api"

# 设置开机自启
pm2 save
pm2 startup
```

---

## 五、前端部署

```bash
# 进入前端目录
cd /var/www/campus-trade/client

# 安装依赖
npm install

# 构建生产版本
npm run build

# 复制到 Nginx 目录
cp -r dist/* /var/www/html/
```

---

## 六、配置 Nginx

```bash
# 编辑 Nginx 配置
nano /etc/nginx/sites-available/default
```

替换为以下内容：
```nginx
server {
    listen 80;
    server_name 你的域名或IP;
    
    # 前端静态文件
    root /var/www/html;
    index index.html;
    
    # 前端路由
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # API 代理
    location /api {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }
    
    # 图片上传目录
    location /uploads {
        proxy_pass http://127.0.0.1:3001;
    }
}
```

```bash
# 测试配置
nginx -t

# 重载 Nginx
systemctl reload nginx
```

---

## 七、常用命令

```bash
# 查看后端日志
pm2 logs campus-api

# 重启后端
pm2 restart campus-api

# 查看运行状态
pm2 status

# 停止服务
pm2 stop campus-api
```

---

## 八、域名配置（可选）

1. 购买域名并完成备案
2. 在阿里云 DNS 解析中添加 A 记录指向服务器 IP
3. 申请免费 SSL 证书（阿里云免费证书）
4. 配置 HTTPS

---

## 常见问题

### Q: 图片上传失败
检查 uploads 目录权限：
```bash
chmod 755 /var/www/campus-trade/server/uploads
```

### Q: 端口被占用
```bash
# 查看端口占用
netstat -tlnp | grep 3001
# 杀掉进程
kill -9 进程ID
```

### Q: 数据库位置
SQLite 数据库文件位于：`/var/www/campus-trade/server/data/campus.db`
