#!/bin/bash

# ============================================
# 校园二手交易平台 - 数据管理脚本
# ============================================

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 数据目录
DATA_DIR="./persistent-data"
BACKUP_DIR="./backups"

# 显示帮助
show_help() {
    echo -e "${BLUE}==========================================${NC}"
    echo -e "${BLUE}  校园二手交易平台 - 数据管理工具${NC}"
    echo -e "${BLUE}==========================================${NC}"
    echo ""
    echo "用法: ./data-manager.sh [命令]"
    echo ""
    echo "命令:"
    echo "  backup      备份数据库和上传文件"
    echo "  restore     从备份恢复数据"
    echo "  deploy      部署/更新应用（保留数据）"
    echo "  status      查看数据状态"
    echo "  help        显示此帮助信息"
    echo ""
}

# 初始化数据目录
init_data_dir() {
    echo -e "${YELLOW}📁 初始化数据目录...${NC}"
    mkdir -p "$DATA_DIR/database"
    mkdir -p "$DATA_DIR/uploads"
    mkdir -p "$BACKUP_DIR"
    echo -e "${GREEN}✅ 数据目录已创建${NC}"
}

# 备份数据
backup_data() {
    init_data_dir
    
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    BACKUP_NAME="backup_$TIMESTAMP"
    BACKUP_PATH="$BACKUP_DIR/$BACKUP_NAME"
    
    echo -e "${YELLOW}📦 开始备份数据...${NC}"
    
    mkdir -p "$BACKUP_PATH"
    
    # 备份数据库
    if [ -f "$DATA_DIR/database/campus.db" ]; then
        cp "$DATA_DIR/database/campus.db" "$BACKUP_PATH/"
        echo -e "${GREEN}✅ 数据库已备份${NC}"
    else
        echo -e "${YELLOW}⚠️  数据库文件不存在，跳过${NC}"
    fi
    
    # 备份上传文件
    if [ -d "$DATA_DIR/uploads" ] && [ "$(ls -A $DATA_DIR/uploads 2>/dev/null)" ]; then
        cp -r "$DATA_DIR/uploads" "$BACKUP_PATH/"
        echo -e "${GREEN}✅ 上传文件已备份${NC}"
    else
        echo -e "${YELLOW}⚠️  上传目录为空，跳过${NC}"
    fi
    
    # 压缩备份
    cd "$BACKUP_DIR"
    tar -czf "$BACKUP_NAME.tar.gz" "$BACKUP_NAME"
    rm -rf "$BACKUP_NAME"
    cd ..
    
    echo -e "${GREEN}✅ 备份完成: $BACKUP_DIR/$BACKUP_NAME.tar.gz${NC}"
}

# 恢复数据
restore_data() {
    echo -e "${YELLOW}📋 可用的备份文件:${NC}"
    ls -la "$BACKUP_DIR"/*.tar.gz 2>/dev/null
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ 没有找到备份文件${NC}"
        return 1
    fi
    
    echo ""
    read -p "请输入要恢复的备份文件名 (不含路径): " BACKUP_FILE
    
    if [ ! -f "$BACKUP_DIR/$BACKUP_FILE" ]; then
        echo -e "${RED}❌ 备份文件不存在${NC}"
        return 1
    fi
    
    echo -e "${YELLOW}⚠️  警告: 恢复操作将覆盖当前数据!${NC}"
    read -p "确定要继续吗? (y/n): " CONFIRM
    
    if [ "$CONFIRM" != "y" ]; then
        echo -e "${YELLOW}已取消${NC}"
        return 0
    fi
    
    # 解压备份
    TEMP_DIR=$(mktemp -d)
    tar -xzf "$BACKUP_DIR/$BACKUP_FILE" -C "$TEMP_DIR"
    BACKUP_NAME=$(ls "$TEMP_DIR")
    
    # 恢复数据库
    if [ -f "$TEMP_DIR/$BACKUP_NAME/campus.db" ]; then
        cp "$TEMP_DIR/$BACKUP_NAME/campus.db" "$DATA_DIR/database/"
        echo -e "${GREEN}✅ 数据库已恢复${NC}"
    fi
    
    # 恢复上传文件
    if [ -d "$TEMP_DIR/$BACKUP_NAME/uploads" ]; then
        cp -r "$TEMP_DIR/$BACKUP_NAME/uploads"/* "$DATA_DIR/uploads/" 2>/dev/null
        echo -e "${GREEN}✅ 上传文件已恢复${NC}"
    fi
    
    rm -rf "$TEMP_DIR"
    echo -e "${GREEN}✅ 数据恢复完成${NC}"
}

# 部署/更新应用
deploy_app() {
    init_data_dir
    
    echo -e "${YELLOW}🚀 开始部署应用...${NC}"
    
    # 询问是否需要备份
    read -p "部署前是否备份当前数据? (y/n): " BACKUP_FIRST
    if [ "$BACKUP_FIRST" == "y" ]; then
        backup_data
    fi
    
    # 重新构建并启动容器
    echo -e "${YELLOW}📦 重新构建容器...${NC}"
    docker-compose down
    docker-compose build --no-cache
    docker-compose up -d
    
    echo -e "${GREEN}✅ 部署完成!${NC}"
    echo -e "${BLUE}前端访问: http://localhost:3000${NC}"
    echo -e "${BLUE}后端API: http://localhost:3001/api${NC}"
}

# 查看数据状态
check_status() {
    echo -e "${BLUE}==========================================${NC}"
    echo -e "${BLUE}  数据状态${NC}"
    echo -e "${BLUE}==========================================${NC}"
    
    # 检查数据库
    if [ -f "$DATA_DIR/database/campus.db" ]; then
        DB_SIZE=$(du -h "$DATA_DIR/database/campus.db" | cut -f1)
        echo -e "${GREEN}✅ 数据库: 存在 ($DB_SIZE)${NC}"
    else
        echo -e "${YELLOW}⚠️  数据库: 不存在${NC}"
    fi
    
    # 检查上传目录
    if [ -d "$DATA_DIR/uploads" ]; then
        UPLOAD_COUNT=$(find "$DATA_DIR/uploads" -type f | wc -l)
        UPLOAD_SIZE=$(du -sh "$DATA_DIR/uploads" 2>/dev/null | cut -f1)
        echo -e "${GREEN}✅ 上传文件: $UPLOAD_COUNT 个文件 ($UPLOAD_SIZE)${NC}"
    else
        echo -e "${YELLOW}⚠️  上传目录: 不存在${NC}"
    fi
    
    # 检查备份
    if [ -d "$BACKUP_DIR" ]; then
        BACKUP_COUNT=$(ls "$BACKUP_DIR"/*.tar.gz 2>/dev/null | wc -l)
        echo -e "${GREEN}✅ 备份文件: $BACKUP_COUNT 个${NC}"
    else
        echo -e "${YELLOW}⚠️  备份目录: 不存在${NC}"
    fi
    
    echo ""
    echo -e "${BLUE}容器状态:${NC}"
    docker-compose ps
}

# 主逻辑
case "$1" in
    backup)
        backup_data
        ;;
    restore)
        restore_data
        ;;
    deploy)
        deploy_app
        ;;
    status)
        check_status
        ;;
    help|--help|-h|"")
        show_help
        ;;
    *)
        echo -e "${RED}未知命令: $1${NC}"
        show_help
        exit 1
        ;;
esac
