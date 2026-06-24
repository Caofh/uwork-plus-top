import SqlOperate from '@/utils/sqlOperate'
import SqlOperate from '@/utils/sqlOperate'
import { envInfo } from '@/config/index'
import { softwareListUrl } from '@/config/remote'

export const SOFTWARE_SQL_FILE = 'dataSql/software.json'

function resolveSoftwareListUrl() {
  const cacheBust = `r=${Date.now()}`
  if (envInfo.isDev) {
    return `/uworkplus/staticJson/sofeWare-list.json?${cacheBust}`
  }
  const base = softwareListUrl
  return base.includes('?') ? `${base}&${cacheBust}` : `${base}?${cacheBust}`
}

export interface SoftwareItem {
  id?: number | string
  name: string
  url: string
  app: string
  type?: string
}

const softwareService = new SqlOperate(SOFTWARE_SQL_FILE)

function isCompleteSoftwareItem(item: unknown): item is Omit<SoftwareItem, 'id'> {
  if (!item || typeof item !== 'object') {
    return false
  }

  const typed = item as SoftwareItem
  const { name, url, app, type } = typed
  if (typeof name !== 'string' || typeof url !== 'string' || typeof app !== 'string') {
    return false
  }

  if (!name.trim() || !app.trim()) {
    return false
  }

  if (type === 'document') {
    return true
  }

  return Boolean(url.trim())
}

function normalizeSoftwareList(list: unknown): SoftwareItem[] {
  if (!Array.isArray(list)) {
    return []
  }

  return list
    .filter(isCompleteSoftwareItem)
    .map((item, index) => ({
      app: item.app.trim(),
      name: item.name.trim(),
      url: item.url.trim(),
      ...(item.type ? { type: item.type } : {}),
      id: index + 1,
    }))
}

function resolveSoftwareMergeKey(item: SoftwareItem) {
  const urlKey = String(item.url || '').trim()
  const appKey = String(item.app || '').trim()
  const nameKey = String(item.name || '').trim()
  // url + app + name 组合作为唯一键，任一字段改动即视为不同软件
  return `url:${urlKey}|app:${appKey}|name:${nameKey}`
}

function mergeAndDedupeSoftwareList(localList: SoftwareItem[], onlineList: SoftwareItem[]) {
  const merged: Omit<SoftwareItem, 'id'>[] = []
  const seen = new Set<string>()

  const add = (item: SoftwareItem) => {
    const appKey = String(item.app || '').trim()
    const nameKey = String(item.name || '').trim()
    const urlKey = String(item.url || '').trim()
    const key = resolveSoftwareMergeKey(item)
    if (!key || seen.has(key)) {
      return
    }
    seen.add(key)
    merged.push({
      app: appKey,
      name: nameKey,
      url: urlKey,
      ...(item.type ? { type: item.type } : {}),
    })
  }

  // 本地优先：组合键相同则跳过；任一字段不同则保留为独立项，线上仅补充本地没有的新项
  localList.forEach(add)
  onlineList.forEach(add)

  return merged.map((item, index) => ({ ...item, id: index + 1 }))
}

async function fetchDefaultSeedData(): Promise<SoftwareItem[]> {
  try {
    const response = await fetch(resolveSoftwareListUrl(), { cache: 'no-store' })
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }
    const data = await response.json()
    return normalizeSoftwareList(data)
  } catch (err) {
    console.warn('[fetchDefaultSeedData]', err)
    return []
  }
}

/** 读取软件列表；对比线上数据数量，不一致则合并去重并落盘 */
export async function loadSoftwareList(): Promise<SoftwareItem[]> {
  const localRaw = await softwareService.readAll()
  const localList = normalizeSoftwareList(localRaw)
  const onlineList = await fetchDefaultSeedData()

  // 线上为空：直接使用本地（本地也可能为空）
  if (!onlineList.length) {
    return localList
  }

  const merged = mergeAndDedupeSoftwareList(localList, onlineList)
  if (merged.length) {
    await softwareService.writeAll(merged)
  }
  return merged
}

/** 应用启动时初始化 software.json（创建空文件后注入默认内容） */
export async function ensureSoftwareListInitialized(): Promise<void> {
  try {
    await loadSoftwareList()
  } catch (err) {
    console.warn('[ensureSoftwareListInitialized]', err)
  }
}

export const softwareApi = {
  readAll: (): Promise<SoftwareItem[]> => softwareService.readAll() as Promise<SoftwareItem[]>,
  create: (item: Omit<SoftwareItem, 'id'>): Promise<SoftwareItem> =>
    softwareService.create(item) as Promise<SoftwareItem>,
  update: (id: number | string, item: Partial<SoftwareItem>): Promise<SoftwareItem> =>
    softwareService.update(id, item) as Promise<SoftwareItem>,
  remove: (id: number | string): Promise<boolean> => softwareService.remove(id),
  writeAll: (items: SoftwareItem[]): Promise<SoftwareItem[]> =>
    softwareService.writeAll(items) as Promise<SoftwareItem[]>,
}
