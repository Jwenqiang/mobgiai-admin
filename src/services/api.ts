import axios from 'axios'

// 类型定义
interface ApiResponse<T = unknown> {
  code: number
  message: string
  data: T
}

interface LoginResponse {
  token: string
  userInfo: {
    id: number
    username: string
    phone: string
    nickname: string
    avatar: string
    createTime: string
    lastLoginTime: string
  }
  expiresIn: number
}

interface SendCodeResponse {
  phone: string
  expireTime: number
}

// 创建 axios 实例
const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
})

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    // 添加 token 等认证信息
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器 - 模拟API响应
api.interceptors.response.use(
  (response) => {
    // 直接返回响应数据，因为这是真实的API响应
    return response.data
  },
  (error) => {
    console.log("拦截器")
    // 处理网络错误，返回模拟数据
    if (error.code === 'ERR_NETWORK' || error.message === 'Network Error'
      ||error.code=='ERR_BAD_REQUEST') {
      const { url, method, data } = error.config
      
      // 模拟登录接口网络错误处理
      if (url === '/auth/login' && method === 'post') {
        const requestData = data ? JSON.parse(data) : {}
        const { phone, code } = requestData
        
        console.log('API请求失败，使用模拟数据 - 登录接口')
        
        // 延迟1秒返回模拟数据
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            // 验证手机号格式
            if (!/^1[3-9]\d{9}$/.test(phone)) {
              reject(new Error('手机号格式不正确'))
              return
            }

            // 验证验证码格式
            if (!/^\d{6}$/.test(code)) {
              reject(new Error('验证码格式不正确'))
              return
            }

            // 模拟验证码验证（123456为正确验证码）
            if (code !== '123456') {
              reject(new Error('验证码错误'))
              return
            }

            // 生成模拟token和用户信息
            const token = `mock_token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
            const userInfo = {
              id: Date.now(),
              username: `用户${phone.substr(-4)}`, // 添加username字段
              phone,
              nickname: `用户${phone.substr(-4)}`,
              avatar: '',
              createTime: new Date().toISOString(),
              lastLoginTime: new Date().toISOString()
            }

            console.log('模拟登录成功:', { phone, token, userInfo })
            
            resolve({
              code: 200,
              message: '登录成功',
              data: {
                token,
                userInfo,
                expiresIn: 7 * 24 * 60 * 60 // 7天过期
              }
            })
          }, 1000) // 1秒延迟
        })
      }
      
      // 模拟发送验证码接口网络错误处理
      if (url === '/auth/send-code' && method === 'post') {
        const requestData = data ? JSON.parse(data) : {}
        const { phone } = requestData
        
        console.log('API请求失败，使用模拟数据 - 发送验证码接口')
        
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            // 验证手机号格式
            if (!/^1[3-9]\d{9}$/.test(phone)) {
              reject(new Error('手机号格式不正确'))
              return
            }
            
            console.log(`模拟发送验证码到 ${phone}`)
            
            resolve({
              code: 200,
              message: '验证码发送成功',
              data: {
                phone,
                expireTime: 60 // 60秒过期
              }
            })
          }, 1000) // 1秒延迟
        })
      }
      
      // 模拟退出登录接口网络错误处理
      if (url === '/auth/logout' && method === 'post') {
        console.log('API请求失败，使用模拟数据 - 退出登录接口')
        
        return new Promise((resolve) => {
          setTimeout(() => {
            console.log('模拟退出登录')
            
            resolve({
              code: 200,
              message: '退出登录成功',
              data: null
            })
          }, 500) // 0.5秒延迟
        })
      }
    }
    
    // 处理401未授权错误
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    
    return Promise.reject(error)
  }
)

// API 接口定义
export const authAPI = {
  // 发送验证码
  sendCode: (phone: string): Promise<ApiResponse<SendCodeResponse>> => {
    return api.post('/auth/send-code', { phone })
  },
  
  // 登录
  login: (phone: string, code: string): Promise<ApiResponse<LoginResponse>> => {
    return api.post('/auth/login', { phone, code })
  },
  
  // 退出登录
  logout: (): Promise<ApiResponse> => {
    return api.post('/auth/logout')
  }
}

export const chatAPI = {
  // 发送消息
  sendMessage: (message: string, files?: File[]) => {
    const formData = new FormData()
    formData.append('message', message)
    
    if (files) {
      files.forEach((file, index) => {
        formData.append(`file_${index}`, file)
      })
    }
    
    return api.post('/chat/send', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },
  
  // 获取聊天历史
  getChatHistory: () => {
    return api.get('/chat/history')
  },
  
  // 删除聊天
  deleteChat: (chatId: string) => {
    return api.delete(`/chat/${chatId}`)
  }
}

export const uploadAPI = {
  // 上传文件
  uploadFile: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    
    return api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  }
}

export default api