import request from '@/utils/request'

export interface User {
  id: number
  name: string
  email: string
  avatar?: string
}

export interface LoginParams {
  email: string
  password: string
}

export interface LoginResponse {
  token: string
  user: User
}

// 用户登录
export const login = (params: LoginParams): Promise<LoginResponse> => {
  return request.post('/auth/login', params)
}

// 获取用户信息
export const getUserInfo = (): Promise<User> => {
  return request.get('/user/info')
}

// 更新用户信息
export const updateUserInfo = (data: Partial<User>): Promise<User> => {
  return request.put('/user/info', data)
}
