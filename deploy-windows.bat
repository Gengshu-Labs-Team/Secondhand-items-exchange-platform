@echo off
echo ========================================
echo 二手物品交换平台 - Windows部署脚本
echo ========================================

set PROJECT_PATH=C:\www\campus-market
set SERVER_PATH=%PROJECT_PATH%\server

:CHECK_NODE
echo 检查Node.js环境...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo 错误: 未安装Node.js，请先安装Node.js 16+
    echo 下载地址: https://nodejs.org/
    pause
    exit /b 1
)

echo Node.js版本:
node --version
echo.

:CHECK_DIR
echo 检查项目目录...
if not exist "%PROJECT_PATH%" (
    echo 错误: 项目目录不存在: %PROJECT_PATH%
    echo 请将项目文件上传到该目录
    pause
    exit /b 1
)

if not exist "%SERVER_PATH%\package.json" (
    echo 错误: 未找到后端服务文件
    pause
    exit /b 1
)

:INSTALL_DEPS
echo 安装后端依赖...
cd /d "%SERVER_PATH%"
npm install
if %errorlevel% neq 0 (
    echo 错误: 依赖安装失败
    pause
    exit /b 1
)

echo 依赖安装完成！
echo.

:CHECK_ENV
echo 检查环境配置...
if not exist "%SERVER_PATH%\.env" (
    echo 创建环境配置文件...
    echo PORT=3000 > "%SERVER_PATH%\.env"
    echo JWT_SECRET=campus-market-secret-key-2024 >> "%SERVER_PATH%\.env"
    echo DB_PATH=./data/campus.db >> "%SERVER_PATH%\.env"
    echo UPLOAD_PATH=./uploads >> "%SERVER_PATH%\.env"
    echo 环境配置文件已创建
)

echo.

:CHECK_DB
echo 检查数据库文件...
if not exist "%SERVER_PATH%\data\campus.db" (
    echo 警告: 数据库文件不存在，将使用空数据库
    if not exist "%SERVER_PATH%\data" mkdir "%SERVER_PATH%\data"
)

:CHECK_UPLOADS
echo 检查上传目录...
if not exist "%SERVER_PATH%\uploads" mkdir "%SERVER_PATH%\uploads"

:START_SERVER
echo 启动后端服务...
echo 服务将在端口3000启动...
echo 按Ctrl+C停止服务
cd /d "%SERVER_PATH%"
node app.js

if %errorlevel% neq 0 (
    echo 错误: 服务启动失败
    echo 请检查端口3000是否被占用
    pause
    exit /b 1
)

pause