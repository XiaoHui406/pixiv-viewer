# PixivViewer

一个基于 uniapp 和 Vue3 开发的 Android 应用，将 Pixiv 网站封装为原生 APP。

## 功能特性

- 🌐 使用 WebView 加载 Pixiv 网站，提供原生应用体验
- 🔍 支持通过作品 ID 或画师 ID 快速查找内容
- 📱 适配 Android 状态栏，确保界面不被遮挡
- ⬅️ 支持 WebView 页面回退功能，不会意外退出应用
- 🎨 简洁的顶部工具栏设计

## 技术栈

- **框架**: uniapp
- **前端**: Vue 3 (Composition API)
- **语言**: TypeScript
- **平台**: Android (app-plus)

## 主要功能

### 1. WebView 浏览
- 全屏显示 Pixiv 网站内容
- 自动适配状态栏高度
- 支持页面滚动和交互

### 2. 快速查找
- 通过作品 ID 跳转到指定作品页面
- 通过画师 ID 跳转到指定画师主页
- 使用原生菜单和输入框，确保在 APP 端正常显示

### 3. 导航控制
- 支持 Android 返回键回退到上一页
- 当无法回退时自动退出应用

## 项目结构

```
PixivViewer/
├── pages/
│   └── index/
│       └── index.vue      # 主页面
├── static/                # 静态资源
│   ├── logo.png
│   └── more.png
├── App.vue                # 应用入口
├── main.js                # 主入口文件
├── manifest.json          # 应用配置
└── pages.json            # 页面配置
```

## 开发说明

### 环境要求

- HBuilderX 或 uniapp 开发环境
- Node.js (如果使用 npm 包管理)

### 运行项目

1. 使用 HBuilderX 打开项目
2. 选择运行到 Android 设备或模拟器
3. 或使用 uniapp CLI 进行开发

### 打包发布

1. 在 HBuilderX 中选择"发行" → "原生 App-云打包"
2. 配置 Android 打包参数
3. 等待打包完成并下载 APK

## 注意事项

- 本项目仅用于学习和研究目的
- 请遵守 Pixiv 的使用条款和版权规定
- 建议在合法合规的前提下使用

## License

MIT License

