# Switch Proxy（接口代理）

本地 HTTP 代理管理工具，用于在开发调试时将 Apifox / 浏览器等请求转发到真实后端，无需修改前端项目代码或系统 hosts。

---

## 功能概览

| 能力 | 说明 |
|------|------|
| 多组代理配置 | 按「代理组」管理，每组可包含多条路由规则 |
| 开关控制 | 每组独立开关（`inUse`），仅开启的组参与实际转发 |
| JSON 编辑 | Monaco 编辑器编辑代理规则，失焦自动保存 |
| 系统代理视图 | 聚合展示当前所有已开启规则的只读 JSON / 可视化映射 |
| 本地 7030 服务 | Electron 子进程启动 Express + `http-proxy-middleware` |
| 健康检查 | 主进程每 15s 探测 `/__proxy_health`，失败自动重启子进程 |
| 应用启动即生效 | `App.vue` 启动时自动读取配置并拉起代理服务 |

---

## 入口与路由

- **菜单位置**：Dock → **工具** → 顶部 **接口代理**（工具菜单第一项）
- **前端路由**：`/tools/switchProxy`
- **运行环境**：必须在 **UworkPlus Electron 桌面客户端** 中使用；纯浏览器环境会提示「接口代理需要在桌面客户端中使用」

---

## 界面说明

```
┌─────────────────┬──────────────────────────────────────┐
│  SwitchProxy  + │  [配置] [视图]  系统代理 / 代理组名称   │
├─────────────────┼──────────────────────────────────────┤
│  系统代理        │                                      │
│  代理组 A   [开关]│     Monaco JSON 编辑器 / 映射视图      │
│  代理组 B   [开关]│                                      │
│  ...            │                                      │
└─────────────────┴──────────────────────────────────────┘
```

### 左侧栏

| 元素 | 说明 |
|------|------|
| **系统代理** | 查看所有已开启（`inUse: true`）规则的聚合结果 |
| **代理组列表** | 用户创建的每组代理，右侧开关控制是否生效 |
| **+** | 新建代理组（默认带一条示例规则） |
| **右键菜单** | 编辑名称、删除代理组 |

### 右侧区域

| 场景 | 内容 |
|------|------|
| 选中某个代理组 | 可编辑 JSON（`proxyData`），失焦保存 |
| 系统代理 → **配置** | 只读 JSON，展示当前生效的全部路由 |
| 系统代理 → **视图** | 可视化：`本地 URL` → `目标 target` |

---

## 数据模型

### 存储位置

```
~/UWORK-PLUS/dataSql/proxyList.json          # 生产环境
~/UWORK-PLUS-dev/dataSql/proxyList.json      # 开发环境
```

对应常量：`PROXY_SQL_FILE = 'proxyList'`（见 `constants.ts`）

### 单条代理组结构

```json
{
  "id": 1710000000000,
  "proxyName": "test",
  "inUse": true,
  "proxyData": [
    {
      "path": "/test-api",
      "proxyConfig": {
        "target": "https://test-api.com/server4/",
        "changeOrigin": true,
        "secure": false
      }
    }
  ]
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | number | 创建时由 Electron `curd.create` 自动生成（时间戳） |
| `proxyName` | string | 左侧栏显示名称 |
| `inUse` | boolean | 是否参与实际代理；仅 `true` 的组会被合并到 7030 服务 |
| `proxyData` | array | 路由规则列表，格式同 `http-proxy-middleware` |

### 单条路由规则

| 字段 | 说明 |
|------|------|
| `path` | Express 挂载路径，如 `/test`、`/test-api` |
| `proxyConfig.target` | 转发目标根地址 |
| `proxyConfig.changeOrigin` | 是否修改 Origin 头（跨域场景常用 `true`） |
| `proxyConfig.secure` | 目标为 HTTPS 时是否校验证书 |

---

## 使用示例

### 1. 新建并开启代理

1. 工具 → 接口代理 → 点击 **+**，输入名称如 `test`
2. 在右侧 JSON 中编辑 `proxyData`（或使用默认示例）
3. 打开左侧该组的 **开关**（`inUse: true`）
4. 系统代理 → **视图** 查看本地访问地址

### 2. 在 Apifox 中调用

若配置了：

```json
{
  "path": "/test",
  "proxyConfig": {
    "target": "https://your-api.example.com/api_2020/iwork/",
    "changeOrigin": true,
    "secure": false
  }
}
```

则 Apifox 请求：

```
GET http://127.0.0.1:7030/test/appList/getAppList
```

会被转发到：

```
https://your-api.example.com/api_2020/iwork/appList/getAppList
```

（`path` 前缀 `/test` 会被替换/映射到 `target`）

### 3. 健康检查（排查用）

```bash
curl http://127.0.0.1:7030/__proxy_health
# 期望: {"ok":true,"port":7030}
```

---

## 目录结构

```
web/src/views/switchProxy/
├── index.vue              # 主页面：列表、编辑器、业务逻辑
├── proxyService.ts        # jsBridge 封装（CRUD + 启停服务）
├── constants.ts           # 端口 7030、数据文件名 proxyList
├── HostsMapping.vue       # 系统代理「视图」映射展示
├── components/
│   └── SwitchBtn.vue      # 开关组件
└── README.md              # 本文档

