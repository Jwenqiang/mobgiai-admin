<template>
  <div class="image-generate-container">
    <!-- 主要内容区域 -->
    <div class="main-content">
      <!-- 初始加载动画 - 只覆盖内容区域 -->
      <div v-if="initialLoading" class="initial-loading-overlay">
        <div class="loading-content">
          <div class="loading-spinner">
            <div class="spinner-ring"></div>
            <div class="spinner-ring"></div>
            <div class="spinner-ring"></div>
            <div class="spinner-core">
              <el-icon class="spinner-icon"><Picture /></el-icon>
            </div>
          </div>
          <div class="loading-text">
            <span class="text-shimmer">加载中</span>
            <span class="loading-dots-text">
              <span class="dot-text">.</span>
              <span class="dot-text">.</span>
              <span class="dot-text">.</span>
            </span>
          </div>
        </div>
      </div>
      
      <!-- 无内容时的居中输入区域 -->
      <div v-if="historyResults.length === 0 && generationTasks.length === 0" class="centered-input-section">
        <!-- 主标题 -->
        <div class="page-header">
          <div class="header-content">
            <!-- <div class="header-icon">
              <el-icon class="main-icon"><Picture /></el-icon>
            </div> -->
            <h1 class="header-title">开启属于你的MobgiAI创作</h1>
          </div>
        </div>
        
        <!-- 上传图片预览列表 - 放在页面头部下方，使用统一样式 -->
        <div v-if="referenceImages.length > 0" class="upload-preview-section compact">
          <div class="preview-label">参考图片 ({{ referenceImages.length }}/{{ getMaxImageCount() }})</div>
          <div class="upload-preview-list">
            <div 
              v-for="(image, index) in referenceImages" 
              :key="index"
              class="upload-preview-item"
              @click="previewUploadImage(image.url)"
            >
              <img 
                :src="image.url" 
                alt="参考图"
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
                <template v-if="!currentModel?.aiDriver?.includes('klingai-O1-video') || selectedKeLingOption === '首尾帧'">
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
                          <el-button 
                            v-if="firstFrameImage"
                            type="danger" 
                            size="small" 
                            circle
                            @click.stop="removeFirstFrameImage"
                            class="remove-btn-corner"
                          >
                            <el-icon><Close /></el-icon>
                          </el-button>
                        </div>
                      </el-upload>
                    </div>
                    <template v-if="currentModel?.aiDriver!='klingai-V2-video'">
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
                            <el-button 
                              v-if="lastFrameImage"
                              type="danger" 
                              size="small" 
                              circle
                              @click.stop="removeLastFrameImage"
                              class="remove-btn-corner"
                            >
                              <el-icon><Close /></el-icon>
                            </el-button>
                          </div>
                        </el-upload>
                      </div>
                    </template>
                  </div>
                </template>

                <!-- 多模态参考模式和视频编辑模式 -->
                <template v-else-if="((selectedKeLingOption === '多模态参考' || selectedKeLingOption === '视频编辑')&& currentModel?.aiDriver=='klingai-O1-video')">
                  <div class="video-upload-multimodal">
                    <!-- 传视频区域 -->
                    <div class="upload-item">
                      <el-upload
                        :show-file-list="false"
                        :before-upload="handleVideoUpload"
                        accept="video/*"
                        class="frame-uploader"
                        :disabled="isVideoUploading"
                      >
                        <div class="upload-area-video" :class="{ 'has-video': referenceVideo, 'uploading': isVideoUploading }">
                          <div v-if="referenceVideo && !isVideoUploading" class="video-preview-wrapper" @click.stop="previewReferenceVideo(referenceVideo)">
                            <video :src="referenceVideo" class="uploaded-video" muted />
                            <div class="video-play-overlay">
                              <el-icon size="32" class="play-icon"><VideoPlay /></el-icon>
                            </div>
                          </div>
                          <div v-else-if="isVideoUploading" class="upload-progress-overlay">
                            <div class="progress-ring">
                              <svg class="progress-svg" viewBox="0 0 36 36">
                                <circle class="progress-bg" cx="18" cy="18" r="16" />
                                <circle 
                                  class="progress-bar" 
                                  cx="18" 
                                  cy="18" 
                                  r="16"
                                  :style="{ strokeDashoffset: 100 - videoUploadProgress }"
                                />
                              </svg>
                              <span class="progress-percent">{{ videoUploadProgress }}%</span>
                            </div>
                          </div>
                          <div v-else class="upload-placeholder-video">
                            <el-icon size="24"><VideoCamera /></el-icon>
                          </div>
                          <el-button 
                            v-if="referenceVideo && !isVideoUploading"
                            type="danger" 
                            size="small" 
                            circle
                            @click.stop="removeReferenceVideo"
                            class="remove-btn-corner"
                          >
                            <el-icon><Close /></el-icon>
                          </el-button>
                        </div>
                      </el-upload>
                    </div>

                    <!-- 传图片区域 -->
                    <div class="images-upload-section">
                      <div class="images-container">
                        <!-- 上传框 -->
                        <el-upload
                          :show-file-list="false"
                          :before-upload="handleReferenceImageUpload"
                          accept="image/*"
                          class="frame-uploader"
                          :disabled="videoReferenceImages.filter(img => img).length >= 4"
                        >
                          <div class="upload-area-image" :class="{ 'disabled': videoReferenceImages.filter(img => img).length >= 4 }">
                            <div class="upload-placeholder-image">
                              <svg class="placeholder-icon-small" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
                                <path d="M928 160H96c-17.7 0-32 14.3-32 32v640c0 17.7 14.3 32 32 32h832c17.7 0 32-14.3 32-32V192c0-17.7-14.3-32-32-32zM338 304c35.3 0 64 28.7 64 64s-28.7 64-64 64-64-28.7-64-64 28.7-64 64-64zm513.9 437.1c-2.4 5.2-7.9 8.9-13.9 8.9H186c-6.6 0-12.6-4.1-15-10.3-2.3-6.2-0.8-13.1 4-17.5l167.4-151.8c3.7-3.4 9.4-3.4 13.1 0l100.6 91.2 219.3-198.9c3.7-3.4 9.4-3.4 13.1 0l232.5 211c4.8 4.4 6.3 11.3 3.9 17.4z" fill="currentColor"/>
                              </svg>
                              <span class="upload-count">{{ videoReferenceImages.filter(img => img).length }}/4</span>
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
                              <img :src="convertToProxyUrl(image)" class="thumbnail-image" />
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

                <!-- 通用参考图片上传（其他视频模式） -->
                <template v-else>
                  <el-upload
                    :file-list="[]"
                    :auto-upload="false"
                    :limit="4"
                    accept="image/*"
                    :show-file-list="false"
                    class="image-uploader"
                    @change="handleImageUpload"
                    :disabled="referenceImages.length >= 4"
                  >
                    <div class="upload-btn large" :class="{ disabled: referenceImages.length >= 4 }">
                      <el-icon><Plus /></el-icon>
                    </div>
                  </el-upload>
                </template>
              </template>
            </div>
            
            <!-- 文本输入 -->
            <div class="text-input-section">
              <el-input
                v-model="prompt"
                type="textarea"
                :rows="1"
                :autosize="false"
                :placeholder="currentGenerateMode?.value === 'video' ? '请描述您想要生成的视频内容...' : '请描述您想要生成的图片内容...'"
                class="main-input"
                :maxlength="inputSize"
                show-word-limit
                @keydown.enter.exact="handleGenerate"
              />
            </div>
          </div>
          
          <!-- 下半部分：参数选择 -->
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
                      <img v-if="currentModel?.iconUrl" :src="currentModel.iconUrl" class="model-icon-img" alt="model icon" />
                      <div v-else class="model-dot" style="background: #4A90E2;"></div>
                    </div>
                    <span>{{ currentModel?.name }}</span>
                    <el-icon class="arrow-icon"><ArrowDown /></el-icon>
                  </div>
                </template>
                <div class="model-selector">
                  <div class="selector-header">选择生成模型</div>
                  <div class="model-list">
                    <div 
                      v-for="model in models" 
                      :key="model.aiDriver"
                      class="model-item"
                      :class="{ active: currentModel?.aiDriver === model.aiDriver }"
                      @click="selectModel(model)"
                    >
                      <div class="model-info">
                        <div class="model-avatar-wrapper">
                          <img v-if="model.iconUrl" :src="model.iconUrl" class="model-avatar-img" alt="model icon" />
                          <div v-else class="model-avatar" style="background: #4A90E2;">
                            <span class="model-initial">{{ model.name.charAt(0) }}</span>
                          </div>
                        </div>
                        <div class="model-details">
                          <div class="model-name">{{ model.name }}</div>
                          <div class="model-desc">{{ model.desc }}</div>
                        </div>
                      </div>
                      <div v-if="currentModel?.aiDriver === model.aiDriver" class="check-icon">
                        <el-icon><Check /></el-icon>
                      </div>
                    </div>
                  </div>
                </div>
              </el-popover>

              <!-- referType参考类型(可灵模型)的特殊选项 (仅在视频生成且选择可灵模型时显示) -->
              <el-popover
                v-if="keLingOptions.length>0"
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
                  <div class="selector-header">参考类型</div>
                  <div class="option-list">
                    <div 
                      v-for="option in keLingOptions" 
                      :key="option.value"
                      class="option-item"
                      :class="{ active: selectedKeLingOption === option.label }"
                      @click="selectKeLingOption(option)"
                    >
                      <div class="option-info">
                        <div class="option-name">{{ option.label }}</div>
                        <div class="option-desc">{{ option.description }}</div>
                      </div>
                      <div v-if="selectedKeLingOption === option.label" class="check-icon">
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
                    <span>{{ currentSize?.value }}{{ currentResolution?.value?' | '+currentResolution?.value:'' }}{{ currentImageCount?.value?' | '+currentImageCount?.value:'' }}张</span>
                    <el-icon class="arrow-icon"><ArrowDown /></el-icon>
                  </div>
                </template>
                <div class="image-params-selector">
                  <div class="selector-header" v-if="imageSizes.length>0">选择比例</div>
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
                  
                  <!-- 分辨率选择：所有模型都显示（只要有值） -->
                  <template v-if="resolutions && resolutions.length > 0">
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
                  </template>
                  
                  <!-- 尺寸显示：只在非可灵模型时显示 -->
                  <template v-if="!currentModel?.aiDriver?.toLowerCase().includes('klingai') && !currentModel?.aiDriver?.toLowerCase().includes('keling')">
                    <div class="selector-header">尺寸</div>
                    <div class="size-display">
                      <div class="size-input-group">
                      <span class="size-label">W</span>
                      <div class="size-value">{{ getCalculatedSize().width }}</div>
                      <span class="size-connector">⟷</span>
                      <span class="size-label">H</span>
                      <div class="size-value">{{ getCalculatedSize().height }}</div>
                      <span class="size-unit">PX</span>
                      </div>
                    </div>
                  </template>
                  
                  <div class="selector-header" v-if="imageCounts.length>0">图片张数</div>
                  <div class="count-options">
                    <div 
                      v-for="count in imageCounts" 
                      :key="count.value"
                      class="count-option"
                      :class="{ active: currentImageCount?.value === count.value }"
                      @click="selectImageCount(count)"
                    >
                      <span>{{ count.label }}张</span>
                    </div>
                  </div>
                  
                  <!-- <div class="selector-footer">
                    <el-button 
                      type="primary" 
                      size="small" 
                      @click="imageParamsPopoverRef?.hide()"
                      class="done-btn"
                    >
                      完成
                    </el-button>
                  </div> -->
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
                  <div class="config-group" v-if="hasEnableAudio">
                    <div class="config-title">同时生成声音</div>
                    <div class="audio-options">
                      <el-button 
                        :class="['audio-btn', { active: enableAudio ==='yes' }]"
                        @click="selectAudio('yes')"
                      >
                        开启
                      </el-button>
                      <el-button 
                        :class="['audio-btn', { active: enableAudio === 'no' }]"
                        @click="selectAudio('no')"
                      >
                        关闭
                      </el-button>
                    </div>
                  </div>

                  <div class="config-group" v-if="videoRatios.length > 0 ">
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

                  <div class="config-group" v-if="videoQualities.length > 0">
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

                  <div class="config-group" v-if="videoDurations.length > 0 && selectedKeLingOption !== '视频编辑'">
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
                  <div class="config-group" v-if="keepOriginalAudioOptions.length > 0 && referenceVideo">
                    <div class="config-title">保留视频原声</div>
                    <div class="audio-options">
                      <el-button 
                        v-for="option in keepOriginalAudioOptions"
                        :key="option.value"
                        :class="['audio-btn', { active: keepOriginalAudio === option.value }]"
                        @click="selectKeepOriginalAudio(option)"
                      >
                        {{ option.label }}
                      </el-button>
                    </div>
                  </div>

                  <div class="config-group" v-if="generationModes.length > 0">
                    <div class="config-title">生成模式</div>
                    <div class="audio-options">
                      <el-button 
                        v-for="mode in generationModes"
                        :key="mode.value"
                        :class="['audio-btn', { active: generationMode === mode.value }]"
                        @click="selectGenerationMode(mode)"
                      >
                        {{ mode.label }}
                      </el-button>
                    </div>
                  </div>
                  <!-- <div class="selector-footer">
                    <el-button 
                      type="primary" 
                      size="small" 
                      @click="videoParamsPopoverRef?.hide()"
                      class="done-btn"
                    >
                      完成
                    </el-button>
                  </div> -->
                </div>
              </el-popover>
            </div>
            
            <!-- 生成按钮 - 放在参数区域右侧 -->
            <div class="generate-section-inline">
              <el-button 
                type="primary" 
                :loading="generationTasks.length >= maxConcurrentTasks"
                :disabled="!prompt.trim() || generationTasks.length >= maxConcurrentTasks || (selectedKeLingOption === '视频编辑' && !referenceVideo)"
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
        <!-- 筛选器区域 - 悬浮在右上角 -->
        <div v-if="historyResults.length > 0 || generationTasks.length > 0" class="filter-section-floating">
          <div class="filter-container">
            <!-- 时间筛选 -->
            <el-popover
              ref="timeFilterPopoverRef"
              placement="bottom-end"
              :width="360"
              trigger="click"
              popper-class="time-filter-popover"
              :teleported="true"
              :visible="timeFilterVisible"
              @update:visible="handleTimeFilterVisibleChange"
            >
              <template #reference>
                <div class="filter-btn-floating">
                  <span>时间</span>
                  <el-icon class="arrow-icon"><ArrowDown /></el-icon>
                </div>
              </template>
              <div class="time-filter-content" @click.stop>
                <!-- 日期范围选择 -->
                <div class="date-range-section">
                  <el-date-picker
                    v-model="startDate"
                    type="date"
                    placeholder="开始日期"
                    class="date-picker"
                    :clearable="true"
                    format="YYYY-MM-DD"
                    value-format="YYYY-MM-DD"
                    :disabled-date="disabledStartDate"
                    @change="handleStartDateChange"
                    @visible-change="handleDatePickerVisibleChange"
                  />
                  <span class="date-separator">-</span>
                  <el-date-picker
                    v-model="endDate"
                    type="date"
                    placeholder="结束日期"
                    class="date-picker"
                    :clearable="true"
                    format="YYYY-MM-DD"
                    value-format="YYYY-MM-DD"
                    :disabled-date="disabledEndDate"
                    @change="handleEndDateChange"
                    @visible-change="handleDatePickerVisibleChange"
                  />
                </div>
                
                <!-- 快捷选项 -->
                <div class="quick-options">
                  <div 
                    class="option-item"
                    :class="{ active: selectedTimeRange === 'all' }"
                    @click="selectTimeRange('all')"
                  >
                    <span>全部</span>
                    <el-icon v-if="selectedTimeRange === 'all'" class="check-icon"><Check /></el-icon>
                  </div>
                  <div 
                    class="option-item"
                    :class="{ active: selectedTimeRange === 'week' }"
                    @click="selectTimeRange('week')"
                  >
                    <span>最近一周</span>
                    <el-icon v-if="selectedTimeRange === 'week'" class="check-icon"><Check /></el-icon>
                  </div>
                  <div 
                    class="option-item"
                    :class="{ active: selectedTimeRange === 'month' }"
                    @click="selectTimeRange('month')"
                  >
                    <span>最近三个月</span>
                    <el-icon v-if="selectedTimeRange === 'month'" class="check-icon"><Check /></el-icon>
                  </div>
                </div>
                
                <!-- 应用按钮 -->
                <div v-if="startDate || endDate" class="filter-actions">
                  <el-button 
                    type="primary" 
                    size="small" 
                    @click="applyDateFilter"
                    :disabled="!startDate || !endDate"
                    class="apply-btn"
                  >
                    应用筛选
                  </el-button>
                </div>
              </div>
            </el-popover>

            <div class="filter-divider-floating"></div>

            <!-- 生成类型筛选 -->
            <el-popover
              ref="typeFilterPopoverRef"
              placement="bottom-end"
              :width="240"
              trigger="click"
              popper-class="type-filter-popover"
              :teleported="true"
              :visible="typeFilterVisible"
              @update:visible="(val: boolean) => typeFilterVisible = val"
            >
              <template #reference>
                <div class="filter-btn-floating">
                  <span>生成类型</span>
                  <el-icon class="arrow-icon"><ArrowDown /></el-icon>
                </div>
              </template>
              <div class="type-filter-content">
                <div 
                  class="type-option"
                  :class="{ active: selectedType === 'all' }"
                  @click="selectType('all')"
                >
                  <span>全部</span>
                  <el-icon v-if="selectedType === 'all'" class="check-icon"><Check /></el-icon>
                </div>
                <div 
                  class="type-option"
                  :class="{ active: selectedType === 'image' }"
                  @click="selectType('image')"
                >
                  <span>图片</span>
                  <el-icon v-if="selectedType === 'image'" class="check-icon"><Check /></el-icon>
                </div>
                <div 
                  class="type-option"
                  :class="{ active: selectedType === 'video' }"
                  @click="selectType('video')"
                >
                  <span>视频</span>
                  <el-icon v-if="selectedType === 'video'" class="check-icon"><Check /></el-icon>
                </div>
              </div>
            </el-popover>
          </div>
        </div>

        <!-- 生成结果 - 新布局 -->
        <div v-if="historyResults.length > 0 || generationTasks.length > 0" class="results-display" ref="resultsDisplayRef">
          <!-- 滚动哨兵元素 - 用于触发上拉加载，放在顶部 -->
          <!-- 始终渲染哨兵元素，但在加载时改变样式 -->
          <div v-if="hasMore" class="scroll-sentinel" :class="{ 'loading': loadingMore }" style="height: 50px; background: rgba(255,0,0,0.1);">
            <div v-if="loadingMore" class="loading-more">
              <el-icon class="is-loading"><Loading /></el-icon>
              <span>加载中...</span>
            </div>
          </div>
          
          <!-- 移除独立的加载提示，合并到哨兵元素中 -->
          
          <!-- 没有更多数据提示 - 放在顶部 -->
          <div v-if="!hasMore && historyResults.length > 0" class="no-more-data">
            <span>没有更多数据了</span>
          </div>

          <!-- 遍历历史结果列表 -->
          <div 
            v-for="result in historyResults" 
            :key="result.id"
            class="generation-card"
            :class="{ 
              'generation-failed': result.status === 3,
              'generation-processing': result.status === 1,
              'generation-queuing': result.status === 0
            }"
          >
            <!-- 上部分：缩略图和描述 -->
            <div class="generation-header">
              <!-- 只在有参考图或参考视频时显示缩略图 -->
              <div 
                v-if="getReferenceImages(result).length > 0"
                class="generation-thumbnail-wrapper"
              >
                
                <!-- 照片堆叠容器 -->
                <div class="photos-stack">
                  <!-- 正常状态 (status === 2) - 显示参考图片，最多5张 -->
                  <template v-if="result.status === 2">
                    <div 
                      v-for="(refImg, idx) in getReferenceImages(result).slice(0, 5)" 
                      :key="idx"
                      class="photo-item"
                      :class="`photo-${idx + 1}`"
                    >
                      <!-- 如果是视频URL（第一个且是参考视频），使用video标签 -->
                      <video
                        v-if="idx === 0 && result.tags?.find(t => t.key === 'uploadVideo')?.showVal === refImg"
                        :src="convertToProxyUrl(refImg)"
                        class="photo-image"
                        crossorigin="anonymous"
                        muted
                        preload="metadata"
                      />
                      <!-- 否则使用img标签 -->
                      <img
                        v-else
                        :src="convertToProxyUrl(refImg)"
                        alt="参考图"
                        class="photo-image"
                        crossorigin="anonymous"
                      />
                    </div>
                  </template>
                  
                  <!-- 排队中状态 (status === 0) -->
                  <div v-else-if="result.status === 0" class="photo-item photo-1 status-photo">
                    <div class="status-placeholder queuing-state">
                      <el-icon size="32" class="status-icon">
                        <VideoCamera v-if="result.type === 2" />
                        <Picture v-else />
                      </el-icon>
                      <div class="status-badge queuing-badge">
                        <el-icon size="16"><Clock /></el-icon>
                      </div>
                    </div>
                  </div>
                  
                  <!-- 生成中状态 (status === 1) -->
                  <div v-else-if="result.status === 1" class="photo-item photo-1 status-photo">
                    <div class="status-placeholder processing-state">
                      <el-icon size="32" class="status-icon">
                        <VideoCamera v-if="result.type === 2" />
                        <Picture v-else />
                      </el-icon>
                      <div class="status-badge processing-badge">
                        <el-icon size="16" class="rotating"><Loading /></el-icon>
                      </div>
                    </div>
                  </div>
                  
                  <!-- 生成失败状态 (status === 3) -->
                  <div v-else-if="result.status === 3" class="photo-item photo-1 status-photo">
                    <div class="status-placeholder failed-state">
                      <el-icon size="32" class="status-icon">
                        <VideoCamera v-if="result.type === 2" />
                        <Picture v-else />
                      </el-icon>
                      <div class="status-badge failed-badge">
                        <el-icon size="16"><CircleClose /></el-icon>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="generation-info">
                <div class="generation-prompt-wrapper">
                  <div 
                    class="generation-prompt" 
                    :class="{ 
                      'long-prompt': (result.prompt || result.tags?.find(t => t.key === 'prompt')?.val || '').length > 100,
                      'expanded': result.promptExpanded 
                    }"
                    @click="(result.prompt || result.tags?.find(t => t.key === 'prompt')?.val || '').length > 100 ? (result.promptExpanded = !result.promptExpanded) : null"
                  >
                    {{ (result.prompt || result.tags?.find(t => t.key === 'prompt')?.val || '暂无描述').substring(0, 2000) }}
                  </div>
                  <!-- 展开按钮 -->
                  <div 
                    v-if="(result.prompt || result.tags?.find(t => t.key === 'prompt')?.val || '').length > 100 && !result.promptExpanded" 
                    class="prompt-expand-hint"
                    @click="result.promptExpanded = true"
                  >
                    <el-icon size="12"><ArrowDown /></el-icon>
                  </div>
                  <!-- 收起按钮 -->
                  <div 
                    v-if="(result.prompt || result.tags?.find(t => t.key === 'prompt')?.val || '').length > 100 && result.promptExpanded" 
                    class="prompt-collapse-hint"
                    @click="result.promptExpanded = false"
                  >
                    <el-icon size="12"><ArrowUp /></el-icon>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- 中部分:模型标签等信息 -->
            <div class="generation-meta">
              <div class="meta-tags">
                <!-- AI模型标签 -->
                <span class="meta-tag model-tag ai-model-tag">
                  <svg class="tag-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                  {{ result.tags?.find(t => t.key === 'aiDriver')?.val || 'AI模型' }}
                </span>
                
                <!-- 图片张数标签 -->
                <span class="meta-tag model-tag count-tag" v-if="result.tags?.find(t => t.key === 'genImageNum')?.val">
                  <svg class="tag-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" stroke-width="2"/>
                    <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" stroke-width="2"/>
                    <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" stroke-width="2"/>
                    <rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" stroke-width="2"/>
                  </svg>
                  {{ result.tags?.find(t => t.key === 'genImageNum')?.val }}张
                </span>
                
                <!-- 画质标签 -->
                <span class="meta-tag quality-tag" v-if="result.tags?.find(t => t.key === 'resolutionRatio')?.val">
                  <svg class="tag-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                  {{ result.tags?.find(t => t.key === 'resolutionRatio')?.val }}画质
                </span>
                
                <!-- 尺寸比例标签 -->
                <span class="meta-tag ratio-tag" v-if="result.tags?.find(t => t.key === 'aspectRatio')?.val">
                  <svg class="tag-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" stroke-width="2"/>
                    <path d="M3 9H21" stroke="currentColor" stroke-width="2"/>
                    <path d="M9 3V21" stroke="currentColor" stroke-width="2"/>
                  </svg>
                  {{ result.tags?.find(t => t.key === 'aspectRatio')?.val }}
                </span>
                
                <!-- 视频时长标签 -->
                <span class="meta-tag duration-tag" v-if="result.type === 2 && result.tags?.find(t => t.key === 'duration')?.val">
                  <svg class="tag-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                    <path d="M12 6V12L16 14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                  </svg>
                  {{ result.tags?.find(t => t.key === 'duration')?.val }}秒
                </span>
                
                <!-- 状态标签 -->
                <span v-if="result.status === 0" class="meta-tag status-tag queuing">
                  <svg class="tag-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2V6M12 18V22M4.93 4.93L7.76 7.76M16.24 16.24L19.07 19.07M2 12H6M18 12H22M4.93 19.07L7.76 16.24M16.24 7.76L19.07 4.93" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                  </svg>
                  排队中
                </span>
                <span v-else-if="result.status === 1" class="meta-tag status-tag processing">
                  <svg class="tag-icon spinning" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2V6M12 18V22M4.93 4.93L7.76 7.76M16.24 16.24L19.07 19.07M2 12H6M18 12H22M4.93 19.07L7.76 16.24M16.24 7.76L19.07 4.93" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                  </svg>
                  生成中
                </span>
                <span v-else-if="result.status === 3" class="meta-tag status-tag failed">
                  <svg class="tag-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                    <path d="M15 9L9 15M9 9L15 15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                  </svg>
                  生成失败
                </span>
                
                <!-- 时间标签 -->
                <span class="meta-tag time-tag">
                  <svg class="tag-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                    <path d="M12 6V12L16 14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                  </svg>
                  {{ formatTime(result.createdAt || new Date(result.createTime).getTime()) }}
                </span>
              </div>
            </div>
            
            <!-- 下部分：生成内容 - 根据 status 显示不同内容 -->
            <!-- 排队中状态显示 (status === 0) -->
            <div v-if="result.status === 0" class="generation-images queuing-content">
              <div class="queuing-message">
                <div class="queuing-icon-large">
                  <el-icon size="48">
                    <VideoCamera v-if="result.type === 2" />
                    <Picture v-else />
                  </el-icon>
                  <div class="clock-badge">
                    <el-icon size="24"><Clock /></el-icon>
                  </div>
                </div>
                <div class="queuing-info">
                  <div class="queuing-title">{{ result.type === 2 ? '视频' : '图片' }}排队中</div>
                  <div class="queuing-desc">正在等待处理，请稍候...</div>
                </div>
              </div>
            </div>
            
            <!-- 生成中状态显示 (status === 1) -->
            <div v-else-if="result.status === 1" class="generation-images processing-content">
              <div class="processing-message">
                <div class="processing-icon-large">
                  <el-icon size="48">
                    <VideoCamera v-if="result.type === 2" />
                    <Picture v-else />
                  </el-icon>
                  <div class="loading-badge">
                    <el-icon size="24" class="rotating"><Loading /></el-icon>
                  </div>
                </div>
                <div class="processing-info">
                  <div class="processing-title">{{ result.type === 2 ? '视频' : '图片' }}生成中</div>
                  <div class="processing-desc">正在努力创作中，请稍候...</div>
                  <div class="processing-dots">
                    <span class="dot"></span>
                    <span class="dot"></span>
                    <span class="dot"></span>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- 失败状态显示 (status === 3) -->
            <div v-else-if="result.status === 3" class="generation-images failed-content">
              <div class="failed-message">
                <div class="failed-icon-large">
                  <el-icon size="48">
                    <VideoCamera v-if="result.type === 2" />
                    <Picture v-else />
                  </el-icon>
                  <div class="error-badge">
                    <el-icon size="24"><CircleClose /></el-icon>
                  </div>
                </div>
                <div class="failed-info">
                  <div class="failed-title">{{ result.type === 2 ? '视频' : '图片' }}生成失败</div>
                  <div class="failed-desc">请检查参数设置或稍后重试</div>
                </div>
              </div>
            </div>
            
            <!-- 图片结果显示 (status === 2) -->
            <div v-else-if="result.type === 1" class="generation-images" :class="result.assets && result.assets.filter(a => a.type === 1).length > 0 ? `count-${result.assets.filter(a => a.type === 1).length}` : 'count-1'">
              <!-- 有图片资源时显示图片 -->
              <template v-if="result.assets && result.assets.filter(a => a.type === 1).length > 0">
                <div 
                  v-for="(asset, imgIndex) in result.assets.filter(a => a.type === 1)" 
                  :key="asset.id"
                  class="generation-image-item"
                  :class="getRatioClass(result.tags?.find(t => t.key === 'aspectRatio')?.val || '1:1')"
                  @click="previewImage(asset.materialUrl||asset.coverUrl, asset, result.prompt || result.tags?.find(t => t.key === 'prompt')?.val, result)"
                >
                  <div class="image-wrapper">
                    <img :src="convertToProxyUrl(asset.coverUrl||asset.materialUrl)" :alt="`生成的图片 ${imgIndex + 1}`" class="generated-image" crossorigin="anonymous" />
                    <div class="image-overlay">
                      <div class="overlay-actions">
                        <el-button 
                          type="primary" 
                          size="small" 
                          circle
                          @click.stop="downloadImageUrl(asset.materialUrl || asset.coverUrl, result.id, imgIndex)"
                          class="action-btn"
                        >
                          <el-icon><Download /></el-icon>
                        </el-button>
                      </div>
                    </div>
                  </div>
                </div>
              </template>
              <!-- 没有图片资源时显示缺省图 -->
              <template v-else>
                <div class="generation-image-item no-asset-item" :class="getRatioClass(result.tags?.find(t => t.key === 'aspectRatio')?.val || '1:1')">
                  <div class="image-wrapper no-asset-wrapper">
                    <div class="no-asset-placeholder">
                      <el-icon size="64" class="no-asset-icon"><Picture /></el-icon>
                      <div class="no-asset-text">无图片资源</div>
                      <div class="no-asset-desc">生成完成但未返回图片数据</div>
                    </div>
                  </div>
                </div>
              </template>
            </div>

            <!-- 视频结果显示 -->
            <div v-else-if="result.type === 2" class="generation-images video-result-container">
              <!-- 有视频资源时显示视频 -->
              <template v-if="result.assets?.find(a => a.type === 2)">
                <div class="generation-image-item video-result-item single-video" @click="previewVideo(result.assets.find(a => a.type === 2)?.materialUrl || '', result.assets.find(a => a.type === 2), result.prompt || result.tags?.find(t => t.key === 'prompt')?.val, result)">
                  <div class="image-wrapper video-wrapper" :class="getRatioClass(result.tags?.find(t => t.key === 'aspectRatio')?.val || '16:9')">
                    <video 
                      :src="convertToProxyUrl(result.assets.find(a => a.type === 2)?.materialUrl)" 
                      class="generated-image generated-video"
                      muted
                      preload="metadata"
                      crossorigin="anonymous"
                      @mouseenter="handleVideoHover"
                      @mouseleave="handleVideoLeave"
                    >
                    </video>
                    <div class="image-overlay video-overlay">
                      <div class="play-button">
                        <el-icon size="24"><VideoPlay /></el-icon>
                      </div>
                    </div>
                  </div>
                </div>
              </template>
              <!-- 没有视频资源时显示缺省图 -->
              <template v-else>
                <div class="generation-image-item video-result-item single-video no-asset-item" :class="getRatioClass(result.tags?.find(t => t.key === 'aspectRatio')?.val || '16:9')">
                  <div class="image-wrapper video-wrapper no-asset-wrapper">
                    <div class="no-asset-placeholder">
                      <el-icon size="64" class="no-asset-icon"><VideoCamera /></el-icon>
                      <div class="no-asset-text">无视频资源</div>
                      <div class="no-asset-desc">生成完成但未返回视频数据</div>
                    </div>
                  </div>
                </div>
              </template>
            </div>
            
            <!-- 底部：操作按钮 -->
            <div class="generation-actions">
              <el-button class="action-button edit-button" @click="editGeneration(result)">
                <el-icon class="button-icon"><Edit /></el-icon>
                <span>重新编辑</span>
              </el-button>
              <el-button class="action-button regenerate-button" @click="regenerateFromHistory(result)">
                <el-icon class="button-icon"><Refresh /></el-icon>
                <span>再次生成</span>
              </el-button>
              <el-button v-if="result.type === 2 && result.assets?.find(a => a.type === 2)" class="action-button download-button" @click="downloadVideoUrl(result.assets.find(a => a.type === 2)?.materialUrl || '', result.id)">
                <el-icon class="button-icon"><Download /></el-icon>
                <span>下载</span>
              </el-button>
              <el-button class="action-button delete-button" @click="deleteHistoryItem(result.id)">
                <el-icon class="button-icon"><Delete /></el-icon>
                <span>删除</span>
              </el-button>
            </div>
          </div>
          
          <!-- 多任务生成中状态 - 在最底部显示 -->
          <div 
            v-for="task in generationTasks" 
            :key="task.id"
            class="generation-card generating"
            :class="{ 
              'generating-video': task.type === 2,
              'generating-image': task.type === 1
            }"
          >
            <!-- 上部分：缩略图和制作中状态 -->
            <div class="generation-header">
              <div class="generation-thumbnail generating-thumb" 
                   :class="{ 
                     'video-thumb': task.type === 2,
                     'image-thumb': task.type === 1
                   }">
                <div class="generating-placeholder">
                  <div class="icon-wrapper">
                    <el-icon class="placeholder-icon">
                      <VideoCamera v-if="task.type === 2" />
                      <Picture v-else />
                    </el-icon>
                    <div class="type-badge" :class="{ 'video-badge': task.type === 2 }">
                      <el-icon size="14"><Loading /></el-icon>
                    </div>
                  </div>
                </div>
              </div>
              <div class="generation-info">
                <div class="generation-status">
                  <span class="status-text" :class="{ 'video-status': task.type === 2 }">
                    {{ task.type === 2 ? '视频制作中...' : '图片生成中...' }}
                  </span>
                  <div class="status-progress">
                    <div class="progress-bar" 
                         :class="{ 'video-progress': task.type === 2 }"
                         :style="{ width: task.progress + '%' }"></div>
                  </div>
                </div>
                <div class="generation-prompt-wrapper">
                  <div 
                    class="generation-prompt" 
                    :class="{ 
                      'long-prompt': (task.prompt || '').length > 100,
                      'expanded': task.promptExpanded 
                    }"
                    @click="(task.prompt || '').length > 100 ? (task.promptExpanded = !task.promptExpanded) : null"
                  >
                    {{ (task.prompt || '正在生成您描述的内容...').substring(0, 2000) }}
                  </div>
                  <!-- 展开按钮 -->
                  <div 
                    v-if="(task.prompt || '').length > 100 && !task.promptExpanded" 
                    class="prompt-expand-hint"
                    @click="task.promptExpanded = true"
                  >
                    <el-icon size="12"><ArrowDown /></el-icon>
                  </div>
                  <!-- 收起按钮 -->
                  <div 
                    v-if="(task.prompt || '').length > 100 && task.promptExpanded" 
                    class="prompt-collapse-hint"
                    @click="task.promptExpanded = false"
                  >
                    <el-icon size="12"><ArrowUp /></el-icon>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- 中部分：模型标签等信息 -->
            <div class="generation-meta">
              <div class="meta-tags">
                <span class="meta-tag type-tag" 
                      :class="{ 
                        'video-type-tag': task.type === 2,
                        'image-type-tag': task.type === 1
                      }">
                  <el-icon size="12">
                    <VideoCamera v-if="task.type === 2" />
                    <Picture v-else />
                  </el-icon>
                  {{ task.type === 2 ? '视频' : '图片' }}
                </span>
                <span class="meta-tag model-tag">{{ task.model?.name }}</span>
                <span class="meta-tag size-tag" v-if="task.type === 2 && task.aspectRatio">比例：{{ task.aspectRatio?.label }}</span>
                <span class="meta-tag size-tag" v-if="task.type === 1">{{ task.size?.label }}</span>
                <span class="meta-tag status-tag generating" 
                      :class="{ 'video-generating': task.type === 2 }">
                  {{ task.progressText }}
                </span>
              </div>
            </div>
            
            <!-- 下部分：待生成的模型图缺省图 -->
            <div class="generation-images generating-preview">
              <div class="generation-image-item generating-item" 
                   :class="[
                     { 'video-item': task.type === 2 },
                     getRatioClass(task.aspectRatio?.value || (task.type === 2 ? '16:9' : '1:1'))
                   ]">
                <div class="image-wrapper">
                  <div class="generating-placeholder-image" 
                       :class="{ 'video-placeholder': task.type === 2 }">
                    <div class="placeholder-content">
                      <el-icon class="placeholder-icon">
                        <VideoCamera v-if="task.type === 2" />
                        <Picture v-else />
                      </el-icon>
                      <div class="placeholder-text">
                        {{ task.type === 2 ? '视频生成中' : '图片生成中' }}
                      </div>
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
    </div>

    <!-- 有内容时的底部悬浮输入面板 -->
    <div v-if="historyResults.length > 0 || generationTasks.length > 0" class="floating-input-panel" :class="getPanelClass()">
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
                <div class="upload-btn-placeholder small" :class="{ disabled: referenceImages.length >= 5 }">
                  <svg class="placeholder-icon" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
                    <path d="M928 160H96c-17.7 0-32 14.3-32 32v640c0 17.7 14.3 32 32 32h832c17.7 0 32-14.3 32-32V192c0-17.7-14.3-32-32-32zM338 304c35.3 0 64 28.7 64 64s-28.7 64-64 64-64-28.7-64-64 28.7-64 64-64zm513.9 437.1c-2.4 5.2-7.9 8.9-13.9 8.9H186c-6.6 0-12.6-4.1-15-10.3-2.3-6.2-0.8-13.1 4-17.5l167.4-151.8c3.7-3.4 9.4-3.4 13.1 0l100.6 91.2 219.3-198.9c3.7-3.4 9.4-3.4 13.1 0l232.5 211c4.8 4.4 6.3 11.3 3.9 17.4z" fill="currentColor"/>
                  </svg>
                </div>
              </el-upload>
            </template>

            <!-- 视频生成模式的上传 -->
            <template v-else-if="currentGenerateMode?.value === 'video'">
              <!-- 首尾帧模式 -->
              <template v-if="!currentModel?.aiDriver?.includes('klingai-O1-video') || selectedKeLingOption === '首尾帧'">
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
                        <el-button 
                          v-if="firstFrameImage"
                          type="danger" 
                          size="small" 
                          circle
                          @click.stop="removeFirstFrameImage"
                          class="remove-btn-corner"
                        >
                          <el-icon><Close /></el-icon>
                        </el-button>
                      </div>
                    </el-upload>
                  </div>
                  <template v-if="currentModel?.aiDriver!='klingai-V2-video'">
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
                          <el-button 
                            v-if="lastFrameImage"
                            type="danger" 
                            size="small" 
                            circle
                            @click.stop="removeLastFrameImage"
                            class="remove-btn-corner"
                          >
                            <el-icon><Close /></el-icon>
                          </el-button>
                        </div>
                      </el-upload>
                    </div>
                  </template>
                </div>
              </template>

              <!-- 多模态参考模式和视频编辑模式 -->
              <template v-else-if="((selectedKeLingOption === '多模态参考' || selectedKeLingOption === '视频编辑')&& currentModel?.aiDriver=='klingai-O1-video')">
                <div class="video-upload-multimodal compact">
                  <!-- 传视频区域 -->
                  <div class="upload-item">
                    <el-upload
                      :show-file-list="false"
                      :before-upload="handleVideoUpload"
                      accept="video/*"
                      class="frame-uploader"
                      :disabled="isVideoUploading"
                    >
                      <div class="upload-area-video compact" :class="{ 'has-video': referenceVideo, 'uploading': isVideoUploading }">
                        <div v-if="referenceVideo && !isVideoUploading" class="video-preview-wrapper" @click.stop="previewReferenceVideo(referenceVideo)">
                          <video :src="referenceVideo" class="uploaded-video" muted />
                          <div class="video-play-overlay">
                            <el-icon size="24" class="play-icon"><VideoPlay /></el-icon>
                          </div>
                        </div>
                        <div v-else-if="isVideoUploading" class="upload-progress-overlay compact">
                          <div class="progress-ring compact">
                            <svg class="progress-svg" viewBox="0 0 36 36">
                              <circle class="progress-bg" cx="18" cy="18" r="16" />
                              <circle 
                                class="progress-bar" 
                                cx="18" 
                                cy="18" 
                                r="16"
                                :style="{ strokeDashoffset: 100 - videoUploadProgress }"
                              />
                            </svg>
                            <span class="progress-percent">{{ videoUploadProgress }}%</span>
                          </div>
                        </div>
                        <div v-else class="upload-placeholder-video compact">
                          <el-icon size="18"><VideoCamera /></el-icon>
                        </div>
                        <el-button 
                          v-if="referenceVideo && !isVideoUploading"
                          type="danger" 
                          size="small" 
                          circle
                          @click.stop="removeReferenceVideo"
                          class="remove-btn-corner"
                        >
                          <el-icon><Close /></el-icon>
                        </el-button>
                      </div>
                    </el-upload>
                  </div>

                  <!-- 传图片区域 -->
                  <div class="images-upload-section compact">
                    <div class="images-container">
                      <!-- 上传框 -->
                      <el-upload
                        :show-file-list="false"
                        :before-upload="handleReferenceImageUpload"
                        accept="image/*"
                        class="frame-uploader"
                        :disabled="videoReferenceImages.filter(img => img).length >= 4"
                      >
                        <div class="upload-area-image compact" :class="{ 'disabled': videoReferenceImages.filter(img => img).length >= 4 }">
                          <div class="upload-placeholder-image compact">
                            <svg class="placeholder-icon-small" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
                              <path d="M928 160H96c-17.7 0-32 14.3-32 32v640c0 17.7 14.3 32 32 32h832c17.7 0 32-14.3 32-32V192c0-17.7-14.3-32-32-32zM338 304c35.3 0 64 28.7 64 64s-28.7 64-64 64-64-28.7-64-64 28.7-64 64-64zm513.9 437.1c-2.4 5.2-7.9 8.9-13.9 8.9H186c-6.6 0-12.6-4.1-15-10.3-2.3-6.2-0.8-13.1 4-17.5l167.4-151.8c3.7-3.4 9.4-3.4 13.1 0l100.6 91.2 219.3-198.9c3.7-3.4 9.4-3.4 13.1 0l232.5 211c4.8 4.4 6.3 11.3 3.9 17.4z" fill="currentColor"/>
                            </svg>
                            <span class="upload-count">{{ videoReferenceImages.filter(img => img).length }}/4</span>
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
                            <img :src="convertToProxyUrl(image)" class="thumbnail-image" />
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

              <!-- 通用参考图片上传（其他视频模式） -->
              <template v-else>
                <el-upload
                  :file-list="[]"
                  :auto-upload="false"
                  :limit="4"
                  accept="image/*"
                  :show-file-list="false"
                  class="image-uploader"
                  @change="handleImageUpload"
                  :disabled="referenceImages.length >= 4"
                >
                  <div class="upload-btn-placeholder small" :class="{ disabled: referenceImages.length >= 4 }">
                    <svg class="placeholder-icon" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
                      <path d="M928 160H96c-17.7 0-32 14.3-32 32v640c0 17.7 14.3 32 32 32h832c17.7 0 32-14.3 32-32V192c0-17.7-14.3-32-32-32zM338 304c35.3 0 64 28.7 64 64s-28.7 64-64 64-64-28.7-64-64 28.7-64 64-64zm513.9 437.1c-2.4 5.2-7.9 8.9-13.9 8.9H186c-6.6 0-12.6-4.1-15-10.3-2.3-6.2-0.8-13.1 4-17.5l167.4-151.8c3.7-3.4 9.4-3.4 13.1 0l100.6 91.2 219.3-198.9c3.7-3.4 9.4-3.4 13.1 0l232.5 211c4.8 4.4 6.3 11.3 3.9 17.4z" fill="currentColor"/>
                    </svg>
                  </div>
                </el-upload>
              </template>
            </template>
          </div>
          
          <!-- 文本输入 -->
          <div class="text-input-section">
            <el-input
              v-model="prompt"
              type="textarea"
              :rows="1"
              :autosize="false"
              :placeholder="currentGenerateMode?.value === 'video' ? '请描述您想要生成的视频内容...' : '请描述您想要生成的图片内容...'"
              class="main-input compact"
              :maxlength="inputSize"
              show-word-limit
              @keydown.enter.exact="handleGenerate"
            />
          </div>
        </div>

        <!-- 悬浮面板中的上传图片预览列表 -->
        <div v-if="referenceImages.length > 0" class="upload-preview-section compact">
          <div class="preview-label">参考图片 ({{ referenceImages.length }}/{{ getMaxImageCount() }})</div>
          <div class="upload-preview-list">
            <div 
              v-for="(image, index) in referenceImages" 
              :key="index"
              class="upload-preview-item"
              @click="previewUploadImage(image.url)"
            >
              <img 
                :src="image.url" 
                alt="参考图"
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
                  <span>{{ currentGenerateMode?.label }}</span>
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
                    <img v-if="currentModel?.iconUrl" :src="currentModel.iconUrl" class="model-icon-img" alt="model icon" />
                    <div v-else class="model-dot" style="background: #4A90E2;"></div>
                  </div>
                  <span>{{ currentModel?.name}}</span>
                  <el-icon class="arrow-icon"><ArrowDown /></el-icon>
                </div>
              </template>
              <div class="model-selector">
                <div class="selector-header">选择模型</div>
                <div class="model-list">
                  <div 
                    v-for="model in models" 
                    :key="model.aiDriver"
                    class="model-item"
                    :class="{ active: currentModel?.aiDriver === model.aiDriver }"
                    @click="selectModel(model)"
                  >
                    <div class="model-info">
                      <div class="model-icon">
                        <img v-if="model.iconUrl" :src="model.iconUrl" class="icon-circle-img" alt="model icon" />
                        <div v-else class="icon-circle" style="background: #4A90E2;"></div>
                      </div>
                      <div class="model-details">
                        <div class="model-name">{{ model.name }}</div>
                        <div class="model-desc">{{ model.desc }}</div>
                      </div>
                    </div>
                    <div v-if="currentModel?.aiDriver === model.aiDriver" class="check-icon">
                      <el-icon><Check /></el-icon>
                    </div>
                  </div>
                </div>
              </div>
            </el-popover>

            <!-- 参考类型 可灵模型的特殊选项 (仅在视频生成且选择可灵模型时显示) -->
            <el-popover
              v-if="keLingOptions.length>0"
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
                <div class="selector-header">参考类型</div>
                <div class="option-list">
                  <div 
                    v-for="option in keLingOptions" 
                    :key="option.value"
                    class="option-item"
                    :class="{ active: selectedKeLingOption === option.label }"
                    @click="selectKeLingOption(option)"
                  >
                    <div class="option-info">
                      <div class="option-name">{{ option.label }}</div>
                      <!-- <div class="option-desc">{{ option.description }}</div> -->
                    </div>
                    <div v-if="selectedKeLingOption === option.label" class="check-icon">
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
                  <span>{{ currentSize?.value }}{{ currentResolution?.value?' | '+currentResolution?.value:'' }}{{ currentImageCount?.value?' | '+currentImageCount?.value:'' }}张</span>
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
                
                <!-- 分辨率选择：所有模型都显示（只要有值） -->
                <template v-if="resolutions && resolutions.length > 0">
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
                </template>
                
                <!-- 尺寸显示：只在非可灵模型时显示 -->
                <template v-if="!currentModel?.aiDriver?.toLowerCase().includes('klingai') && !currentModel?.aiDriver?.toLowerCase().includes('keling')">
                  <div class="selector-header">尺寸</div>
                  <div class="size-display">
                    <div class="size-input-group">
                      <span class="size-label">W</span>
                      <div class="size-value">{{ getCalculatedSize().width }}</div>
                      <span class="size-connector">⟷</span>
                      <span class="size-label">H</span>
                      <div class="size-value">{{ getCalculatedSize().height }}</div>
                      <span class="size-unit">PX</span>
                    </div>
                  </div>
                </template>
                
                <div class="selector-header" v-if="imageCounts.length>0">图片张数</div>
                <div class="count-options">
                  <div 
                    v-for="count in imageCounts" 
                    :key="count.value"
                    class="count-option"
                    :class="{ active: currentImageCount?.value === count.value }"
                    @click="selectImageCount(count)"
                  >
                    <span>{{ count.label }}张</span>
                  </div>
                </div>
                
                <!-- <div class="selector-footer">
                  <el-button 
                    type="primary" 
                    size="small" 
                    @click="panelImageParamsPopoverRef?.hide()"
                    class="done-btn"
                  >
                    完成
                  </el-button>
                </div> -->
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
                <div class="config-group" v-if="hasEnableAudio">
                  <div class="config-title">同时生成声音</div>
                  <div class="audio-options">
                    <el-button 
                      :class="['audio-btn', { active: enableAudio === 'yes' }]"
                      @click="selectAudio('yes')"
                    >
                      开启
                    </el-button>
                    <el-button 
                      :class="['audio-btn', { active: enableAudio === 'no' }]"
                      @click="selectAudio('no')"
                    >
                      关闭
                    </el-button>
                  </div>
                </div>

                <div class="config-group" v-if="keepOriginalAudioOptions.length > 0 && referenceVideo">
                  <div class="config-title">保留视频原声</div>
                  <div class="audio-options">
                    <el-button 
                      v-for="option in keepOriginalAudioOptions"
                      :key="option.value"
                      :class="['audio-btn', { active: keepOriginalAudio === option.value }]"
                      @click="selectKeepOriginalAudio(option)"
                    >
                      {{ option.label }}
                    </el-button>
                  </div>
                </div>

                <div class="config-group" v-if="generationModes.length > 0">
                  <div class="config-title">生成模式</div>
                  <div class="audio-options">
                    <el-button 
                      v-for="mode in generationModes"
                      :key="mode.value"
                      :class="['audio-btn', { active: generationMode === mode.value }]"
                      @click="selectGenerationMode(mode)"
                    >
                      {{ mode.label }}
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

                <div class="config-group" v-if="videoQualities.length>0">
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

                <div class="config-group" v-if="videoDurations.length > 0 && selectedKeLingOption !== '视频编辑'">
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
                
                <!-- <div class="selector-footer">
                  <el-button 
                    type="primary" 
                    size="small" 
                    @click="panelVideoParamsPopoverRef?.hide()"
                    class="done-btn"
                  >
                    完成
                  </el-button>
                </div> -->
              </div>
            </el-popover>
          </div>

          <!-- 生成按钮 -->
          <div class="generate-section">
            <el-button 
              type="primary" 
              :loading="generationTasks.length >= maxConcurrentTasks"
              :disabled="!prompt.trim() || generationTasks.length >= maxConcurrentTasks || (selectedKeLingOption === '视频编辑' && !referenceVideo)"
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
              <img :src="convertToProxyUrl(item.images[0]?.url)" class="history-thumb" />
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
    <el-dialog v-model="uploadPreviewVisible" title="图片预览" fullscreen class="preview-dialog upload-preview-dialog">
      <div class="preview-content">
        <img :src="uploadPreviewUrl" class="preview-image" />
      </div>
    </el-dialog>

    <!-- 图片预览对话框 -->
    <el-dialog 
      v-model="previewVisible" 
      title="" 
      fullscreen
      class="preview-dialog image-preview-dialog" 
      :show-close="false"
      :close-on-click-modal="true"
      :close-on-press-escape="true"
      :lock-scroll="true"
      :modal="true"
      append-to-body
    >
      <div v-if="previewImageData" class="preview-content">
        <div class="preview-close-btn" @click="previewVisible = false">
          <el-icon><Close /></el-icon>
        </div>
        
        <div class="preview-layout">
          <!-- 左侧：媒体展示区 -->
          <div class="preview-media-section">
            <div class="media-container">
              <img :src="convertToProxyUrl(previewImageUrl)" class="preview-image" alt="预览图片" crossorigin="anonymous" />
              
              <!-- 左右切换按钮 -->
              <div 
                v-if="previewImageList.length > 1 && currentPreviewIndex > 0" 
                class="preview-nav-btn prev-btn"
                @click="prevImage"
              >
                <el-icon><ArrowLeft /></el-icon>
              </div>
              <div 
                v-if="previewImageList.length > 1 && currentPreviewIndex < previewImageList.length - 1" 
                class="preview-nav-btn next-btn"
                @click="nextImage"
              >
                <el-icon><ArrowRight /></el-icon>
              </div>
              
              <!-- 图片计数器 -->
              <div v-if="previewImageList.length > 1" class="preview-counter">
                {{ currentPreviewIndex + 1 }} / {{ previewImageList.length }}
              </div>
            </div>
          </div>
          
          <!-- 右侧：信息面板 -->
          <div class="preview-info-section">
            <div class="info-content">
              <!-- 标题 -->
              <div class="preview-header">
                <div class="header-icon">
                  <el-icon><Picture /></el-icon>
                </div>
                <h3 class="header-title">图片详情</h3>
              </div>
              
              <!-- 元数据信息 - 移到提示词上方 -->
              <div class="preview-metadata-section" v-if="previewMetadata">
                <div class="metadata-row">
                  <!-- AI模型 -->
                  <div class="metadata-item-compact" v-if="previewMetadata.tags?.find(t => t.key === 'aiDriver')?.val">
                    <span class="metadata-text-compact">{{ previewMetadata.tags.find(t => t.key === 'aiDriver')?.val }}</span>
                  </div>
                  
                  <!-- 图片尺寸比例 -->
                  <div class="metadata-item-compact" v-if="previewMetadata.tags?.find(t => t.key === 'aspectRatio')?.val">
                    <span class="metadata-text-compact">{{ previewMetadata.tags.find(t => t.key === 'aspectRatio')?.val }}</span>
                  </div>
                  
                  <!-- 分辨率 -->
                  <div class="metadata-item-compact" v-if="previewMetadata.tags?.find(t => t.key === 'resolutionRatio')?.val">
                    <span class="metadata-text-compact">{{ previewMetadata.tags.find(t => t.key === 'resolutionRatio')?.val }}</span>
                  </div>
                  
                  <!-- 图片张数 -->
                  <div class="metadata-item-compact" v-if="previewMetadata.tags?.find(t => t.key === 'genImageNum')?.val">
                    <span class="metadata-text-compact">{{ previewMetadata.tags.find(t => t.key === 'genImageNum')?.val }}张</span>
                  </div>
                </div>
              </div>
              
              <!-- 提示词 -->
              <div class="preview-prompt-section" v-if="previewPrompt">
                <div class="prompt-label">
                  <el-icon><Edit /></el-icon>
                  <span>生成提示词</span>
                </div>
                <div class="prompt-text">{{ previewPrompt }}</div>
              </div>
              
              <!-- 占位符 - 如果没有提示词和元数据 -->
              <div v-if="!previewPrompt && !previewMetadata" class="prompt-placeholder">
                <el-icon><Edit /></el-icon>
                <span>暂无详细信息</span>
              </div>
              
              <!-- 操作按钮 -->
              <div class="preview-actions">
                <el-button 
                  type="primary" 
                  @click="downloadImage(previewImageData)" 
                  class="preview-action-btn primary-btn"
                >
                  <el-icon><Download /></el-icon>
                  <span>下载图片</span>
                </el-button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </el-dialog>
    
    <!-- 视频预览对话框 -->
    <el-dialog 
      v-model="videoPreviewVisible" 
      title="" 
      fullscreen
      class="preview-dialog video-preview-dialog" 
      :show-close="false"
      :close-on-click-modal="true"
      :close-on-press-escape="true"
      :lock-scroll="true"
      :modal="true"
      append-to-body
    >
      <div v-if="previewVideoData" class="preview-content">
        <div class="preview-close-btn" @click="videoPreviewVisible = false">
          <el-icon><Close /></el-icon>
        </div>
        
        <div class="preview-layout">
          <!-- 左侧：媒体展示区 -->
          <div class="preview-media-section">
            <div class="media-container">
              <video :src="convertToProxyUrl(previewVideoUrl)" class="preview-video" controls autoplay crossorigin="anonymous" />
            </div>
          </div>
          
          <!-- 右侧：信息面板 -->
          <div class="preview-info-section">
            <div class="info-content">
              <!-- 标题 -->
              <div class="preview-header">
                <div class="header-icon">
                  <el-icon><VideoCamera /></el-icon>
                </div>
                <h3 class="header-title">视频详情</h3>
              </div>
              
              <!-- 元数据信息 - 移到提示词上方 -->
              <div class="preview-metadata-section" v-if="previewMetadata">
                <div class="metadata-row">
                  <!-- AI模型 -->
                  <div class="metadata-item-compact" v-if="previewMetadata.tags?.find(t => t.key === 'aiDriver')?.val">
                    <span class="metadata-text-compact">{{ previewMetadata.tags.find(t => t.key === 'aiDriver')?.val }}</span>
                  </div>
                  
                  <!-- 视频尺寸比例 -->
                  <div class="metadata-item-compact" v-if="previewMetadata.tags?.find(t => t.key === 'aspectRatio')?.val">
                    <span class="metadata-text-compact">{{ previewMetadata.tags.find(t => t.key === 'aspectRatio')?.val }}</span>
                  </div>
                  
                  <!-- 视频时长 -->
                  <div class="metadata-item-compact" v-if="previewMetadata.tags?.find(t => t.key === 'duration')?.val">
                    <span class="metadata-text-compact">{{ previewMetadata.tags.find(t => t.key === 'duration')?.val }}秒</span>
                  </div>
                  
                  <!-- 分辨率 -->
                  <div class="metadata-item-compact" v-if="previewMetadata.tags?.find(t => t.key === 'resolutionRatio')?.val">
                    <span class="metadata-text-compact">{{ previewMetadata.tags.find(t => t.key === 'resolutionRatio')?.val }}</span>
                  </div>
                </div>
              </div>
              
              <!-- 提示词 -->
              <div class="preview-prompt-section" v-if="previewPrompt">
                <div class="prompt-label">
                  <el-icon><Edit /></el-icon>
                  <span>生成提示词</span>
                </div>
                <div class="prompt-text">{{ previewPrompt }}</div>
              </div>
              
              
              <!-- 占位符 - 如果没有提示词和元数据 -->
              <div v-if="!previewPrompt && !previewMetadata" class="prompt-placeholder">
                <el-icon><Edit /></el-icon>
                <span>暂无详细信息</span>
              </div>
              
              <!-- 操作按钮 -->
              <div class="preview-actions">
                <el-button 
                  type="primary" 
                  @click="downloadVideo(previewVideoData)" 
                  class="preview-action-btn primary-btn"
                >
                  <el-icon><Download /></el-icon>
                  <span>下载视频</span>
                </el-button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { uploadBigVideoToTOS, uploadImageToTOS } from '../services/tos.js'
