<template>
  <div class="image-generate-container">
    <!-- 主要内容区域 -->
    <div class="main-content">
      <!-- 无内容时的居中输入区域 -->
      <div v-if="currentImages.length === 0 && generationTasks.length === 0" class="centered-input-section">
        <!-- 主标题 -->
        <div class="page-header">
          <div class="header-content">
            <!-- <div class="header-icon">
              <el-icon class="main-icon"><Picture /></el-icon>
            </div> -->
            <h1 class="header-title">开启属于你的MobgiAI创作</h1>
          </div>
        </div>
        
        <!-- 上传图片预览列表 - 放在页面头部下方 -->
        <div v-if="referenceImages.length > 0" class="upload-preview-section header-below">
          <div class="preview-header">
            <span class="preview-label">参考图片 ({{ referenceImages.length }}/5)</span>
            <el-button size="small" link @click="clearAllImages">清空全部</el-button>
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
                :alt="image.name || '参考图片'"
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
              <!-- 图片生成模式的上传 -->
              <template v-if="currentGenerateMode?.value === 'image'">
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
              </template>

              <!-- 视频生成模式的上传 -->
              <template v-else-if="currentGenerateMode?.value === 'video'">
                <!-- 首尾帧模式 -->
                <template v-if="!currentModel?.name?.includes('可灵') || selectedKeLingOption === '首尾帧'">
                  <div class="video-upload-frames">
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
                            <el-icon size="16"><Plus /></el-icon>
                          </div>
                        </div>
                      </el-upload>
                    </div>
                    <template v-if="currentModel?.name!='可灵2.6'">
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
                              <el-icon size="16"><Plus /></el-icon>
                            </div>
                          </div>
                        </el-upload>
                      </div>
                    </template>
                  </div>
                </template>

                <!-- 多模态参考模式和视频编辑模式 -->
                <template v-else-if="currentModel?.name?.includes('可灵O1') && (selectedKeLingOption === '多模态参考' || selectedKeLingOption === '视频编辑')">
                  <div class="video-upload-multimodal">
                    <!-- 传视频区域 -->
                    <div class="upload-item">
                      <label class="upload-label">传视频</label>
                      <el-upload
                        :show-file-list="false"
                        :before-upload="handleVideoUpload"
                        accept="video/*"
                        class="frame-uploader"
                      >
                        <div class="upload-area" :class="{ 'has-video': referenceVideo }">
                          <video v-if="referenceVideo" :src="referenceVideo" class="uploaded-video" muted />
                          <div v-else class="upload-placeholder">
                            <el-icon size="16"><VideoCamera /></el-icon>
                          </div>
                        </div>
                      </el-upload>
                    </div>

                    <!-- 传图片区域 -->
                    <div class="images-upload-section">
                      <label class="upload-label">传图片</label>
                      <div class="images-container">
                        <!-- 上传框 -->
                        <el-upload
                          :show-file-list="false"
                          :before-upload="handleReferenceImageUpload"
                          accept="image/*"
                          class="frame-uploader"
                          :disabled="videoReferenceImages.filter(img => img).length >= 4"
                        >
                          <div class="upload-area small" :class="{ 'disabled': videoReferenceImages.filter(img => img).length >= 4 }">
                            <div class="upload-placeholder">
                              <el-icon size="12"><Plus /></el-icon>
                              <span class="upload-text">{{ videoReferenceImages.filter(img => img).length }}/4</span>
                            </div>
                          </div>
                        </el-upload>
                        
                        <!-- 预览缩略图 -->
                        <div class="preview-thumbnails">
                          <div 
                            v-for="(image, index) in videoReferenceImages.filter(img => img)" 
                            :key="index"
                            class="thumbnail-item"
                          >
                            <div class="thumbnail-wrapper" @click="previewReferenceImage(image)">
                              <img :src="image" class="thumbnail-image" />
                              <div class="thumbnail-overlay">
                                <el-icon class="preview-icon"><Picture /></el-icon>
                              </div>
                            </div>
                            <el-button 
                              class="remove-thumbnail-btn"
                              size="small"
                              type="danger"
                              @click="removeReferenceImage(index)"
                            >
                              <el-icon><Close /></el-icon>
                            </el-button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </template>
              </template>
            </div>
            
            <!-- 文本输入 -->
            <div class="text-input-section">
              <el-input
                v-model="prompt"
                type="textarea"
                :rows="1"
                :autosize="{ minRows: 1, maxRows: 4 }"
                :placeholder="currentGenerateMode?.value === 'video' ? '请描述您想要生成的视频内容...' : '请描述您想要生成的图片内容...'"
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
              <!-- 生成方式选择 -->
              <el-popover
                ref="generateModePopoverRef"
                placement="top"
                :width="200"
                trigger="click"
                popper-class="generate-mode-popover"
                :teleported="true"
              >
                <template #reference>
                  <div class="param-btn generate-mode-btn">
                    <div class="btn-icon">
                      <el-icon><VideoCamera v-if="currentGenerateMode?.value === 'video'" /><Picture v-else /></el-icon>
                    </div>
                    <span>{{ currentGenerateMode?.label || '图片生成' }}</span>
                    <el-icon class="arrow-icon"><ArrowDown /></el-icon>
                  </div>
                </template>
                <div class="generate-mode-selector">
                  <div class="selector-header">选择生成方式</div>
                  <div class="mode-list">
                    <div 
                      v-for="mode in generateModes" 
                      :key="mode.value"
                      class="mode-item"
                      :class="{ active: currentGenerateMode?.value === mode.value }"
                      @click="selectGenerateMode(mode)"
                    >
                      <div class="mode-info">
                        <div class="mode-icon">
                          <el-icon><VideoCamera v-if="mode.value === 'video'" /><Picture v-else /></el-icon>
                        </div>
                        <div class="mode-details">
                          <div class="mode-name">{{ mode.label }}</div>
                        </div>
                      </div>
                      <div v-if="currentGenerateMode?.value === mode.value" class="check-icon">
                        <el-icon><Check /></el-icon>
                      </div>
                    </div>
                  </div>
                </div>
              </el-popover>

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
                    <span>{{ currentModel?.name || 'Seedream 4.5' }}</span>
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

              <!-- 可灵模型的特殊选项 (仅在视频生成且选择可灵模型时显示) -->
              <el-popover
                v-if="currentGenerateMode?.value === 'video' && currentModel?.name?.includes('可灵O1')"
                ref="keLingPopoverRef"
                placement="top"
                :width="240"
                trigger="click"
                popper-class="keling-popover"
                :teleported="true"
              >
                <template #reference>
                  <div class="param-btn keling-option-btn">
                    <el-icon><Setting /></el-icon>
                    {{ selectedKeLingOption }}
                    <el-icon class="arrow-icon"><ArrowDown /></el-icon>
                  </div>
                </template>
                <div class="keling-selector">
                  <div class="selector-header">可灵O1选项</div>
                  <div class="option-list">
                    <div 
                      v-for="option in keLingOptions" 
                      :key="option.value"
                      class="option-item"
                      :class="{ active: selectedKeLingOption === option.value }"
                      @click="selectKeLingOption(option)"
                    >
                      <div class="option-info">
                        <div class="option-name">{{ option.label }}</div>
                        <div class="option-desc">{{ option.description }}</div>
                      </div>
                      <div v-if="selectedKeLingOption === option.value" class="check-icon">
                        <el-icon><Check /></el-icon>
                      </div>
                    </div>
                  </div>
                </div>
              </el-popover>

              <!-- 图片参数选择 (仅在图片生成时显示) -->
              <el-popover
                v-if="currentGenerateMode?.value === 'image'"
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

              <!-- 视频参数选择 (仅在视频生成时显示) -->
              <el-popover
                v-if="currentGenerateMode?.value === 'video'"
                ref="videoParamsPopoverRef"
                placement="top"
                :width="400"
                trigger="click"
                popper-class="video-params-popover"
                :teleported="true"
              >
                <template #reference>
                  <div class="param-btn">
                    <div class="btn-icon">
                      <el-icon><Setting /></el-icon>
                    </div>
                    <span>{{ getVideoConfigSummary() }}</span>
                    <el-icon class="arrow-icon"><ArrowDown /></el-icon>
                  </div>
                </template>
                <div class="video-params-selector">
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
                  
                  <div class="selector-footer">
                    <el-button 
                      type="primary" 
                      size="small" 
                      @click="videoParamsPopoverRef?.hide()"
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
                :loading="generationTasks.length >= maxConcurrentTasks"
                :disabled="!prompt.trim() || generationTasks.length >= maxConcurrentTasks"
                @click="handleGenerate"
                class="generate-btn"
              >
                <span>{{ generationTasks.length >= maxConcurrentTasks ? '生成中...' : '生成' }}</span>
              </el-button>
            </div>
          </div>
        </div>
      </div>

      <!-- 结果展示区域 -->
      <div class="results-section">
        <!-- 多任务生成中状态 -->
        <div v-if="generationTasks.length > 0" class="generating-tasks">
          <div 
            v-for="task in generationTasks" 
            :key="task.id"
            class="generating-state"
          >
            <div class="generation-card generating">
              <!-- 上部分：缩略图和制作中状态 -->
              <div class="generation-header">
                <div class="generation-thumbnail generating-thumb">
                  <div class="generating-placeholder">
                    <el-icon class="placeholder-icon"><Picture /></el-icon>
                  </div>
                </div>
                <div class="generation-info">
                  <div class="generation-status">
                    <span class="status-text">制作中...</span>
                    <div class="status-progress">
                      <div class="progress-bar" :style="{ width: task.progress + '%' }"></div>
                    </div>
                  </div>
                  <div class="generation-prompt">{{ task.prompt || '正在生成您描述的图片内容...' }}</div>
                </div>
              </div>
              
              <!-- 中部分：模型标签等信息 -->
              <div class="generation-meta">
                <div class="meta-tags">
                  <span class="meta-tag model-tag">{{ task.model?.name || 'Seedream 4.5' }}</span>
                  <span class="meta-tag size-tag">{{ task.size?.label || '9:16' }}</span>
                  <span class="meta-tag status-tag">{{ task.progressText }}</span>
                </div>
              </div>
              
              <!-- 下部分：待生成的模型图缺省图 -->
              <div class="generation-images generating-preview" :class="`count-${task.imageCount?.value || 4}`">
                  <!-- v-for="index in (task.imageCount?.value || 4)" :key="index" -->
                <div class="generation-image-item generating-item">
                  <div class="image-wrapper">
                    <div class="generating-placeholder-image">
                      <div class="placeholder-content">
                        <el-icon class="placeholder-icon" v-if="currentGenerateMode?.value === 'video'"><VideoCamera /></el-icon>
                        <el-icon class="placeholder-icon" v-else><Picture /></el-icon>
                        <div class="placeholder-text">生成中</div>
                        <div class="generating-dots">
                          <span class="dot"></span>
                          <span class="dot"></span>
                          <span class="dot"></span>
                        </div>
                      </div>
                    </div>
                  </div>
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
                <img v-if="resultType === 'images'" :src="currentImages[0]?.url" alt="生成缩略图" class="thumbnail-image" />
                <div v-else-if="resultType === 'video'" class="thumbnail-video-icon">
                  <div class="video-icon-wrapper">
                    <el-icon size="20"><VideoCamera /></el-icon>
                  </div>
                  <div class="video-icon-bg"></div>
                </div>
              </div>
              <div class="generation-info">
                <div class="generation-prompt">{{ prompt || '这是一段生成于千年前的成图的内容示例，它的主要作用是向用户展示出图像生成的强大功能，让用户能够直观地感受到AI生成图像的魅力和实用性。在实际使用时，这段文字会被替换为用户输入的具体描述内容，从而生成符合用户需求的个性化图像。' }}</div>
              </div>
            </div>
            
            <!-- 中部分：模型标签等信息 -->
            <div class="generation-meta">
              <div class="meta-tags">
                <span class="meta-tag model-tag">{{ currentModel?.name || 'Seedream 4.5' }}</span>
                <span v-if="resultType === 'images'" class="meta-tag size-tag">{{ currentSize?.label || '9:16' }}</span>
                <span v-else-if="resultType === 'video'" class="meta-tag size-tag">{{ getVideoConfigSummary() }}</span>
              </div>
            </div>
            
            <!-- 下部分：生成内容 - 根据 resultType 显示不同内容 -->
            <!-- 图片结果显示 -->
            <div v-if="resultType === 'images'" class="generation-images" :class="`count-${currentImages.length}`">
              <div 
                v-for="(image, index) in currentImages" 
                :key="index"
                class="generation-image-item"
                @click="previewImage(image.url)"
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
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 视频结果显示 - 与图片网格中单张图片相同大小 -->
            <div v-else-if="resultType === 'video' && currentVideo" class="generation-images video-result-container">
              <div class="generation-image-item video-result-item single-video" @click="previewVideo(currentVideo)">
                <div class="image-wrapper video-wrapper">
                  <video 
                    :src="currentVideo.url" 
                    class="generated-image generated-video"
                    muted
                    preload="metadata"
                    @mouseenter="handleVideoHover"
                    @mouseleave="handleVideoLeave"
                    ref="videoThumbnailRef"
                  >
                  </video>
                  <div class="image-overlay video-overlay">
                    <div class="play-button">
                      <el-icon size="24"><VideoPlay /></el-icon>
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
              <el-button v-if="resultType === 'video' && currentVideo" class="action-button download-button" @click="downloadVideo(currentVideo)">
                <el-icon class="button-icon"><Download /></el-icon>
                <span>下载</span>
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
    <div v-if="currentImages.length > 0 || generationTasks.length > 0" class="floating-input-panel" :class="getPanelClass()">
      <div class="panel-container">
        <!-- 上半部分：上传和文本输入 -->
        <div class="panel-top-section">
          <!-- 上传按钮 -->
          <div class="upload-section">
            <!-- 图片生成模式的上传 -->
            <template v-if="currentGenerateMode?.value === 'image'">
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
            </template>

            <!-- 视频生成模式的上传 -->
            <template v-else-if="currentGenerateMode?.value === 'video'">
              <!-- 首尾帧模式 -->
              <template v-if="!currentModel?.name?.includes('可灵') || selectedKeLingOption === '首尾帧'">
                <div class="video-upload-frames compact">
                  <div class="upload-item">
                    <label class="upload-label">首帧图</label>
                    <el-upload
                      :show-file-list="false"
                      :before-upload="handleFirstFrameUpload"
                      accept="image/*"
                      class="frame-uploader"
                    >
                      <div class="upload-area small" :class="{ 'has-image': firstFrameImage }">
                        <img v-if="firstFrameImage" :src="firstFrameImage" class="uploaded-image" />
                        <div v-else class="upload-placeholder">
                          <el-icon size="12"><Plus /></el-icon>
                        </div>
                      </div>
                    </el-upload>
                  </div>
                  
                  <div class="arrow-section">
                    <el-button 
                      class="swap-button small" 
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
                      <div class="upload-area small" :class="{ 'has-image': lastFrameImage }">
                        <img v-if="lastFrameImage" :src="lastFrameImage" class="uploaded-image" />
                        <div v-else class="upload-placeholder">
                          <el-icon size="12"><Plus /></el-icon>
                        </div>
                      </div>
                    </el-upload>
                  </div>
                </div>
              </template>

              <!-- 多模态参考模式和视频编辑模式 -->
              <template v-else-if="currentModel?.name?.includes('可灵') && (selectedKeLingOption === '多模态参考' || selectedKeLingOption === '视频编辑')">
                <div class="video-upload-multimodal compact">
                  <!-- 传视频区域 -->
                  <div class="upload-item">
                    <label class="upload-label">传视频</label>
                    <el-upload
                      :show-file-list="false"
                      :before-upload="handleVideoUpload"
                      accept="video/*"
                      class="frame-uploader"
                    >
                      <div class="upload-area small" :class="{ 'has-video': referenceVideo }">
                        <video v-if="referenceVideo" :src="referenceVideo" class="uploaded-video" muted />
                        <div v-else class="upload-placeholder">
                          <el-icon size="12"><VideoCamera /></el-icon>
                        </div>
                      </div>
                    </el-upload>
                  </div>

                  <!-- 传图片区域 -->
                  <div class="images-upload-section compact">
                    <label class="upload-label">传图片</label>
                    <div class="images-container">
                      <!-- 上传框 -->
                      <el-upload
                        :show-file-list="false"
                        :before-upload="handleReferenceImageUpload"
                        accept="image/*"
                        class="frame-uploader"
                        :disabled="videoReferenceImages.filter(img => img).length >= 4"
                      >
                        <div class="upload-area mini" :class="{ 'disabled': videoReferenceImages.filter(img => img).length >= 4 }">
                          <div class="upload-placeholder">
                            <el-icon size="10"><Plus /></el-icon>
                            <span class="upload-text">{{ videoReferenceImages.filter(img => img).length }}/4</span>
                          </div>
                        </div>
                      </el-upload>
                      
                      <!-- 预览缩略图 -->
                      <div class="preview-thumbnails">
                        <div 
                          v-for="(image, index) in videoReferenceImages.filter(img => img)" 
                          :key="index"
                          class="thumbnail-item"
                        >
                          <div class="thumbnail-wrapper" @click="previewReferenceImage(image)">
                            <img :src="image" class="thumbnail-image" />
                            <div class="thumbnail-overlay">
                              <el-icon class="preview-icon"><Picture /></el-icon>
                            </div>
                          </div>
                          <el-button 
                            class="remove-thumbnail-btn"
                            size="small"
                            type="danger"
                            @click="removeReferenceImage(index)"
                          >
                            <el-icon><Close /></el-icon>
                          </el-button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </template>
            </template>
          </div>
          
          <!-- 文本输入 -->
          <div class="text-input-section">
            <el-input
              v-model="prompt"
              type="textarea"
              :rows="1"
              :autosize="{ minRows: 1, maxRows: 3 }"
              :placeholder="currentGenerateMode?.value === 'video' ? '请描述您想要生成的视频内容...' : '请描述您想要生成的图片内容...'"
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
              :key="index"
              class="upload-preview-item"
              @click="previewUploadImage(image.url)"
            >
              <img 
                :src="image.url" 
                :alt="参考图"
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
            <!-- 生成方式选择 -->
            <el-popover
              ref="panelGenerateModePopoverRef"
              placement="top"
              :width="200"
              trigger="click"
              popper-class="generate-mode-popover"
              :teleported="true"
            >
              <template #reference>
                <div class="param-btn generate-mode-btn">
                  <div class="btn-icon">
                    <el-icon><VideoCamera v-if="currentGenerateMode?.value === 'video'" /><Picture v-else /></el-icon>
                  </div>
                  <span>{{ currentGenerateMode?.label || '图片生成' }}</span>
                  <el-icon class="arrow-icon"><ArrowDown /></el-icon>
                </div>
              </template>
              <div class="generate-mode-selector">
                <div class="selector-header">选择生成方式</div>
                <div class="mode-list">
                  <div 
                    v-for="mode in generateModes" 
                    :key="mode.value"
                    class="mode-item"
                    :class="{ active: currentGenerateMode?.value === mode.value }"
                    @click="selectGenerateMode(mode)"
                  >
                    <div class="mode-info">
                      <div class="mode-icon">
                        <el-icon><VideoCamera v-if="mode.value === 'video'" /><Picture v-else /></el-icon>
                      </div>
                      <div class="mode-details">
                        <div class="mode-name">{{ mode.label }}</div>
                      </div>
                    </div>
                    <div v-if="currentGenerateMode?.value === mode.value" class="check-icon">
                      <el-icon><Check /></el-icon>
                    </div>
                  </div>
                </div>
              </div>
            </el-popover>

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
                  <span>{{ currentModel?.name || 'Seedream 4.5' }}</span>
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

            <!-- 可灵模型的特殊选项 (仅在视频生成且选择可灵模型时显示) -->
            <el-popover
              v-if="currentGenerateMode?.value === 'video' && currentModel?.name?.includes('可灵')"
              ref="panelKeLingPopoverRef"
              placement="top"
              :width="240"
              trigger="click"
              popper-class="keling-popover"
              :teleported="true"
            >
              <template #reference>
                <div class="param-btn keling-option-btn">
                  <el-icon><Setting /></el-icon>
                  {{ selectedKeLingOption }}
                  <el-icon class="arrow-icon"><ArrowDown /></el-icon>
                </div>
              </template>
              <div class="keling-selector">
                <div class="selector-header">可灵选项</div>
                <div class="option-list">
                  <div 
                    v-for="option in keLingOptions" 
                    :key="option.value"
                    class="option-item"
                    :class="{ active: selectedKeLingOption === option.value }"
                    @click="selectKeLingOption(option)"
                  >
                    <div class="option-info">
                      <div class="option-name">{{ option.label }}</div>
                      <div class="option-desc">{{ option.description }}</div>
                    </div>
                    <div v-if="selectedKeLingOption === option.value" class="check-icon">
                      <el-icon><Check /></el-icon>
                    </div>
                  </div>
                </div>
              </div>
            </el-popover>

            <!-- 图片参数选择 (仅在图片生成时显示) -->
            <el-popover
              v-if="currentGenerateMode?.value === 'image'"
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

            <!-- 视频参数选择 (仅在视频生成时显示) -->
            <el-popover
              v-if="currentGenerateMode?.value === 'video'"
              ref="panelVideoParamsPopoverRef"
              placement="top"
              :width="400"
              trigger="click"
              popper-class="video-params-popover"
              :teleported="true"
            >
              <template #reference>
                <div class="param-btn">
                  <div class="btn-icon">
                    <el-icon><Setting /></el-icon>
                  </div>
                  <span>{{ getVideoConfigSummary() }}</span>
                  <el-icon class="arrow-icon"><ArrowDown /></el-icon>
                </div>
              </template>
              <div class="video-params-selector">
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
                
                <div class="selector-footer">
                  <el-button 
                    type="primary" 
                    size="small" 
                    @click="panelVideoParamsPopoverRef?.hide()"
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
              :loading="generationTasks.length >= maxConcurrentTasks"
              :disabled="!prompt.trim() || generationTasks.length >= maxConcurrentTasks"
              @click="handleGenerate"
              class="generate-btn compact"
            >
              <span>{{ generationTasks.length >= maxConcurrentTasks ? '生成中...' : '生成' }}</span>
            </el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 历史记录侧边栏 -->
    <div class="history-sidebar" :class="{ open: showHistory }">
      <div class="sidebar-header">
        <h3>历史记录</h3>
        <el-button type="link" @click="toggleHistory">
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
    <!-- <el-button 
      class="history-toggle"
      type="primary"
      circle
      @click="toggleHistory"
    >
      <el-icon><Clock /></el-icon>
    </el-button> -->

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
    <!-- 视频预览对话框 -->
    <el-dialog v-model="videoPreviewVisible" title="" width="80%" center class="preview-dialog video-preview-dialog">
      <div v-if="previewVideoData" class="preview-content">
        <video :src="previewVideoUrl" class="preview-video" controls autoplay />
        <div class="preview-actions">
          <el-button type="primary" @click="downloadVideo(previewVideoData)">
            <el-icon><Download /></el-icon>
            下载
          </el-button>
          <el-button @click="saveVideoToAssets(previewVideoData)">
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
import { uploadBigVideoToTOS, uploadImageToTOS } from '../services/tos.js'
import { getTosToken } from '../api/index'
import { ElMessage } from 'element-plus'
import {
  Picture, Plus, Download, FolderAdd, Clock, Close,
  ArrowDown, FullScreen, Check, Refresh, Edit, Delete, VideoCamera, Setting, Switch, VideoPlay
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

interface VideoResult {
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

interface GenerationTask {
  id: string
  prompt: string
  model: Model
  size: Size
  resolution: Resolution
  imageCount: ImageCount
  referenceImages: UploadFile[]
  status: 'generating' | 'completed' | 'failed'
  progress: number
  progressText: string
  images: ImageResult[]
  createdAt: number
}

const prompt = ref('')
const referenceImages = ref<UploadFile[]>([])
const currentImages = ref<ImageResult[]>([])
const currentVideo = ref<VideoResult | null>(null)
const resultType = ref<'images' | 'video'>('video')
const showHistory = ref(false)
const previewVisible = ref(false)
const previewImageUrl = ref('')
const previewImageData = ref<ImageResult | null>(null)
const uploadPreviewVisible = ref(false)
const uploadPreviewUrl = ref('')

// 视频预览相关状态
const videoPreviewVisible = ref(false)
const previewVideoUrl = ref('')
const previewVideoData = ref<VideoResult | null>(null)

// 新增：多任务生成相关状态
const generationTasks = ref<GenerationTask[]>([])
const maxConcurrentTasks = ref(5)
const generationCooldown = ref(60000) // 1分钟冷却时间

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
const generateModePopoverRef = ref()
const panelGenerateModePopoverRef = ref()
const videoParamsPopoverRef = ref()
const panelVideoParamsPopoverRef = ref()
const keLingPopoverRef = ref()
const panelKeLingPopoverRef = ref()

// 图片生成模型选项
const imageModels = ref<Model[]>([
  { 
    id: 'seedream-45', 
    name: 'Seedream 4.5', 
    description: '最新版本，画质更佳',
    color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  },
  { 
    id: 'seedream-40', 
    name: 'Seedream 4.0', 
    description: '稳定版本，效果出色',
    color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  },
  { 
    id: 'keling-o1-image', 
    name: '可灵 O1', 
    description: '支持自然语言描述，图片生成专用',
    color: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
  },
  { 
    id: 'keling-20', 
    name: '可灵 2.0', 
    description: '经典版本，稳定可靠',
    color: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
  }
])

// 视频生成模型选项
const videoModels = ref<Model[]>([
  { 
    id: 'seedance-15-pro', 
    name: 'Seedance 1.5 Pro', 
    description: '高质量视频，全新体验',
    color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  },
  { 
    id: 'seedance-10-pro', 
    name: 'Seedance 1.0 Pro', 
    description: '效果稳定，超清画质',
    color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  },
  { 
    id: 'keling-o1-video', 
    name: '可灵O1', 
    description: '支持自然语言描述，视频图片多模态',
    color: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
  },
  { 
    id: 'keling-26', 
    name: '可灵2.6', 
    description: '高质量生成，智能更新',
    color: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
  }
])

// 当前可用的模型列表（根据生成方式动态变化）
const models = ref<Model[]>(imageModels.value)

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

// 生成方式选项
const generateModes = ref([
  { value: 'image', label: '图片生成' },
  { value: 'video', label: '视频生成' }
])

const currentGenerateMode = ref(generateModes.value[0]) // 默认选择图片生成

// 视频生成相关状态
const selectedKeLingOption = ref('首尾帧') // 可灵模型的特殊选项
const enableAudio = ref(false)
const selectedQuality = ref('720p')
const selectedDuration = ref('5')
const selectedRatio = ref('smart')

// 视频上传相关状态（与VideoGenerateView保持一致）
const firstFrameImage = ref('')
const lastFrameImage = ref('')
const referenceVideo = ref('')
const videoReferenceImages = ref(['', '', '', '']) // 4张参考图片

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
    model: 'Seedream 4.5',
    size: '1:1',
    createdAt: Date.now() - 1000 * 60 * 30
  }
])

