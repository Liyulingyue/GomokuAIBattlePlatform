# Gomoku AI Battle Platform

一个支持单人/多人对战和多模型接入的五子棋 AI 实验平台。后端基于 FastAPI 提供房间管理、AI 推理调度与聊天记录等服务；前端基于 React + Vite 提供现代化的操作界面，支持房主执棋颜色控制、AI 配置锁定、战斗日志、聊天与实时房间同步等体验。

## ✨ 主要特性

- **多模型接入**：兼容任何提供 OpenAI 风格接口的模型服务（如百度文心一言、OpenAI、私有化推理服务等）。
- **单人 AI 测试**：便捷地调试提示词、切换模型、回看棋谱；支持逐步确认 AI 落子。
- **多人对战大厅**：房间自动分配房主、支持房主执棋颜色调整、准备/锁定机制、离开自动移交房主。
- **实时日志与聊天**：战斗日志可追踪每步决策，聊天室用于沟通协调。
- **自适应 UI**：首页滑块介绍、移动端兼容布局、主题色柔和渐变。

## 🧱 项目结构

```
GomokuAIBattlePlatform/
├── backend/          # FastAPI 服务端
│   ├── app/
│   │   ├── main.py   # FastAPI 入口
│   │   ├── gomoku.py # 核心对弈逻辑
│   │   └── ...
│   ├── requirements.txt
│   └── run.py        # 便捷启动脚本
├── frontend/         # React + Vite 前端
│   ├── src/
│   │   ├── pages/    # 首页、单人、多人页面
│   │   ├── components/
│   │   └── hooks/
│   └── package.json
└── README.md
```

## ⚙️ 环境要求

- Node.js ≥ 18（推荐 20）
- npm ≥ 9
- Python ≥ 3.10

## 🚀 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/Liyulingyue/GomokuAIBattlePlatform.git
cd GomokuAIBattlePlatform
```

### 2. 启动后端（FastAPI）

```bash
cd backend
python -m venv .venv
source .venv/bin/activate      # Windows 使用 .venv\Scripts\activate
pip install -r requirements.txt

# 开发模式启动
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

后端默认监听 `http://localhost:8000`，提供房间、对局、消息等 REST 接口。

### 3. 启动前端（React + Vite）

```bash
cd ../frontend
npm install

# 开发模式启动
npm run dev
```

默认访问地址为 `http://localhost:5173`。若后端地址不同，可在根目录创建 `.env` 文件或使用命令行注入：

```bash
# frontend/.env 或 .env.local
VITE_API_BASE_URL=http://your-backend-host:8000
```

前端内置 Axios 会读取 `VITE_API_BASE_URL`（未设置时默认 `http://localhost:8000`）。

### 4. 生产构建

```bash
# 前端打包
cd frontend
npm run build
npm run preview  # 可选，本地预览产物

# 后端部署可使用 uvicorn/gunicorn + Nginx，或容器化到任意云环境
```

## 🧩 常用功能说明

- **自动登录与用户名管理**：首次进入自动分配随机用户名，支持在导航栏修改并校验唯一性。
- **AI 配置锁定**：在多人对战中，房主可锁定自身或队友 AI 配置并设置准备状态。
- **房主执棋颜色控制**：对局开局前，房主可选择执黑或执白，并在玩家全部准备前随时调整。
- **房间清理**：后端定期清理长时间无人活动或空房间，保证大厅列表整洁。

## 📦 常见问题

1. **如何接入百度文心一言？**
	- 获取 API 地址：`https://aistudio.baidu.com/llm/lmapi/v3`
	- AccessToken：访问 [百度 AISTUDIO AccessToken](https://aistudio.baidu.com/account/accessToken)
	- 模型列表：参考 [官方模型文档](https://ai.baidu.com/ai-doc/AISTUDIO/rm344erns)
	- 将 URL、Key、Model 填入前端的 AI 配置面板。

2. **多人房间里别人离开了怎么办？**
	- 房主离开时系统会自动移交新房主，并将执棋颜色重置为黑。

3. **想调试 API 请求日志？**
	- 后端基于 FastAPI，可结合 `uvicorn --log-level debug`，或在 `app/main.py` 中添加自定义中间件。

## 🤝 贡献

欢迎提交 Issue、PR 或提出改进建议。请在提交前运行：

```bash
cd frontend && npm run lint
```

## 📄 许可证

本项目依据仓库根目录的 `LICENSE` 文件授权发布。

---

如需进一步集成模型或部署方案，请在 Issues 中交流。祝你对弈愉快、模型常胜！
