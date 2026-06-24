import SqlOperate from '@/utils/sqlOperate'
import { envInfo } from '@/config/index'
import { devEnvListUrl } from '@/config/remote'

export const DEV_ENV_SQL_FILE = 'dataSql/devEnv.json'

function resolveDevEnvListUrl() {
  const cacheBust = `r=${Date.now()}`
  if (envInfo.isDev) {
    return `/uworkplus/staticJson/dev-env-list.json?${cacheBust}`
  }
  const base = devEnvListUrl
  return base.includes('?') ? `${base}&${cacheBust}` : `${base}?${cacheBust}`
}

export interface DevEnvItem {
  id?: number | string
  name: string
  shUrl: string
}

const devEnvService = new SqlOperate(DEV_ENV_SQL_FILE)

function isCompleteDevEnvItem(item: unknown): item is Omit<DevEnvItem, 'id'> {
  if (!item || typeof item !== 'object') {
    return false
  }

  const { name, shUrl } = item as DevEnvItem
  if (typeof name !== 'string' || typeof shUrl !== 'string') {
    return false
  }

  return Boolean(name.trim() && shUrl.trim())
}

function normalizeDevEnvList(list: unknown): DevEnvItem[] {
  if (!Array.isArray(list)) {
    return []
  }

  return list
    .filter(isCompleteDevEnvItem)
    .map((item, index) => ({
      name: item.name.trim(),
      shUrl: item.shUrl.trim(),
      id: index + 1,
    }))
}

function mergeAndDedupeDevEnvList(localList: DevEnvItem[], onlineList: DevEnvItem[]) {
  const merged: Omit<DevEnvItem, 'id'>[] = []
  const seen = new Set<string>()

  const add = (item: DevEnvItem) => {
    const nameKey = String(item.name || '').trim()
    const shUrlKey = String(item.shUrl || '').trim()
    const key = shUrlKey ? `url:${shUrlKey}` : `name:${nameKey}`
    if (!key || seen.has(key)) {
      return
    }
    seen.add(key)
    merged.push({
      name: nameKey,
      shUrl: shUrlKey,
    })
  }

  localList.forEach(add)
  onlineList.forEach(add)

  return merged.map((item, index) => ({ ...item, id: index + 1 }))
}

async function fetchRemoteDevEnvList(): Promise<DevEnvItem[]> {
  try {
    const response = await fetch(resolveDevEnvListUrl(), { cache: 'no-store' })
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }
    const data = await response.json()
    return normalizeDevEnvList(data)
  } catch (err) {
    console.warn('[fetchRemoteDevEnvList]', err)
    return []
  }
}

/** 读取开发环境列表；本地与远程合并去重后落盘 */
export async function loadDevEnvList(): Promise<DevEnvItem[]> {
  const localRaw = await devEnvService.readAll()
  const localList = normalizeDevEnvList(localRaw)
  const onlineList = await fetchRemoteDevEnvList()

  if (!onlineList.length) {
    return localList
  }

  const merged = mergeAndDedupeDevEnvList(localList, onlineList)
  if (merged.length) {
    await devEnvService.writeAll(merged)
  }
  return merged
}

/** 应用启动时初始化 devEnv.json */
export async function ensureDevEnvListInitialized(): Promise<void> {
  try {
    await loadDevEnvList()
  } catch (err) {
    console.warn('[ensureDevEnvListInitialized]', err)
  }
}

export const devEnvApi = {
  readAll: (): Promise<DevEnvItem[]> => devEnvService.readAll() as Promise<DevEnvItem[]>,
  create: (item: Omit<DevEnvItem, 'id'>): Promise<DevEnvItem> =>
    devEnvService.create(item) as Promise<DevEnvItem>,
  update: (id: number | string, item: Partial<DevEnvItem>): Promise<DevEnvItem> =>
    devEnvService.update(id, item) as Promise<DevEnvItem>,
  remove: (id: number | string): Promise<boolean> => devEnvService.remove(id),
  writeAll: (items: DevEnvItem[]): Promise<DevEnvItem[]> =>
    devEnvService.writeAll(items) as Promise<DevEnvItem[]>,
}
