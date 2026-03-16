# 快速开始指南 🚀

## 1️⃣ 克隆项目

```bash
cd /Users/whitesungun/Downloads/5-minutes-app
```

## 2️⃣ 安装依赖

```bash
npm install
```

## 3️⃣ 配置通义千问 API（可选）

如果你想使用 AI 智能功能，需要配置通义千问 API：

### 步骤 1：注册阿里云账号
访问：https://www.aliyun.com/

### 步骤 2：开通通义千问服务
访问：https://dashscope.aliyun.com/

点击"开通服务"，开通以下服务：
- ✅ 通义千问大模型（Qwen）
- ✅ 实时语音识别（可选）

### 步骤 3：获取 API Key
访问：https://dashscope.console.aliyun.com/apiKey

点击"创建 API-KEY"

### 步骤 4：配置环境变量

复制示例文件：
```bash
cp .env.example .env
```

编辑 `.env` 文件，填入你的 API Key：
```bash
REACT_APP_DASHSCOPE_API_KEY=sk-你的API密钥
```

**重要**：不要把 `.env` 文件提交到 Git！

## 4️⃣ 启动应用

```bash
npm start
```

应用会在 http://localhost:3000 自动打开

## 5️⃣ 测试功能

### 基础功能（无需 API）
1. ✅ 完成 Onboarding 流程
2. ✅ 选择晨间唤醒或晚间复盘
3. ✅ 文字输入测试
4. ✅ 点击提示气泡
5. ✅ 查看昼夜主题切换

### AI 功能（需要 API Key）
1. ✅ 长按语音输入按钮
2. ✅ 说话后松开
3. ✅ 查看 AI 美化效果
4. ✅ 测试动态引导（10秒不输入）

## 📱 浏览器要求

- ✅ Chrome 90+（推荐）
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ Firefox 88+

**注意**：语音功能需要 HTTPS 或 localhost

## 🔧 常见问题

### Q: npm install 失败
A: 尝试使用淘宝镜像：
```bash
npm install --registry=https://registry.npmmirror.com
```

### Q: 语音识别不工作
A: 检查：
1. 是否允许麦克风权限
2. 是否配置了 API Key
3. 浏览器是否支持录音
4. 是否在 HTTPS 或 localhost 环境

### Q: AI 美化不生效
A: 检查：
1. `.env` 文件是否存在
2. API Key 是否正确
3. 是否重启了开发服务器
4. 控制台是否有错误信息

### Q: 成本问题
A: 
- 使用浏览器自带语音识别（免费）
- 或使用通义千问（约 ¥0.06/月/用户）
- 详见 `QWEN_INTEGRATION.md`

## 📚 进阶阅读

- 📖 [功能详解](./FEATURES.md) - 了解所有功能
- 🤖 [AI 集成指南](./AI_INTEGRATION.md) - OpenAI 集成
- 🇨🇳 [通义千问集成](./QWEN_INTEGRATION.md) - 推荐中国用户
- 📝 [README](./README.md) - 项目概览

## 🎯 下一步

### 初学者
1. 完成 Onboarding
2. 体验晨间唤醒和晚间复盘
3. 尝试不同的输入方式

### 开发者
1. 查看代码结构
2. 自定义提示词
3. 修改主题颜色
4. 集成真实 AI API

### 产品经理
1. 体验完整流程
2. 记录用户反馈
3. 规划新功能
4. 设计增长策略

## 💡 使用技巧

### 晨间唤醒
- ⏰ 早上起床后 5 分钟内完成
- 🎯 专注当下，不要想太多
- 💭 允许自己感激小事

### 晚间复盘
- 🌙 睡前 10 分钟完成
- 📝 用语音长篇倾诉
- 🤗 温柔对待自己

### 长期使用
- 📅 坚持 21 天养成习惯
- 📊 定期查看历史记录
- 🎉 庆祝小成就

## 🆘 获取帮助

- 💬 提交 Issue
- 📧 发送邮件
- 📖 查阅文档

---

**开始你的 5 分钟心理建设之旅吧！** ✨