// 可灵模型的特殊选项
const keLingOptions = ref([
  { value: '首尾帧', label: '首尾帧', description: '基于首尾帧生成视频' },
  { value: '多模态参考', label: '多模态参考', description: '多模态内容参考生成' },
  { value: '视频编辑', label: '视频编辑', description: '智能视频编辑功能' }
])

// 视频比例选项
const videoRatios = ref([
  { value: 'smart', label: '智能比例', aspect: '1' },
  { value: '21:9', label: '21:9', aspect: '21/9' },
  { value: '16:9', label: '16:9', aspect: '16/9' },
  { value: '4:3', label: '4:3', aspect: '4/3' },
  { value: '1:1', label: '1:1', aspect: '1' },
  { value: '3:4', label: '3:4', aspect: '3/4' },
  { value: '9:16', label: '9:16', aspect: '9/16' }
])

// 视频质量选项
const videoQualities = ref([
  { value: '480p', label: '480P' },
  { value: '720p', label: '720P' },
  { value: '1080p', label: '1080P' },
  { value: '4k', label: '4K' }
])

// 视频时长选项
const videoDurations = ref([
  { value: '5', label: '5s' },
  { value: '10', label: '10s' },
  { value: '15', label: '15s' }
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

const selectGenerateMode = (mode: { value: string; label: string }) => {
  currentGenerateMode.value = mode
  
  // 根据生成方式切换可用的模型列表
  if (mode.value === 'image') {
    models.value = imageModels.value
    // 如果当前选择的模型不在图片模型列表中，则选择第一个图片模型
    const currentModelExists = imageModels.value.find(model => model.id === currentModel.value.id)
    if (!currentModelExists) {
      currentModel.value = imageModels.value[0]
    }
  } else if (mode.value === 'video') {
    models.value = videoModels.value
    // 如果当前选择的模型不在视频模型列表中，则选择第一个视频模型
    const currentModelExists = videoModels.value.find(model => model.id === currentModel.value.id)
    if (!currentModelExists) {
      currentModel.value = videoModels.value[0]
    }
  }
  
  // 关闭 Popover
  generateModePopoverRef.value?.hide()
  panelGenerateModePopoverRef.value?.hide()
}

// 视频生成相关方法
const selectKeLingOption = (option: { value: string; label: string }) => {
  selectedKeLingOption.value = option.value
  // 关闭 Popover
  keLingPopoverRef.value?.hide()
  panelKeLingPopoverRef.value?.hide()
}

const selectAudio = (enabled: boolean) => {
  enableAudio.value = enabled
}

const selectRatio = (ratio: { value: string; label: string }) => {
  selectedRatio.value = ratio.value
}

const selectQuality = (quality: { value: string; label: string }) => {
  selectedQuality.value = quality.value
}

const selectDuration = (duration: { value: string; label: string }) => {
  selectedDuration.value = duration.value
}

// 生成视频配置摘要文本
const getVideoConfigSummary = () => {
  const audioText = enableAudio.value ? '有声' : '无声'
  const ratioText = videoRatios.value.find(r => r.value === selectedRatio.value)?.label || '16:9'
  const qualityText = videoQualities.value.find(q => q.value === selectedQuality.value)?.label || '720P'
  const durationText = videoDurations.value.find(d => d.value === selectedDuration.value)?.label || '5s'
  
  return `${audioText} | ${ratioText} | ${qualityText} | ${durationText}`
}

// 视频上传处理方法
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

const handleVideoUpload = (file: File) => {
  const url = URL.createObjectURL(file)
  referenceVideo.value = url
  ElMessage.success('视频上传成功')
  return false // 阻止自动上传
}

const handleReferenceImageUpload = (file: File) => {
  // 找到第一个空位置
  const emptyIndex = videoReferenceImages.value.findIndex(img => !img)
  if (emptyIndex !== -1) {
    const url = URL.createObjectURL(file)
    videoReferenceImages.value[emptyIndex] = url
    ElMessage.success(`第${emptyIndex + 1}张参考图片上传成功`)
  } else {
    ElMessage.warning('最多只能上传4张参考图片')
  }
  return false // 阻止自动上传
}

const removeReferenceImage = (index: number) => {
  // 找到实际的索引位置
  const filteredImages = videoReferenceImages.value.filter(img => img)
  const imageToRemove = filteredImages[index]
  const actualIndex = videoReferenceImages.value.indexOf(imageToRemove)
  
  if (actualIndex !== -1) {
    videoReferenceImages.value[actualIndex] = ''
    ElMessage.success('参考图片已删除')
  }
}

const previewReferenceImage = (imageUrl: string) => {
  // 创建预览弹窗
  const previewDialog = document.createElement('div')
  previewDialog.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    cursor: pointer;
  `
  
  const img = document.createElement('img')
  img.src = imageUrl
  img.style.cssText = `
    max-width: 90%;
    max-height: 90%;
    object-fit: contain;
    border-radius: 8px;
  `
  
  previewDialog.appendChild(img)
  document.body.appendChild(previewDialog)
  
  // 点击关闭预览
  previewDialog.addEventListener('click', () => {
    document.body.removeChild(previewDialog)
  })
}

const handleImageUpload = async (files: File) => {
  // 检查文件数量限制
  if (referenceImages.value.length >= 5) {
    ElMessage.warning('最多只能上传5张图片')
    return false
  }

  // 检查文件类型
  const isImage = files.raw.type.startsWith('image/')
  if (!isImage) {
    ElMessage.error('只能上传图片文件')
    return false
  }

  // 检查文件大小 (10MB)
  const isLt10M = files.raw.size / 1024 / 1024 < 10
  if (!isLt10M) {
    ElMessage.error('图片大小不能超过10MB')
    return false
  }
// 上传到火山引擎tos上
  const file = files.raw;
  console.log(file,"上传的图片")
  if (!file) return;
  if (!file.type.includes('image')) {
    ElMessage.warning("请选择正确的图片文件");
    return;
  }
  try {
    console.log('开始请求TOS配置...');
    const tosConfig = await getTosToken();
    
    if (!tosConfig) {
      throw new Error('未获取到TOS配置');
    }
    // 调用图片上传方法
    const imageUrl = await uploadImageToTOS(file, tosConfig);
    const img:ImageResult = {
      id: Date.now().toString(),
      url: imageUrl,
      thumbnail: imageUrl
    }
    referenceImages.value.push(img);
    console.log('图片上传成功！地址：', imageUrl);
  } catch (error: unknown) {
    console.error('图片上传失败：', error);
  } 
  // 创建预览URL
  // const reader = new FileReader()
  // reader.onload = (e) => {
  //   const imageData = {
  //     uid: file.uid,
  //     name: file.name,
  //     url: e.target?.result as string,
  //     raw: file.raw
  //   }
  //   referenceImages.value.push(imageData)
  // }
  // reader.readAsDataURL(file.raw)
  
  // return false // 阻止自动上传
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

  // 检查是否超过最大并发数
  if (generationTasks.value.length >= maxConcurrentTasks.value) {
    ElMessage.warning(`最多只能同时生成${maxConcurrentTasks.value}个任务`)
    return
  }

  // 检查冷却时间（1分钟内最多5次）
  const now = Date.now()
  const recentTasks = generationTasks.value.filter(task => 
    now - task.createdAt < generationCooldown.value
  )
  
  if (recentTasks.length >= maxConcurrentTasks.value) {
    const remainingTime = Math.ceil((generationCooldown.value - (now - recentTasks[0].createdAt)) / 1000)
    ElMessage.warning(`请等待${remainingTime}秒后再次生成`)
    return
  }

  // 创建新的生成任务
  const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  const newTask: GenerationTask = {
    id: taskId,
    prompt: prompt.value,
    model: currentModel.value,
    size: currentSize.value,
    resolution: currentResolution.value,
    imageCount: currentImageCount.value,
    referenceImages: [...referenceImages.value],
    status: 'generating',
    progress: 0,
    progressText: '正在分析您的描述...',
    images: [],
    createdAt: now
  }

  // 添加到任务列表
  generationTasks.value.push(newTask)
  
  // 开始生成过程
  generateTask(taskId)
  
  ElMessage.success('已添加到生成队列')
}

// 新增：单个任务生成函数
const generateTask = async (taskId: string) => {
  const task = generationTasks.value.find(t => t.id === taskId)
  if (!task) return

  // 模拟生成过程
  const steps = [
    { progress: 25, text: '正在分析您的描述...' },
    { progress: 50, text: '正在生成创作内容...' },
    { progress: 75, text: '正在优化作品质量...' },
    { progress: 100, text: '生成完成~' }
  ]

  try {
    for (const step of steps) {
      await new Promise(resolve => setTimeout(resolve, 1000))
      task.progress = step.progress
      task.progressText = step.text
    }

    // 根据生成模式决定结果类型
    if (currentGenerateMode.value?.value === 'video') {
      // 生成视频结果
      resultType.value = 'video'
      const newVideo: VideoResult = {
        id: taskId,
        url: `https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4`,
        thumbnail: `https://picsum.photos/400/300?random=${Date.now()}`
      }
      
      currentVideo.value = newVideo
      // 将视频作为单个"图片"项存储到 currentImages 中，保持现有逻辑
      currentImages.value = [{
        id: taskId,
        url: newVideo.url,
        thumbnail: newVideo.thumbnail
      }]
      
      ElMessage.success('视频生成成功！')
    } else {
      // 生成图片结果
      resultType.value = 'images'
      const newImages: ImageResult[] = []
      const imageCount = task.imageCount?.value || 4
      for (let i = 0; i < imageCount; i++) {
        newImages.push({
          id: `${taskId}-${i}`,
          url: `https://picsum.photos/400/400?random=${Date.now() + i}`,
          thumbnail: `https://picsum.photos/200/200?random=${Date.now() + i}`
        })
      }

      task.images = newImages
      currentImages.value = newImages
      currentVideo.value = null // 清空视频结果
      
      // 添加到历史记录
      const historyItem: ImageHistoryItem = {
        id: taskId,
        prompt: task.prompt,
        images: newImages,
        model: task.model?.name || '',
        size: task.size?.label || '',
        createdAt: task.createdAt
      }

      imageHistory.value.unshift(historyItem)
      
      ElMessage.success('图片生成成功！')
    }

    task.status = 'completed'
    
    // 3秒后从任务列表中移除已完成的任务
    setTimeout(() => {
      const index = generationTasks.value.findIndex(t => t.id === taskId)
      if (index > -1) {
        generationTasks.value.splice(index, 1)
      }
    }, 3000)

  } catch (err) {
    console.error('生成失败:', err)
    task.status = 'failed'
    task.progressText = '生成失败'
    ElMessage.error('生成失败，请重试')
    
    // 失败的任务也在3秒后移除
    setTimeout(() => {
      const index = generationTasks.value.findIndex(t => t.id === taskId)
      if (index > -1) {
        generationTasks.value.splice(index, 1)
      }
    }, 3000)
  }
}

