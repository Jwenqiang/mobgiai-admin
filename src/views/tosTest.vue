<template>
  <div class="tos-test-container">
    <h2>TOS上传测试</h2>
    
    <!-- 诊断按钮 -->
    <div class="test-section">
      <button @click="runDiagnosis" :disabled="diagnosing" class="test-btn">
        {{ diagnosing ? '诊断中...' : '🔍 运行TOS诊断' }}
      </button>
    </div>

    <!-- 诊断结果 -->
    <div v-if="diagnosisResult" class="diagnosis-result">
      <h3>诊断结果: {{ diagnosisResult.overallStatus }}</h3>
      <div class="steps">
        <div v-for="step in diagnosisResult.steps" :key="step.step" 
             :class="['step', step.status.toLowerCase()]">
          <span class="icon">{{ getStatusIcon(step.status) }}</span>
          <span>{{ step.name }}: {{ step.details }}</span>
        </div>
      </div>
      <div v-if="diagnosisResult.recommendations.length > 0" class="recommendations">
        <h4>建议:</h4>
        <ul>
          <li v-for="rec in diagnosisResult.recommendations" :key="rec">{{ rec }}</li>
        </ul>
      </div>
    </div>

    <!-- 文件上传测试 -->
    <div class="test-section">
      <h3>文件上传测试</h3>
      
      <div class="upload-group">
        <label>图片上传:</label>
        <input type="file" accept="image/*" @change="testImageUpload" :disabled="uploading">
      </div>
      
      <div class="upload-group">
        <label>Content-Type修复版本 (图片):</label>
        <input type="file" accept="image/*" @change="testFixedContentTypeUpload" :disabled="uploading">
        <small>使用简化的Content-Type设置方式</small>
      </div>
      
      <div class="upload-group">
        <label>Content-Type测试 (图片):</label>
        <input type="file" accept="image/*" @change="testContentTypeUpload" :disabled="uploading">
        <small>测试不同的Content-Type设置方式</small>
      </div>
      
      <div class="upload-group">
        <label>视频上传:</label>
        <input type="file" accept="video/*" @change="testVideoUpload" :disabled="uploading">
      </div>
      
      <div v-if="uploading" class="progress">
        上传中... {{ uploadProgress }}%
      </div>
    </div>

    <!-- 结果显示 -->
    <div v-if="uploadResult" class="result success">
      <h4>✅ 上传成功!</h4>
      <p>文件地址: <a :href="uploadResult" target="_blank">{{ uploadResult }}</a></p>
      
      <!-- 图片预览 -->
      <div v-if="uploadResult.includes('images/') || uploadResult.includes('image')" class="preview">
        <h5>图片预览:</h5>
        <img :src="uploadResult" alt="上传的图片" style="max-width: 400px; max-height: 300px; border: 1px solid #ddd; border-radius: 4px;" />
        <p><small>如果图片能正常显示，说明Content-Type设置正确</small></p>
      </div>
      
      <!-- 视频预览 -->
      <div v-if="uploadResult.includes('videos/') || uploadResult.includes('video')" class="preview">
        <h5>视频预览:</h5>
        <video :src="uploadResult" controls style="max-width: 400px; max-height: 300px; border: 1px solid #ddd; border-radius: 4px;"></video>
        <p><small>如果视频能正常播放，说明Content-Type设置正确</small></p>
      </div>
    </div>

    <div v-if="errorMessage" class="result error">
      <h4>❌ 上传失败</h4>
      <p>{{ errorMessage }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { uploadBigVideoToTOS, uploadImageToTOS, testImageUploadMethods, uploadImageWithFixedContentType } from '../services/tos.js'
import { getTosToken } from '../api/index'
import { diagnoseTosUpload } from '../utils/tosDebug.js'

const diagnosing = ref(false)
const diagnosisResult = ref(null)
const uploading = ref(false)
const uploadProgress = ref(0)
const uploadResult = ref('')
const errorMessage = ref('')

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'SUCCESS': return '✅'
    case 'FAILED': return '❌'
    case 'RUNNING': return '🔄'
    default: return '❓'
  }
}

const resetState = () => {
  uploadResult.value = ''
  errorMessage.value = ''
  uploadProgress.value = 0
}

