# iOS App Store 上架指南

## 步骤 1：安装 Capacitor

```bash
# 安装 Capacitor CLI
npm install @capacitor/core @capacitor/cli

# 初始化 Capacitor
npx cap init

# 提示输入：
# App name: 拾光
# App ID: com.yourcompany.glimmer
# (使用反向域名格式)
```

## 步骤 2：安装 iOS 平台

```bash
# 添加 iOS 平台
npm install @capacitor/ios
npx cap add ios
```

## 步骤 3：构建 Web 应用

```bash
# 构建 React 应用
npm run build

# 同步到原生项目
npx cap sync ios
```

## 步骤 4：配置 Capacitor

创建或修改 `capacitor.config.json`：

```json
{
  "appId": "com.yourcompany.glimmer",
  "appName": "拾光",
  "webDir": "build",
  "bundledWebRuntime": false,
  "ios": {
    "contentInset": "always",
    "backgroundColor": "#0a0a1a"
  },
  "plugins": {
    "SplashScreen": {
      "launchShowDuration": 2000,
      "backgroundColor": "#0a0a1a",
      "showSpinner": false
    }
  }
}
```

## 步骤 5：在 Xcode 中打开项目

```bash
# 打开 iOS 项目
npx cap open ios
```

这会在 Xcode 中打开项目。

## 步骤 6：配置 Xcode 项目

### 6.1 配置 App 信息

在 Xcode 中：

1. 选择项目根节点 "App"
2. 在 "General" 标签页：
   - **Display Name**: 拾光
   - **Bundle Identifier**: com.yourcompany.glimmer
   - **Version**: 1.0.0
   - **Build**: 1
   - **Deployment Target**: iOS 13.0 或更高

### 6.2 配置签名和能力

1. 在 "Signing & Capabilities" 标签页
2. 选择你的 **Team**（Apple Developer Account）
3. 勾选 **Automatically manage signing**

### 6.3 添加必要的权限（Info.plist）

在 Xcode 中，打开 `App/Info.plist`，添加：

```xml
<!-- 麦克风权限（用于语音输入） -->
<key>NSMicrophoneUsageDescription</key>
<string>拾光需要使用麦克风进行语音记录</string>

<!-- 相册权限（用于保存分享图片） -->
<key>NSPhotoLibraryAddUsageDescription</key>
<string>拾光需要保存幸福瞬间到相册</string>

<!-- 禁用黑暗模式（如果需要） -->
<key>UIUserInterfaceStyle</key>
<string>Dark</string>
```

## 步骤 7：准备应用图标

### 7.1 图标尺寸需求

在 `ios/App/App/Assets.xcassets/AppIcon.appiconset/` 中需要：

- 1024x1024 (App Store)
- 180x180 (iPhone 3x)
- 120x120 (iPhone 2x)
- 167x167 (iPad Pro)
- 152x152 (iPad 2x)
- 其他尺寸...

### 7.2 推荐工具

使用在线工具自动生成所有尺寸：
- https://www.appicon.co/
- https://appicon.build/

上传你的 1024x1024 设计稿，下载所有尺寸。

## 步骤 8：配置启动屏幕

编辑 `ios/App/App/Assets.xcassets/Splash.imageset/`

或者使用 Capacitor Splash Screen 插件：

```bash
npm install @capacitor/splash-screen
```

## 步骤 9：处理本地存储

Capacitor 会自动将 `localStorage` 映射到原生存储，无需额外配置。

但建议安装 Capacitor Storage 以获得更好的性能：

```bash
npm install @capacitor/preferences

# 在代码中替换 localStorage
import { Preferences } from '@capacitor/preferences';

// 保存
await Preferences.set({ key: 'userData', value: JSON.stringify(data) });

// 读取
const { value } = await Preferences.get({ key: 'userData' });
const data = JSON.parse(value);
```

## 步骤 10：测试应用

### 10.1 在模拟器中测试

在 Xcode 中：
1. 选择模拟器（如 iPhone 14 Pro）
2. 点击运行按钮 (▶️)

### 10.2 在真机上测试

1. 连接你的 iPhone
2. 在 Xcode 中选择你的设备
3. 点击运行

## 步骤 11：准备上架材料

### 11.1 应用截图

需要准备不同尺寸的截图：

- **6.7" Display** (iPhone 14 Pro Max): 1290 x 2796 像素
- **6.5" Display** (iPhone 11 Pro Max): 1242 x 2688 像素
- **5.5" Display** (iPhone 8 Plus): 1242 x 2208 像素
- **12.9" iPad Pro**: 2048 x 2732 像素

每个尺寸需要 3-10 张截图。

**截图内容建议**：
1. Onboarding 引导页面
2. 早晨流程示例
3. 晚间流程示例
4. 昨日约定提醒页面
5. 7天幸福罐子动画

### 11.2 隐私政策

创建一个隐私政策页面，说明：
- 数据存储在本地
- 不收集任何个人信息
- 不上传到服务器
- 麦克风权限仅用于语音输入

可以使用工具生成：
- https://www.privacypolicygenerator.info/
- https://app-privacy-policy-generator.firebaseapp.com/

上传到你的网站或 GitHub Pages。

### 11.3 应用描述

