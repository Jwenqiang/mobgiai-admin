<template>
  <div class="image-generate-container">
    <!-- 主要内容区域 -->
    <div class="main-content">
      <!-- 无内容时的居中输入区域 -->
      <div v-if="currentImages.length === 0 && !generating" class="centered-input-section">
        <!-- 主标题 -->
        <div class="page-header">
          <div class="header-content">
            <div class="header-icon">
              <el-icon class="main-icon"><Picture /></el-icon>
            </div>
            <h1 class="header-title">图片生成</h1>
          </div>
        </div>
        
        <!-- 上传图片预览列表 - 放在页面头部下方 -->
        <div v-if="referenceImages.length > 0" class="upload-preview-section header-below">
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
        
        <!-- 输入区域 -->
        <div class="input-container">
          <!-- 上半部分：上传和文本输入 -->
          <div class="input-top-section">
            <!-- 上传按钮 -->
            <div class="upload-section">
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
                <div class="upload-btn large" :class="{ disabled: referenceImages.length >= 5 }">
                  <el-icon><Plus /></el-icon>
                </div>
              </el-upload>
            </div>
            
            <!-- 文本输入 -->
            <div class="text-input-section">
              <el-input
                v-model="prompt"
                type="textarea"
                :rows="1"
                :autosize="{ minRows: 1, maxRows: 4 }"
                placeholder="请描述您想要生成的图片内容..."
                class="main-input"
                :maxlength="300"
                show-word-limit
                @keydown.enter.exact="handleGenerate"
              />
            </div>
          </div>
          
          <!-- 下半部分：参数选择和生成按钮 -->
          <div class="input-bottom-section">
            <!-- 参数选择按钮组 -->
            <div class="params-section">
              <!-- 模型选择 -->
              <el-popover
                ref="modelPopoverRef"
                placement="top"
                :width="240"
                trigger="click"
                popper-class="model-popover"
                :teleported="true"
              >
                <template #reference>
                  <div class="param-btn model-btn">
                    <div class="btn-icon">
                      <div class="model-dot" :style="{ background: currentModel?.color || '#4A90E2' }"></div>
                    </div>
                    <span>{{ currentModel?.name || 'Seedance 1.5 Pro' }}</span>
                    <el-icon class="arrow-icon"><ArrowDown /></el-icon>
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

              <!-- 图片参数选择 -->
              <el-popover
                ref="imageParamsPopoverRef"
                placement="top"
                :width="280"
                trigger="click"
                popper-class="image-params-popover"
                :teleported="true"
              >
                <template #reference>
                  <div class="param-btn">
                    <div class="btn-icon">
                      <el-icon><FullScreen /></el-icon>
                    </div>
                    <span>{{ currentSize?.label || '9:16' }} | {{ currentResolution?.label || '4K' }} | {{ currentImageCount?.label || '4' }}张</span>
                    <el-icon class="arrow-icon"><ArrowDown /></el-icon>
                  </div>
                </template>
                <div class="image-params-selector">
                  <div class="selector-header">选择比例</div>
                  <div class="ratio-grid">
                    <div 
                      v-for="size in imageSizes" 
                      :key="size.value"
                      class="ratio-item"
                      :class="{ active: currentSize?.value === size.value }"
                      @click="selectSize(size)"
                    >
                      <div class="ratio-preview" :style="{ aspectRatio: size.aspect }"></div>
                      <div class="ratio-label">{{ size.label }}</div>
                    </div>
                  </div>
                  
                  <div class="selector-header">选择分辨率</div>
                  <div class="resolution-options">
                    <div 
                      v-for="resolution in resolutions" 
                      :key="resolution.value"
                      class="resolution-option"
                      :class="{ active: currentResolution?.value === resolution.value }"
                      @click="selectResolution(resolution)"
                    >
                      <span>{{ resolution.label }}</span>
                    </div>
                  </div>
                  
                  <div class="selector-header">尺寸</div>
                  <div class="size-display">
                    <div class="size-input-group">
                      <span class="size-label">W</span>
                      <div class="size-value">{{ currentSize?.width || 1440 }}</div>
                      <span class="size-connector">⟷</span>
                      <span class="size-label">H</span>
                      <div class="size-value">{{ currentSize?.height || 2560 }}</div>
                      <span class="size-unit">PX</span>
                    </div>
                  </div>
                  
                  <div class="selector-header">图片张数</div>
                  <div class="count-options">
                    <div 
                      v-for="count in imageCounts" 
                      :key="count.value"
                      class="count-option"
                      :class="{ active: currentImageCount?.value === count.value }"
                      @click="selectImageCount(count)"
                    >
                      <span>{{ count.label }}</span>
                    </div>
                  </div>
                  
                  <div class="selector-footer">
                    <el-button 
                      type="primary" 
                      size="small" 
                      @click="imageParamsPopoverRef?.hide()"
                      class="done-btn"
                    >
                      完成
                    </el-button>
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
                <span>{{ generating ? '生成中...' : '生成' }}</span>
              </el-button>
            </div>
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

        <!-- 生成结果 - 新布局 -->
        <div v-else-if="currentImages.length > 0" class="results-display">
          <!-- 生成内容卡片 -->
          <div class="generation-card">
            <!-- 上部分：缩略图和描述 -->
            <div class="generation-header">
              <div class="generation-thumbnail">
                <img :src="currentImages[0]?.url" alt="生成缩略图" class="thumbnail-image" />
              </div>
              <div class="generation-info">
                <div class="generation-prompt">{{ prompt || '这是一段生成于千年前的成图的内容示例，它的主要作用是向用户展示出图像生成的强大功能，让用户能够直观地感受到AI生成图像的魅力和实用性。在实际使用时，这段文字会被替换为用户输入的具体描述内容，从而生成符合用户需求的个性化图像。' }}</div>
              </div>
            </div>
            
            <!-- 中部分：模型标签等信息 -->
            <div class="generation-meta">
              <div class="meta-tags">
                <span class="meta-tag model-tag">{{ currentModel?.name || 'Seedance 1.5' }}</span>
                <span class="meta-tag size-tag">{{ currentSize?.label || '9:16' }}</span>
              </div>
            </div>
            
            <!-- 下部分：生成图 -->
            <div class="generation-images" :class="`count-${currentImages.length}`">
              <div 
                v-for="(image, index) in currentImages" 
                :key="index"
                class="generation-image-item"
                @click="previewImage(image)"
              >
                <div class="image-wrapper">
                  <img :src="image.url" :alt="`生成的图片 ${index + 1}`" class="generated-image" />
                  <div class="image-overlay">
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
                      <!-- <el-button 
                        type="success" 
                        size="small" 
                        circle
                        @click.stop="saveToAssets(image)"
                        class="action-btn"
                      >
                        <el-icon><FolderAdd /></el-icon>
                      </el-button> -->
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- 底部：操作按钮 -->
            <div class="generation-actions">
              <el-button class="action-button edit-button" @click="editGeneration">
                <el-icon class="button-icon"><Edit /></el-icon>
                <span>重新编辑</span>
              </el-button>
              <el-button class="action-button regenerate-button" @click="regenerateAll">
                <el-icon class="button-icon"><Refresh /></el-icon>
                <span>再次生成</span>
              </el-button>
              <el-button class="action-button delete-button" @click="deleteGeneration">
                <el-icon class="button-icon"><Delete /></el-icon>
                <span>删除</span>
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 有内容时的底部悬浮输入面板 -->
    <div v-if="currentImages.length > 0 || generating" class="floating-input-panel" :class="getPanelClass()">
      <div class="panel-container">
        <!-- 上半部分：上传和文本输入 -->
        <div class="panel-top-section">
          <!-- 上传按钮 -->
          <div class="upload-section">
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
              <div class="upload-btn small" :class="{ disabled: referenceImages.length >= 5 }">
                <el-icon><Plus /></el-icon>
              </div>
            </el-upload>
            <div class="upload-hint" v-if="referenceImages.length === 0">
              <span>添加参考图</span>
            </div>
          </div>
          
          <!-- 文本输入 -->
          <div class="text-input-section">
            <el-input
              v-model="prompt"
              type="textarea"
              :rows="1"
              :autosize="{ minRows: 1, maxRows: 3 }"
              placeholder="请描述您想要生成的图片内容..."
              class="main-input compact"
              :maxlength="300"
              show-word-limit
              @keydown.enter.exact="handleGenerate"
            />
          </div>
        </div>

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

        <!-- 下半部分：参数选择和生成按钮 -->
        <div class="panel-bottom-section">
          <!-- 参数选择按钮组 -->
          <div class="params-section">
            <!-- 模型选择 -->
            <el-popover
              ref="panelModelPopoverRef"
              placement="top"
              :width="240"
              trigger="click"
              popper-class="model-popover"
              :teleported="true"
            >
              <template #reference>
                <div class="param-btn model-btn">
                  <div class="btn-icon">
                    <div class="model-dot" :style="{ background: currentModel?.color || '#4A90E2' }"></div>
                  </div>
                  <span>{{ currentModel?.name || 'Seedance 1.5 Pro' }}</span>
                  <el-icon class="arrow-icon"><ArrowDown /></el-icon>
                </div>
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

            <!-- 图片参数选择 -->
            <el-popover
              ref="panelImageParamsPopoverRef"
              placement="top"
              :width="280"
              trigger="click"
              popper-class="image-params-popover"
              :teleported="true"
            >
              <template #reference>
                <div class="param-btn">
                  <div class="btn-icon">
                    <el-icon><FullScreen /></el-icon>
                  </div>
                  <span>{{ currentSize?.label || '9:16' }} | {{ currentResolution?.label || '4K' }} | {{ currentImageCount?.label || '4' }}张</span>
                  <el-icon class="arrow-icon"><ArrowDown /></el-icon>
                </div>
              </template>
              <div class="image-params-selector">
                <div class="selector-header">选择比例</div>
                <div class="ratio-grid">
                  <div 
                    v-for="size in imageSizes" 
                    :key="size.value"
                    class="ratio-item"
                    :class="{ active: currentSize?.value === size.value }"
                    @click="selectSize(size)"
                  >
                    <div class="ratio-preview" :style="{ aspectRatio: size.aspect }"></div>
                    <div class="ratio-label">{{ size.label }}</div>
                  </div>
                </div>
                
                <div class="selector-header">选择分辨率</div>
                <div class="resolution-options">
                  <div 
                    v-for="resolution in resolutions" 
                    :key="resolution.value"
                    class="resolution-option"
                    :class="{ active: currentResolution?.value === resolution.value }"
                    @click="selectResolution(resolution)"
                  >
                    <span>{{ resolution.label }}</span>
                  </div>
                </div>
                
                <div class="selector-header">尺寸</div>
                <div class="size-display">
                  <div class="size-input-group">
                    <span class="size-label">W</span>
                    <div class="size-value">{{ currentSize?.width || 1440 }}</div>
                    <span class="size-connector">⟷</span>
                    <span class="size-label">H</span>
                    <div class="size-value">{{ currentSize?.height || 2560 }}</div>
                    <span class="size-unit">PX</span>
                  </div>
                </div>
                
                <div class="selector-header">图片张数</div>
                <div class="count-options">
                  <div 
                    v-for="count in imageCounts" 
                    :key="count.value"
                    class="count-option"
                    :class="{ active: currentImageCount?.value === count.value }"
                    @click="selectImageCount(count)"
                  >
                    <span>{{ count.label }}</span>
                  </div>
                </div>
                
                <div class="selector-footer">
                  <el-button 
                    type="primary" 
                    size="small" 
                    @click="panelImageParamsPopoverRef?.hide()"
                    class="done-btn"
                  >
                    完成
                  </el-button>
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
              class="generate-btn compact"
            >
              <span>{{ generating ? '生成中...' : '生成' }}</span>
            </el-button>
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
import { ref, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Picture, Plus, Download, FolderAdd, Clock, Close,
  ArrowDown, FullScreen, Check, Refresh, Edit, Delete
} from '@element-plus/icons-vue'
import { formatTime } from '../utils'
import { downloadFile } from '../utils'

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

