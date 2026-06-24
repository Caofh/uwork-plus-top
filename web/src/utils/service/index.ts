import { httpMulti } from '@/utils/axios-multi'

// 定义API响应的通用接口
export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
  success: boolean
}

// 应用相关APIa
export const appApiCommon = {
  // 上传图片
  uploadImg: (params?: any) => {
    return httpMulti.common.post<ApiResponse>(
      `/common/uploadImg`,
      {
        ...params,
      },
      {
        headers: {
          'content-type': 'multipart/form-data',
        },
      }
    )
  },
  // 获取用户信息
  getUserInfo: (params?: any) => {
    return httpMulti.common.get<ApiResponse>(`/tpCli/user/getUserInfo`, {
      params,
    })
  },
}
