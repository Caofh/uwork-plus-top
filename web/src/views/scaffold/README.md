# Git 仓库下载功能

## 功能概述

在 Electron 应用中添加了 Git 仓库下载功能，允许用户通过 Web 界面下载 Git 仓库到本地指定目录。

## 实现的功能

### 1. Electron 主进程功能

**文件**: `electron/main.js`

新增了 `downloadGitRepository` IPC 处理器：

```javascript
ipcMain.handle('downloadGitRepository', async (event, options) => {
  const { funcName, json } = options
  const {
    repositoryUrl = 'https://gitee.com/redorc/scaffold-2025.git',
    targetPath = '~/UWORK-PLUS-dev',
  } = json || {}

  // 实现逻辑...
})
```

**功能特性**:

- ✅ 支持自定义仓库地址和下载路径
- ✅ 自动创建目标目录（如果不存在）
- ✅ 检查仓库是否已存在，避免重复下载
- ✅ 完整的错误处理和状态反馈
- ✅ 支持中文路径

### 2. Preload 脚本暴露

**文件**: `electron/resources/preload.js`

```javascript
downloadGitRepository: args => ipcRenderer.invoke('downloadGitRepository', args)
```

### 3. Web 界面组件

**文件**: `web/src/views/scaffold/components/GitDownloadDialog.vue`

**功能特性**:

- ✅ 友好的用户界面
- ✅ 支持自定义仓库地址
- ✅ 路径选择功能
- ✅ 实时下载状态显示
- ✅ 错误处理和用户提示
- ✅ 响应式设计

## 使用方法

### 1. 在 Web 界面中使用

```vue
<template>
  <GitDownloadDialog
    v-model="showDownloadDialog"
    @success="handleDownloadSuccess"
    @error="handleDownloadError"
  />
</template>

<script setup>
  import { ref } from 'vue'
  import GitDownloadDialog from './components/GitDownloadDialog.vue'

  const showDownloadDialog = ref(false)

  const handleDownloadSuccess = data => {
    console.log('下载成功:', data.path)
  }

  const handleDownloadError = error => {
    console.error('下载失败:', error.message)
  }
</script>
```

### 2. 直接调用 Electron API

```javascript
import { jsBridge, isInElectron } from '@/utils/electron'

if (isInElectron()) {
  jsBridge.register({
    method: 'downloadGitRepository',
    json: {
      repositoryUrl: 'https://gitee.com/redorc/scaffold-2025.git',
      targetPath: '~/UWORK-PLUS-dev',
    },
    callback: result => {
      if (result.code === 0) {
        console.log('下载成功:', result.data.path)
      } else {
        console.error('下载失败:', result.message)
      }
    },
  })
}
```

## 返回结果格式

### 成功下载

```javascript
{
  code: 0,
  message: "Repository downloaded successfully",
  data: {
    path: "~/UWORK-PLUS-dev/scaffold-2025",
    output: "git clone 输出信息"
  }
}
```

### 仓库已存在

```javascript
{
  code: 1,
  message: "Repository already exists at /path/to/repo",
  data: {
    path: "/path/to/repo"
  }
}
```

### 下载失败

```javascript
{
  code: 2,
  message: "Failed to clone repository: 错误信息",
  data: {
    error: "详细错误信息"
  }
}
```

### 其他错误

```javascript
{
  code: 3,
  message: "Error during download process: 错误信息",
  data: {
    error: "详细错误信息"
  }
}
```

## 默认配置

- **默认仓库地址**: `https://gitee.com/redorc/scaffold-2025.git`
- **默认下载路径**: `~/UWORK-PLUS-dev`
- **仓库名称**: 自动从 URL 提取（如 `scaffold-2025`）

## 注意事项

1. **环境要求**: 需要在 Electron 环境中运行，需要系统安装 Git
2. **权限要求**: 确保有目标目录的写入权限
3. **网络要求**: 需要能够访问 Git 仓库地址
4. **路径安全**: 支持中文路径，使用双引号包围路径避免空格问题
5. **重复下载**: 如果仓库已存在，会提示用户而不是覆盖

## 集成到现有项目

在 `web/src/views/scaffold/index.vue` 中已经集成了下载功能：

1. 顶部导航栏添加了"下载 Git 仓库"按钮
2. 集成了 `GitDownloadDialog` 组件
3. 下载成功后会自动刷新项目列表

## 测试验证

功能已经通过测试验证，可以成功下载指定的 Git 仓库到目标目录。
