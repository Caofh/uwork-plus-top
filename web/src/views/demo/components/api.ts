import { http } from '@/utils/axios'

// 定义API响应的通用接口
export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
  success: boolean
}

// 用户相关API
export const userApi = {
  // 用户登录
  login: (data: { username: string; password: string }) => {
    return http.post<ApiResponse<{ token: string; userInfo: any }>>('/user/login', data)
  },

  // 获取用户信息
  getUserInfo: () => {
    return http.get<ApiResponse<any>>('/user/info')
  },

  // 用户登出
  logout: () => {
    return http.post<ApiResponse>('/user/logout')
  },
}

// 应用相关API
export const appApi = {
  // 获取应用列表
  getAppList: (params?: { page?: number; size?: number; keyword?: string }) => {
    const demoToken = import.meta.env.VITE_DEMO_API_TOKEN as string | undefined
    return http.get<ApiResponse>(`/appList/getAppList?r=${new Date().getTime()}`, {
      params,
      ...(demoToken ? { headers: { token: demoToken } } : {}),
    })
  },

  // 创建应用
  createApp: (data: any) => {
    return http.post<ApiResponse>('/app/create', data)
  },

  // 更新应用
  updateApp: (id: string, data: any) => {
    return http.put<ApiResponse>(`/app/${id}`, data)
  },

  // 删除应用
  deleteApp: (id: string) => {
    return http.delete<ApiResponse>(`/app/${id}`)
  },
}

// 文档相关API
export const documentApi = {
  // 获取文档列表
  getDocumentList: (params?: { page?: number; size?: number; category?: string }) => {
    return http.get<ApiResponse>('/document/list', { params })
  },

  // 获取文档详情
  getDocumentDetail: (id: string) => {
    return http.get<ApiResponse<any>>(`/document/${id}`)
  },

  // 创建文档
  createDocument: (data: any) => {
    return http.post<ApiResponse>('/document/create', data)
  },

  // 更新文档
  updateDocument: (id: string, data: any) => {
    return http.put<ApiResponse>(`/document/${id}`, data)
  },
}

// 工具相关API
export const toolApi = {
  // 获取工具列表
  getToolList: () => {
    return http.get<ApiResponse<any[]>>('/tool/list')
  },

  // 执行工具
  executeTool: (toolId: string, params: any) => {
    return http.post<ApiResponse>(`/tool/${toolId}/execute`, params)
  },
}

// 网站相关API
export const websiteApi = {
  // 获取网站信息
  getWebsiteInfo: (url: string) => {
    return http.get<ApiResponse<any>>('/website/info', { params: { url } })
  },

  // 检查网站状态
  checkWebsiteStatus: (url: string) => {
    return http.get<ApiResponse<{ status: string; responseTime: number }>>('/website/status', {
      params: { url },
    })
  },
}

// 导出所有API
export default {
  user: userApi,
  app: appApi,
  document: documentApi,
  tool: toolApi,
  website: websiteApi,
}
