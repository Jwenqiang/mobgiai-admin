<template>
  <div class="video-generate-container">
    <!-- 测试控制面板 -->
    <div class="test-control-panel">
      <el-button 
        size="small" 
        :type="hasContent ? 'success' : 'info'"
        @click="hasContent = !hasContent"
      >
        {{ hasContent ? '有内容模式' : '无内容模式' }} (点击切换)
      </el-button>
    </div>

    <!-- 主内容区域：已生成内容展示区 -->
    <div class="main-content">
      <!-- 无内容时的居中显示-->
      <div v-if="videoHistory.length === 0" class="empty-content-center">
        <div class="center-panel">
          <!-- 页面头部 -->
          <div class="page-header">
            <div class="header-content">
              <div class="header-icon">
                <div class="icon-wrapper">
                  <el-icon class="main-icon"><VideoCamera /></el-icon>
                </div>
              </div>
              <h1 class="header-title">视频生成</h1>
            </div>
          </div>
          
          <!-- 统一的生成器面板 -->
          <div class="generator-panel">
            <!-- 上半部分：左右布局 - 上传区域和提示词 -->
            <div class="generator-top-section">
              <!-- 左侧：首帧图和尾帧图上传区域 -->
              <div class="generator-upload-section">
                <div class="upload-item">
                  <label class="upload-label">首帧图</label>
                  <el-upload
                    :show-file-list="false"
                    :before-upload="handleFirstFrameUpload"
                    accept="image/*"
                    class="frame-uploader"
                  >
                    <div class="upload-area" :class="{ 'has-image': firstFrameImage }">
                      <img v-if="firstFrameImage" :src="firstFrameImage" class="uploaded-image" />
                      <div v-else class="upload-placeholder">
                        <el-icon size="20"><Plus /></el-icon>
                      </div>
                    </div>
                  </el-upload>
                </div>
                
                <div class="arrow-section">
                  <el-button 
                    class="swap-button" 
                    @click="swapFrameImages"
                    :disabled="!firstFrameImage && !lastFrameImage"
                  >
                    <el-icon><Switch /></el-icon>
                  </el-button>
                </div>
                
                <div class="upload-item">
                  <label class="upload-label">尾帧图</label>
                  <el-upload
                    :show-file-list="false"
                    :before-upload="handleLastFrameUpload"
                    accept="image/*"
                    class="frame-uploader"
                  >
                    <div class="upload-area" :class="{ 'has-image': lastFrameImage }">
                      <img v-if="lastFrameImage" :src="lastFrameImage" class="uploaded-image" />
                      <div v-else class="upload-placeholder">
                        <el-icon size="20"><Plus /></el-icon>
                      </div>
                    </div>
                  </el-upload>
                </div>
              </div>

              <!-- 右侧：提示词输入区域 -->
              <div class="generator-prompt-section">
                <el-input
                  v-model="prompt"
                  type="textarea"
                  :rows="3"
                  placeholder="这是一段用于生成视频的提示词说明，它的主要作用是为视频生成模型提供明确的内容指引，使系统能够根据描述文本准确构建动态画面与场景呈现。在实际使用过程中，这类提示词需要涵盖多个维度的要素，如作品主题、角色设定、场景环境、光影效果、镜头运动等，通过HTML标记在生成视频时能够更好地理解和执行创作者的意图，适应用户需求，完善的提示词，用户不仅可以提升作品的一致性，也能更好地实现预期的视觉效果。"
                  class="generator-prompt-textarea"
                />
              </div>
            </div>

            <!-- 底部：配置选项和生成按钮-->
            <div class="generator-controls-section">
              <div class="generator-config-section">
                <!-- 视频生成 -->
                <el-button class="config-btn">
                  <el-icon><VideoCamera /></el-icon>
                  视频生成
                  <el-icon class="el-icon--right"><ArrowDown /></el-icon>
                </el-button>
                
                <!-- 视频生成模型 -->
                <el-popover
                  ref="modelPopoverRef"
                  placement="top"
                  :width="380"
                  trigger="click"
                  popper-class="model-popover"
                  :teleported="true"
                >
                  <template #reference>
                    <el-button class="config-btn model-btn">
                      <div class="model-icon">
                        <div class="icon-circle" :style="{ background: getCurrentVideoModel().color }"></div>
                      </div>
                      {{ getCurrentVideoModel().label }}
                      <el-icon class="el-icon--right"><ArrowDown /></el-icon>
                    </el-button>
                  </template>
                  <div class="model-selector">
                    <div class="selector-header">选择模型</div>
                    <div class="model-list">
                      <div 
                        v-for="model in videoModels" 
                        :key="model.value"
                        class="model-item"
                        :class="{ active: selectedModel === model.value }"
                        @click="selectVideoModel(model)"
                      >
                        <div class="model-info">
                          <div class="model-icon">
                            <div class="icon-circle" :style="{ background: model.color }"></div>
                          </div>
                          <div class="model-details">
                            <div class="model-name">{{ model.label }}</div>
                            <div class="model-desc">{{ model.description }}</div>
                          </div>
                        </div>
                        <div v-if="selectedModel === model.value" class="check-icon">
                          <el-icon><Check /></el-icon>
                        </div>
                      </div>
                    </div>
                  </div>
                </el-popover>

                <!-- 配置面板 -->
                <el-popover
                  ref="configPopoverRef"
                  placement="top"
                  :width="400"
                  trigger="click"
                  popper-class="config-popover"
                  :teleported="true"
                >
                  <template #reference>
                    <el-button class="config-btn config-summary-btn">
                      <el-icon><Setting /></el-icon>
                      {{ getConfigSummary() }}
                      <el-icon class="el-icon--right"><ArrowDown /></el-icon>
                    </el-button>
                  </template>
                  <div class="config-panel">
                    <div class="config-group">
                      <div class="config-title">同时生成声音</div>
                      <div class="audio-options">
                        <el-button 
                          :class="['audio-btn', { active: enableAudio }]"
                          @click="selectAudio(true)"
                        >
                          开启
                        </el-button>
                        <el-button 
                          :class="['audio-btn', { active: !enableAudio }]"
                          @click="selectAudio(false)"
                        >
                          关闭
                        </el-button>
                      </div>
                    </div>

                    <div class="config-group">
                      <div class="config-title">选择比例</div>
                      <div class="ratio-grid">
                        <div 
                          v-for="ratio in videoRatios" 
                          :key="ratio.value"
                          class="ratio-item"
                          :class="{ active: selectedRatio === ratio.value }"
                          @click="selectRatio(ratio)"
                        >
                          <div class="ratio-preview" :style="{ aspectRatio: ratio.aspect }"></div>
                          <div class="ratio-label">{{ ratio.label }}</div>
                        </div>
                      </div>
                    </div>

                    <div class="config-group">
                      <div class="config-title">选择分辨率</div>
                      <div class="quality-options">
                        <el-button 
                          v-for="quality in videoQualities"
                          :key="quality.value"
                          :class="['quality-btn', { active: selectedQuality === quality.value }]"
                          @click="selectQuality(quality)"
                        >
                          {{ quality.label }}
                        </el-button>
                      </div>
                    </div>

                    <div class="config-group">
                      <div class="config-title">选择时长</div>
                      <div class="duration-options">
                        <el-button 
                          v-for="duration in videoDurations"
                          :key="duration.value"
                          :class="['duration-btn', { active: selectedDuration === duration.value }]"
                          @click="selectDuration(duration)"
                        >
                          {{ duration.label }}
                        </el-button>
                      </div>
                    </div>
                  </div>
                </el-popover>
              </div>

              <!-- 生成按钮 -->
              <div class="generator-generate-section">
                <el-button 
                  type="primary" 
                  size="large"
                  :loading="generating"
                  :disabled="!prompt.trim()"
                  @click="handleGenerate"
                  class="generator-generate-button"
                >
                  <el-icon><VideoCamera /></el-icon>
                  生成
                  <span class="cost-badge">20</span>
                </el-button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 有内容时的视频列表-->
      <div v-else class="video-list">
        <div class="video-cards">
          <div 
            v-for="item in videoHistory" 
            :key="item.id"
            class="video-card"
          >
            <div class="video-preview-section">
              <div class="video-player">
                <video 
                  :src="item.url" 
                  :poster="item.thumbnail"
                  controls
                  class="video-element"
                />
                <div class="video-duration-overlay">{{ item.duration }}s</div>
              </div>
              
              <!-- 操作按钮 -->
              <div class="video-actions">
                <el-button size="small" @click="editVideo(item)">
                  <el-icon><Edit /></el-icon>
                  重新编辑
                </el-button>
                <el-button size="small" @click="regenerateVideo(item)">
                  <el-icon><Refresh /></el-icon>
                  再次生成
                </el-button>
                <el-dropdown @command="(cmd) => handleVideoAction(cmd, item)">
                  <el-button size="small">
                    <el-icon><More /></el-icon>
                    更多选项
                  </el-button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item command="download">
                        <el-icon><Download /></el-icon>
                        下载视频
                      </el-dropdown-item>
                      <el-dropdown-item command="save">
                        <el-icon><FolderAdd /></el-icon>
                        保存到资产
                      </el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>
            </div>
            
            <!-- 视频参数说明 -->
            <div class="video-params-section">
              <div class="param-item">
                <span class="param-label">提示词：</span>
                <span class="param-value">{{ item.prompt }}</span>
              </div>
              <div class="param-row">
                <div class="param-item">
                  <span class="param-label">模型：</span>
                  <span class="param-value highlight">{{ item.model }}</span>
                </div>
                <div class="param-item">
                  <span class="param-label">画质：</span>
                  <span class="param-value">{{ item.quality }}</span>
                </div>
                <div class="param-item">
                  <span class="param-label">时长：</span>
                  <span class="param-value">{{ item.duration }}s</span>
                </div>
              </div>
              <div class="param-item">
                <span class="param-label">创建时间：</span>
                <span class="param-value">{{ formatTime(item.createdAt) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部悬浮：新视频生成操作区（仅在有内容时显示）-->
    <div v-if="videoHistory.length > 0" class="floating-generation-panel">
      <div class="generator-panel">
        <!-- 上半部分：左右布局 - 上传区域和提示词 -->
        <div class="generator-top-section">
          <!-- 左侧：首帧图和尾帧图上传区域 -->
          <div class="generator-upload-section">
            <div class="upload-item">
              <label class="upload-label">首帧图</label>
              <el-upload
                :show-file-list="false"
                :before-upload="handleFirstFrameUpload"
                accept="image/*"
                class="frame-uploader"
              >
                <div class="upload-area" :class="{ 'has-image': firstFrameImage }">
                  <img v-if="firstFrameImage" :src="firstFrameImage" class="uploaded-image" />
                  <div v-else class="upload-placeholder">
                    <el-icon size="20"><Plus /></el-icon>
                  </div>
                </div>
              </el-upload>
            </div>
            
            <div class="arrow-section">
              <el-button 
                class="swap-button" 
                @click="swapFrameImages"
                :disabled="!firstFrameImage && !lastFrameImage"
              >
                <el-icon><Switch /></el-icon>
              </el-button>
            </div>
            
            <div class="upload-item">
              <label class="upload-label">尾帧图</label>
              <el-upload
                :show-file-list="false"
                :before-upload="handleLastFrameUpload"
                accept="image/*"
                class="frame-uploader"
              >
                <div class="upload-area" :class="{ 'has-image': lastFrameImage }">
                  <img v-if="lastFrameImage" :src="lastFrameImage" class="uploaded-image" />
                  <div v-else class="upload-placeholder">
                    <el-icon size="20"><Plus /></el-icon>
                  </div>
                </div>
              </el-upload>
            </div>
          </div>

          <!-- 右侧：提示词输入区域 -->
          <div class="generator-prompt-section">
            <el-input
              v-model="prompt"
              type="textarea"
              :rows="3"
              placeholder="这是一段用于生成视频的提示词说明，它的主要作用是为视频生成模型提供明确的内容指引，使系统能够根据描述文本准确构建动态画面与场景呈现。在实际使用过程中，这类提示词需要涵盖多个维度的要素，如作品主题、角色设定、场景环境、光影效果、镜头运动等，通过HTML标记在生成视频时能够更好地理解和执行创作者的意图，适应用户需求，完善的提示词，用户不仅可以提升作品的一致性，也能更好地实现预期的视觉效果。"
              class="generator-prompt-textarea"
            />
          </div>
        </div>

        <!-- 底部：配置选项和生成按钮-->
        <div class="generator-controls-section">
          <div class="generator-config-section">
            <!-- 视频生成 -->
            <el-button class="config-btn">
              <el-icon><VideoCamera /></el-icon>
              视频生成
              <el-icon class="el-icon--right"><ArrowDown /></el-icon>
            </el-button>
            
            <!-- 视频生成模型 -->
            <el-popover
              ref="modelPopoverRef2"
              placement="top"
              :width="380"
              trigger="click"
              popper-class="model-popover"
              :teleported="true"
            >
              <template #reference>
                <el-button class="config-btn model-btn">
                  <div class="model-icon">
                    <div class="icon-circle" :style="{ background: getCurrentVideoModel().color }"></div>
                  </div>
                  {{ getCurrentVideoModel().label }}
                  <el-icon class="el-icon--right"><ArrowDown /></el-icon>
                </el-button>
              </template>
              <div class="model-selector">
                <div class="selector-header">选择模型</div>
                <div class="model-list">
                  <div 
                    v-for="model in videoModels" 
                    :key="model.value"
                    class="model-item"
                    :class="{ active: selectedModel === model.value }"
                    @click="selectVideoModel(model)"
                  >
                    <div class="model-info">
                      <div class="model-icon">
                        <div class="icon-circle" :style="{ background: model.color }"></div>
                      </div>
                      <div class="model-details">
                        <div class="model-name">{{ model.label }}</div>
                        <div class="model-desc">{{ model.description }}</div>
                      </div>
                    </div>
                    <div v-if="selectedModel === model.value" class="check-icon">
                      <el-icon><Check /></el-icon>
                    </div>
                  </div>
                </div>
              </div>
            </el-popover>

            <!-- 配置面板 -->
            <el-popover
              ref="configPopoverRef2"
              placement="top"
              :width="400"
              trigger="click"
              popper-class="config-popover"
              :teleported="true"
            >
              <template #reference>
                <el-button class="config-btn config-summary-btn">
                  <el-icon><Setting /></el-icon>
                  {{ getConfigSummary() }}
                  <el-icon class="el-icon--right"><ArrowDown /></el-icon>
                </el-button>
              </template>
              <div class="config-panel">
                <div class="config-group">
                  <div class="config-title">同时生成声音</div>
                  <div class="audio-options">
                    <el-button 
                      :class="['audio-btn', { active: enableAudio }]"
                      @click="selectAudio(true)"
                    >
                      开启
                    </el-button>
                    <el-button 
                      :class="['audio-btn', { active: !enableAudio }]"
                      @click="selectAudio(false)"
                    >
                      关闭
                    </el-button>
                  </div>
                </div>

                <div class="config-group">
                  <div class="config-title">选择比例</div>
                  <div class="ratio-grid">
                    <div 
                      v-for="ratio in videoRatios" 
                      :key="ratio.value"
                      class="ratio-item"
                      :class="{ active: selectedRatio === ratio.value }"
                      @click="selectRatio(ratio)"
                    >
                      <div class="ratio-preview" :style="{ aspectRatio: ratio.aspect }"></div>
                      <div class="ratio-label">{{ ratio.label }}</div>
                    </div>
                  </div>
                </div>

                <div class="config-group">
                  <div class="config-title">选择分辨率</div>
                  <div class="quality-options">
                    <el-button 
                      v-for="quality in videoQualities"
                      :key="quality.value"
                      :class="['quality-btn', { active: selectedQuality === quality.value }]"
                      @click="selectQuality(quality)"
                    >
                      {{ quality.label }}
                    </el-button>
                  </div>
                </div>

                <div class="config-group">
                  <div class="config-title">选择时长</div>
                  <div class="duration-options">
                    <el-button 
                      v-for="duration in videoDurations"
                      :key="duration.value"
                      :class="['duration-btn', { active: selectedDuration === duration.value }]"
                      @click="selectDuration(duration)"
                    >
                      {{ duration.label }}
                    </el-button>
                  </div>
                </div>
              </div>
            </el-popover>
          </div>

          <!-- 生成按钮 -->
          <div class="generator-generate-section">
            <el-button 
              type="primary" 
              size="large"
              :loading="generating"
              :disabled="!prompt.trim()"
              @click="handleGenerate"
              class="generator-generate-button"
            >
              <el-icon><VideoCamera /></el-icon>
              生成
              <span class="cost-badge">20</span>
            </el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 生成进度遮罩 - 即梦风格 -->
    <div v-if="generating" class="generating-overlay">
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
          <p class="generating-desc">AI 正在为您精心创作视频，请稍候...</p>
          <div class="progress-steps">
            <div class="step" :class="{ active: generateProgress >= 20, completed: generateProgress > 20 }">
              <div class="step-dot"></div>
              <span>分析描述</span>
            </div>
            <div class="step" :class="{ active: generateProgress >= 40, completed: generateProgress > 40 }">
              <div class="step-dot"></div>
              <span>生成帧序列</span>
            </div>
            <div class="step" :class="{ active: generateProgress >= 60, completed: generateProgress > 60 }">
              <div class="step-dot"></div>
              <span>渲染视频</span>
            </div>
            <div class="step" :class="{ active: generateProgress >= 80, completed: generateProgress > 80 }">
              <div class="step-dot"></div>
              <span>优化画质</span>
            </div>
            <div class="step" :class="{ active: generateProgress >= 100, completed: generateProgress >= 100 }">
              <div class="step-dot"></div>
              <span>完成</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  VideoCamera, Download, FolderAdd, Refresh, Edit, More, Plus, Switch, Check, Setting, ArrowDown, ArrowUp
} from '@element-plus/icons-vue'

interface VideoResult {
  id: string
  prompt: string
  url: string
  thumbnail: string
  model: string
  quality: string
  duration: string
  createdAt: number
}

interface Option {
  value: string
  label: string
  description?: string
  color?: string
  aspect?: string
}

// 响应式数据
const prompt = ref('在一个充满未来科技感的城市中，一个机器人正在街道上行走，周围是高耸的摩天大楼和闪烁的霓虹灯。机器人的设计非常精致，具有流线型的外观和发光的蓝色细节。街道上还有其他机器人和飞行汽车，营造出一种繁忙而先进的氛围。整个场景应该具有电影般的质感，色彩鲜艳，光影效果丰富。')
const generating = ref(false)
const generateProgress = ref(0)
const progressText = ref('')

// Popover 引用
const modelPopoverRef = ref()
const configPopoverRef = ref()
const modelPopoverRef2 = ref()
const configPopoverRef2 = ref()

// 上传的帧图片
const firstFrameImage = ref('')
const lastFrameImage = ref('')

// 配置选项
const selectedModel = ref('seedance-1.5-pro')
const enableAudio = ref(false)
const selectedQuality = ref('720p')
const selectedDuration = ref('5')
const selectedRatio = ref('smart')

// 选项数据
const videoModels = ref<Option[]>([
  { 
    value: 'seedance-1.5-pro', 
    label: 'Seedance 1.5 Pro',
    description: '高质量图像，全新体验',
    color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  },
  { 
    value: 'seedance-1.0-pro', 
    label: 'Seedance 1.0 Pro',
    description: '效果稳定，超清画质',
    color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  },
  { 
    value: 'runway-gen3', 
    label: 'Runway Gen-3',
    description: '专业视频生成模型',
    color: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
  },
  { 
    value: 'pika-1.5', 
    label: 'Pika 1.5',
    description: '创意视频生成',
    color: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'
  }
])

const videoRatios = ref<Option[]>([
  { value: 'smart', label: '智能比例', aspect: '1' },
  { value: '21:9', label: '21:9', aspect: '21/9' },
  { value: '16:9', label: '16:9', aspect: '16/9' },
  { value: '4:3', label: '4:3', aspect: '4/3' },
  { value: '1:1', label: '1:1', aspect: '1' },
  { value: '3:4', label: '3:4', aspect: '3/4' },
  { value: '9:16', label: '9:16', aspect: '9/16' }
])

const videoQualities = ref<Option[]>([
  { value: '480p', label: '480P', description: '标清画质，文件较小' },
  { value: '720p', label: '720P', description: '高清画质，平衡效果' },
  { value: '1080p', label: '1080P', description: '全高清，细节丰富' },
  { value: '4k', label: '4K', description: '超高清，极致画质' }
])

const videoDurations = ref<Option[]>([
  { value: '5', label: '5s', description: '标准时长，适合展示' },
  { value: '10', label: '10s', description: '中等时长，内容丰富' },
  { value: '15', label: '15s', description: '长视频，详细展现' },
  { value: '12', label: '12s', description: '自定义时长' }
])

// 测试控制变量 - 可以通过修改这个值来测试有无内容的状态
const hasContent = ref(false) // 改为 true 可以测试有内容的状态

// 测试数据
const testVideoData = [
  {
    id: '1',
    prompt: '在一个充满未来科技感的城市中，一个机器人正在街道上行走',
    url: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
    thumbnail: 'https://picsum.photos/400/300?random=1',
    model: 'Seedance 1.5 Pro',
    quality: '720P',
    duration: '5',
    createdAt: Date.now() - 1000 * 60 * 30
  },
  {
    id: '2',
    prompt: '一只可爱的小猫在花园里玩耍，阳光透过树叶洒在地面上',
    url: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_2mb.mp4',
    thumbnail: 'https://picsum.photos/400/300?random=2',
    model: 'Runway Gen-3',
    quality: '1080P',
    duration: '10',
    createdAt: Date.now() - 1000 * 60 * 60
  }
]

// 视频历史记录 - 根据 hasContent 变量动态控制
const videoHistory = ref<VideoResult[]>([])

// 监听 hasContent 变化，动态更新videoHistory
watch(hasContent, (newValue) => {
  if (newValue) {
    videoHistory.value = [...testVideoData]
  } else {
    videoHistory.value = []
  }
}, { immediate: true })

// 方法
const getCurrentVideoModel = () => {
  return videoModels.value.find(m => m.value === selectedModel.value) || videoModels.value[0] || {
    value: 'default',
    label: '默认模型',
    description: '默认视频生成模型',
    color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  }
}

const selectVideoModel = (model: Option) => {
  selectedModel.value = model.value
  // 关闭 Popover
  modelPopoverRef.value?.hide()
  modelPopoverRef2.value?.hide()
}

const selectAudio = (enabled: boolean) => {
  enableAudio.value = enabled
}

const selectRatio = (ratio: Option) => {
  selectedRatio.value = ratio.value
}

const selectQuality = (quality: Option) => {
  selectedQuality.value = quality.value
}

const selectDuration = (duration: Option) => {
  selectedDuration.value = duration.value
}

// 生成配置摘要文本
const getConfigSummary = () => {
  const audioText = enableAudio.value ? '有声' : '无声'
  const ratioText = videoRatios.value.find(r => r.value === selectedRatio.value)?.label || '16:9'
  const qualityText = videoQualities.value.find(q => q.value === selectedQuality.value)?.label || '720P'
  const durationText = videoDurations.value.find(d => d.value === selectedDuration.value)?.label || '5s'
  
  return `${audioText} | ${ratioText} | ${qualityText} | ${durationText}`
}

// 获取比例标签
const getRatioLabel = () => {
  return videoRatios.value.find(r => r.value === selectedRatio.value)?.label || '智能比例'
}

// 获取分辨率标签
const getQualityLabel = () => {
  return videoQualities.value.find(q => q.value === selectedQuality.value)?.label || '720P'
}

// 获取时长标签
const getDurationLabel = () => {
  return videoDurations.value.find(d => d.value === selectedDuration.value)?.label || '5s'
}

const handleGenerate = async () => {
  if (!prompt.value.trim()) {
    ElMessage.warning('请输入视频描述')
    return
  }

  generating.value = true
  generateProgress.value = 0

  // 模拟生成过程
  const steps = [
    { progress: 20, text: '正在分析您的描述...' },
    { progress: 40, text: '正在生成帧序列...' },
    { progress: 60, text: '正在渲染视频...' },
    { progress: 80, text: '正在优化画质...' },
    { progress: 100, text: '生成完成！' }
  ]

  for (const step of steps) {
    await new Promise(resolve => setTimeout(resolve, 2000))
    generateProgress.value = step.progress
    progressText.value = step.text
  }

  // 生成完成，添加到历史记录
  const newVideo: VideoResult = {
    id: Date.now().toString(),
    prompt: prompt.value,
    url: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
    thumbnail: 'https://picsum.photos/400/300?random=' + Date.now(),
    model: videoModels.value.find(m => m.value === selectedModel.value)?.label || 'Seedance 1.5 Pro',
    quality: videoQualities.value.find(q => q.value === selectedQuality.value)?.label || '720P',
    duration: selectedDuration.value,
    createdAt: Date.now()
  }

  videoHistory.value.unshift(newVideo)
  generating.value = false
  
  // 清空输入框和上传的图片
  prompt.value = ''
  firstFrameImage.value = ''
  lastFrameImage.value = ''
  
  ElMessage.success('视频生成成功！')
}

const editVideo = (video: VideoResult) => {
  prompt.value = video.prompt
  ElMessage.info('已加载视频参数，您可以修改后重新生成')
}

const regenerateVideo = async (video: VideoResult) => {
  const result = await ElMessageBox.confirm(
    '确定要重新生成这个视频吗？',
    '确认操作',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).catch(() => false)

  if (result) {
    prompt.value = video.prompt
    handleGenerate()
  }
}

const handleVideoAction = (command: string, video: VideoResult) => {
  switch (command) {
    case 'download':
      downloadVideo(video)
      break
    case 'save':
      saveToAssets(video)
      break
  }
}

const downloadVideo = (video: VideoResult) => {
  const link = document.createElement('a')
  link.href = video.url
  link.download = `generated_video_${video.id}.mp4`
  link.click()
  ElMessage.success('开始下载视频')
}

const saveToAssets = (video: VideoResult) => {
  console.log('Saving video to assets:', video.id)
  ElMessage.success('视频已保存到资产库')
}

const handleFirstFrameUpload = (file: File) => {
  const reader = new FileReader()
  reader.onload = (e) => {
    firstFrameImage.value = e.target?.result as string
  }
  reader.readAsDataURL(file)
  return false // 阻止自动上传
}

const handleLastFrameUpload = (file: File) => {
  const reader = new FileReader()
  reader.onload = (e) => {
    lastFrameImage.value = e.target?.result as string
  }
  reader.readAsDataURL(file)
  return false // 阻止自动上传
}

const swapFrameImages = () => {
  const temp = firstFrameImage.value
  firstFrameImage.value = lastFrameImage.value
  lastFrameImage.value = temp
  ElMessage.success('首帧图和尾帧图已交换')
}

const formatTime = (timestamp: number) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  
  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  
  if (minutes < 60) {
    return `${minutes}分钟前`
  } else if (hours < 24) {
    return `${hours}小时前`
  } else if (days < 7) {
    return `${days}天前`
  } else {
    return date.toLocaleDateString('zh-CN')
  }
}
</script>
<style scoped>
.video-generate-container {
  height: 100vh;
  background: #0a0a0a;
  color: #ffffff;
  position: relative;
  overflow: hidden;
}

