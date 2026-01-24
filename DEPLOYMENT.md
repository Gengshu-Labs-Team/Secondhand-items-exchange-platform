# 部署指南 - 校园二手交易平台

## 服务器信息
- 服务器IP: 8.148.23.160
- 操作系统: Linux
- 内容审核: 腾讯云内容安全服务

## 部署步骤

### 1. 连接到服务器
```bash
ssh root@8.148.23.160
```

### 2. 安装必要的软件
```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 安装MySQL
sudo apt install mysql-server -y

# 安装nginx
sudo apt install nginx -y

# 安装PM2（进程管理）
sudo npm install -g pm2
```

### 3. 配置MySQL数据库
```bash
# 登录MySQL
sudo mysql

# 创建数据库
CREATE DATABASE campus_secondhand CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# 创建用户（请修改密码）
CREATE USER 'secondhand'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON campus_secondhand.* TO 'secondhand'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 4. 上传代码到服务器
```bash
# 在本地执行，打包代码
tar -czf secondhand.tar.gz --exclude='node_modules' --exclude='.git' .

# 上传到服务器
scp secondhand.tar.gz root@8.148.23.160:/var/www/

# 在服务器上解压
ssh root@8.148.23.160
cd /var/www
tar -xzf secondhand.tar.gz -C secondhand/
cd secondhand
```

### 5. 配置后端
```bash
cd /var/www/secondhand/server

# 安装依赖
npm install

# 复制生产环境配置
cp .env.production .env

# 编辑配置文件，修改数据库密码
nano .env
# 修改以下配置：
# DB_USER=secondhand
# DB_PASSWORD=your_secure_password
# JWT_SECRET=生成一个随机的密钥

# 初始化数据库（执行SQL文件）
mysql -u secondhand -p campus_secondhand < init.sql
```

### 6. 配置前端
```bash
cd /var/www/secondhand/client

# 安装依赖
npm install

# 修改API地址
nano src/utils/api.js
# 将 baseURL 改为: http://8.148.23.160:3001/api

# 构建前端
npm run build
```

### 7. 配置Nginx
```bash
sudo nano /etc/nginx/sites-available/secondhand
```