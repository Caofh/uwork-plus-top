// Axios类型声明文件

declare module 'axios' {
  export interface AxiosRequestConfig {
    // 扩展axios配置类型
    [key: string]: any
  }
}

// 环境变量类型声明
interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string
  readonly VITE_DEV_MODE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
