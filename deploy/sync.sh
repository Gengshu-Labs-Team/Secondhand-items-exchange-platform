#!/bin/bash

# 校园二手交易平台 - 代码同步脚本
# 用于安全地将本地代码同步到服务器（不覆盖数据库和上传文件）
# 使用方法: bash sync.sh [服务器IP] [用户名]

set -e

# 配置
SERVER_IP="${1:-}"
SERVER_USER="${2:-root}"
REMOTE_DIR="/var/www/campus-trade"

# 颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

if [ -z "$SERVER_IP" ]; then
    echo -e "${RED}[错误]${NC} 请提供服务器 IP 地址"
    echo ""
    echo "使用方法："
    echo "  bash sync.sh <服务器IP> [用户名]"
    echo ""
    echo "示例："
    echo "  bash sync.sh 192.168.1.100"
    echo "  bash sync.sh 192.168.1.100 ubuntu"
    exit 1
fi

echo "=========================================="
echo "  校园二手交易平台 - 代码同步"
echo "=========================================="
echo ""
echo "目标服务器: $SERVER_USER@$SERVER_IP"
echo "远程目录:   $REMOTE_DIR"
echo ""

# 切换到项目根目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_DIR"

echo -e "${YELLOW}[同步中]${NC} 正在同步代码文件..."
echo ""

# 使用 rsync 同步代码，排除数据库和上传目录
rsync -avz --progress \
    --exclude 'node_modules/' \
    --exclude 'client/node_modules/' \
    --exclude 'server/node_modules/' \
    --exclude 'server/data/' \
    --exclude 'server/uploads/' \
    --exclude 'persistent-data/' \
    --exclude 'client/dist/' \
    --exclude '.git/' \
    --exclude '*.db' \
    --exclude '*.db-wal' \
    --exclude '*.db-shm' \
    --exclude '.env' \
    --exclude '.env.local' \
    --exclude '.DS_Store' \
    --exclude 'Thumbs.db' \
    --exclude 'backups/' \
    ./ "$SERVER_USER@$SERVER_IP:$REMOTE_DIR/"

echo ""
echo -e "${GREEN}✅ 代码同步完成！${NC}"
echo ""
echo "下一步操作（在服务器上执行）："
echo "  ssh $SERVER_USER@$SERVER_IP"
echo "  cd $REMOTE_DIR/deploy"
echo "  sudo bash update.sh"
echo ""
echo -e "${YELLOW}提示：${NC}数据库和上传文件未被同步，数据安全保留"
