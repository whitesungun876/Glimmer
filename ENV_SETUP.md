# 环境变量配置指南 ⚙️

## 创建 .env 文件

在项目根目录创建 `.env` 文件：

```bash
touch .env
```

## 配置内容

将以下内容复制到 `.env` 文件中：

```bash
# ============= 前端配置 =============
# 前端只需要知道后端地址（用于今日萤火、好友相关等功能）
REACT_APP_API_URL=http://localhost:4000

# ============= 应用配置 =============
REACT_APP_NAME=5分钟
REACT_APP_VERSION=1.0.0

# ============= 开发模式 =============
NODE_ENV=development
```

## 获取通义千问 / 万相 API Key（配置在后端）

重要：**不要把 API Key 放在前端 `.env`（REACT_APP_*）里**，否则会被打进浏览器代码，存在泄露风险。

请在 `server/.env` 配置：

```bash
cd server
cp .env.example .env
# 然后编辑 server/.env 填入你的 DASHSCOPE_API_KEY、DATABASE_URL 等
```

`server/.env` 示例（仅示意）：

```bash
DASHSCOPE_API_KEY=sk-your-dashscope-api-key-here
# LLM（千问）走 OpenAI 兼容模式
DASHSCOPE_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
DASHSCOPE_MODEL=qwen-turbo
DATABASE_URL=postgresql://user:password@localhost:5432/glimmer
PORT=4000
```

## 获取通义千问 / 万相 API Key

### 步骤 1：注册阿里云账号
https://www.aliyun.com/

### 步骤 2：开通通义千问服务
https://dashscope.aliyun.com/

点击"开通服务"，免费开通：
- ✅ 通义千问大模型
- ✅ 语音识别（可选）

### 步骤 3：创建 API Key
https://dashscope.console.aliyun.com/apiKey

点击"创建 API-KEY"，复制密钥。

### 步骤 4：填入配置
将获取的 API Key 替换 `.env` 文件中的 `sk-your-dashscope-api-key-here`

## 验证配置

### 方法 1：启动应用检查

```bash
npm start
```

打开浏览器控制台，如果配置正确，会看到：
```
通义千问 API 已配置
```

### 方法 2：代码检查

在浏览器控制台运行：
```javascript
console.log(process.env.REACT_APP_DASHSCOPE_API_KEY);
```

应该显示你的 API Key（不是 undefined）

## 安全注意事项

### ⚠️ 重要：保护你的 API Key

1. **不要提交到 Git**
   - `.env` 已在 `.gitignore` 中
   - 提交前检查：`git status`

2. **不要分享**
   - 不要截图包含 API Key
   - 不要发到公开论坛

3. **定期更换**
   - 如果泄露，立即删除并重新创建

4. **限制权限**
   - 在阿里云控制台设置 IP 白名单
   - 设置每日调用上限

## 无 API Key 使用

如果不配置 API Key，应用仍可使用：

### ✅ 可用功能
- 文字输入
- 浏览器语音识别（免费但准确率较低）
- 基础文本清理（移除语气词）
- 所有 UI 功能

### ❌ 不可用功能
- 高精度语音识别
- AI 文本美化
- AI 结构化提炼
- 情感分析

## 降级策略

应用会自动检测 API 配置：

```javascript
// 自动降级逻辑
if (!DASHSCOPE_API_KEY) {
  console.warn('未配置 API Key，使用降级方案');
  // 使用浏览器 Web Speech API
  // 使用正则表达式清理文本
}
```

## 环境变量说明

| 变量名 | 必需 | 说明 | 默认值 |
|--------|------|------|--------|
| `REACT_APP_DASHSCOPE_API_KEY` | 否 | 通义千问 API 密钥 | - |
| `REACT_APP_OPENAI_API_KEY` | 否 | OpenAI API 密钥 | - |
| `REACT_APP_NAME` | 否 | 应用名称 | 5分钟 |
| `REACT_APP_VERSION` | 否 | 应用版本 | 1.0.0 |
| `NODE_ENV` | 是 | 运行环境 | development |

## 不同环境配置

### 开发环境（本地）
使用 `.env` 文件

### 生产环境
根据部署平台配置：

**Vercel**
```bash
vercel env add REACT_APP_DASHSCOPE_API_KEY
```

**Netlify**
在 `Site settings > Environment variables` 添加

**自建服务器**
在服务器上创建 `.env` 文件

## 常见问题

### Q: 修改 .env 后不生效？
A: 需要重启开发服务器：
```bash
# 按 Ctrl+C 停止
npm start  # 重新启动
```

### Q: API Key 无效？
A: 检查：
1. 是否开通了服务
2. 是否复制完整（包含 `sk-` 前缀）
3. 是否设置了 IP 限制
4. 余额是否充足

### Q: 如何切换到 OpenAI？
A: 修改代码：
```javascript
// 将所有
import { ... } from './qwenAI';
// 改为
import { ... } from './openAI';
```

### Q: 成本控制？
A: 在阿里云控制台设置：
- 每日调用上限
- 每月消费上限
- 异常告警

## 成本优化建议

### 1. 使用缓存
```javascript
// 避免重复处理相同文本
const cache = new Map();
```

### 2. 降低频率
```javascript
// 只在必要时调用 AI
if (text.length > 50) {
  await beautifyWithQwen(text);
}
```

### 3. 使用更便宜的模型
```javascript
model: 'qwen-turbo'  // 而非 'qwen-plus'
```

### 4. 监控使用量
定期检查控制台的用量统计。

## 获取帮助

- 📖 [通义千问文档](https://help.aliyun.com/zh/dashscope/)
- 💬 [阿里云论坛](https://developer.aliyun.com/ask/)
- 🆘 提交 Issue

---

配置完成后，开始体验 AI 智能功能吧！🎉
