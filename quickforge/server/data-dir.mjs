import path from 'node:path'
import os from 'node:os'

function isDevEnvironment() {
  return process.argv.includes('--dev') || process.env.QUICKFORGE_DEV === '1'
}

export function getDefaultDataDir() {
  const rootDir = isDevEnvironment() ? 'UWORK-PLUS-dev' : 'UWORK-PLUS'
  return path.join(os.homedir(), rootDir, '.quickforge')
}

export function getDataDir() {
  if (process.env.QUICKFORGE_DATA_DIR) return path.resolve(process.env.QUICKFORGE_DATA_DIR)
  return getDefaultDataDir()
}
