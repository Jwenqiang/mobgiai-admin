import { defineStore } from 'pinia'
import { ref } from 'vue'

interface UserInfo {
  id: string | number // 允许string或number类型
  username: string
  email?: string
  avatar?: string
  [key: string]: any
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('token'))
  const userInfo = ref<UserInfo | null>(null)
  const isLoggedIn = ref<boolean>(!!token.value)

  // 设置登录信息
  const setAuth = (authToken: string, user: UserInfo) => {
    token.value = authToken
    userInfo.value = user
    isLoggedIn.value = true
    localStorage.setItem('token', authToken)
    localStorage.setItem('userInfo', JSON.stringify(user))
  }

  // 清除登录信息
  const clearAuth = () => {
    token.value = null
    userInfo.value = null
    isLoggedIn.value = false
    localStorage.removeItem('token')
    localStorage.removeItem('userInfo')
  }

  // 初始化用户信息
  const initAuth = () => {
    const savedUserInfo = localStorage.getItem('userInfo')
    if (savedUserInfo) {
      userInfo.value = JSON.parse(savedUserInfo)
    }
  }

  return {
    token,
    userInfo,
    isLoggedIn,
    setAuth,
    clearAuth,
    initAuth
  }
},
// 开启或关闭持久化 ✅
{ persist: false }
// {//自定义相关持久信息
//   persist: {
//     enabled:false,
//     // 1. 自定义存储的key（默认是store的id）
//     key: 'my_user_store',
//     // 2. 自定义存储位置：localStorage | sessionStorage
//     storage: sessionStorage, // 选sessionStorage则页面关闭后数据丢失
//     // 3. 按需持久化：只持久化指定的state字段 ✅ 高频使用
//     paths: ['token']
//   }
// }
)