const previewImage = (image: ImageResult) => {
  previewImageUrl.value = image.url
  previewImageData.value = image
  previewVisible.value = true
}

const previewVideo = (video: VideoResult) => {
  previewVideoUrl.value = video.url
  previewVideoData.value = video
  videoPreviewVisible.value = true
}

// 视频缩略图hover播放处理
const videoThumbnailRef = ref<HTMLVideoElement>()

const handleVideoHover = (event: Event) => {
  const video = event.target as HTMLVideoElement
  if (video) {
    video.currentTime = 0
    video.play().catch(console.error)
  }
}

const handleVideoLeave = (event: Event) => {
  const video = event.target as HTMLVideoElement
  if (video) {
    video.pause()
    video.currentTime = 0
  }
}

const downloadVideo = async (video: VideoResult) => {
  try {
    await downloadFile(video.url, `generated_video_${video.id}.mp4`)
    ElMessage.success('开始下载视频')
  } catch (error) {
    console.error('下载视频失败:', error)
    ElMessage.error('下载视频失败，请重试')
  }
}

const saveVideoToAssets = (video: VideoResult) => {
  console.log('Saving video to assets:', video.id)
  ElMessage.success('视频已保存到资产库')
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
  currentVideo.value = null
  resultType.value = 'images' // 重置为默认类型
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
  if (!currentImages.value.length && !generationTasks.value.length) return ''
  
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
  max-width: 662px;
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
  border-radius: 8px;
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

/* 生成方式选择弹窗样式 */
:deep(.generate-mode-popover) {
  background: rgba(26, 26, 46, 0.95) !important;
  backdrop-filter: blur(20px) !important;
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
  border-radius: 12px !important;
  padding: 0 !important;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.4) !important;
  z-index: 2000 !important;
}

