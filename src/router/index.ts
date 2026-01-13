/*
 * @Author: joven 632795201@qq.com
 * @Date: 2026-01-08 16:24:43
 * @LastEditors: joven 632795201@qq.com
 * @LastEditTime: 2026-01-13 13:42:31
 * @FilePath: \workspace\mobgiai-admin\src\router\index.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/LoginView.vue'
import MainLayout from '../layout/MainLayout.vue'
import AssetsView from '../views/AssetsView.vue'
import ImageGenerateView from '../views/ImageGenerateView.vue'
import uploadTosView from '../views/uploadTos.vue'
import { useAuthStore } from '../stores/auth'
// 取消所有请求  用于路由跳转前取消所有请求
import { cancelAllPending } from '@/utils/request';

// 动态导入 VideoGenerateView 以避免编码问题
const VideoGenerateView = () => import('../views/VideoGenerateView.vue')

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/login'
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: { requiresAuth: false }
    },
    {
      path: '/uploadTos',
      name: 'uploadTos',
      component: uploadTosView,
      meta: { requiresAuth: false }
    },
    {
      path: '/dashboard',
      component: MainLayout,
      redirect: '/dashboard/image-generate',
      meta: { requiresAuth: true },
      children: [
        {
          path: 'assets',
          name: 'assets',
          component: AssetsView,
          meta: { requiresAuth: true }
        },
        {
          path: 'video-generate',
          name: 'video-generate',
          component: VideoGenerateView,
          meta: { requiresAuth: true }
        },
        {
          path: 'image-generate',
          name: 'image-generate',
          component: ImageGenerateView,
          meta: { requiresAuth: true }
        }
      ]
    }
  ]
})

// 路由守卫
router.beforeEach((to, _from, next) => {
  const authStore = useAuthStore()
  
  // 初始化认证状态
  authStore.initAuth()
  
  // 检查路由是否需要认证
  if (to.meta.requiresAuth) {
    if (!authStore.isLoggedIn) {
      // 未登录，跳转到登录页
      next({
        path: '/login',
        query: { redirect: to.fullPath } // 保存原始路径，登录后跳转
      })
      return
    }
  } else if (to.path === '/login' && authStore.isLoggedIn) {
    // 已登录用户访问登录页，跳转到主页
    next('/dashboard/image-generate')
    return
  }
  // 路由跳转前取消所有请求
  cancelAllPending();
  next()
})

export default router