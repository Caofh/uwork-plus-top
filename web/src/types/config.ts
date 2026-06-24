// 配置类型定义

// 应用基础配置
export interface AppConfig {
  app: {
    name: string
    version: string
    description: string
  }

  api: ApiConfig

  upload: UploadConfig

  cache: CacheConfig

  theme: ThemeConfig

  pagination: PaginationConfig

  debug: boolean

  mock: boolean

  env?: string
}

// API配置
export interface ApiConfig {
  baseURL: string
  timeout: number
  retryTimes: number
  retryDelay: number
}

// 上传配置
export interface UploadConfig {
  maxSize: number
  allowedTypes: string[]
  endpoint: string
}

// 缓存配置
export interface CacheConfig {
  prefix: string
  expire: number
  storage: 'localStorage' | 'sessionStorage'
}

// 主题配置
export interface ThemeConfig {
  primary: string
  success: string
  warning: string
  danger: string
  info: string
}

// 分页配置
export interface PaginationConfig {
  pageSize: number
  pageSizes: number[]
  showSizeChanger: boolean
  showQuickJumper: boolean
}

// 环境信息
export interface EnvInfo {
  env: string
  isDev: boolean
  isStaging: boolean
  isProd: boolean
}

// 配置键类型
export type ConfigKey = keyof AppConfig
export type ApiConfigKey = keyof ApiConfig
export type UploadConfigKey = keyof UploadConfig
export type CacheConfigKey = keyof CacheConfig
export type ThemeConfigKey = keyof ThemeConfig
export type PaginationConfigKey = keyof PaginationConfig