/* 强制覆盖 Element Plus 弹窗内容的白色背景 */
:deep(.generate-mode-popover .el-popover__content) {
  background: transparent !important;
  border: none !important;
  padding: 0 !important;
  box-shadow: none !important;
}

/* 全局样式覆盖 */
:global(.el-popper.generate-mode-popover) {
  background: rgba(26, 26, 46, 0.95) !important;
  backdrop-filter: blur(20px) !important;
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
  border-radius: 12px !important;
  padding: 0 !important;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.4) !important;
}

:global(.el-popper.generate-mode-popover .el-popover__content) {
  background: transparent !important;
  border: none !important;
  padding: 0 !important;
  box-shadow: none !important;
}

.generate-mode-selector {
  padding: 10px;
  min-width: 180px;
  background: rgba(26, 26, 46, 0.98);
  backdrop-filter: blur(20px);
  border-radius: 8px;
}

.generate-mode-selector .selector-header {
  font-size: 12px;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 8px;
  padding-bottom: 6px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  text-align: center;
}

.mode-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.mode-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px;
  border-radius: 6px;
  background: transparent;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid transparent;
  position: relative;
  overflow: hidden;
}

.mode-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
  transition: left 0.5s ease;
}

.mode-item:hover::before {
  left: 100%;
}

