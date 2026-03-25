# 二手物品交换平台 - 一步一步部署指南

## 🎯 部署目标
将项目成功部署到阿里云Windows服务器，让网站可以通过互联网访问

## 📋 部署前检查清单

### 已完成 ✅
- [x] 项目文件完整
- [x] 本地后端服务测试通过
- [x] Node.js版本兼容性问题解决

### 待完成 ⏳
- [ ] 阿里云服务器环境准备
- [ ] 项目文件上传到服务器
- [ ] 服务器端环境配置
- [ ] IIS网站配置
- [ ] 防火墙和网络配置
- [ ] 最终测试

## 🚀 详细部署步骤

### 第一步：阿里云服务器环境准备（预计10分钟）

**1.1 登录阿里云控制台**
- 访问 https://ecs.console.aliyun.com
- 找到你的Windows服务器实例

**1.2 远程连接到服务器**
- 使用远程桌面连接（mstsc）
- 输入服务器公网IP地址
- 使用管理员账号密码登录

**1.3 检查服务器环境**
打开PowerShell，检查以下软件：
```powershell
# 检查Node.js
node --version

# 检查npm
npm --version

# 检查IIS
Get-WindowsFeature -Name Web-Server
```

**1.4 安装缺失的软件**
如果缺少Node.js：
- 访问 https://nodejs.org/ 下载Windows版本
- 运行安装程序，选择默认设置

如果缺少IIS：
```powershell
# 安装IIS
Install-WindowsFeature -Name Web-Server -IncludeManagementTools
```

### 第二步：上传项目文件到服务器（预计5分钟）

**2.1 在服务器上创建项目目录**
```powershell
mkdir C:\\www\\campus-market
```

**2.2 上传项目文件**
将整个项目文件夹上传到 `C:\www\campus-market`
文件结构应该是：
```
C:\www\campus-market\
├── client/           # 前端文件
├── server/           # 后端服务
├── database/         # 数据库
└── 各种配置文件
```

### 第三步：配置后端服务（预计5分钟）

**3.1 安装后端依赖**
```powershell
cd C:\\www\\campus-market\\server
npm install
```

**3.2 重新编译SQLite模块**
```powershell
npm rebuild better-sqlite3
```

**3.3 创建环境配置文件**
编辑 `server/.env` 文件：
```env
PORT=3001
JWT_SECRET=campus-market-secret-key
DB_PATH=./data/campus.db
UPLOAD_PATH=./uploads
```

**3.4 测试后端服务**
```powershell
node app.js
```
应该看到：
```
✅ SQLite 数据库初始化完成
✅ SQLite 数据库连接成功
🚀 服务器运行在 http://localhost:3001
```

### 第四步：配置IIS网站（预计10分钟）

**4.1 创建IIS网站**
1. 打开"IIS管理器"
2. 右键"网站" → "添加网站"
3. 配置：
   - 网站名称：`campus-market`
   - 物理路径：`C:\www\campus-market\client\dist`
   - 端口：80

**4.2 配置URL重写**
在网站根目录创建 `web.config` 文件：
```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
    <system.webServer>
        <rewrite>
            <rules>
                <rule name="SPA Routes" stopProcessing="true">
                    <match url="." />
                    <conditions logicalGrouping="MatchAll">
                        <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
                        <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
                    </conditions>
                    <action type="Rewrite" url="/index.html" />
                </rule>
            </rules>
        </rewrite>
    </system.webServer>
</configuration>
```

### 第五步：配置API访问（重要！预计5分钟）

由于前端需要访问后端API（端口3001），需要修改前端配置：

**5.1 修改API地址**
编辑 `client/dist/assets` 中的JS文件，找到API配置：
将 `http://localhost:3001/api` 改为 `http://你的服务器IP:3001/api`

或者使用相对路径：`/api`（需要配置IIS反向代理）

### 第六步：防火墙和网络配置（预计5分钟）

**6.1 开放端口**
```powershell
# 开放80端口（HTTP网站）
New-NetFirewallRule -DisplayName "Campus Market HTTP" -Direction Inbound -Protocol TCP -LocalPort 80 -Action Allow

# 开放3001端口（API服务）
New-NetFirewallRule -DisplayName "Campus Market API" -Direction Inbound -Protocol TCP -LocalPort 3001 -Action Allow
```

**6.2 配置后端服务自动启动**
创建启动脚本 `start-server.bat`：
```batch
@echo off
cd /d C:\\www\\campus-market\\server
node app.js
```

### 第七步：最终测试（预计5分钟）

**7.1 测试网站访问**
- 浏览器访问：`http://你的服务器IP`
- 应该看到登录页面

**7.2 测试API接口**
- 访问：`http://你的服务器IP:3001/api/health`
- 应该返回成功状态

**7.3 测试完整功能**
- 注册新用户
- 登录系统
- 发布商品测试

## 🛠️ 故障排除指南

### 问题1：网站无法访问
- 检查IIS服务是否运行
- 检查80端口是否被占用
- 检查防火墙设置

### 问题2：API无法访问
- 检查后端服务是否运行（端口3001）
- 检查API地址配置是否正确
- 检查防火墙是否开放3001端口

### 问题3：数据库错误
- 检查 `server/data/campus.db` 文件是否存在
- 检查文件读写权限

## 📞 需要帮助？
如果在任何步骤遇到问题，请：
1. 截图错误信息
2. 告诉我你卡在哪一步
3. 我会提供具体的解决方案

---

按照这个指南，一步一步操作，你的网站就可以成功部署了！