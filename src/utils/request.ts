import axios from 'axios'
import type { AxiosError } from 'axios'

// 后端统一返回的数据格式
export interface ApiResponse<T> {
  code: number
  message: string
  data: T
}

// 创建 Axios 实例
const request = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 请求拦截器
request.interceptors.request.use(
  (config) => {
    console.log(`[请求] ${config.method?.toUpperCase()} ${config.url}`)

    return config
  },
  (error) => Promise.reject(error),
)

// 响应拦截器
request.interceptors.response.use(
  (response) => {
    // HTTP 成功不代表业务一定成功
    if (response.data?.code !== 0) {
      return Promise.reject(new Error(response.data?.message || '业务请求失败'))
    }

    return response
  },
  (error: AxiosError<ApiResponse<unknown>>) => {
    let errorMessage = '请求失败，请稍后重试'

    if (error.response) {
      // 后端已经响应，但返回了 4xx / 5xx 状态
      errorMessage =
        error.response.data?.message || `服务器错误：${error.response.status}`
    } else if (error.code === 'ECONNABORTED') {
      errorMessage = '请求超时'
    } else if (error.request) {
      errorMessage = '网络异常，请检查后端服务是否启动'
    }

    return Promise.reject(new Error(errorMessage))
  },
)

export default request
