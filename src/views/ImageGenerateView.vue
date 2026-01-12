<template>
  <div class="image-generate-container">
    <!-- 主要内容区域 -->
    <div class="main-content">
      <!-- 无内容时的居中输入区域 -->
      <div v-if="currentImages.length === 0 && !generating" class="centered-input-section">
        <!-- 主标题 - 即梦风格 -->
        <div class="page-header">
          <div class="header-content">
            <div class="header-icon">
              <div class="icon-wrapper">
                <el-icon class="main-icon"><Picture /></el-icon>
              </div>
            </div>
            <h1 class="header-title">AI 图片生成</h1>
            <p class="header-subtitle">输入简单的文案，即可快速生成优质图片</p>
          </div>
        </div>
        <div class="prompt-container">
          <!-- 创作区域 - 即梦风格 -->
          <div class="creation-panel">
            <div class="input-section">
              <div class="upload-area">
                <el-upload
                  :file-list="[]"
                  :auto-upload="false"
                  :limit="5"
                  accept="image/*"
                  :show-file-list="false"
                  class="image-uploader"
                  @change="handleImageUpload"
                  :disabled="referenceImages.length >= 5"
                >
                  <div class="upload-placeholder" :class="{ disabled: referenceImages.length >= 5 }">
                    <el-icon size="24"><Plus /></el-icon>
                    <span class="upload-text">添加参考图</span>
                  </div>
                </el-upload>
              </div>
              
              <div class="prompt-input-wrapper">
                <el-input
                  v-model="prompt"
                  type="textarea"
                  :rows="4"
                  :autosize="{ minRows: 4, maxRows: 6 }"
                  placeholder="描述您想要生成的图片内容，例如：一只可爱的橘猫坐在窗台上，阳光透过窗户洒在它的毛发上，背景是温馨的家居环境..."
                  class="prompt-input"
                  @keydown.enter.exact="handleGenerate"
                />
                <div class="input-footer">
                  <div class="input-tips">
                    <span class="tip-text">💡 详细的描述能帮助生成更精准的图片</span>
                  </div>
                  <div class="char-count">{{ prompt.length }}/500</div>
                </div>
              </div>
            </div>
            
            <!-- 上传图片预览列表 -->
            <div v-if="referenceImages.length > 0" class="upload-preview-section">
              <div class="preview-header">
                <span class="preview-label">参考图片 ({{ referenceImages.length }}/5)</span>
                <el-button size="small" text @click="clearAllImages">清空全部</el-button>
              </div>
              <div class="upload-preview-list">
                <div 
                  v-for="(image, index) in referenceImages" 
                  :key="image.uid"
                  class="upload-preview-item"
                  @click="previewUploadImage(image.url)"
                >
                  <img 
                    :src="image.url" 
                    :alt="image.name"
                    class="upload-preview-image"
                  />
                  <div class="image-overlay">
                    <el-button 
                      type="danger" 
                      size="small" 
                      circle
                      @click.stop="removeImage(index)"
                      class="remove-btn"
                    >
                      <el-icon><Close /></el-icon>
                    </el-button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 参数选择区域 - 即梦风格 -->
        <div class="creation-controls">
          <div class="controls-row">
            <!-- 模型选择 -->
            <div class="control-group">
              <el-popover
                ref="modelPopoverRef"
                placement="top"
                :width="360"
                trigger="click"
                popper-class="model-popover"
                :teleported="false"
              >
                <template #reference>
                  <div class="control-button model-control">
                    <div class="control-icon">
                      <div class="model-avatar" :style="{ background: currentModel?.color || '#667eea' }">
                        <span class="model-initial">{{ currentModel?.name?.charAt(0) || 'M' }}</span>
                      </div>
                    </div>
                    <div class="control-content">
                      <div class="control-label">模型</div>
                      <div class="control-value">{{ currentModel?.name || '选择模型' }}</div>
                    </div>
                    <el-icon class="control-arrow"><ArrowDown /></el-icon>
                  </div>
                </template>
                <div class="model-selector">
                  <div class="selector-header">选择生成模型</div>
                  <div class="model-list">
                    <div 
                      v-for="model in models" 
                      :key="model.id"
                      class="model-item"
                      :class="{ active: currentModel?.id === model.id }"
                      @click="selectModel(model)"
                    >
                      <div class="model-info">
                        <div class="model-avatar" :style="{ background: model.color }">
                          <span class="model-initial">{{ model.name.charAt(0) }}</span>
                        </div>
                        <div class="model-details">
                          <div class="model-name">{{ model.name }}</div>
                          <div class="model-desc">{{ model.description }}</div>
                        </div>
                      </div>
                      <div v-if="currentModel?.id === model.id" class="check-icon">
                        <el-icon><Check /></el-icon>
                      </div>
                    </div>
                  </div>
                </div>
              </el-popover>
            </div>

            <!-- 尺寸选择 -->
            <div class="control-group">
              <el-popover
                ref="sizePopoverRef"
                placement="top"
                :width="400"
                trigger="click"
                popper-class="size-popover"
                :teleported="false"
              >
                <template #reference>
                  <div class="control-button">
                    <div class="control-icon">
                      <el-icon><FullScreen /></el-icon>
                    </div>
                    <div class="control-content">
                      <div class="control-label">尺寸</div>
                      <div class="control-value">{{ currentSize?.label || '选择尺寸' }}</div>
                    </div>
                    <el-icon class="control-arrow"><ArrowDown /></el-icon>
                  </div>
                </template>
                <div class="size-selector">
                  <div class="selector-header">选择图片尺寸</div>
                  <div class="size-grid">
                    <div 
                      v-for="size in imageSizes" 
                      :key="size.value"
                      class="size-item"
                      :class="{ active: currentSize?.value === size.value }"
                      @click="selectSize(size)"
                    >
                      <div class="size-preview" :style="{ aspectRatio: size.aspect }"></div>
                      <div class="size-info">
                        <div class="size-label">{{ size.label }}</div>
                        <div class="size-resolution">{{ size.width }}×{{ size.height }}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </el-popover>
            </div>

            <!-- 风格选择 -->
            <div class="control-group">
              <el-popover
                ref="stylePopoverRef"
                placement="top"
                :width="360"
                trigger="click"
                popper-class="style-popover"
                :teleported="false"
              >
                <template #reference>
                  <div class="control-button">
                    <div class="control-icon">
                      <div class="style-emoji">{{ currentStyle?.icon || '🎨' }}</div>
                    </div>
                    <div class="control-content">
                      <div class="control-label">风格</div>
                      <div class="control-value">{{ currentStyle?.label || '选择风格' }}</div>
                    </div>
                    <el-icon class="control-arrow"><ArrowDown /></el-icon>
                  </div>
                </template>
                <div class="style-selector">
                  <div class="selector-header">选择艺术风格</div>
                  <div class="style-list">
                    <div 
                      v-for="style in artStyles" 
                      :key="style.value"
                      class="style-item"
                      :class="{ active: currentStyle?.value === style.value }"
                      @click="selectStyle(style)"
                    >
                      <div class="style-info">
                        <div class="style-icon-large">{{ style.icon }}</div>
                        <div class="style-details">
                          <div class="style-name">{{ style.label }}</div>
                          <div class="style-desc">{{ style.description }}</div>
                        </div>
                      </div>
                      <div v-if="currentStyle?.value === style.value" class="check-icon">
                        <el-icon><Check /></el-icon>
                      </div>
                    </div>
                  </div>
                </div>
              </el-popover>
            </div>
          </div>

          <!-- 生成按钮 -->
          <div class="generate-section">
            <el-button 
              type="primary" 
              size="large"
              :loading="generating"
              :disabled="!prompt.trim()"
              @click="handleGenerate"
              class="generate-btn"
            >
              <el-icon v-if="!generating"><Picture /></el-icon>
              <span>{{ generating ? '生成中...' : '立即创作' }}</span>
              <div class="btn-glow"></div>
            </el-button>
          </div>
        </div>
      </div>

      <!-- 结果展示区域 -->
      <div class="results-section">
        <!-- 生成中状态 - 即梦风格 -->
        <div v-if="generating" class="generating-state">
          <div class="generating-container">
            <div class="generating-visual">
              <div class="progress-ring">
                <el-progress 
                  type="circle" 
                  :percentage="generateProgress"
                  :width="120"
                  :stroke-width="8"
                  color="#667eea"
                />
              </div>
              <div class="generating-animation">
                <div class="spark spark-1"></div>
                <div class="spark spark-2"></div>
                <div class="spark spark-3"></div>
              </div>
            </div>
            <div class="generating-content">
              <h3 class="generating-title">{{ progressText }}</h3>
              <p class="generating-desc">AI 正在为您精心创作，请稍候...</p>
              <div class="progress-steps">
                <div class="step" :class="{ active: generateProgress >= 25, completed: generateProgress > 25 }">
                  <div class="step-dot"></div>
                  <span>分析描述</span>
                </div>
                <div class="step" :class="{ active: generateProgress >= 50, completed: generateProgress > 50 }">
                  <div class="step-dot"></div>
                  <span>构建画面</span>
                </div>
                <div class="step" :class="{ active: generateProgress >= 75, completed: generateProgress > 75 }">
                  <div class="step-dot"></div>
                  <span>优化细节</span>
                </div>
                <div class="step" :class="{ active: generateProgress >= 100, completed: generateProgress >= 100 }">
                  <div class="step-dot"></div>
                  <span>完成创作</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 生成结果 - 即梦风格 -->
        <div v-else-if="currentImages.length > 0" class="results-display">
          <div class="results-header">
            <h3 class="results-title">生成完成</h3>
            <div class="results-actions">
              <el-button size="small" @click="regenerateAll">
                <el-icon><Refresh /></el-icon>
                重新生成
              </el-button>
              <el-button size="small" @click="downloadAll">
                <el-icon><Download /></el-icon>
                全部下载
              </el-button>
            </div>
          </div>
          <div class="results-grid">
            <div 
              v-for="(image, index) in currentImages" 
              :key="index"
              class="result-card"
              @click="previewImage(image)"
            >
              <div class="image-container">
                <img :src="image.url" :alt="`生成的图片 ${index + 1}`" class="result-image" />
                <div class="image-overlay">
                  <div class="overlay-content">
                    <div class="overlay-actions">
                      <el-button 
                        type="primary" 
                        size="small" 
                        circle
                        @click.stop="downloadImage(image)"
                        class="action-btn"
                      >
                        <el-icon><Download /></el-icon>
                      </el-button>
                      <el-button 
                        type="success" 
                        size="small" 
                        circle
                        @click.stop="saveToAssets(image)"
                        class="action-btn"
                      >
                        <el-icon><FolderAdd /></el-icon>
                      </el-button>
                    </div>
                  </div>
                </div>
              </div>
              <div class="result-info">
                <div class="result-index">#{{ index + 1 }}</div>
                <div class="result-actions">
                  <el-button size="small" text @click.stop="regenerateSingle(index)">
                    <el-icon><Refresh /></el-icon>
                  </el-button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 有内容时的底部悬浮输入面板 -->
    <div v-if="currentImages.length > 0 || generating" class="floating-input-panel">
      <div class="panel-container">
        <div class="panel-content">
          <div class="upload-area">
            <el-upload
              :file-list="[]"
              :auto-upload="false"
              :limit="5"
              accept="image/*"
              :show-file-list="false"
              class="image-uploader"
              @change="handleImageUpload"
              :disabled="referenceImages.length >= 5"
            >
              <div class="upload-placeholder" :class="{ disabled: referenceImages.length >= 5 }">
                <el-icon size="20"><Plus /></el-icon>
              </div>
            </el-upload>
          </div>
          
          <div class="prompt-input-wrapper">
            <el-input
              v-model="prompt"
              type="textarea"
              :rows="1"
              :autosize="{ minRows: 1, maxRows: 3 }"
              placeholder="请描述您想要生成的图片内容..."
              class="prompt-input"
              @keydown.enter.exact="handleGenerate"
            />
            
            <!-- 悬浮面板中的上传图片预览列表 -->
            <div v-if="referenceImages.length > 0" class="upload-preview-section compact">
              <div class="preview-label">参考图片 ({{ referenceImages.length }}/5)</div>
              <div class="upload-preview-list">
                <div 
                  v-for="(image, index) in referenceImages" 
                  :key="image.uid"
                  class="upload-preview-item"
                  @click="previewUploadImage(image.url)"
                >
                  <img 
                    :src="image.url" 
                    :alt="image.name"
                    class="upload-preview-image"
                  />
                  <el-button 
                    type="danger" 
                    size="small" 
                    circle
                    @click.stop="removeImage(index)"
                    class="remove-btn-corner"
                  >
                    <el-icon><Close /></el-icon>
                  </el-button>
                </div>
              </div>
            </div>
          </div>

          <div class="panel-controls">
            <!-- 参数选择 -->
            <div class="params-section">
              <!-- 图像生成 -->
              <el-button class="param-btn">
                <el-icon><Picture /></el-icon>
                图像生成
                <el-icon class="el-icon--right"><ArrowDown /></el-icon>
              </el-button>

              <!-- 模型选择 -->
              <el-popover
                ref="panelModelPopoverRef"
                placement="top"
                :width="320"
                trigger="click"
                popper-class="model-popover"
                :teleported="false"
              >
                <template #reference>
                  <el-button class="param-btn model-btn">
                    <div class="model-icon">
                      <div class="icon-circle" :style="{ background: currentModel?.color || '#667eea' }"></div>
                    </div>
                    {{ currentModel?.name || '选择模型' }}
                    <el-icon class="el-icon--right"><ArrowDown /></el-icon>
                  </el-button>
                </template>
                <div class="model-selector">
                  <div class="selector-header">选择模型</div>
                  <div class="model-list">
                    <div 
                      v-for="model in models" 
                      :key="model.id"
                      class="model-item"
                      :class="{ active: currentModel?.id === model.id }"
                      @click="selectModel(model)"
                    >
                      <div class="model-info">
                        <div class="model-icon">
                          <div class="icon-circle" :style="{ background: model.color }"></div>
                        </div>
                        <div class="model-details">
                          <div class="model-name">{{ model.name }}</div>
                          <div class="model-desc">{{ model.description }}</div>
                        </div>
                      </div>
                      <div v-if="currentModel?.id === model.id" class="check-icon">
                        <el-icon><Check /></el-icon>
                      </div>
                    </div>
                  </div>
                </div>
              </el-popover>

              <!-- 尺寸和风格 -->
              <el-popover
                ref="panelSizePopoverRef"
                placement="top"
                :width="360"
                trigger="click"
                popper-class="size-popover"
                :teleported="false"
              >
                <template #reference>
                  <el-button class="param-btn">
                    <el-icon><FullScreen /></el-icon>
                    {{ currentSize?.label || '选择尺寸' }}
                    <el-icon class="el-icon--right"><ArrowDown /></el-icon>
                  </el-button>
                </template>
                <div class="size-selector">
                  <div class="selector-header">选择尺寸</div>
                  <div class="size-grid">
                    <div 
                      v-for="size in imageSizes" 
                      :key="size.value"
                      class="size-item"
                      :class="{ active: currentSize?.value === size.value }"
                      @click="selectSize(size)"
                    >
                      <div class="size-preview" :style="{ aspectRatio: size.aspect }"></div>
                      <div class="size-label">{{ size.label }}</div>
                      <div class="size-resolution">{{ size.width }}×{{ size.height }}</div>
                    </div>
                  </div>
                </div>
              </el-popover>

              <el-popover
                ref="panelStylePopoverRef"
                placement="top"
                :width="320"
                trigger="click"
                popper-class="style-popover"
                :teleported="false"
              >
                <template #reference>
                  <el-button class="param-btn">
                    <div class="style-icon">{{ currentStyle?.icon || '🎨' }}</div>
                    {{ currentStyle?.label || '选择风格' }}
                    <el-icon class="el-icon--right"><ArrowDown /></el-icon>
                  </el-button>
                </template>
                <div class="style-selector">
                  <div class="selector-header">选择风格</div>
                  <div class="style-list">
                    <div 
                      v-for="style in artStyles" 
                      :key="style.value"
                      class="style-item"
                      :class="{ active: currentStyle?.value === style.value }"
                      @click="selectStyle(style)"
                    >
                      <div class="style-info">
                        <div class="style-icon-large">{{ style.icon }}</div>
                        <div class="style-details">
                          <div class="style-name">{{ style.label }}</div>
                          <div class="style-desc">{{ style.description }}</div>
                        </div>
                      </div>
                      <div v-if="currentStyle?.value === style.value" class="check-icon">
                        <el-icon><Check /></el-icon>
                      </div>
                    </div>
                  </div>
                </div>
              </el-popover>
            </div>

            <!-- 生成按钮 -->
            <div class="generate-section">
              <el-button 
                type="primary" 
                :loading="generating"
                :disabled="!prompt.trim()"
                @click="handleGenerate"
                class="generate-btn"
              >
                {{ generating ? '生成中...' : '生成' }}
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 历史记录侧边栏 -->
    <div class="history-sidebar" :class="{ open: showHistory }">
      <div class="sidebar-header">
        <h3>历史记录</h3>
        <el-button type="text" @click="toggleHistory">
          <el-icon><Close /></el-icon>
        </el-button>
      </div>
      <div class="sidebar-content">
        <div v-if="imageHistory.length === 0" class="empty-history">
          <el-icon size="40" color="#ccc"><Clock /></el-icon>
          <p>暂无历史记录</p>
        </div>
        <div v-else class="history-list">
          <div 
            v-for="item in imageHistory" 
            :key="item.id"
            class="history-item"
            @click="selectHistoryItem(item)"
          >
            <div class="history-preview">
              <img :src="item.images[0]?.url" class="history-thumb" />
              <div v-if="item.images.length > 1" class="image-count">
                +{{ item.images.length - 1 }}
              </div>
            </div>
            <div class="history-info">
              <p class="history-prompt">{{ item.prompt }}</p>
              <p class="history-time">{{ formatTime(item.createdAt) }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 历史记录切换按钮 -->
    <el-button 
      class="history-toggle"
      type="primary"
      circle
      @click="toggleHistory"
    >
      <el-icon><Clock /></el-icon>
    </el-button>

    <!-- 上传图片预览对话框 -->
    <el-dialog v-model="uploadPreviewVisible" title="图片预览" width="60%" center class="preview-dialog">
      <div class="preview-content">
        <img :src="uploadPreviewUrl" class="preview-image" />
      </div>
    </el-dialog>

    <!-- 图片预览对话框 -->
    <el-dialog v-model="previewVisible" title="" width="80%" center class="preview-dialog">
      <div v-if="previewImageData" class="preview-content">
        <img :src="previewImageUrl" class="preview-image" />
        <div class="preview-actions">
          <el-button type="primary" @click="downloadImage(previewImageData)">
            <el-icon><Download /></el-icon>
            下载
          </el-button>
          <el-button @click="saveToAssets(previewImageData)">
            <el-icon><FolderAdd /></el-icon>
            保存
          </el-button>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Picture, Plus, Download, FolderAdd, Clock, Close,
  ArrowDown, FullScreen, Check
} from '@element-plus/icons-vue'
import { formatTime } from '../utils'