.mode-item:hover {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.3);
  transform: translateY(-1px);
}

.mode-item.active {
  background: rgba(102, 126, 234, 0.3);
  border-color: #667eea;
  box-shadow: 0 1px 4px rgba(102, 126, 234, 0.2);
}

.mode-info {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.mode-icon {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.8);
  font-size: 16px;
  flex-shrink: 0;
}

.mode-item.active .mode-icon {
  color: #667eea;
}

.mode-details {
  display: flex;
  flex-direction: column;
  gap: 1px;
  flex: 1;
  min-width: 0;
}

.mode-name {
  font-size: 12px;
  font-weight: 600;
  color: #ffffff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mode-item.active .mode-name {
  color: #ffffff;
}

.mode-item .check-icon {
  color: #667eea;
  font-size: 14px;
  flex-shrink: 0;
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

/* 视频生成相关样式 */
.video-upload-frames {
  display: flex;
  align-items: center;
  gap: 12px;
}

.video-upload-frames.compact {
  gap: 8px;
}

.video-upload-multimodal {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.video-upload-multimodal.compact {
  gap: 8px;
}

.upload-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.upload-label {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.7);
  text-align: center;
  font-weight: 500;
}

.upload-area {
  width: 50px;
  height: 50px;
  border: 2px dashed rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.05);
}

