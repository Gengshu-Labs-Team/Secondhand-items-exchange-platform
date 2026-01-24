@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

:: ============================================
:: 校园二手交易平台 - 数据管理脚本 (Windows)
:: ============================================

set DATA_DIR=persistent-data
set BACKUP_DIR=backups

if "%1"=="" goto help
if "%1"=="help" goto help
if "%1"=="backup" goto backup
if "%1"=="restore" goto restore
if "%1"=="deploy" goto deploy
if "%1"=="status" goto status
goto help

:help
echo ==========================================
echo   校园二手交易平台 - 数据管理工具
echo ==========================================
echo.
echo 用法: data-manager.bat [命令]
echo.
echo 命令:
echo   backup      备份数据库和上传文件
echo   restore     从备份恢复数据
echo   deploy      部署/更新应用（保留数据）
echo   status      查看数据状态
echo   help        显示此帮助信息
echo.
goto end

:init
if not exist "%DATA_DIR%\database" mkdir "%DATA_DIR%\database"
if not exist "%DATA_DIR%\uploads" mkdir "%DATA_DIR%\uploads"
if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"
echo [OK] 数据目录已初始化
goto :eof

:backup
call :init

:: 生成时间戳
for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
set "TIMESTAMP=%dt:~0,8%_%dt:~8,6%"
set "BACKUP_NAME=backup_%TIMESTAMP%"
set "BACKUP_PATH=%BACKUP_DIR%\%BACKUP_NAME%"

echo [INFO] 开始备份数据...

mkdir "%BACKUP_PATH%"

:: 备份数据库
if exist "%DATA_DIR%\database\campus.db" (
    copy "%DATA_DIR%\database\campus.db" "%BACKUP_PATH%\" >nul
    echo [OK] 数据库已备份
) else (
    echo [WARN] 数据库文件不存在，跳过
)

:: 备份上传文件
if exist "%DATA_DIR%\uploads" (
    xcopy "%DATA_DIR%\uploads" "%BACKUP_PATH%\uploads\" /E /I /Q >nul 2>&1
    echo [OK] 上传文件已备份
) else (
    echo [WARN] 上传目录不存在，跳过
)

:: 压缩备份（如果有7z）
where 7z >nul 2>&1
if %errorlevel%==0 (
    7z a -tzip "%BACKUP_DIR%\%BACKUP_NAME%.zip" "%BACKUP_PATH%\*" >nul
    rmdir /s /q "%BACKUP_PATH%"
    echo [OK] 备份完成: %BACKUP_DIR%\%BACKUP_NAME%.zip
) else (
    echo [OK] 备份完成: %BACKUP_PATH%\
    echo [TIP] 安装7-Zip可自动压缩备份文件
)
goto end

:restore
echo [INFO] 可用的备份:
dir /b "%BACKUP_DIR%" 2>nul
echo.
set /p "BACKUP_FILE=请输入要恢复的备份名称: "

if exist "%BACKUP_DIR%\%BACKUP_FILE%.zip" (
    echo [WARN] 此操作将覆盖当前数据!
    set /p "CONFIRM=确定要继续吗? (y/n): "
    if /i "!CONFIRM!"=="y" (
        where 7z >nul 2>&1
        if !errorlevel!==0 (
            7z x "%BACKUP_DIR%\%BACKUP_FILE%.zip" -o"%BACKUP_DIR%\temp_restore" -y >nul
            if exist "%BACKUP_DIR%\temp_restore\campus.db" (
                copy "%BACKUP_DIR%\temp_restore\campus.db" "%DATA_DIR%\database\" /y >nul
                echo [OK] 数据库已恢复
            )
            if exist "%BACKUP_DIR%\temp_restore\uploads" (
                xcopy "%BACKUP_DIR%\temp_restore\uploads" "%DATA_DIR%\uploads\" /E /I /Q /Y >nul
                echo [OK] 上传文件已恢复
            )
            rmdir /s /q "%BACKUP_DIR%\temp_restore"
        ) else (
            echo [ERROR] 需要7-Zip来解压备份文件
        )
    ) else (
        echo [INFO] 已取消
    )
) else if exist "%BACKUP_DIR%\%BACKUP_FILE%" (
    echo [WARN] 此操作将覆盖当前数据!
    set /p "CONFIRM=确定要继续吗? (y/n): "
    if /i "!CONFIRM!"=="y" (
        if exist "%BACKUP_DIR%\%BACKUP_FILE%\campus.db" (
            copy "%BACKUP_DIR%\%BACKUP_FILE%\campus.db" "%DATA_DIR%\database\" /y >nul
            echo [OK] 数据库已恢复
        )
        if exist "%BACKUP_DIR%\%BACKUP_FILE%\uploads" (
            xcopy "%BACKUP_DIR%\%BACKUP_FILE%\uploads" "%DATA_DIR%\uploads\" /E /I /Q /Y >nul
            echo [OK] 上传文件已恢复
        )
    ) else (
        echo [INFO] 已取消
    )
) else (
    echo [ERROR] 备份文件不存在
)
goto end

:deploy
call :init

echo [INFO] 开始部署应用...
set /p "BACKUP_FIRST=部署前是否备份当前数据? (y/n): "
if /i "%BACKUP_FIRST%"=="y" call :backup

echo [INFO] 重新构建容器...
docker-compose down
docker-compose build --no-cache
docker-compose up -d

echo.
echo [OK] 部署完成!
echo 前端访问: http://localhost:3000
echo 后端API: http://localhost:3001/api
goto end

:status
echo ==========================================
echo   数据状态
echo ==========================================
echo.

:: 检查数据库
if exist "%DATA_DIR%\database\campus.db" (
    for %%A in ("%DATA_DIR%\database\campus.db") do set "DB_SIZE=%%~zA"
    set /a "DB_SIZE_KB=!DB_SIZE!/1024"
    echo [OK] 数据库: 存在 ^(!DB_SIZE_KB! KB^)
) else (
    echo [WARN] 数据库: 不存在
)

:: 检查上传目录
if exist "%DATA_DIR%\uploads" (
    set "FILE_COUNT=0"
    for /r "%DATA_DIR%\uploads" %%f in (*) do set /a "FILE_COUNT+=1"
    echo [OK] 上传文件: !FILE_COUNT! 个文件
) else (
    echo [WARN] 上传目录: 不存在
)

:: 检查备份
if exist "%BACKUP_DIR%" (
    set "BACKUP_COUNT=0"
    for %%f in ("%BACKUP_DIR%\*") do set /a "BACKUP_COUNT+=1"
    echo [OK] 备份: !BACKUP_COUNT! 个
) else (
    echo [WARN] 备份目录: 不存在
)

echo.
echo 容器状态:
docker-compose ps

:end
endlocal