interface UploadFile {
  uid: string
  name: string
  url: string
  raw: File
}

interface ImageResult {
  id: string
  url: string
  thumbnail: string
}

interface ImageHistoryItem {
  id: string
  prompt: string
  images: ImageResult[]
  model: string
  size: string
  style: string
  createdAt: number
}

interface Model {
  id: string
  name: string
  description: string
  color: string
}

interface Size {
  value: string
  label: string
  width: number
  height: number
  aspect: string
}

interface Style {
  value: string
  label: string
  description: string
  icon: string
}

const prompt = ref('')
const referenceImages = ref<UploadFile[]>([])
const generating = ref(false)
const generateProgress = ref(0)
const progressText = ref('')
const currentImages = ref<ImageResult[]>([])
const showHistory = ref(false)
const previewVisible = ref(false)
const previewImageUrl = ref('')
const previewImageData = ref<ImageResult | null>(null)
const uploadPreviewVisible = ref(false)
const uploadPreviewUrl = ref('')

// Popover 引用
const modelPopoverRef = ref()
const sizePopoverRef = ref()
const stylePopoverRef = ref()
const panelModelPopoverRef = ref()
const panelSizePopoverRef = ref()
const panelStylePopoverRef = ref()

// 模型选项
const models = ref<Model[]>([
  { 
    id: 'seedance-15-pro', 
    name: 'Seedance 1.5 Pro', 
    description: '高质量图像，全新体验',
    color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  },
  { 
    id: 'seedance-10-pro', 
    name: 'Seedance 1.0 Pro', 
    description: '效果稳定，超清画质',
    color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  },
  { 
    id: 'keling-01', 
    name: '可灵 01', 
    description: '支持自然语言描述，视频图片多模态',
    color: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
  },
  { 
    id: 'keling-26', 
    name: '可灵 2.6', 
    description: '高质量生成，智能更新',
    color: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
  }
])