.upload-area.small {
  width: 40px;
  height: 40px;
}

.upload-area.mini {
  width: 30px;
  height: 30px;
}

.upload-area:hover {
  border-color: #4A90E2;
  background: rgba(74, 144, 226, 0.1);
}

.upload-area.has-image,
.upload-area.has-video {
  border-style: solid;
  border-color: #4A90E2;
}

.upload-area.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  border-color: rgba(255, 255, 255, 0.2);
}

.upload-area.disabled:hover {
  border-color: rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.05);
}

.uploaded-image,
.uploaded-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 6px;
}

.upload-placeholder {
  color: rgba(255, 255, 255, 0.6);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.upload-text {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.6);
}

.arrow-section {
  display: flex;
  align-items: center;
  justify-content: center;
}

.swap-button {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.8);
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  transition: all 0.3s ease;
}

.swap-button.small {
  width: 24px;
  height: 24px;
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

.images-upload-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.images-upload-section.compact {
  gap: 6px;
}

.images-container {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.preview-thumbnails {
  display: flex;
  gap: 6px;
  align-items: flex-start;
  flex-wrap: wrap;
}

.thumbnail-item {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.thumbnail-wrapper {
  position: relative;
  width: 40px;
  height: 40px;
  border-radius: 6px;
  overflow: hidden;
  cursor: pointer;
  border: 2px solid #4A90E2;
  transition: all 0.3s ease;
}

.thumbnail-wrapper:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(74, 144, 226, 0.3);
}

.thumbnail-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.thumbnail-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.thumbnail-wrapper:hover .thumbnail-overlay {
  opacity: 1;
}

.preview-icon {
  color: white;
  font-size: 14px;
}

.remove-thumbnail-btn {
  position: absolute;
  top: -6px;
  right: -6px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f56565;
  border: none;
  color: white;
  font-size: 10px;
  z-index: 10;
  transition: all 0.3s ease;
}

.remove-thumbnail-btn:hover {
  background: #e53e3e;
  transform: scale(1.1);
}

/* 可灵选项弹窗样式 */
:deep(.keling-popover) {
  background: rgba(26, 26, 46, 0.95) !important;
  backdrop-filter: blur(20px) !important;
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
  border-radius: 12px !important;
  padding: 0 !important;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.4) !important;
  z-index: 2000 !important;
}

:deep(.keling-popover .el-popover__content) {
  background: transparent !important;
  border: none !important;
  padding: 0 !important;
  box-shadow: none !important;
}

.keling-selector {
  padding: 16px;
  min-width: 240px;
  background: rgba(26, 26, 46, 0.98);
  backdrop-filter: blur(20px);
  border-radius: 8px;
}

.keling-selector .selector-header {
  font-size: 12px;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  text-align: center;
}

.option-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.option-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  border-radius: 8px;
  background: transparent;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid transparent;
  position: relative;
  overflow: hidden;
}

