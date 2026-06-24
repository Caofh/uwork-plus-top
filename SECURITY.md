# Security Policy

## Supported Versions

Security fixes are provided for the latest release on the default branch.

## Reporting a Vulnerability

Please **do not** open a public issue for security vulnerabilities.

Report privately by emailing the maintainers or using your platform's security advisory feature if available. Include:

- Affected component (Electron, web, SwitchProxy, etc.)
- Steps to reproduce
- Impact assessment
- Suggested fix (if any)

We aim to acknowledge reports within 7 days.

## Known Risk Areas

UworkPlus is a **developer workstation tool**. Review these areas before deploying in sensitive environments:

### Electron & Node integration

The desktop client uses `nodeIntegration` and runs shell commands (Terminal, install scripts, git clone). Treat the app as **trusted local software** only.

### SwitchProxy / MITM

SwitchProxy installs a local HTTPS MITM proxy and root CA on `127.0.0.1`. It can decrypt HTTPS traffic. Use only on development machines you control.

### Script execution

Users can create and run shell scripts from the UI. Do not import or run untrusted script packs.

### Secrets & configuration

- Never commit API keys, deploy passwords, or cloud credentials.
- Configure `TENCENT_SECRET_ID` / `TENCENT_SECRET_KEY` via environment variables for speech recognition.
- Configure `DEPLOY_HOST` / `DEPLOY_PASSWORD` locally for release scripts; do not hardcode them.

### Git history

If secrets were ever committed, rotate the credentials and scrub history (`git filter-repo` / BFG) before making the repository public.

## Secure Development

- Copy `web/.env.example` to `web/.env.local` for private endpoints; keep `.env.local` out of git.
- Prefer `contextIsolation: true` and a minimal preload API when hardening Electron (future improvement).
