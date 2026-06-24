const trimSlash = (url: string) => url.replace(/\/+$/, '')

/** 远程服务根域名，通过 Vite 环境变量 `VITE_REMOTE_ORIGIN` 配置 */
export const remoteOrigin = (import.meta.env.VITE_REMOTE_ORIGIN as string | undefined)?.trim() ?? ''

export function hasRemoteOrigin(): boolean {
  return Boolean(remoteOrigin)
}

export function remoteUrl(path: string): string {
  if (!remoteOrigin) return ''
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${trimSlash(remoteOrigin)}${normalizedPath}`
}

export function localDevOrigin(): string {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin
  }
  return 'http://127.0.0.1:5173'
}

/** 开发环境走本地；生产环境优先远程，未配置则回退本地同域路径 */
export function resolveRemoteOrLocal(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  if (import.meta.env.DEV) {
    return `${trimSlash(localDevOrigin())}${normalizedPath}`
  }
  return remoteUrl(normalizedPath) || `${trimSlash(localDevOrigin())}${normalizedPath}`
}

export const apiBaseUrl =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim() ||
  remoteUrl('/api_2020/iwork') ||
  '/api'

export const apiBaseCommon =
  (import.meta.env.VITE_API_BASE_COMMON as string | undefined)?.trim() ||
  remoteUrl('/api_2020') ||
  ''

export const updatesInfoUrl =
  (import.meta.env.VITE_UPDATES_INFO_URL as string | undefined)?.trim() ||
  remoteUrl('/updates/update-info-latest.json') ||
  ''

export const softwareListUrl =
  (import.meta.env.VITE_SOFTWARE_LIST_URL as string | undefined)?.trim() ||
  remoteUrl('/uworkplus/staticJson/sofeWare-list.json') ||
  '/uworkplus/staticJson/sofeWare-list.json'

export const devEnvListUrl =
  (import.meta.env.VITE_DEV_ENV_LIST_URL as string | undefined)?.trim() ||
  remoteUrl('/uworkplus/staticJson/dev-env-list.json') ||
  '/uworkplus/staticJson/dev-env-list.json'

export const lowcodeEditorUrl =
  (import.meta.env.VITE_LOWCODE_EDITOR_URL as string | undefined)?.trim() ||
  remoteUrl('/lowcodeEditor/') ||
  ''

export const wechatProductId =
  (import.meta.env.VITE_WECHAT_PRODUCT_ID as string | undefined)?.trim() ?? ''

export const defaultUserAvatarUrl =
  (import.meta.env.VITE_DEFAULT_USER_AVATAR_URL as string | undefined)?.trim() || ''

export const siteIcpNumber =
  (import.meta.env.VITE_SITE_ICP_NUMBER as string | undefined)?.trim() ?? ''
