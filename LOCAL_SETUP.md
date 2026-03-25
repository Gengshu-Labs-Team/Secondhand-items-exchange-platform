# 🌐 局域网部署指南

## 快速开始（3 步）

### 1️⃣ 安装 Node.js
- 下载: https://nodejs.org/ (推荐 v18+ LTS 版本)
- 安装完成后，重启终端

### 2️⃣ 运行启动脚本
双击 `START_LOCAL.bat` 文件，脚本会自动：
- ✅ 检查 Node.js 环境
- ✅ 安装所有依赖
- ✅ 构建前端项目
- ✅ 启动后端服务
- ✅ 显示访问地址

### 3️⃣ 在局域网中访问
在任何设备的浏览器打开：
```
http://你的电脑IP:3001
```

---

## 如何获取电脑的局域网 IP？

### Windows:
1. 按 `Win + R`，输入 `cmd`
2. 输入命令：`ipconfig`
3. 找到 `IPv4 地址`，通常是 `192.168.x.x` 或 `10.0.x.x`

### macOS/Linux:
```bash
ifconfig | grep "inet "
```

---

## 📱 在其他设备上访问

### 同一局域网中：
- **PC/Mac**: 浏览器打开 `http://192.168.x.x:3001`
- **手机**: 连接同一 WiFi，用手机浏览器打开相同地址
- **平板**: 同样方式访问

### 重要提示：
- 确保所有设备都连接到**同一个 WiFi 网络**
- 如果无法访问，检查防火墙设置（见下文）

---

## 🔧 手动运行（如果 .bat 文件不工作）

### 第一次运行：
```powershell
# 打开 PowerShell 或 CMD，进入项目目录
cd 项目路径

# 安装依赖
npm run install:all

# 构建前端
cd client
npm run build
cd ..

# 启动服务
cd server
npm start
```

### 之后每次运行：
```powershell
cd 项目路径/server
npm start
```

---

## ⚠️ 常见问题排查

### 1. "无法将 npm 识别为命令"
- ❌ Node.js 未正确安装
- ✅ 重新下载安装：https://nodejs.org/
- ✅ 安装后重启 PowerShell/CMD

### 2. "npm ERR! code ERESOLVE"
```powershell
npm install --legacy-peer-deps
```

### 3. 防火墙阻止了访问
**Windows 防火墙设置：**
1. 打开 `Windows Defender 防火墙`
2. 点击 `允许应用通过防火墙`
3. 找到 `Node.js` 或 `npm`，确保已勾选

### 4. 无法在其他设备访问
- 检查是否在同一 WiFi 网络
- 运行 `ipconfig` 确认 IP 地址
- 尝试 `ping IP地址` 测试连接
- 检查防火墙设置（允许 3001 端口）

### 5. 端口 3001 已被占用
修改配置文件 `server/config/index.js`，改变 PORT 值

---

## 📊 项目架构

```
前端 (Vue 3 + Vite)
     ↓
  Nginx 反向代理
     ↓
后端 (Express + SQLite)
```

- **前端端口**: 3002（开发）/ 3001（生产）
- **后端端口**: 3001
- **数据库**: SQLite (本地 data/ 目录)
- **上传文件**: uploads/ 目录

---

## 🎯 功能特性

✅ 二手物品发布和浏览
✅ 分类浏览
✅ 物品搜索
✅ 用户认证
✅ 图片上传
✅ 实时数据持久化

---

## 🚀 性能优化建议

- 如果项目内存占用过高，修改 Node.js 启动参数
- 定期清理 uploads/ 目录中过期的图片
- 备份 SQLite 数据库文件 (data/campus.db)

---

## 📞 需要帮助？

检查以下文件：
- `server/.env` - 环境变量配置
- `server/config/index.js` - 服务器配置
- `client/vite.config.js` - 前端 Vite 配置

---

**祝你使用愉快！** 🎉