import { getTosToken } from '../api/index'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Picture, Plus, Download, Clock, Close,
  ArrowDown, ArrowUp, FullScreen, Check, Refresh, Edit, Delete, VideoCamera, Setting, Switch, VideoPlay, Loading, CircleClose
} from '@element-plus/icons-vue'
import { formatTime } from '../utils'
import { downloadFile, convertToProxyUrl } from '../utils'
import { getImgModelConfig, getGenerateResults, postAIGenerate, getGenerateStatus,postAIGenerateRetry, deleteGenerate } from '../api/generate'

interface UploadFile {
  uid: string
  name: string
  url: string
  raw: File,
  val?: string
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

interface ApiResponse<T = unknown> {
  data: T
  code?: number
  msg?: string
}

interface GenerateResponse {
  userInputId: number
}

interface StatusResponse {
  list: Array<{
    userInputId: number
    status: number
    id?: number
    type?: number
    createTime?: string
    assets?: Asset[]
    tags?: Tag[]
    prompt?: string
    genType?: number
    aiDriver?: string
  }>
}

interface Model {
  aiDriver: string
  name: string
  desc: string
  iconUrl: string
}

interface Size {
  value: string
  label: string
  width?: number
  height?: number
  aspect?: string
  key?: string
}

interface Resolution {
  value: string
  label: string
  quality?: string
  key?: string
}

interface ImageCount {
  value: number
  label: string,
  key?: string
}

interface GenerationTask {
  id: string
  prompt: string
  model: Model
  size: Size
  resolution: Resolution
  imageCount: ImageCount
  aspectRatio?: Size
  referenceImages: UploadFile[]
  status: 'generating' | 'completed' | 'failed'
  progress: number
  progressText: string
  images: ImageResult[]
  createdAt: number
  userInputId?: number // 添加 userInputId 字段
  type?: number // 添加 type 字段：1: 图片, 2: 视频
  promptExpanded?: boolean // 添加 promptExpanded 字段
}

interface GenerationObj {
  type: number // 1: 图片, 2: 视频
  aiDriver: string
  tags: Array<{
    key: string
    val: string
    type?: number
  }>
}
interface KeLingOption {
  value: string
  label: string
  description: string
}

// 历史结果数据接口
interface Asset {
  id: number
  type: number // 1: 图片, 2: 视频
  coverUri: string
  coverUrl: string
  materialUri: string
  materialUrl: string
  createTime: string
}

interface Tag {
  id: number
  name: string
  key: string
  val: string
  showVal?: string // 添加 showVal 字段，用于显示预览图 URL
  type?: number // 添加可选的 type 字段：1=图片, 2=视频
}

interface HistoryResult {
  id: number
  type: number // 1: 图片, 2: 视频
  status: number // 状态
  createTime: string
  assets: Asset[]
  tags: Tag[]
  // 兼容旧字段
  prompt?: string
  genType?: number
  images?: string[]
  videoUrl?: string
  aiDriver?: string
  createdAt?: number
  promptExpanded?: boolean // 添加 promptExpanded 字段
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
const previewPrompt = ref('')
const previewMetadata = ref<HistoryResult | null>(null) // 存储预览的元数据（模型、尺寸等）
// 新增：图片列表预览相关状态
const previewImageList = ref<Asset[]>([]) // 当前预览的图片列表
const currentPreviewIndex = ref(0) // 当前预览的图片索引
const uploadPreviewVisible = ref(false)
const uploadPreviewUrl = ref('')
// 控制提示词输入框字数限制
const inputSize = ref(300)

// 历史结果相关状态
const historyResults = ref<HistoryResult[]>([])
const currentPage = ref(1)
const pageSize = ref(10)
const loadingMore = ref(false)
const hasMore = ref(true)
const initialLoading = ref(true) // 初始加载状态
const isLoadingTriggered = ref(false) // 防止重复触发加载
const isInitialScrollDone = ref(false) // 标记初始滚动是否完成
const resultsDisplayRef = ref<HTMLElement | null>(null)
const loadMoreObserver = ref<IntersectionObserver | null>(null)

// 视频预览相关状态
const videoPreviewVisible = ref(false)
const previewVideoUrl = ref('')
const previewVideoData = ref<VideoResult | null>(null)

// 新增：多任务生成相关状态
const generationTasks = ref<GenerationTask[]>([])
const maxConcurrentTasks = ref(5)
const generationCooldown = ref(60000) // 1分钟冷却时间
const pollingTimer = ref<number | null>(null) // 轮询定时器
const pendingUserInputIds = ref<Set<number>>(new Set()) // 待轮询的 userInputId 集合
const pendingResultIds = ref<Set<number>>(new Set()) // 待轮询的历史记录 ID 集合（用于列表中 status === 1 的记录）

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
const timeFilterPopoverRef = ref()
const typeFilterPopoverRef = ref()

// 筛选相关状态
const selectedTimeRange = ref<'all' | 'week' | 'month' | 'custom'>('all')
const selectedType = ref<'all' | 'image' | 'video'>('all')
const startDate = ref<string>('')
const endDate = ref<string>('')
const timeFilterVisible = ref(false)
const typeFilterVisible = ref(false)
const isSelectingDate = ref(false) // 标记是否正在选择日期

// 图片生成模型选项
const imageModels = ref<Model[]>([])

// 视频生成模型选项
const videoModels = ref<Model[]>([])

// 当前可用的模型列表（根据生成方式动态变化）
const models = ref<Model[]>(imageModels.value)

const currentModel = ref<Model>(models.value[0] || { aiDriver: '', name: '', desc: '', iconUrl: '' })

// 尺寸选项 - 按图片显示的顺序排列
const imageSizes = ref<Size[]>([])

const currentSize = ref<Size>() // 默认选择9:16

// 分辨率选项（初始为空，从后端获取）
const resolutions = ref<Resolution[]>([])

const currentResolution = ref<Resolution | null>(null)

// 根据比例和分辨率计算尺寸
const getCalculatedSize = () => {
  if (!currentSize.value) return { width: 0, height: 0 };
  
  let width = 0;
  let height = 0;
  
  // 如果已经有 width 和 height，使用这些值作为基础
  if (currentSize.value.width && currentSize.value.height) {
    width = currentSize.value.width;
    height = currentSize.value.height;
  } else {
    // 否则根据比例值计算默认尺寸
    const aspectRatio = currentSize.value.value || '1:1';
    const [w, h] = aspectRatio.split(':').map(Number);
    
    // 检查可用的分辨率选项，确定基础尺寸
    const hasOneK = resolutions.value.some(r => r.value?.toLowerCase() === '1k');
    const hasTwoK = resolutions.value.some(r => r.value?.toLowerCase() === '2k');
    
    // 如果有1K选项，基础尺寸为1024；否则如果有2K选项，基础尺寸为2048
    let baseSize = 1024;
    if (!hasOneK && hasTwoK) {
      baseSize = 2048;
    }
    
    // 根据比例计算
    if (w !== undefined && h !== undefined && w >= h) {
      // 横向或正方形
      width = baseSize;
      height = Math.round(baseSize * h / w);
    } else if (w !== undefined && h !== undefined) {
      // 纵向
      height = baseSize;
      width = Math.round(baseSize * w / h);
    }
  }
  
  // 根据分辨率调整尺寸
  const resolutionValue = currentResolution.value?.value?.toLowerCase();
  
  // 检查可用的分辨率选项
  const hasOneK = resolutions.value.some(r => r.value?.toLowerCase() === '1k');
  const hasTwoK = resolutions.value.some(r => r.value?.toLowerCase() === '2k');
  
  if (!hasOneK && hasTwoK) {
    // 如果没有1K但有2K，则2K是基础，4K是2倍
    if (resolutionValue === '4k') {
      width *= 2;
      height *= 2;
    }
    // 2K保持原尺寸不变
  } else {
    // 如果有1K，则1K是基础，2K是2倍，4K是4倍
    if (resolutionValue === '2k') {
      width *= 2;
      height *= 2;
    } else if (resolutionValue === '4k') {
      width *= 4;
      height *= 4;
    }
    // 1K保持原尺寸不变
  }
  
  return { width, height };
}

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
const selectedKeLingOptionVal = ref('first_tail') // 可灵模型的特殊选项
// const hasReferType = ref(false)
const hasEnableAudio=ref(false)
const enableAudio = ref('no')
const selectedQuality = ref('720p')
const selectedDuration = ref('5')
const selectedRatio = ref('smart')
const keepOriginalAudio = ref('') // 保留视频原声
const generationMode = ref('std') // 生成模式：std-标准模式, pro-专家模式

// 视频上传相关状态（与VideoGenerateView保持一致）
const firstFrameImage = ref('')
const firstFrameImageVal = ref('') // 首帧图的uploadFileName
const lastFrameImage = ref('')
const lastFrameImageVal = ref('') // 尾帧图的uploadFileName
const referenceVideo = ref('')
const referenceVideoVal = ref('')
const videoReferenceImages = ref(['', '', '', '']) // 4张参考图片
const videoReferenceImagesVal = ref(['', '', '', '']) // 4张参考图片的uploadFileName
const videoUploadProgress = ref(0) // 视频上传进度 0-100
const isVideoUploading = ref(false) // 视频是否正在上传

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
const keLingOptions = ref<KeLingOption[]>([])

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
const videoDurations = ref<KeLingOption[]>([])

// 生成模式选项
const generationModes = ref([
  { value: 'std', label: '标准模式' },
  { value: 'pro', label: '专家模式' }
])

// 保留原声选项
const keepOriginalAudioOptions = ref<KeLingOption[]>([])

// 方法
const selectModel = (model: Model) => {
  // 保存当前的参考类型
  const currentReferType = selectedKeLingOption.value
  
  currentModel.value = model
  // 关闭 Popover
  modelPopoverRef.value?.hide()
  panelModelPopoverRef.value?.hide()
  
  // 清空所有配置参数（fetchModelConfig会重新设置默认值）
  // 图片相关配置
  imageSizes.value = []
  resolutions.value = []
  imageCounts.value = []
  
  // 视频相关配置
  videoRatios.value = []
  videoQualities.value = []
  videoDurations.value = []
  generationModes.value = []
  keepOriginalAudioOptions.value = []
  keLingOptions.value = []
  
  // 重新获取模型配置（会设置默认值）
  fetchModelConfig(model.aiDriver).then(() => {
    // 配置加载完成后，检查新模型是否支持当前的参考类型
    const newModelSupportsCurrentType = keLingOptions.value.some(
      option => option.label === currentReferType
    )
    
    if (newModelSupportsCurrentType) {
      // 新模型支持当前参考类型，保留参考类型和对应的图片
      selectedKeLingOption.value = currentReferType
      const currentOption = keLingOptions.value.find(opt => opt.label === currentReferType)
      if (currentOption) {
        selectedKeLingOptionVal.value = currentOption.value
      }
      
      // 根据参考类型清空不相关的图片
      if (currentReferType === '首尾帧') {
        // 保留首尾帧图片，清空其他
        referenceVideo.value = ''
        referenceVideoVal.value = ''
        videoReferenceImages.value = ['', '', '', '']
        videoReferenceImagesVal.value = ['', '', '', '']
      } else if (currentReferType === '多模态参考' || currentReferType === '视频编辑') {
        // 保留参考视频和多模态图片，清空首尾帧
        firstFrameImage.value = ''
        firstFrameImageVal.value = ''
        lastFrameImage.value = ''
        lastFrameImageVal.value = ''
      }
    } else {
      // 新模型不支持当前参考类型，重置为默认值并清空所有图片
      if (keLingOptions.value.length > 0) {
        selectedKeLingOption.value = keLingOptions?.value[0]?.label||'首尾帧'
        selectedKeLingOptionVal.value = keLingOptions?.value[0]?.value||'first_tail'
      } else {
        selectedKeLingOption.value = '首尾帧'
        selectedKeLingOptionVal.value = 'first_tail'
      }
      
      // 清空所有图片和视频
      firstFrameImage.value = ''
      firstFrameImageVal.value = ''
      lastFrameImage.value = ''
      lastFrameImageVal.value = ''
      referenceVideo.value = ''
      referenceVideoVal.value = ''
      videoReferenceImages.value = ['', '', '', '']
      videoReferenceImagesVal.value = ['', '', '', '']
    }
  })
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
// 选择生成方式 图片生成还是视频生成
const selectGenerateMode = (mode: { value: string; label: string }) => {
  currentGenerateMode.value = mode
  
  // 切换生成方式时清空可灵选项的值
  selectedKeLingOption.value = '首尾帧'
  selectedKeLingOptionVal.value = 'first_tail'
  
  // 清空所有配置参数
  imageSizes.value = []
  resolutions.value = []
  imageCounts.value = []
  videoRatios.value = []
  videoQualities.value = []
  videoDurations.value = []
  generationModes.value = []
  keepOriginalAudioOptions.value = []
  keLingOptions.value = []
  
  // 清空上传的图片和视频
  referenceImages.value = []
  firstFrameImage.value = ''
  firstFrameImageVal.value = ''
  lastFrameImage.value = ''
  lastFrameImageVal.value = ''
  referenceVideo.value = ''
  referenceVideoVal.value = ''
  videoReferenceImages.value = ['', '', '', '']
  videoReferenceImagesVal.value = ['', '', '', '']
  
  // 根据生成方式切换可用的模型列表
  if (mode.value === 'image') {
    models.value = imageModels.value
    // 如果当前选择的模型不在图片模型列表中，则选择第一个图片模型
    const currentModelExists = imageModels.value.find(model => model.aiDriver === currentModel.value.aiDriver)
    if (!currentModelExists && imageModels.value[0]) {
      currentModel.value = imageModels.value[0]
    }
  } else if (mode.value === 'video') {
    models.value = videoModels.value
    // 如果当前选择的模型不在视频模型列表中，则选择第一个视频模型
    const currentModelExists = videoModels.value.find(model => model.aiDriver === currentModel.value.aiDriver)
    if (!currentModelExists && videoModels.value[0]) {
      currentModel.value = videoModels.value[0]
    }
  }
  
  // 重新获取配置（会设置默认值）
  fetchModelConfig();
  
  // 关闭 Popover
  generateModePopoverRef.value?.hide()
  panelGenerateModePopoverRef.value?.hide()
}

// 视频生成相关方法
const selectKeLingOption = (option: { value: string; label: string }) => {
  selectedKeLingOption.value = option.label
  selectedKeLingOptionVal.value = option.value
  
  // 切换参考类型时清空所有上传的图片和视频
  firstFrameImage.value = ''
  firstFrameImageVal.value = ''
  lastFrameImage.value = ''
  lastFrameImageVal.value = ''
  referenceVideo.value = ''
  referenceVideoVal.value = ''
  videoReferenceImages.value = ['', '', '', '']
  videoReferenceImagesVal.value = ['', '', '', '']
  
  // 关闭 Popover
  keLingPopoverRef.value?.hide()
  panelKeLingPopoverRef.value?.hide()
}

const selectAudio = (enabled: string) => {
  enableAudio.value = enabled
}

const selectKeepOriginalAudio = (option: { value: string; label: string }) => {
  keepOriginalAudio.value = option.value
}

const selectGenerationMode = (mode: { value: string; label: string }) => {
  generationMode.value = mode.value
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
  const audioText = enableAudio.value=='yes' ? '有声' : '无声'
  const ratioText = videoRatios.value.find(r => r.value === selectedRatio.value)?.label || ''
  const qualityText = videoQualities.value.find(q => q.value === selectedQuality.value)?.label || ''
  const durationText = !currentModel.value.aiDriver?.includes('klingai-O1-video') ? videoDurations.value.find(d => d.value === selectedDuration.value)?.label || '' : ''
  const keepAudioText = keepOriginalAudioOptions.value.find(o => o.value === keepOriginalAudio.value)?.label || ''
  const modeText = generationModes.value.find(m => m.value === generationMode.value)?.label || ''

  return `${ratioText} ${hasEnableAudio.value?' | '+audioText:''} ${qualityText?' | '+qualityText:''} ${durationText?' | '+durationText:''} ${referenceVideo.value?' | '+keepAudioText:''} ${modeText?' | '+modeText:''}`.trim()
}

// 获取最大图片上传数量
const getMaxImageCount = () => {
  if (currentGenerateMode.value?.value === 'image') {
    return 5 // 图片生成模式最多5张
  } else if (currentGenerateMode.value?.value === 'video') {
    return 4 // 视频生成模式最多4张
  }
  return 5 // 默认5张
}

// 根据比例值生成对应的CSS类名
const getRatioClass = (aspectRatioValue: string) => {
  if (!aspectRatioValue) return 'ratio-1-1' // 默认1:1
  
  // 处理不同的比例格式
  const ratioMap: { [key: string]: string } = {
    // 标准比例格式
    '1:1': 'ratio-1-1',
    '3:4': 'ratio-3-4',
    '4:3': 'ratio-4-3',
    '9:16': 'ratio-9-16',
    '16:9': 'ratio-16-9',
    '21:9': 'ratio-21-9',
    '2:3': 'ratio-2-3',
    '3:2': 'ratio-3-2',
    // 兼容其他格式
    '1': 'ratio-1-1',
    '1/1': 'ratio-1-1',
    '3/4': 'ratio-3-4',
    '4/3': 'ratio-4-3',
    '9/16': 'ratio-9-16',
    '16/9': 'ratio-16-9',
    '21/9': 'ratio-21-9',
    '2/3': 'ratio-2-3',
    '3/2': 'ratio-3-2',
    // 特殊关键词
    'smart': 'ratio-16-9', // 智能比例默认为16:9
    '正方形': 'ratio-1-1',
    '竖屏': 'ratio-9-16',
    '横屏': 'ratio-16-9',
    '宽屏': 'ratio-21-9',
    '方形': 'ratio-1-1',
    '标准': 'ratio-16-9',
    '超宽': 'ratio-21-9'
  }
  
  // 尝试直接匹配
  if (ratioMap[aspectRatioValue]) {
    return ratioMap[aspectRatioValue]
  }
  
  // 尝试解析比例字符串（如 "1920:1080" -> "16:9"）
  const match = aspectRatioValue.match(/(\d+)[:/](\d+)/)
  if (match && match[1] && match[2]) {
    const width = parseInt(match[1])
    const height = parseInt(match[2])
    const ratio = width / height
    
    // 根据比例值匹配最接近的标准比例
    if (Math.abs(ratio - 1) < 0.1) return 'ratio-1-1'
    if (Math.abs(ratio - 0.75) < 0.1) return 'ratio-3-4'
    if (Math.abs(ratio - 1.33) < 0.1) return 'ratio-4-3'
    if (Math.abs(ratio - 0.5625) < 0.1) return 'ratio-9-16'
    if (Math.abs(ratio - 1.78) < 0.1) return 'ratio-16-9'
    if (Math.abs(ratio - 2.33) < 0.1) return 'ratio-21-9'
    if (Math.abs(ratio - 0.67) < 0.1) return 'ratio-2-3'
    if (Math.abs(ratio - 1.5) < 0.1) return 'ratio-3-2'
  }
  
  // 默认返回1:1
  return 'ratio-1-1'
}

// 获取历史记录的参考图片（用于缩略图叠加显示）
const getReferenceImages = (result: HistoryResult): string[] => {
  if (!result || !result.tags) return []
  
  const referenceImages: string[] = []
  
  // 对于视频生成结果，优先显示参考视频的封面图
  if (result.type === 2) {
    const uploadVideoTag = result.tags.find(t => t.key === 'uploadVideo')
    if (uploadVideoTag?.showVal) {
      // 如果有参考视频，将视频URL作为封面（浏览器会自动显示第一帧）
      referenceImages.push(uploadVideoTag.showVal)
    }
  }
  
  // 1. 获取首帧图
  const imageFirstTag = result.tags.find(t => t.key === 'imageFirst')
  if (imageFirstTag?.showVal) {
    referenceImages.push(imageFirstTag.showVal)
  }
  
  // 2. 获取尾帧图
  const imageTailTag = result.tags.find(t => t.key === 'imageTail')
  if (imageTailTag?.showVal) {
    referenceImages.push(imageTailTag.showVal)
  }
  
  // 3. 获取多模态参考图片（key为"images"的标签）
  const imagesTags = result.tags.filter(t => t.key === 'images')
  imagesTags.forEach(imgTag => {
    if (imgTag.showVal) {
      referenceImages.push(imgTag.showVal)
    }
  })
  
  // 去重并返回（最多返回5张）
  return [...new Set(referenceImages)].slice(0, 5)
}

// 视频上传处理方法
const handleFirstFrameUpload = async (file: File) => {
  if (!file.type.includes('image')) {
    ElMessage.warning("请选择正确的图片文件");
    return false;
  }
  
  // 显示上传中的友好提示
  const loadingMessage = ElMessage({
    message: '正在上传首帧图片，请稍候...',
    type: 'info',
    duration: 0, // 不自动关闭
    showClose: false
  });
  
  try {
    const tosConfig = await getTosToken();
    
    if (!tosConfig) {
      throw new Error('未获取到TOS配置');
    }
    
    // 调用图片上传方法
    const imageData = await uploadImageToTOS(file, tosConfig);
    const imageUrl = imageData.imageUrl;
    const uploadFileName = imageData.uploadFileName;
    
    firstFrameImage.value = imageUrl;
    firstFrameImageVal.value = uploadFileName;
    
    // 关闭loading并显示成功消息
    loadingMessage.close();
    ElMessage.success('首帧图上传成功！');
  } catch (error: unknown) {
    console.error('首帧图上传失败：', error);
    
    // 关闭loading并显示错误消息
    loadingMessage.close();
    ElMessage.error('首帧图上传失败：' + (error as Error).message);
  }
  
  return false; // 阻止自动上传
}

const handleLastFrameUpload = async (file: File) => {
  if (!file.type.includes('image')) {
    ElMessage.warning("请选择正确的图片文件");
    return false;
  }
  
  // 显示上传中的友好提示
  const loadingMessage = ElMessage({
    message: '正在上传尾帧图片，请稍候...',
    type: 'info',
    duration: 0, // 不自动关闭
    showClose: false
  });
  
  try {
    const tosConfig = await getTosToken();
    
    if (!tosConfig) {
      throw new Error('未获取到TOS配置');
    }
    
    // 调用图片上传方法
    const imageData = await uploadImageToTOS(file, tosConfig);
    const imageUrl = imageData.imageUrl;
    const uploadFileName = imageData.uploadFileName;
    
    lastFrameImage.value = imageUrl;
    lastFrameImageVal.value = uploadFileName;
    
    // 关闭loading并显示成功消息
    loadingMessage.close();
    ElMessage.success('尾帧图上传成功！');
  } catch (error: unknown) {
    console.error('尾帧图上传失败：', error);
    
    // 关闭loading并显示错误消息
    loadingMessage.close();
    ElMessage.error('尾帧图上传失败：' + (error as Error).message);
  }
  
  return false; // 阻止自动上传
}

const swapFrameImages = () => {
  const temp = firstFrameImage.value
  const tempVal = firstFrameImageVal.value
  
  firstFrameImage.value = lastFrameImage.value
  firstFrameImageVal.value = lastFrameImageVal.value
  
  lastFrameImage.value = temp
  lastFrameImageVal.value = tempVal
  
  ElMessage.success('首帧图和尾帧图已交换')
}

// 删除首帧图
const removeFirstFrameImage = () => {
  firstFrameImage.value = ''
  firstFrameImageVal.value = ''
  ElMessage.success('首帧图已删除')
}

// 删除尾帧图
const removeLastFrameImage = () => {
  lastFrameImage.value = ''
  lastFrameImageVal.value = ''
  ElMessage.success('尾帧图已删除')
}

const handleVideoUpload = async (file: File) => {
  if (!file) return false;
  
  // 检查视频时长
  try {
    const duration = await getVideoDuration(file);
    
    if (duration > 10) {
      ElMessage.warning('视频时长不能超过10秒');
      return false;
    }
  } catch (error) {
    console.error('获取视频时长失败：', error);
    ElMessage.error('无法读取视频信息，请确保文件格式正确');
    return false;
  }
  
  // 重置上传状态
  isVideoUploading.value = true;
  videoUploadProgress.value = 0;
  
  // 显示上传开始的友好提示
  ElMessage({
    message: '开始上传视频，请耐心等待...',
    type: 'info',
    duration: 2000
  });
  
  try {
    const tosConfig = await getTosToken();
    
    if (!tosConfig) {
      throw new Error('未获取到TOS配置');
    }
    
    // 调用视频上传方法，传递进度回调
    const videoData = await uploadBigVideoToTOS(file, tosConfig);
    
    referenceVideo.value = videoData.videoUrl;
    referenceVideoVal.value = videoData.uploadFileName;
    
    // 显示成功消息
    ElMessage.success({
      message: '视频上传成功！',
      duration: 3000,
      showClose: true
    });
  } catch (error: unknown) {
    console.error('视频上传失败：', error);
    
    // 显示详细的错误信息
    ElMessage.error({
      message: '视频上传失败：' + (error as Error).message,
      duration: 5000,
      showClose: true
    });
  } finally {
    // 上传完成，重置状态
    isVideoUploading.value = false;
    videoUploadProgress.value = 0;
  }
  
  return false // 阻止自动上传
}

// 获取视频时长的辅助函数
const getVideoDuration = (file: File): Promise<number> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    
    video.onloadedmetadata = () => {
      window.URL.revokeObjectURL(video.src);
      resolve(video.duration);
    };
    
    video.onerror = () => {
      window.URL.revokeObjectURL(video.src);
      reject(new Error('无法加载视频'));
    };
    
    video.src = URL.createObjectURL(file);
  });
}

