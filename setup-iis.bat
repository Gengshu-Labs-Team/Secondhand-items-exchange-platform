@echo off
echo ========================================
echo IIS网站配置脚本
echo ========================================

set SITE_NAME="campus-market"
set SITE_PATH="C:\www\campus-market\client\dist"
set SITE_PORT=80

:CHECK_IIS
echo 检查IIS服务状态...
sc query W3SVC >nul 2>&1
if %errorlevel% neq 0 (
    echo 错误: IIS服务未运行或未安装
    echo 请先安装IIS Web服务器
    pause
    exit /b 1
)

echo IIS服务运行正常
echo.

:CHECK_SITE_PATH
echo 检查网站目录...
if not exist %SITE_PATH% (
    echo 错误: 网站目录不存在: %SITE_PATH%
    echo 请确保前端文件已编译并放置在正确位置
    pause
    exit /b 1
)

echo 网站目录存在: %SITE_PATH%
echo.

:CREATE_WEB_CONFIG
echo 创建web.config配置文件...
(
echo ^<?xml version="1.0" encoding="UTF-8"?^>
echo ^<configuration^>
echo     ^<system.webServer^>
echo         ^<rewrite^>
echo             ^<rules^>
echo                 ^<rule name="SPA Routes" stopProcessing="true"^>
echo                     ^<match url="." /^>
echo                     ^<conditions logicalGrouping="MatchAll"^>
echo                         ^<add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" /^>
echo                         ^<add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" /^>
echo                     ^</conditions^>
echo                     ^<action type="Rewrite" url="/index.html" /^>
echo                 ^</rule^>
echo             ^</rules^>
echo         ^</rewrite^>
echo         ^<staticContent^>
echo             ^<mimeMap fileExtension=".js" mimeType="application/javascript" /^>
echo             ^<mimeMap fileExtension=".css" mimeType="text/css" /^>
echo         ^</staticContent^>
echo     ^</system.webServer^>
echo ^</configuration^>
) > "%SITE_PATH%\web.config"

echo web.config配置文件已创建
echo.

:CREATE_IIS_SITE
echo 创建IIS网站...
%windir%\system32\inetsrv\appcmd add site /name:%SITE_NAME% /physicalPath:%SITE_PATH% /bindings:http/*:%SITE_PORT%:

if %errorlevel% neq 0 (
    echo 网站创建失败，可能已存在同名网站
    echo 尝试删除现有网站并重新创建...
    %windir%\system32\inetsrv\appcmd delete site %SITE_NAME%
    %windir%\system32\inetsrv\appcmd add site /name:%SITE_NAME% /physicalPath:%SITE_PATH% /bindings:http/*:%SITE_PORT%:
)

echo IIS网站配置完成！
echo.

:START_SITE
echo 启动网站...
%windir%\system32\inetsrv\appcmd start site %SITE_NAME%

echo.
echo ========================================
echo 配置完成！
echo ========================================
echo 网站名称: %SITE_NAME%
echo 网站路径: %SITE_PATH%
echo 访问端口: %SITE_PORT%
echo.
echo 现在可以通过以下地址访问网站：
echo http://localhost:%SITE_PORT%
echo 或 http://你的服务器IP:%SITE_PORT%
echo.
echo 注意：请确保后端服务也在运行（端口3000）
echo.
pause