interface Resolution {
  value: string
  label: string
  quality: string
}

interface ImageCount {
  value: number
  label: string
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

// 滚动相关状态
const isScrolling = ref(false)
const scrollDirection = ref<'up' | 'down' | 'none'>('none')
const lastScrollTop = ref(0)
const scrollTimer = ref<number | null>(null)

// Popover 引用
const modelPopoverRef = ref()
const imageParamsPopoverRef = ref()
const panelModelPopoverRef = ref()
const panelImageParamsPopoverRef = ref()

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

// 尺寸选项 - 按图片显示的顺序排列
const imageSizes = ref<Size[]>([
  { value: '21:9', label: '21:9', width: 2560, height: 1080, aspect: '21/9' },
  { value: '16:9', label: '16:9', width: 1920, height: 1080, aspect: '16/9' },
  { value: '3:2', label: '3:2', width: 1536, height: 1024, aspect: '3/2' },
  { value: '4:3', label: '4:3', width: 1440, height: 1080, aspect: '4/3' },
  { value: '1:1', label: '1:1', width: 1024, height: 1024, aspect: '1' },
  { value: '3:4', label: '3:4', width: 1080, height: 1440, aspect: '3/4' },
  { value: '2:3', label: '2:3', width: 1024, height: 1536, aspect: '2/3' },
  { value: '9:16', label: '9:16', width: 1080, height: 1920, aspect: '9/16' }
])

const currentSize = ref(imageSizes.value[7]) // 默认选择9:16

// 分辨率选项
const resolutions = ref<Resolution[]>([
  { value: '2k', label: '高清 2K', quality: '2K' },
  { value: '4k', label: '超清 4K', quality: '4K' }
])

const currentResolution = ref(resolutions.value[0])

// 图片张数选项
const imageCounts = ref<ImageCount[]>([
  { value: 1, label: '1' },
  { value: 2, label: '2' },
  { value: 3, label: '3' },
  { value: 4, label: '4' }
])

const currentImageCount = ref(imageCounts.value[3]) // 默认选择4张

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
  // 不关闭 Popover，允许继续选择其他参数
}