.video-generate-container::before {
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

/* 测试控制面板 */
.test-control-panel {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
  background: rgba(0, 0, 0, 0.8);
  padding: 8px 12px;
  border-radius: 8px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

/* 页面头部 - 即梦风格 */
.page-header {
  text-align: center;
  margin-bottom: 24px;
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
  color: #4A90E2;
  z-index: 1;
}

.header-title {
  font-size: 32px;
  font-weight: 600;
  margin: 0;
  color: #ffffff;
}

.header-subtitle {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.8);
  margin: 0;
  font-weight: 400;
  line-height: 1.5;
}

/* 主布局 */
.main-content {
  height: 100vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  position: relative;
}

/* 无内容时的居中显�?*/
.empty-content-center {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  position: relative;
  z-index: 1;
}

.center-panel {
  background: rgba(30, 30, 40, 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 32px;
  width: 90%;
  max-width: 900px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  position: relative;
  overflow: hidden;
  margin: 0 auto;
}

.center-panel::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.5), transparent);
}

/* 创作面板 */
.creation-panel {
  background: rgba(26, 26, 36, 0.8);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 24px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  margin-top: 24px;
  position: relative;
  overflow: hidden;
  width: 100%;
}

/* 统一的生成器面板样式 */
.generator-panel {
  background: rgba(26, 26, 46, 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 16px;
  padding: 16px 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  margin-top: 24px;
}

/* 当在居中模式时，调整生成器面板的样式 */
.empty-content-center .generator-panel {
  background: rgba(26, 26, 36, 0.8);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 24px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  margin-top: 24px;
  position: relative;
  overflow: hidden;
  width: 100%;
  box-shadow: none;
}

.empty-content-center .generator-panel::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
}