.option-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
  transition: left 0.5s ease;
}

.option-item:hover::before {
  left: 100%;
}

.option-item:hover {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.3);
  transform: translateY(-1px);
}

.option-item.active {
  background: rgba(102, 126, 234, 0.3);
  border-color: #667eea;
  box-shadow: 0 1px 4px rgba(102, 126, 234, 0.2);
}

.option-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 0;
}

.option-name {
  font-size: 13px;
  font-weight: 600;
  color: #ffffff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.option-desc {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.3;
}

.option-item.active .option-name {
  color: #ffffff;
}

.option-item .check-icon {
  color: #667eea;
  font-size: 14px;
  flex-shrink: 0;
}

/* 视频参数弹窗样式 */
:deep(.video-params-popover) {
  background: rgba(26, 26, 46, 0.95) !important;
  backdrop-filter: blur(20px) !important;
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
  border-radius: 12px !important;
  padding: 0 !important;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.4) !important;
  z-index: 2000 !important;
}

:deep(.video-params-popover .el-popover__content) {
  background: transparent !important;
  border: none !important;
  padding: 0 !important;
  box-shadow: none !important;
}

.video-params-selector {
  padding: 18px;
  min-width: 400px;
  background: rgba(26, 26, 46, 0.98);
  backdrop-filter: blur(20px);
  border-radius: 8px;
}

.config-group {
  margin-bottom: 20px;
}

.config-group:last-child {
  margin-bottom: 0;
}

.config-title {
  font-size: 13px;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 10px;
}

.audio-options {
  display: flex;
  gap: 8px;
}

.audio-btn {
  flex: 1;
  height: 32px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.8);
  border-radius: 6px;
  font-size: 12px;
  transition: all 0.3s ease;
}

.audio-btn:hover {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.3);
}

.audio-btn.active {
  background: rgba(74, 144, 226, 0.3);
  border-color: #4A90E2;
  color: #ffffff;
}

.ratio-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  margin-bottom: 16px;
}

.ratio-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 8px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.05);
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid transparent;
}

.ratio-item:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.3);
}

.ratio-item.active {
  background: rgba(74, 144, 226, 0.2);
  border-color: #4A90E2;
}

.ratio-preview {
  width: 24px;
  height: 16px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
}

.ratio-label {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.8);
  font-weight: 500;
}

.quality-options,
.duration-options {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.quality-btn,
.duration-btn {
  height: 32px;
  padding: 0 12px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.8);
  border-radius: 6px;
  font-size: 12px;
  transition: all 0.3s ease;
}

.quality-btn:hover,
.duration-btn:hover {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.3);
}

.quality-btn.active,
.duration-btn.active {
  background: rgba(74, 144, 226, 0.3);
  border-color: #4A90E2;
  color: #ffffff;
}

.keling-option-btn {
  background: rgba(240, 119, 198, 0.1);
  border-color: rgba(240, 119, 198, 0.3);
  color: rgba(240, 119, 198, 0.9);
}

.keling-option-btn:hover {
  background: rgba(240, 119, 198, 0.15);
  border-color: rgba(240, 119, 198, 0.5);
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

/* 多任务生成中状态 */
.generating-tasks {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 20px 40px 60px 40px;
  width: 100%;
  max-width: none;
  margin: 0;
}

/* 生成中状态 - 生成结果列表样式 */
.generating-state {
  width: 100%;
  opacity: 1;
  animation: slideInFromTop 0.3s ease-out;
}

@keyframes slideInFromTop {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.generation-card.generating {
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
  opacity: 0.9;
}

/* 生成中的缩略图 */
.generation-thumbnail.generating-thumb {
  background: rgba(255, 255, 255, 0.08);
  border: 2px dashed rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.generation-thumbnail.generating-thumb::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.05), transparent);
  animation: shimmer 2s infinite;
}

@keyframes shimmer {
  0% { transform: translateX(-100%) translateY(-100%) rotate(45deg); }
  100% { transform: translateX(100%) translateY(100%) rotate(45deg); }
}

.generating-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  position: relative;
  z-index: 1;
}

.generating-placeholder .placeholder-icon {
  font-size: 24px;
  color: rgba(255, 255, 255, 0.4);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 0.8; }
}

/* 生成状态信息 */
.generation-status {
  margin-bottom: 8px;
}

.status-text {
  font-size: 14px;
  font-weight: 600;
  color: #4A90E2;
  margin-bottom: 6px;
  display: block;
}

