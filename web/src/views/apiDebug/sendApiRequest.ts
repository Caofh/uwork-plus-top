import axios from 'axios'
import { jsBridge, isInElectron } from '@/utils/electron'
import type { ApiDebugNode, ApiResponseResult, KeyValueItem } from './types'

function pickEnabled(items: KeyValueItem[] = []) {
  const result: Record<string, string> = {}
  items.forEach(item => {
    if (item.enabled && item.key?.trim()) {
      result[item.key.trim()] = item.value ?? ''
    }
  })
  return result
}

function buildRequestBody(api: ApiDebugNode) {
  if (api.bodyType === 'none') {
    return undefined
  }
  const body = api.body ?? ''
  if (api.bodyType === 'json') {
    if (!body.trim()) {
      return undefined
    }
    try {
      return JSON.parse(body)
    } catch {
      throw new Error('Body JSON 格式不正确')
    }
  }
  return body
}

export async function sendHttpRequest(api: ApiDebugNode): Promise<ApiResponseResult> {
  const method = (api.method || 'GET').toUpperCase()
  const url = (api.url || '').trim()
  if (!url) {
    throw new Error('请输入请求 URL')
  }

  const headers = pickEnabled(api.headers)
  const params = pickEnabled(api.queryParams)
  const data = buildRequestBody(api)

  if (isInElectron()) {
    const result: ApiResponseResult = await jsBridge.registerSync({
      method: 'sendApiRequest',
      json: {
        method,
        url,
        headers,
        params,
        data,
      },
    })
    return result
  }

  const start = Date.now()
  try {
    const response = await axios({
      method,
      url,
      headers,
      params,
      data,
      timeout: 60000,
      validateStatus: () => true,
    })
    const responseData = response.data
    const size =
      typeof responseData === 'string'
        ? new TextEncoder().encode(responseData).length
        : new TextEncoder().encode(JSON.stringify(responseData)).length

    return {
      code: 0,
      status: response.status,
      statusText: response.statusText,
      headers: response.headers as Record<string, string>,
      data: responseData,
      duration: Date.now() - start,
      size,
    }
  } catch (error: any) {
    if (error.response) {
      return {
        code: 0,
        status: error.response.status,
        statusText: error.response.statusText,
        headers: error.response.headers,
        data: error.response.data,
        duration: Date.now() - start,
        size: 0,
        message: error.message,
      }
    }
    return {
      code: -1,
      message: error.message || '请求失败',
      duration: Date.now() - start,
    }
  }
}

export function formatResponseBody(data: unknown): string {
  if (data == null) {
    return ''
  }
  if (typeof data === 'string') {
    try {
      return JSON.stringify(JSON.parse(data), null, 2)
    } catch {
      return data
    }
  }
  try {
    return JSON.stringify(data, null, 2)
  } catch {
    return String(data)
  }
}

export function formatSize(size = 0): string {
  if (size < 1024) {
    return `${size}B`
  }
  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(2)}KB`
  }
  return `${(size / 1024 / 1024).toFixed(2)}MB`
}
