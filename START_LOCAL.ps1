#!/usr/bin/env pwsh
<#
.SYNOPSIS
    校园二手交易平台 - 本地网络部署脚本
.DESCRIPTION
    自动构建和启动前端后端服务
#>

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "   校园二手交易平台 - 本地网络部署" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 检查 Node.js
Write-Host "[1/5] 检查 Node.js 环境..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    $npmVersion = npm --version
    Write-Host "✓ Node.js: $nodeVersion" -ForegroundColor Green
    Write-Host "✓ npm: $npmVersion" -ForegroundColor Green
}
catch {
    Write-Host "❌ 未检测到 Node.js，请先安装 Node.js 18+" -ForegroundColor Red
    Write-Host "下载地址: https://nodejs.org/" -ForegroundColor Yellow
    Read-Host "按 Enter 键退出"
    exit 1
}
Write-Host ""

# 安装依赖
Write-Host "[2/5] 安装项目依赖..." -ForegroundColor Yellow
try {
    npm run install:all *> $null
    Write-Host "✓ 依赖安装完成" -ForegroundColor Green
}
catch {
    Write-Host "❌ 依赖安装失败: $_" -ForegroundColor Red
    Read-Host "按 Enter 键退出"
    exit 1
}
Write-Host ""

# 构建前端
Write-Host "[3/5] 构建前端项目..." -ForegroundColor Yellow
try {
    Push-Location ".\client"
    npm run build *> $null
    Pop-Location
    Write-Host "✓ 前端构建完成" -ForegroundColor Green
}
catch {
    Write-Host "❌ 前端构建失败: $_" -ForegroundColor Red
    Read-Host "按 Enter 键退出"
    exit 1
}
Write-Host ""

# 获取局域网 IP
Write-Host "[4/5] 获取局域网 IP 地址..." -ForegroundColor Yellow
try {
    $ipAddress = (Get-NetIPAddress -AddressFamily IPv4 | 
        Where-Object { $_.IPAddress -notlike '127.*' -and $_.PrefixOrigin -eq 'Dhcp' -or $_.PrefixOrigin -eq 'Manual' } | 
        Select-Object -First 1).IPAddress
    
    if (-not $ipAddress) {
        $ipAddress = "localhost"
    }
    Write-Host "✓ IP 地址: $ipAddress" -ForegroundColor Green
}
catch {
    $ipAddress = "localhost"
    Write-Host "⚠ 无法自动获取 IP，使用默认值" -ForegroundColor Yellow
}
Write-Host ""

# 启动后端
Write-Host "[5/5] 启动后端服务..." -ForegroundColor Yellow
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "🎉 服务启动成功！" -ForegroundColor Green
Write-Host ""
Write-Host "📱 前端访问地址:" -ForegroundColor Cyan
Write-Host "   • 本地: http://localhost:3001" -ForegroundColor White
Write-Host "   • 局域网: http://$ipAddress:3001" -ForegroundColor White
Write-Host ""
Write-Host "🔌 API 服务:" -ForegroundColor Cyan
Write-Host "   • http://$ipAddress:3001/api" -ForegroundColor White
Write-Host ""
Write-Host "⏹️  按 Ctrl+C 可停止服务" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

Push-Location ".\server"
npm start
Pop-Location