const currentModel = ref(models.value[0])

// 尺寸选项
const imageSizes = ref<Size[]>([
  { value: '1:1', label: '1:1', width: 1024, height: 1024, aspect: '1' },
  { value: '16:9', label: '16:9', width: 1920, height: 1080, aspect: '16/9' },
  { value: '9:16', label: '9:16', width: 1080, height: 1920, aspect: '9/16' },
  { value: '4:3', label: '4:3', width: 1440, height: 1080, aspect: '4/3' },
  { value: '3:4', label: '3:4', width: 1080, height: 1440, aspect: '3/4' },
  { value: '21:9', label: '21:9', width: 2560, height: 1080, aspect: '21/9' },
  { value: '2:3', label: '2:3', width: 1024, height: 1536, aspect: '2/3' },
  { value: '3:2', label: '3:2', width: 1536, height: 1024, aspect: '3/2' }
])

const currentSize = ref(imageSizes.value[0])

// 风格选项
const artStyles = ref<Style[]>([
  { value: 'realistic', label: '真实', description: '照片级真实效果，细节丰富', icon: '📷' },
  { value: 'anime', label: '动漫', description: '日式动漫风格，色彩鲜艳', icon: '🎨' },
  { value: 'oil-painting', label: '油画', description: '古典油画风格，质感厚重', icon: '🖼️' },
  { value: 'watercolor', label: '水彩', description: '水彩画风格，柔和透明', icon: '🎭' },
  { value: 'sketch', label: '素描', description: '铅笔素描风格，线条清晰', icon: '✏️' },
  { value: 'digital-art', label: '数字艺术', description: '现代数字艺术，创意无限', icon: '💻' },
  { value: 'cyberpunk', label: '赛博朋克', description: '未来科技风格，霓虹色彩', icon: '🌃' },
  { value: 'fantasy', label: '奇幻', description: '魔幻风格，想象力丰富', icon: '🧙‍♂️' }
])

