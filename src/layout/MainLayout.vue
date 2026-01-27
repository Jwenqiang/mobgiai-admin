<template>
  <div class="main-layout">
    <!-- 侧边栏 -->
    <div class="sidebar" :class="{ collapsed: sidebarCollapsed }">
      <div class="sidebar-header">
        <div class="logo">
          <img src="@/assets/logo.svg" alt="MobgiAI Logo" class="logo-icon" />
          <span v-if="!sidebarCollapsed" class="logo-text">MobgiAI</span>
        </div>
        <el-button 
          type="text" 
          class="collapse-btn"
          @click="toggleSidebar"
        >
          <el-icon>
            <Expand v-if="sidebarCollapsed" />
            <Fold v-else />
          </el-icon>
        </el-button>
      </div>
      
      <div class="sidebar-content">
        <el-menu
          :default-active="activeMenu"
          class="sidebar-menu"
          :collapse="sidebarCollapsed"
          :collapse-transition="false"
          router
        >
          <el-menu-item index="/mobgiAI/assets">
            <el-icon><Wallet /></el-icon>
            <template #title>资产</template>
          </el-menu-item>
          
          <!-- <el-menu-item index="/mobgiAI/video-generate">
            <el-icon><VideoCamera /></el-icon>
            <template #title>视频生成</template>
          </el-menu-item> -->
          
          <el-menu-item index="/mobgiAI/generate">
            <!-- <el-icon><Picture /></el-icon> -->
            <el-icon><Opportunity /></el-icon>
            <template #title>MobgiAI创作</template>
          </el-menu-item>
        </el-menu>
      </div>
      
      <div class="sidebar-footer">
        <!-- 用户信息已移动到面包屑右侧 -->
      </div>
    </div>

    <!-- 主内容区 -->
    <div class="main-content" :class="{ expanded: sidebarCollapsed }">
      <div class="content-header">
        <div class="breadcrumb">
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/mobgiAI' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item>{{ currentPageTitle }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        
        <div class="header-actions">
          <div class="user-info-header">
            <div class="user-avatar-wrapper">
              <el-avatar :size="36" :src="userAvatar" class="user-avatar">
                <el-icon><User /></el-icon>
              </el-avatar>
              <div class="online-indicator"></div>
            </div>
            <div class="user-details-header">
              <div class="user-name">{{ userName }}</div>
              <div class="user-role">{{ userRole }}</div>
            </div>
            <el-dropdown @command="handleUserCommand" class="user-dropdown">
              <el-button type="link" class="user-menu-btn">
                <el-icon><More /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu class="custom-dropdown-menu">
                  <el-dropdown-item command="logout" class="dropdown-item logout-item">
                    <el-icon class="dropdown-icon"><SwitchButton /></el-icon>
                    <span>退出登录</span>
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>
      </div>
      
      <div class="content-body">
        <router-view />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Expand, Fold, VideoCamera, User, 
  More, SwitchButton, Opportunity
} from '@element-plus/icons-vue'
import { useAuthStore } from '../stores/auth'
// import { authAPI } from '../services/api'
import { logout } from '../api/index'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const sidebarCollapsed = ref(false)

const activeMenu = computed(() => route.path)

const currentPageTitle = computed(() => {
  const titleMap: Record<string, string> = {
    '/mobgiAI/assets': '资产管理',
    '/mobgiAI/video-generate': '视频生成',
    '/mobgiAI/generate': 'MobgiAI创作'
  }
  return titleMap[route.path] || '首页'
})

// 用户信息
const userName = computed(() => {
  return authStore.userInfo?.nickname || '用户'
})

const userRole = computed(() => {
  return '高级用户' // 可以从用户信息中获取
})

const userAvatar = computed(() => {
  return authStore.userInfo?.avatar || ''
})

const toggleSidebar = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value
}

const handleUserCommand = async (command: string) => {
  switch (command) {
    case 'logout':
      await handleLogout()
      break
  }
}

