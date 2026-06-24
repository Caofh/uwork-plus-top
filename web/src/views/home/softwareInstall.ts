export type { SoftwareItem } from './service/softwareApi'
import type { SoftwareItem } from './service/softwareApi'

const INSTALL_DMG_SCRIPT_URL =
  `https://raw.giteeusercontent.com/redorc/mac-init/raw/master/softWare-sh/install-dmg.sh?r=${new Date().getTime()}`

function shellQuote(value: string) {
  return `"${value.replace(/"/g, '\\"')}"`
}

export function buildSoftwareInstallCommand(item: SoftwareItem) {
  return [
    `curl -fsSL ${shellQuote(INSTALL_DMG_SCRIPT_URL)} | bash -s --`,
    `--url ${shellQuote(item.url)}`,
    `--app ${shellQuote(item.app)}`,
    `--name ${shellQuote(item.name)}`,
  ].join(' ')
}
