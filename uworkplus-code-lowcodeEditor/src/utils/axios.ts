import axios from "axios";
import { ElMessage } from "element-plus";
// import { getCookie } from "./cookie";
// import eventBus from "./eventBus";


// 声明全局变量
declare const __API_CONFIG__: any;

// 创建axios实例
const instance = (axios as any).create({
  baseURL: __API_CONFIG__.baseURL, // 从配置文件获取基础URL
  timeout: __API_CONFIG__.timeout, // 从配置文件获取超时时间
  headers: {
    "Content-Type": "application/json",
  },
});

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

    return config;
  },
  (error: any) => {
    // 对请求错误做些什么
    console.error("Request Error:", error);
    return Promise.reject(error);
  }
);

// 响应拦截器
instance.interceptors.response.use(
  (response: any) => {
    // 对响应数据做点什么
    console.log("Response:", response);

    const { code, msg, data } = response.data;
    if (code !== 200) {
      ElMessage.error(msg);
      return Promise.reject(new Error(msg));
    }

    // 如果响应成功，直接返回数据
    return response.data;
  },
  (error: any) => {
    // 对响应错误做点什么
    console.error("Response Error:", error);

    if (error.response) {
      // 服务器返回了错误状态码
      const { status, data } = error.response;

      switch (status) {
        case 400:
          ElMessage.error("请求参数错误");
          break;
        case 401:
          ElMessage.error("未授权，请重新登录");
          // 清除token并跳转到登录页
          localStorage.removeItem("token");
          // 这里可以添加路由跳转逻辑
          break;
        case 403:
          ElMessage.error("拒绝访问");
          break;
        case 404:
          ElMessage.error("请求的资源不存在");
          break;
        case 500:
          ElMessage.error("服务器内部错误");
          break;
        default:
          ElMessage.error(`请求失败: ${status}`);
      }
    } else if (error.request) {
      // 请求已经发出，但没有收到响应
      ElMessage.error("网络错误，请检查网络连接");
    } else {
      // 其他错误
      ElMessage.error("请求配置错误");
    }

    return Promise.reject(error);
  }
);

// 封装常用的HTTP方法
export const http = {
  get<T = any>(url: string, config?: any): Promise<T> {
    return instance.get(url, config);
  },

  post<T = any>(url: string, data?: any, config?: any): Promise<T> {
    return instance.post(url, data, config);
  },

  put<T = any>(url: string, data?: any, config?: any): Promise<T> {
    return instance.put(url, data, config);
  },

  delete<T = any>(url: string, config?: any): Promise<T> {
    return instance.delete(url, config);
  },

  patch<T = any>(url: string, data?: any, config?: any): Promise<T> {
    return instance.patch(url, data, config);
  },
};

// 导出axios实例，以便需要时直接使用
export default instance;
