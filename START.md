# 🚀 校园二手交易平台 - 本地启动指南

## ⚡ 最快方式（推荐）

### 只需 3 步！

**1️⃣ 安装 Node.js**
- 下载: https://nodejs.org/ (选 LTS 版本)
- 安装后重启终端

**2️⃣ 双击启动脚本**
```
START_LOCAL.bat
```
脚本会自动:
- ✅ 安装依赖
- ✅ 构建前端
- ✅ 启动后端
- ✅ 显示访问地址

**3️⃣ 在浏览器打开**
```
http://你的IP:3001
```

---

## 🎯 快速参考

| 需要 | 查看文件 |
|------|---------|
| **快速启动** | 双击 `START_LOCAL.bat` |
| **快速参考** | 打开 `QUICK_START.md` |
| **详细指南** | 阅读 `LOCAL_SETUP.md` |
| **云部署** | 参考 `deploy/README.md` |
| **检查环境** | 双击 `CHECK_ENV.bat` |

---

## 📱 在其他设备访问

### 获取电脑 IP
```powershell
# 打开 PowerShell/CMD，输入:
ipconfig

# 找到 IPv4 地址，通常是 192.168.x.x
```

### 其他设备访问
```
http://192.168.x.x:3001   (替换成你的实际 IP)
```

---

## 🆘 遇到问题？

| 问题 | 解决方案 |
|------|---------|
| npm 未识别 | 安装 Node.js 后重启终端 |
| 无法访问 | 检查防火墙允许 3001 端口 |
| 端口占用 | 修改 `server/config/index.js` 的 PORT 值 |

---

## 📂 项目文件说明

```
START_LOCAL.bat          ← 自动启动脚本 ⭐ 推荐
CHECK_ENV.bat            ← 环境检查工具
FIX_CONFIG.bat           ← 配置修复工具
DEPLOYMENT_SUMMARY.md    ← 部署总结
QUICK_START.md          ← 快速参考（一页纸）
LOCAL_SETUP.md          ← 详细部署指南

client/                  ← 前端代码
server/                  ← 后端代码
database/               ← 数据库初始化脚本
deploy/                 ← 阿里云部署脚本
```

---

## 🎉 开始吧！

```bash
# 双击 START_LOCAL.bat 一键启动！
```

有问题? 查看 `DEPLOYMENT_SUMMARY.md` 或 `LOCAL_SETUP.md`