.upload-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.upload-label {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.7);
  text-align: center;
  font-weight: 500;
  margin-bottom: 4px;
}







.config-summary-display:hover {
  background: rgba(80, 80, 90, 0.7);
  border-color: rgba(255, 255, 255, 0.15);
  color: rgba(255, 255, 255, 0.9);
}

.config-summary-display .divider {
  color: rgba(255, 255, 255, 0.3);
  margin: 0 4px;
}

.arrow-up-icon {
  margin-left: 8px;
  color: rgba(255, 255, 255, 0.6);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.arrow-up-icon:hover {
  color: #4A90E2;
  transform: translateY(-2px);
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

/* 主内容区域：已生成内容展示区 */
.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.05);
  flex-shrink: 0;
}

.section-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.video-list {
  flex: 1;
  overflow-y: auto;
  padding: 16px 20px 140px 20px; /* 底部留出悬浮面板空间 */
}

/* 空状�?*/
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: calc(100vh - 200px);
  color: rgba(255, 255, 255, 0.6);
  text-align: center;
}

.empty-icon {
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-text {
  font-size: 16px;
  margin: 0;
  max-width: 400px;
  line-height: 1.5;
}

/* 视频卡片 */
.video-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
  max-width: 100%;
}

.video-card {
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  height: fit-content;
}

