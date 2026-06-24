# UworkPlus

UworkPlus is a macOS-focused developer workstation built with **Vue 3 + Vite + TypeScript + Electron**. It bundles home dashboard tools, script management, SwitchProxy, AI sessions (QuickForge), markdown documents, software/dev-env installers, and more.

## Features

- **Desktop shell** — Electron app with local file/SQL storage
- **SwitchProxy** — Hosts mapping + system proxy with local MITM (dev only)
- **Script hub** — Grouped shell scripts with Terminal integration
- **Software & dev-env installer** — Batch install via macOS Terminal
- **QuickForge** — Embedded AI chat (submodule, `dist/` included)
- **VS Code extension** — `uworkplus-code` for code snippets & low-code workflow
- **Low-code editor** — `uworkplus-code-lowcodeEditor` visual page builder

## Quick Start

```bash
git clone https://gitee.com/redorc/uwork-plus.git
cd uwork-plus
yarn install:all
cp web/.env.example web/.env.local   # configure your endpoints
yarn dev:all
```

Node.js **22.18.0** is required.

## Configuration

UworkPlus does **not** ship with a public backend. Configure your own infrastructure via environment variables.

### Web (`web/.env.local`)

Copy from `web/.env.example`:

| Variable | Description |
|----------|-------------|
| `VITE_REMOTE_ORIGIN` | Base URL for hosted assets/API (e.g. `https://your-cdn.example.com`) |
| `VITE_API_BASE_URL` | API base (default: `{ORIGIN}/api_2020/iwork`) |
| `VITE_API_BASE_COMMON` | Common API prefix (default: `{ORIGIN}/api_2020`) |
| `VITE_UPDATES_INFO_URL` | Electron update manifest JSON |
| `VITE_SOFTWARE_LIST_URL` | Remote software list seed JSON |
| `VITE_DEV_ENV_LIST_URL` | Remote dev-env list seed JSON |
| `VITE_LOWCODE_EDITOR_URL` | Low-code editor URL |
| `VITE_WECHAT_PRODUCT_ID` | WeChat mini-program product id (optional) |
| `VITE_DOC_*` | Documentation links (see `.env.example`) |

### Electron

| Variable | Description |
|----------|-------------|
| `UWORK_REMOTE_ORIGIN` | Same as `VITE_REMOTE_ORIGIN` for main process |
| `UWORK_UPDATES_INFO_URL` | Override update manifest URL |
| `TENCENT_SECRET_ID` / `TENCENT_SECRET_KEY` | Tencent ASR (speech-to-text), optional |
| `TRANSFER_SOURCE_PATH` | Code transfer tool source directory |

### Self-hosting checklist

1. Deploy `web` build to your static host under `/uworkplus/`
2. Host `staticJson/sofeWare-list.json` and `dev-env-list.json`
3. Provide an API compatible with existing client calls, or adapt `web/src/config`
4. Host Electron update DMGs and `update-info-latest.json` for auto-update
5. Edit `web/public/staticJson/sofeWare-list.json` to replace third-party mirror URLs

### VS Code extension (`uworkplus-code`)

Configure in VS Code settings:

- `uworkplus.remoteOrigin` — base URL
- `uworkplus.lowcodeEditorUrl` — low-code editor URL

## Subprojects

| Directory | License | Description |
|-----------|---------|-------------|
| [web](./web/) | MIT | Main UI |
| [electron](./electron/) | MIT | Desktop runtime |
| [quickforge](./quickforge/) | MIT | AI chat |
| [uworkplus-code](./uworkplus-code/) | MIT | VS Code extension |
| [uworkplus-code-lowcodeEditor](./uworkplus-code-lowcodeEditor/) | MIT | Low-code editor |

## Security

See [SECURITY.md](./SECURITY.md). UworkPlus executes shell commands and can install local MITM certificates — use only on trusted development machines.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md).

## License

[MIT](./LICENSE)
