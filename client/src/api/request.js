import axios from 'axios'
import { showToast } from 'vant'
import router from '../router'

// 创建 axios 实例
const request = axios.create({
  baseURL: '/api',
  timeout: 10000
})

// 请求拦截器 - 添加 token
request.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// 响应拦截器
request.interceptors.response.use(
  response => {
    const res = response.data
    if (res.success === false) {
      showToast(res.message || '请求失败')
      return Promise.reject(new Error(res.message || '请求失败'))
    }
    return res
  },
  error => {
    console.error('请求错误:', error)
    const status = error.response?.status
    const message = error.response?.data?.message
    
    // 401 未登录或 token 过期
    if (status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      showToast(message || '请先登录')
      router.push({ path: '/login', query: { redirect: router.currentRoute.value.fullPath } })
      return Promise.reject(error)
    }
    
    // 403 权限不足
    if (status === 403) {
      showToast(message || '权限不足')
      return Promise.reject(error)
    }
    
    showToast(message || '网络错误')
    return Promise.reject(error)
  }
)

export default request