.video-card:hover {
  background: rgba(255, 255, 255, 0.12);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
}

.video-preview-section {
  margin-bottom: 12px;
}

.video-player {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 10px;
  aspect-ratio: 16/9;
}

.video-element {
  width: 100%;
  height: 100%;
  object-fit: cover;
  background: #000;
}

.video-duration-overlay {
  position: absolute;
  bottom: 6px;
  right: 6px;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
}

.video-actions {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  justify-content: flex-start;
}

.video-actions .el-button {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #ffffff;
  font-size: 11px;
  height: 28px;
  padding: 0 10px;
  border-radius: 6px;
}

.video-actions .el-button:hover {
  background: rgba(74, 144, 226, 0.2);
  border-color: #4A90E2;
}

/* 视频参数说明 */
.video-params-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 12px;
}

.param-item {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  line-height: 1.4;
}

.param-row {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 8px;
  margin: 4px 0;
}

.param-row .param-item {
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.param-label {
  color: rgba(255, 255, 255, 0.7);
  font-weight: 500;
  flex-shrink: 0;
  font-size: 11px;
}

.param-value {
  color: #ffffff;
  flex: 1;
  word-break: break-word;
  font-size: 12px;
  line-height: 1.3;
}

.param-value.highlight {
  color: #4A90E2;
  font-weight: 600;
}

/* 底部悬浮：新视频生成操作�?*/
.floating-generation-panel {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;
  width: calc(100% - 80px);
  max-width: 900px;
}

.floating-generation-panel .generator-panel {
  background: rgba(26, 26, 46, 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 16px;
  padding: 16px 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}

/* 生成面板布局样式 */
.generator-top-section {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  margin-bottom: 16px;
}

.generator-upload-section {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.generator-prompt-section {
  flex: 1;
  min-width: 0;
}

.generator-prompt-textarea :deep(.el-textarea__inner) {
  background: rgba(40, 40, 50, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.8);
  font-size: 13px;
  line-height: 1.5;
  resize: none;
  border-radius: 8px;
  padding: 12px;
}

.generator-prompt-textarea :deep(.el-textarea__inner)::placeholder {
  color: rgba(255, 255, 255, 0.4);
  font-size: 13px;
}

.generator-prompt-textarea :deep(.el-textarea__inner):focus {
  border-color: rgba(74, 144, 226, 0.5);
  background: rgba(50, 50, 60, 0.8);
  box-shadow: 0 0 0 2px rgba(74, 144, 226, 0.1);
}

.generator-controls-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.generator-config-section {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  flex: 1;
}

.generator-generate-section {
  flex-shrink: 0;
}

.generator-generate-button {
  height: 40px;
  padding: 0 24px;
  background: #4A90E2;
  border: none;
  color: #ffffff;
  font-size: 14px;
  font-weight: 600;
  border-radius: 8px;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
}

.generator-generate-button:hover:not(:disabled) {
  background: #357ABD;
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(74, 144, 226, 0.4);
}

.generator-generate-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.generator-generate-button .cost-badge {
  background: rgba(255, 255, 255, 0.2);
  color: #ffffff;
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 10px;
  margin-left: 4px;
}

.upload-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.upload-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
  text-align: center;
}

.upload-area {
  width: 60px;
  height: 60px;
  border: 2px dashed rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.upload-area:hover {
  border-color: #4A90E2;
  background: rgba(74, 144, 226, 0.1);
}

.upload-area.has-image {
  border-style: solid;
  border-color: #4A90E2;
}

.uploaded-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.upload-placeholder {
  color: rgba(255, 255, 255, 0.6);
}

.arrow-section {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 8px;
}

.swap-button {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.8);
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  transition: all 0.3s ease;
}

.swap-button:hover:not(:disabled) {
  background: rgba(74, 144, 226, 0.2);
  border-color: #4A90E2;
  color: #4A90E2;
  transform: rotate(180deg);
}

.swap-button:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

/* 右侧：提示词区域 */
.prompt-section {
  flex: 1;
}

.prompt-textarea :deep(.el-textarea__inner) {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #ffffff;
  border-radius: 8px;
  font-size: 13px;
  line-height: 1.4;
  resize: none;
  min-height: 80px;
}

.prompt-textarea :deep(.el-textarea__inner)::placeholder {
  color: rgba(255, 255, 255, 0.4);
  font-size: 12px;
}

.prompt-textarea :deep(.el-textarea__inner):focus {
  border-color: #4A90E2;
  box-shadow: 0 0 0 2px rgba(74, 144, 226, 0.2);
}

/* 控制区域：配置选项和生成按�?*/
.controls-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

/* 选择器样�?- 即梦风格 */
:deep(.model-popover),
:deep(.config-popover) {
  background: rgba(255, 255, 255, 0.1) !important;
  backdrop-filter: blur(20px) !important;
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
  border-radius: 16px !important;
  padding: 0 !important;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.2) !important;
  z-index: 99999 !important;
}

.model-selector,
.config-panel {
  padding: 24px;
  min-width: 400px;
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

.model-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.model-item {
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
  min-height: 70px;
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
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
}

.model-item.active {
  background: rgba(102, 126, 234, 0.2);
  border-color: #667eea;
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.2);
}

.model-info {
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

.model-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  min-width: 0;
}

.model-name {
  font-size: 16px;
  font-weight: 600;
  color: #ffffff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.model-desc {
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

/* 配置面板样式 */
.config-group {
  margin-bottom: 24px;
}

.config-group:last-child {
  margin-bottom: 0;
}

.config-title {
  font-size: 16px;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.audio-options {
  display: flex;
  gap: 12px;
}

.audio-btn {
  flex: 1;
  height: 40px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.8);
  border-radius: 12px;
  font-size: 14px;
  transition: all 0.3s ease;
  font-weight: 500;
}

.audio-btn.active {
  background: rgba(102, 126, 234, 0.2);
  border-color: #667eea;
  color: #667eea;
  font-weight: 600;
}

.ratio-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.ratio-item {
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

.ratio-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
  transition: left 0.5s ease;
}

.ratio-item:hover::before {
  left: 100%;
}

.ratio-item:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
}

.ratio-item.active {
  background: rgba(102, 126, 234, 0.2);
  border-color: #667eea;
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.2);
}

