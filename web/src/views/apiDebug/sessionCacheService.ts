import SqlOperate from '@/utils/sqlOperate'
import {
  createEmptyKeyValue,
  type ApiDebugSessionTab,
  type ApiDebugSessionCacheRecord,
} from './types'

export const API_DEBUG_SESSION_CACHE_FILE = 'dataSql/apiDebugSessionCache.json'

const CACHE_RECORD_ID = 'session-cache'
const sessionCacheClient = new SqlOperate(API_DEBUG_SESSION_CACHE_FILE)

export interface SessionCachePayload {
  activeTabId: string
  tabs: ApiDebugSessionTab[]
}

function ensureKeyValueList(list: ApiDebugSessionTab['api']['queryParams']) {
  if (!Array.isArray(list) || list.length === 0) {
    return [createEmptyKeyValue()]
  }
  return list
}

function normalizeSessionTab(tab: ApiDebugSessionTab): ApiDebugSessionTab {
  const normalized = JSON.parse(JSON.stringify(tab)) as ApiDebugSessionTab
  normalized.api.queryParams = ensureKeyValueList(normalized.api.queryParams)
  normalized.api.headers = ensureKeyValueList(normalized.api.headers)
  normalized.responseResult = normalized.responseResult ?? null
  normalized.responseError = normalized.responseError ?? ''
  normalized.mockResponseResult = normalized.mockResponseResult ?? null
  normalized.mockResponseError = normalized.mockResponseError ?? ''
  normalized.requestTab = normalized.requestTab || 'params'
  normalized.responseTab = normalized.responseTab || 'body'
  normalized.mockResponseTab = normalized.mockResponseTab || 'body'

  if (normalized.responseFromMock && normalized.responseResult && !normalized.mockResponseResult) {
    normalized.mockResponseResult = normalized.responseResult
    normalized.responseResult = null
    normalized.responseError = ''
    normalized.responseFromMock = false
  } else {
    normalized.responseFromMock = normalized.responseFromMock ?? false
  }

  return normalized
}

export async function loadSessionCache(): Promise<SessionCachePayload> {
  try {
    const list = (await sessionCacheClient.readAll()) as ApiDebugSessionCacheRecord[]
    const record = Array.isArray(list)
      ? list.find(item => item.id === CACHE_RECORD_ID)
      : null

    if (!record?.tabs?.length) {
      return { activeTabId: '', tabs: [] }
    }

    const tabs = record.tabs.map(normalizeSessionTab)
    const activeTabId =
      record.activeTabId && tabs.some(tab => tab.tabId === record.activeTabId)
        ? record.activeTabId
        : tabs[0].tabId

    return { activeTabId, tabs }
  } catch {
    return { activeTabId: '', tabs: [] }
  }
}

export async function saveSessionCache(payload: SessionCachePayload): Promise<void> {
  const record: ApiDebugSessionCacheRecord = {
    id: CACHE_RECORD_ID,
    activeTabId: payload.activeTabId,
    tabs: JSON.parse(JSON.stringify(payload.tabs)),
    updatedAt: new Date().toISOString(),
  }
  await sessionCacheClient.writeAll([record])
}