const selectResolution = (resolution: Resolution) => {
  currentResolution.value = resolution
  // 不关闭 Popover，允许继续选择其他参数
}

const selectImageCount = (count: ImageCount) => {
  currentImageCount.value = count
  // 不关闭 Popover，允许继续选择其他参数
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
  const imageCount = currentImageCount.value?.value || 4
  for (let i = 0; i < imageCount; i++) {
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

const downloadImage = async (image: ImageResult) => {
  try {
    await downloadFile(image.url, `generated_image_${image.id}.jpg`)
    ElMessage.success('开始下载图片')
  } catch (error) {
    console.error('下载图片失败:', error)
    ElMessage.error('下载图片失败，请重试')
  }
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

const editGeneration = () => {
  // 重新编辑：清空当前结果，回到编辑状态
  // 保持当前的 prompt 和参数设置
  ElMessage.info('返回编辑模式')
}

const deleteGeneration = () => {
  // 删除当前生成结果
  currentImages.value = []
  ElMessage.success('已删除生成结果')
}

// 滚动监听函数
const handleScroll = () => {
  const mainContent = document.querySelector('.main-content')
  if (!mainContent) return

  const currentScrollTop = mainContent.scrollTop
  
  // 判断滚动方向
  if (currentScrollTop > lastScrollTop.value) {
    scrollDirection.value = 'down'
  } else if (currentScrollTop < lastScrollTop.value) {
    scrollDirection.value = 'up'
  }
  
  lastScrollTop.value = currentScrollTop
  isScrolling.value = true
  
  // 清除之前的定时器
  if (scrollTimer.value) {
    clearTimeout(scrollTimer.value)
  }
  
  // 设置新的定时器，滚动停止后展开面板
  scrollTimer.value = setTimeout(() => {
    isScrolling.value = false
    scrollDirection.value = 'none'
  }, 150) as unknown as number
}

// 计算面板状态
const getPanelClass = () => {
  if (!currentImages.value.length) return ''
  
  if (isScrolling.value && scrollDirection.value === 'up') {
    return 'collapsed'
  } else if (!isScrolling.value || scrollDirection.value === 'down') {
    return 'expanded'
  }
  
  return 'expanded'
}

// 组件挂载时添加滚动监听
onMounted(() => {
  const mainContent = document.querySelector('.main-content')
  if (mainContent) {
    mainContent.addEventListener('scroll', handleScroll, { passive: true })
  }
})

// 组件卸载时移除滚动监听
onUnmounted(() => {
  const mainContent = document.querySelector('.main-content')
  if (mainContent) {
    mainContent.removeEventListener('scroll', handleScroll)
  }
  
  if (scrollTimer.value) {
    clearTimeout(scrollTimer.value)
  }
})
</script>

<style scoped>
.image-generate-container {
  height: 100vh;
  background: #1a1a2e;
  color: #ffffff;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.image-generate-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    radial-gradient(circle at 20% 80%, rgba(74, 144, 226, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(102, 126, 234, 0.1) 0%, transparent 50%);
  pointer-events: none;
}

/* 页面头部 - 简洁风格 */
.page-header {
  text-align: center;
  margin-bottom: 20px;
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
  width: 48px;
  height: 48px;
  background: rgba(74, 144, 226, 0.15);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(74, 144, 226, 0.25);
}

.main-icon {
  font-size: 24px;
  color: #4A90E2;
}

.header-title {
  font-size: 24px;
  font-weight: 500;
  margin: 0;
  color: #ffffff;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* 输入容器 */
.input-container {
  width: 100%;
  max-width: 600px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 输入区域上半部分 */
.input-top-section {
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  padding: 16px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 56px;
}

/* 输入区域下半部分 */
.input-bottom-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

/* 上传按钮 */
.upload-section {
  flex-shrink: 0;
}

.upload-btn {
  width: 36px;
  height: 36px;
  background: rgba(255, 255, 255, 0.1);
  border: 2px dashed rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  color: rgba(255, 255, 255, 0.7);
}

.upload-btn.large {
  width: 60px;
  height: 60px;
  border-radius: 12px;
}

.upload-btn:hover {
  border-color: #4A90E2;
  background: rgba(74, 144, 226, 0.1);
  color: #4A90E2;
}

.upload-btn.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  border-color: rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.3);
}

.upload-btn.disabled:hover {
  border-color: rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.3);
}

.upload-btn.small {
  width: 32px;
  height: 32px;
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  color: rgba(255, 255, 255, 0.8);
  position: relative;
  overflow: hidden;
}

.upload-btn.small::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
  transition: left 0.5s ease;
}

.upload-btn.small:hover::before {
  left: 100%;
}

.upload-btn.small:hover {
  border-color: #4A90E2;
  background: rgba(74, 144, 226, 0.15);
  color: #4A90E2;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(74, 144, 226, 0.2);
}

.upload-btn.small.disabled {
  opacity: 0.4;
  cursor: not-allowed;
  border-color: rgba(255, 255, 255, 0.15);
  color: rgba(255, 255, 255, 0.4);
  background: rgba(255, 255, 255, 0.05);
}

.upload-btn.small.disabled:hover {
  border-color: rgba(255, 255, 255, 0.15);
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.4);
  transform: none;
  box-shadow: none;
}

