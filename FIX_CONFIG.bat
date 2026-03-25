@echo off
chcp 65001 >nul
cls

echo ========================================
echo   配置修复工具
echo ========================================
echo.

:: 检查并创建必要的目录
echo [1/3] 检查项目结构...

if not exist "server\data" (
    echo 创建 server\data 目录...
    mkdir server\data
)

if not exist "server\uploads" (
    echo 创建 server\uploads 目录...
    mkdir server\uploads
)

if not exist "client\dist" (
    echo 警告: 前端未构建（client\dist 不存在）
    echo 请运行 START_LOCAL.bat 自动构建
)

echo ✓ 项目结构正常
echo.

:: 清理 node_modules
echo [2/3] 检查依赖...
if exist "node_modules" (
    echo 根目录依赖已存在
) else (
    echo ✗ 根目录依赖缺失
    echo 请运行 START_LOCAL.bat 重新安装
)

if exist "server\node_modules" (
    echo 后端依赖已存在
) else (
    echo ✗ 后端依赖缺失
)

if exist "client\node_modules" (
    echo 前端依赖已存在
) else (
    echo ✗ 前端依赖缺失
)

echo.
echo [3/3] 环境配置...

:: 检查或创建 .env 文件
if not exist "server\.env" (
    echo 创建 server\.env 文件...
    (
        echo NODE_ENV=development
        echo PORT=3001
        echo DB_NAME=campus_secondhand
    ) > server\.env
    echo ✓ .env 文件已创建
) else (
    echo ✓ .env 文件已存在
)

echo.
echo ========================================
echo ✓ 配置检查完成！
echo ========================================
echo.

echo 下一步:
echo 1. 运行 START_LOCAL.bat 启动服务
echo 2. 在浏览器访问 http://你的IP:3001
echo.

pause
