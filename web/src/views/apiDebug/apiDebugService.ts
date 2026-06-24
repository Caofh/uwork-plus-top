import SqlOperate from '@/utils/sqlOperate'
import { apiBaseUrl } from '@/config/remote'
import { createDefaultApi, createDefaultFolder, createDefaultMockCase, type ApiDebugNode } from './types'

export const API_DEBUG_SQL_FILE = 'dataSql/apiDebugList.json'

export const apiDebugService = new SqlOperate(API_DEBUG_SQL_FILE)

export async function loadApiDebugList(): Promise<ApiDebugNode[]> {
  const list = await apiDebugService.readAll()
  if (Array.isArray(list) && list.length > 0) {
    return list
  }
  const defaults = getDefaultSeedData()
  await apiDebugService.writeAll(defaults)
  return defaults
}

function getDefaultSeedData(): ApiDebugNode[] {
  const folder = createDefaultFolder(null, '默认模块')
  folder.id = 'default-folder'
  const api = createDefaultApi(folder.id, 'getAppList')
  api.id = 'sample-api'
  api.method = 'GET'
  api.url = `${apiBaseUrl}/appList/getAppList`
  api.queryParams = [{ key: '', value: '', enabled: true, description: '' }]
  api.mockCases = [
    createDefaultMockCase('成功响应'),
    {
      ...createDefaultMockCase('空列表'),
      body: '{\n  "code": 0,\n  "data": [],\n  "message": "success"\n}',
    },
  ]
  return [folder, api]
}

export function buildTreeData(list: ApiDebugNode[], parentId: string | null = null): ApiDebugNode[] {
  return list
    .filter(item => item.parentId === parentId)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map(item => ({
      ...item,
      children: item.type === 'folder' ? buildTreeData(list, item.id) : undefined,
    }))
}

export function flattenTree(nodes: ApiDebugNode[]): ApiDebugNode[] {
  const result: ApiDebugNode[] = []
  nodes.forEach(node => {
    const { children, ...rest } = node as ApiDebugNode & { children?: ApiDebugNode[] }
    result.push(rest)
    if (children?.length) {
      result.push(...flattenTree(children))
    }
  })
  return result
}