// 退出登录
const handleLogout = async () => {
  try {
    await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    try {
      // 调用退出登录API（等待完成后再清除本地状态）
      await logout()
    } catch (error) {
      console.error('退出登录API调用失败:', error)
      // 即使API调用失败，也要清除本地状态
    }
    
    // 清除认证状态
    authStore.clearAuth()
    
    ElMessage.success('已退出登录')
    
    // 跳转到登录页
    router.push('/login')
    
  } catch {
    // 用户取消退出
  }
}

// 初始化用户信息
onMounted(() => {
  authStore.initAuth()
})
</script>

<style scoped>
.main-layout {
  display: flex;
  height: 100vh;
  background: #f5f7fa;
}

.sidebar {
  width: 260px;
  background: #fff;
  border-right: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
  transition: width 0.3s ease;
  position: relative;
  z-index: 100;
}

.sidebar.collapsed {
  width: 64px;
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
  height: 64px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.logo-text {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  white-space: nowrap;
}

.logo-icon {
  width: 24px;
  height: 24px;
  object-fit: contain;
}

.collapse-btn {
  width: 32px;
  height: 32px;
  padding: 0;
  border-radius: 6px;
}

.sidebar-content {
  flex: 1;
  overflow-y: auto;
}

.sidebar-menu {
  border: none;
  padding: 8px 0;
}

.sidebar-menu .el-menu-item {
  height: 48px;
  line-height: 48px;
  margin: 4px 12px;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.sidebar-menu .el-menu-item:hover {
  background: #f0f7ff;
  color: #4A90E2;
}

.sidebar-menu .el-menu-item.is-active {
  background: #e3f2fd;
  color: #4A90E2;
  font-weight: 500;
}

.sidebar-menu .el-menu-item .el-icon {
  margin-right: 12px;
  font-size: 18px;
}

.sidebar-footer {
  padding: 16px 20px;
  border-top: 1px solid #f0f0f0;
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 64px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  transition: background 0.3s ease;
}

.user-info:hover {
  background: #f5f7fa;
}

.user-details {
  flex: 1;
  min-width: 0;
}

.user-name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-role {
  font-size: 12px;
  color: #666;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-menu-btn {
  width: 32px;
  height: 32px;
  padding: 0;
  border-radius: 6px;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  transition: margin-left 0.3s ease;
  overflow: hidden;
}

.main-content.expanded {
  margin-left: 0;
}

.content-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  background: #fff;
  border-bottom: 1px solid #e0e0e0;
  height: 64px;
}

.breadcrumb {
  flex: 1;
}

.header-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.user-info-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: rgba(248, 250, 252, 0.8);
  border: 1px solid rgba(226, 232, 240, 0.6);
  backdrop-filter: blur(8px);
  position: relative;
  overflow: hidden;
}

.user-info-header::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(74, 144, 226, 0.1), transparent);
  transition: left 0.5s ease;
}

.user-info-header:hover::before {
  left: 100%;
}

.user-info-header:hover {
  background: rgba(255, 255, 255, 0.95);
  border-color: rgba(74, 144, 226, 0.3);
  box-shadow: 0 8px 25px rgba(74, 144, 226, 0.15), 0 3px 10px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.user-avatar-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.user-avatar {
  border: 2px solid rgba(255, 255, 255, 0.8);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.user-info-header:hover .user-avatar {
  box-shadow: 0 6px 20px rgba(74, 144, 226, 0.25);
  border-color: rgba(74, 144, 226, 0.4);
  transform: scale(1.05);
}

.online-indicator {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 10px;
  height: 10px;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  border: 2px solid #fff;
  border-radius: 50%;
  box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2);
  animation: pulse-gentle 3s infinite;
}

@keyframes pulse-gentle {
  0%, 100% {
    box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2);
  }
  50% {
    box-shadow: 0 0 0 6px rgba(16, 185, 129, 0.1);
  }
}

.user-details-header {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
}

.user-details-header .user-name {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.3;
  margin-bottom: 2px;
  transition: color 0.3s ease;
}

.user-info-header:hover .user-name {
  color: #4A90E2;
}