.upload-btn.small.disabled::before {
  display: none;
}

.upload-btn.small .el-icon {
  font-size: 14px;
}

/* 文本输入区域 */
.text-input-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
  position: relative;
  padding-bottom: 20px; /* 为字符计数器留出空间 */
}

.main-input :deep(.el-textarea__inner) {
  background: transparent;
  border: none;
  color: #ffffff;
  font-size: 14px;
  line-height: 1.4;
  resize: none;
  padding: 0;
  box-shadow: none;
}

.main-input :deep(.el-textarea__inner)::placeholder {
  color: rgba(255, 255, 255, 0.5);
}

.main-input :deep(.el-textarea__inner):focus {
  box-shadow: none;
}

.main-input :deep(.el-input__count) {
  background: transparent;
  color: rgba(255, 255, 255, 0.6);
  font-size: 11px;
  line-height: 1;
  right: 0;
  bottom: -18px;
  position: absolute;
}

.main-input.compact :deep(.el-textarea__inner) {
  font-size: 13px;
}

.main-input.compact :deep(.el-input__count) {
  font-size: 10px;
  bottom: -16px;
}

/* 参数选择区域 */
.params-section {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}

.param-btn {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 6px 12px;
  color: #ffffff;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  height: 32px;
  white-space: nowrap;
}

.param-btn:hover {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.3);
}

.btn-icon {
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.model-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #4A90E2;
}

.style-emoji {
  font-size: 14px;
}

.arrow-icon {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  margin-left: 2px;
}

/* 生成按钮 */
.generate-section {
  flex-shrink: 0;
}

.generate-btn {
  background: linear-gradient(135deg, #4A90E2, #357ABD);
  border: none;
  color: #ffffff;
  height: 36px;
  padding: 0 20px;
  border-radius: 18px;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.3s ease;
  min-width: 70px;
}

.generate-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(74, 144, 226, 0.4);
}

.generate-btn:disabled {
  opacity: 0.5;
  transform: none;
  box-shadow: none;
}

.generate-btn.compact {
  height: 32px;
  padding: 0 16px;
  font-size: 12px;
}

/* 主要内容区域 */
.main-content {
  width: 100%;
  height: 100%;
  margin: 0 auto;
  padding: 0 40px;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  overflow-x: hidden;
}

/* 无内容时的居中输入区域 */
.centered-input-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 80px);
  padding: 40px;
  position: relative;
  z-index: 1;
  flex-shrink: 0;
}
/* 上传图片预览区域 */
.upload-preview-section {
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding-top: 12px;
  margin-top: 12px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 12px;
  padding: 12px;
}

