import { jsBridge } from '@/utils/electron'
import { compareVersions } from '@/utils/version'

export const MIN_NODE_VERSION = '20'

/** 读取本机 Node.js 版本号，如 22.11.0；未安装或执行失败返回 null */
export async function getLocalNodeVersion(): Promise<string | null> {
  const result: any = await jsBridge.registerSync({
    method: 'runTerminalCommand',
    json: { command: 'node -v' },
  })

  const raw = (result.stdout || '').trim()
  if (!raw) {
    return null
  }

  return raw.replace(/^v/i, '')
}

export function isNodeVersionAtLeast(
  version: string,
  minVersion: string = MIN_NODE_VERSION,
): boolean {
  return compareVersions(version, minVersion) >= 0
}
