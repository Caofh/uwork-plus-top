# UworkPlus

### 如果客户端 build 后的包，打开无反应，通过控制台启动去收集报错，指令如下：
```
/Applications/UworkPlus.app/Contents/MacOS/UworkPlus
```

### 重新/第一次 yarn 依赖包之后，需要重新 rebuild；node-pty 模块需要重新编译
```
cd electron
yarn install
yarn rebuild
# Apple Silicon 本机打 Intel(x64) 包（build-x64 脚本会自动 rebuild x64，结束后恢复 arm64）
yarn rebuild-native-x64
```

### `rebuild-native-x64` 报 `No module named 'distutils'`

旧版 `electron-rebuild` 自带的 `node-gyp@9` 依赖 Python 的 `distutils`，在 **Python 3.12+** 已移除。项目已改为 `@electron/rebuild@4` + `node-gyp@10`。
```
# 查看python版本
python3 --version
```

请在本目录重新安装依赖后再编译：

```bash
cd electron
yarn install
yarn rebuild-native-x64
```

若仍失败，可任选其一：

```bash
# 方案 A：用 Homebrew 的 Python 3.11 指定给 node-gyp
brew install python@3.11
export npm_config_python="$(brew --prefix python@3.11)/bin/python3.11"
yarn rebuild-native-x64

# 方案 B：为当前 Python 安装 setuptools（提供 distutils 兼容）
python3 -m pip install setuptools --user --break-system-packages
yarn rebuild-native-x64
```

### 打 Intel 芯片 DMG（在 M 系列 Mac 上交叉编译）
```
cd electron
yarn build-x64
```
产物一般为 `build/UworkPlus-<version>.dmg`（x64）。若在 Intel Mac 上仍报 `pty.node ... incompatible architecture`，说明包内仍是 arm64 原生模块，请确认打包日志中有 `electron-rebuild ... arch=x64` 且成功后再安装。

### 更新 electron 端（自动更新），发布流程；版本号需与 package.json 保持一致

**一键发布（推荐，在项目根目录）：**
```
# 自动 patch +1
yarn publishAli2:electron -- "更新了自动升级方案"

# 指定版本号
yarn publishAli2:electron -- 1.11.3 "更新了自动升级方案"
```

或在 `electron` 目录：
```
yarn publishAli2 -- "更新了自动升级方案"
yarn publishAli2 -- 1.11.3 "更新了自动升级方案"
```

未传版本号时自动 **patch +1** 并写入 `package.json`；传入 `x.y.z` 时使用指定版本。

**手动分步（与一键脚本等价）：**
```
cd electron
// 第二步： 更新 package.json 中的 version
yarn rm-build
yarn rebuild-native-arm64 && yarn build-unsigned // build Apple 芯片包
yarn rebuild-native-x64 && yarn build-x64-unsigned // build Inter 芯片包
yarn build-update 1.5.2 更新了自动升级方案
yarn build-update-upload
```

#### 之后所有 electron 端会自动升级