/* 页面头部下方的参考图片区域 */
.upload-preview-section.header-below {
  width: 100%;
  max-width: 500px;
  margin: 0 auto 16px auto;
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 12px;
  margin-top: 0;
  border-top: none;
}

.upload-preview-section.header-below .preview-header {
  margin-bottom: 8px;
}

.upload-preview-section.header-below .preview-label {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.6);
  font-weight: 400;
}

.upload-preview-section.header-below .upload-preview-list {
  gap: 8px;
}

.upload-preview-section.header-below .upload-preview-item {
  width: 48px;
  height: 48px;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  position: relative;
  overflow: visible;
}

.upload-preview-section.header-below .upload-preview-item:hover {
  transform: scale(1.02);
  border-color: rgba(255, 255, 255, 0.4);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.upload-preview-section.header-below .upload-preview-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 5px;
}

.upload-preview-section.header-below .remove-btn-corner {
  position: absolute;
  top: -4px;
  right: -4px;
  width: 16px !important;
  height: 16px !important;
  min-height: 16px !important;
  padding: 0 !important;
  background: rgba(255, 77, 79, 0.95) !important;
  border: 1px solid #ffffff !important;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
  z-index: 10;
  opacity: 0;
  transition: all 0.3s ease;
  border-radius: 50% !important;
}

.upload-preview-section.header-below .upload-preview-item:hover .remove-btn-corner {
  opacity: 1;
}

.upload-preview-section.header-below .remove-btn-corner:hover {
  background: #ff4d4f !important;
  transform: scale(1.1);
}

.upload-preview-section.header-below .remove-btn-corner .el-icon {
  font-size: 8px;
  color: #ffffff;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.preview-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
  font-weight: 500;
}

.upload-preview-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.upload-preview-item {
  position: relative;
  width: 60px;
  height: 60px;
  border-radius: 8px;
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
  width: 20px !important;
  height: 20px !important;
  min-height: 20px !important;
  padding: 0 !important;
  border-radius: 50% !important;
  transition: all 0.3s ease;
}

.remove-btn:hover {
  background: #ff4d4f !important;
  transform: scale(1.1);
}

/* 悬浮面板中的上传图片预览 */
.upload-preview-section.compact {
  margin-top: 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  padding-top: 8px;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 6px;
  padding: 8px;
}

.upload-preview-section.compact .preview-label {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 6px;
  font-weight: 500;
}

.upload-preview-section.compact .upload-preview-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 0;
}

.upload-preview-section.compact .upload-preview-item {
  position: relative;
  width: 36px;
  height: 36px;
  border-radius: 6px;
  overflow: visible;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(4px);
}

.upload-preview-section.compact .upload-preview-item:hover {
  transform: scale(1.05);
  border-color: #4A90E2;
  box-shadow: 0 2px 8px rgba(74, 144, 226, 0.3);
}

.upload-preview-section.compact .upload-preview-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  border-radius: 5px;
}

.remove-btn-corner {
  position: absolute;
  top: -4px;
  right: -4px;
  width: 16px !important;
  height: 16px !important;
  min-height: 16px !important;
  padding: 0 !important;
  background: rgba(255, 77, 79, 0.95) !important;
  border: 1px solid #ffffff !important;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
  z-index: 10;
  opacity: 0;
  transition: all 0.3s ease;
  border-radius: 50% !important;
  backdrop-filter: blur(4px);
}

.upload-preview-section.compact .upload-preview-item:hover .remove-btn-corner {
  opacity: 1;
}

.remove-btn-corner:hover {
  background: #ff4d4f !important;
  transform: scale(1.1);
}

.remove-btn-corner .el-icon {
  font-size: 8px;
  color: #ffffff;
}





/* 有内容时的底部悬浮输入面板 */
.floating-input-panel {
  position: absolute;
  bottom: 16px; /* 增加距离底部的间距 */
  left: 50%;
  transform: translateX(-50%);
  z-index: 1500;
  width: calc(100% - 80px);
  max-width: 600px;
  pointer-events: auto;
  transition: all 0.3s ease;
}

/* 收起状态 */
.floating-input-panel.collapsed {
  transform: translateX(-50%) scale(0.85);
  opacity: 0.8;
}

/* 展开状态 */
.floating-input-panel.expanded {
  transform: translateX(-50%) scale(1);
  opacity: 1;
}

.panel-container {
  background: rgba(26, 26, 46, 0.96);
  backdrop-filter: blur(24px);
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 16px;
  padding: 14px 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4), 0 2px 8px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  gap: 12px;
  position: relative;
  overflow: hidden;
}

.panel-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
}

/* 悬浮面板上半部分 */
.panel-top-section {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding-bottom: 2px;
}

/* 悬浮面板下半部分 */
.panel-bottom-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.panel-top-section .upload-section {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  position: relative;
  gap: 8px;
}

.upload-hint {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.6);
  white-space: nowrap;
  opacity: 0.8;
  transition: opacity 0.3s ease;
}

.upload-section:hover .upload-hint {
  opacity: 1;
  color: rgba(255, 255, 255, 0.8);
}

.panel-top-section .text-input-section {
  flex: 1;
  min-width: 200px;
  position: relative;
  padding-bottom: 18px; /* 为字符计数器留出空间 */
}

.panel-bottom-section .params-section {
  display: flex;
  gap: 6px;
  align-items: center;
  flex-wrap: wrap;
}

.panel-bottom-section .generate-section {
  flex-shrink: 0;
}