const runDiagnosis = async () => {
  diagnosing.value = true
  diagnosisResult.value = null
  
  try {
    const baseUrl = import.meta.env.VITE_API_BASE_URL
    console.log('开始TOS诊断，API地址:', baseUrl)
    
    const report = await diagnoseTosUpload(baseUrl)
    diagnosisResult.value = report
    
    console.log('诊断完成:', report)
  } catch (error) {
    console.error('诊断失败:', error)
    errorMessage.value = `诊断失败: ${error.message}`
  } finally {
    diagnosing.value = false
  }
}

const testFixedContentTypeUpload = async (e: Event) => {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  resetState()
  uploading.value = true

  try {
    console.log('开始Content-Type修复版本上传...')
    const tosConfig = await getTosToken()
    console.log('获取TOS配置成功:', tosConfig)
    
    const imageUrl = await uploadImageWithFixedContentType(file, tosConfig)
    uploadResult.value = imageUrl
    console.log('Content-Type修复版本上传成功:', imageUrl)
  } catch (error) {
    console.error('Content-Type修复版本上传失败:', error)
    errorMessage.value = `Content-Type修复版本上传失败: ${error.message}`
  } finally {
    uploading.value = false
  }
}

const testContentTypeUpload = async (e: Event) => {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  resetState()
  uploading.value = true

  try {
    console.log('开始Content-Type测试上传...')
    const tosConfig = await getTosToken()
    console.log('获取TOS配置成功:', tosConfig)
    
    const imageUrl = await testImageUploadMethods(file, tosConfig)
    uploadResult.value = imageUrl
    console.log('Content-Type测试上传成功:', imageUrl)
  } catch (error) {
    console.error('Content-Type测试上传失败:', error)
    errorMessage.value = `Content-Type测试上传失败: ${error.message}`
  } finally {
    uploading.value = false
  }
}

const testImageUpload = async (e: Event) => {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  resetState()
  uploading.value = true

  try {
    console.log('开始图片上传测试...')
    const tosConfig = await getTosToken()
    console.log('获取TOS配置成功:', tosConfig)
    
    const imageUrl = await uploadImageToTOS(file, tosConfig)
    uploadResult.value = imageUrl
    console.log('图片上传成功:', imageUrl)
  } catch (error) {
    console.error('图片上传失败:', error)
    errorMessage.value = `图片上传失败: ${error.message}`
  } finally {
    uploading.value = false
  }
}

const testVideoUpload = async (e: Event) => {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  resetState()
  uploading.value = true

  try {
    console.log('开始视频上传测试...')
    const tosConfig = await getTosToken()
    console.log('获取TOS配置成功:', tosConfig)
    
    const videoUrl = await uploadBigVideoToTOS(file, tosConfig)
    uploadResult.value = videoUrl
    console.log('视频上传成功:', videoUrl)
  } catch (error) {
    console.error('视频上传失败:', error)
    errorMessage.value = `视频上传失败: ${error.message}`
  } finally {
    uploading.value = false
  }
}
</script>

<style scoped>
.tos-test-container {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.test-section {
  margin-bottom: 30px;
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: #f9f9f9;
}

.test-btn {
  padding: 10px 20px;
  background: #409eff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.test-btn:disabled {
  background: #c0c4cc;
  cursor: not-allowed;
}

.diagnosis-result {
  margin-top: 20px;
  padding: 15px;
  background: white;
  border-radius: 4px;
  border: 1px solid #e4e7ed;
}

.steps {
  margin: 15px 0;
}

.step {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
  padding: 8px;
  border-radius: 4px;
}

.step.success {
  background: #f0f9ff;
  border-left: 3px solid #67c23a;
}

.step.failed {
  background: #fef0f0;
  border-left: 3px solid #f56c6c;
}

.step.running {
  background: #fdf6ec;
  border-left: 3px solid #e6a23c;
}

.step .icon {
  margin-right: 8px;
}

.recommendations {
  margin-top: 15px;
  padding: 10px;
  background: #f0f9ff;
  border-radius: 4px;
}

.upload-group {
  margin-bottom: 15px;
}

.upload-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

.upload-group input {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.progress {
  margin-top: 10px;
  padding: 10px;
  background: #f0f9ff;
  border-radius: 4px;
  text-align: center;
}

.result {
  margin-top: 20px;
  padding: 15px;
  border-radius: 4px;
}

.result.success {
  background: #f0f9ff;
  border: 1px solid #b3d8ff;
  color: #409eff;
}

.result.error {
  background: #fef0f0;
  border: 1px solid #fbc4c4;
  color: #f56c6c;
}

.result a {
  color: inherit;
  word-break: break-all;
}
</style>