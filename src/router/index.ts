import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/LoginView.vue'
import MainLayout from '../layout/MainLayout.vue'
import AssetsView from '../views/AssetsView.vue'
import ImageGenerateView from '../views/ImageGenerateView.vue'
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
      path: '/dashboard',
      component: MainLayout,
      redirect: '/dashboard/assets',
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
    next('/dashboard/assets')
    return
  }
  // 路由跳转前取消所有请求
  cancelAllPending();
  next()
})

export default router