const handleReferenceImageUpload = async (file: File) => {
  if (!file.type.includes('image')) {
    ElMessage.warning("请选择正确的图片文件");
    return false;
  }
  
  // 找到第一个空位置
  const emptyIndex = videoReferenceImages.value.findIndex(img => !img)
  if (emptyIndex === -1) {
    ElMessage.warning('最多只能上传4张参考图片')
    return false;
  }
  
  // 显示上传中的友好提示
  const loadingMessage = ElMessage({
    message: `正在上传第${emptyIndex + 1}张参考图片...`,
    type: 'info',
    duration: 0, // 不自动关闭
    showClose: false
  });
  
  try {
    const tosConfig = await getTosToken();
    
    if (!tosConfig) {
      throw new Error('未获取到TOS配置');
    }
    
    // 调用图片上传方法
    const imageData = await uploadImageToTOS(file, tosConfig);
    const imageUrl = imageData.imageUrl;
    const uploadFileName = imageData.uploadFileName;
    
    videoReferenceImages.value[emptyIndex] = imageUrl;
    videoReferenceImagesVal.value[emptyIndex] = uploadFileName;
    
    // 关闭loading并显示成功消息
    loadingMessage.close();
    ElMessage.success(`第${emptyIndex + 1}张参考图片上传成功！`);
  } catch (error: unknown) {
    console.error('参考图片上传失败：', error);
    
    // 关闭loading并显示错误消息
    loadingMessage.close();
    ElMessage.error('参考图片上传失败：' + (error as Error).message);
  }
  
  return false; // 阻止自动上传
}