/* 结果展示区域 */
.results-section {
  flex: 1;
  overflow: visible;
  padding-bottom: 200px; /* 增加底部间距，确保生成器不遮挡内容 */
  position: relative;
  z-index: 1;
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

/* 生成结果展示 - 扁平布局 */
.results-display {
  padding: 20px 40px 60px 40px; /* 增加底部内边距 */
  width: 100%;
  max-width: none;
  margin: 0;
}

.generation-card {
  background: transparent;
  backdrop-filter: none;
  border-radius: 0;
  padding: 16px 0;
  border: none;
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  margin-bottom: 24px;
}

.generation-card:last-child {
  border-bottom: none;
  margin-bottom: 60px; /* 增加最后一个卡片的底部间距 */
}

/* 上部分：缩略图和描述 */
.generation-header {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  margin-bottom: 2px;
}

.generation-thumbnail {
  width: 80px;
  height: 80px;
  border-radius: 12px;
  overflow: hidden;
  flex-shrink: 0;
  background: rgba(255, 255, 255, 0.1);
}

.thumbnail-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.generation-info {
  flex: 1;
  min-width: 0;
}

.generation-prompt {
  font-size: 14px;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.9);
  margin: 0;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

/* 中部分：模型标签等信息 */
.generation-meta {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  margin: 6px 0;
}

.meta-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.meta-tag {
  background: rgba(255, 255, 255, 0.15);
  color: rgba(255, 255, 255, 0.9);
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 500;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.model-tag {
  background: rgba(102, 126, 234, 0.3);
  border-color: rgba(102, 126, 234, 0.5);
  color: #ffffff;
}

.size-tag {
  background: rgba(74, 144, 226, 0.3);
  border-color: rgba(74, 144, 226, 0.5);
  color: #ffffff;
}

/* 下部分：生成图 */
.generation-images {
  display: grid;
  gap: 16px;
  width: 100%;
}

.generation-images.count-1 {
  grid-template-columns: 1fr;
  max-width: 400px;
  margin: 0 auto;
}

.generation-images.count-2 {
  grid-template-columns: repeat(2, 1fr);
}

.generation-images.count-3 {
  grid-template-columns: repeat(3, 1fr);
}

.generation-images.count-4 {
  grid-template-columns: repeat(4, 1fr);
}

.generation-image-item {
  aspect-ratio: 1;
  cursor: pointer;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.3s ease;
  background: rgba(255, 255, 255, 0.05);
}

.generation-image-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
}

.image-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 8px;
  overflow: hidden;
  background: transparent;
}

.generated-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.generation-image-item:hover .generated-image {
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

.generation-image-item:hover .image-overlay {
  opacity: 1;
}

.overlay-actions {
  display: flex;
  gap: 12px;
}

.action-btn {
  width: 36px !important;
  height: 36px !important;
  border-radius: 50% !important;
  background: rgba(255, 255, 255, 0.9) !important;
  border: none !important;
  color: #333 !important;
  font-size: 16px !important;
  transition: all 0.3s ease !important;
  backdrop-filter: blur(10px) !important;
}

.action-btn:hover {
  background: #ffffff !important;
  transform: scale(1.1) !important;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2) !important;
}

/* 底部：操作按钮 */
.generation-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-start;
  padding-top: 12px;
  border-top: none;
}

.action-button {
  height: 32px;
  padding: 0 16px;
  border-radius: 16px;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.3s ease;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.8);
  flex: none;
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: auto;
  justify-content: center;
}

.action-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  border-color: rgba(255, 255, 255, 0.3);
}

.button-icon {
  font-size: 14px;
  flex-shrink: 0;
}

.edit-button {
  border-color: rgba(255, 193, 7, 0.3);
  background: rgba(255, 193, 7, 0.08);
}

.edit-button:hover {
  background: rgba(255, 193, 7, 0.15);
  border-color: rgba(255, 193, 7, 0.5);
  color: #ffc107;
  box-shadow: 0 2px 8px rgba(255, 193, 7, 0.2);
}

.edit-button .button-icon {
  color: rgba(255, 193, 7, 0.8);
}

.edit-button:hover .button-icon {
  color: #ffc107;
}

.regenerate-button {
  border-color: rgba(74, 144, 226, 0.3);
  background: rgba(74, 144, 226, 0.08);
}

.regenerate-button:hover {
  background: rgba(74, 144, 226, 0.15);
  border-color: rgba(74, 144, 226, 0.5);
  color: #4A90E2;
  box-shadow: 0 2px 8px rgba(74, 144, 226, 0.2);
}

.regenerate-button .button-icon {
  color: rgba(74, 144, 226, 0.8);
}

.regenerate-button:hover .button-icon {
  color: #4A90E2;
}

.delete-button {
  border-color: rgba(255, 77, 79, 0.3);
  background: rgba(255, 77, 79, 0.08);
}

.delete-button:hover {
  background: rgba(255, 77, 79, 0.15);
  border-color: rgba(255, 77, 79, 0.5);
  color: #ff4d4f;
  box-shadow: 0 2px 8px rgba(255, 77, 79, 0.2);
}

.delete-button .button-icon {
  color: rgba(255, 77, 79, 0.8);
}

.delete-button:hover .button-icon {
  color: #ff4d4f;
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
:deep(.image-params-popover) {
  background: rgba(26, 26, 46, 0.95) !important;
  backdrop-filter: blur(20px) !important;
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
  border-radius: 16px !important;
  padding: 0 !important;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.4) !important;
  z-index: 2000 !important;
}

/* 确保Element Plus弹窗层级足够高 */
:deep(.el-popper) {
  z-index: 2000 !important;
}

:deep(.el-popper.model-popover),
:deep(.el-popper.image-params-popover) {
  z-index: 2000 !important;
}