.ratio-preview {
  width: 32px;
  height: 24px;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 4px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.ratio-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
  white-space: nowrap;
  font-weight: 500;
}

.quality-options,
.duration-options {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.quality-btn,
.duration-btn {
  height: 36px;
  padding: 0 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.8);
  border-radius: 8px;
  font-size: 13px;
  transition: all 0.3s ease;
  white-space: nowrap;
  min-width: 60px;
  font-weight: 500;
}

.quality-btn.active,
.duration-btn.active {
  background: rgba(102, 126, 234, 0.2);
  border-color: #667eea;
  color: #667eea;
  font-weight: 600;
}

/* 配置区域 */
.config-section {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  flex-wrap: wrap;
}

.config-btn {
  background: rgba(80, 80, 80, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #ffffff;
  height: 32px;
  padding: 0 12px;
  border-radius: 16px;
  font-size: 12px;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
}

.config-btn:hover {
  background: rgba(74, 144, 226, 0.3);
  border-color: #4A90E2;
}

.config-btn .model-icon {
  display: flex;
  align-items: center;
}

.config-btn .icon-circle {
  width: 14px;
  height: 14px;
  border-radius: 50%;
}

/* 配置摘要按钮特殊样式 */
.config-summary-btn {
  min-width: 180px;
  max-width: 220px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  justify-content: space-between;
}

.config-summary-btn .el-icon--right {
  margin-left: auto;
  flex-shrink: 0;
}

/* 配置面板样式 */
:deep(.config-popover) {
  background: rgba(60, 60, 60, 0.95) !important;
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  border-radius: 12px !important;
  padding: 0 !important;
  z-index: 99999 !important;
}

.config-panel {
  padding: 16px;
}

.config-group {
  margin-bottom: 20px;
}

.config-group:last-child {
  margin-bottom: 0;
}

.config-title {
  font-size: 15px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 12px;
  padding-bottom: 4px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.audio-options {
  display: flex;
  gap: 10px;
}

.audio-btn {
  flex: 1;
  height: 36px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.8);
  border-radius: 8px;
  font-size: 13px;
  transition: all 0.3s ease;
  font-weight: 500;
}

.audio-btn.active {
  background: rgba(74, 144, 226, 0.25);
  border-color: #4A90E2;
  color: #4A90E2;
  font-weight: 600;
}

.ratio-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.ratio-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 12px 8px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.08);
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid transparent;
  min-width: 70px;
}

