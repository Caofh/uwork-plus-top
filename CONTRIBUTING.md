# Contributing to UworkPlus

Thank you for your interest in contributing!

## Getting Started

```bash
git clone https://gitee.com/redorc/uwork-plus-top.git
git clone https://github.com/Caofh/uwork-plus-top.git
cd uwork-plus-top
yarn install:all
```

Copy environment templates and fill in your own endpoints:

```bash
cp web/.env.example web/.env.local
```

See [README.md](./README.md#配置) (Chinese) or [README.en.md](./README.en.md#configuration) for all configuration options.

## Git Author Email

To avoid exposing personal or employer emails in public history, configure your local identity before committing:

```bash
git config user.name "UworkPlus Contributors"
git config user.email "contributors@users.noreply.github.com"
```

Use `--global` only if you want this identity for all repositories on your machine.

## Development

```bash
# Web only
yarn dev:web

# Full stack (web + mini-markdown + quickforge + electron)
yarn dev:all
```

Node.js **22.18.0** is required (see root `package.json`).

## Project Layout

| Path | Description |
|------|-------------|
| `web/` | Vue 3 + Vite frontend |
| `electron/` | Electron main process |
| `quickforge/` | AI chat submodule (dist committed for offline use) |
| `mini-markdown-editor/` | Markdown micro-frontend |
| `uworkplus-code/` | VS Code extension |
| `uworkplus-code-lowcodeEditor/` | Low-code editor web app |

## Pull Requests

1. Fork the repository and create a feature branch.
2. Keep changes focused; match existing code style.
3. Do not commit secrets, personal paths, or private document links.
4. Update docs if you change configuration or public behavior.
5. Describe what you tested in the PR body.

## Code Style

- TypeScript/Vue: follow patterns in surrounding files.
- Shell scripts: test on macOS when touching install scripts.
- Avoid `eval()` for loading configuration.

## Questions

Open a discussion or issue for design questions before large refactors.
