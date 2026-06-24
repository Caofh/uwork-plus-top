# UpdateManagerDialog 组件

这是一个用于展示软件更新下载进度的弹窗组件，支持完整的更新流程展示。

## 功能特性

- 🚀 **多状态展示**: 更新信息、下载进度、安装进度、完成状态、错误状态
- 📊 **实时进度**: 显示下载和安装的实时进度条
- 🎨 **美观界面**: 使用Element Plus组件库，支持响应式设计
- ⚡ **交互友好**: 支持取消下载、重试、重启等操作
- 📱 **响应式**: 支持移动端和桌面端显示

## 使用方法

### 基础用法

```vue
<template>
  <div>
    <el-button @click="showUpdate = true">检查更新</el-button>

    <UpdateManagerDialog v-model="showUpdate" />
  </div>
</template>

<script setup>
  import { ref } from 'vue'
  import UpdateManagerDialog from './components/UpdateManagerDialog.vue'

  const showUpdate = ref(false)
</script>
```

### 演示模式

```vue
<template>
  <UpdateManagerDialog v-model="showUpdate" :demo="true" />
</template>
```

演示模式会显示模拟的更新信息，方便开发和测试。

## Props

| 参数       | 类型    | 默认值 | 说明              |
| ---------- | ------- | ------ | ----------------- |
| modelValue | Boolean | false  | 控制弹窗显示/隐藏 |
| demo       | Boolean | false  | 是否为演示模式    |

## Events

| 事件名            | 说明                   | 回调参数         |
| ----------------- | ---------------------- | ---------------- |
| update:modelValue | 弹窗显示状态改变时触发 | (value: boolean) |

## 状态说明

### 1. 更新信息状态

- 显示新版本信息
- 版本描述和文件大小
- 提供"立即更新"和"稍后更新"按钮

### 2. 下载进度状态

- 实时下载进度条
- 显示下载速度
- 支持取消下载操作

### 3. 安装进度状态

- 安装进度条
- 显示当前安装步骤
- 自动切换到下一步

### 4. 更新完成状态

- 成功图标和提示
- 提供"立即重启"和"稍后重启"选项

### 5. 错误状态

- 错误图标和描述
- 提供"重试"和"关闭"选项

## 样式定制

组件使用SCSS编写，支持深度选择器定制样式：

```scss
.update-dialog {
  :deep(.el-dialog__header) {
    // 自定义头部样式
  }

  :deep(.el-dialog__body) {
    // 自定义内容区域样式
  }
}
```

## 响应式设计

组件内置响应式设计，在移动端会自动调整布局：

- 弹窗宽度调整为90%
- 按钮垂直排列
- 图标和文字大小适配

## 注意事项

1. 组件依赖Element Plus组件库
2. 需要安装@element-plus/icons-vue图标包
3. 当前版本使用模拟数据，实际使用时需要集成真实的更新API
4. 重启应用功能需要配合Electron的API实现

## 更新日志

### v1.0.0

- 初始版本
- 支持完整的更新流程展示
- 响应式设计
- 演示模式支持
