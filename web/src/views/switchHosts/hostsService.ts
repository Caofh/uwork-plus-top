import { jsBridge } from '@/utils/electron'
import { HOSTS_SQL_FILE, HOSTS_TRASH_SQL_FILE } from './constants'

type HostsSqlData = Record<string, unknown>

export type HostsProfile = {
  id: number
  hostsName: string
  inUse: boolean
  hostsContent: string
  deletedAt?: string
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

async function proxySql(methods: string, data: HostsSqlData = {}, sql = HOSTS_SQL_FILE) {
  const result = await jsBridge.registerSync({
    method: 'proxySql',
    json: {
      methods,
      data: {
        ...data,
        sql,
      },
    },
  })
  return result
}

export const hostsService = {
  async readAll() {
    const result = await proxySql('readAll')
    return normalizeSqlResult<HostsProfile[]>(result, [])
  },
  async create(item: HostsSqlData) {
    const result = await proxySql('create', { item })
    return normalizeSqlResult(result, item)
  },
  update(id: number, item: HostsSqlData) {
    return proxySql('update', { id, item })
  },
  remove(id: number) {
    return proxySql('remove', { id })
  },
}

export const hostsTrashService = {
  async readAll() {
    const result = await proxySql('readAll', {}, HOSTS_TRASH_SQL_FILE)
    return normalizeSqlResult<HostsProfile[]>(result, [])
  },
  async create(item: HostsSqlData) {
    const result = await proxySql('create', { item }, HOSTS_TRASH_SQL_FILE)
    return normalizeSqlResult(result, item)
  },
  remove(id: number) {
    return proxySql('remove', { id }, HOSTS_TRASH_SQL_FILE)
  },
}

export async function readSystemHosts() {
  const result = await jsBridge.registerSync({
    method: 'readSystemHosts',
    json: {},
  })
  if (result?.code === -1) {
    throw new Error(result.message || '读取系统 hosts 失败')
  }
  return String(result?.data ?? '')
}

export async function isHostsWriteReady() {
  const result = await jsBridge.registerSync({
    method: 'isHostsWriteReady',
    json: {},
  })
  return Boolean(result?.data)
}

export async function applyHostsProfiles(profiles: HostsProfile[]) {
  const result = await jsBridge.registerSync({
    method: 'applyHostsProfiles',
    json: { profiles },
  })
  if (result?.code === -1) {
    throw new Error(result.message || '写入系统 hosts 失败')
  }
  return result
}