const currentStyle = ref(artStyles.value[0])

// 历史记录
const imageHistory = ref<ImageHistoryItem[]>([
  {
    id: '1',
    prompt: '一只可爱的小猫坐在窗台上',
    images: [
      {
        id: '1-1',
        url: 'https://picsum.photos/400/400?random=1',
        thumbnail: 'https://picsum.photos/200/200?random=1'
      },
      {
        id: '1-2',
        url: 'https://picsum.photos/400/400?random=2',
        thumbnail: 'https://picsum.photos/200/200?random=2'
      }
    ],
    model: 'Stable Diffusion',
    size: '1:1',
    style: '真实',
    createdAt: Date.now() - 1000 * 60 * 30
  }
])

// 方法
const selectModel = (model: Model) => {
  currentModel.value = model
  // 关闭 Popover
  modelPopoverRef.value?.hide()
  panelModelPopoverRef.value?.hide()
}

const selectSize = (size: Size) => {
  currentSize.value = size
  // 关闭 Popover
  sizePopoverRef.value?.hide()
  panelSizePopoverRef.value?.hide()
}

const selectStyle = (style: Style) => {
  currentStyle.value = style
  // 关闭 Popover
  stylePopoverRef.value?.hide()
  panelStylePopoverRef.value?.hide()
}

const handleImageUpload = (file: { uid: string; name: string; raw: File }) => {
  // 检查文件数量限制
  if (referenceImages.value.length >= 5) {
    ElMessage.warning('最多只能上传5张图片')
    return false
  }

  // 检查文件类型
  const isImage = file.raw.type.startsWith('image/')
  if (!isImage) {
    ElMessage.error('只能上传图片文件')
    return false
  }

  // 检查文件大小 (10MB)
  const isLt10M = file.raw.size / 1024 / 1024 < 10
  if (!isLt10M) {
    ElMessage.error('图片大小不能超过10MB')
    return false
  }

  // 创建预览URL
  const reader = new FileReader()
  reader.onload = (e) => {
    const imageData = {
      uid: file.uid,
      name: file.name,
      url: e.target?.result as string,
      raw: file.raw
    }
    referenceImages.value.push(imageData)
  }
  reader.readAsDataURL(file.raw)
  
  return false // 阻止自动上传
}

const removeImage = (index: number) => {
  referenceImages.value.splice(index, 1)
}

const previewUploadImage = (imageUrl: string) => {
  uploadPreviewUrl.value = imageUrl
  uploadPreviewVisible.value = true
}

