<template>
  <div class="login-container">
    <!-- 左上角Logo -->
    <div class="top-logo">
      <el-icon class="logo-icon"><img src="@/assets/logo.svg" alt="MobgiAI Logo" class="logo-icon" /></el-icon>
      <span class="logo-text">MobgiAI</span>
    </div>

    <!-- 登录卡片 -->
    <div class="login-card">
      <!-- Logo和标题 -->
      <div class="card-header">
        <div class="card-logo">
          <img src="@/assets/logo.svg" alt="MobgiAI Logo" class="logo-image" />
        </div>
        <h1 class="card-title">欢迎来到 MobgiAI</h1>
        <p class="card-subtitle">手机号登录</p>
        <!-- <div class="login-tip">
          <p>💡 测试提示：</p>
          <p>验证码请输入：<strong>123456</strong></p>
        </div> -->
      </div>

      <!-- 登录表单 -->
      <div class="card-form">
        <el-form
          ref="loginFormRef"
          :model="loginForm"
          :rules="loginRules"
          class="login-form"
        >
          <!-- 手机号输入 -->
          <el-form-item prop="phone">
            <div class="input-wrapper">
              <span class="input-prefix">+86</span>
              <el-input
                v-model="loginForm.phone"
                placeholder="请输入手机号"
                class="phone-input"
                maxlength="11"
              />
            </div>
          </el-form-item>

          <!-- 验证码输入 -->
          <el-form-item prop="code">
            <div class="code-wrapper">
              <el-input
                v-model="loginForm.code"
                placeholder="请输入验证码"
                class="code-input"
                maxlength="6"
              />
              <el-button
                :disabled="codeDisabled"
                @click="sendCode"
                class="code-btn"
                :class="{ disabled: codeDisabled }"
              >
                {{ codeText }}
              </el-button>
            </div>
          </el-form-item>

          <!-- 登录按钮 -->
          <el-form-item>
            <el-button
              type="primary"
              class="login-btn"
              :loading="loading"
              @click="handleLogin"
            >
              {{ loading ? '登录中...' : '登录/注册' }}
            </el-button>
          </el-form-item>
        </el-form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { Avatar } from '@element-plus/icons-vue'
// import { authAPI } from '../services/api'
import { login,getCode } from '../api/index'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const loginFormRef = ref<FormInstance>()
const loading = ref(false)
const codeDisabled = ref(false)
const codeText = ref('获取验证码')
const sendingCode = ref(false)

const loginForm = reactive({
  phone: '',
  code: ''
})

const loginRules: FormRules = {
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ],
  code: [
    { required: true, message: '请输入验证码', trigger: 'blur' },
    { len: 6, message: '验证码为6位数字', trigger: 'blur' }
  ]
}

// 发送验证码
const sendCode = async () => {
  if (!loginForm.phone) {
    ElMessage.warning('请先输入手机号')
    return
  }
  
  if (!/^1[3-9]\d{9}$/.test(loginForm.phone)) {
    ElMessage.warning('请输入正确的手机号')
    return
  }

  if (sendingCode.value) return

  try {
    sendingCode.value = true
    
    // 调用发送验证码API
    await getCode({mobile:loginForm.phone})
    
    ElMessage.success('验证码发送成功')
    
    // 开始倒计时
    codeDisabled.value = true
    let countdown = 60
    codeText.value = `${countdown}s后重新获取`
    
    const timer = setInterval(() => {
      countdown--
      if (countdown <= 0) {
        clearInterval(timer)
        codeDisabled.value = false
        codeText.value = '获取验证码'
      } else {
        codeText.value = `${countdown}s后重新获取`
      }
    }, 1000)
    
  } catch (error: unknown) {
    console.error('发送验证码失败:', error)
    const errorMessage = error instanceof Error ? error.message : '发送验证码失败，请重试'
    ElMessage.error(errorMessage)
  } finally {
    sendingCode.value = false
  }
}

// 登录处理
const handleLogin = async () => {
  if (!loginFormRef.value) return
  
  try {
    const valid = await loginFormRef.value.validate()
    if (!valid) return

    loading.value = true
    
    // 调用登录API
    const response= await login({mobile:loginForm.phone, code:loginForm.code}) as any;
    if (response&&response.data) {
      // 保存登录信息到store
      const data = response.data as { token: string; uid: string; expiredTime: number;username:string }
      authStore.setAuth(data.token, { uid: data.uid, expiredTime: data.expiredTime,username:loginForm.phone})
      
      ElMessage.success('登录成功')
      
      // 跳转到主页面
      setTimeout(() => {
        router.push('/dashboard/image-generate')
      }, 500)
    } 
    else {
      const errorMsg = (response as any)?.msg || '登录失败'
      throw new Error(errorMsg)
    }
    
  } catch (error: unknown) {
    console.error('登录失败:', error)
    const errorMessage = error instanceof Error ? error.message : '登录失败，请检查手机号和验证码'
    ElMessage.error(errorMessage)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  width: 100vw;
  height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  position: fixed;
  top: 0;
  left: 0;
  margin: 0;
  padding: 0;
  overflow: hidden;
}

/* 背景装饰 */
.login-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.3) 0%, transparent 50%),
    radial-gradient(circle at 40% 40%, rgba(120, 219, 255, 0.2) 0%, transparent 50%);
}

