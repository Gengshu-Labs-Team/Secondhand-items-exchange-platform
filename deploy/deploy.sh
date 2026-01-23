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

# 颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_step() {
    echo -e "${GREEN}[步骤]${NC} $1"
}

print_warn() {
    echo -e "${YELLOW}[提示]${NC} $1"
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
    echo "上传方法（在本地电脑执行）："
    echo "  scp -r E:\\HUST\\task\\* root@服务器IP:$PROJECT_DIR/"
    echo ""
    exit 1
fi

# 7. 安装后端依赖
print_step "安装后端依赖..."
cd $PROJECT_DIR/server
npm install --production

# 8. 创建必要目录
mkdir -p data uploads
chmod 755 uploads

# 9. 启动后端服务
print_step "启动后端服务..."
pm2 delete campus-api 2>/dev/null || true
pm2 start app.js --name "campus-api"
pm2 save

# 10. 构建前端
print_step "构建前端..."
cd $PROJECT_DIR/client
npm install
npm run build

# 11. 部署前端文件
print_step "部署前端静态文件..."
rm -rf /var/www/html/*
cp -r dist/* /var/www/html/

# 12. 配置 Nginx
print_step "配置 Nginx..."
if [ -f "$PROJECT_DIR/deploy/nginx.conf" ]; then
    cp $PROJECT_DIR/deploy/nginx.conf $NGINX_CONF
fi

# 13. 测试并重载 Nginx
nginx -t
systemctl reload nginx

# 14. 设置 PM2 开机自启
pm2 startup systemd -u root --hp /root
pm2 save

echo ""
echo "=========================================="
echo -e "${GREEN}  部署完成！${NC}"
echo "=========================================="
echo ""
echo "访问地址: http://$(curl -s ifconfig.me)"
echo ""
echo "常用命令："
echo "  pm2 logs campus-api  # 查看日志"
echo "  pm2 restart campus-api  # 重启服务"
echo "  pm2 status  # 查看状态"
echo ""