const handleGenerate = async () => {
  if (!prompt.value.trim()) {
    ElMessage.warning('请输入图片描述')
    return
  }

  generating.value = true
  generateProgress.value = 0
  currentImages.value = []

  // 模拟生成过程
  const steps = [
    { progress: 25, text: '正在分析您的描述...' },
    { progress: 50, text: '正在生成图片内容...' },
    { progress: 75, text: '正在优化图片质量...' },
    { progress: 100, text: '生成完成！' }
  ]

  for (const step of steps) {
    await new Promise(resolve => setTimeout(resolve, 1000))
    generateProgress.value = step.progress
    progressText.value = step.text
  }

  // 生成完成
  const newImages: ImageResult[] = []
  for (let i = 0; i < 4; i++) {
    newImages.push({
      id: `${Date.now()}-${i}`,
      url: `https://picsum.photos/400/400?random=${Date.now() + i}`,
      thumbnail: `https://picsum.photos/200/200?random=${Date.now() + i}`
    })
  }

  const historyItem: ImageHistoryItem = {
    id: Date.now().toString(),
    prompt: prompt.value,
    images: newImages,
    model: currentModel.value?.name || '',
    size: currentSize.value?.label || '',
    style: currentStyle.value?.label || '',
    createdAt: Date.now()
  }

  currentImages.value = newImages
  imageHistory.value.unshift(historyItem)
  generating.value = false
  
  ElMessage.success('图片生成成功！')
}

const previewImage = (image: ImageResult) => {
  previewImageUrl.value = image.url
  previewImageData.value = image
  previewVisible.value = true
}

const downloadImage = (image: ImageResult) => {
  const link = document.createElement('a')
  link.href = image.url
  link.download = `generated_image_${image.id}.jpg`
  link.click()
  ElMessage.success('开始下载图片')
}

const saveToAssets = (image: ImageResult) => {
  console.log('Saving image to assets:', image.id)
  ElMessage.success('图片已保存到资产库')
}

const toggleHistory = () => {
  showHistory.value = !showHistory.value
}

const selectHistoryItem = (historyItem: ImageHistoryItem) => {
  currentImages.value = historyItem.images
  showHistory.value = false
}

// 新增方法
const clearAllImages = () => {
  referenceImages.value = []
  ElMessage.success('已清空所有参考图片')
}

const regenerateAll = () => {
  handleGenerate()
}

const downloadAll = () => {
  currentImages.value.forEach((image, index) => {
    setTimeout(() => {
      downloadImage(image)
    }, index * 200)
  })
  ElMessage.success('开始批量下载图片')
}

const regenerateSingle = (index: number) => {
  ElMessage.info(`重新生成第 ${index + 1} 张图片`)
  // 这里可以实现单张图片重新生成的逻辑
}
</script>

<style scoped>
.image-generate-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #ffffff;
  position: relative;
  overflow: hidden;
}

.image-generate-container::before {
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
  pointer-events: none;
}

/* 页面头部 - 即梦风格 */
.page-header {
  text-align: center;
  margin-bottom: 40px;
  position: relative;
  z-index: 1;
}

.header-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.header-icon {
  position: relative;
}

.icon-wrapper {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.1));
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  position: relative;
  overflow: hidden;
}

.icon-wrapper::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.1), transparent);
  animation: shimmer 3s infinite;
}

@keyframes shimmer {
  0% { transform: translateX(-100%) translateY(-100%) rotate(45deg); }
  100% { transform: translateX(100%) translateY(100%) rotate(45deg); }
}

.main-icon {
  font-size: 36px;
  color: #ffffff;
  z-index: 1;
}

.header-title {
  font-size: 36px;
  font-weight: 700;
  margin: 0;
  background: linear-gradient(135deg, #ffffff, rgba(255, 255, 255, 0.8));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.header-subtitle {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.8);
  margin: 0;
  font-weight: 400;
  line-height: 1.5;
}

/* 主要内容区域 */
.main-content {
  width: 100%;
  min-width: 768px;
  max-width: 100%;
  margin: 0 auto;
  padding: 0 40px;
  height: calc(100vh - 120px);
  display: flex;
  flex-direction: column;
}

/* 无内容时的居中输入区域 - 即梦风格 */
.centered-input-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 40px;
  position: relative;
  z-index: 1;
}

.centered-input-section .prompt-container {
  width: 100%;
  max-width: 900px;
  display: flex;
  flex-direction: column;
  gap: 32px;
}
.upload-area {
  flex-shrink: 0;
}

.image-uploader {
  width: 60px;
  height: 60px;
}

.upload-placeholder {
  width: 60px;
  height: 60px;
  border: 2px dashed rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  color: rgba(255, 255, 255, 0.6);
}

.upload-placeholder:hover {
  border-color: #4A90E2;
  color: #4A90E2;
  background: rgba(74, 144, 226, 0.1);
}

.upload-placeholder.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  border-color: rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.3);
}

.upload-placeholder.disabled:hover {
  border-color: rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.3);
  background: transparent;
}

/* 上传图片预览区域 - 即梦风格 */
.upload-preview-section {
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding-top: 20px;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.preview-label {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
  font-weight: 600;
}

.upload-preview-list {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.upload-preview-item {
  position: relative;
  width: 80px;
  height: 80px;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.05);
}

.upload-preview-item:hover {
  transform: scale(1.05);
  border-color: rgba(255, 255, 255, 0.6);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
}

.upload-preview-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.image-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.upload-preview-item:hover .image-overlay {
  opacity: 1;
}

.remove-btn {
  background: rgba(255, 77, 79, 0.9) !important;
  border: none !important;
  color: #ffffff !important;
  width: 24px !important;
  height: 24px !important;
  min-height: 24px !important;
  padding: 0 !important;
  border-radius: 50% !important;
  transition: all 0.3s ease;
}

.remove-btn:hover {
  background: #ff4d4f !important;
  transform: scale(1.1);
}

.prompt-input-wrapper {
  flex: 1;
}

.prompt-input {
  background: transparent;
  border: none;
}

.prompt-input :deep(.el-textarea__inner) {
  background: transparent;
  border: none;
  color: #ffffff;
  font-size: 16px;
  line-height: 1.6;
  resize: none;
  padding: 0;
  box-shadow: none;
}

.prompt-input :deep(.el-textarea__inner)::placeholder {
  color: rgba(255, 255, 255, 0.5);
}

.prompt-input :deep(.el-textarea__inner):focus {
  box-shadow: none;
}

/* 创作控制区域 - 即梦风格 */
.creation-controls {
  margin-top: 32px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.controls-row {
  display: flex;
  gap: 16px;
  align-items: center;
  flex-wrap: wrap;
  justify-content: center;
}

.control-group {
  flex-shrink: 0;
}

.control-button {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  padding: 16px 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 140px;
  position: relative;
  overflow: hidden;
}

.control-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
  transition: left 0.5s ease;
}

.control-button:hover::before {
  left: 100%;
}

.control-button:hover {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.4);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}

.control-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.1);
  flex-shrink: 0;
}

.model-avatar {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  font-weight: 600;
  font-size: 14px;
}

