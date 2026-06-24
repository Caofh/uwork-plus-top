import axios from 'axios'
import { ElMessage } from 'element-plus'
// import { getCookie } from "./cookie";
// import eventBus from "./eventBus";

// 创建多个axios实例，每个对应不同的域名
export const createAxiosInstance = (config: {
  baseURL: string
  timeout?: number
  instanceName?: string
}) => {
  const instance = (axios as any).create({
    baseURL: config.baseURL,
    timeout: config.timeout || 10000,
    headers: {
      'Content-Type': 'application/json',
    },
  })

  // 请求拦截器
  instance.interceptors.request.use(
    (config: any) => {
      // 添加token到请求头
      // const token = localStorage.getItem('token')
      // if (token && config.headers) {
      //   config.headers.token = `${token}`;
      // } else {
      //   ElMessage.error("登录过期");
      //   setTimeout(() => {
      //     eventBus.emit("setCarouselAuto", "/home");
      //   }, 1500);
      //   return Promise.reject(new Error("登录过期"));
      // }

      // 添加实例标识，便于调试
      if (config.instanceName) {
        console.log(`[${config.instanceName}] Request:`, config.url)
      }

      return config
    },
    (error: any) => {
      console.error('Request Error:', error)
      return Promise.reject(error)
    }
  )

  // 响应拦截器
  instance.interceptors.response.use(
    (response: any) => {
      const { code, msg, data } = response.data
      if (code !== 200) {
        ElMessage.error(msg)
        return Promise.reject(new Error(msg))
      }

      return response.data
    },
    (error: any) => {
      console.error('Response Error:', error)

      if (error.response) {
        const { status, data } = error.response

        switch (status) {
          case 400:
            ElMessage.error('请求参数错误')
            break
          case 401:
            ElMessage.error('未授权，请重新登录')
            localStorage.removeItem('token')
            break
          case 403:
            ElMessage.error('拒绝访问')
            break
          case 404:
            ElMessage.error('请求的资源不存在')
            break
          case 500:
            ElMessage.error('服务器内部错误')
            break
          default:
            ElMessage.error(`请求失败: ${status}`)
        }
      } else if (error.request) {
        ElMessage.error('网络错误，请检查网络连接')
      } else {
        ElMessage.error('请求配置错误')
      }

      return Promise.reject(error)
    }
  )

  return instance
}

// 声明全局变量
declare const __API_CONFIG__: any

// 创建不同域名的实例
export const httpInstances = {
  // 主API实例
  common: createAxiosInstance({
    baseURL: __API_CONFIG__.baseURLCommon, // 从配置文件获取基础URL
    timeout: __API_CONFIG__.timeout, // 从配置文件获取超时时间
    instanceName: 'CommonAPI',
  }),
}

// 封装常用的HTTP方法
export const createHttpMethods = (instance: any) => ({
  get<T = any>(url: string, config?: any): Promise<T> {
    return instance.get(url, config)
  },
  post<T = any>(url: string, data?: any, config?: any): Promise<T> {
    return instance.post(url, data, config)
  },
  put<T = any>(url: string, data?: any, config?: any): Promise<T> {
    return instance.put(url, data, config)
  },
  delete<T = any>(url: string, config?: any): Promise<T> {
    return instance.delete(url, config)
  },
  patch<T = any>(url: string, data?: any, config?: any): Promise<T> {
    return instance.patch(url, data, config)
  },
})

// 导出不同域名的HTTP方法
export const httpMulti = {
  common: createHttpMethods(httpInstances.common),
}
