# ⚡ 快速参考

## 🚀 启动方式

### 方式 1：双击批处理文件（最简单）
```
START_LOCAL.bat
```

### 方式 2：PowerShell 脚本
```powershell
.\START_LOCAL.ps1
```

### 方式 3：手动命令
```powershell
cd server
npm start
```

---

## 📍 访问地址

| 用途 | 地址 |
|------|------|
| **本地访问** | http://localhost:3001 |
| **局域网访问** | http://你的IP:3001 |
| **API 接口** | http://你的IP:3001/api |
| **健康检查** | http://你的IP:3001/api/health |

---

## 🔍 获取你的 IP 地址

### Windows PowerShell:
```powershell
ipconfig
# 查找 "IPv4 地址"，通常是 192.168.x.x
```

### CMD:
```cmd
ipconfig
```

---

## 📂 项目结构

```
├── client/           ← 前端 (Vue 3)
│   ├── src/
│   ├── dist/         ← 构建输出
│   └── vite.config.js
├── server/           ← 后端 (Express)
│   ├── app.js
│   ├── config/
│   ├── routes/
│   ├── data/         ← SQLite 数据库
│   └── uploads/      ← 上传文件
├── database/         ← 数据库初始化脚本
└── START_LOCAL.bat   ← 启动脚本
```

---

## 🔧 常用命令

```bash
# 完整构建和启动
npm run install:all    # 安装所有依赖
cd client && npm run build  # 构建前端
cd ../server && npm start   # 启动后端

# 仅前端开发
cd client
npm run dev           # 前端开发服务 (localhost:3002)

# 仅后端开发
cd server
npm run dev           # 后端开发服务 (nodemon)

# 清理缓存
rm -r node_modules
npm cache clean --force
```

---

## 🛑 停止服务

按 `Ctrl + C` 停止 Node.js 服务

---

## 💾 数据文件位置

- **数据库**: `server/data/campus.db`
- **上传图片**: `server/uploads/`

### 备份数据
```powershell
# 将以下文件夹备份到安全位置
server/data/
server/uploads/
```

---

## ⚠️ 故障排除

| 问题 | 解决方案 |
|------|---------|
| 端口占用 | 修改 `server/config/index.js` 中的 PORT |
| 无法访问 | 检查防火墙，允许 3001 端口 |
| npm 不可用 | 重新安装 Node.js，重启终端 |
| 依赖错误 | 运行 `npm install --legacy-peer-deps` |

---

## 🎯 测试网站

部署成功后，可以测试以下功能：

- [ ] 首页加载正常
- [ ] 可以浏览物品列表
- [ ] API 接口 `/api/health` 返回 200
- [ ] 可以上传图片
- [ ] 可以发布二手物品

---

**祝你使用愉快！** 🎉