.status-progress {
  width: 100%;
  height: 3px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 8px;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #4A90E2, #667eea);
  border-radius: 2px;
  transition: width 0.3s ease;
  position: relative;
}

.progress-bar::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  animation: progressShine 1.5s infinite;
}

@keyframes progressShine {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

/* 状态标签 */
.status-tag {
  background: rgba(74, 144, 226, 0.2);
  border-color: rgba(74, 144, 226, 0.4);
  color: #4A90E2;
  animation: statusPulse 2s infinite;
}

@keyframes statusPulse {
  0%, 100% { opacity: 0.8; }
  50% { opacity: 1; }
}

/* 生成中的图片预览区域 */
.generation-images.generating-preview {
  display: grid;
  gap: 16px;
  width: 100%;
}

.generation-image-item.generating-item {
  aspect-ratio: 1;
  border-radius: 8px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.05);
  border: 2px dashed rgba(255, 255, 255, 0.15);
  position: relative;
}

.generating-placeholder-image {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.03);
  position: relative;
  overflow: hidden;
}

.generating-placeholder-image::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.03), transparent);
  animation: shimmer 3s infinite;
  animation-delay: var(--delay, 0s);
}

.generation-image-item.generating-item:nth-child(1) .generating-placeholder-image::before {
  --delay: 0s;
}

.generation-image-item.generating-item:nth-child(2) .generating-placeholder-image::before {
  --delay: 0.5s;
}

.generation-image-item.generating-item:nth-child(3) .generating-placeholder-image::before {
  --delay: 1s;
}

.generation-image-item.generating-item:nth-child(4) .generating-placeholder-image::before {
  --delay: 1.5s;
}

.placeholder-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  position: relative;
  z-index: 1;
}

.placeholder-content .placeholder-icon {
  font-size: 32px;
  color: rgba(255, 255, 255, 0.3);
  animation: pulse 2s infinite;
}

.placeholder-text {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  font-weight: 500;
}

.generating-dots {
  display: flex;
  gap: 4px;
  margin-top: 4px;
}

.generating-dots .dot {
  width: 4px;
  height: 4px;
  background: rgba(255, 255, 255, 0.4);
  border-radius: 50%;
  animation: dotPulse 1.5s infinite;
}

.generating-dots .dot:nth-child(1) {
  animation-delay: 0s;
}

.generating-dots .dot:nth-child(2) {
  animation-delay: 0.3s;
}

.generating-dots .dot:nth-child(3) {
  animation-delay: 0.6s;
}

@keyframes dotPulse {
  0%, 100% { opacity: 0.4; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.2); }
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
.image-params-popover,
.generate-mode-popover,
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
.image-params-popover .el-popover__content,
.generate-mode-popover .el-popover__content,
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

<style>
/* 全局样式 - 强制覆盖生成方式弹窗的白色背景 */
.generate-mode-popover,
.keling-popover,
.video-params-popover,
.el-popper.generate-mode-popover,
.el-popper.keling-popover,
.el-popper.video-params-popover {
  background: rgba(26, 26, 46, 0.95) !important;
  backdrop-filter: blur(20px) !important;
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
  border-radius: 12px !important;
  padding: 0 !important;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.4) !important;
}

.generate-mode-popover .el-popover__content,
.keling-popover .el-popover__content,
.video-params-popover .el-popover__content,
.el-popper.generate-mode-popover .el-popover__content,
.el-popper.keling-popover .el-popover__content,
.el-popper.video-params-popover .el-popover__content {
  background: transparent !important;
  border: none !important;
  padding: 0 !important;
  box-shadow: none !important;
  color: #ffffff !important;
}

/* 确保弹窗箭头也是透明的 */
.generate-mode-popover .el-popper__arrow::before,
.keling-popover .el-popper__arrow::before,
.video-params-popover .el-popper__arrow::before,
.el-popper.generate-mode-popover .el-popper__arrow::before,
.el-popper.keling-popover .el-popper__arrow::before,
.el-popper.video-params-popover .el-popper__arrow::before {
  background: rgba(26, 26, 46, 0.95) !important;
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
}

/* 更强的覆盖规则 */
.el-popover.generate-mode-popover[data-popper-placement],
.el-popover.keling-popover[data-popper-placement],
.el-popover.video-params-popover[data-popper-placement] {
  background: rgba(26, 26, 46, 0.95) !important;
}

.el-popover.generate-mode-popover[data-popper-placement] .el-popover__content,
.el-popover.keling-popover[data-popper-placement] .el-popover__content,
.el-popover.video-params-popover[data-popper-placement] .el-popover__content {
  background: transparent !important;
}

/* 最强覆盖规则 - 针对可灵选项 */
.el-popper[data-popper-placement].keling-popover,
.el-popover[data-popper-placement].keling-popover {
  background: rgba(26, 26, 46, 0.95) !important;
  backdrop-filter: blur(20px) !important;
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
  border-radius: 12px !important;
}

.el-popper[data-popper-placement].keling-popover .el-popover__content,
.el-popover[data-popper-placement].keling-popover .el-popover__content {
  background: transparent !important;
  border: none !important;
  padding: 0 !important;
  box-shadow: none !important;
}
/* 视频相关样式 */
.thumbnail-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* 美化的视频图标缩略图样式 */
.thumbnail-video-icon {
  width: 100%;
  height: 100%;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 8px;
  overflow: hidden;
}

.video-icon-wrapper {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  color: #ffffff;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.video-icon-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    radial-gradient(circle at 20% 20%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 80% 80%, rgba(255, 255, 255, 0.05) 0%, transparent 50%);
  z-index: 1;
}

/* 视频结果容器 - 靠左显示，单个视频项 */
.video-result-container {
  display: flex;
  justify-content: flex-start;
  align-items: flex-start;
  max-width:300px;
}

/* 单个视频项样式 - 与图片网格中单张图片相同尺寸 */
.video-result-item.single-video {
  /* 在4张图片网格中，单张图片的尺寸 */
  width: calc(100% - 6px); /* 2x2网格中单张图片的宽度 */
  max-width: 480px; /* 限制最大宽度，与图片项一致 */
}

.video-result-item .video-wrapper {
  /* 保持1:1比例，与图片一致 */
  aspect-ratio: 1;
}

.generated-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.video-result-item:hover .generated-video {
  transform: scale(1.05);
}

.video-overlay {
  /* 继承 image-overlay 的样式 */
  position: relative;
}

.play-button {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 48px;
  height: 48px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #333;
  transition: all 0.3s ease;
  z-index: 1;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.video-result-item:hover .play-button {
  background: #ffffff;
  transform: translate(-50%, -50%) scale(1.1);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
}

/* 下载按钮样式 */
.download-button:hover {
  background: rgba(34, 197, 94, 0.2);
  border-color: #22c55e;
  color: #22c55e;
}

/* 视频预览对话框样式 */
.video-preview-dialog .preview-video {
  width: 100%;
  max-height: 70vh;
  object-fit: contain;
  border-radius: 8px;
  background: #000;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .play-button {
    width: 40px;
    height: 40px;
  }
  
  .video-result-item .video-wrapper {
    aspect-ratio: 16/9;
  }
}
</style>