.model-initial {
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.style-emoji {
  font-size: 18px;
}

.control-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.control-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  font-weight: 500;
}

.control-value {
  font-size: 14px;
  color: #ffffff;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.control-arrow {
  color: rgba(255, 255, 255, 0.6);
  font-size: 16px;
  flex-shrink: 0;
  transition: transform 0.3s ease;
}

.control-button:hover .control-arrow {
  transform: translateY(2px);
}

.generate-section {
  display: flex;
  justify-content: center;
}

.generate-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  color: #ffffff;
  height: 56px;
  padding: 0 40px;
  border-radius: 28px;
  font-size: 18px;
  font-weight: 700;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.3);
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 200px;
  justify-content: center;
}

.generate-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s ease;
}

.generate-btn:hover::before {
  left: 100%;
}

.generate-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 32px rgba(102, 126, 234, 0.4);
}

.generate-btn:disabled {
  opacity: 0.6;
  transform: none;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
  cursor: not-allowed;
}

.btn-glow {
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 30px;
  z-index: -1;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.generate-btn:hover .btn-glow {
  opacity: 0.3;
}

/* 创作面板 - 即梦风格 */
.creation-panel {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  padding: 32px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.1);
  position: relative;
  overflow: hidden;
}

.creation-panel::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.5), transparent);
}

.input-section {
  display: flex;
  gap: 24px;
  align-items: flex-start;
  margin-bottom: 24px;
}

.upload-area {
  flex-shrink: 0;
}

.image-uploader {
  width: 120px;
  height: 120px;
}

.upload-placeholder {
  width: 120px;
  height: 120px;
  border: 2px dashed rgba(255, 255, 255, 0.4);
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  color: rgba(255, 255, 255, 0.7);
  background: rgba(255, 255, 255, 0.05);
  gap: 8px;
}

.upload-placeholder:hover {
  border-color: rgba(255, 255, 255, 0.8);
  background: rgba(255, 255, 255, 0.1);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}

.upload-text {
  font-size: 12px;
  font-weight: 500;
}

.upload-placeholder.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  border-color: rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.3);
}

.upload-placeholder.disabled:hover {
  border-color: rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.05);
  transform: none;
  box-shadow: none;
}

.prompt-input-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.prompt-input :deep(.el-textarea__inner) {
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.2);
  color: #ffffff;
  font-size: 16px;
  line-height: 1.6;
  resize: none;
  padding: 20px;
  border-radius: 16px;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
}

.prompt-input :deep(.el-textarea__inner)::placeholder {
  color: rgba(255, 255, 255, 0.5);
  font-size: 15px;
}

.prompt-input :deep(.el-textarea__inner):focus {
  border-color: rgba(255, 255, 255, 0.6);
  background: rgba(255, 255, 255, 0.15);
  box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.1);
}

.input-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 4px;
}

.input-tips {
  display: flex;
  align-items: center;
  gap: 8px;
}

.tip-text {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.6);
}

.char-count {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  font-weight: 500;
}

/* 有内容时的底部悬浮输入面板 */
.floating-input-panel {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
  width: calc(100% - 80px);
  max-width: 900px;
}

.panel-container {
  background: rgba(26, 26, 46, 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 16px;
  padding: 16px 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}

.panel-content {
  display: flex;
  align-items: flex-start;
  gap: 16px;
}

.panel-content .upload-area {
  flex-shrink: 0;
}

.panel-content .image-uploader {
  width: 50px;
  height: 50px;
}

.panel-content .upload-placeholder {
  width: 50px;
  height: 50px;
  border: 2px dashed rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  color: rgba(255, 255, 255, 0.6);
}

.panel-content .upload-placeholder:hover {
  border-color: #4A90E2;
  color: #4A90E2;
  background: rgba(74, 144, 226, 0.1);
}

.panel-content .upload-placeholder.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  border-color: rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.3);
}

.panel-content .upload-placeholder.disabled:hover {
  border-color: rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.3);
  background: transparent;
}

.panel-content .upload-preview-section {
  margin-top: 8px;
}

.panel-content .preview-label {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 6px;
}

.panel-content .upload-preview-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 8px; /* 为删除按钮留出空间 */
}

.panel-content .upload-preview-item {
  position: relative;
  width: 50px;
  height: 50px;
  border-radius: 6px;
  overflow: visible; /* 改为 visible 让删除按钮完全显示 */
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.05);
}

.panel-content .upload-preview-item:hover {
  transform: scale(1.05);
  border-color: #4A90E2;
  box-shadow: 0 2px 8px rgba(74, 144, 226, 0.3);
}

.panel-content .upload-preview-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  border-radius: 4px; /* 稍微小一点的圆角 */
}

.panel-content .remove-btn-corner {
  position: absolute;
  top: -4px; /* 调整位置 */
  right: -4px;
  width: 18px !important; /* 稍微增大尺寸 */
  height: 18px !important;
  min-height: 18px !important;
  padding: 0 !important;
  background: rgba(255, 77, 79, 0.95) !important;
  border: 1px solid #ffffff !important;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
  z-index: 10;
  opacity: 0;
  transition: all 0.3s ease;
  border-radius: 50% !important; /* 确保是圆形 */
}

.panel-content .upload-preview-item:hover .remove-btn-corner {
  opacity: 1;
}

.panel-content .remove-btn-corner:hover {
  background: #ff4d4f !important;
  transform: scale(1.1);
}

.panel-content .remove-btn-corner .el-icon {
  font-size: 10px;
  color: #ffffff;
}

.panel-content .prompt-input-wrapper {
  flex: 1;
}

.panel-content .prompt-input :deep(.el-textarea__inner) {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #ffffff;
  font-size: 14px;
  line-height: 1.5;
  resize: none;
  border-radius: 8px;
}

.panel-content .prompt-input :deep(.el-textarea__inner)::placeholder {
  color: rgba(255, 255, 255, 0.5);
}

.panel-content .prompt-input :deep(.el-textarea__inner):focus {
  border-color: #4A90E2;
  box-shadow: 0 0 0 2px rgba(74, 144, 226, 0.2);
}

.panel-controls {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-shrink: 0;
}

.panel-controls .params-section {
  display: flex;
  gap: 8px;
  align-items: center;
}

