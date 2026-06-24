import { writeClipboardViaBridge } from '@/utils/clipboardBridge'

async function copyToClipboard(text: string) {
  return writeClipboardViaBridge(text)
}

export { copyToClipboard }
