---
name: local-database
description: 指明 UworkPlus 本地核心数据的存储位置与各 JSON 数据表含义。当 input 含「启动」「打开」「执行」「查找」时，读取 data.json 匹配 sh 脚本并在 macOS 独立 Terminal 中执行；无匹配时按语义回退其他数据表；本地全部未命中时再回退 getAppList 远程接口；仍无匹配时回退 getArticleList 线上文章列表查找答案。
---

# 本地数据库

## 本地核心数据位置

指明本地核心数据内容存在的位置：

核心 sh 脚本数据目录：`~/UWORK-PLUS/dataSql`，其中 `data.json` 最为重要，所有 sh 脚本的存储。

## 数据表

同目录下各 JSON 数据表说明：

| 文件 | 说明 |
|------|------|
| `data.json` | 所有 sh 脚本的存储（最重要） |
| `apiCompareList.json` | 工具/接口响应比对数据表 |
| `codeDirList.json` | 代码沉淀/代码文件夹数据表 |
| `dataGroup.json` | 所有 sh 脚本的分组数据表 |
| `dataSnippet.json` | 代码沉淀/代码片段数据表 |
| `dataSnippetType.json` | 代码沉淀/代码片段分组数据表 |
| `document.json` | 所有文章数据表 |
| `homeTaskList.json` | 所有待办任务列表 |

## 优先读取规则

当 input 有关键字：**启动**、**打开**、**执行** 时，优先读取 `~/UWORK-PLUS/dataSql/data.json` 数据表，并在**当前电脑的独立 Terminal** 中执行匹配到的 sh 脚本。

### 执行流程

1. **读取并匹配**：读取 `data.json`，按 input 在以下字段中检索最佳匹配项：
   - `text`（主标题）
   - `voiceIndexKey`（分号分隔的别名，如 `示例;示例应用`）
   - `groupName`、`detail`
2. **提取命令**：取匹配项的 `sh` 字段作为待执行命令
3. **独立 Terminal 执行**（必须，禁止在 Cursor 集成终端中执行）：
   ```bash
   osascript -e 'tell application "Terminal" to do script "<sh命令>"'
   ```
4. **nvm 兼容**：若 `sh` 含 `nvm`，在命令前追加 `source ~/.nvm/nvm.sh && `
5. **引号转义**：写入 `do script` 时，将 `sh` 内的 `"` 转义为 `\"`
6. **反馈结果**：告知用户匹配到的脚本名称及已在新 Terminal 窗口执行

### 执行示例

input：「打开示例应用」→ 匹配 `text: "示例应用"` → 执行：

```bash
osascript -e 'tell application "Terminal" to do script "open -a '\''/Applications/Google Chrome.app'\'' '\''https://example.com/app'\''"'
```

input：「启动销运工作台」→ 匹配含 `nvm` 的 `sh` → 执行：

```bash
osascript -e 'tell application "Terminal" to do script "source ~/.nvm/nvm.sh && cd /path/to/project && nvm use 22.16.0 && pnpm dev"'
```

### 匹配失败

- 无匹配项：进入下方「语义回退」，依次查其他数据表；本地全部未命中后再走「远程应用列表回退」；仍无匹配再走「远程文章列表回退」
- 多个匹配项：列出候选项请用户确认后再执行

### 语义回退

如 `data.json` 数据表找不到匹配内容时，根据 input 语义依次读取其他数据表：

| 语义方向 | 关键字示例 | 数据表 |
|----------|------------|--------|
| sh 脚本分组 | 分组、分类、类别 | `dataGroup.json` |
| 代码片段 | 代码、片段、snippet | `dataSnippet.json` |
| 代码片段分组 | 片段分组、片段类型 | `dataSnippetType.json` |
| 代码文件夹 | 文件夹、目录、沉淀 | `codeDirList.json` |
| 接口比对 | 接口、API、响应、比对 | `apiCompareList.json` |
| 文章文档 | 文章、文档、笔记 | `document.json` |
| 待办任务 | 待办、任务、todo | `homeTaskList.json` |

回退流程：

1. 先在 `data.json` 中检索匹配项
2. 无匹配时，根据上表判断 input 语义，按相关度从高到低依次读取对应数据表
3. 语义涉及多个方向时，按上表顺序依次尝试，直至找到匹配或全部查完
4. 本地所有 JSON 数据表均无匹配时，进入下方「远程应用列表回退」
5. 远程应用列表仍无匹配时，进入下方「远程文章列表回退」

### 远程应用列表回退