.panel-controls .param-btn {
  background: rgba(80, 80, 80, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #ffffff;
  height: 32px;
  padding: 0 12px;
  border-radius: 16px;
  font-size: 12px;
  transition: all 0.3s ease;
}

.panel-controls .param-btn:hover {
  background: rgba(74, 144, 226, 0.3);
  border-color: #4A90E2;
}

.panel-controls .generate-btn {
  background: linear-gradient(135deg, #4A90E2, #357ABD);
  border: none;
  color: #ffffff;
  height: 32px;
  padding: 0 20px;
  border-radius: 16px;
  font-weight: 600;
  font-size: 12px;
  transition: all 0.3s ease;
}

.panel-controls .generate-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(74, 144, 226, 0.4);
}

.panel-controls .generate-btn:disabled {
  opacity: 0.5;
  transform: none;
  box-shadow: none;
}


/* 结果展示区域 */
.results-section {
  flex: 1;
  overflow-y: auto;
  padding-bottom: 120px; /* 为悬浮面板留出空间 */
}

/* 生成中状态 - 即梦风格 */
.generating-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  padding: 40px;
}

.generating-container {
  text-align: center;
  max-width: 500px;
  width: 100%;
}

.generating-visual {
  position: relative;
  display: flex;
  justify-content: center;
  margin-bottom: 32px;
}

.progress-ring {
  position: relative;
  z-index: 2;
}

.generating-animation {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 200px;
  height: 200px;
  pointer-events: none;
}

.spark {
  position: absolute;
  width: 4px;
  height: 4px;
  background: #ffffff;
  border-radius: 50%;
  opacity: 0;
  animation: sparkle 2s infinite;
}

.spark-1 {
  top: 20%;
  left: 30%;
  animation-delay: 0s;
}

.spark-2 {
  top: 60%;
  right: 25%;
  animation-delay: 0.7s;
}

.spark-3 {
  bottom: 30%;
  left: 40%;
  animation-delay: 1.4s;
}

@keyframes sparkle {
  0%, 100% { opacity: 0; transform: scale(0); }
  50% { opacity: 1; transform: scale(1); }
}

.generating-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.generating-title {
  font-size: 24px;
  font-weight: 700;
  margin: 0;
  color: #ffffff;
  background: linear-gradient(135deg, #ffffff, rgba(255, 255, 255, 0.8));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.generating-desc {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.7);
  margin: 0;
  line-height: 1.5;
}

.progress-steps {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  margin-top: 24px;
  padding: 0 20px;
}

.step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
  position: relative;
}

.step-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  transition: all 0.3s ease;
  position: relative;
}

.step.active .step-dot {
  background: #ffffff;
  box-shadow: 0 0 12px rgba(255, 255, 255, 0.6);
}

.step.completed .step-dot {
  background: #667eea;
  box-shadow: 0 0 12px rgba(102, 126, 234, 0.6);
}

.step span {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  text-align: center;
  line-height: 1.2;
  transition: color 0.3s ease;
}

.step.active span {
  color: #ffffff;
  font-weight: 600;
}

.step.completed span {
  color: #667eea;
  font-weight: 600;
}

/* 连接线 */
.step:not(:last-child)::after {
  content: '';
  position: absolute;
  top: 6px;
  right: -50%;
  width: calc(100% - 12px);
  height: 2px;
  background: rgba(255, 255, 255, 0.2);
  transition: background 0.3s ease;
}

.step.completed:not(:last-child)::after {
  background: #667eea;
}

/* 生成结果展示 - 即梦风格 */
.results-display {
  padding: 40px;
  max-width: 1200px;
  margin: 0 auto;
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.results-title {
  font-size: 24px;
  font-weight: 700;
  margin: 0;
  color: #ffffff;
  background: linear-gradient(135deg, #ffffff, rgba(255, 255, 255, 0.8));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.results-actions {
  display: flex;
  gap: 12px;
}

.results-actions .el-button {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #ffffff;
  border-radius: 12px;
  padding: 8px 16px;
  font-size: 14px;
  transition: all 0.3s ease;
}

.results-actions .el-button:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.4);
  transform: translateY(-1px);
}

.results-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
}

.result-card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  padding: 16px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.result-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.5), transparent);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.result-card:hover::before {
  opacity: 1;
}

.result-card:hover {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.4);
  transform: translateY(-4px);
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.2);
}

.image-container {
  position: relative;
  border-radius: 16px;
  overflow: hidden;
  margin-bottom: 12px;
  aspect-ratio: 1;
}

.result-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.3s ease;
}

.result-card:hover .result-image {
  transform: scale(1.05);
}

.image-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.3));
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.result-card:hover .image-overlay {
  opacity: 1;
}

.overlay-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.overlay-actions {
  display: flex;
  gap: 12px;
}

.action-btn {
  width: 44px !important;
  height: 44px !important;
  border-radius: 50% !important;
  background: rgba(255, 255, 255, 0.9) !important;
  border: none !important;
  color: #333 !important;
  font-size: 18px !important;
  transition: all 0.3s ease !important;
  backdrop-filter: blur(10px) !important;
}

.action-btn:hover {
  background: #ffffff !important;
  transform: scale(1.1) !important;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2) !important;
}

.result-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 4px;
}

.result-index {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
  font-weight: 600;
}

.result-actions {
  display: flex;
  gap: 4px;
}

.result-actions .el-button {
  background: transparent !important;
  border: none !important;
  color: rgba(255, 255, 255, 0.6) !important;
  padding: 4px !important;
  width: 28px !important;
  height: 28px !important;
  border-radius: 50% !important;
  transition: all 0.3s ease !important;
}

.result-actions .el-button:hover {
  background: rgba(255, 255, 255, 0.1) !important;
  color: #ffffff !important;
  transform: scale(1.1) !important;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 80px 20px;
  color: rgba(255, 255, 255, 0.6);
}

.empty-icon {
  margin-bottom: 20px;
  opacity: 0.5;
}

.empty-text {
  font-size: 18px;
  margin: 0;
}

/* 历史记录侧边栏 */
.history-sidebar {
  position: fixed;
  top: 0;
  right: -400px;
  width: 400px;
  height: 100vh;
  background: rgba(26, 26, 46, 0.95);
  backdrop-filter: blur(20px);
  border-left: 1px solid rgba(255, 255, 255, 0.1);
  transition: right 0.3s ease;
  z-index: 1000;
  display: flex;
  flex-direction: column;
}

