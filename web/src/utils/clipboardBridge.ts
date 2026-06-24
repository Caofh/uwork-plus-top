import { isInElectron } from '@/utils/electron'

const CLIPBOARD_WRITE_EVENT = 'clipboard:write'
const CLIPBOARD_MESSAGE_TYPE = 'uwork-clipboard-write'

async function writeByExecCommand(text: string) {
  const textArea = document.createElement('textarea')
  textArea.value = text
  textArea.style.position = 'fixed'
  textArea.style.opacity = '0'
  document.body.appendChild(textArea)
  textArea.select()
  try {
    document.execCommand('copy')
  } finally {
    document.body.removeChild(textArea)
  }
}

/** 通过 Electron bridge 写入剪贴板 */
export async function writeClipboardViaBridge(text: string) {
  const value = String(text ?? '')

  if (isInElectron() && window.electronAPI?.writeClipboard) {
    await window.electronAPI.writeClipboard(value)
    return
  }

  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(value)
      return
    } catch {
      // Electron 等环境可能拒绝 Clipboard API，继续降级
    }
  }

  await writeByExecCommand(value)
}

/** Electron 环境：全局替换 navigator.clipboard.writeText */
export function setupClipboardBridge() {
  if (typeof window === 'undefined' || !isInElectron()) {
    return
  }

  if ((window as any).__uworkClipboardBridgeReady) {
    return
  }
  ;(window as any).__uworkClipboardBridgeReady = true

  const writeText = (text: string) => writeClipboardViaBridge(text)

  try {
    if (navigator.clipboard) {
      navigator.clipboard.writeText = writeText
    } else {
      Object.defineProperty(navigator, 'clipboard', {
        value: {
          writeText,
          readText: () => Promise.resolve(''),
        },
        configurable: true,
        writable: true,
      })
    }
  } catch (error) {
    console.warn('[clipboard] patch navigator.clipboard failed:', error)
  }
}

export { CLIPBOARD_WRITE_EVENT, CLIPBOARD_MESSAGE_TYPE }