const removeReferenceImage = (index: number) => {
  // 找到实际的索引位置
  const filteredImages = videoReferenceImages.value.filter(img => img)
  const imageToRemove = filteredImages[index]
  if (!imageToRemove) return
  const actualIndex = videoReferenceImages.value.indexOf(imageToRemove)
  
  if (actualIndex !== -1) {
    videoReferenceImages.value[actualIndex] = ''
    videoReferenceImagesVal.value[actualIndex] = ''
    ElMessage.success('参考图片已删除')
  }
}

// 删除参考视频
const removeReferenceVideo = () => {
  referenceVideo.value = ''
  referenceVideoVal.value = ''
  ElMessage.success('参考视频已删除')
}

// 预览参考视频
const previewReferenceVideo = (videoUrl: string) => {
  // 创建预览弹窗
  const previewDialog = document.createElement('div')
  previewDialog.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.9);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    cursor: pointer;
  `
  
  const videoContainer = document.createElement('div')
  videoContainer.style.cssText = `
    position: relative;
    max-width: 90%;
    max-height: 90%;
    display: flex;
    align-items: center;
    justify-content: center;
  `
  
  const video = document.createElement('video')
  video.src = videoUrl
  video.controls = true
  video.autoplay = true
  video.style.cssText = `
    max-width: 100%;
    max-height: 90vh;
    border-radius: 8px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  `
  
  // 阻止视频点击事件冒泡
  video.addEventListener('click', (e) => {
    e.stopPropagation()
  })
  
  videoContainer.appendChild(video)
  previewDialog.appendChild(videoContainer)
  document.body.appendChild(previewDialog)
  
  // 点击背景关闭预览
  previewDialog.addEventListener('click', () => {
    video.pause()
    document.body.removeChild(previewDialog)
  })
  
  // ESC键关闭预览
  const handleEsc = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      video.pause()
      document.body.removeChild(previewDialog)
      document.removeEventListener('keydown', handleEsc)
    }
  }
  document.addEventListener('keydown', handleEsc)
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const handleImageUpload = async (uploadFile: any) => {
  const maxCount = getMaxImageCount()
  
  // 检查文件数量限制
  if (referenceImages.value.length >= maxCount) {
    ElMessage.warning(`最多只能上传${maxCount}张图片`)
    return false
  }

  // 检查文件类型
  const isImage = uploadFile.raw.type.startsWith('image/')
  if (!isImage) {
    ElMessage.error('只能上传图片文件')
    return false
  }

  // 检查文件大小 (10MB)
  const isLt10M = uploadFile.raw.size / 1024 / 1024 < 10
  if (!isLt10M) {
    ElMessage.error('图片大小不能超过10MB')
    return false
  }

  // 上传到火山引擎tos上
  const file = uploadFile.raw;
  if (!file) return;
  if (!file.type.includes('image')) {
    ElMessage.warning("请选择正确的图片文件");
    return;
  }
  
  // 显示上传中的友好提示
  const loadingMessage = ElMessage({
    message: `正在上传图片 (${referenceImages.value.length + 1}/${maxCount})，请稍候...`,
    type: 'info',
    duration: 0, // 不自动关闭
    showClose: false
  });
  
  try {
    const tosConfig = await getTosToken();
    
    if (!tosConfig) {
      throw new Error('未获取到TOS配置');
    }
    // 调用图片上传方法
    const imageData = await uploadImageToTOS(file, tosConfig);
    const imageUrl = imageData.imageUrl;
    const imageuploadFileName = imageData.uploadFileName;
    const img: UploadFile = {
      uid: uploadFile.uid || Date.now().toString(),
      name: uploadFile.name || 'image.jpg',
      url: imageUrl,
      raw: file,
      val: imageuploadFileName
    }
    referenceImages.value.push(img);
    
    // 关闭loading并显示成功消息
    loadingMessage.close();
    ElMessage.success({
      message: `图片上传成功！(${referenceImages.value.length}/${maxCount})`,
      duration: 2000,
      showClose: true
    });
  } catch (error: unknown) {
    console.error('图片上传失败：', error);
    
    // 关闭loading并显示错误消息
    loadingMessage.close();
    ElMessage.error({
      message: '图片上传失败：' + (error as Error).message,
      duration: 4000,
      showClose: true
    });
  } 
  
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
  
  if (recentTasks.length >= maxConcurrentTasks.value && recentTasks[0]) {
    const remainingTime = Math.ceil((generationCooldown.value - (now - recentTasks[0].createdAt)) / 1000)
    ElMessage.warning(`请等待${remainingTime}秒后再次生成`)
    return
  }

  // 创建新的生成任务
  const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  // 根据生成模式确定比例
  let aspectRatio: Size | undefined
  if (currentGenerateMode.value?.value === 'video') {
    // 视频模式：使用 selectedRatio
    const ratioOption = videoRatios.value.find(r => r.value === selectedRatio.value)
    if (ratioOption) {
      aspectRatio = {
        value: ratioOption.value,
        label: ratioOption.label,
        aspect: ratioOption.aspect,
        width: 0, // 视频不需要具体宽高
        height: 0
      }
    }
  } else {
    // 图片模式：使用 currentSize
    aspectRatio = currentSize.value
  }
  
  const newTask: GenerationTask = {
    id: taskId,
    prompt: prompt.value,
    model: currentModel.value,
    size: currentSize.value!,
    resolution: currentResolution.value!,
    imageCount: currentImageCount.value!,
    aspectRatio: aspectRatio, // 添加比例信息
    referenceImages: [...referenceImages.value],
    status: 'generating',
    progress: 0,
    progressText: '正在分析您的描述...',
    images: [],
    createdAt: now,
    type: currentGenerateMode.value?.value === 'video' ? 2 : 1 // 根据生成模式设置type
  }

  // 添加到任务列表
  generationTasks.value.push(newTask)
  
  // 滚动到底部 - 使用延迟确保 DOM 更新
  setTimeout(() => {
    scrollToBottom()
  }, 100)
  
  // 组装请求参数
  const requestTask = buildGenerateRequestTask()
  
  // 调用生成接口，传入 taskId
  await sendGenerateRequest(requestTask, taskId)
}

// 组装生成请求参数
const buildGenerateRequestTask = () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tags: any[] = []
  
  // 根据生成模式决定type: 1=图片, 2=视频
  const type = currentGenerateMode.value?.value === 'video' ? 2 : 1
  
  if (type === 1) {
    // 图片生成参数
    // 比例
    if (currentSize.value) {
      tags.push({
        key: 'aspectRatio',
        val: currentSize.value.value
      })
    }
    
    // 尺寸 - 如果有 width 和 height，传递实际尺寸值
    if (currentSize.value?.width && currentSize.value?.height) {
      let width = currentSize.value.width
      let height = currentSize.value.height
      
      // 根据分辨率调整尺寸（兼容大小写）
      const resolutionValue = currentResolution.value?.value?.toLowerCase();
      
      // 检查可用的分辨率选项
      const hasOneK = resolutions.value.some(r => r.value?.toLowerCase() === '1k');
      const hasTwoK = resolutions.value.some(r => r.value?.toLowerCase() === '2k');
      
      if (!hasOneK && hasTwoK) {
        // 如果没有1K但有2K，则2K是基础，4K是2倍
        if (resolutionValue === '4k') {
          width = width * 2;
          height = height * 2;
        }
        // 2K保持原尺寸不变
      } else {
        // 如果有1K，则1K是基础，2K是2倍，4K是4倍
        if (resolutionValue === '2k') {
          width = width * 2;
          height = height * 2;
        } else if (resolutionValue === '4k') {
          width = width * 4;
          height = height * 4;
        }
        // 1K保持原尺寸不变
      }
      
      tags.push({
        key: 'size',
        val: `${width}x${height}`
      })
    }
    
    // 分辨率比例 - 可灵模型使用 resolution，其他模型使用 resolutionRatio
    if (currentResolution.value) {
      const isKelingModel = currentModel.value?.aiDriver?.toLowerCase().includes('klingai') || currentModel.value?.aiDriver?.toLowerCase().includes('keling');
      tags.push({
        key: isKelingModel ? 'resolution' : 'resolutionRatio',
        val: currentResolution.value.value
      })
    }
    
    // 图片张数
    if (currentImageCount.value) {
      tags.push({
        key: 'genImageNum',
        val: currentImageCount.value.value.toString()
      })
    }
    
    // 提示词
    tags.push({
      key: 'prompt',
      val: prompt.value
    })
    
    // 参考图片（图片生成模式）- 统一使用 key: "images"，val 使用 uploadFileName
    if (referenceImages.value && referenceImages.value.length > 0) {
      referenceImages.value.forEach((img) => {
        if (img.val) {
          tags.push({
            key: 'images',
            val: img.val, // 使用 val (uploadFileName) 而不是 url
            type: 1
          })
        }
      })
    }
  } else {
    // 视频生成参数
    // 比例
    if (selectedRatio.value) {
      tags.push({
        key: 'aspectRatio',
        val: selectedRatio.value
      })
    }
    
    // 分辨率
    if (selectedQuality.value) {
      tags.push({
        key: 'resolution',
        val: selectedQuality.value
      })
    }
    
    // 时长
    if (selectedDuration.value) {
      tags.push({
        key: 'duration',
        val: selectedDuration.value.toString()
      })
    }
    
    // 生成声音
    if (hasEnableAudio.value && enableAudio.value) {
      tags.push({
        key: 'generateAudio',
        val: enableAudio.value
      })
    }
    
    // 生成模式
    if (generationMode.value) {
      tags.push({
        key: 'mode',
        val: generationMode.value
      })
    }
    
    // 保留原声
    if (keepOriginalAudio.value) {
      tags.push({
        key: 'keepOriginalSound',
        val: keepOriginalAudio.value
      })
    }
    
    // 可灵参考类型
    if (keLingOptions.value.length > 0 && selectedKeLingOption.value) {
      const option = keLingOptions.value.find(opt => opt.label === selectedKeLingOption.value)
      if (option) {
        tags.push({
          key: 'referType',
          val: option.value
        })
      }
    }
    
    // 首帧图
    if (firstFrameImageVal.value) {
      tags.push({
        key: 'imageFirst',
        val: firstFrameImageVal.value,
        type: 1
      })
    }
    
    // 尾帧图
    if (lastFrameImageVal.value) {
      tags.push({
        key: 'imageTail',
        val: lastFrameImageVal.value,
        type: 1
      })
    }
    
    // 参考视频
    if (referenceVideoVal.value) {
      tags.push({
        key: 'uploadVideo',
        val: referenceVideoVal.value,
        type: 2
      })
    }
    
    // 参考图片（多模态）- 统一使用 key: "images"
    if (videoReferenceImagesVal.value && videoReferenceImagesVal.value.length > 0) {
      videoReferenceImagesVal.value.forEach((imgVal) => {
        if (imgVal) {
          tags.push({
            key: 'images',
            val: imgVal,
            type: 1
          })
        }
      })
    }
    
    // 提示词
    tags.push({
      key: 'prompt',
      val: prompt.value
    })
  }
  
  return {
    type,
    aiDriver: currentModel.value?.aiDriver || '',
    tags
  }
}

// 新增：单个任务生成函数
// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
    
    // 立即从任务列表中移除已完成的任务
    const index = generationTasks.value.findIndex(t => t.id === taskId)
    if (index > -1) {
      generationTasks.value.splice(index, 1)
    }
    
    // 刷新历史记录列表
    await fetchGenerateResults(1, false)

  } catch (err) {
    console.error('生成失败:', err)
    task.status = 'failed'
    task.progressText = '生成失败'
    ElMessage.error('生成失败，请重试')
    
    // 失败的任务立即移除
    const index = generationTasks.value.findIndex(t => t.id === taskId)
    if (index > -1) {
      generationTasks.value.splice(index, 1)
    }
  }
}

const previewImage = (imageUrl: string, imageData?: Asset, promptText?: string, resultData?: HistoryResult) => {
  previewImageUrl.value = imageUrl
  // 如果传入了imageData，使用它；否则创建一个临时对象
  previewImageData.value = imageData || {
    id: Date.now().toString(),
    materialUrl: imageUrl,
    coverUrl: imageUrl
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any
  previewPrompt.value = promptText || ''
  // 存储元数据
  previewMetadata.value = resultData || null
  
  // 如果 resultData 存在且有 assets，提取所有图片资源
  if (resultData && resultData.assets) {
    const imageAssets = resultData.assets.filter(asset => asset.type === 1)
    if (imageAssets.length > 0) {
      previewImageList.value = imageAssets
      // 找到当前图片在列表中的索引
      const currentIndex = imageAssets.findIndex(
        asset => (asset.materialUrl || asset.coverUrl) === imageUrl
      )
      currentPreviewIndex.value = currentIndex >= 0 ? currentIndex : 0
    } else {
      // 如果没有图片资源，创建单个图片的列表
      previewImageList.value = [imageData || {
        id: Date.now(),
        materialUrl: imageUrl,
        coverUrl: imageUrl,
        type: 1
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any]
      currentPreviewIndex.value = 0
    }
  } else {
    // 如果没有 resultData，创建单个图片的列表
    previewImageList.value = [imageData || {
      id: Date.now(),
      materialUrl: imageUrl,
      coverUrl: imageUrl,
      type: 1
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any]
    currentPreviewIndex.value = 0
  }
  
  previewVisible.value = true
}

// 切换到上一张图片
const prevImage = () => {
  if (currentPreviewIndex.value > 0) {
    currentPreviewIndex.value--
    updatePreviewImage()
  }
}

// 切换到下一张图片
const nextImage = () => {
  if (currentPreviewIndex.value < previewImageList.value.length - 1) {
    currentPreviewIndex.value++
    updatePreviewImage()
  }
}

// 更新预览图片
const updatePreviewImage = () => {
  const currentImage = previewImageList.value[currentPreviewIndex.value]
  if (currentImage) {
    previewImageUrl.value = currentImage.materialUrl || currentImage.coverUrl || ''
    // 转换为 ImageResult 格式
    previewImageData.value = {
      id: currentImage.id.toString(),
      url: currentImage.materialUrl || currentImage.coverUrl || '',
      thumbnail: currentImage.coverUrl || currentImage.materialUrl || ''
    }
  }
}

// 键盘事件处理
const handlePreviewKeydown = (event: KeyboardEvent) => {
  if (!previewVisible.value) return
  
  if (event.key === 'ArrowLeft') {
    prevImage()
  } else if (event.key === 'ArrowRight') {
    nextImage()
  } else if (event.key === 'Escape') {
    previewVisible.value = false
  }
}

const previewVideo = (videoUrl: string, videoData?: Asset, promptText?: string, resultData?: HistoryResult) => {
  previewVideoUrl.value = videoUrl
  // 如果没有传入videoData，创建一个临时对象
  previewVideoData.value = videoData ? {
    id: videoData.id.toString(),
    url: videoData.materialUrl,
    thumbnail: videoData.coverUrl
  } : {
    id: Date.now().toString(),
    url: videoUrl,
    thumbnail: ''
  }
  previewPrompt.value = promptText || ''
  // 存储元数据
  previewMetadata.value = resultData || null
  videoPreviewVisible.value = true
}

// 视频缩略图hover播放处理
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
    // 优先使用 previewVideoUrl（预览窗口显示的实际 URL）
    let videoUrl = previewVideoUrl.value
    
    // 如果没有 previewVideoUrl，则从 video 对象中获取
    if (!videoUrl) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      videoUrl = (video as any).url || (video as any).materialUrl
    }
    
    if (!videoUrl) {
      console.error('视频 URL 不存在:', video)
      ElMessage.error('视频 URL 不存在，无法下载')
      return
    }
    
    // 从 URL 中提取文件扩展名
    const urlParts = videoUrl.split('?')[0]
    if (!urlParts) return
    const urlPath = urlParts.split('/')
    const urlFilename = urlPath[urlPath.length - 1]
    if (!urlFilename) return
    const ext = urlFilename.includes('.') ? urlFilename.split('.').pop() : 'mp4'
    
    const filename = `generated_video_${video.id}.${ext}`
    
    await downloadFile(videoUrl, filename)
    ElMessage.success('开始下载视频')
  } catch (error) {
    console.error('下载视频失败:', error)
    ElMessage.error('下载视频失败，请重试')
  }
}

// 下载图片URL
const downloadImageUrl = async (imageUrl: string, id: string | number, index: number) => {
  try {
    // 从 URL 中提取文件扩展名
    const urlParts = imageUrl.split('?')[0] // 移除查询参数
    if (!urlParts) return
    const urlPath = urlParts.split('/')
    const urlFilename = urlPath[urlPath.length - 1]
    if (!urlFilename) return
    const ext = urlFilename.includes('.') ? urlFilename.split('.').pop() : 'jpg'
    
    const filename = `generated_image_${id}_${index + 1}.${ext}`
    
    await downloadFile(imageUrl, filename)
    ElMessage.success('图片下载成功')
  } catch (error) {
    console.error('下载图片失败:', error)
    ElMessage.error('下载图片失败，请检查网络连接或稍后重试')
  }
}

// 下载视频URL
const downloadVideoUrl = async (videoUrl: string, id: string | number) => {
  try {
    await downloadFile(videoUrl, `generated_video_${id}.mp4`)
    ElMessage.success('视频下载成功')
  } catch (error) {
    console.error('下载视频失败:', error)
    ElMessage.error('下载视频失败，请检查网络连接或稍后重试')
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const saveVideoToAssets = (video: VideoResult) => {
  ElMessage.success('视频已保存到资产库')
}

const downloadImage = async (image: ImageResult) => {
  try {
    // 优先使用 previewImageUrl（预览窗口显示的实际 URL）
    let imageUrl = previewImageUrl.value
    
    // 如果没有 previewImageUrl，则从 image 对象中获取
    if (!imageUrl) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      imageUrl = (image as any).url || (image as any).materialUrl
    }
    
    if (!imageUrl) {
      ElMessage.error('图片 URL 不存在，无法下载')
      return
    }
    
    // 从 URL 中提取文件扩展名
    const urlParts = imageUrl.split('?')[0] // 移除查询参数
    if (!urlParts) return
    const urlPath = urlParts.split('/')
    const urlFilename = urlPath[urlPath.length - 1]
    if (!urlFilename) return
    const ext = urlFilename.includes('.') ? urlFilename.split('.').pop() : 'jpg'
    
    const filename = `generated_image_${image.id}.${ext}`
    
    await downloadFile(imageUrl, filename)
    ElMessage.success('图片下载成功')
  } catch (error) {
    console.error('下载图片失败:', error)
    ElMessage.error('下载图片失败，请检查网络连接或稍后重试')
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const saveToAssets = (image: ImageResult) => {
  ElMessage.success('图片已保存到资产库')
}

const toggleHistory = () => {
  showHistory.value = !showHistory.value
}

const selectHistoryItem = (historyItem: ImageHistoryItem) => {
  currentImages.value = historyItem.images
  showHistory.value = false
}

// 从历史记录重新编辑
const editGeneration = async (result: HistoryResult) => {
  // 1. 填充提示词
  prompt.value = result.prompt || result.tags?.find(t => t.key === 'prompt')?.val || ''
  
  // 2. 设置生成模式（图片或视频）
  const genMode = result.type === 2 ? generateModes.value[1] : generateModes.value[0]
  currentGenerateMode.value = genMode
  
  // 3. 查找并设置模型
  const aiDriverTag = result.tags?.find(t => t.key === 'aiDriver')?.val
  if (aiDriverTag) {
    // 先加载该模型的配置
    await fetchModelConfig(aiDriverTag)
    
    // 然后设置当前模型
    const targetModel = models.value.find(m => m.aiDriver === aiDriverTag)
    if (targetModel) {
      currentModel.value = targetModel
    }
  }
  
  // 4. 根据类型填充不同的参数
  if (result.type === 1) {
    // 图片生成参数
    
    // 清空视频模式的相关数据
    firstFrameImage.value = ''
    firstFrameImageVal.value = ''
    lastFrameImage.value = ''
    lastFrameImageVal.value = ''
    referenceVideo.value = ''
    referenceVideoVal.value = ''
    videoReferenceImages.value = ['', '', '', '']
    videoReferenceImagesVal.value = ['', '', '', '']
    
    // 设置比例
    const aspectRatioTag = result.tags?.find(t => t.key === 'aspectRatio')?.val
    if (aspectRatioTag) {
      const targetSize = imageSizes.value.find(s => s.value === aspectRatioTag)
      if (targetSize) {
        currentSize.value = targetSize
      }
    }
    
    // 设置分辨率 - 可灵模型使用 resolution，其他模型使用 resolutionRatio
    const isKelingModel = result.tags?.find(t => t.key === 'model')?.val?.toLowerCase().includes('klingai') || 
                          result.tags?.find(t => t.key === 'model')?.val?.toLowerCase().includes('keling');
    const resolutionKey = isKelingModel ? 'resolution' : 'resolutionRatio';
    const resolutionTag = result.tags?.find(t => t.key === resolutionKey)?.val;
    if (resolutionTag) {
      const targetResolution = resolutions.value.find(r => r.value === resolutionTag);
      if (targetResolution) {
        currentResolution.value = targetResolution;
      }
    }
    
    // 设置图片张数
    const genImageNumTag = result.tags?.find(t => t.key === 'genImageNum')?.val
    if (genImageNumTag) {
      const targetCount = imageCounts.value.find(c => c.value === parseInt(genImageNumTag))
      if (targetCount) {
        currentImageCount.value = targetCount
      }
    }
    
    // 填充参考图片
    referenceImages.value = []
    const imageTags = result.tags?.filter(t => t.key === 'images' && t.type === 1) || []
    // const imageAssets = result.assets?.filter(a => a.type === 1) || []
    
    imageTags.forEach(imgTag => {
      if (imgTag.val) {
        
        // 直接使用 showVal（原始上传的图片）
        const imageUrl = imgTag.showVal || imgTag.val
        if (imageUrl) {
            // 创建一个临时的 File 对象用于满足 UploadFile 的 raw 属性要求
            const blob = new Blob([''], { type: 'image/jpeg' })
            const file = new File([blob], imgTag.val, { type: 'image/jpeg' })
            
            referenceImages.value.push({
              uid: Date.now().toString() + Math.random(),
              name: imgTag.val,
              url: imageUrl,
              raw: file,
              val: imgTag.val
            })
            
          }
      }
    })
    
  } else if (result.type === 2) {
    // 视频生成参数
    
    // 清空图片模式的参考图片
    referenceImages.value = []
    
    // 设置比例
    const aspectRatioTag = result.tags?.find(t => t.key === 'aspectRatio')?.val
    if (aspectRatioTag) {
      selectedRatio.value = aspectRatioTag
    }
    
    // 设置分辨率
    const resolutionTag = result.tags?.find(t => t.key === 'resolution')?.val
    if (resolutionTag) {
      selectedQuality.value = resolutionTag
    }
    
    // 设置时长
    const durationTag = result.tags?.find(t => t.key === 'duration')?.val
    if (durationTag) {
      selectedDuration.value = durationTag
    }
    
    // 设置生成声音
    const generateAudioTag = result.tags?.find(t => t.key === 'generateAudio')?.val
    if (generateAudioTag) {
      enableAudio.value = generateAudioTag
    }
    
    // 设置生成模式
    const modeTag = result.tags?.find(t => t.key === 'mode')?.val
    if (modeTag) {
      generationMode.value = modeTag
    }
    
    // 设置保留原声
    const keepOriginalSoundTag = result.tags?.find(t => t.key === 'keepOriginalSound')?.val
    if (keepOriginalSoundTag) {
      keepOriginalAudio.value = keepOriginalSoundTag
    }
    
    // 设置可灵参考类型
    const referTypeTag = result.tags?.find(t => t.key === 'referType')?.val
    if (referTypeTag) {
      const targetOption = keLingOptions.value.find(opt => opt.value === referTypeTag)
      if (targetOption) {
        selectedKeLingOption.value = targetOption.label
        selectedKeLingOptionVal.value = targetOption.value
      }
    }
    
    // 清空视频相关的上传数据
    firstFrameImage.value = ''
    firstFrameImageVal.value = ''
    lastFrameImage.value = ''
    lastFrameImageVal.value = ''
    referenceVideo.value = ''
    referenceVideoVal.value = ''
    videoReferenceImages.value = ['', '', '', '']
    videoReferenceImagesVal.value = ['', '', '', '']
    
    // 获取所有图片和视频资源
    // const imageAssets = result.assets?.filter(a => a.type === 1) || []
    // const videoAssets = result.assets?.filter(a => a.type === 2) || []
    
    // 填充首帧图 - 直接使用 tag 的 showVal
    const imageFirstTag = result.tags?.find(t => t.key === 'imageFirst')
    if (imageFirstTag) {
      firstFrameImageVal.value = imageFirstTag.val || ''
      firstFrameImage.value = imageFirstTag.showVal || imageFirstTag.val || ''
    }
    
    // 填充尾帧图 - 直接使用 tag 的 showVal
    const imageTailTag = result.tags?.find(t => t.key === 'imageTail')
    if (imageTailTag) {
      lastFrameImageVal.value = imageTailTag.val || ''
      lastFrameImage.value = imageTailTag.showVal || imageTailTag.val || ''
    }
    
    // 填充参考视频 - 使用原始上传的视频（showVal）
    const uploadVideoTag = result.tags?.find(t => t.key === 'uploadVideo')
    if (uploadVideoTag && uploadVideoTag.val) {
      referenceVideoVal.value = uploadVideoTag.val
      referenceVideo.value = uploadVideoTag.showVal || uploadVideoTag.val
    }
    
    // 填充参考图片（多模态）
    const videoImageTags = result.tags?.filter(t => t.key === 'images' && t.type === 1) || []
    
    // 创建一个已使用的资源集合，避免重复使用
    const usedAssetUrls = new Set<string>()
    if (firstFrameImage.value) usedAssetUrls.add(firstFrameImage.value)
    if (lastFrameImage.value) usedAssetUrls.add(lastFrameImage.value)
    
    videoImageTags.forEach((imgTag, tagIndex) => {
      if (tagIndex < 4 && imgTag.val) {
        videoReferenceImagesVal.value[tagIndex] = imgTag.val
        
        // 直接使用 showVal（原始上传的图片）
        const imageUrl = imgTag.showVal || imgTag.val
        if (imageUrl) {
          videoReferenceImages.value[tagIndex] = imageUrl
          usedAssetUrls.add(imageUrl)
        }
      }
    })
    
  }
  
  // 5. 滚动到顶部，让用户看到输入区域
  setTimeout(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, 100)
  
  ElMessage.success('已加载历史记录，可以重新编辑')
}

// 从历史记录再次生成
const regenerateFromHistory = async (result: HistoryResult) => {
  // 检查是否超过最大并发数
  if (generationTasks.value.length >= maxConcurrentTasks.value) {
    ElMessage.warning(`最多只能同时生成${maxConcurrentTasks.value}个任务`)
    return
  }

  // 创建新的生成任务（用于显示在任务队列中）
  const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  const now = Date.now()
  
  const newTask: GenerationTask = {
    id: taskId,
    prompt: result.prompt || result.tags?.find(t => t.key === 'prompt')?.val || '',
    model: currentModel.value,
    size: currentSize.value!,
    resolution: currentResolution.value!,
    imageCount: currentImageCount.value!,
    referenceImages: [],
    status: 'generating',
    progress: 0,
    progressText: '正在重新生成...',
    images: [],
    createdAt: now,
    type: result.type || 1
  }

  // 添加到任务列表
  generationTasks.value.push(newTask)
  
  // 滚动到底部
  setTimeout(() => {
    scrollToBottom()
  }, 100)

  try {
    // 调用再次生成接口，传入结果的id到userInputId
    const response = await postAIGenerateRetry({ userInputId: result.id }) as ApiResponse<GenerateResponse>
    
    // 如果响应中包含 userInputId，保存到任务中并添加到轮询列表
    if (response && response.data && response.data.userInputId) {
      const userInputId = response.data.userInputId
      const generationTask = generationTasks.value.find(t => t.id === taskId)
      if (generationTask) {
        generationTask.userInputId = userInputId
      }
      
      // 添加到待轮询的 userInputId 集合
      pendingUserInputIds.value.add(userInputId)
      
      // 启动轮询（如果还没有启动）
      startPolling()
      
      // 显示成功提示
      ElMessage.success('已添加到生成队列')
    }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('再次生成请求失败:', error)
    
    // 从任务列表中移除失败的任务
    const taskIndex = generationTasks.value.findIndex(t => t.id === taskId)
    if (taskIndex > -1) {
      generationTasks.value.splice(taskIndex, 1)
    }
    
    // 显示错误信息
    const errorMsg = error?.msg || error?.message || '再次生成请求失败'
    ElMessage.error(errorMsg)
  }
}

// 删除历史记录项
const deleteHistoryItem = async (id: number) => {
  try {
    // 二次确认
    await ElMessageBox.confirm(
      '确定要删除这条记录吗？删除后将无法恢复。',
      '删除确认',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning',
        customClass: 'custom-delete-confirm',
        confirmButtonClass: 'custom-confirm-btn',
        cancelButtonClass: 'custom-cancel-btn',
        center: false,
        showClose: true,
        closeOnClickModal: false,
        closeOnPressEscape: true,
        draggable: false
      }
    )
    
    // 这里调用删除接口
    await deleteGenerate({ id })
    
    // 从列表中移除
    historyResults.value = historyResults.value.filter(item => item.id !== id)
    ElMessage.success('已删除')
  } catch (error) {
    // 用户取消删除
    if (error === 'cancel') {
      return
    }
    console.error('删除失败:', error)
    ElMessage.error('删除失败，请重试')
  }
}

// 时间筛选方法
const selectTimeRange = (range: 'all' | 'week' | 'month') => {
  selectedTimeRange.value = range
  
  const now = new Date()
  
  if (range === 'all') {
    startDate.value = ''
    endDate.value = ''
  } else if (range === 'week') {
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    startDate.value = weekAgo.toISOString().split('T')[0] || ''
    endDate.value = now.toISOString().split('T')[0] || ''
  } else if (range === 'month') {
    const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
    startDate.value = threeMonthsAgo.toISOString().split('T')[0] || ''
    endDate.value = now.toISOString().split('T')[0] || ''
  }
  
  // 应用筛选
  applyFilters()
  
  // 关闭弹窗
  timeFilterVisible.value = false
}

// 类型筛选方法
const selectType = (type: 'all' | 'image' | 'video') => {
  selectedType.value = type
  
  // 应用筛选
  applyFilters()
  
  // 关闭弹窗
  typeFilterVisible.value = false
}

// 应用筛选
const applyFilters = () => {
  // 重置分页
  currentPage.value = 1
  historyResults.value = []
  
  // 重新加载数据
  fetchGenerateResults(1, false)
}

// 禁用开始日期（不能大于结束日期）
const disabledStartDate = (time: Date) => {
  if (!endDate.value) return false
  return time.getTime() > new Date(endDate.value).getTime()
}

// 禁用结束日期（不能小于开始日期）
const disabledEndDate = (time: Date) => {
  if (!startDate.value) return false
  return time.getTime() < new Date(startDate.value).getTime()
}

// 处理开始日期变化
const handleStartDateChange = (value: string) => {
  if (value && endDate.value) {
    // 如果开始日期大于结束日期，清空结束日期
    if (new Date(value).getTime() > new Date(endDate.value).getTime()) {
      endDate.value = ''
      ElMessage.warning('开始日期不能大于结束日期')
    }
  }
  // 设置为自定义模式
  selectedTimeRange.value = 'all'
}

// 处理结束日期变化
const handleEndDateChange = (value: string) => {
  if (value && startDate.value) {
    // 如果结束日期小于开始日期，清空开始日期
    if (new Date(value).getTime() < new Date(startDate.value).getTime()) {
      startDate.value = ''
      ElMessage.warning('结束日期不能小于开始日期')
    }
  }
  // 设置为自定义模式
  selectedTimeRange.value = 'all'
}

// 应用日期筛选
const applyDateFilter = () => {
  if (startDate.value && endDate.value) {
    applyFilters()
    timeFilterVisible.value = false
  }
}

// 处理时间筛选弹窗显示状态变化
const handleTimeFilterVisibleChange = (visible: boolean) => {
  // 如果正在选择日期，阻止关闭
  if (!visible && isSelectingDate.value) {
    nextTick(() => {
      timeFilterVisible.value = true
    })
    return
  }
  timeFilterVisible.value = visible
}

// 处理日期选择器显示状态变化
const handleDatePickerVisibleChange = (visible: boolean) => {
  isSelectingDate.value = visible
}

//获取下拉框配置信息 genType=1 图片生成 genType=2 视频生成
const fetchModelConfig = async (aiDriver?: string) => {
  let genType=1; // 1 图片生成 2 视频生成
  if(currentGenerateMode.value?.value==='image'){
    genType=1;
  }else{
    genType=2;
  }
  try {
    const modelCofig = await getImgModelConfig({ genType: genType,aiDriver:aiDriver||'' }) as ApiResponse<Record<string, unknown>>;
    if(modelCofig && modelCofig.data){
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const config = modelCofig.data as Record<string, any>;
      models.value = config.supports||[];
      if(config){
        // 根据 genType 设置不同的配置
        if(genType===1){
          // 图片生成配置处理
          imageModels.value = config.supports||[];
          // 图片尺寸选项
          imageSizes.value = config.optionsInfo.optionsConf.aspectRatio?.conf.select||[];
          
          // 分辨率选项：可灵模型使用 resolution，其他模型使用 resolutionRatio
          const isKelingModel = aiDriver?.toLowerCase().includes('klingai') || aiDriver?.toLowerCase().includes('keling');
          if (isKelingModel) {
            resolutions.value = config.optionsInfo.optionsConf.resolution?.conf.select||[];
            const defaultResolution = config.optionsInfo.optionsDef.resolution;
            if (defaultResolution && defaultResolution.value) {
              const matchedResolution = resolutions.value.find(res => res.value === defaultResolution.value);
              currentResolution.value = matchedResolution || resolutions.value[0] || null;
            } else {
              currentResolution.value = resolutions.value[0] || null;
            }
          } else {
            resolutions.value = config.optionsInfo.optionsConf.resolutionRatio?.conf.select||config.optionsInfo.optionsConf.resolution?.conf.select||[];
            const defaultResolution = config.optionsInfo.optionsDef.resolutionRatio||config.optionsInfo.optionsDef.resolution
            if (defaultResolution && defaultResolution.value) {
              const matchedResolution = resolutions.value.find(res => res.value === defaultResolution.value);
              currentResolution.value = matchedResolution || resolutions.value[0] || null;
            } else {
              currentResolution.value = resolutions.value[0] || null;
            }
          }
          
          // 图片张数选项
          imageCounts.value = config.optionsInfo.optionsConf?.genImageNum?.conf.select||[];
          
          // 当前选中的选项 - 需要从完整的选项列表中找到匹配的对象（包含 width 和 height）
          const defaultAspectRatio = config.optionsInfo.optionsDef.aspectRatio;
          if (defaultAspectRatio && defaultAspectRatio.value) {
            // 从 imageSizes 中找到匹配的完整对象
            const matchedSize = imageSizes.value.find(size => size.value === defaultAspectRatio.value);
            currentSize.value = matchedSize || imageSizes.value[0];
          } else {
            currentSize.value = imageSizes.value[0];
          }
          
          currentImageCount.value = config.optionsInfo.optionsDef.genImageNum||imageCounts.value[0];
          
        }else if(genType===2){  
          // 视频生成配置处理
          videoModels.value = config.supports||[];
          hasEnableAudio.value=config.optionsInfo.optionsConf.generateAudio?.name?true:false;
          // 视频比例选项
          videoRatios.value = config.optionsInfo.optionsConf.aspectRatio?.conf.select||[];
          //分辨率选项
          videoQualities.value = config.optionsInfo.optionsConf.resolution?.conf.select||[];
          // 时长选项
          videoDurations.value = config.optionsInfo.optionsConf.duration?.conf.select||[];
          generationModes.value = config.optionsInfo.optionsConf.mode?.conf.select||[];
          keepOriginalAudioOptions.value = config.optionsInfo.optionsConf.keepOriginalSound?.conf.select||[];
          //参考模型选项
          keLingOptions.value = config.optionsInfo.optionsConf.referType?.conf.select||[];
          
          // 默认选中的选项
          enableAudio.value=config.optionsInfo.optionsDef.generateAudio?.value;
          selectedRatio.value = config.optionsInfo.optionsDef.aspectRatio?.value;
          selectedQuality.value = config.optionsInfo.optionsDef.resolution?.value;
          selectedDuration.value = config.optionsInfo.optionsDef.duration?.value;
          //默认生成模式
          generationMode.value = config.optionsInfo.optionsDef.mode?.value;
          //默认保留原声选项
          keepOriginalAudio.value = config.optionsInfo.optionsDef.keepOriginalSound?.value;
        }
        // 当前选中的模型
        currentModel.value = config.currentModel;
        // 模型提示词的数量限制
        inputSize.value = config.optionsInfo.optionsConf.prompt.conf.maxLen || 300;
        
        // 如果当前输入的提示词超过新模型的限制，自动截断
        if (prompt.value.length > inputSize.value) {
          prompt.value = prompt.value.substring(0, inputSize.value);
          ElMessage.warning(`提示词已自动截断至${inputSize.value}字以适应当前模型`);
        }
    }else{
      throw new Error('未获取到模型配置');
    }
    // 根据返回的配置更新模型列表等
    } 
  }
  catch (error) {
    console.error('获取生成模型配置失败：', error);
    ElMessage.error('获取生成模型配置失败');
  }
}
fetchModelConfig()
//获取列表
const fetchGenerateResults = async (page: number = 1, append: boolean = false) => {
  if (loadingMore.value) return
  
  try {
    loadingMore.value = true
    // 首次加载时设置初始加载状态
    if (page === 1 && !append) {
      initialLoading.value = true
    }
    
    // 构建筛选参数
    const params: {
      page: number
      pageSize: number
      startTime?: string
      endTime?: string
      type?: number
    } = { 
      page, 
      pageSize: pageSize.value 
    }
    
    // 添加时间筛选
    if (startDate.value) {
      params.startTime = startDate.value
    }
    if (endDate.value) {
      params.endTime = endDate.value
    }
    
    // 添加类型筛选
    if (selectedType.value !== 'all') {
      params.type = selectedType.value === 'image' ? 1 : 2
    }
    
    const results = await getGenerateResults(params) as ApiResponse<{ list: HistoryResult[], total: number }>
    
    if (results && results.data) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { list, total } = results.data
      
      // 处理返回的数据
      const formattedResults: HistoryResult[] = list
        .map((item: {
          id: number
          type: number
          status: number
          createTime: string
          assets?: Asset[]
          tags?: Tag[]
        }) => {
          // 从tags中提取prompt和aiDriver
          const promptTag = item.tags?.find((tag) => tag.key === 'prompt')
          const aiDriverTag = item.tags?.find((tag) => tag.key === 'aiDriver')
          
          // 提取图片URLs
          const images = item.assets
            ?.filter((asset) => asset.type === 1)
            .map((asset) => asset.materialUrl || asset.coverUrl) || []
          
          // 提取视频URL
          const videoUrl = item.assets?.find((asset) => asset.type === 2)?.materialUrl || ''
          
          return {
            id: item.id,
            type: item.type,
            status: item.status,
            createTime: item.createTime,
            assets: item.assets || [],
            tags: item.tags || [],
            // 兼容字段
            prompt: promptTag?.val || '',
            genType: item.type,
            images: images,
            videoUrl: videoUrl,
            aiDriver: aiDriverTag?.val || 'AI模型',
            createdAt: new Date(item.createTime).getTime()
          }
        })
      
      if (append) {
        // 记录当前滚动位置和内容高度
        const mainContent = document.querySelector('.main-content') as HTMLElement
        const oldScrollHeight = mainContent?.scrollHeight || 0
        const oldScrollTop = mainContent?.scrollTop || 0
        
        // 上拉加载时，新数据插入到头部
        historyResults.value = [...formattedResults, ...historyResults.value]
        
        // 等待DOM更新后，调整滚动位置以保持用户视图不变
        nextTick(() => {
          if (mainContent) {
            const newScrollHeight = mainContent.scrollHeight
            const heightDiff = newScrollHeight - oldScrollHeight
            // 调整滚动位置，保持用户看到的内容不变
            mainContent.scrollTop = oldScrollTop + heightDiff
          }
        })
      } else {
        historyResults.value = formattedResults
      }
      
      // 检查是否有 status === 1 的记录，如果有则启动轮询
      const processingResults = formattedResults.filter(item => item.status === 1)
      if (processingResults.length > 0) {
        // 将这些记录的 ID 添加到待轮询集合
        processingResults.forEach(item => {
          pendingResultIds.value.add(item.id)
        })
        // 启动轮询
        startPolling()
      }
      
      // 修复：判断是否还有更多数据
      // 如果当前页返回的原始数据少于每页大小，说明已经到最后一页了
      hasMore.value = list.length >= pageSize.value
      
      // 数据加载完成后，只在追加数据时重新设置 Intersection Observer
      if (append) {
        // 等待 DOM 更新和滚动位置调整完成后，重新设置 Observer
        setTimeout(() => {
          // 先断开旧的 Observer
          if (loadMoreObserver.value) {
            loadMoreObserver.value.disconnect()
            loadMoreObserver.value = null
          }
          // 延迟重新设置，确保滚动位置已经调整
          setTimeout(() => {
            setupIntersectionObserver()
          }, 100)
        }, 600)
      }
    }
  } catch (error) {
    console.error('获取生成结果失败：', error)
    ElMessage.error('获取生成结果失败')
  } finally {
    loadingMore.value = false
    // 首次加载完成后先滚动到底部，再关闭loading
    if (initialLoading.value) {
      // 使用 nextTick 确保 DOM 完全更新
      nextTick(() => {
        // 再延迟一下确保渲染完成
        setTimeout(() => {
          scrollToBottom()
          // 标记初始滚动完成
          isInitialScrollDone.value = true
          // 等待滚动完成后再关闭loading
          setTimeout(() => {
            initialLoading.value = false
            // 首次加载完成后设置Observer
            setTimeout(() => {
              setupIntersectionObserver()
            }, 200)
          }, 500)
        }, 200)
      })
    }
  }
}

// 初始加载
fetchGenerateResults()
//生成接口调用
const sendGenerateRequest = async (task: GenerationObj, taskId: string) => {
  try {
    // 这里调用实际的生成接口
    const response = await postAIGenerate(task) as ApiResponse<GenerateResponse>
    
    // 如果响应中包含 userInputId，保存到任务中并添加到轮询列表
    if (response && response.data && response.data.userInputId) {
      const userInputId = response.data.userInputId
      const generationTask = generationTasks.value.find(t => t.id === taskId)
      if (generationTask) {
        generationTask.userInputId = userInputId
      }
      
      // 添加到待轮询的 userInputId 集合
      pendingUserInputIds.value.add(userInputId)
      
      // 启动轮询（如果还没有启动）
      startPolling()
      
      // 显示成功提示
      ElMessage.success('已添加到生成队列')
    }
    
    return response
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('生成请求失败:', error)
    
    // 从任务列表中移除失败的任务
    const taskIndex = generationTasks.value.findIndex(t => t.id === taskId)
    if (taskIndex > -1) {
      generationTasks.value.splice(taskIndex, 1)
    }
    
    // 显示错误信息
    const errorMsg = error?.msg || error?.message || '生成请求失败'
    ElMessage.error(errorMsg)
    
    // 重新抛出错误，让调用方知道失败了
    throw error
  }
}

// 启动轮询
const startPolling = () => {
  // 如果已经有轮询在运行，不重复启动
  if (pollingTimer.value) return
  
  // 如果没有待轮询的 ID，不启动
  if (pendingUserInputIds.value.size === 0 && pendingResultIds.value.size === 0) return
  
  pollingTimer.value = window.setInterval(async () => {
    await pollGenerateStatus()
  }, 10000) // 每10秒轮询一次
}

// 停止轮询
const stopPolling = () => {
  if (pollingTimer.value) {
    clearInterval(pollingTimer.value)
    pollingTimer.value = null
  }
}

// 轮询生成状态
const pollGenerateStatus = async () => {
  // 如果没有待轮询的 ID，停止轮询
  if (pendingUserInputIds.value.size === 0 && pendingResultIds.value.size === 0) {
    stopPolling()
    return
  }
  
  try {
    // 合并两个集合的 ID
    const allIds = new Set([...pendingUserInputIds.value, ...pendingResultIds.value])
    
    // 将 Set 转换为逗号分隔的字符串
    const userInputIds = Array.from(allIds).join(',')
    
    // 调用状态查询接口
    const response = await getGenerateStatus({ userInputIds }) as ApiResponse<StatusResponse>
    
    if (response && response.data && response.data.list) {
      const statusList = response.data.list
      
      // 遍历返回的状态列表
      for (const statusItem of statusList) {
        const itemId = statusItem.id || statusItem.userInputId
        
        // 如果状态为成功（status === 2），不管有没有 assets 都停止轮询
        if (statusItem.status === 2) {
          // 检查是否是历史记录中的项（status === 1 的记录）
          if (pendingResultIds.value.has(itemId)) {
            // 从待轮询列表中移除
            pendingResultIds.value.delete(itemId)
            
            // 在 historyResults 中找到对应的记录并替换
            const resultIndex = historyResults.value.findIndex(r => r.id === itemId)
            if (resultIndex > -1) {
              const existingResult = historyResults.value[resultIndex]
              if (existingResult) {
                // 如果没有 assets 或 assets 为空，使用缺省图
                const hasAssets = statusItem.assets && statusItem.assets.length > 0
                const images = hasAssets 
                  ? (statusItem.assets || [])
                      .filter((asset) => asset.type === 1)
                      .map((asset) => asset.materialUrl || asset.coverUrl)
                  : ['data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2Y1ZjVmNSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj7nlJ/miJDlpLHotKU8L3RleHQ+PC9zdmc+'] // 缺省图的 base64
                
                const videoUrl = hasAssets 
                  ? (statusItem.assets || []).find((asset) => asset.type === 2)?.materialUrl || ''
                  : ''
                
                // 构建新的结果对象
                const updatedResult: HistoryResult = {
                  id: itemId,
                  type: statusItem.type || existingResult.type,
                  status: statusItem.status,
                  createTime: statusItem.createTime || existingResult.createTime,
                  assets: statusItem.assets || [],
                  tags: statusItem.tags || existingResult.tags,
                  prompt: statusItem.tags?.find(t => t.key === 'prompt')?.val || existingResult.prompt,
                  genType: statusItem.type || existingResult.genType,
                  aiDriver: statusItem.tags?.find(t => t.key === 'aiDriver')?.val || existingResult.aiDriver,
                  images,
                  videoUrl,
                  createdAt: new Date(statusItem.createTime || existingResult.createTime).getTime()
                }
                
                // 替换原有记录
                historyResults.value.splice(resultIndex, 1, updatedResult)
                
                // 显示成功提示
                ElMessage.success({
                  message: hasAssets 
                    ? `${statusItem.type === 2 ? '视频' : '图片'}生成完成`
                    : `${statusItem.type === 2 ? '视频' : '图片'}生成完成（无资源数据）`,
                  duration: 3000
                })
              }
            }
          }
          // 检查是否是新生成任务（generationTasks 中的任务）
          else if (pendingUserInputIds.value.has(itemId)) {
            // 从待轮询列表中移除
            pendingUserInputIds.value.delete(itemId)
            
            // 从任务列表中移除对应的任务
            const taskIndex = generationTasks.value.findIndex(t => t.userInputId === itemId)
            if (taskIndex > -1) {
              generationTasks.value.splice(taskIndex, 1)
            }
            
            // 如果没有 assets 或 assets 为空，使用缺省图
            const hasAssets = statusItem.assets && statusItem.assets.length > 0
            const images = hasAssets 
              ? (statusItem.assets || [])
                  .filter((asset) => asset.type === 1)
                  .map((asset) => asset.materialUrl || asset.coverUrl)
              : ['data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2Y1ZjVmNSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj7nlJ/miJDlpLHotKU8L3RleHQ+PC9zdmc+'] // 缺省图的 base64
            
            const videoUrl = hasAssets 
              ? (statusItem.assets || []).find((asset) => asset.type === 2)?.materialUrl || ''
              : ''
            
            // 动态将完成的结果插入到列表底部
            const newResult: HistoryResult = {
              id: itemId,
              type: statusItem.type || 1,
              status: statusItem.status,
              createTime: statusItem.createTime || new Date().toISOString(),
              assets: statusItem.assets || [],
              tags: statusItem.tags || [],
              prompt: statusItem.tags?.find(t => t.key === 'prompt')?.val || '',
              genType: statusItem.type,
              aiDriver: statusItem.tags?.find(t => t.key === 'aiDriver')?.val || 'AI模型',
              images,
              videoUrl,
              createdAt: new Date(statusItem.createTime || new Date().toISOString()).getTime()
            }
            
            // 插入到结果列表底部
            historyResults.value.push(newResult)
            
            // 滚动到底部 - 使用更长的延迟确保 DOM 更新
            setTimeout(() => {
              scrollToBottom()
            }, 100)
          }
        }
        // 如果状态为失败（status === 3 表示失败）
        else if (statusItem.status === 3) {
          // 从两个待轮询列表中移除
          pendingResultIds.value.delete(itemId)
          pendingUserInputIds.value.delete(itemId)
          
          // 检查是否在历史记录中
          const resultIndex = historyResults.value.findIndex(r => r.id === itemId)
          if (resultIndex > -1) {
            const existingResult = historyResults.value[resultIndex]
            if (existingResult) {
              // 更新状态为失败
              existingResult.status = 3
            }
          } else {
            // 如果不在历史记录中（新生成的任务），插入失败记录到列表底部
            const failedResult: HistoryResult = {
              id: itemId,
              type: statusItem.type || 1,
              status: 3,
              createTime: statusItem.createTime || new Date().toISOString(),
              assets: statusItem.assets || [],
              tags: statusItem.tags || [],
              prompt: statusItem.tags?.find(t => t.key === 'prompt')?.val || '',
              genType: statusItem.type || 1,
              aiDriver: statusItem.tags?.find(t => t.key === 'aiDriver')?.val || 'AI模型',
              images: [],
              videoUrl: '',
              createdAt: new Date(statusItem.createTime || new Date().toISOString()).getTime()
            }
            
            // 插入到结果列表底部
            historyResults.value.push(failedResult)
            
            // 滚动到底部
            setTimeout(() => {
              scrollToBottom()
            }, 100)
          }
          
          // 从任务列表中移除对应的任务
          const taskIndex = generationTasks.value.findIndex(t => t.userInputId === itemId)
          if (taskIndex > -1) {
            generationTasks.value.splice(taskIndex, 1)
          }
          
          // 显示友好的失败提示
          ElMessage.error({
            message: `生成失败：${statusItem.tags?.find(t => t.key === 'prompt')?.val || '内容生成遇到问题，请稍后重试'}`,
            duration: 5000,
            showClose: true
          })
        }
      }
      
      // 如果所有 ID 都已完成，停止轮询
      if (pendingUserInputIds.value.size === 0 && pendingResultIds.value.size === 0) {
        stopPolling()
      }
    }
  } catch (error) {
    console.error('轮询状态失败:', error)
  }
}


// 新增方法
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const clearAllImages = () => {
  referenceImages.value = []
  ElMessage.success('已清空所有参考图片')
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const regenerateAll = () => {
  handleGenerate()
}

// 滚动到底部函数
const scrollToBottom = () => {
  console.log('🎯 scrollToBottom called')
  
  // 等待一小段时间确保DOM完全渲染
  setTimeout(() => {
    // 尝试方法1：找到最后一个生成任务或结果，滚动到它
    const lastTask = document.querySelector('.generation-card:last-child')
    if (lastTask) {
      console.log('Found last task, scrolling into view')
      lastTask.scrollIntoView({ behavior: 'auto', block: 'end' })
      console.log('✅ scrollToBottom completed (scrollIntoView)')
      return
    }
    
    // 方法2：直接操作 main-content
    const mainContent = document.querySelector('.main-content') as HTMLElement
    if (mainContent) {
      // 尝试多次设置，确保生效
      mainContent.scrollTop = mainContent.scrollHeight
      setTimeout(() => {
        mainContent.scrollTop = mainContent.scrollHeight
      }, 50)
    }
  }, 100)
}

// 滚动监听函数
const handleScroll = () => {
  // 尝试获取滚动信息，优先使用 .main-content，如果不可滚动则使用 window
  const mainContent = document.querySelector('.main-content') as HTMLElement
  
  let currentScrollTop = 0
  
  if (mainContent && mainContent.scrollHeight > mainContent.clientHeight) {
    currentScrollTop = mainContent.scrollTop
  } else {
    currentScrollTop = window.scrollY || document.documentElement.scrollTop
  }
  
  // 先判断滚动方向
  if (currentScrollTop > lastScrollTop.value) {
    scrollDirection.value = 'down'
  } else if (currentScrollTop < lastScrollTop.value) {
    scrollDirection.value = 'up'
  }
  
  // 检测是否滚动到顶部附近（距离顶部小于200px）
  // 简化逻辑：只要满足条件就触发，用标记防止重复
  if (currentScrollTop < 200 && hasMore.value && !loadingMore.value && isInitialScrollDone.value && !isLoadingTriggered.value) {
    isLoadingTriggered.value = true
    currentPage.value++
    fetchGenerateResults(currentPage.value, true)
  }
  
  // 当滚动离开顶部区域时，重置触发标记
  if (currentScrollTop > 300) {
    isLoadingTriggered.value = false
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
  // 只有当有历史结果或生成任务时才显示面板
  if (!historyResults.value.length && !generationTasks.value.length) return ''
  
  // 向下滚动时收缩，向上滚动或停止滚动时展开
  if (isScrolling.value && scrollDirection.value === 'down') {
    return 'collapsed'
  } else if (!isScrolling.value || scrollDirection.value === 'up') {
    return 'expanded'
  }
  
  return 'expanded'
}

// 组件挂载时添加滚动监听和 Intersection Observer
onMounted(() => {
  // 监听多个可能的滚动容器
  const mainContent = document.querySelector('.main-content')
  const contentBody = document.querySelector('.content-body')
  const layoutMainContent = document.querySelector('.main-layout .main-content')
  
  if (mainContent) {
    mainContent.addEventListener('scroll', handleScroll, { passive: true })
  }
  
  if (contentBody) {
    contentBody.addEventListener('scroll', handleScroll, { passive: true })
  }
  
  if (layoutMainContent) {
    layoutMainContent.addEventListener('scroll', handleScroll, { passive: true })
  }
  
  window.addEventListener('scroll', handleScroll, { passive: true })
  
  // 添加键盘事件监听（用于图片预览左右切换）
  window.addEventListener('keydown', handlePreviewKeydown)
  
  // 不在这里设置 Observer，等初始加载完成后再设置
})

// 监听预览对话框状态，控制页面滚动
watch([previewVisible, videoPreviewVisible, uploadPreviewVisible], ([newPreview, newVideoPreview, newUploadPreview]) => {
  if (newPreview || newVideoPreview || newUploadPreview) {
    // 打开预览时禁止滚动
    document.body.style.overflow = 'hidden'
  } else {
    // 关闭预览时恢复滚动
    document.body.style.overflow = ''
  }
})

// 设置 Intersection Observer 监听底部元素
const setupIntersectionObserver = () => {
  // 断开旧的 Observer
  if (loadMoreObserver.value) {
    loadMoreObserver.value.disconnect()
  }
  
  // 只查找哨兵元素
  const sentinelEl = document.querySelector('.scroll-sentinel')
  
  if (!sentinelEl) {
    console.warn('No sentinel element found for IntersectionObserver')
    return
  }
  
  // 查找滚动容器
  const mainContent = document.querySelector('.main-content') as HTMLElement
  const scrollContainer = mainContent || null
  
  console.log('setupIntersectionObserver called:', {
    sentinelEl,
    scrollContainer,
    hasMore: hasMore.value,
    loadingMore: loadingMore.value,
    sentinelRect: sentinelEl.getBoundingClientRect(),
    containerRect: scrollContainer?.getBoundingClientRect()
  })
  
  // 创建 Intersection Observer
  loadMoreObserver.value = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        // 只有当元素真正进入视口时才触发加载
        // 使用 intersectionRatio > 0 确保元素至少部分可见
        if (entry.isIntersecting && entry.intersectionRatio > 0 && hasMore.value && !loadingMore.value) {
          currentPage.value++
          fetchGenerateResults(currentPage.value, true)
        }
      })
    },
    {
      root: scrollContainer,
      rootMargin: '500px 0px 0px 0px', // 向上扩展500px，提前触发加载
      threshold: [0, 0.1, 0.5, 1] // 多个阈值，确保能捕获到变化
    }
  )
  
  loadMoreObserver.value.observe(sentinelEl)
}

// 组件卸载时移除滚动监听和 Observer
onUnmounted(() => {
  const mainContent = document.querySelector('.main-content')
  const contentBody = document.querySelector('.content-body')
  const layoutMainContent = document.querySelector('.main-layout .main-content')
  
  if (mainContent) {
    mainContent.removeEventListener('scroll', handleScroll)
  }
  
  if (contentBody) {
    contentBody.removeEventListener('scroll', handleScroll)
  }
  
  if (layoutMainContent) {
    layoutMainContent.removeEventListener('scroll', handleScroll)
  }
  
  // 移除 window 滚动监听
  window.removeEventListener('scroll', handleScroll)
  
  // 移除键盘事件监听
  window.removeEventListener('keydown', handlePreviewKeydown)
  
  // 断开 Intersection Observer
  if (loadMoreObserver.value) {
    loadMoreObserver.value.disconnect()
    loadMoreObserver.value = null
  }
  
  // 清理轮询定时器
  stopPolling()
  
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

/* 初始加载动画 - 优化版 */
.initial-loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, 
    rgba(15, 23, 42, 0.98) 0%, 
    rgba(30, 41, 59, 0.98) 50%,
    rgba(15, 23, 42, 0.98) 100%
  );
  backdrop-filter: blur(20px) saturate(180%);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  animation: fadeIn 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

/* 添加动态背景粒子效果 */
.initial-loading-overlay::before {
  content: '';
  position: absolute;
  width: 200%;
  height: 200%;
  background-image: 
    radial-gradient(circle at 20% 50%, rgba(99, 102, 241, 0.15) 0%, transparent 50%),
    radial-gradient(circle at 80% 80%, rgba(168, 85, 247, 0.15) 0%, transparent 50%),
    radial-gradient(circle at 40% 20%, rgba(59, 130, 246, 0.15) 0%, transparent 50%);
  animation: floatBackground 20s ease-in-out infinite;
}

@keyframes floatBackground {
  0%, 100% {
    transform: translate(0, 0) rotate(0deg);
  }
  33% {
    transform: translate(-5%, 5%) rotate(120deg);
  }
  66% {
    transform: translate(5%, -5%) rotate(240deg);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 40px;
  padding: 60px 80px;
  background: linear-gradient(135deg, 
    rgba(30, 41, 59, 0.6) 0%, 
    rgba(51, 65, 85, 0.4) 100%
  );
  border-radius: 32px;
  border: 1px solid rgba(148, 163, 184, 0.1);
  box-shadow: 
    0 25px 50px -12px rgba(0, 0, 0, 0.5),
    0 0 0 1px rgba(255, 255, 255, 0.05) inset,
    0 0 100px rgba(99, 102, 241, 0.2);
  position: relative;
  overflow: hidden;
  backdrop-filter: blur(10px);
  z-index: 1;
}

/* 光晕效果 */
.loading-content::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: linear-gradient(
    45deg,
    transparent 30%,
    rgba(99, 102, 241, 0.08) 50%,
    transparent 70%
  );
  animation: shimmer 4s ease-in-out infinite;
}

@keyframes shimmer {
  0% {
    transform: translateX(-100%) translateY(-100%) rotate(45deg);
  }
  100% {
    transform: translateX(100%) translateY(100%) rotate(45deg);
  }
}

.loading-spinner {
  position: relative;
  width: 140px;
  height: 140px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.spinner-ring {
  position: absolute;
  border-radius: 50%;
  border: 3px solid transparent;
}

.spinner-ring:nth-child(1) {
  width: 140px;
  height: 140px;
  border-top-color: #6366f1;
  border-right-color: #6366f1;
  animation: spin 2s cubic-bezier(0.68, -0.55, 0.265, 1.55) infinite;
  filter: drop-shadow(0 0 20px rgba(99, 102, 241, 0.6));
}

.spinner-ring:nth-child(2) {
  width: 105px;
  height: 105px;
  border-bottom-color: #8b5cf6;
  border-left-color: #8b5cf6;
  animation: spin 2.5s cubic-bezier(0.68, -0.55, 0.265, 1.55) infinite reverse;
  filter: drop-shadow(0 0 15px rgba(139, 92, 246, 0.6));
}

.spinner-ring:nth-child(3) {
  width: 70px;
  height: 70px;
  border-top-color: #3b82f6;
  border-right-color: #3b82f6;
  animation: spin 1.5s cubic-bezier(0.68, -0.55, 0.265, 1.55) infinite;
  filter: drop-shadow(0 0 10px rgba(59, 130, 246, 0.6));
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.spinner-core {
  width: 56px;
  height: 56px;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #3b82f6 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 
    0 0 30px rgba(99, 102, 241, 0.8),
    0 0 60px rgba(139, 92, 246, 0.5),
    0 0 0 4px rgba(255, 255, 255, 0.1),
    inset 0 0 20px rgba(255, 255, 255, 0.2);
  animation: pulse 2.5s ease-in-out infinite;
  z-index: 1;
  position: relative;
}

/* 核心光晕 */
.spinner-core::after {
  content: '';
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.3) 0%, transparent 70%);
  animation: coreGlow 2s ease-in-out infinite;
}

@keyframes coreGlow {
  0%, 100% {
    transform: scale(1);
    opacity: 0.5;
  }
  50% {
    transform: scale(1.2);
    opacity: 0.8;
  }
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    box-shadow: 
      0 0 30px rgba(99, 102, 241, 0.8),
      0 0 60px rgba(139, 92, 246, 0.5),
      0 0 0 4px rgba(255, 255, 255, 0.1),
      inset 0 0 20px rgba(255, 255, 255, 0.2);
  }
  50% {
    transform: scale(1.15);
    box-shadow: 
      0 0 40px rgba(99, 102, 241, 1),
      0 0 80px rgba(139, 92, 246, 0.7),
      0 0 0 6px rgba(255, 255, 255, 0.2),
      inset 0 0 30px rgba(255, 255, 255, 0.3);
  }
}

.spinner-icon {
  font-size: 28px;
  color: #ffffff;
  filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.5));
  animation: iconFloat 3s ease-in-out infinite;
  z-index: 1;
}

@keyframes iconFloat {
  0%, 100% {
    transform: translateY(0) scale(1);
  }
  50% {
    transform: translateY(-3px) scale(1.05);
  }
}

.loading-text {
  font-size: 20px;
  color: rgba(255, 255, 255, 0.95);
  font-weight: 600;
  letter-spacing: 3px;
  display: flex;
  align-items: center;
  gap: 6px;
  position: relative;
  z-index: 1;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
}

.text-shimmer {
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.9) 0%,
    rgba(99, 102, 241, 1) 25%,
    rgba(139, 92, 246, 1) 50%,
    rgba(59, 130, 246, 1) 75%,
    rgba(255, 255, 255, 0.9) 100%
  );
  background-size: 200% 100%;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: textShimmer 3s ease-in-out infinite;
}

@keyframes textShimmer {
  0%, 100% {
    background-position: 200% center;
  }
  50% {
    background-position: 0% center;
  }
}

.loading-dots-text {
  display: inline-flex;
  gap: 3px;
}

.dot-text {
  animation: dotFade 1.4s ease-in-out infinite;
  color: rgba(99, 102, 241, 1);
  font-weight: bold;
  text-shadow: 0 0 10px rgba(99, 102, 241, 0.8);
}

.dot-text:nth-child(1) {
  animation-delay: 0s;
}

.dot-text:nth-child(2) {
  animation-delay: 0.2s;
}

.dot-text:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes dotFade {
  0%, 60%, 100% {
    opacity: 0.3;
    transform: translateY(0) scale(1);
  }
  30% {
    opacity: 1;
    transform: translateY(-4px) scale(1.2);
  }
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
  max-width: 729px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  position: relative;
  padding-bottom: 56px; /* 为固定的生成按钮留出空间 */
}

/* 输入区域上半部分 */
.input-top-section {
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  padding: 12px 16px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 60px;
}

/* 输入区域下半部分 */
.input-bottom-section {
  display: flex;
  align-items: center;
  gap: 12px;
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

/* 缺省图片上传按钮样式 */
.upload-btn-placeholder {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, rgba(74, 144, 226, 0.08) 0%, rgba(102, 126, 234, 0.08) 100%);
  border: 1.5px dashed rgba(74, 144, 226, 0.3);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.upload-btn-placeholder::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: rgba(74, 144, 226, 0.1);
  transform: translate(-50%, -50%);
  transition: width 0.4s ease, height 0.4s ease;
}

.upload-btn-placeholder:hover::before {
  width: 100%;
  height: 100%;
}

.upload-btn-placeholder:hover {
  border-color: #4A90E2;
  background: linear-gradient(135deg, rgba(74, 144, 226, 0.15) 0%, rgba(102, 126, 234, 0.15) 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(74, 144, 226, 0.25);
}

.upload-btn-placeholder.small {
  width: 40px;
  height: 40px;
  border-radius: 8px;
}

.placeholder-icon {
  width: 24px;
  height: 24px;
  color: rgba(74, 144, 226, 0.6);
  transition: all 0.3s ease;
  position: relative;
  z-index: 1;
}

.upload-btn-placeholder.small .placeholder-icon {
  width: 20px;
  height: 20px;
}

.upload-btn-placeholder:hover .placeholder-icon {
  color: #4A90E2;
  transform: scale(1.1);
}

.upload-btn-placeholder.disabled {
  opacity: 0.4;
  cursor: not-allowed;
  border-color: rgba(255, 255, 255, 0.15);
  background: rgba(255, 255, 255, 0.05);
}

.upload-btn-placeholder.disabled:hover {
  border-color: rgba(255, 255, 255, 0.15);
  background: rgba(255, 255, 255, 0.05);
  transform: none;
  box-shadow: none;
}

.upload-btn-placeholder.disabled .placeholder-icon {
  color: rgba(255, 255, 255, 0.3);
}

.upload-btn-placeholder.disabled:hover .placeholder-icon {
  transform: none;
}

.upload-btn-placeholder.disabled::before {
  display: none;
}

/* 文本输入区域 */
.text-input-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
  height: 56px;
  justify-content: center; /* 垂直居中对齐 */
}

.main-input {
  height: 100%;
}

.main-input :deep(.el-textarea__inner) {
  background: transparent;
  border: none;
  color: #ffffff;
  font-size: 14px;
  line-height: 1.5;
  resize: none;
  padding: 0;
  box-shadow: none;
  min-height: 56px !important;
  max-height: 200px !important;
  height: auto !important;
  overflow-y: auto !important;
  display: flex;
  align-items: flex-start;
  padding-right: 8px;
}

.main-input :deep(.el-textarea__inner)::-webkit-scrollbar {
  width: 6px;
}

.main-input :deep(.el-textarea__inner)::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 3px;
}

.main-input :deep(.el-textarea__inner)::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
}

.main-input :deep(.el-textarea__inner)::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
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
  bottom: 2px;
  position: absolute;
}

.main-input.compact :deep(.el-textarea__inner) {
  font-size: 13px;
  min-height: 40px !important;
  max-height: 150px !important;
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
  flex: 1;
  min-width: 0;
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

.model-icon-img {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  object-fit: cover;
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
  border-radius: 14px !important;
  padding: 0 !important;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.4) !important;
  z-index: 2000 !important;
  overflow: hidden !important;
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
  border-radius: 14px !important;
  padding: 0 !important;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.4) !important;
  overflow: hidden !important;
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
  border-radius: 14px;
  overflow: hidden;
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

/* 生成按钮固定在右下角 */
.generate-section-fixed {
  position: absolute;
  bottom: 0;
  right: 0;
  z-index: 10;
}

/* 生成按钮内联显示（居中输入区域） */
.generate-section-inline {
  flex-shrink: 0;
  margin-left: auto;
}

.generate-btn {
  background: linear-gradient(135deg, #4A90E2, #357ABD);
  border: none;
  color: #ffffff;
  height: 40px;
  padding: 0 24px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
  min-width: 80px;
  box-shadow: 0 2px 8px rgba(74, 144, 226, 0.3);
}

.generate-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(74, 144, 226, 0.5);
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
  flex-direction: row;
  gap: 12px;
  align-items: flex-start;
}

.video-upload-multimodal.compact {
  gap: 8px;
}

.upload-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  position: relative;
}

/* 新的视频上传区域样式 */
.upload-area-video {
  width: 48px;
  height: 48px;
  border: 1.5px dashed rgba(74, 144, 226, 0.4);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, rgba(74, 144, 226, 0.08) 0%, rgba(102, 126, 234, 0.08) 100%);
}

.upload-area-video.compact {
  width: 40px;
  height: 40px;
}

.upload-area-video.uploading {
  border-color: #4A90E2;
  border-style: solid;
  cursor: not-allowed;
  background: linear-gradient(135deg, rgba(74, 144, 226, 0.12) 0%, rgba(102, 126, 234, 0.12) 100%);
  overflow: hidden;
}

.upload-area-video.has-video {
  overflow: visible;
}

.upload-area-video:hover {
  border-color: #4A90E2;
  background: linear-gradient(135deg, rgba(74, 144, 226, 0.15) 0%, rgba(102, 126, 234, 0.15) 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(74, 144, 226, 0.25);
}

.upload-area-video.uploading:hover {
  transform: none;
  box-shadow: none;
}

.upload-area-video.has-video {
  border-style: solid;
  border-color: #4A90E2;
}

.upload-placeholder-video {
  color: rgba(74, 144, 226, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.upload-placeholder-video.compact {
  font-size: 18px;
}

.upload-area-video:hover .upload-placeholder-video {
  color: #4A90E2;
  transform: scale(1.1);
}

/* 视频上传进度覆盖层 */
.upload-progress-overlay {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  height: 100%;
}

.upload-progress-overlay.compact {
  gap: 4px;
}

/* 自定义进度圈 */
.progress-ring {
  position: relative;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.progress-ring.compact {
  width: 32px;
  height: 32px;
}

.progress-svg {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.progress-bg {
  fill: none;
  stroke: rgba(74, 144, 226, 0.15);
  stroke-width: 2.5;
}

.progress-bar {
  fill: none;
  stroke: #4A90E2;
  stroke-width: 2.5;
  stroke-linecap: round;
  stroke-dasharray: 100;
  transition: stroke-dashoffset 0.3s ease;
}

.progress-percent {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 10px;
  font-weight: 600;
  color: #4A90E2;
  line-height: 1;
}

.progress-ring.compact .progress-percent {
  font-size: 9px;
}

.upload-progress-overlay .progress-text {
  font-size: 10px;
  font-weight: 600;
  color: #4A90E2;
}

.upload-progress-overlay .progress-text.small {
  font-size: 8px;
}

.upload-progress-overlay .progress-tip {
  font-size: 9px;
  color: rgba(255, 255, 255, 0.6);
  margin-top: 2px;
}

.upload-progress-overlay .progress-tip.small {
  font-size: 8px;
  margin-top: 1px;
}

/* 新的图片上传区域样式 */
.upload-area-image {
  width: 40px;
  height: 40px;
  border: 1.5px dashed rgba(74, 144, 226, 0.3);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, rgba(74, 144, 226, 0.06) 0%, rgba(102, 126, 234, 0.06) 100%);
}

.upload-area-image.compact {
  width: 32px;
  height: 32px;
}

.upload-area-image:hover {
  border-color: #4A90E2;
  background: linear-gradient(135deg, rgba(74, 144, 226, 0.12) 0%, rgba(102, 126, 234, 0.12) 100%);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(74, 144, 226, 0.2);
}

.upload-area-image.disabled {
  opacity: 0.4;
  cursor: not-allowed;
  border-color: rgba(255, 255, 255, 0.15);
  background: rgba(255, 255, 255, 0.05);
}

.upload-area-image.disabled:hover {
  border-color: rgba(255, 255, 255, 0.15);
  background: rgba(255, 255, 255, 0.05);
  transform: none;
  box-shadow: none;
}

.upload-placeholder-image {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  transition: all 0.3s ease;
}

.placeholder-icon-small {
  width: 16px;
  height: 16px;
  color: rgba(74, 144, 226, 0.6);
  transition: all 0.3s ease;
}

.upload-area-image:hover .placeholder-icon-small {
  color: #4A90E2;
  transform: scale(1.1);
}

.upload-count {
  font-size: 9px;
  color: rgba(74, 144, 226, 0.7);
  font-weight: 500;
  margin-top: 1px;
}

.upload-area-image:hover .upload-count {
  color: #4A90E2;
}

.upload-label {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.7);
  text-align: center;
  font-weight: 500;
}

.upload-area {
  width: 56px;
  height: 56px;
  border: 2px dashed rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: visible;
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

/* 视频预览包装器 */
.video-preview-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  cursor: pointer;
  border-radius: 6px;
  overflow: hidden;
}

.video-preview-wrapper:hover .video-play-overlay {
  opacity: 1;
}

/* 视频播放覆盖层 */
.video-play-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.3);
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
}

.video-play-overlay .play-icon {
  color: white;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
  transition: transform 0.3s ease;
}

.video-preview-wrapper:hover .video-play-overlay .play-icon {
  transform: scale(1.1);
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

/* 参考图片叠加效果 */
.reference-thumbnails-stack {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  overflow: visible;
}

.reference-thumb-item {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  background: white;
  border: 2px solid rgba(255, 255, 255, 0.1);
}

.reference-thumb-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* hover展开效果 - 从左往右依次展开，盖住右边的文字 */
.reference-thumbnails-stack.has-hover:hover .reference-thumb-item:nth-child(1) {
  transform: translateX(0px) translateY(0px) scale(1.1) !important;
  z-index: 104 !important;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
}

.reference-thumbnails-stack.has-hover:hover .reference-thumb-item:nth-child(2) {
  transform: translateX(110%) translateY(0px) scale(1.1) !important;
  z-index: 103 !important;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
}

.reference-thumbnails-stack.has-hover:hover .reference-thumb-item:nth-child(3) {
  transform: translateX(220%) translateY(0px) scale(1.1) !important;
  z-index: 102 !important;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
}

.reference-thumbnails-stack.has-hover:hover .reference-thumb-item:nth-child(4) {
  transform: translateX(330%) translateY(0px) scale(1.1) !important;
  z-index: 101 !important;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
}

/* 默认缺省图样式 */
.default-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.default-icon {
  opacity: 0.8;
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

/* 可灵选项弹窗样式 - 与生成方式选择保持一致 */
:deep(.keling-popover) {
  background: rgba(26, 26, 46, 0.95) !important;
  backdrop-filter: blur(20px) !important;
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
  border-radius: 14px !important;
  padding: 0 !important;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.4) !important;
  z-index: 2000 !important;
  overflow: hidden !important;
}

:deep(.keling-popover .el-popover__content) {
  background: transparent !important;
  border: none !important;
  padding: 0 !important;
  box-shadow: none !important;
}

.keling-selector {
  padding: 10px;
  min-width: 180px;
  background: rgba(26, 26, 46, 0.98);
  backdrop-filter: blur(20px);
  border-radius: 14px;
  overflow: hidden;
}

.keling-selector .selector-header {
  font-size: 12px;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 8px;
  padding-bottom: 6px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  text-align: center;
}

.option-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.option-item {
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
  gap: 1px;
  flex: 1;
  min-width: 0;
}

.option-name {
  font-size: 12px;
  font-weight: 600;
  color: #ffffff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.option-item.active .option-name {
  color: #ffffff;
}

.option-desc {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.65);
  line-height: 1.4;
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
  border-radius: 14px !important;
  padding: 0 !important;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.4) !important;
  z-index: 2000 !important;
  overflow: hidden !important;
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
  border-radius: 14px;
  overflow: hidden;
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
  color: rgba(255, 255, 255, 0.95);
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
}

.keling-option-btn:hover {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.3);
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
  flex: 1;
  margin: 0 auto;
  padding: 0 40px;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  overflow-x: hidden;
  min-height: 0; /* 重要：允许 flex 子元素滚动 */
  scroll-behavior: smooth; /* 启用平滑滚动 */
}

/* 快速滚动动画 */
@media (prefers-reduced-motion: no-preference) {
  .main-content {
    scroll-behavior: smooth;
  }
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
/* 上传图片预览区域 - 统一样式 */
.upload-preview-section {
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding-top: 12px;
  margin-top: 12px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 12px;
  padding: 12px;
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

/* 统一的上传图片预览样式 - 适用于有内容和无内容时 */
.upload-preview-section.compact {
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

/* 悬浮面板中的compact样式覆盖 */
.floating-input-panel .upload-preview-section.compact {
  margin-top: 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  padding-top: 8px;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 6px;
  padding: 8px;
  max-width: none;
  margin: 8px 0 0 0;
}

.upload-preview-section.compact .preview-label {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 8px;
  font-weight: 500;
}

.floating-input-panel .upload-preview-section.compact .preview-label {
  font-size: 10px;
  margin-bottom: 6px;
}

.upload-preview-section.compact .upload-preview-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 0;
}

.floating-input-panel .upload-preview-section.compact .upload-preview-list {
  gap: 6px;
}

.upload-preview-section.compact .upload-preview-item {
  position: relative;
  width: 48px;
  height: 48px;
  border-radius: 6px;
  overflow: visible;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(4px);
}

.floating-input-panel .upload-preview-section.compact .upload-preview-item {
  width: 36px;
  height: 36px;
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

/* 视频上传区域的删除按钮显示 */
.upload-area-video:hover .remove-btn-corner {
  opacity: 1;
}

.upload-area-video .remove-btn-corner {
  top: -6px;
  right: -6px;
}

/* 首尾帧上传区域的删除按钮显示 */
.upload-area:hover .remove-btn-corner {
  opacity: 1;
}

.upload-area .remove-btn-corner {
  opacity: 0;
  transition: opacity 0.2s ease;
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
  gap: 12px;
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
  flex: 1;
  min-width: 0;
}

.panel-bottom-section .generate-section {
  flex-shrink: 0;
  margin-left: auto;
}


/* 结果展示区域 */
.results-section {
  flex: 1;
  overflow: visible;
  padding-bottom: 200px; /* 增加底部间距，确保生成器不遮挡内容 */
  position: relative;
  z-index: 1;
}
/* 多任务生成中状态 - 已移除独立容器，现在直接在 results-display 中 */

/* 生成中状态 - 插入动画 */
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
  border-bottom: 1px solid rgba(74, 144, 226, 0.2);
  margin-bottom: 24px;
  opacity: 1;
  animation: slideInFromTop 0.4s ease-out;
}

/* 视频生成中 - 紫色主题 */
.generation-card.generating.generating-video {
  border-bottom-color: rgba(147, 51, 234, 0.3);
}

/* 图片生成中 - 蓝色主题 */
.generation-card.generating.generating-image {
  border-bottom-color: rgba(74, 144, 226, 0.3);
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

/* 视频缩略图 - 紫色边框 */
.generation-thumbnail.generating-thumb.video-thumb {
  background: rgba(147, 51, 234, 0.08);
  border-color: rgba(147, 51, 234, 0.3);
}

/* 图片缩略图 - 蓝色边框 */
.generation-thumbnail.generating-thumb.image-thumb {
  background: rgba(74, 144, 226, 0.08);
  border-color: rgba(74, 144, 226, 0.3);
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

/* 视频缩略图光效 */
.generation-thumbnail.generating-thumb.video-thumb::before {
  background: linear-gradient(45deg, transparent, rgba(147, 51, 234, 0.1), transparent);
}

/* 图片缩略图光效 */
.generation-thumbnail.generating-thumb.image-thumb::before {
  background: linear-gradient(45deg, transparent, rgba(74, 144, 226, 0.1), transparent);
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

.generating-placeholder .icon-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.generating-placeholder .placeholder-icon {
  font-size: 24px;
  color: rgba(255, 255, 255, 0.4);
  animation: pulse 2s infinite;
}

/* 类型徽章 */
.generating-placeholder .type-badge {
  position: absolute;
  bottom: -4px;
  right: -4px;
  width: 20px;
  height: 20px;
  background: #4A90E2;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid rgba(26, 26, 46, 1);
}

.generating-placeholder .type-badge.video-badge {
  background: linear-gradient(135deg, #9333ea, #a855f7);
}

.generating-placeholder .type-badge .el-icon {
  color: #ffffff;
  animation: rotate 1s linear infinite;
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

.status-text.video-status {
  color: #9333ea;
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

.progress-bar.video-progress {
  background: linear-gradient(90deg, #9333ea, #a855f7);
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

/* 类型标签 */
.meta-tag.type-tag {
  display: flex;
  align-items: center;
  gap: 4px;
  font-weight: 600;
}

.meta-tag.type-tag.video-type-tag {
  background: rgba(147, 51, 234, 0.25);
  border-color: rgba(147, 51, 234, 0.5);
  color: #c084fc;
}

.meta-tag.type-tag.image-type-tag {
  background: rgba(74, 144, 226, 0.25);
  border-color: rgba(74, 144, 226, 0.5);
  color: #60a5fa;
}

/* 状态标签 */
.status-tag.generating {
  background: rgba(74, 144, 226, 0.2);
  border-color: rgba(74, 144, 226, 0.4);
  color: #4A90E2;
  animation: statusPulse 2s infinite;
}

.status-tag.generating.video-generating {
  background: rgba(147, 51, 234, 0.2);
  border-color: rgba(147, 51, 234, 0.4);
  color: #9333ea;
}

@keyframes statusPulse {
  0%, 100% { opacity: 0.8; }
  50% { opacity: 1; }
}

/* 生成中的图片预览区域 */
.generation-images.generating-preview {
  display: flex;
  gap: 16px;
  width: 100%;
}

.generation-image-item.generating-item {
  width: 265px;
  height: 265px;
  flex-shrink: 0;
  border-radius: 8px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.05);
  border: 2px dashed rgba(255, 255, 255, 0.15);
  position: relative;
}

.generation-image-item.generating-item.video-item {
  background: rgba(147, 51, 234, 0.05);
  border-color: rgba(147, 51, 234, 0.2);
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

.generating-placeholder-image.video-placeholder {
  background: rgba(147, 51, 234, 0.03);
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

.generating-placeholder-image.video-placeholder::before {
  background: linear-gradient(45deg, transparent, rgba(147, 51, 234, 0.05), transparent);
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

.video-placeholder .placeholder-content .placeholder-icon {
  color: rgba(147, 51, 234, 0.5);
}

.placeholder-text {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  font-weight: 500;
}

.video-placeholder .placeholder-text {
  color: rgba(147, 51, 234, 0.7);
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

.video-placeholder .generating-dots .dot {
  background: rgba(147, 51, 234, 0.6);
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
  padding: 80px 40px 60px 40px; /* 增加顶部内边距，避免被面包屑遮挡 */
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
  margin-bottom: 24px;
}

/* 加载更多提示 */
.loading-more {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 20px;
  color: rgba(255, 255, 255, 0.6);
  font-size: 14px;
}

.loading-more .el-icon {
  font-size: 18px;
}

/* 没有更多数据提示 */
.no-more-data {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  color: rgba(255, 255, 255, 0.4);
  font-size: 13px;
  margin-bottom: 40px;
}

/* 上部分：缩略图和描述 */
.generation-header {
  display: flex;
  flex-wrap: wrap; /* 允许换行 */
  gap: 6px;
  align-items: flex-start; /* 顶部对齐 */
  margin-bottom: 2px;
  min-height: 80px; /* 确保最小高度与缩略图一致 */
}

.generation-thumbnail-wrapper {
  position: relative;
  width: auto;
  height: 70px;
  flex-shrink: 0;
  display: inline-block;
}

/* 引号水印 - 左下角，大的白色圆形背景 */
.quote-watermark {
  position: absolute;
  left: 5px;
  bottom: 5px;
  width: auto;
  height: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
  pointer-events: none;
}

.quote-text {
  font-size: 10px;
  font-weight: 700;
  color: rgba(220, 220, 225, 0.45);
  line-height: 1;
  font-family: "Microsoft YaHei", "PingFang SC", sans-serif;
  letter-spacing: -1px;
}

/* 照片堆叠容器 */
.photos-stack {
  position: relative;
  height: 100%;
  display: inline-block;
}

/* 根据照片数量动态计算宽度 */
.photos-stack:has(.photo-1:only-child) {
  width: 52px; /* 1张照片：0px(左边距) + 52px(照片宽度) */
}

.photos-stack:has(.photo-2:last-child) {
  width: 87px; /* 2张照片：0px + 35px + 52px */
}

.photos-stack:has(.photo-3:last-child) {
  width: 122px; /* 3张照片：0px + 35px + 35px + 52px */
}

.photos-stack:has(.photo-4:last-child) {
  width: 157px; /* 4张照片：0px + 35px*3 + 52px */
}

.photos-stack:has(.photo-5:last-child) {
  width: 192px; /* 5张照片：0px + 35px*4 + 52px */
}

/* 单张照片样式 - 类似真实照片，3:4竖版比例 */
.photo-item {
  position: absolute;
  width: 52px;
  height: 70px;
  background: #ffffff;
  padding: 2px;
  border-radius: 1px;
  box-shadow: 
    0 1px 2px rgba(0, 0, 0, 0.1),
    0 2px 4px rgba(0, 0, 0, 0.08),
    0 3px 8px rgba(0, 0, 0, 0.06);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 第一张照片 - 最底层，左侧，轻微左旋 */
.photo-1 {
  left: 0px;
  top: 0;
  transform: rotate(-8deg);
  z-index: 1;
}

/* 第二张照片 - 盖住第一张的三分之一 */
.photo-2 {
  left: 35px;
  top: 2px;
  transform: rotate(5deg);
  z-index: 2;
}

/* 第三张照片 - 盖住第二张的三分之一 */
.photo-3 {
  left: 70px;
  top: 1px;
  transform: rotate(-3deg);
  z-index: 3;
}

/* 第四张照片 - 盖住第三张的三分之一 */
.photo-4 {
  left: 105px;
  top: 3px;
  transform: rotate(6deg);
  z-index: 4;
}

/* 第五张照片 - 盖住第四张的三分之一 */
.photo-5 {
  left: 140px;
  top: 2px;
  transform: rotate(-4deg);
  z-index: 5;
}

/* hover效果 - 展开分离 */
.generation-thumbnail-wrapper:hover .photo-1 {
  left: 5px;
  top: 0;
  transform: rotate(-12deg) scale(1.05);
  box-shadow: 
    0 2px 6px rgba(0, 0, 0, 0.15),
    0 4px 12px rgba(0, 0, 0, 0.12),
    0 8px 24px rgba(0, 0, 0, 0.1);
  z-index: 10;
}

.generation-thumbnail-wrapper:hover .photo-2 {
  left: 80px;
  top: 0;
  transform: rotate(8deg) scale(1.05);
  box-shadow: 
    0 2px 6px rgba(0, 0, 0, 0.15),
    0 4px 12px rgba(0, 0, 0, 0.12),
    0 8px 24px rgba(0, 0, 0, 0.1);
  z-index: 11;
}

.generation-thumbnail-wrapper:hover .photo-3 {
  left: 155px;
  top: 0;
  transform: rotate(-5deg) scale(1.05);
  box-shadow: 
    0 2px 6px rgba(0, 0, 0, 0.15),
    0 4px 12px rgba(0, 0, 0, 0.12),
    0 8px 24px rgba(0, 0, 0, 0.1);
  z-index: 12;
}

.generation-thumbnail-wrapper:hover .photo-4 {
  left: 230px;
  top: 0;
  transform: rotate(7deg) scale(1.05);
  box-shadow: 
    0 2px 6px rgba(0, 0, 0, 0.15),
    0 4px 12px rgba(0, 0, 0, 0.12),
    0 8px 24px rgba(0, 0, 0, 0.1);
  z-index: 13;
}

.generation-thumbnail-wrapper:hover .photo-5 {
  left: 305px;
  top: 0;
  transform: rotate(-6deg) scale(1.05);
  box-shadow: 
    0 2px 6px rgba(0, 0, 0, 0.15),
    0 4px 12px rgba(0, 0, 0, 0.12),
    0 8px 24px rgba(0, 0, 0, 0.1);
  z-index: 14;
}

/* 照片内的图片 */
.photo-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 1px;
}

/* 状态占位符 */
.status-photo {
  background: linear-gradient(135deg, #f8f8f8 0%, #ececec 100%);
}

.status-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  border-radius: 1px;
}

.status-icon {
  color: rgba(120, 120, 120, 0.35);
  font-size: 24px;
}

.status-badge {
  position: absolute;
  bottom: 4px;
  right: 4px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
}

.status-badge .el-icon {
  font-size: 12px;
}

.queuing-badge {
  background: linear-gradient(135deg, #ffc107 0%, #ffb300 100%);
  animation: thumbPulse 2s infinite;
}

.processing-badge {
  background: linear-gradient(135deg, #4A90E2 0%, #357ABD 100%);
}

.failed-badge {
  background: linear-gradient(135deg, #ff4d4f 0%, #e63946 100%);
}

.rotating {
  animation: thumbRotate 1s linear infinite;
}

@keyframes thumbPulse {
  0%, 100% { 
    opacity: 1;
    transform: scale(1);
  }
  50% { 
    opacity: 0.8;
    transform: scale(1.08);
  }
}

@keyframes thumbRotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.generation-thumbnail {
  width: 80px;
  height: 80px;
  border-radius: 12px;
  overflow: visible;
  flex-shrink: 0;
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
  position: relative;
  z-index: 1;
}

.generation-thumbnail:hover {
  z-index: 100;
}

.generation-thumbnail:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
  border-color: rgba(74, 144, 226, 0.4);
}

.thumbnail-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* 视频缩略图美化 */
.thumbnail-video-wrapper {
  width: 100%;
  height: 100%;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.video-thumbnail-bg {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, 
    rgba(147, 51, 234, 0.15) 0%, 
    rgba(79, 70, 229, 0.15) 50%,
    rgba(59, 130, 246, 0.15) 100%);
  animation: gradientShift 3s ease-in-out infinite;
}

@keyframes gradientShift {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.05);
  }
}

.video-icon-wrapper {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
}

.video-play-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, #9333ea 0%, #4f46e5 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  box-shadow: 
    0 4px 16px rgba(147, 51, 234, 0.4),
    0 0 0 4px rgba(147, 51, 234, 0.2);
  animation: videoPulse 2s ease-in-out infinite;
  position: relative;
  z-index: 2;
}

@keyframes videoPulse {
  0%, 100% {
    transform: scale(1);
    box-shadow: 
      0 4px 16px rgba(147, 51, 234, 0.4),
      0 0 0 4px rgba(147, 51, 234, 0.2);
  }
  50% {
    transform: scale(1.05);
    box-shadow: 
      0 6px 20px rgba(147, 51, 234, 0.6),
      0 0 0 6px rgba(147, 51, 234, 0.3);
  }
}

.video-pulse-ring {
  position: absolute;
  inset: -8px;
  border-radius: 50%;
  border: 2px solid rgba(147, 51, 234, 0.6);
  animation: pulseRing 2s ease-out infinite;
}

@keyframes pulseRing {
  0% {
    transform: scale(0.8);
    opacity: 1;
  }
  100% {
    transform: scale(1.5);
    opacity: 0;
  }
}

.generation-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  justify-content: flex-start;
}

/* 只有在展开时才占据整行，换行到下方 */
.generation-header:has(.generation-prompt.expanded) .generation-info {
  flex-basis: 100%; /* 占据整行，自动换行到下方 */
  max-width: 100%;
}

/* 提示词容器 */
.generation-prompt-wrapper {
  position: relative;
  width: 100%;
}

.generation-prompt {
  font-size: 14px;
  line-height: 1.7;
  color: rgba(255, 255, 255, 0.9);
  margin: 0;
  word-wrap: break-word;
  overflow-wrap: break-word;
  white-space: pre-wrap;
  overflow: hidden;
  position: relative;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 长文本样式 - 在右侧时最多显示3行 */
.generation-prompt.long-prompt {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: pointer;
  padding-right: 28px;
  position: relative;
  max-height: 5.1em; /* 3行高度 */
}

.generation-prompt.long-prompt::after {
  content: '';
  position: absolute;
  bottom: 0;
  right: 0;
  width: 60px;
  height: 1.7em;
  background: linear-gradient(to right, transparent, rgba(26, 26, 46, 0.98) 40%);
  pointer-events: none;
  transition: opacity 0.3s ease;
}

.generation-prompt.long-prompt.expanded::after {
  opacity: 0;
}

.generation-prompt.long-prompt:hover {
  color: rgba(255, 255, 255, 1);
}

/* 展开后显示全部内容，最多2000字 */
.generation-prompt.long-prompt.expanded {
  -webkit-line-clamp: unset;
  max-height: none;
  padding-right: 0;
  cursor: default;
}

/* 展开提示 */
.prompt-expand-hint {
  position: absolute;
  right: 0;
  bottom: 0;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(74, 144, 226, 0.15), rgba(102, 126, 234, 0.15));
  border: 1px solid rgba(74, 144, 226, 0.3);
  border-radius: 6px;
  color: rgba(74, 144, 226, 0.9);
  cursor: pointer;
  transition: all 0.2s ease;
  z-index: 2;
  backdrop-filter: blur(8px);
}

.prompt-expand-hint:hover {
  color: rgba(74, 144, 226, 1);
  background: linear-gradient(135deg, rgba(74, 144, 226, 0.25), rgba(102, 126, 234, 0.25));
  border-color: rgba(74, 144, 226, 0.5);
  transform: translateY(1px);
  box-shadow: 0 2px 8px rgba(74, 144, 226, 0.3);
}

.prompt-expand-hint:active {
  transform: translateY(2px);
}

/* 收起提示 */
.prompt-collapse-hint {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-top: 8px;
  padding: 6px 16px;
  background: linear-gradient(135deg, rgba(74, 144, 226, 0.15), rgba(102, 126, 234, 0.15));
  border: 1px solid rgba(74, 144, 226, 0.3);
  border-radius: 6px;
  color: rgba(74, 144, 226, 0.9);
  cursor: pointer;
  transition: all 0.2s ease;
  backdrop-filter: blur(8px);
  font-size: 13px;
}

.prompt-collapse-hint:hover {
  color: rgba(74, 144, 226, 1);
  background: linear-gradient(135deg, rgba(74, 144, 226, 0.25), rgba(102, 126, 234, 0.25));
  border-color: rgba(74, 144, 226, 0.5);
  box-shadow: 0 2px 8px rgba(74, 144, 226, 0.3);
}

.prompt-collapse-hint:active {
  transform: scale(0.98);
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
  align-items: center;
}

.meta-tag {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  border: 1px solid transparent;
  transition: all 0.2s ease;
  white-space: nowrap;
  backdrop-filter: blur(10px);
}

/* 标签图标 */
.tag-icon {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
  opacity: 0.9;
}

/* 旋转动画 */
.tag-icon.spinning {
  animation: spin 1.5s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* AI模型标签 - 紫蓝渐变，表示AI智能 */
.ai-model-tag {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.25) 0%, rgba(118, 75, 162, 0.25) 100%);
  border-color: rgba(102, 126, 234, 0.4);
  color: #c4b5fd;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.15);
}

/* 图片张数标签 - 青色，表示数量 */
.count-tag {
  background: linear-gradient(135deg, rgba(34, 211, 238, 0.25) 0%, rgba(59, 130, 246, 0.25) 100%);
  border-color: rgba(34, 211, 238, 0.4);
  color: #7dd3fc;
  box-shadow: 0 2px 8px rgba(34, 211, 238, 0.15);
}

/* 画质标签 - 金色渐变，表示高品质 */
.quality-tag {
  background: linear-gradient(135deg, rgba(251, 191, 36, 0.25) 0%, rgba(245, 158, 11, 0.25) 100%);
  border-color: rgba(251, 191, 36, 0.4);
  color: #fcd34d;
  box-shadow: 0 2px 8px rgba(251, 191, 36, 0.15);
}

/* 尺寸比例标签 - 绿色，表示尺寸规格 */
.ratio-tag {
  background: linear-gradient(135deg, rgba(52, 211, 153, 0.25) 0%, rgba(16, 185, 129, 0.25) 100%);
  border-color: rgba(52, 211, 153, 0.4);
  color: #6ee7b7;
  box-shadow: 0 2px 8px rgba(52, 211, 153, 0.15);
}

/* 时长标签 - 紫红渐变，表示时间维度 */
.duration-tag {
  background: linear-gradient(135deg, rgba(168, 85, 247, 0.25) 0%, rgba(236, 72, 153, 0.25) 100%) !important;
  border-color: rgba(168, 85, 247, 0.4) !important;
  color: #e9d5ff !important;
  box-shadow: 0 2px 8px rgba(168, 85, 247, 0.15);
}

/* 兼容旧的 model-tag */
.model-tag {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.25) 0%, rgba(118, 75, 162, 0.25) 100%);
  border-color: rgba(102, 126, 234, 0.4);
  color: #c4b5fd;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.15);
}

.size-tag {
  background: rgba(74, 144, 226, 0.3);
  border-color: rgba(74, 144, 226, 0.5);
  color: #ffffff;
}

/* 时间标签 - 低调灰色 */
.time-tag {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.5);
  font-size: 11px;
  padding: 5px 10px;
  box-shadow: none;
}

/* 状态标签 - 失败 */
.status-tag.failed {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.25) 0%, rgba(220, 38, 38, 0.25) 100%);
  border-color: rgba(239, 68, 68, 0.4);
  color: #fca5a5;
  box-shadow: 0 2px 8px rgba(239, 68, 68, 0.2);
  animation: pulse-failed 2s ease-in-out infinite;
}

@keyframes pulse-failed {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.8;
  }
}

/* 失败状态样式 */
.generation-card.generation-failed {
  border-bottom-color: rgba(255, 77, 79, 0.15);
}

.generation-thumbnail.failed-thumbnail {
  background: rgba(255, 77, 79, 0.1);
  border: 1px solid rgba(255, 77, 79, 0.2);
}

.failed-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.failed-icon-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.failed-icon {
  color: rgba(255, 255, 255, 0.3);
}

.failed-overlay {
  position: absolute;
  bottom: -4px;
  right: -4px;
  width: 24px;
  height: 24px;
  background: #ff4d4f;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid rgba(26, 26, 46, 1);
}

.error-icon {
  color: #ffffff;
}

.failed-text {
  font-size: 11px;
  color: rgba(255, 77, 79, 0.8);
  font-weight: 500;
}

.generation-images.failed-content {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  background: rgba(255, 77, 79, 0.05);
  border: 1px dashed rgba(255, 77, 79, 0.3);
  border-radius: 12px;
  padding: 40px 20px;
}

.failed-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  text-align: center;
}

.failed-icon-large {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 80px;
  background: rgba(255, 77, 79, 0.1);
  border-radius: 50%;
  border: 2px solid rgba(255, 77, 79, 0.3);
}

.failed-icon-large > .el-icon {
  color: rgba(255, 255, 255, 0.4);
}

.error-badge {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 32px;
  height: 32px;
  background: #ff4d4f;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 3px solid rgba(26, 26, 46, 1);
}

.error-badge .el-icon {
  color: #ffffff;
}

.failed-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.failed-title {
  font-size: 16px;
  font-weight: 600;
  color: #ff6b6b;
}

.failed-desc {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.5);
}

/* 排队中状态样式 (status === 0) */
.generation-card.generation-queuing {
  border-bottom-color: rgba(255, 193, 7, 0.2);
}

.generation-thumbnail.queuing-thumbnail {
  background: rgba(255, 193, 7, 0.1);
  border: 1px solid rgba(255, 193, 7, 0.2);
}

.queuing-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.queuing-icon-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.queuing-icon {
  color: rgba(255, 255, 255, 0.3);
}

.queuing-overlay {
  position: absolute;
  bottom: -4px;
  right: -4px;
  width: 24px;
  height: 24px;
  background: #ffc107;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid rgba(26, 26, 46, 1);
  animation: queuePulse 2s infinite;
}

@keyframes queuePulse {
  0%, 100% { 
    opacity: 1;
    transform: scale(1);
  }
  50% { 
    opacity: 0.7;
    transform: scale(1.1);
  }
}

.clock-icon {
  color: #ffffff;
}

.queuing-text {
  font-size: 11px;
  color: rgba(255, 193, 7, 0.9);
  font-weight: 500;
}

.generation-images.queuing-content {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  background: rgba(255, 193, 7, 0.05);
  border: 1px dashed rgba(255, 193, 7, 0.3);
  border-radius: 12px;
  padding: 40px 20px;
}

.queuing-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  text-align: center;
}

.queuing-icon-large {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 80px;
  background: rgba(255, 193, 7, 0.1);
  border-radius: 50%;
  border: 2px solid rgba(255, 193, 7, 0.3);
}

.queuing-icon-large > .el-icon {
  color: rgba(255, 255, 255, 0.4);
}

.clock-badge {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 32px;
  height: 32px;
  background: #ffc107;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 3px solid rgba(26, 26, 46, 1);
  animation: queuePulse 2s infinite;
}

.clock-badge .el-icon {
  color: #ffffff;
}

.queuing-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.queuing-title {
  font-size: 16px;
  font-weight: 600;
  color: #ffc107;
}

.queuing-desc {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.5);
}

/* 状态标签 - 排队中 */
.status-tag.queuing {
  background: linear-gradient(135deg, rgba(251, 191, 36, 0.25) 0%, rgba(245, 158, 11, 0.25) 100%);
  border-color: rgba(251, 191, 36, 0.4);
  color: #fcd34d;
  box-shadow: 0 2px 4px rgba(251, 191, 36, 0.15);
  animation: queuePulse 2s infinite;
}

@keyframes queuePulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.85;
    transform: scale(0.98);
  }
}

/* 生成中状态样式 (status === 1) */
.generation-card.generation-processing {
  border-bottom-color: rgba(74, 144, 226, 0.2);
}

.generation-thumbnail.generating-thumbnail {
  background: rgba(74, 144, 226, 0.1);
  border: 1px solid rgba(74, 144, 226, 0.2);
}

.processing-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.processing-icon-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.processing-icon {
  color: rgba(255, 255, 255, 0.3);
}

.processing-spinner {
  position: absolute;
  bottom: -4px;
  right: -4px;
  width: 24px;
  height: 24px;
  background: #4A90E2;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid rgba(26, 26, 46, 1);
}

.loading-icon {
  color: #ffffff;
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.processing-text {
  font-size: 11px;
  color: rgba(74, 144, 226, 0.9);
  font-weight: 500;
}

.generation-images.processing-content {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  background: rgba(74, 144, 226, 0.05);
  border: 1px dashed rgba(74, 144, 226, 0.3);
  border-radius: 12px;
  padding: 40px 20px;
}

.processing-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  text-align: center;
}

.processing-icon-large {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 80px;
  background: rgba(74, 144, 226, 0.1);
  border-radius: 50%;
  border: 2px solid rgba(74, 144, 226, 0.3);
}

.processing-icon-large > .el-icon {
  color: rgba(255, 255, 255, 0.4);
}

.loading-badge {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 32px;
  height: 32px;
  background: #4A90E2;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 3px solid rgba(26, 26, 46, 1);
}

.loading-badge .el-icon {
  color: #ffffff;
}

.loading-badge .rotating {
  animation: rotate 1s linear infinite;
}

.processing-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
}

.processing-title {
  font-size: 16px;
  font-weight: 600;
  color: #4A90E2;
}

.processing-desc {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.5);
}

.processing-dots {
  display: flex;
  gap: 4px;
  margin-top: 8px;
}

.processing-dots .dot {
  width: 6px;
  height: 6px;
  background: #4A90E2;
  border-radius: 50%;
  animation: dotPulse 1.5s infinite;
}

.processing-dots .dot:nth-child(1) {
  animation-delay: 0s;
}

.processing-dots .dot:nth-child(2) {
  animation-delay: 0.3s;
}

.processing-dots .dot:nth-child(3) {
  animation-delay: 0.6s;
}

/* 状态标签 - 生成中 */
.status-tag.processing {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.25) 0%, rgba(37, 99, 235, 0.25) 100%);
  border-color: rgba(59, 130, 246, 0.4);
  color: #93c5fd;
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.15);
  animation: statusPulse 2s infinite;
}

@keyframes statusPulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.8;
  }
}

/* 下部分：生成图 */
.generation-images {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  width: 100%;
  align-items: start; /* 让不同高度的项目顶部对齐 */
}

/* 所有图片统一固定宽度 */
.generation-image-item {
  width: 220px; /* 固定宽度，确保一排至少能显示4张 */
  flex-shrink: 0; /* 防止缩小 */
}

/* 动态宽高比样式 - 根据设置的比例自动调整 */
.generation-image-item.ratio-1-1 {
  aspect-ratio: 1/1;
}

.generation-image-item.ratio-3-4 {
  aspect-ratio: 3/4;
}

.generation-image-item.ratio-4-3 {
  aspect-ratio: 4/3;
}

.generation-image-item.ratio-9-16 {
  aspect-ratio: 9/16;
}

.generation-image-item.ratio-16-9 {
  aspect-ratio: 16/9;
}

.generation-image-item.ratio-21-9 {
  aspect-ratio: 21/9;
}

.generation-image-item.ratio-2-3 {
  aspect-ratio: 2/3;
}

.generation-image-item.ratio-3-2 {
  aspect-ratio: 3/2;
}

/* 视频比例样式 */
.video-result-item .video-wrapper.ratio-1-1 {
  aspect-ratio: 1/1;
}

.video-result-item .video-wrapper.ratio-3-4 {
  aspect-ratio: 3/4;
}

.video-result-item .video-wrapper.ratio-4-3 {
  aspect-ratio: 4/3;
}

.video-result-item .video-wrapper.ratio-9-16 {
  aspect-ratio: 9/16;
}

.video-result-item .video-wrapper.ratio-16-9 {
  aspect-ratio: 16/9;
}

.video-result-item .video-wrapper.ratio-21-9 {
  aspect-ratio: 21/9;
}

.video-result-item .video-wrapper.ratio-2-3 {
  aspect-ratio: 2/3;
}

.video-result-item .video-wrapper.ratio-3-2 {
  aspect-ratio: 3/2;
}

.generation-image-item {
  cursor: pointer;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.3s ease;
  background: rgba(255, 255, 255, 0.05);
  /* 动态设置宽高比，根据实际比例显示 */
  position: relative;
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
  background: #000; /* 黑色背景填充空白区域 */
  display: flex;
  align-items: center;
  justify-content: center;
}

.generated-image {
  width: 100%;
  height: 100%;
  object-fit: contain; /* 改为 contain 以保持原始比例 */
  transition: transform 0.3s ease;
  display: block; /* 确保图片正确显示 */
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

/* 无资源缺省图样式 */
.generation-image-item.no-asset-item {
  cursor: default;
  background: rgba(255, 255, 255, 0.02);
  border: 1px dashed rgba(255, 255, 255, 0.1);
}

.generation-image-item.no-asset-item:hover {
  transform: none;
  box-shadow: none;
}

.no-asset-wrapper {
  background: rgba(255, 255, 255, 0.02);
}

.no-asset-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 40px 20px;
  width: 100%;
  height: 100%;
}

.no-asset-icon {
  color: rgba(255, 255, 255, 0.15);
}

.no-asset-text {
  font-size: 16px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.4);
}

.no-asset-desc {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.25);
  text-align: center;
  max-width: 200px;
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

/* 预览对话框 - 全屏样式 */
.preview-dialog :deep(.el-dialog) {
  background: #000 !important;
  backdrop-filter: none;
  border: none !important;
  box-shadow: none !important;
  width: 100vw !important;
  height: 100vh !important;
  max-width: 100vw !important;
  max-height: 100vh !important;
  margin: 0 !important;
  padding: 0 !important;
  border-radius: 0 !important;
  overflow: hidden !important;
  display: flex;
  align-items: center;
  left: 0 !important;
  top: 0 !important;
  right: 0 !important;
  bottom: 0 !important;
}

/* 去掉全屏对话框的默认内边距 */
.preview-dialog :deep(.el-dialog.is-fullscreen) {
  margin: 0 !important;
  padding: 0 !important;
  border-radius: 0 !important;
  width: 100vw !important;
  height: 100vh !important;
  left: 0 !important;
  top: 0 !important;
}

.preview-dialog :deep(.el-dialog__header) {
  display: none !important;
  padding: 0 !important;
  margin: 0 !important;
  height: 0 !important;
  min-height: 0 !important;
  line-height: 0 !important;
}

.preview-dialog :deep(.el-dialog__body) {
  padding: 0 !important;
  margin: 0 !important;
  background: transparent;
  height: 100vh !important;
  max-height: 100vh !important;
  width: 100vw !important;
  overflow: hidden !important;
  display: flex;
  align-items: center;
}

.preview-dialog :deep(.el-overlay) {
  background-color: rgba(0, 0, 0, 0.98) !important;
  backdrop-filter: blur(30px);
  overflow: hidden !important;
}

/* 确保对话框包装器不产生滚动 */
.preview-dialog.el-overlay {
  overflow: hidden !important;
  margin: 0 !important;
  padding: 0 !important;
}

/* 全局覆盖 Element Plus 全屏对话框样式 */
.el-dialog.is-fullscreen {
  margin: 0 !important;
  padding: 0 !important;
  width: 100vw !important;
  height: 100vh !important;
  left: 0 !important;
  top: 0 !important;
}

/* 强制去除所有可能的边距和滚动 */
.preview-dialog,
.preview-dialog * {
  box-sizing: border-box;
}

.preview-dialog :deep(.el-dialog__wrapper) {
  overflow: hidden !important;
  margin: 0 !important;
  padding: 0 !important;
}

/* 确保body在预览时不滚动 */
body:has(.preview-dialog.el-overlay) {
  overflow: hidden !important;
  margin: 0 !important;
  padding: 0 !important;
}
.el-dialog .is-fullscreen{
  padding: 0 !important;
}
/* 去掉所有滚动条 */
.preview-dialog :deep(*) {
  scrollbar-width: none !important;
  -ms-overflow-style: none !important;
}

.preview-dialog :deep(*::-webkit-scrollbar) {
  display: none !important;
  width: 0 !important;
  height: 0 !important;
}

.preview-content {
  position: relative;
  height: 100vh;
  max-height: 100vh;
  display: flex;
  flex-direction: column;
  width: 100%;
  overflow: hidden !important;
  margin: 0;
  padding: 0;
}

.preview-close-btn {
  position: fixed;
  top: 10px;
  right: 14px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(10px);
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 10002;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  color: rgba(255, 255, 255, 0.9);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.3);
}

.preview-close-btn::before {
  display: none;
}

.preview-close-btn:hover {
  background: rgba(0, 0, 0, 0.6);
  color: #ffffff;
  transform: scale(1.1);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
}

.preview-close-btn:active {
  transform: scale(0.95);
}

.preview-close-btn .el-icon {
  font-size: 20px;
  font-weight: 500;
}

/* 左右切换按钮 */
.preview-nav-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(10px);
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 10;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  color: rgba(255, 255, 255, 0.9);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.3);
}

.preview-nav-btn.prev-btn {
  left: 20px;
}

.preview-nav-btn.next-btn {
  right: 20px;
}

.preview-nav-btn:hover {
  background: rgba(0, 0, 0, 0.6);
  color: #ffffff;
  transform: translateY(-50%) scale(1.1);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
}

.preview-nav-btn:active {
  transform: translateY(-50%) scale(0.95);
}

.preview-nav-btn .el-icon {
  font-size: 24px;
  font-weight: 600;
}

/* 图片计数器 */
.preview-counter {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  padding: 8px 20px;
  border-radius: 20px;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(10px);
  border: none;
  color: #ffffff;
  font-size: 14px;
  font-weight: 500;
  z-index: 10;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.3);
  letter-spacing: 0.5px;
  font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif;
}

/* 左右布局 - 全屏 */
.preview-layout {
  display: flex;
  height: 100vh;
  max-height: 100vh;
  gap: 0;
  overflow: hidden !important;
  margin: 0;
  padding: 0;
  width: 100vw;
}

/* 左侧媒体区域 */
.preview-media-section {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #000; /* 纯黑色背景 */
  padding: 0; /* 去除所有padding */
  position: relative;
  overflow: hidden !important;
  margin: 0;
  height: 100vh;
  max-height: 100vh;
}

/* 媒体容器需要相对定位，以便箭头和计数器相对于它定位 */
.media-container {
  position: relative;
  z-index: 1;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0;
  padding: 0; /* 去掉所有padding */
}

/* 移除装饰性背景效果 */
.preview-media-section::before {
  display: none;
}

.preview-media-section::after {
  display: none;
}

@keyframes pulseGlow {
  0%, 100% {
    opacity: 0.4;
    transform: translate(-50%, -50%) scale(1);
  }
  50% {
    opacity: 0.7;
    transform: translate(-50%, -50%) scale(1.2);
  }
}

.preview-image,
.preview-video {
  max-width: calc(100% - 40px); /* 减去左右padding */
  max-height: 80vh; /* 限制最大高度为80vh，配合10%上下边距 */
  width: auto;
  height: auto;
  object-fit: contain;
  border-radius: 0;
  box-shadow: none;
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  background: transparent;
  margin: 0;
  padding: 0;
  display: block;
}

.preview-image:hover,
.preview-video:hover {
  box-shadow: none;
  transform: none;
}

/* 右侧信息区域 */
.preview-info-section {
  width: 340px;
  flex-shrink: 0;
  background: linear-gradient(
    135deg,
    rgba(26, 26, 46, 0.95) 0%,
    rgba(18, 18, 35, 0.98) 100%
  );
  backdrop-filter: blur(40px);
  border-left: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  flex-direction: column;
  overflow: hidden !important;
  position: relative;
  height: 100vh;
  max-height: 100vh;
  margin: 0;
  padding: 0;
}

.preview-info-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: 
    radial-gradient(circle at 50% 0%, rgba(102, 126, 234, 0.05) 0%, transparent 50%),
    radial-gradient(circle at 50% 100%, rgba(118, 75, 162, 0.05) 0%, transparent 50%);
  pointer-events: none;
}

.info-content {
  position: relative;
  z-index: 1;
  padding: 60px 20px 24px 20px; /* 减少顶部padding */
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow-y: auto;
  scrollbar-width: none; /* Firefox 隐藏滚动条 */
  -ms-overflow-style: none; /* IE/Edge 隐藏滚动条 */
}

/* 隐藏 Webkit 浏览器滚动条 */
.info-content::-webkit-scrollbar {
  display: none;
  width: 0;
  height: 0;
}

/* 标题区域 */
.preview-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  position: relative;
}

.preview-header::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  width: 45px;
  height: 2px;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  border-radius: 2px;
}

.header-icon {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.2) 0%, rgba(118, 75, 162, 0.2) 100%);
  border: 1px solid rgba(102, 126, 234, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #667eea;
  font-size: 20px;
  flex-shrink: 0;
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.2);
}

.header-title {
  font-size: 16px;
  font-weight: 700;
  color: #ffffff;
  margin: 0;
  letter-spacing: 0.5px;
}

/* 提示词区域 */
.preview-prompt-section {
  flex: 0 0 auto; /* 不伸缩，保持内容高度 */
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.prompt-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 10px;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.prompt-label .el-icon {
  font-size: 15px;
  color: #667eea;
}

.prompt-text {
  font-size: 13px;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.95);
  background: rgba(0, 0, 0, 0.25);
  padding: 14px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  overflow-y: auto;
  word-wrap: break-word;
  white-space: pre-wrap;
  transition: all 0.3s ease;
  box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.2);
  min-height: 80px;
  max-height: 486px; /* 减小最大高度，确保下载按钮可见 */
}

.prompt-text:hover {
  background: rgba(0, 0, 0, 0.3);
  border-color: rgba(255, 255, 255, 0.1);
}

.prompt-text::-webkit-scrollbar {
  width: 6px;
}

.prompt-text::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.03);
  border-radius: 3px;
}

.prompt-text::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 3px;
  transition: background 0.3s ease;
}

.prompt-text::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.25);
}

/* 占位符 */
.prompt-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 30px 16px;
  color: rgba(255, 255, 255, 0.3);
  font-size: 13px;
  font-style: italic;
  background: rgba(0, 0, 0, 0.15);
  border-radius: 10px;
  border: 1px dashed rgba(255, 255, 255, 0.1);
  margin-bottom: 20px;
  min-height: 80px;
}

.prompt-placeholder .el-icon {
  font-size: 18px;
}

/* 元数据区域 */
.preview-metadata-section {
  margin-bottom: 16px;
}

/* 横向一排显示的元数据 */
.metadata-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}

.metadata-item-compact {
  display: inline-flex;
  align-items: center;
  background: rgba(0, 0, 0, 0.3);
  padding: 6px 12px;
  border-radius: 16px;
  border: 1px solid rgba(102, 126, 234, 0.2);
  transition: all 0.2s ease;
  white-space: nowrap;
}

.metadata-item-compact:hover {
  background: rgba(0, 0, 0, 0.4);
  border-color: rgba(102, 126, 234, 0.4);
  transform: translateY(-1px);
}

.metadata-icon-compact {
  width: 14px;
  height: 14px;
  color: rgba(102, 126, 234, 0.9);
  flex-shrink: 0;
  margin-right: 6px;
}

.metadata-text-compact {
  font-size: 12px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.95);
}

/* 旧的网格布局样式（保留以防需要） */
.metadata-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.metadata-item {
  background: rgba(0, 0, 0, 0.25);
  padding: 12px 14px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  transition: all 0.3s ease;
}

.metadata-item:hover {
  background: rgba(0, 0, 0, 0.35);
  border-color: rgba(102, 126, 234, 0.3);
  transform: translateY(-2px);
}

.metadata-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 6px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.metadata-icon {
  width: 14px;
  height: 14px;
  color: rgba(102, 126, 234, 0.8);
}

.metadata-value {
  font-size: 14px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.95);
  word-break: break-word;
}

/* 操作按钮 */
.preview-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-top: 4px;
  flex-shrink: 0;
}

.preview-action-btn {
  width: 100%;
  height: 44px;
  border-radius: 22px;
  font-size: 14px;
  font-weight: 600;
  border: none;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.preview-action-btn.primary-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #ffffff;
  box-shadow: 
    0 8px 24px rgba(102, 126, 234, 0.4),
    0 0 0 1px rgba(255, 255, 255, 0.1) inset;
}

.preview-action-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.25), transparent);
  transition: left 0.6s ease;
}

.preview-action-btn:hover::before {
  left: 100%;
}

.preview-action-btn.primary-btn:hover {
  transform: translateY(-3px);
  box-shadow: 
    0 12px 36px rgba(102, 126, 234, 0.5),
    0 0 0 1px rgba(255, 255, 255, 0.15) inset;
  background: linear-gradient(135deg, #7b8ff0 0%, #8a5bb8 100%);
}

.preview-action-btn:active {
  transform: translateY(-1px);
}

.preview-action-btn .el-icon {
  font-size: 20px;
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
  overflow: hidden !important;
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
  border-radius: 16px;
  overflow: hidden;
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

.model-avatar-wrapper {
  width: 24px;
  height: 24px;
  flex-shrink: 0;
}

.model-avatar-img {
  width: 24px;
  height: 24px;
  border-radius: 6px;
  object-fit: cover;
}

.model-icon {
  width: 24px;
  height: 24px;
  flex-shrink: 0;
}

.icon-circle {
  width: 24px;
  height: 24px;
  border-radius: 6px;
  background: #4A90E2;
}

.icon-circle-img {
  width: 24px;
  height: 24px;
  border-radius: 6px;
  object-fit: cover;
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
  
  .generate-section-inline {
    margin-left: 0;
    width: 100%;
  }
  
  .generate-section-inline .generate-btn {
    width: 100%;
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
    bottom: 12%;
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
    align-items: center;
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
    padding: 70px 20px 50px 20px; /* 增加顶部内边距 */
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
    flex-direction: row;
    gap: 12px;
    margin-bottom: 0;
  }
  
  .generation-thumbnail {
    width: 80px;
    height: 80px;
    align-self: flex-start;
  }
  
  .generation-meta {
    margin: 4px 0;
  }
  
  .generation-images {
    gap: 12px;
  }
  
  .generation-image-item {
    width: calc(50% - 6px); /* 移动端每张图片占50%宽度减去间距 */
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
    bottom: 12%;
  }
  
  .floating-input-panel.collapsed {
    transform: translateX(-50%) scale(0.88);
  }
  
  .floating-input-panel.expanded {
    transform: translateX(-50%) scale(1);
  }
  
  .results-display {
    padding: 75px 30px 55px 30px; /* 增加顶部内边距 */
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
  
  .generation-image-item {
    width: 200px; /* 平板端固定宽度，确保能显示4张 */
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
    max-width: 757px;
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
    padding: 80px 40px 60px 40px; /* 保持顶部内边距 */
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
  
  .generation-image-item {
    width: 220px; /* 桌面端固定宽度，确保一排至少能显示4张 */
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

/* 预览对话框打开时隐藏 body 滚动条 */
body.el-popup-parent--hidden {
  overflow: hidden !important;
  padding-right: 0 !important;
}

/* 确保对话框遮罩层覆盖整个视口 */
.el-overlay {
  overflow: hidden !important;
}

/* 强制去除全屏对话框的所有边距 */
.el-dialog.is-fullscreen {
  margin: 0 !important;
  padding: 0 !important;
  width: 100% !important;
  height: 100% !important;
  left: 0 !important;
  top: 0 !important;
  border-radius: 0 !important;
}

/* 强制隐藏对话框header */
.el-dialog__header {
  display: none !important;
  padding: 0 !important;
  margin: 0 !important;
  height: 0 !important;
  min-height: 0 !important;
  line-height: 0 !important;
  overflow: hidden !important;
}

/* 预览对话框样式 */
.preview-dialog.el-dialog__wrapper {
  overflow: hidden !important;
}

.model-popover,
.image-params-popover,
.generate-mode-popover,
.size-popover,
.style-popover,
.resolution-popover,
.image-count-popover {
  background: rgba(26, 26, 46, 0.95) !important;
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.15) !important;
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
  border-radius: 14px !important;
  padding: 0 !important;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.4) !important;
  overflow: hidden !important;
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
.image-params-popover .el-popper__arrow::before,
.model-popover .el-popper__arrow::before,
.el-popper.generate-mode-popover .el-popper__arrow::before,
.el-popper.keling-popover .el-popper__arrow::before,
.el-popper.video-params-popover .el-popper__arrow::before,
.el-popper.image-params-popover .el-popper__arrow::before,
.el-popper.model-popover .el-popper__arrow::before {
  background: rgba(26, 26, 46, 0.95) !important;
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
}

/* 更强的覆盖规则 */
.el-popover.generate-mode-popover[data-popper-placement],
.el-popover.keling-popover[data-popper-placement],
.el-popover.video-params-popover[data-popper-placement],
.el-popover.image-params-popover[data-popper-placement],
.el-popover.model-popover[data-popper-placement] {
  background: rgba(26, 26, 46, 0.95) !important;
}

.el-popover.generate-mode-popover[data-popper-placement] .el-popover__content,
.el-popover.keling-popover[data-popper-placement] .el-popover__content,
.el-popover.video-params-popover[data-popper-placement] .el-popover__content {
  background: transparent !important;
}

/* 最强覆盖规则 */
.el-popper[data-popper-placement].generate-mode-popover,
.el-popper[data-popper-placement].keling-popover,
.el-popper[data-popper-placement].video-params-popover,
.el-popover[data-popper-placement].generate-mode-popover,
.el-popover[data-popper-placement].keling-popover,
.el-popover[data-popper-placement].video-params-popover {
  background: rgba(26, 26, 46, 0.95) !important;
  backdrop-filter: blur(20px) !important;
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
  border-radius: 14px !important;
  overflow: hidden !important;
}

.el-popper[data-popper-placement].generate-mode-popover .el-popover__content,
.el-popper[data-popper-placement].keling-popover .el-popover__content,
.el-popper[data-popper-placement].video-params-popover .el-popover__content,
.el-popover[data-popper-placement].generate-mode-popover .el-popover__content,
.el-popover[data-popper-placement].keling-popover .el-popover__content,
.el-popover[data-popper-placement].video-params-popover .el-popover__content {
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

/* 美化的视频图标缩略图样式 - 已废弃，使用 thumbnail-video-wrapper */

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
  /* 动态设置宽高比，根据视频实际比例显示 */
  position: relative;
}

.generated-video {
  width: 100%;
  height: 100%;
  object-fit: contain; /* 改为 contain 以保持原始比例 */
  transition: transform 0.3s ease;
  display: block; /* 确保视频正确显示 */
}

.video-result-item:hover .generated-video {
  transform: scale(1.05);
}

.video-overlay {
  /* 继承 image-overlay 的样式 */
  position: relative;
  pointer-events: none; /* 允许鼠标事件穿透到视频元素 */
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
  pointer-events: auto; /* 播放按钮本身可以接收点击事件 */
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

/* 响应式调整 */
@media (max-width: 1200px) {
  .preview-info-section {
    width: 380px;
  }
  
  .info-content {
    padding: 32px 24px;
  }
}

@media (max-width: 968px) {
  .preview-dialog :deep(.el-dialog) {
    width: 95% !important;
  }
  
  .preview-layout {
    flex-direction: row;
  }
  
  .preview-media-section {
    padding: 20px 16px;
  }
  
  .preview-info-section {
    width: 280px;
    flex-shrink: 0;
  }
  
  .info-content {
    padding: 20px 16px;
  }
  
  .preview-header {
    margin-bottom: 16px;
    padding-bottom: 12px;
  }
  
  .header-icon {
    width: 32px;
    height: 32px;
    font-size: 16px;
  }
  
  .header-title {
    font-size: 14px;
  }
  
  .preview-prompt-section {
    margin-bottom: 16px;
  }
  
  .prompt-label {
    font-size: 10px;
    margin-bottom: 6px;
    gap: 4px;
  }
  
  .prompt-label .el-icon {
    font-size: 12px;
  }
  
  .prompt-text {
    font-size: 11px;
    padding: 10px;
    line-height: 1.5;
    min-height: 60px;
    max-height: 180px;
  }
  
  .prompt-placeholder {
    padding: 16px 10px;
    min-height: 60px;
    font-size: 11px;
  }
  
  .prompt-placeholder .el-icon {
    font-size: 14px;
  }
  
  .preview-actions {
    padding-top: 0;
    gap: 8px;
  }
  
  .preview-action-btn {
    height: 38px;
    font-size: 12px;
  }
  
  .preview-action-btn .el-icon {
    font-size: 14px;
  }
}

@media (max-width: 768px) {
  .preview-dialog :deep(.el-dialog) {
    width: 98% !important;
    max-height: 96vh;
    margin: 2vh auto !important;
  }
  
  .preview-close-btn {
    top: 10px;
    right: 10px;
    width: 32px;
    height: 32px;
  }
  
  .preview-close-btn .el-icon {
    font-size: 14px;
  }
  
  .preview-media-section {
    padding: 16px 12px;
  }
  
  .preview-image,
  .preview-video {
    border-radius: 10px;
  }
  
  .preview-info-section {
    width: 240px;
  }
  
  .info-content {
    padding: 16px 12px;
  }
  
  .preview-header {
    gap: 6px;
    margin-bottom: 12px;
    padding-bottom: 10px;
  }
  
  .header-icon {
    width: 28px;
    height: 28px;
    font-size: 14px;
  }
  
  .header-title {
    font-size: 13px;
  }
  
  .preview-prompt-section {
    margin-bottom: 12px;
  }
  
  .prompt-label {
    font-size: 9px;
    gap: 4px;
    margin-bottom: 5px;
  }
  
  .prompt-label .el-icon {
    font-size: 11px;
  }
  
  .prompt-text {
    font-size: 10px;
    padding: 8px;
    line-height: 1.4;
    min-height: 50px;
    max-height: 150px;
  }
  
  .prompt-placeholder {
    padding: 12px 8px;
    min-height: 50px;
    font-size: 10px;
  }
  
  .prompt-placeholder .el-icon {
    font-size: 12px;
  }
  
  .preview-actions {
    gap: 6px;
  }
  
  .preview-action-btn {
    height: 34px;
    font-size: 11px;
    padding: 0 12px;
  }
  
  .preview-action-btn .el-icon {
    font-size: 13px;
  }
}

@media (min-width: 769px) and (max-width: 968px) {
  .preview-media-section {
    padding: 30px 24px;
  }
  
  .preview-image,
  .preview-video {
    max-height: calc(50vh - 60px);
  }
}
@media (max-width: 768px) {
  .play-button {
    width: 40px;
    height: 40px;
  }
  
  .video-result-item .video-wrapper {
    aspect-ratio: 16/9;
  }
}

/* 优化不同比例图片的显示效果 */
/* 使用flexbox布局，所有图片统一固定宽度，不需要特殊的跨列规则 */

/* 竖屏比例优化 - 限制最大高度避免过高 */
.generation-image-item.ratio-9-16,
.generation-image-item.ratio-2-3,
.generation-image-item.ratio-3-4 {
  max-height: 600px; /* 限制竖屏图片的最大高度 */
}

/* 横屏和超宽比例优化 */
.generation-image-item.ratio-16-9,
.generation-image-item.ratio-21-9,
.generation-image-item.ratio-3-2,
.generation-image-item.ratio-4-3 {
  max-height: 400px; /* 限制横屏图片的最大高度 */
}

/* video-wrapper 样式 */
.video-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #000; /* 黑色背景填充空白区域 */
}

/* 视频容器的比例优化 */
.video-result-item .video-wrapper.ratio-9-16,
.video-result-item .video-wrapper.ratio-2-3,
.video-result-item .video-wrapper.ratio-3-4 {
  max-height: 600px; /* 限制竖屏视频的最大高度 */
}

.video-result-item .video-wrapper.ratio-16-9,
.video-result-item .video-wrapper.ratio-21-9,
.video-result-item .video-wrapper.ratio-3-2,
.video-result-item .video-wrapper.ratio-4-3 {
  max-height: 400px; /* 限制横屏视频的最大高度 */
}
</style>

<style>
/* 自定义删除确认对话框样式 */
.custom-delete-confirm {
  background: linear-gradient(135deg, 
    rgba(30, 41, 59, 0.98) 0%, 
    rgba(51, 65, 85, 0.98) 100%) !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  border-radius: 16px !important;
  box-shadow: 
    0 20px 60px rgba(0, 0, 0, 0.5),
    0 0 0 1px rgba(255, 255, 255, 0.05) inset,
    0 0 80px rgba(99, 102, 241, 0.15) !important;
  backdrop-filter: blur(20px) !important;
  overflow: hidden !important;
  padding: 0 !important;
}

/* 对话框头部 */
.custom-delete-confirm .el-message-box__header {
  padding: 24px 24px 16px !important;
  background: linear-gradient(135deg, 
    rgba(255, 77, 79, 0.08) 0%, 
    rgba(255, 77, 79, 0.03) 100%) !important;
  border-bottom: 1px solid rgba(255, 77, 79, 0.15) !important;
}

.custom-delete-confirm .el-message-box__title {
  color: #ffffff !important;
  font-size: 18px !important;
  font-weight: 600 !important;
  letter-spacing: 0.5px !important;
}

/* 关闭按钮 */
.custom-delete-confirm .el-message-box__headerbtn {
  top: 20px !important;
  right: 20px !important;
}

.custom-delete-confirm .el-message-box__headerbtn .el-message-box__close {
  color: rgba(255, 255, 255, 0.6) !important;
  font-size: 18px !important;
  transition: all 0.3s ease !important;
}

.custom-delete-confirm .el-message-box__headerbtn:hover .el-message-box__close {
  color: #ff4d4f !important;
  transform: rotate(90deg) !important;
}

/* 对话框内容 */
.custom-delete-confirm .el-message-box__content {
  padding: 24px !important;
  color: rgba(255, 255, 255, 0.85) !important;
  font-size: 15px !important;
  line-height: 1.6 !important;
}

.custom-delete-confirm .el-message-box__message {
  color: rgba(255, 255, 255, 0.85) !important;
}

/* 警告图标 */
.custom-delete-confirm .el-message-box__status {
  font-size: 28px !important;
  color: #ff9800 !important;
  filter: drop-shadow(0 0 8px rgba(255, 152, 0, 0.4)) !important;
}

/* 按钮容器 */
.custom-delete-confirm .el-message-box__btns {
  padding: 16px 24px 24px !important;
  display: flex !important;
  gap: 12px !important;
  justify-content: flex-end !important;
}

/* 取消按钮 */
.custom-cancel-btn {
  background: rgba(255, 255, 255, 0.08) !important;
  border: 1px solid rgba(255, 255, 255, 0.15) !important;
  color: rgba(255, 255, 255, 0.9) !important;
  padding: 10px 24px !important;
  border-radius: 10px !important;
  font-size: 14px !important;
  font-weight: 500 !important;
  transition: all 0.3s ease !important;
  backdrop-filter: blur(10px) !important;
}

.custom-cancel-btn:hover {
  background: rgba(255, 255, 255, 0.12) !important;
  border-color: rgba(255, 255, 255, 0.25) !important;
  color: #ffffff !important;
  transform: translateY(-1px) !important;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2) !important;
}

.custom-cancel-btn:active {
  transform: translateY(0) !important;
}

/* 确认删除按钮 */
.custom-confirm-btn {
  background: linear-gradient(135deg, 
    rgba(255, 77, 79, 0.9) 0%, 
    rgba(220, 38, 38, 0.9) 100%) !important;
  border: 1px solid rgba(255, 77, 79, 0.3) !important;
  color: #ffffff !important;
  padding: 10px 24px !important;
  border-radius: 10px !important;
  font-size: 14px !important;
  font-weight: 600 !important;
  transition: all 0.3s ease !important;
  box-shadow: 
    0 4px 12px rgba(255, 77, 79, 0.3),
    0 0 20px rgba(255, 77, 79, 0.2) !important;
  position: relative !important;
  overflow: hidden !important;
}

.custom-confirm-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s ease;
}

.custom-confirm-btn:hover::before {
  left: 100%;
}

.custom-confirm-btn:hover {
  background: linear-gradient(135deg, 
    rgba(255, 77, 79, 1) 0%, 
    rgba(220, 38, 38, 1) 100%) !important;
  border-color: rgba(255, 77, 79, 0.5) !important;
  transform: translateY(-2px) !important;
  box-shadow: 
    0 6px 20px rgba(255, 77, 79, 0.5),
    0 0 30px rgba(255, 77, 79, 0.3) !important;
}

.custom-confirm-btn:active {
  transform: translateY(0) !important;
}

/* 对话框动画效果 */
.custom-delete-confirm::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(
    circle at 50% 0%, 
    rgba(255, 77, 79, 0.1) 0%, 
    transparent 60%
  );
  pointer-events: none;
  z-index: 0;
}

.custom-delete-confirm > * {
  position: relative;
  z-index: 1;
}
</style>

<style>
/* 筛选器区域样式 - 固定在内容页右上角 */
.filter-section-floating {
  position: fixed;
  top: 96px;
  right: 30px;
  z-index: 1000;
}

.filter-container {
  display: flex;
  align-items: center;
  gap: 0;
  padding: 6px 10px;
  background: rgba(45, 45, 45, 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
}

.filter-btn-floating {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  color: rgba(255, 255, 255, 0.85);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  user-select: none;
  border-radius: 10px;
}

.filter-btn-floating:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #ffffff;
}

.filter-btn-floating .arrow-icon {
  font-size: 13px;
  transition: transform 0.3s ease;
}

.filter-btn-floating:hover .arrow-icon {
  transform: translateY(2px);
}

.filter-divider-floating {
  width: 1px;
  height: 14px;
  background: rgba(255, 255, 255, 0.2);
  margin: 0 2px;
}

/* 时间筛选弹窗内容 */
.time-filter-content {
  padding: 20px;
}

.date-range-section {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.date-picker {
  flex: 1;
}

.date-separator {
  color: rgba(255, 255, 255, 0.5);
  font-size: 14px;
}

.quick-options {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.option-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: transparent;
  border: none;
  border-radius: 12px;
  color: rgba(255, 255, 255, 0.85);
  font-size: 15px;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: 4px;
}

.option-item:last-child {
  margin-bottom: 0;
}

.option-item:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #ffffff;
}

.option-item.active {
  background: rgba(80, 80, 80, 0.8);
  color: #ffffff;
}

.option-item .check-icon {
  color: #ffffff;
  font-size: 18px;
}

/* 筛选操作按钮 */
.filter-actions {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: flex-end;
}

.apply-btn {
  background: linear-gradient(135deg, #4A90E2, #357ABD) !important;
  border: none !important;
  color: #ffffff !important;
  padding: 8px 20px !important;
  border-radius: 8px !important;
  font-size: 13px !important;
  font-weight: 500 !important;
  transition: all 0.3s ease !important;
}

.apply-btn:hover:not(:disabled) {
  transform: translateY(-1px) !important;
  box-shadow: 0 4px 12px rgba(74, 144, 226, 0.4) !important;
}

.apply-btn:disabled {
  opacity: 0.5 !important;
  cursor: not-allowed !important;
}

/* 类型筛选弹窗内容 */
.type-filter-content {
  padding: 16px;
}

.type-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: transparent;
  border: none;
  border-radius: 12px;
  color: rgba(255, 255, 255, 0.85);
  font-size: 15px;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: 4px;
}

.type-option:last-child {
  margin-bottom: 0;
}

.type-option:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #ffffff;
}

.type-option.active {
  background: rgba(80, 80, 80, 0.8);
  color: #ffffff;
}

.type-option .check-icon {
  color: #ffffff;
  font-size: 18px;
}

/* 自定义弹窗样式 */
.time-filter-popover,
.type-filter-popover {
  background: rgba(50, 50, 50, 0.98) !important;
  border: 1px solid rgba(255, 255, 255, 0.15) !important;
  border-radius: 16px !important;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6) !important;
  backdrop-filter: blur(20px) !important;
  padding: 0 !important;
}

.time-filter-popover .el-popper__arrow::before,
.type-filter-popover .el-popper__arrow::before {
  background: rgba(50, 50, 50, 0.98) !important;
  border: 1px solid rgba(255, 255, 255, 0.15) !important;
}

/* 日期选择器样式覆盖 */
.time-filter-popover .el-date-picker,
.time-filter-popover .el-input__wrapper {
  background: rgba(60, 60, 60, 0.8) !important;
  border: 1px solid rgba(255, 255, 255, 0.15) !important;
  border-radius: 10px !important;
  box-shadow: none !important;
}

.time-filter-popover .el-input__inner {
  color: rgba(255, 255, 255, 0.9) !important;
}

.time-filter-popover .el-input__wrapper:hover {
  border-color: rgba(255, 255, 255, 0.25) !important;
}

.time-filter-popover .el-input__wrapper.is-focus {
  border-color: rgba(74, 144, 226, 0.5) !important;
  box-shadow: 0 0 0 1px rgba(74, 144, 226, 0.2) inset !important;
}
</style>

