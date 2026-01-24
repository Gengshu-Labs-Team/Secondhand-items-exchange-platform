#!/bin/bash

# 校园二手交易平台 - 一键部署脚本
# 使用方法: bash deploy.sh

set -e

echo "=========================================="
echo "  校园二手交易平台 - 自动部署脚本"
echo "=========================================="

# 配置变量
PROJECT_DIR="/var/www/campus-trade"
NGINX_CONF="/etc/nginx/sites-available/default"
DATA_DIR="$PROJECT_DIR/persistent-data"

# 颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_step() {
    echo -e "${GREEN}[步骤]${NC} $1"
}

print_warn() {
    echo -e "${YELLOW}[提示]${NC} $1"
}

print_error() {
    echo -e "${RED}[错误]${NC} $1"
}

# 检查是否为 root 用户
if [ "$EUID" -ne 0 ]; then
    echo "请使用 root 用户运行此脚本"
    echo "使用: sudo bash deploy.sh"
    exit 1
fi

# 1. 更新系统
print_step "更新系统包..."
apt update -y

# 2. 安装 Node.js
if ! command -v node &> /dev/null; then
    print_step "安装 Node.js 18.x..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt install -y nodejs
else
    print_warn "Node.js 已安装: $(node -v)"
fi

# 3. 安装 PM2
if ! command -v pm2 &> /dev/null; then
    print_step "安装 PM2..."
    npm install -g pm2
else
    print_warn "PM2 已安装"
fi

# 4. 安装 Nginx
if ! command -v nginx &> /dev/null; then
    print_step "安装 Nginx..."
    apt install -y nginx
    systemctl enable nginx
else
    print_warn "Nginx 已安装"
fi

# 5. 创建项目目录
print_step "创建项目目录..."
mkdir -p $PROJECT_DIR
mkdir -p /var/log/pm2

# 6. 检查项目文件
if [ ! -f "$PROJECT_DIR/server/app.js" ]; then
    echo ""
    print_warn "项目文件未找到！请先上传项目文件到 $PROJECT_DIR"
    echo ""
    echo "上传方法（在本地电脑 PowerShell 中执行）："
    echo "  scp -r ./* root@服务器IP:$PROJECT_DIR/"
    echo ""
    echo "或使用 Git 克隆："
    echo "  cd $PROJECT_DIR && git clone <仓库地址> ."
    echo ""
    exit 1
fi

# 7. 创建数据持久化目录（重要：保护用户数据）
print_step "设置数据持久化目录..."
mkdir -p $DATA_DIR/database
mkdir -p $DATA_DIR/uploads

# 如果 server/data 和 server/uploads 已有数据，迁移到持久化目录
if [ -d "$PROJECT_DIR/server/data" ] && [ "$(ls -A $PROJECT_DIR/server/data 2>/dev/null)" ]; then
    print_warn "检测到现有数据库，迁移中..."
    cp -rn $PROJECT_DIR/server/data/* $DATA_DIR/database/ 2>/dev/null || true
fi

if [ -d "$PROJECT_DIR/server/uploads" ] && [ "$(ls -A $PROJECT_DIR/server/uploads 2>/dev/null)" ]; then
    print_warn "检测到现有上传文件，迁移中..."
    cp -rn $PROJECT_DIR/server/uploads/* $DATA_DIR/uploads/ 2>/dev/null || true
fi

# 创建软链接，让应用使用持久化目录
rm -rf $PROJECT_DIR/server/data
rm -rf $PROJECT_DIR/server/uploads
ln -sf $DATA_DIR/database $PROJECT_DIR/server/data
ln -sf $DATA_DIR/uploads $PROJECT_DIR/server/uploads

chmod -R 755 $DATA_DIR

# 8. 安装后端依赖
print_step "安装后端依赖..."
cd $PROJECT_DIR/server
npm install --production

# 9. 启动后端服务
print_step "启动后端服务..."
pm2 delete campus-api 2>/dev/null || true
pm2 start app.js --name "campus-api" --env production
pm2 save

# 10. 构建前端
print_step "构建前端..."
cd $PROJECT_DIR/client
npm install
npm run build

# 11. 部署前端文件
print_step "部署前端静态文件..."
mkdir -p /var/www/html
rm -rf /var/www/html/*
cp -r dist/* /var/www/html/

# 12. 配置 Nginx
print_step "配置 Nginx..."
if [ -f "$PROJECT_DIR/deploy/nginx.conf" ]; then
    cp $PROJECT_DIR/deploy/nginx.conf $NGINX_CONF
else
    print_warn "未找到 nginx.conf，使用默认配置"
fi

# 13. 测试并重载 Nginx
nginx -t
systemctl reload nginx

# 14. 设置 PM2 开机自启
pm2 startup systemd -u root --hp /root
pm2 save

# 15. 设置防火墙（如果有）
if command -v ufw &> /dev/null; then
    print_step "配置防火墙..."
    ufw allow 80/tcp
    ufw allow 443/tcp
    ufw allow 22/tcp
fi

echo ""
echo "=========================================="
echo -e "${GREEN}  部署完成！${NC}"
echo "=========================================="
echo ""
echo "访问地址: http://$(curl -s ifconfig.me 2>/dev/null || echo '你的服务器IP')"
echo ""
echo "📁 数据存储位置（重要，请勿删除）:"
echo "   数据库: $DATA_DIR/database/"
echo "   图片:   $DATA_DIR/uploads/"
echo ""
echo "🔧 常用命令："
echo "   pm2 logs campus-api     # 查看日志"
echo "   pm2 restart campus-api  # 重启服务"
echo "   pm2 status              # 查看状态"
echo ""
echo "🔄 更新代码后重新部署："
echo "   cd $PROJECT_DIR && git pull"
echo "   cd server && npm install"
echo "   pm2 restart campus-api"
echo "   cd ../client && npm install && npm run build"
echo "   cp -r dist/* /var/www/html/"
echo ""
