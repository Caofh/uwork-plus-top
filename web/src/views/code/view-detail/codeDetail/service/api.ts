import { http } from '@/utils/axios'

// 定义API响应的通用接口
export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
  success: boolean
}

// 应用相关APIa
export const appApi = {
  // 获取应用列表
  getAppList: (params?: {
    app_type?: number | null
    test?: number | null
    article_type?: number | null
  }) => {
    return http.get<ApiResponse>(`/articleList/getArticleList?r=${new Date().getTime()}`, {
      params,
    })
  },
  // 获取应用分组列表
  getAppTypeList: (params?: any) => {
    return http.get<ApiResponse>(`/appTypes/getAppTypesList?r=${new Date().getTime()}`, { params })
  },
  // 编辑应用分组列表
  editAppTypeList: (params?: { id: number | string; type_name: string }) => {
    return http.post<ApiResponse>(`/appTypes/upAppType`, { ...params })
  },
  // 删除应用分组列表
  removeAppTypeList: (params?: { id: number | string }) => {
    return http.post<ApiResponse>(`/appTypes/removeAppType`, { ...params })
  },
  // 添加应用分组
  addAppType: (params?: any) => {
    return http.post<ApiResponse>(`/appTypes/addAppType`, { ...params })
  },
  // 添加应用
  addApp: (params?: any) => {
    return http.post<ApiResponse>(`/articleList/addArticle`, { ...params })
  },
  // 编辑应用
  editApp: (params?: any) => {
    return http.post<ApiResponse>(`/articleList/updateArticle`, { ...params })
  },
  // 删除应用
  removeApp: (params?: any) => {
    return http.post<ApiResponse>(`/articleList/removeArticle`, { ...params })
  },
}