electron/
├── proxyServerWorker.js   # 子进程：Express 代理服务
├── proxyServerManager.js  # 主进程：fork、健康检查、自动重启
└── server.js              # 对外导出 start/restart/shutdown API
```

---

## 与 Electron 的交互（jsBridge）

前端通过 `proxyService.ts` 调用 Electron 预加载 API：

| 方法 | 用途 |
|------|------|
| `proxySql` | 对 `proxyList.json` 增删改查 |
| `startExpressApp` | 首次启动 7030 子进程并注册路由 |
| `restartExpressApp` | 热更新路由（开关切换、编辑已开启组时） |

### proxySql 操作

```typescript
// 读全部
proxyService.readAll()

// 创建
proxyService.create({ proxyName, inUse, proxyData })

// 更新
proxyService.update(id, { proxyName | inUse | proxyData })

// 删除
proxyService.remove(id)
```

底层 IPC 定义见 `electron/main.js`（`ipcMain.handle("proxySql" | "startExpressApp" | "restartExpressApp")`）。

---

## 核心流程

### 应用启动（App.vue）

```
onMounted
  └─ loadingProxyServer()
       ├─ proxyService.readAll()
       ├─ 聚合 inUse === true 的 proxyData
       └─ startExpressApp(activeRoutes)
            └─ 主进程 fork proxyServerWorker → 监听 127.0.0.1:7030
```

无需打开接口代理页面，7030 即可在客户端启动后可用（前提是至少曾配置过规则；无开启组时服务仍启动，但无业务路由）。

### 进入接口代理页（index.vue）

```
onMounted
  ├─ getAllSqlList()      # 加载列表
  ├─ getUsedSqlList()     # 聚合已开启规则 → dataSqlAll
  ├─ initServer()         # startExpressApp（与 App 启动逻辑一致，幂等）
  └─ mountEditor()        # 挂载 Monaco
```

### 切换开关

```
switchToggle
  ├─ restartServer()           # restartExpressApp(已开启组的路由)
  ├─ proxyService.update(id, { inUse })
  └─ getUsedSqlList()          # 刷新系统代理视图
```

### 编辑 JSON（失焦保存）

```
saveCurrentEditorContent
  ├─ JSON.parse 校验
  ├─ proxyService.update(id, { proxyData })
  └─ 若该组 inUse === true → restartServer()
```

### 路由聚合规则

```javascript
// 仅合并 inUse 为 true 的 proxyData
handleServerData(dataSqlList) → flat proxyData[]
```

---

## 7030 代理服务架构

```
┌─────────────────── Electron 主进程 ───────────────────┐
│  proxyServerManager.js                                 │
│    ├─ fork(proxyServerWorker.js)                       │
│    ├─ 每 15s GET /__proxy_health                       │
│    ├─ 失败 / 子进程退出 → 3s 冷却后自动重启              │
│    └─ app.before-quit → shutdown 子进程                │
└────────────────────────┬───────────────────────────────┘
                         │ IPC: start / restart / shutdown
┌────────────────────────▼───────────────────────────────┐
│  proxyServerWorker.js（子进程）                         │
│    Express @ 127.0.0.1:7030                              │
│    GET  /__proxy_health  → 探活                         │
│    USE  {path}           → http-proxy-middleware        │
└──────────────────────────────────────────────────────────┘
```

| 常量 | 值 | 说明 |
|------|-----|------|
| `PROXY_PORT` | 7030 | 本地代理端口 |
| `HEALTH_PATH` | `/__proxy_health` | 内部健康检查路径，勿与业务 path 冲突 |
| `HEALTH_CHECK_INTERVAL_MS` | 15000 | 健康检查间隔 |
| `RESTART_COOLDOWN_MS` | 3000 | 重启冷却，防止抖动 |

---

## 常见问题

### Apifox 报 `ECONNREFUSED 127.0.0.1:7030`

1. 确认在 **Electron 客户端** 中运行，而非纯 Web
2. 确认客户端已启动（`App.vue` 会自动 `loadingProxyServer`）
3. 执行 `curl http://127.0.0.1:7030/__proxy_health` 验证服务
4. 查看 Electron 主进程日志是否有 `[proxy-manager]` / `[proxy-worker]` 输出

### 请求 404 或转发不对

1. 确认对应代理组 **开关已打开**（`inUse: true`）
2. 检查 `path` 与 Apifox URL 前缀是否匹配
3. 在 **系统代理 → 视图** 核对本地 URL 与 target 映射

### JSON 保存失败

编辑器失焦时会 `JSON.parse` 校验，格式错误会提示「请检查 json 格式」。

### 从旧版 SwitchProxy 迁移

独立版 SwitchProxy 数据在 `switch_proxy_electron/resources/curd/data.json`；UworkPlus 使用 `proxyList.json`，**不会自动迁移**，需手动复制并调整字段结构。

---

## 相关文件索引

| 文件 | 说明 |
|------|------|
| `web/src/App.vue` | `loadingProxyServer()` 应用启动拉起代理 |
| `web/src/router.js` | `/tools/switchProxy` 路由 |
| `web/src/views/tools/index.vue` | 工具顶栏菜单「接口代理」 |
| `electron/resources/preload.js` | 暴露 `proxySql` / `startExpressApp` 等 |
| `electron/resources/curd/curd.js` | JSON 文件 CRUD 实现 |
| `electron/main.js` | IPC 注册、退出时 shutdown 代理 |

---

## 版本说明

本模块由独立项目 [switch-proxy](https://github.com/...) 迁移并集成至 UworkPlus，主要差异：

- 入口从独立 Dock 项改为 **工具 → 接口代理**
- 数据文件从 `data.json` 改为 `proxyList.json`
- 7030 服务改为 **子进程 + 健康检查 + 自动重启**
- 应用启动时自动初始化代理，无需先打开页面
- UI 调整为深色主题
