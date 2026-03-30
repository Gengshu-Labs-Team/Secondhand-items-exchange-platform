# 二手物品交换平台 - Windows服务器部署指南

## 系统要求
- Windows Server 2019/2022
- Node.js 16+ 
- IIS Web服务器
- 至少2GB内存，20GB硬盘空间

## 第一步：服务器环境准备

### 1.1 安装Node.js
1. 访问 https://nodejs.org/ 下载Windows版本的Node.js LTS
2. 运行安装程序，选择默认设置
3. 安装完成后，打开PowerShell验证安装：
```powershell
node --version
npm --version
```

### 1.2 安装IIS（如果未安装）
1. 打开"服务器管理器"
2. 点击"添加角色和功能"
3. 选择"Web服务器(IIS)"
4. 安装默认组件

## 第二步：上传项目文件

1. 在服务器上创建项目目录：
```powershell
mkdir C:\\www\\campus-market
```

2. 将项目文件上传到该目录，结构如下：
```
C:\\www\\campus-market\\
├── client/           # 前端文件（已编译）
├── server/           # 后端服务
├── database/         # 数据库文件
└── deploy/           # 部署配置
```

## 第三步：配置后端服务

### 3.1 安装后端依赖
```powershell
cd C:\\www\\campus-market\\server
npm install
```

### 3.2 配置环境变量
编辑 `server/.env` 文件：
```env
PORT=3000
JWT_SECRET=your-secret-key
DB_PATH=./data/campus.db
UPLOAD_PATH=./uploads
```

### 3.3 测试后端服务
```powershell
npm start
```
如果看到"Server running on port 3000"表示启动成功

## 第四步：配置IIS托管前端

### 4.1 创建IIS网站
1. 打开"IIS管理器"
2. 右键"网站" → "添加网站"
3. 配置：
   - 网站名称：`campus-market`
   - 物理路径：`C:\www\campus-market\client\dist`
   - 端口：80（或自定义端口）

### 4.2 配置URL重写（重要）
1. 安装URL重写模块：https://www.iis.net/downloads/microsoft/url-rewrite
2. 在网站根目录创建 `web.config` 文件：

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
        <staticContent>
            <mimeMap fileExtension=".js" mimeType="application/javascript" />
            <mimeMap fileExtension=".css" mimeType="text/css" />
        </staticContent>
    </system.webServer>
</configuration>
```

## 第五步：配置API代理

由于前端需要访问后端API（端口3000），需要配置代理：

### 5.1 安装Application Request Routing
1. 下载ARR：https://www.iis.net/downloads/microsoft/application-request-routing
2. 安装后重启IIS

### 5.2 配置代理规则
在IIS管理器中：
1. 选择你的网站
2. 双击"URL重写"
3. 添加反向代理规则：
   - 模式：`^api/(.*)`
   - 重写URL：`http://localhost:3000/{R:1}`

## 第六步：配置Windows服务（自动启动）

### 6.1 使用PM2管理Node.js服务
```powershell
npm install -g pm2
cd C:\\www\\campus-market\\server
pm2 start app.js --name "campus-market-server"
pm2 startup
pm2 save
```

### 6.2 创建启动脚本
创建 `start-server.bat`：
```batch
@echo off
cd /d C:\\www\\campus-market\\server
node app.js
```

## 第七步：防火墙和安全配置

### 7.1 开放端口
```powershell
# 开放80端口（HTTP）
New-NetFirewallRule -DisplayName "Campus Market HTTP" -Direction Inbound -Protocol TCP -LocalPort 80 -Action Allow

# 开放3000端口（API）
New-NetFirewallRule -DisplayName "Campus Market API" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow
```

### 7.2 配置SSL（可选）
1. 申请SSL证书
2. 在IIS中绑定HTTPS（端口443）

## 第八步：测试部署

1. **测试前端访问**：
   - 浏览器访问 http://你的服务器IP
   - 应该看到登录页面

2. **测试API接口**：
   - 访问 http://你的服务器IP:3000/api/health
   - 应该返回成功状态

3. **测试完整功能**：
   - 注册新用户
   - 登录系统
   - 发布商品

## 故障排除

### 常见问题1：端口冲突
```powershell
# 查看占用端口的进程
netstat -ano | findstr :3000
```

### 常见问题2：文件权限
确保IIS用户对项目目录有读写权限

### 常见问题3：数据库连接
检查 `server/data/campus.db` 文件是否存在

## 维护和更新

### 重启服务
```powershell
pm2 restart campus-market-server
```

### 查看日志
```powershell
pm2 logs campus-market-server
```

### 备份数据
定期备份 `server/data/campus.db` 文件

---

按照以上步骤操作，你的二手物品交换平台就可以成功部署到Windows服务器了！