.history-sidebar.open {
  right: 0;
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.sidebar-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.sidebar-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.empty-history {
  text-align: center;
  padding: 60px 20px;
  color: rgba(255, 255, 255, 0.5);
}

.empty-history p {
  margin: 16px 0 0 0;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.history-item {
  display: flex;
  gap: 12px;
  padding: 12px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.05);
  cursor: pointer;
  transition: all 0.3s ease;
}

.history-item:hover {
  background: rgba(255, 255, 255, 0.1);
}

.history-preview {
  position: relative;
  width: 60px;
  height: 60px;
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
}

.history-thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-count {
  position: absolute;
  bottom: 2px;
  right: 2px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  font-size: 10px;
  padding: 2px 4px;
  border-radius: 4px;
}

.history-info {
  flex: 1;
  min-width: 0;
}

.history-prompt {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #ffffff;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.history-time {
  margin: 0;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
}

/* 历史记录切换按钮 */
.history-toggle {
  position: fixed;
  top: 50%;
  right: 20px;
  transform: translateY(-50%);
  z-index: 999;
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #4A90E2, #357ABD);
  border: none;
  box-shadow: 0 4px 16px rgba(74, 144, 226, 0.3);
}

/* 预览对话框 */
.preview-dialog :deep(.el-dialog) {
  background: rgba(26, 26, 46, 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.preview-dialog :deep(.el-dialog__header) {
  display: none;
}

.preview-content {
  text-align: center;
}

.preview-image {
  width: 100%;
  max-height: 70vh;
  object-fit: contain;
  border-radius: 12px;
}

.preview-actions {
  margin-top: 20px;
  display: flex;
  justify-content: center;
  gap: 12px;
}

/* 选择器样式 - 即梦风格 */
:deep(.model-popover),
:deep(.size-popover),
:deep(.style-popover) {
  background: rgba(255, 255, 255, 0.1) !important;
  backdrop-filter: blur(20px) !important;
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
  border-radius: 16px !important;
  padding: 0 !important;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.2) !important;
}

.model-selector,
.size-selector,
.style-selector {
  padding: 24px;
  min-width: 360px;
}

.selector-header {
  font-size: 16px;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  text-align: center;
}

.model-list,
.style-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.model-item,
.style-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.05);
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid transparent;
  position: relative;
  overflow: hidden;
}

.model-item::before,
.style-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
  transition: left 0.5s ease;
}

.model-item:hover::before,
.style-item:hover::before {
  left: 100%;
}

.model-item:hover,
.style-item:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
}

.model-item.active,
.style-item.active {
  background: rgba(102, 126, 234, 0.2);
  border-color: #667eea;
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.2);
}

.model-info,
.style-info {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
  min-width: 0;
}

.model-avatar {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  font-weight: 700;
  font-size: 16px;
  flex-shrink: 0;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.model-details,
.style-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  min-width: 0;
}

.model-name,
.style-name {
  font-size: 16px;
  font-weight: 600;
  color: #ffffff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.model-desc,
.style-desc {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.check-icon {
  color: #667eea;
  font-size: 20px;
  flex-shrink: 0;
}

.style-icon-large {
  font-size: 32px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

/* 尺寸选择器 */
.size-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.size-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px 12px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.05);
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid transparent;
  min-width: 80px;
  position: relative;
  overflow: hidden;
}

.size-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
  transition: left 0.5s ease;
}

.size-item:hover::before {
  left: 100%;
}

.size-item:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
}

.size-item.active {
  background: rgba(102, 126, 234, 0.2);
  border-color: #667eea;
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.2);
}

.size-preview {
  width: 40px;
  height: 30px;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.size-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.size-label {
  font-size: 14px;
  font-weight: 600;
  color: #ffffff;
  white-space: nowrap;
}

.size-resolution {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.6);
  white-space: nowrap;
  text-align: center;
}

/* 参数按钮样式更新 */
.param-btn {
  background: rgba(80, 80, 80, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #ffffff;
  height: 40px;
  padding: 0 16px;
  border-radius: 20px;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
}

.param-btn:hover {
  background: rgba(74, 144, 226, 0.3);
  border-color: #4A90E2;
}

.cost-badge {
  background: rgba(255, 255, 255, 0.2);
  color: #ffffff;
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 10px;
  margin-left: 4px;
  min-width: 16px;
  text-align: center;
}

/* 进度条样式 */
:deep(.el-progress-circle__path) {
  stroke: #4A90E2;
}

:deep(.el-progress__text) {
  color: #ffffff !important;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .main-content {
    min-width: 768px;
    padding: 0 20px;
    overflow-x: auto;
  }
  
  .page-title {
    font-size: 24px;
    padding: 20px 0 16px 0;
  }
  
  .centered-input-section .prompt-container {
    max-width: 100%;
  }
  
  .centered-input-section .input-row {
    flex-direction: column;
    gap: 12px;
  }
  
  .upload-preview-list {
    gap: 8px;
    padding: 8px; /* 移动端也需要padding */
  }
  
  .upload-preview-item {
    width: 60px;
    height: 60px;
  }
  
  .remove-btn-corner {
    top: -4px !important;
    right: -4px !important;
    width: 18px !important;
    height: 18px !important;
    min-height: 18px !important;
  }
  
  .remove-btn-corner .el-icon {
    font-size: 10px !important;
  }
  
  .centered-input-section .params-section {
    justify-content: flex-start;
    gap: 8px;
    flex-wrap: wrap;
  }
  
  .floating-input-panel {
    bottom: 10px;
    width: calc(100% - 20px);
  }
  
  .panel-content {
    flex-direction: column;
    gap: 12px;
  }
  
  .panel-controls {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }
  
  .panel-controls .params-section {
    justify-content: center;
    flex-wrap: wrap;
  }
  
  .param-btn {
    font-size: 14px;
    height: 36px;
    padding: 0 12px;
  }
  
  .results-grid {
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 16px;
  }
  
  .history-sidebar {
    width: 100vw;
    right: -100vw;
  }
  
  .history-toggle {
    right: 16px;
    width: 44px;
    height: 44px;
  }
}

@media (min-width: 769px) and (max-width: 1024px) {
  .main-content {
    padding: 0 30px;
  }
  
  .floating-input-panel {
    width: calc(100% - 60px);
    max-width: 800px;
  }
  
  .results-grid {
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  }
}

@media (min-width: 1025px) {
  .main-content {
    padding: 0 40px;
  }
  
  .floating-input-panel {
    max-width: 1000px;
  }
  
  .results-grid {
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
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
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
}

.sidebar-content::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}
</style>

<style>
/* 全局样式 - 用于 Element Plus Popover 组件 */
.model-popover,
.size-popover,
.style-popover {
  background: #323233 !important;
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  border-radius: 12px !important;
  padding: 0 !important;
}

.model-popover .el-popover__content,
.size-popover .el-popover__content,
.style-popover .el-popover__content {
  padding: 0 !important;
}

/* 其他下拉框样式 */
.el-dropdown-menu {
  background: #323233 !important;
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
}

.el-select-dropdown {
  background: #323233 !important;
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
}
</style>