/* 全局弹窗样式覆盖 */
:global(.el-popper.model-popover),
:global(.el-popper.image-params-popover) {
  z-index: 2000 !important;
  background: rgba(26, 26, 46, 0.95) !important;
  backdrop-filter: blur(20px) !important;
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
  border-radius: 16px !important;
  padding: 0 !important;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.4) !important;
}

.model-selector,
.image-params-selector {
  padding: 10px;
  min-width: 220px;
  background: rgba(26, 26, 46, 0.98);
  backdrop-filter: blur(20px);
  border-radius: 8px;
}

.image-params-selector {
  min-width: 260px;
}

.selector-header {
  font-size: 12px;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 8px;
  padding-bottom: 6px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  text-align: center;
}

.selector-footer {
  margin-top: 12px;
  padding-top: 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  text-align: center;
}

.done-btn {
  background: linear-gradient(135deg, #4A90E2, #357ABD) !important;
  border: none !important;
  color: #ffffff !important;
  height: 28px !important;
  padding: 0 16px !important;
  border-radius: 14px !important;
  font-size: 11px !important;
  font-weight: 500 !important;
  transition: all 0.3s ease !important;
  min-width: 60px !important;
}

.done-btn:hover {
  transform: translateY(-1px) !important;
  box-shadow: 0 2px 8px rgba(74, 144, 226, 0.4) !important;
}

.model-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.model-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.08);
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid transparent;
  position: relative;
  overflow: hidden;
}

.model-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
  transition: left 0.5s ease;
}

.model-item:hover::before {
  left: 100%;
}

.model-item:hover {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.3);
  transform: translateY(-1px);
}

.model-item.active {
  background: rgba(102, 126, 234, 0.3);
  border-color: #667eea;
  box-shadow: 0 1px 4px rgba(102, 126, 234, 0.2);
}

.model-info {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.model-avatar {
  width: 24px;
  height: 24px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  font-weight: 700;
  font-size: 10px;
  flex-shrink: 0;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.model-details {
  display: flex;
  flex-direction: column;
  gap: 1px;
  flex: 1;
  min-width: 0;
}

.model-name {
  font-size: 12px;
  font-weight: 600;
  color: #ffffff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.model-desc {
  font-size: 9px;
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.2;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

.check-icon {
  color: #667eea;
  font-size: 14px;
  flex-shrink: 0;
}

/* 风格选择器样式 */

/* 比例选择网格 */
.ratio-grid {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 4px;
  margin-bottom: 10px;
}

.ratio-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 4px 2px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.08);
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid transparent;
  position: relative;
  overflow: hidden;
}

.ratio-item:hover {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.3);
  transform: translateY(-1px);
}

.ratio-item.active {
  background: rgba(102, 126, 234, 0.3);
  border-color: #667eea;
  box-shadow: 0 1px 4px rgba(102, 126, 234, 0.2);
}

.ratio-preview {
  width: 14px;
  height: 10px;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 1px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  flex-shrink: 0;
}

.ratio-label {
  font-size: 8px;
  font-weight: 600;
  color: #ffffff;
  white-space: nowrap;
}

/* 分辨率选项 */
.resolution-options {
  display: flex;
  gap: 6px;
  margin-bottom: 10px;
}

.resolution-option {
  flex: 1;
  padding: 6px 8px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.08);
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid transparent;
  text-align: center;
}

.resolution-option:hover {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.3);
}

.resolution-option.active {
  background: rgba(102, 126, 234, 0.3);
  border-color: #667eea;
  color: #ffffff;
}

.resolution-option span {
  font-size: 10px;
  font-weight: 600;
  color: #ffffff;
}

/* 尺寸显示 */
.size-display {
  margin-bottom: 10px;
}

.size-input-group {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.size-label {
  font-size: 10px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.8);
  min-width: 10px;
}

.size-value {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 3px;
  padding: 4px 6px;
  font-size: 10px;
  font-weight: 600;
  color: #ffffff;
  min-width: 35px;
  text-align: center;
}

.size-connector {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.6);
}

.size-unit {
  font-size: 8px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.6);
}

/* 张数选项 */
.count-options {
  display: flex;
  gap: 6px;
}

.count-option {
  flex: 1;
  padding: 6px 8px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.08);
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid transparent;
  text-align: center;
}

.count-option:hover {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.3);
}

.count-option.active {
  background: rgba(102, 126, 234, 0.3);
  border-color: #667eea;
  color: #ffffff;
}

