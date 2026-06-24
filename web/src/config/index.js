// 环境配置
const env = process.env.NODE_ENV || 'development'
// const env = 'production'
console.log('env')
console.log(env)

const remoteOrigin = (process.env.VITE_REMOTE_ORIGIN || '').trim()
const defaultApiBase = remoteOrigin ? `${remoteOrigin}/api_2020/iwork` : '/api'
const defaultApiCommon = remoteOrigin ? `${remoteOrigin}/api_2020` : ''

// 基础配置
const baseConfig = {
  // 应用基础配置
  app: {
    name: 'UworkPlus',
    version: '1.0.0',
    description: 'UworkPlus Application',
  },

  // API配置
  api: {
    baseURL: '/api',
    timeout: 10000,
    retryTimes: 3,
    retryDelay: 1000,
  },

  // 上传配置
  upload: {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
    endpoint: '/upload',
  },

  // 缓存配置
  cache: {
    prefix: 'uwork_',
    expire: 24 * 60 * 60 * 1000, // 24小时
    storage: 'localStorage', // localStorage 或 sessionStorage
  },

  // 主题配置
  theme: {
    primary: '#409eff',
    success: '#67c23a',
    warning: '#e6a23c',
    danger: '#f56c6c',
    info: '#909399',
  },

  // 分页配置
  pagination: {
    pageSize: 20,
    pageSizes: [10, 20, 50, 100],
    showSizeChanger: true,
    showQuickJumper: true,
  },
}

// 开发环境配置
const developmentConfig = {
  ...baseConfig,
  api: {
    ...baseConfig.api,
    // baseURL: 'http://localhost:7001/api',
    baseURL: process.env.VITE_API_BASE_URL || defaultApiBase,
    baseURLCommon: process.env.VITE_API_BASE_COMMON || defaultApiCommon,
  },
  debug: true,
  mock: true,
}

// 测试环境配置
const stagingConfig = {
  ...baseConfig,
  api: {
    ...baseConfig.api,
    baseURL: process.env.VITE_API_BASE_URL || defaultApiBase,
    baseURLCommon: process.env.VITE_API_BASE_COMMON || defaultApiCommon,
  },
  debug: true,
  mock: false,
}

// 生产环境配置
const productionConfig = {
  ...baseConfig,
  api: {
    ...baseConfig.api,
    baseURL: process.env.VITE_API_BASE_URL || defaultApiBase,
    baseURLCommon: process.env.VITE_API_BASE_COMMON || defaultApiCommon,
  },
  debug: false,
  mock: false,
}

// 环境配置映射
const envConfigs = {
  development: developmentConfig,
  staging: stagingConfig,
  production: productionConfig,
}

// 获取当前环境配置
const config = envConfigs[env] || baseConfig

// 导出配置
export default config

// 导出环境信息
export const envInfo = {
  env,
  isDev: env === 'development',
  isStaging: env === 'staging',
  isProd: env === 'production',
}

// 导出API配置
export const apiConfig = config.api

// 导出其他配置
export const { app, upload, cache, theme, pagination, debug, mock } = config
