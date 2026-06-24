# UworkPlus

## 项目概述

UworkPlus 是一个基于 Vue 3 + TypeScript + Electron 的桌面应用，提供多种工作工具和功能模块。

## 技术栈

- **前端框架**: Vue 3 + TypeScript
- **构建工具**: Vite
- **桌面应用**: Electron
- **UI 组件**: Element Plus
- **状态管理**: Pinia
- **路由管理**: Vue Router

## 核心功能模块

### 1. 登录系统 (loginHooks)

#### 概述

`loginHooks` 是一个基于 Vue 3 Composition API 的登录状态管理 Hook，提供了统一的登录状态管理和弹窗控制功能。

#### 文件位置

```
web/src/hooks/loginHooks.ts
```

#### 核心功能

##### 状态管理

- **token**: 用户登录凭证，响应式数据
- **showLoginVisible**: 登录弹窗显示状态，响应式数据

##### 方法

- **showLogin(payload: boolean)**: 控制登录弹窗的显示/隐藏
  - `payload: true` - 显示登录弹窗
  - `payload: false` - 隐藏登录弹窗

#### 使用方式

```typescript
import { useLoginHooks } from '@/hooks/loginHooks'

// 在组件中使用
const { token, showLoginVisible, showLogin } = useLoginHooks()

// 显示登录弹窗
showLogin(true)

// 隐藏登录弹窗
showLogin(false)

// 监听登录状态
watch(token, newToken => {
  if (newToken) {
    console.log('用户已登录')
  } else {
    console.log('用户未登录')
  }
})

// 点击事件，登录后增加自定义回调事件
onClick: () => {
  if (token.value) {
    setCarousel('/userCenter')
  } else {
    setTimeout(() => {
      // 自定义登录后的回调事件
      eventBus.off('login:success')
      eventBus.on('login:success', data => {
        console.log('登录回调后的数据')
        console.log(data)
      })
      showLogin(true)
    }, 200)
  }
}
```

#### 与 Store 的集成

`loginHooks` 与 `useCommonStore` 紧密集成：

```typescript
// 内部实现
const commonStore = useCommonStore()
const token = computed(() => commonStore.token)
const showLoginVisible = computed(() => commonStore.showLoginVisible)

const showLogin = (payload: boolean = true) => {
  commonStore.updateShowLoginVisible(payload)
}
```

#### 在 App.vue 中的应用

```typescript
// 导入 hooks
import { useLoginHooks } from "@/hooks/loginHooks";
const { showLoginVisible, token, showLogin } = useLoginHooks();

// 在 iframe 登录成功后关闭弹窗
case "LOGIN_SUCCESS":
  showLogin(false); // 关闭登录弹窗
  break;
```

#### 优势

1. **响应式设计**: 基于 Vue 3 的响应式系统，状态变化自动触发 UI 更新
2. **类型安全**: 完整的 TypeScript 类型支持
3. **组合式 API**: 符合 Vue 3 最佳实践
4. **状态集中**: 通过 Store 统一管理登录状态
5. **易于扩展**: 可以方便地添加更多登录相关功能

### 2. 其他功能模块

- **轮播导航**: 支持垂直轮播的页面导航
- **iframe 集成**: 支持外部页面嵌入和通信
- **事件总线**: EventBus 实现组件间通信
- **更新管理**: 自动检查和更新应用版本

## 开发指南

### 环境要求

- Node.js >= 16
- npm >= 8

### 安装依赖

```bash
cd web
npm install
```

### 开发模式

```bash
npm run dev
```

### 构建生产版本

```bash
npm run build
```

## 项目结构

```
web/
├── src/
│   ├── hooks/           # 自定义 Hooks
│   │   └── loginHooks.ts # 登录状态管理
│   ├── store/           # 状态管理
│   ├── components/      # 组件
│   ├── views/           # 页面
│   └── utils/           # 工具函数
├── public/              # 静态资源
└── README.md            # 项目说明
```

## 贡献指南

欢迎提交 Issue 和 Pull Request 来改进项目。

## 许可证

[许可证信息]