/* 左上角Logo */
.top-logo {
  position: absolute;
  top: 30px;
  left: 30px;
  display: flex;
  align-items: center;
  gap: 12px;
  color: white;
  z-index: 10;
}

.logo-icon {
  font-size: 24px;
  color: #4A90E2;
}

.logo-text {
  font-size: 18px;
  font-weight: 600;
}

/* 登录卡片 */
.login-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  padding: 40px;
  width: 420px;
  max-width: calc(100vw - 40px);
  max-height: calc(100vh - 60px);
  box-shadow: 0 32px 64px rgba(0, 0, 0, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.3);
  position: relative;
  z-index: 1;
  overflow-y: auto;
}

/* 卡片头部 */
.card-header {
  text-align: center;
  margin-bottom: 32px;
}

.card-logo {
  margin-bottom: 24px;
}

.logo-diamond {
  width: 80px;
  height: 80px;
  margin: 0 auto;
  position: relative;
  transform: rotate(45deg);
  background: linear-gradient(135deg, #4A90E2, #357ABD);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 16px 32px rgba(74, 144, 226, 0.3);
}

.diamond-inner {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 8px;
  transform: rotate(-45deg);
}

.logo-image {
  width: 80px;
  height: 80px;
  margin: 0 auto;
  display: block;
  border-radius: 16px;
  box-shadow: 0 16px 32px rgba(74, 144, 226, 0.3);
}

.card-title {
  font-size: 24px;
  font-weight: 600;
  color: #333;
  margin: 0 0 8px 0;
}

.card-subtitle {
  font-size: 14px;
  color: #666;
  margin: 0 0 16px 0;
}

.login-tip {
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 8px;
  font-size: 12px;
  color: #0369a1;
}

.login-tip p {
  margin: 0;
  line-height: 1.4;
}

.login-tip p:first-child {
  font-weight: 500;
  margin-bottom: 4px;
}

.login-tip strong {
  color: #1e40af;
  font-weight: 600;
}

/* 表单样式 */
.card-form {
  width: 100%;
}

.login-form {
  width: 100%;
}

.login-form .el-form-item {
  margin-bottom: 20px;
}

.login-form .el-form-item:last-child {
  margin-bottom: 0;
}

/* 手机号输入 */
.input-wrapper {
  width: 100%;
  display: flex;
  align-items: center;
  background: #f8f9fa;
  border-radius: 12px;
  border: 1px solid #e0e0e0;
  overflow: hidden;
  transition: all 0.3s ease;
}

.input-wrapper:focus-within {
  border-color: #4A90E2;
  box-shadow: 0 0 0 3px rgba(74, 144, 226, 0.1);
}

.input-prefix {
  padding: 0 16px;
  color: #666;
  font-size: 14px;
  border-right: 1px solid #e0e0e0;
  background: #f0f0f0;
  height: 48px;
  display: flex;
  align-items: center;
}

.phone-input {
  flex: 1;
  background: transparent;
  border: none;
}

.phone-input :deep(.el-input__wrapper) {
  background: transparent;
  border: none;
  box-shadow: none;
  padding: 12px 16px;
}

.phone-input :deep(.el-input__inner) {
  background: transparent;
  border: none;
  font-size: 14px;
  height: 24px;
}

/* 验证码输入 */
.code-wrapper {
  display: flex;
  gap: 12px;
  align-items: center;
}

.code-input {
  flex: 1;
}

.code-input :deep(.el-input__wrapper) {
  background: #f8f9fa;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  padding: 12px 16px;
  transition: all 0.3s ease;
}

.code-input :deep(.el-input__wrapper):focus-within {
  border-color: #4A90E2;
  box-shadow: 0 0 0 3px rgba(74, 144, 226, 0.1);
}

.code-input :deep(.el-input__inner) {
  background: transparent;
  border: none;
  font-size: 14px;
  height: 24px;
}

.code-btn {
  height: 48px;
  padding: 0 20px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
  background: #4A90E2;
  border: none;
  color: white;
  transition: all 0.3s ease;
  min-width: 120px;
}

.code-btn:hover:not(.disabled) {
  background: #357ABD;
  transform: translateY(-1px);
}

.code-btn.disabled {
  background: #ccc;
  cursor: not-allowed;
  transform: none;
}

/* 登录按钮 */
.login-btn {
  width: 100%;
  height: 48px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  background: linear-gradient(135deg, #4A90E2, #357ABD);
  border: none;
  color: white;
  transition: all 0.3s ease;
  margin-top: 8px;
}

.login-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 24px rgba(74, 144, 226, 0.4);
}

.login-btn:active {
  transform: translateY(0);
}

/* 响应式设计 */
@media (min-width: 1025px) {
  .login-container {
    min-height: 100vh;
    height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 40px;
  }
  
  .login-card {
    width: 480px;
    max-width: 90vw;
    max-height: calc(100vh - 80px);
    padding: 50px;
    overflow-y: auto;
  }
  
  .top-logo {
    top: 40px;
    left: 40px;
  }
  
  .logo-text {
    font-size: 20px;
  }
  
  .logo-icon {
    font-size: 28px;
  }
  
  .card-title {
    font-size: 28px;
  }
  
  .card-subtitle {
    font-size: 16px;
  }
  
  .logo-diamond {
    width: 90px;
    height: 90px;
  }
  
  .diamond-inner {
    width: 45px;
    height: 45px;
  }
  
  .logo-image {
    width: 90px;
    height: 90px;
  }
  
  .card-header {
    margin-bottom: 40px;
  }
  
  .login-form .el-form-item {
    margin-bottom: 24px;
  }
  
  .input-wrapper {
    height: 52px;
  }
  
  .input-prefix {
    height: 52px;
    padding: 0 18px;
    font-size: 16px;
  }
  
  .phone-input :deep(.el-input__wrapper) {
    padding: 14px 18px;
    height: 52px;
  }
  
  .code-input :deep(.el-input__wrapper) {
    height: 52px;
    padding: 14px 18px;
  }
  
  .code-btn {
    height: 52px;
    padding: 0 24px;
    font-size: 16px;
    min-width: 140px;
  }
  
  .login-btn {
    height: 52px;
    font-size: 18px;
    margin-top: 12px;
  }
}

@media (min-width: 1441px) {
  .login-card {
    width: 520px;
    padding: 60px;
  }
  
  .card-title {
    font-size: 30px;
  }
  
  .logo-diamond {
    width: 100px;
    height: 100px;
  }
  
  .diamond-inner {
    width: 50px;
    height: 50px;
  }
  
  .logo-image {
    width: 100px;
    height: 100px;
  }
}

@media (max-width: 1024px) and (min-width: 769px) {
  .login-card {
    width: 440px;
    padding: 45px;
  }
  
  .top-logo {
    top: 35px;
    left: 35px;
  }
}

@media (max-width: 768px) {
  .login-container {
    padding: 0;
  }
  
  .login-card {
    width: calc(100vw - 40px);
    max-width: 380px;
    padding: 30px 24px;
    margin: 0;
  }
  
  .top-logo {
    top: 20px;
    left: 20px;
  }
  
  .logo-text {
    font-size: 16px;
  }
  
  .card-title {
    font-size: 22px;
  }
  
  .logo-diamond {
    width: 70px;
    height: 70px;
  }
  
  .diamond-inner {
    width: 35px;
    height: 35px;
  }
  
  .logo-image {
    width: 70px;
    height: 70px;
  }
}

/* 表单验证错误样式 */
.login-form :deep(.el-form-item.is-error .el-input__wrapper) {
  border-color: #f56c6c;
  box-shadow: 0 0 0 3px rgba(245, 108, 108, 0.1);
}

.login-form :deep(.el-form-item__error) {
  font-size: 12px;
  margin-top: 4px;
}

/* 加载状态 */
.login-btn.is-loading {
  pointer-events: none;
}

/* 动画效果 */
.login-card {
  animation: slideUp 0.6s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.top-logo {
  animation: fadeIn 0.8s ease-out 0.2s both;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* 确保没有滚动条和留白 */
.login-container * {
  box-sizing: border-box;
}

/* 移除可能的默认边距 */
.login-container,
.login-container * {
  -webkit-overflow-scrolling: touch;
}

/* 防止内容溢出 - 移除这个规则，因为已经在基础样式中处理 */

@media (max-height: 600px) {
  .login-card {
    max-height: calc(100vh - 40px);
    padding: 20px;
  }
  
  .card-header {
    margin-bottom: 20px;
  }
  
  .logo-diamond {
    width: 60px;
    height: 60px;
  }
  
  .diamond-inner {
    width: 30px;
    height: 30px;
  }
  
  .logo-image {
    width: 60px;
    height: 60px;
  }
  
  .card-title {
    font-size: 20px;
  }
}

@media (max-height: 500px) {
  .login-card {
    padding: 15px;
    max-height: calc(100vh - 30px);
  }
  
  .card-header {
    margin-bottom: 15px;
  }
  
  .logo-diamond {
    width: 50px;
    height: 50px;
  }
  
  .diamond-inner {
    width: 25px;
    height: 25px;
  }
  
  .logo-image {
    width: 50px;
    height: 50px;
  }
  
  .card-title {
    font-size: 18px;
  }
  
  .login-form .el-form-item {
    margin-bottom: 15px;
  }
}
</style>