.count-option span {
  font-size: 12px;
  font-weight: 700;
  color: #ffffff;
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
    padding: 0 20px;
    overflow-y: auto;
    overflow-x: hidden;
  }
  
  .page-title {
    font-size: 20px;
    padding: 20px 0 12px 0;
  }
  
  .centered-input-section .input-container {
    max-width: 100%;
  }
  
  .input-top-section {
    flex-direction: column;
    gap: 8px;
    align-items: stretch;
  }
  
  .input-bottom-section {
    flex-direction: column;
    gap: 8px;
    align-items: stretch;
  }
  
  .upload-preview-list {
    gap: 6px;
    padding: 6px;
  }
  
  .upload-preview-item {
    width: 50px;
    height: 50px;
  }
  
  .remove-btn-corner {
    top: -3px !important;
    right: -3px !important;
    width: 16px !important;
    height: 16px !important;
    min-height: 16px !important;
  }
  
  .remove-btn-corner .el-icon {
    font-size: 8px !important;
  }
  
  .params-section {
    justify-content: flex-start;
    gap: 6px;
    flex-wrap: wrap;
  }
  
  .floating-input-panel {
    bottom: 12px;
    width: calc(100% - 20px);
    max-width: 500px;
    left: 50%;
    transform: translateX(-50%);
  }
  
  .floating-input-panel.collapsed {
    transform: translateX(-50%) scale(0.9);
  }
  
  .floating-input-panel.expanded {
    transform: translateX(-50%) scale(1);
  }
  
  .panel-top-section {
    flex-direction: column;
    gap: 8px;
    align-items: stretch;
  }
  
  .panel-bottom-section {
    flex-direction: column;
    gap: 8px;
    align-items: stretch;
  }
  
  .panel-bottom-section .params-section {
    justify-content: center;
    flex-wrap: wrap;
  }
  
  .param-btn {
    font-size: 12px;
    height: 28px;
    padding: 0 10px;
  }
  
  /* 新布局响应式 */
  .results-display {
    padding: 16px 20px 50px 20px;
  }
  
  .generation-card {
    padding: 14px 0;
    gap: 14px;
    margin-bottom: 20px;
  }
  
  .generation-card:last-child {
    margin-bottom: 50px;
  }
  
  .generation-header {
    flex-direction: column;
    gap: 10px;
    margin-bottom: 0;
  }
  
  .generation-thumbnail {
    width: 60px;
    height: 60px;
    align-self: flex-start;
  }
  
  .generation-meta {
    margin: 4px 0;
  }
  
  .generation-images {
    gap: 12px;
  }
  
  .generation-images.count-1 {
    grid-template-columns: 1fr;
    max-width: 300px;
  }
  
  .generation-images.count-2,
  .generation-images.count-3,
  .generation-images.count-4 {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .generation-actions {
    flex-direction: row;
    gap: 10px;
    justify-content: flex-start;
    flex-wrap: wrap;
    padding-top: 10px;
  }
  
  .action-button {
    height: 28px;
    font-size: 12px;
    padding: 0 12px;
    flex: none;
    min-width: auto;
    border-radius: 14px;
  }
  
  .button-icon {
    font-size: 12px;
  }
  
  .results-section {
    padding-bottom: 180px;
  }
  
  .history-sidebar {
    width: 100vw;
    right: -100vw;
  }
  
  .history-toggle {
    right: 16px;
    width: 40px;
    height: 40px;
  }
}

@media (min-width: 769px) and (max-width: 1024px) {
  .main-content {
    padding: 0 30px;
  }
  
  .floating-input-panel {
    width: calc(100% - 60px);
    max-width: 600px;
    left: 50%;
    transform: translateX(-50%);
    bottom: 14px;
  }
  
  .floating-input-panel.collapsed {
    transform: translateX(-50%) scale(0.88);
  }
  
  .floating-input-panel.expanded {
    transform: translateX(-50%) scale(1);
  }
  
  .results-display {
    padding: 18px 30px 55px 30px;
  }
  
  .generation-card {
    padding: 18px 0;
    margin-bottom: 22px;
  }
  
  .generation-card:last-child {
    margin-bottom: 55px;
  }
  
  .generation-images {
    gap: 12px;
  }
  
  .generation-images.count-1 {
    grid-template-columns: 1fr;
    max-width: 350px;
  }
  
  .generation-images.count-2 {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .generation-images.count-3,
  .generation-images.count-4 {
    grid-template-columns: repeat(4, 1fr);
  }
  
  .results-section {
    padding-bottom: 190px;
  }
}

@media (min-width: 1025px) {
  .main-content {
    padding: 0 40px;
  }
  
  .floating-input-panel {
    max-width: 700px;
    left: 50%;
    transform: translateX(-50%);
    bottom: 100px;
  }
  
  .floating-input-panel.collapsed {
    transform: translateX(-50%) scale(0.85);
  }
  
  .floating-input-panel.expanded {
    transform: translateX(-50%) scale(1);
  }
  
  .results-display {
    padding: 20px 40px 60px 40px;
  }
  
  .generation-card {
    padding: 16px 0;
    margin-bottom: 24px;
  }
  
  .generation-card:last-child {
    margin-bottom: 60px;
  }
  
  .generation-images {
    gap: 16px;
  }
  
  .generation-images.count-1 {
    grid-template-columns: 1fr;
    max-width: 400px;
  }
  
  .generation-images.count-2 {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .generation-images.count-3 {
    grid-template-columns: repeat(3, 1fr);
  }
  
  .generation-images.count-4 {
    grid-template-columns: repeat(4, 1fr);
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

/* 主内容区滚动条样式 */
.main-content::-webkit-scrollbar {
  width: 6px;
}

.main-content::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
}

.main-content::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 3px;
}

.main-content::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.5);
}
</style>

<style>
/* 全局样式 - 用于 Element Plus Popover 组件 */
.model-popover,
.size-popover,
.style-popover,
.resolution-popover,
.image-count-popover {
  background: rgba(26, 26, 46, 0.95) !important;
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
  border-radius: 12px !important;
  padding: 0 !important;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.4) !important;
}

.model-popover .el-popover__content,
.size-popover .el-popover__content,
.style-popover .el-popover__content,
.resolution-popover .el-popover__content,
.image-count-popover .el-popover__content {
  padding: 0 !important;
  background: transparent !important;
}

/* 其他下拉框样式 */
.el-dropdown-menu {
  background: rgba(26, 26, 46, 0.95) !important;
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.4) !important;
}

.el-select-dropdown {
  background: rgba(26, 26, 46, 0.95) !important;
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.4) !important;
}
</style>