.ratio-item:hover {
  background: rgba(255, 255, 255, 0.15);
}

.ratio-item.active {
  background: rgba(74, 144, 226, 0.25);
  border-color: #4A90E2;
}

.ratio-preview {
  width: 24px;
  height: 16px;
  background: rgba(255, 255, 255, 0.4);
  border-radius: 2px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  flex-shrink: 0;
}

.ratio-label {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.8);
  white-space: nowrap;
  font-weight: 500;
}

.quality-options,
.duration-options {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.quality-btn,
.duration-btn {
  height: 32px;
  padding: 0 16px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.8);
  border-radius: 6px;
  font-size: 12px;
  transition: all 0.3s ease;
  white-space: nowrap;
  min-width: 60px;
}

.quality-btn.active,
.duration-btn.active {
  background: rgba(74, 144, 226, 0.25);
  border-color: #4A90E2;
  color: #4A90E2;
  font-weight: 600;
}

/* 生成按钮区域 */
.generate-section {
  flex-shrink: 0;
}

.generate-button {
  height: 36px;
  padding: 0 16px;
  background: linear-gradient(135deg, #4A90E2, #357ABD);
  border: none;
  color: #ffffff;
  font-size: 14px;
  font-weight: 600;
  border-radius: 8px;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 6px;
  position: relative;
}

.generate-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(74, 144, 226, 0.4);
}

