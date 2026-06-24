# Electron Loading 过渡效果

## 功能说明

为了解决Electron应用在访问web页面前的空白问题，我们实现了一个双窗口的loading过渡效果：

1. **Loading窗口**: 应用启动时立即显示，包含美观的动画效果
2. **主窗口**: 在后台加载web页面，加载完成后切换到主窗口

## 实现原理

### 1. 双窗口架构
- `createLoadingWindow()`: 创建并显示loading窗口
- `createMainWindow()`: 创建主窗口并加载web页面
- 当主窗口准备就绪时，隐藏loading窗口并显示主窗口

### 2. Loading页面特性
- 无边框窗口设计，更加美观
- 动态进度条和加载文本
- 粒子动画和网格线效果
- 渐变背景和Logo动画

### 3. 平滑过渡
- 主窗口加载完成后自动切换
- 避免白屏闪烁
- 用户体验更加流畅

## 文件结构

```
electron/
├── main.js              # 主进程文件，包含窗口管理逻辑
├── loading.html         # Loading页面
├── test-loading.js      # 测试loading页面的脚本
└── LOADING_README.md    # 本说明文档
```

## 使用方法

### 正常启动应用
```bash
cd electron
npm start
```

### 测试Loading页面
```bash
cd electron
node test-loading.js
```

## 自定义配置

### 修改Loading页面样式
编辑 `loading.html` 文件中的CSS样式

### 调整窗口大小和位置
在 `main.js` 中修改以下参数：
```javascript
const winWidth = 1080;   // 窗口宽度
const winHeight = 720;   // 窗口高度
const x = screenWidth - winWidth - 20;  // X坐标
const y = 50;            // Y坐标
```

### 修改加载时间
调整 `createWindow()` 函数中的延迟时间：
```javascript
setTimeout(() => {
  createMainWindow();
}, 500);  // 500ms延迟
```

## 技术细节

### 窗口管理
- 使用 `BrowserWindow` 创建窗口
- 通过 `ready-to-show` 事件控制显示时机
- 自动销毁loading窗口释放资源

### 动画效果
- CSS3动画实现流畅的视觉效果
- JavaScript动态创建粒子效果
- 响应式设计适配不同屏幕

### 性能优化
- 延迟创建主窗口减少启动时间
- 及时销毁loading窗口释放内存
- 使用硬件加速提升动画性能

## 注意事项

1. 确保 `loading.html` 文件路径正确
2. 主窗口加载失败时loading窗口会一直显示
3. 开发环境下可能需要调整延迟时间
4. 生产环境建议优化图片和动画资源 