.user-details-header .user-role {
  font-size: 12px;
  color: #64748b;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.2;
  font-weight: 500;
  transition: color 0.3s ease;
}

.user-info-header:hover .user-role {
  color: #475569;
}

.user-menu-btn {
  width: 32px;
  height: 32px;
  padding: 0;
  border-radius: 8px;
  color: #64748b;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.user-menu-btn::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  background: rgba(74, 144, 226, 0.1);
  border-radius: 50%;
  transition: all 0.3s ease;
  transform: translate(-50%, -50%);
}

.user-menu-btn:hover::before {
  width: 100%;
  height: 100%;
}

.user-menu-btn:hover {
  color: #4A90E2;
  transform: rotate(90deg) scale(1.1);
  background: transparent;
}

/* 自定义下拉菜单样式 */
.custom-dropdown-menu {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(226, 232, 240, 0.8);
  border-radius: 12px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1), 0 8px 16px rgba(0, 0, 0, 0.06);
  padding: 8px 0;
  min-width: 160px;
  overflow: hidden;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  font-size: 14px;
  color: #374151;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 0;
  margin: 0 8px;
  border-radius: 8px;
  position: relative;
  overflow: hidden;
}

.dropdown-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(220, 38, 38, 0.1), transparent);
  transition: left 0.3s ease;
}

.dropdown-item.logout-item:hover::before {
  left: 100%;
}

.dropdown-item.logout-item:hover {
  background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
  color: #dc2626;
  transform: translateX(4px);
  box-shadow: 0 4px 12px rgba(220, 38, 38, 0.15);
}

.dropdown-icon {
  font-size: 16px;
  opacity: 0.8;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.dropdown-item:hover .dropdown-icon {
  opacity: 1;
  transform: scale(1.1);
}

/* Element Plus 下拉菜单覆盖样式 */
.el-dropdown-menu {
  background: rgba(255, 255, 255, 0.95) !important;
  backdrop-filter: blur(12px) !important;
  border: 1px solid rgba(226, 232, 240, 0.8) !important;
  border-radius: 12px !important;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1), 0 8px 16px rgba(0, 0, 0, 0.06) !important;
  padding: 8px 0 !important;
}

.el-dropdown-menu__item {
  display: flex !important;
  align-items: center !important;
  gap: 12px !important;
  padding: 12px 16px !important;
  font-size: 14px !important;
  color: #374151 !important;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
  margin: 0 8px !important;
  border-radius: 8px !important;
  position: relative !important;
  overflow: hidden !important;
}

.el-dropdown-menu__item:hover {
  background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%) !important;
  color: #dc2626 !important;
  transform: translateX(4px) !important;
  box-shadow: 0 4px 12px rgba(220, 38, 38, 0.15) !important;
}

.action-btn {
  width: 36px;
  height: 36px;
  padding: 0;
  border-radius: 8px;
  color: #666;
}

.action-btn:hover {
  background: #f5f7fa;
  color: #4A90E2;
}

.content-body {
  flex: 1;
  overflow: auto;
  background: #f5f7fa;
  position: relative;
}

/* 折叠状态下的样式调整 */
.sidebar.collapsed .sidebar-footer {
  padding: 16px 8px;
  justify-content: center;
}

.sidebar.collapsed .user-info {
  justify-content: center;
  padding: 4px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .sidebar {
    position: fixed;
    left: 0;
    top: 0;
    height: 100vh;
    z-index: 1000;
    transform: translateX(-100%);
    transition: transform 0.3s ease;
  }
  
  .sidebar:not(.collapsed) {
    transform: translateX(0);
  }
  
  .main-content {
    margin-left: 0;
  }
  
  .content-header {
    padding: 12px 16px;
  }
}

/* 滚动条样式 */
.sidebar-content::-webkit-scrollbar {
  width: 4px;
}

.sidebar-content::-webkit-scrollbar-track {
  background: transparent;
}

.sidebar-content::-webkit-scrollbar-thumb {
  background: #ddd;
  border-radius: 2px;
}

.sidebar-content::-webkit-scrollbar-thumb:hover {
  background: #bbb;
}
</style>