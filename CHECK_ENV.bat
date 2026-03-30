@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo.
echo ========================================
echo   环境检查工具
echo ========================================
echo.

:: 检查 Node.js
echo [检查] Node.js...
node --version >nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=*" %%i in ('node --version') do set NODE_VER=%%i
    echo ✓ Node.js: !NODE_VER!
) else (
    echo ✗ Node.js: 未安装
)

:: 检查 npm
echo [检查] npm...
npm --version >nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=*" %%i in ('npm --version') do set NPM_VER=%%i
    echo ✓ npm: !NPM_VER!
) else (
    echo ✗ npm: 未安装
)

:: 检查 Git
echo [检查] Git...
git --version >nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=*" %%i in ('git --version') do set GIT_VER=%%i
    echo ✓ !GIT_VER!
) else (
    echo ✗ Git: 未安装 ^(可选^)
)

:: 检查项目文件
echo [检查] 项目文件...
if exist "package.json" (
    echo ✓ package.json 存在
) else (
    echo ✗ package.json 丢失
)

if exist "server\package.json" (
    echo ✓ server/package.json 存在
) else (
    echo ✗ server/package.json 丢失
)

if exist "client\package.json" (
    echo ✓ client/package.json 存在
) else (
    echo ✗ client/package.json 丢失
)

:: 检查依赖
echo.
echo [检查] 依赖...
if exist "node_modules" (
    echo ✓ 根目录依赖已安装
) else (
    echo ✗ 根目录依赖未安装
)

if exist "server\node_modules" (
    echo ✓ 后端依赖已安装
) else (
    echo ✗ 后端依赖未安装
)

if exist "client\node_modules" (
    echo ✓ 前端依赖已安装
) else (
    echo ✗ 前端依赖未安装
)

:: 检查构建输出
echo.
echo [检查] 构建输出...
if exist "client\dist" (
    echo ✓ 前端已构建 ^(client/dist^)
) else (
    echo ✗ 前端未构建
)

:: 获取 IP
echo.
echo [网络信息]
for /f "tokens=2 delims=: " %%A in ('ipconfig ^| findstr /R "IPv4"') do (
    set "ip=%%A"
    set "ip=!ip: =!"
    echo IP 地址: !ip!
    goto :done
)
:done

echo.
echo ========================================
echo 检查完成！
echo ========================================
echo.

pause