.generate-button:disabled {
  opacity: 0.5;
  transform: none;
  box-shadow: none;
}

.cost-badge {
  background: rgba(255, 255, 255, 0.2);
  color: #ffffff;
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 10px;
  margin-left: 4px;
}

/* 生成进度遮罩 - 即梦风格 */
.generating-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.generating-container {
  text-align: center;
  max-width: 500px;
  width: 100%;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  padding: 40px;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.3);
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

/* 连接�?*/
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

/* 下拉菜单样式 */
:deep(.el-dropdown-menu) {
  background: #323233;
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

:deep(.el-dropdown-menu__item) {
  color: #ffffff;
}

:deep(.el-dropdown-menu__item:hover) {
  background: rgba(74, 144, 226, 0.2);
}

:deep(.el-select-dropdown) {
  background: #323233;
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

:deep(.el-select-dropdown__item) {
  color: #ffffff;
}

:deep(.el-select-dropdown__item:hover) {
  background: rgba(74, 144, 226, 0.2);
}

:deep(.el-select-dropdown__item.selected) {
  background: rgba(74, 144, 226, 0.3);
  color: #4A90E2;
}

/* 进度条样�?*/
:deep(.el-progress-circle__path) {
  stroke: #667eea;
}

:deep(.el-progress__text) {
  color: #ffffff !important;
}

/* 滚动条样�?*/
.video-list::-webkit-scrollbar,
.panel-content::-webkit-scrollbar {
  width: 4px;
}

.video-list::-webkit-scrollbar-track,
.panel-content::-webkit-scrollbar-track {
  background: transparent;
}

.video-list::-webkit-scrollbar-thumb,
.panel-content::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
}

.video-list::-webkit-scrollbar-thumb:hover,
.panel-content::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}

