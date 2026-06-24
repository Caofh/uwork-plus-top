// 配置工具函数
import type {
  AppConfig,
  ApiConfig,
  UploadConfig,
  CacheConfig,
  ThemeConfig,
  PaginationConfig,
} from '@/types/config'

// 声明全局配置变量
declare const __APP_CONFIG__: AppConfig
declare const __API_CONFIG__: ApiConfig
declare const __ENV_INFO__: {
  env: string
  isDev: boolean
  isStaging: boolean
  isProd: boolean
}

/**
 * 获取应用配置
 */
export const getAppConfig = (): AppConfig => {
  return __APP_CONFIG__
}

/**
 * 获取API配置
 */
export const getApiConfig = (): ApiConfig => {
  return __API_CONFIG__
}

/**
 * 获取环境信息
 */
export const getEnvInfo = () => {
  return __ENV_INFO__
}

/**
 * 获取上传配置
 */
export const getUploadConfig = (): UploadConfig => {
  return __APP_CONFIG__.upload
}

/**
 * 获取缓存配置
 */
export const getCacheConfig = (): CacheConfig => {
  return __APP_CONFIG__.cache
}

/**
 * 获取主题配置
 */
export const getThemeConfig = (): ThemeConfig => {
  return __APP_CONFIG__.theme
}

/**
 * 获取分页配置
 */
export const getPaginationConfig = (): PaginationConfig => {
  return __APP_CONFIG__.pagination
}

/**
 * 检查是否为开发环境
 */
export const isDevelopment = (): boolean => {
  return __ENV_INFO__.isDev
}

/**
 * 检查是否为测试环境
 */
export const isStaging = (): boolean => {
  return __ENV_INFO__.isStaging
}

/**
 * 检查是否为生产环境
 */
export const isProduction = (): boolean => {
  return __ENV_INFO__.isProd
}

/**
 * 获取配置值（支持嵌套路径）
 */
export const getConfigValue = (path: string, defaultValue?: any): any => {
  try {
    const keys = path.split('.')
    let value = __APP_CONFIG__

    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key]
      } else {
        return defaultValue
      }
    }

    return value
  } catch (error) {
    console.warn(`Failed to get config value for path: ${path}`, error)
    return defaultValue
  }
}

/**
 * 获取API基础URL
 */
export const getApiBaseUrl = (): string => {
  return __API_CONFIG__.baseURL
}

/**
 * 获取API超时时间
 */
export const getApiTimeout = (): number => {
  return __API_CONFIG__.timeout
}

/**
 * 获取重试次数
 */
export const getRetryTimes = (): number => {
  return __API_CONFIG__.retryTimes
}

/**
 * 获取重试延迟
 */
export const getRetryDelay = (): number => {
  return __API_CONFIG__.retryDelay
}

// 导出默认配置
export default __APP_CONFIG__
