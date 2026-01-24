# 校园二手交易平台 - Windows 代码同步脚本
# 用于安全地将本地代码同步到服务器（不覆盖数据库和上传文件）
# 使用方法: .\sync.ps1 -ServerIP <IP地址> [-User <用户名>]

param(
    [Parameter(Mandatory=$true)]
    [string]$ServerIP,
    
    [Parameter(Mandatory=$false)]
    [string]$User = "root"
)

$RemoteDir = "/var/www/campus-trade"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  校园二手交易平台 - 代码同步" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "目标服务器: $User@$ServerIP" -ForegroundColor Yellow
Write-Host "远程目录:   $RemoteDir" -ForegroundColor Yellow
Write-Host ""

# 获取项目根目录
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectDir = Split-Path -Parent $ScriptDir

Write-Host "[检查] 检查 rsync 是否可用..." -ForegroundColor Yellow

# 检查是否安装了 rsync (通过 Git Bash 或 WSL)
$rsyncPath = $null

# 尝试 Git Bash 的 rsync
$gitBashRsync = "C:\Program Files\Git\usr\bin\rsync.exe"
if (Test-Path $gitBashRsync) {
    $rsyncPath = $gitBashRsync
}

if ($rsyncPath) {
    Write-Host "[同步中] 使用 rsync 同步代码文件..." -ForegroundColor Yellow
    Write-Host ""
    
    # 转换路径为 Unix 格式
    $unixProjectDir = ($ProjectDir -replace '\\', '/') -replace '^([A-Za-z]):', '/$1'
    
    # 使用 Git Bash 执行 rsync
    $bashPath = "C:\Program Files\Git\bin\bash.exe"
    $rsyncCmd = @"
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
    '$unixProjectDir/' '$User@${ServerIP}:$RemoteDir/'
"@
    
    & $bashPath -c $rsyncCmd
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ 代码同步完成！" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "❌ 同步失败，请检查网络连接和 SSH 配置" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "[提示] 未找到 rsync，使用 scp 同步..." -ForegroundColor Yellow
    Write-Host "[警告] scp 不支持排除目录，建议安装 Git for Windows 以使用 rsync" -ForegroundColor Red
    Write-Host ""
    
    # 使用 scp 同步（不推荐，因为无法排除目录）
    Write-Host "请手动使用以下命令同步（在 Git Bash 中执行）：" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "cd '$ProjectDir'" -ForegroundColor White
    Write-Host "rsync -avz --progress \" -ForegroundColor White
    Write-Host "    --exclude 'node_modules/' \" -ForegroundColor White
    Write-Host "    --exclude 'server/data/' \" -ForegroundColor White
    Write-Host "    --exclude 'server/uploads/' \" -ForegroundColor White
    Write-Host "    --exclude 'persistent-data/' \" -ForegroundColor White
    Write-Host "    --exclude '.git/' \" -ForegroundColor White
    Write-Host "    ./ $User@${ServerIP}:$RemoteDir/" -ForegroundColor White
    exit 1
}

Write-Host ""
Write-Host "下一步操作（在服务器上执行）：" -ForegroundColor Cyan
Write-Host "  ssh $User@$ServerIP" -ForegroundColor White
Write-Host "  cd $RemoteDir/deploy" -ForegroundColor White
Write-Host "  sudo bash update.sh" -ForegroundColor White
Write-Host ""
Write-Host "提示：数据库和上传文件未被同步，数据安全保留" -ForegroundColor Yellow
