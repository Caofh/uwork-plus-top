# uworkplus-code

VS Code extension for [UworkPlus](https://gitee.com/redorc/uwork-plus-top.git): code snippets, component downloads, and low-code workflow.

## Features

- Browse and insert code snippets from UworkPlus
- Download components to the current workspace folder
- Generate low-code JsonSchema files
- Open the low-code web editor

## Configuration

| Setting | Description |
|---------|-------------|
| `uworkplus.remoteOrigin` | Base URL for hosted UworkPlus services |
| `uworkplus.lowcodeEditorUrl` | Low-code editor URL (defaults to `{remoteOrigin}/lowcodeEditor/`) |

## Development

```bash
cd uworkplus-code
npm install
npm run compile
```

Press F5 in VS Code to launch the Extension Development Host.

## License

MIT — see [../LICENSE](../LICENSE)