/* 响应式设�?*/
@media (max-width: 768px) {
  .empty-content-center {
    padding: 20px;
  }
  
  .center-panel {
    padding: 24px;
    max-width: 100%;
  }
  
  .center-title {
    font-size: 24px;
  }
  
  .generator-top-section {
    flex-direction: column;
    gap: 16px;
  }
  
  .generator-upload-section {
    justify-content: center;
    gap: 12px;
  }
  
  .generator-controls-section {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }
  
  .generator-config-section {
    flex-wrap: wrap;
    justify-content: center;
    gap: 8px;
  }
  
  .generator-generate-section {
    align-self: center;
  }
  
  .floating-generation-panel {
    bottom: 10px;
    width: calc(100% - 20px);
  }
  
  .floating-generation-panel .generator-panel {
    padding: 12px 16px;
  }
  
  .video-list {
    padding: 12px 16px 120px 16px;
  }
  
  .video-cards {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .section-header {
    padding: 12px 16px;
  }
}

@media (min-width: 769px) and (max-width: 1024px) {
  .center-panel {
    max-width: 700px;
    padding: 32px;
  }
  
  .generator-top-section {
    gap: 16px;
  }
  
  .generator-controls-section {
    gap: 20px;
  }
  
  .floating-generation-panel {
    width: calc(100% - 60px);
    max-width: 800px;
  }
  
  .generator-config-section {
    gap: 12px;
  }
  
  .config-select {
    width: 100px;
  }
  
  .video-cards {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 16px;
  }
  
  .video-list {
    padding: 16px 20px 130px 20px;
  }
}

@media (min-width: 1025px) {
  .floating-generation-panel {
    max-width: 1000px;
  }
  
  .generator-config-section {
    gap: 18px;
  }
  
  .config-select {
    width: 120px;
  }
  
  .video-cards {
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  }
}

@media (min-width: 1400px) {
  .video-cards {
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    gap: 24px;
  }
  
  .video-list {
    padding: 20px 24px 140px 24px;
  }
}
</style>

<style>
/* 全局样式 - 用于 Element Plus Popover 组件 */
.model-popover,
.config-popover {
  background: #323233 !important;
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  border-radius: 12px !important;
  padding: 0 !important;
  z-index: 99999 !important;
}

.model-popover .el-popover__content,
.config-popover .el-popover__content {
  padding: 0 !important;
}

/* 其他下拉框样�?*/
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
