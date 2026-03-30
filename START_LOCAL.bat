@echo off
chcp 65001 >nul
cls
echo ========================================
echo   校园二手交易平台 - 本地网络部署
echo ========================================
echo.

:: 检查 Node.js 和 npm
echo [1/5] 检查 Node.js 环境...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 未检测到 Node.js，请先安装 Node.js 18+
    echo 下载地址: https://nodejs.org/
    pause
    exit /b 1
)
echo ✓ Node.js 环境正常
echo.

:: 安装依赖
echo [2/5] 安装项目依赖（首次运行较慢）...
call npm run install:all >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 依赖安装失败
    pause
    exit /b 1
)
echo ✓ 依赖安装完成
echo.

:: 构建前端
echo [3/5] 构建前端项目...
cd client
call npm run build >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 前端构建失败
    pause
    exit /b 1
)
echo ✓ 前端构建完成
cd ..
echo.

:: 获取局域网 IP
echo [4/5] 获取局域网 IP 地址...
for /f "tokens=2 delims=: " %%A in ('ipconfig ^| findstr /R "IPv4"') do (
    set "ip=%%A"
    goto :found
)
:found
setlocal enabledelayedexpansion
set "ip=!ip: =!"
echo ✓ 你的局域网 IP: %ip%
echo.

:: 启动后端服务
echo [5/5] 启动后端服务...
echo ========================================
echo 🎉 服务启动成功！
echo.
echo 📱 前端访问地址:
echo   • 本地: http://localhost:3001
echo   • 局域网: http://%ip%:3001
echo.
echo 🔌 API 服务:
echo   • http://localhost:3001/api
echo   • http://%ip%:3001/api
echo.
echo ⏹️  按 Ctrl+C 可停止服务
echo ========================================
echo.

cd server
call npm start
