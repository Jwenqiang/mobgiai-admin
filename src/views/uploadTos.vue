<template>
  <div class="upload-container">
    <div class="upload-section">
      <h3>火山引擎TOS上传</h3>
      
      <!-- 诊断工具 -->
      <div class="diagnosis-section">
        <button 
          @click="runDiagnosis" 
          :disabled="diagnosing"
          class="diagnosis-btn"
        >
          {{ diagnosing ? '诊断中...' : '🔍 诊断TOS配置' }}
        </button>
        <div v-if="diagnosisResult" class="diagnosis-result">
          <h4>诊断结果: {{ diagnosisResult.overallStatus }}</h4>
          <div class="diagnosis-steps">
            <div 
              v-for="step in diagnosisResult.steps" 
              :key="step.step"
              class="diagnosis-step"
              :class="step.status.toLowerCase()"
            >
              <span class="step-icon">
                {{ step.status === 'SUCCESS' ? '✅' : step.status === 'FAILED' ? '❌' : '🔄' }}
              </span>
              <span class="step-text">{{ step.name }}: {{ step.details }}</span>
            </div>
          </div>
          <div v-if="diagnosisResult.recommendations.length > 0" class="recommendations">
            <h5>建议:</h5>
            <ul>
              <li v-for="(rec, index) in diagnosisResult.recommendations" :key="index">
                {{ rec }}
              </li>
            </ul>
          </div>
        </div>
      </div>
      
      <!-- 视频上传 -->
      <div class="upload-item">
        <label>视频上传：</label>
        <input 
          type="file" 
          accept="video/*" 
          @change="handleVideoUpload"
          :disabled="uploading"
        />
        <div v-if="uploading" class="progress-info">
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: uploadProgress + '%' }"></div>
          </div>
          <span>{{ uploadProgress }}%</span>
        </div>
      </div>

      <!-- 图片上传 -->
      <div class="upload-item">
        <label>图片上传：</label>
        <input 
          type="file" 
          accept="image/*" 
          @change="handleImageUpload"
          :disabled="uploading"
        />
      </div>

      <!-- 上传结果显示 -->
      <div v-if="uploadResult" class="upload-result">
        <h4>上传成功！</h4>
        <p>文件地址：<a :href="uploadResult" target="_blank">{{ uploadResult }}</a></p>
        <div v-if="uploadResult.includes('video')" class="video-preview">
          <video :src="uploadResult" controls width="400"></video>
        </div>
        <div v-if="uploadResult.includes('image')" class="image-preview">
          <img :src="uploadResult" alt="上传的图片" style="max-width: 400px;" />
        </div>
      </div>

      <!-- 错误信息显示 -->
      <div v-if="errorMessage" class="error-message">
        <p>{{ errorMessage }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { uploadBigVideoToTOS, uploadImageToTOS } from '../services/tos.js'
import { getTosToken } from '../api/index'
import { diagnoseTosUpload, printDiagnosisReport } from '../utils/tosDebug.js'

const uploading = ref(false)
const uploadProgress = ref(0)
const uploadResult = ref('')
const errorMessage = ref('')
const diagnosing = ref(false)
const diagnosisResult = ref(null)

// 重置状态
const resetState = () => {
  uploadProgress.value = 0
  uploadResult.value = ''
  errorMessage.value = ''
}

// 运行TOS诊断
const runDiagnosis = async () => {
  diagnosing.value = true
  diagnosisResult.value = null
  
  try {
    const baseUrl = import.meta.env.VITE_API_BASE_URL
    console.log('开始TOS诊断，API地址:', baseUrl)
    
    const report = await diagnoseTosUpload(baseUrl)
    diagnosisResult.value = report
    printDiagnosisReport(report)
    
    if (report.overallStatus === 'SUCCESS') {
      console.log('✅ TOS配置正常，可以进行文件上传')
    } else {
      console.log('❌ TOS配置存在问题，请查看上方诊断结果')
    }
  } catch (error) {
    console.error('诊断过程出错:', error)
    errorMessage.value = `诊断失败: ${error.message}`
  } finally {
    diagnosing.value = false
  }
}

// 视频上传处理
const handleVideoUpload = async (e: Event) => {
  const target = e.target as HTMLInputElement;
  const file = target.files?.[0];
  
  // 校验：是否选择了文件 + 是否为视频
  if (!file) return;
  if (!file.type.includes('video')) {
    errorMessage.value = '请选择正确的视频文件';
    return;
  }

  resetState();
  uploading.value = true;

  try {
    console.log('开始请求TOS配置...');
    const tosConfig = await getTosToken();
    console.log('获取到的TOS临时配置：', tosConfig);

    // 检查配置完整性
    if (!tosConfig) {
      throw new Error('未获取到TOS配置');
    }

    // 检查必要字段
    const requiredFields = ['accessKeyId', 'sessionToken', 'region', 'bucket'];
    const missingFields = requiredFields.filter(field => !tosConfig[field]);
    if (missingFields.length > 0) {
      throw new Error(`TOS配置缺少必要字段: ${missingFields.join(', ')}`);
    }

    // 检查密钥字段
    if (!tosConfig.accessKeySecret && !tosConfig.secretAccessKey) {
      throw new Error('TOS配置缺少密钥字段 (accessKeySecret 或 secretAccessKey)');
    }

    // 调用上传方法
    const videoUrl = await uploadBigVideoToTOS(file, tosConfig);
    
    uploadResult.value = videoUrl;
    console.log('视频上传成功！地址：', videoUrl);
  } catch (error: unknown) {
    console.error('视频上传失败：', error);
    errorMessage.value = '视频上传失败：' + (error instanceof Error ? error.message : String(error));
  } finally {
    uploading.value = false;
  }
}

// 图片上传处理
const handleImageUpload = async (e: Event) => {
  const target = e.target as HTMLInputElement;
  const file = target.files?.[0];
  console.log(file,"上传的图片")
  if (!file) return;
  if (!file.type.includes('image')) {
    errorMessage.value = '请选择正确的图片文件';
    return;
  }

  resetState();
  uploading.value = true;

  try {
    console.log('开始请求TOS配置...');
    const tosConfig = await getTosToken();
    
    if (!tosConfig) {
      throw new Error('未获取到TOS配置');
    }

    // 调用图片上传方法
    const imageUrl = await uploadImageToTOS(file, tosConfig);
    
    uploadResult.value = imageUrl;
    console.log('图片上传成功！地址：', imageUrl);
  } catch (error: unknown) {
    console.error('图片上传失败：', error);
    errorMessage.value = '图片上传失败：' + (error instanceof Error ? error.message : String(error));
  } finally {
    uploading.value = false;
  }
}
</script>

<style scoped>
.upload-container {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.upload-section {
  background: #f9f9f9;
  padding: 20px;
  border-radius: 8px;
}

.upload-item {
  margin-bottom: 20px;
}

.upload-item label {
  display: block;
  margin-bottom: 8px;
  font-weight: bold;
}

.upload-item input[type="file"] {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.progress-info {
  margin-top: 10px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.progress-bar {
  flex: 1;
  height: 20px;
  background: #f0f0f0;
  border-radius: 10px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #409eff;
  transition: width 0.3s ease;
}

.upload-result {
  margin-top: 20px;
  padding: 15px;
  background: #f0f9ff;
  border: 1px solid #b3d8ff;
  border-radius: 4px;
}

.upload-result h4 {
  color: #409eff;
  margin-bottom: 10px;
}

.upload-result a {
  color: #409eff;
  word-break: break-all;
}

.video-preview, .image-preview {
  margin-top: 15px;
}

.error-message {
  margin-top: 20px;
  padding: 15px;
  background: #fef0f0;
  border: 1px solid #fbc4c4;
  border-radius: 4px;
  color: #f56c6c;
}

.diagnosis-section {
  margin-bottom: 30px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.diagnosis-btn {
  padding: 10px 20px;
  background: #409eff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.diagnosis-btn:disabled {
  background: #c0c4cc;
  cursor: not-allowed;
}

.diagnosis-result {
  margin-top: 15px;
}

.diagnosis-result h4 {
  margin-bottom: 10px;
  color: #303133;
}

.diagnosis-steps {
  margin-bottom: 15px;
}

.diagnosis-step {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  padding: 8px;
  border-radius: 4px;
}

.diagnosis-step.success {
  background: #f0f9ff;
  border-left: 3px solid #67c23a;
}

.diagnosis-step.failed {
  background: #fef0f0;
  border-left: 3px solid #f56c6c;
}

.diagnosis-step.running {
  background: #fdf6ec;
  border-left: 3px solid #e6a23c;
}

.step-icon {
  margin-right: 8px;
  font-size: 16px;
}

.step-text {
  font-size: 14px;
}

.recommendations {
  background: #fff;
  padding: 15px;
  border-radius: 4px;
  border: 1px solid #dcdfe6;
}

.recommendations h5 {
  margin-bottom: 10px;
  color: #409eff;
}

.recommendations ul {
  margin: 0;
  padding-left: 20px;
}

.recommendations li {
  margin-bottom: 5px;
  color: #606266;
}
</style>