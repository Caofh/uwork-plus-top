const env = import.meta.env

// 导出常用的环境变量，方便使用
export const MODE = env.MODE
export const IS_DEV = MODE === 'development'
export const IS_PROD = MODE === 'production'

export default env
