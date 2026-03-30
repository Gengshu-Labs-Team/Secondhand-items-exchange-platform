# 🎉 局域网部署完成！

## 📋 已为你生成的文件

| 文件名 | 用途 | 用法 |
|--------|------|------|
| `START_LOCAL.bat` | 💚 自动启动脚本（推荐） | 双击运行 |
| `START_LOCAL.ps1` | 📘 PowerShell 启动脚本 | `.\START_LOCAL.ps1` |
| `CHECK_ENV.bat` | 🔍 环境检查工具 | 双击查看环境信息 |
| `LOCAL_SETUP.md` | 📖 详细部署指南 | 参考手册 |
| `QUICK_START.md` | ⚡ 快速参考 | 一页纸速查 |

---

## 🚀 快速启动（3 步）

### 1. 安装 Node.js
- 访问: https://nodejs.org/
- 下载 **LTS 版本** (v18 或更高)
- 安装完成后**重启 PowerShell/CMD**

### 2. 运行启动脚本
**Windows 用户：直接双击 `START_LOCAL.bat`**

或者打开 PowerShell/CMD，进入项目目录：
```powershell
.\START_LOCAL.bat
```

### 3. 打开浏览器访问
```
http://你的IP地址:3001
```

---

## 📱 在局域网中访问

### 获取你的 IP 地址

**方法 1：运行环境检查工具**
```powershell
双击 CHECK_ENV.bat
```

**方法 2：手动查询**
```powershell
ipconfig
# 找到 "IPv4 地址"，通常是 192.168.x.x 或 10.0.x.x
```

### 访问方式

**同一 WiFi 下的其他设备：**
- 👉 `http://你的IP:3001`
- 例如：`http://192.168.1.100:3001`

**不同网络的访问：**
- 需要内网穿透工具（如 ngrok、花生壳等）
- 详见下文 "进阶部署" 部分

---

## ✨ 功能特性

✅ **前端界面**
- Vue 3 + Vite 现代化前端
- 移动端友好（Vant UI 组件库）
- 快速页面加载

✅ **后端 API**
- Express.js 高效服务器
- RESTful API 设计
- CORS 跨域支持（局域网友好）

✅ **数据库**
- SQLite 本地数据库（无需安装 MySQL）
- 自动备份支持
- 数据实时持久化

✅ **上传功能**
- 支持图片上传
- 文件存储在 `server/uploads/`
- 自动清理过期文件

---

## 🔧 文件修改说明

为了支持局域网访问，我已修改了以下文件：

### `server/app.js`
**修改内容**: 服务器现在监听 `0.0.0.0:3001` 而不仅仅是 `localhost`

**效果**: 
- ✅ 本地可以访问
- ✅ 局域网设备可以访问
- ✅ 服务启动时显示完整的访问地址

---

## ⚠️ 常见问题

### Q1: "无法在其他设备访问"
```
❌ 检查项：
  • 两台设备是否连接同一个 WiFi？
  • IP 地址是否正确？（运行 CHECK_ENV.bat 查看）
  • 防火墙是否阻止了 3001 端口？

✅ 解决方案：
  • Windows 防火墙允许 Node.js 通过
  • 检查路由器设置
  • 尝试 ping IP 地址测试连接
```

### Q2: 启动时报错 "EADDRINUSE"
```
❌ 原因: 3001 端口已被占用

✅ 解决方案:
  1. 编辑 server/config/index.js
  2. 修改 PORT 值为其他端口（如 3000, 3003）
  3. 重新运行启动脚本
```

### Q3: npm install 失败
```
✅ 尝试以下命令：
npm install --legacy-peer-deps
```

### Q4: 前端无法加载
```
✅ 检查前端是否已构建:
  • 查看 client/dist 目录是否存在
  • 如果不存在，手动构建:
    cd client
    npm run build
    cd ..
```

---

## 📊 项目架构

```
┌─────────────────────────────────────────┐
│   其他设备的浏览器                       │
│  (手机/平板/其他电脑)                   │
└──────────────┬──────────────────────────┘
               │ HTTP 请求
               │ http://你的IP:3001
               ↓
┌──────────────────────────────────────────┐
│        你的电脑 (Windows)                │
├──────────────────────────────────────────┤
│  Express.js 后端                        │
│  ├─ 前端静态文件服务 (client/dist)      │
│  ├─ API 路由处理                        │
│  ├─ 文件上传处理                        │
│  └─ SQLite 数据库操作                   │
├──────────────────────────────────────────┤
│  SQLite 数据库                          │
│  server/data/campus.db                 │
├──────────────────────────────────────────┤
│  上传文件存储                           │
│  server/uploads/                       │
└──────────────────────────────────────────┘
```

---

## 💾 数据备份

### 重要文件位置
```
server/
├── data/
│   └── campus.db          ← SQLite 数据库文件
├── uploads/               ← 用户上传的图片
│   ├── 2026-01-22/
│   └── 2026-01-23/
```

### 备份步骤
```powershell
# 创建备份文件夹
mkdir backup

# 复制数据库
copy "server\data\campus.db" "backup\"

# 复制上传文件
xcopy "server\uploads\*" "backup\uploads\" /E /I
```

---

## 🎯 下一步

### 本地测试完成后：

1. **修改样式和功能**
   - 编辑 `client/src/` 中的 Vue 文件
   - 编辑 `server/routes/` 中的 API 路由
   - 重新运行 `START_LOCAL.bat`

2. **部署到云服务器（阿里云）**
   - 参考项目中的 `deploy/README.md`
   - 配置 Docker 环境
   - 一键部署到阿里云 ECS

3. **配置自定义域名**
   - 在阿里云 DNS 配置域名解析
   - 配置 SSL 证书（HTTPS）

---

## 🆘 需要帮助？

### 调试技巧

**查看实时日志**
```powershell
# 运行启动脚本时，所有日志会直接显示
# 按 Ctrl+C 停止并查看错误信息
```

**测试 API 连接**
```powershell
curl http://localhost:3001/api/health
```

**测试跨域支持**
```bash
# 验证 CORS 是否正常工作
curl -H "Origin: http://其他IP" \
     -H "Access-Control-Request-Method: GET" \
     http://你的IP:3001/api/health
```

---

## 📞 文档参考

- 📖 `LOCAL_SETUP.md` - 详细部署指南
- ⚡ `QUICK_START.md` - 快速参考卡片
- 🚀 `deploy/README.md` - 阿里云部署指南
- 📘 `README.md` - 项目主文档

---

**🎉 恭喜！你现在已经可以在局域网中访问这个网站了！**

**需要在阿里云上部署？参考 `deploy/README.md` 中的步骤。**
