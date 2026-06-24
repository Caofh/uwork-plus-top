import { toRaw } from 'vue'
import { jsBridge } from '@/utils/electron'
import { PROXY_SQL_FILE } from './constants'

type ProxySqlData = Record<string, unknown>

function cloneForIpc<T>(value: T): T {
  return JSON.parse(JSON.stringify(toRaw(value)))
}

function normalizeSqlResult<T>(result: unknown, fallback: T): T {
  if (result == null) {
    return fallback
  }
  if (typeof result === 'string') {
    try {
      return JSON.parse(result) as T
    } catch {
      return fallback
    }
  }
  return result as T
}

async function proxySql(methods: string, data: ProxySqlData = {}) {
  const result = await jsBridge.registerSync({
    method: 'proxySql',
    json: {
      methods,
      data: {
        ...data,
        sql: PROXY_SQL_FILE,
      },
    },
  })
  return result
}

export const proxyService = {
  async readAll() {
    const result = await proxySql('readAll')
    return normalizeSqlResult<any[]>(result, [])
  },
  async create(item: ProxySqlData) {
    const result = await proxySql('create', { item })
    return normalizeSqlResult(result, item)
  },
  update(id: number, item: ProxySqlData) {
    return proxySql('update', { id, item })
  },
  remove(id: number) {
    return proxySql('remove', { id })
  },
}

export function startExpressApp(newRoutes: unknown[]) {
  return jsBridge.registerSync({
    method: 'startExpressApp',
    json: { newRoutes: cloneForIpc(newRoutes) },
  })
}

export function restartExpressApp(newRoutes: unknown[]) {
  return jsBridge.registerSync({
    method: 'restartExpressApp',
    json: { newRoutes: cloneForIpc(newRoutes) },
  })
}

type SystemProxyResult = {
  code?: number
  message?: string
  data?: {
    supported?: boolean
    enabled?: boolean
    running?: boolean
    host?: string
    port?: number
    service?: string
    macProxyEnabled?: boolean
    routeCount?: number
    mockRuleCount?: number
    mitm?: boolean
    caPath?: string
    caExists?: boolean
    caInKeychain?: boolean
    caTrusted?: boolean
  }
}

function normalizeBridgeResult<T>(result: unknown, fallback: T): T {
  if (result == null) {
    return fallback
  }
  if (typeof result === 'string') {
    try {
      return JSON.parse(result) as T
    } catch {
      return fallback
    }
  }
  return result as T
}

export function enableSystemProxy(routes: unknown[]) {
  return jsBridge.registerSync({
    method: 'enableSystemProxy',
    json: { routes: cloneForIpc(routes) },
  }) as Promise<SystemProxyResult>
}

export function disableSystemProxy() {
  return jsBridge.registerSync({
    method: 'disableSystemProxy',
    json: {},
  }) as Promise<SystemProxyResult>
}

export function updateSystemProxyRoutes(routes: unknown[]) {
  return jsBridge.registerSync({
    method: 'updateSystemProxyRoutes',
    json: { routes: cloneForIpc(routes) },
  }) as Promise<SystemProxyResult>
}

export async function getSystemProxyStatus() {
  const result = await jsBridge.registerSync({
    method: 'getSystemProxyStatus',
    json: {},
  })
  const normalized = normalizeBridgeResult<SystemProxyResult>(result, {})
  return normalized.data || {}
}

export function installMitmCa() {
  return jsBridge.registerSync({
    method: 'installMitmCa',
    json: {},
  }) as Promise<SystemProxyResult>
}

export function revealMitmCa() {
  return jsBridge.registerSync({
    method: 'revealMitmCa',
    json: {},
  }) as Promise<SystemProxyResult>
}
