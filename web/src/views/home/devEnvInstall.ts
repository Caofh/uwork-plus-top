import type { DevEnvItem } from './service/devEnvApi'

function shellQuote(value: string) {
  return `"${value.replace(/"/g, '\\"')}"`
}

function withCacheBust(url: string) {
  const separator = url.includes('?') ? '&' : '?'
  return `${url}${separator}r=${Date.now()}`
}

export function buildDevEnvInstallCommand(item: DevEnvItem) {
  return `curl -fsSL ${shellQuote(withCacheBust(item.shUrl))} | bash`
}
