export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS'

export type BodyType = 'none' | 'json' | 'raw'

export type NodeType = 'folder' | 'api'

export interface KeyValueItem {
  key: string
  value: string
  enabled: boolean
  description?: string
}

export interface ApiMockCase {
  id: string
  name: string
  statusCode: number
  delay: number
  body: string
}

export interface ApiDebugNode {
  id: string
  type: NodeType
  name: string
  parentId: string | null
  order?: number
  method?: HttpMethod
  url?: string
  queryParams?: KeyValueItem[]
  headers?: KeyValueItem[]
  bodyType?: BodyType
  body?: string
  mockCases?: ApiMockCase[]
  mockEnabled?: boolean
  activeMockCaseId?: string
  /** Mock 拦截完整请求 URL 的正则表达式 */
  mockUrlPattern?: string
  /** 保存时的左右响应快照，写入 apiDebugList.json */
  savedResponse?: ApiDebugSavedResponse
  createTime?: string
  updateTime?: string
}

export interface ApiResponseResult {
  code: number
  status?: number
  statusText?: string
  headers?: Record<string, string>
  data?: unknown
  duration?: number
  size?: number
  message?: string
}

/** 点击「保存」时持久化的左右响应快照 */
export interface ApiDebugSavedResponse {
  responseResult: ApiResponseResult | null
  responseError: string
  responseFromMock: boolean
  mockResponseResult: ApiResponseResult | null
  mockResponseError: string
}

export const HTTP_METHODS: HttpMethod[] = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS']

export function createEmptyKeyValue(): KeyValueItem {
  return { key: '', value: '', enabled: true, description: '' }
}

export function createDefaultMockCase(name = '默认场景'): ApiMockCase {
  return {
    id: `mock-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name,
    statusCode: 200,
    delay: 0,
    body: '{\n  "code": 0,\n  "data": {},\n  "message": "success"\n}',
  }
}

export function ensureMockCases(cases?: ApiMockCase[]): ApiMockCase[] {
  if (Array.isArray(cases) && cases.length > 0) {
    return cases
  }
  return [createDefaultMockCase()]
}

export function createDefaultApi(parentId: string | null, name = '新接口'): ApiDebugNode {
  const now = new Date().toISOString()
  return {
    id: `${Date.now()}`,
    type: 'api',
    name,
    parentId,
    order: Date.now(),
    method: 'GET',
    url: 'http://127.0.0.1:7030/',
    queryParams: [createEmptyKeyValue()],
    headers: [
      { key: 'Content-Type', value: 'application/json', enabled: true },
      createEmptyKeyValue(),
    ],
    bodyType: 'none',
    body: '',
    createTime: now,
    updateTime: now,
  }
}

export interface ApiDebugSessionTab {
  tabId: string
  apiId: string
  api: ApiDebugNode
  responseResult: ApiResponseResult | null
  responseError: string
  mockResponseResult: ApiResponseResult | null
  mockResponseError: string
  requestTab: string
  responseTab: string
  mockResponseTab: string
  mockEnabled: boolean
  activeMockCaseId: string
  /** 左侧响应区是否来自 Mock（点击发送且 Mock 开关打开） */
  responseFromMock: boolean
}

export interface ApiDebugSessionCacheRecord {
  id: string
  activeTabId: string
  tabs: ApiDebugSessionTab[]
  updatedAt?: string
}

export function createSessionTab(apiNode: ApiDebugNode, tabId?: string): ApiDebugSessionTab {
  const api = JSON.parse(JSON.stringify(apiNode))
  api.mockCases = ensureMockCases(api.mockCases)
  return {
    tabId: tabId || `tab-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    apiId: api.id,
    api,
    responseResult: null,
    responseError: '',
    mockResponseResult: null,
    mockResponseError: '',
    requestTab: 'params',
    responseTab: 'body',
    mockResponseTab: 'body',
    mockEnabled: api.mockEnabled ?? false,
    activeMockCaseId: api.activeMockCaseId || api.mockCases[0]?.id || '',
    responseFromMock: false,
  }
}

export function createDefaultFolder(parentId: string | null, name = '新目录'): ApiDebugNode {
  return {
    id: `${Date.now()}`,
    type: 'folder',
    name,
    parentId,
    order: Date.now(),
    createTime: new Date().toISOString(),
  }
}
