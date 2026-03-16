# 拾光 Glimmer ✨

> 极简、私密、治愈系的心理建设工具

每天 5 分钟，为自己创造一点光亮。

## 🌟 产品定位

一款专为追求生活品质、有精神内控压力、希望改善情绪的中国年轻群体打造的心理建设工具。

**核心理念**：通过微观引导，帮助用户在日常生活中发现美好、建立意向、温和复盘。

---

## 🚀 快速开始

### 1. 进入项目并安装依赖

```bash
cd /path/to/5-minutes-app   # 替换为你的项目路径
npm run install:all         # 前端 + server 依赖一并安装
```

或分别安装：

```bash
npm install
cd server && npm install
```

### 2. 配置环境变量（可选）

- **前端**：复制 `.env.example` 为 `.env`，配置 `REACT_APP_API_URL` 指向后端地址（不配置则部分接口不可用）。
- **后端**：`server/.env` 参考 `server/.env.example`，配置 `OPENAI_API_KEY`（或 DASHSCOPE）用于 Daily Spark 等 AI 能力。

详见 [ENV_SETUP.md](./ENV_SETUP.md)。

### 3. 启动

**仅前端（开发）：**

```bash
npm start
```

浏览器访问 `http://localhost:3000`。

**后端 API（若需 Daily Spark / 邀请 / 共鸣等）：**

```bash
cd server
npm run dev   # 或 npm start
```

### 4. 构建与 iOS 运行

```bash
npm run build
npx cap sync ios
```

在 Xcode 中打开 `ios/App/App.xcworkspace`，选择模拟器或真机后 ⌘R 运行。

- 更快、更省内存的构建：`npm run build:fast` 或设置 `.env.production` 中 `GENERATE_SOURCEMAP=false`。
- 详细步骤见 [IOS_SETUP.md](./IOS_SETUP.md)。

---

## 📁 项目结构

```
5-minutes-app/
├── public/
│   ├── index.html
│   └── images/              # 引导页图片（如 persona-before/after）
├── src/
│   ├── components/
│   │   ├── Onboarding/      # 新手引导（6 步）
│   │   │   ├── Onboarding.jsx
│   │   │   ├── PureWelcomeScreen.jsx      # 1. 欢迎页
│   │   │   ├── ScienceBackingScreen.jsx   # 2. 科学背书（上滑逐段呈现）
│   │   │   ├── PersonaStoryScreen.jsx     # 3. 虚拟故事 小禾 Before/After
│   │   │   ├── GrowthCurveScreen.jsx      # 4. 成长曲线（交互图表）
│   │   │   ├── FeatureJourneyScreen.jsx   # 5. 功能介绍（卡片轮播）
│   │   │   └── GoalContractScreen.jsx     # 6. 目标设定与心理契约
│   │   ├── MainApp/         # 主应用
│   │   │   ├── MainApp.jsx
│   │   │   ├── Welcome.jsx
│   │   │   ├── MorningRoutine.jsx
│   │   │   └── EveningRoutine.jsx
│   │   ├── DailySpark/      # 每日萤火（AI 生成摘要与图片）
│   │   ├── Galaxy/          # 双人星轨 / 共鸣
│   │   ├── Achievement/     # 坚持计数、幸福罐子
│   │   ├── Share/           # 分享卡片
│   │   ├── Energy/          # 能量接收
│   │   └── Validation/      # 校验弹窗
│   ├── utils/               # API 封装、成就、邀请等
│   ├── styles/
│   ├── App.jsx
│   └── index.js
├── server/                  # 后端 API
│   ├── index.js
│   ├── routes/              # dailySpark, energy, invite, resonance, validation
│   ├── services/            # dailySparkLLM, dailySparkImage
│   ├── db/                  # 表结构、Daily Spark 等
│   └── prompts/
├── ios/                     # Capacitor iOS 工程
├── scripts/
│   └── install-deps.sh      # 一键安装前后端依赖
├── package.json
├── capacitor.config.ts
└── README.md
```

---

## 🎨 技术栈

| 层级     | 技术 |
|----------|------|
| 前端     | React 18、Create React App、CSS3 |
| 移动端   | Capacitor（iOS） |
| 请求/UI  | axios、html2canvas、qrcode.react |
| 后端     | Node.js、Express、可选 Postgres |
| AI/日报  | OpenAI 兼容 API（Daily Spark：VIA 人格力量 + 马斯洛） |

---

## 🌈 核心功能概览

- **新手引导**：6 步（欢迎 → 科学背书 → 小禾故事 → 成长曲线 → 功能介绍 → 目标契约），支持上滑阅读、逐段呈现、卡片轮播与交互图表。
- **晨间 / 晚间**：简短问题、智能提示、语音/文字双模输入，完成后可生成「每日萤火」摘要与意象图。
- **每日萤火 (Daily Spark)**：基于积极心理学词库与 LLM，输出 core_trait、情绪色、摘要句与抽象符号描述（可配图）。
- **坚持计数与幸福罐子**：连续天数、7 天罐子开启动画、拍立得回顾与分享。
- **邀请与共鸣**：邀请码、好友列表、双人星轨图与共鸣数据。
- **分享**：生成分享卡片并保存到相册。

---

## 🔧 常用脚本

| 命令 | 说明 |
|------|------|
| `npm start` | 开发环境启动前端 |
| `npm run build` | 生产构建（受 `.env.production` 影响） |
| `npm run build:fast` | 关闭 source map 的快速构建 |
| `npm run install:all` | 安装根目录 + server 依赖 |
| `npx cap sync ios` | 将 build 同步到 iOS 工程 |

---

## 📖 文档索引

| 文档 | 说明 |
|------|------|
| [QUICKSTART.md](./QUICKSTART.md) | 快速上手指南 |
| [FEATURES.md](./FEATURES.md) | 功能说明 |
| [ENV_SETUP.md](./ENV_SETUP.md) | 环境变量配置 |
| [IOS_SETUP.md](./IOS_SETUP.md) | iOS 构建与运行 |
| [server/README.md](./server/README.md) | 后端 API 与数据库 |
| [ACHIEVEMENT_SYSTEM.md](./ACHIEVEMENT_SYSTEM.md) | 成就系统 |
| [AI_INTEGRATION.md](./AI_INTEGRATION.md) | AI 集成 |
| [QWEN_INTEGRATION.md](./QWEN_INTEGRATION.md) | 通义千问集成 |
| [APP_STORE_DESCRIPTION.md](./APP_STORE_DESCRIPTION.md) | 应用商店描述 |

---

## 🎯 设计原则

- **微观引导**：聚焦「窗外的树」「温水的温度」等微小瞬间。
- **意向而非任务**：「午休时认真听一首歌」而非「完成 XX 任务」。
- **不带评判的觉察**：「今天有什么新发现」而非「哪里做错了」。
- **可实现性**：建议强调「小」和「可行」，对抗完美主义焦虑。

---

## 🌐 浏览器与运行环境

- Chrome 90+、Safari 14+、Firefox 88+、Edge 90+
- 语音输入需支持 Web Speech API（部分环境需 HTTPS）
- iOS 通过 Capacitor 打包为原生壳，内嵌 WebView

---

## 📄 许可证与贡献

- MIT License  
- 欢迎 Issue 与 Pull Request。

---

**记住**：每天只需 5 分钟，为自己创造一点光亮 ✨