本地 `data.json` 及语义回退涉及的全部 JSON 数据表都未命中时，调用远程接口查找答案。

**接口**：

```
{VITE_REMOTE_ORIGIN}/api_2020/iwork/appList/getAppList?r=<时间戳>
```

- `{VITE_REMOTE_ORIGIN}`：与 `web/.env.local` 中 `VITE_REMOTE_ORIGIN` 一致（如 `https://your-cdn.example.com`）
- `r`：毫秒时间戳，用于避免缓存（或取当前 `Date.now()`）

**响应结构**（根对象 `data` 为应用数组）：

| 字段 | 说明 |
|------|------|
| `app_name` | 应用名称（主匹配字段） |
| `app_introduce` | 应用简介（辅助匹配） |
| `app_address` | 应用地址 / URL |

**匹配规则**：

1. 请求接口，读取 `data` 数组
2. 在 `app_name`、`app_introduce` 中检索与 input 最相关的项（支持部分匹配、别名）
3. **打开类 input**（含「启动」「打开」「执行」）：取 `app_address`，在独立 Terminal 中用 Chrome 打开
4. **问答类 input**：返回匹配项的 `app_name`、`app_introduce`、`app_address` 作为答案
5. 唯一匹配：直接执行或返回答案
6. 多个匹配：列出候选项（`app_name` + `app_address`）请用户确认
7. 仍无匹配：进入下方「远程文章列表回退」

**打开方式**（与 `data.json` 中 URL 类 `sh` 一致，禁止在 Cursor 集成终端中执行）：

```bash
osascript -e 'tell application "Terminal" to do script "open -a '\''/Applications/Google Chrome.app'\'' '\''<app_address>'\''"'
```

**示例**：

input：「打开微信开放平台」→ 本地无匹配 → 远程命中 `app_name: "微信开放平台"` → 打开 `https://open.weixin.qq.com/`

input：「mcp 市场是什么」→ 本地无匹配 → 远程命中 `app_name: "mcp.so（mcp市场）"` → 返回简介与地址 `https://mcp.so/`

### 远程文章列表回退

本地数据表与「远程应用列表回退」均未命中时，调用线上文章列表接口查找答案。

**接口**：

```
{VITE_REMOTE_ORIGIN}/api_2020/iwork/articleList/getArticleList?limit=2000&page=1&r=<时间戳>
```

- `{VITE_REMOTE_ORIGIN}`：与 `web/.env.local` 中 `VITE_REMOTE_ORIGIN` 一致
- `limit=2000`、`page=1`：拉取文章列表
- `r`：毫秒时间戳，用于避免缓存（或取当前 `Date.now()`）

**响应结构**（根对象 `data` 为文章数组）：

| 字段 | 说明 |
|------|------|
| `article_id` | 文章 ID |
| `article_name` | 文章标题（主匹配字段） |
| `article_content` | 文章正文（HTML，辅助匹配与问答） |
| `article_address` | 文章外链地址（若有，可用于打开） |
| `article_editorDescription` | 文章简介（辅助匹配） |

**匹配规则**：

1. 请求接口，读取 `data` 数组
2. 在 `article_name`、`article_editorDescription`、`article_content` 纯文本中检索与 input 最相关的项（支持部分匹配、别名）
3. **打开类 input**（含「启动」「打开」「执行」）：
   - 优先取 `article_address`；若无则从 `article_content` 中提取首个可用 URL
   - 在独立 Terminal 中用 Chrome 打开
4. **问答类 input**：返回匹配项的 `article_name` 与正文摘要（可从 `article_content` 去 HTML 后截取），必要时附带文内链接
5. 唯一匹配：直接执行或返回答案
6. 多个匹配：列出候选项（`article_name` + 摘要）请用户确认
7. 仍无匹配：告知用户本地、应用列表与文章列表均未找到

**打开方式**（与 `data.json` 中 URL 类 `sh` 一致，禁止在 Cursor 集成终端中执行）：

```bash
osascript -e 'tell application "Terminal" to do script "open -a '\''/Applications/Google Chrome.app'\'' '\''<url>'\''"'
```

**示例**：

input：「mac kill 端口」→ 本地无匹配 → 应用列表无匹配 → 文章列表命中 `article_name: "mac进程、端口相关指令（kill端口等）"` → 返回正文中的 `lsof -i :8080`、`kill -9` 等命令说明

input：「RN 学习要点」→ 本地无匹配 → 应用列表无匹配 → 文章列表命中 `article_name: "RN学习-注意要点"` → 返回文内飞书文档链接
