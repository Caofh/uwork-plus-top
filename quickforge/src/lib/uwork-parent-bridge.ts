const UWORK_OPEN_EXTERNAL_TYPE = 'uwork-open-external'
const PI_OPEN_EXTERNAL_TYPE = 'open-external-url'

/** Local session / dev service opened from sidebar「浏览器打开」. */
export const SESSION_BROWSER_DEFAULT_URL = 'http://localhost:5188'

export const IFRAME_EMBED_CLASS = 'quickforge-iframe-embed'

export function isEmbeddedInParent(): boolean {
  try {
    return window.parent !== window
  } catch {
    return false
  }
}

/** iframe 嵌入时标记根节点，供 index.css 应用 UworkPlus 主题变量 */
export function applyIframeEmbedClass(): void {
  if (!isEmbeddedInParent()) {
    document.documentElement.classList.remove(IFRAME_EMBED_CLASS)
  }
}

function shouldOpenExternally(href: string): boolean {
  if (!href || href.startsWith('#') || href.startsWith('javascript:')) {
    return false
  }
  return /^(https?:|mailto:|tel:)/i.test(href)
}

function postOpenExternalToParent(url: string) {
  window.parent.postMessage({ type: UWORK_OPEN_EXTERNAL_TYPE, url }, '*')
}

/** Open URL in the system default browser (UworkPlus Electron parent or standalone tab). */
export function openUrlInSystemBrowser(url: string = SESSION_BROWSER_DEFAULT_URL): void {
  const target = url.trim()
  if (!target || !shouldOpenExternally(target)) {
    return
  }
  if (isEmbeddedInParent()) {
    postOpenExternalToParent(target)
    return
  }
  window.open(target, '_blank', 'noopener,noreferrer')
}

function handleLinkClick(event: MouseEvent) {
  const link = (event.target as Element | null)?.closest?.('a')
  if (!link) {
    return
  }

  const href = link.getAttribute('href') || link.href
  if (!shouldOpenExternally(href)) {
    return
  }

  event.preventDefault()
  event.stopPropagation()
  postOpenExternalToParent(link.href || href)
}

function handleChildFrameMessage(event: MessageEvent) {
  const { type, url } = (event.data || {}) as { type?: string; url?: string }
  if (type !== PI_OPEN_EXTERNAL_TYPE || typeof url !== 'string' || !shouldOpenExternally(url)) {
    return
  }

  postOpenExternalToParent(url)
}

/** UworkPlus iframe 嵌入时：拦截外链点击并通知父页面打开系统浏览器 */
export function applyUworkParentBridge(): void {
  if (!isEmbeddedInParent()) {
    return
  }

  document.addEventListener('click', handleLinkClick, true)
  window.addEventListener('message', handleChildFrameMessage)
}
