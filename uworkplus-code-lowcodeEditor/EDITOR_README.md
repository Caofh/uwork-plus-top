# 低代码编辑器

这是一个基于 Vue 3 + TypeScript + Element Plus 构建的低代码拖拽编辑器。

## 功能特性

### 🎨 拖拽设计
- **左侧组件库**：提供丰富的组件模块，支持拖拽到画布
- **中间画布区域**：可视化编辑区域，支持组件拖拽、选择、编辑
- **右侧属性面板**：实时编辑选中组件的属性

### 📱 响应式设计
- 支持桌面端、平板端、手机端三种视图模式
- 自适应布局，在不同设备上都有良好的体验

### 🧩 组件系统
- **基础组件**：文本、图片、按钮
- **布局组件**：容器、行、列
- **表单组件**：输入框、选择器

### ⚡ 核心功能
- 组件拖拽添加
- 组件选择与编辑
- 属性实时预览
- 组件层级调整
- 组件复制删除
- 数据本地保存

## 使用方法

### 1. 添加组件
从左侧组件库拖拽组件到中间画布区域即可添加组件。

### 2. 编辑组件
点击画布中的组件，右侧会显示对应的属性编辑面板，可以实时修改组件属性。

### 3. 组件操作
选中组件后，可以通过工具栏进行以下操作：
- 上移/下移：调整组件层级
- 复制：复制当前组件
- 删除：删除当前组件

### 4. 保存与发布
- **保存**：将当前设计保存到本地存储
- **预览**：预览当前设计效果（开发中）
- **发布**：发布设计到线上（开发中）

## 技术栈

- **Vue 3**：渐进式 JavaScript 框架
- **TypeScript**：类型安全的 JavaScript
- **Element Plus**：Vue 3 组件库
- **Tailwind CSS**：原子化 CSS 框架
- **@vueuse/core**：Vue 组合式 API 工具库
- **vuedraggable**：Vue 拖拽组件

## 项目结构

```
src/
├── components/editor/          # 编辑器组件
│   ├── ModuleList.vue         # 左侧组件库
│   ├── CanvasArea.vue         # 中间画布区域
│   ├── PropertyPanel.vue      # 右侧属性面板
│   └── components/            # 可拖拽的组件
│       ├── TextComponent.vue
│       ├── ButtonComponent.vue
│       └── ContainerComponent.vue
└── views/editor/              # 编辑器页面
    └── index.vue              # 主编辑器页面
```

## 开发说明

### 添加新组件

1. 在 `src/components/editor/components/` 目录下创建新的组件文件
2. 在 `ModuleList.vue` 中的 `moduleCategories` 数组中添加新组件配置
3. 在 `CanvasArea.vue` 中的 `componentMap` 对象中注册新组件
4. 在 `PropertyPanel.vue` 中添加对应的属性编辑逻辑

### 自定义样式

所有样式都使用 SCSS 编写，支持嵌套和变量。主要样式文件：
- 组件样式在各组件文件中定义
- 全局样式在 `src/assets/` 目录下

## 浏览器支持

- Chrome >= 87
- Firefox >= 78
- Safari >= 14
- Edge >= 88

## 许可证

MIT License