**中文描述**：
```
拾光 · Glimmer - 温柔陪伴你的心理建设空间

每天只需5分钟，用温柔的方式陪伴你注意生活微光。

✨ 核心功能
• 早晨唤醒：3个温柔的问题，开启美好的一天
• 晚间复盘：记录今日的小美好，不带评判地觉察
• 昨日约定：温柔提醒，给你完全的选择权
• 7天幸福罐子：拍立得影集，回顾你的美好瞬间
• 语音输入：AI智能提取，自然表达

💜 设计理念
• 不要求你完美，只要求你真实
• 不是任务管理，而是温柔陪伴
• 完全本地存储，你的日记只属于你

🌟 基于积极心理学和神经可塑性原理
通过每天的温柔觉察，逐步改善情绪，减少内耗，发现生活中的微光。
```

**关键词**：
日记,心理健康,正念,情绪管理,自我关怀,积极心理学,冥想,感恩日记,情绪日记,心理建设

### 11.4 应用分类

主要类别：**健康健美**
次要类别：**生活** 或 **效率**

年龄分级：**4+**（适合所有年龄）

## 步骤 12：构建发布版本

### 12.1 设置发布配置

在 Xcode 中：
1. 选择 "Product" > "Scheme" > "Edit Scheme"
2. 选择 "Run"
3. 将 "Build Configuration" 改为 **Release**

### 12.2 Archive 应用

1. 在 Xcode 中选择 **Generic iOS Device** 或你的设备
2. 选择 "Product" > "Archive"
3. 等待构建完成（几分钟）

### 12.3 上传到 App Store Connect

1. 构建完成后会自动打开 Organizer
2. 选择刚才的 Archive
3. 点击 "Distribute App"
4. 选择 "App Store Connect"
5. 点击 "Upload"
6. 等待上传完成（可能需要10-30分钟）

## 步骤 13：在 App Store Connect 中配置

### 13.1 创建应用

1. 访问 https://appstoreconnect.apple.com/
2. 点击 "我的 App"
3. 点击 "+" 按钮，选择 "新建 App"
4. 填写：
   - **平台**: iOS
   - **名称**: 拾光
   - **主要语言**: 简体中文
   - **套装 ID**: com.yourcompany.glimmer
   - **SKU**: glimmer-ios-2026
   - **用户访问权限**: 完全访问权限

### 13.2 填写应用信息

在 "App 信息" 页面：
- **名称**: 拾光
- **字幕**: 温柔陪伴你的心理建设空间（最多30字）
- **类别**: 健康健美
- **内容权限**: 无

### 13.3 创建版本

1. 点击 "准备提交"
2. 选择刚才上传的构建版本
3. 填写：
   - **截图**（上传准备好的截图）
   - **描述**（应用介绍）
   - **关键词**
   - **支持 URL**（你的网站或 GitHub）
   - **营销 URL**（可选）
   - **隐私政策 URL**（必需）

### 13.4 App 隐私

在 "App 隐私" 部分：
1. 点击 "开始使用"
2. 数据收集：选择 **"否，我们不会从此 App 收集数据"**
3. 确认并保存

### 13.5 年龄分级

填写问卷，根据内容：
- 无暴力、色情、恐怖内容
- 最终分级应该是 **4+**

## 步骤 14：提交审核

1. 检查所有信息是否填写完整
2. 点击右上角 "添加以供审核"
3. 回答审核问卷：
   - **广告标识符**: 否
   - **内容版权**: 确认你拥有所有内容的版权
   - **出口合规性**: 
     - 是否包含加密？否（本地存储不算）
4. 点击 "提交以供审核"

## 步骤 15：等待审核

- **审核时间**: 通常 1-3 天
- **审核状态**: 在 App Store Connect 中查看
- **可能的拒绝原因**：
  - 崩溃或 bug
  - 缺少隐私政策
  - 功能不完整
  - 元数据问题

如果被拒绝：
1. 阅读拒绝理由
2. 修复问题
3. 重新提交

## 🎉 上架成功！

审核通过后，你的应用就会出现在 App Store 中！

---

## 📊 后续优化建议

### 1. 添加更多原生功能

```bash
# 通知提醒
npm install @capacitor/local-notifications

# 分享功能增强
npm install @capacitor/share

# 应用评分
npm install @capacitor/app-rate
```

### 2. 监控和分析

考虑添加：
- Crashlytics（崩溃报告）
- Firebase Analytics（使用分析）
- App Store 评价提醒

### 3. 持续更新

- 定期修复 bug
- 添加新功能
- 响应用户反馈

---

## ⚠️ 常见问题

### Q1: 构建失败
**A**: 检查 Xcode 版本、证书配置、依赖安装

### Q2: 真机测试失败
**A**: 检查 Provisioning Profile、设备是否添加到开发者账号

### Q3: 审核被拒
**A**: 仔细阅读拒绝理由，逐一修复问题

### Q4: localStorage 数据丢失
**A**: 使用 Capacitor Preferences API 代替 localStorage

### Q5: 语音识别不工作
**A**: 检查 Info.plist 中的麦克风权限配置

---

## 📞 需要帮助？

如果遇到问题，可以：
1. 查看 Capacitor 官方文档：https://capacitorjs.com/
2. 查看 Apple 开发者文档：https://developer.apple.com/
3. Stack Overflow 搜索相关问题
4. Apple 开发者论坛

---

祝你上架顺利！🎉
