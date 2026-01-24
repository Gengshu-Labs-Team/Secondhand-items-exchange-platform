#!/bin/bash

# 校园二手交易平台 - 快速更新脚本
# 用于修改代码后快速重新部署（不影响数据）
# 使用方法: bash update.sh

set -e

PROJECT_DIR="/var/www/campus-trade"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "=========================================="
echo "  校园二手交易平台 - 快速更新"
echo "=========================================="

# 检查是否为 root
if [ "$EUID" -ne 0 ]; then
    echo "请使用 root 用户运行: sudo bash update.sh"
    exit 1
fi

# 检查项目目录
if [ ! -d "$PROJECT_DIR" ]; then
    echo "项目目录不存在，请先运行 deploy.sh"
    exit 1
fi

cd $PROJECT_DIR

# 询问更新类型
echo ""
echo "请选择更新类型："
echo "  1) 仅更新后端"
echo "  2) 仅更新前端"
echo "  3) 全部更新"
echo "  4) 仅重启服务"
echo ""
read -p "请输入选项 [1-4]: " choice

case $choice in
    1)
        echo -e "${YELLOW}[更新后端]${NC}"
        cd server
        npm install --production
        pm2 restart campus-api
        echo -e "${GREEN}✅ 后端更新完成${NC}"
        ;;
    2)
        echo -e "${YELLOW}[更新前端]${NC}"
        cd client
        rm -rf node_modules
        npm install
        npm run build
        rm -rf /var/www/html/*
        cp -r dist/* /var/www/html/
        echo -e "${GREEN}✅ 前端更新完成${NC}"
        ;;
    3)
        echo -e "${YELLOW}[更新后端]${NC}"
        cd server
        npm install --production
        pm2 restart campus-api
        
        echo -e "${YELLOW}[更新前端]${NC}"
        cd ../client
        rm -rf node_modules
        npm install
        npm run build
        rm -rf /var/www/html/*
        cp -r dist/* /var/www/html/
        echo -e "${GREEN}✅ 全部更新完成${NC}"
        ;;
    4)
        pm2 restart campus-api
        systemctl reload nginx
        echo -e "${GREEN}✅ 服务已重启${NC}"
        ;;
    *)
        echo "无效选项"
        exit 1
        ;;
esac

echo ""
echo "当前状态："
pm2 status
