<template>
  <div class="assets-container">
    <!-- 顶部工具栏 -->
    <div class="assets-toolbar">
      <div class="toolbar-left">
        <!-- Tab分类 -->
        <div class="asset-tabs">
          <div 
            class="tab-item" 
            :class="{ active: activeTab === 'image' }"
            @click="switchTab('image')"
          >
            图片
          </div>
          <div 
            class="tab-item" 
            :class="{ active: activeTab === 'video' }"
            @click="switchTab('video')"
          >
            视频
          </div>
        </div>
      </div>
      <div class="toolbar-right">
        <!-- 批量操作切换按钮 -->
        <button 
          v-if="!batchMode"
          class="batch-mode-btn"
          @click="enableBatchMode"
        >
          <el-icon class="batch-icon">
            <Select />
          </el-icon>
          批量操作
        </button>
        
        <!-- 批量操作按钮组 -->
        <div class="batch-actions" v-if="batchMode">
          <button 
            class="batch-action-btn danger"
            :disabled="!hasSelectedItems"
            @click="batchDelete"
          >
            删除
          </button>
          <button 
            class="batch-action-btn primary"
            :disabled="!hasSelectedItems"
            @click="batchDownload"
          >
            下载
          </button>
          <button 
            class="batch-action-btn"
            @click="cancelBatchMode"
          >
            取消
          </button>
        </div>
        
        <!-- 日期筛选 -->
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          size="small"
          style="width: 240px"
          @change="onDateRangeChange"
        />
      </div>
    </div>

    <!-- 按日期分组的资产列表 -->
    <div class="assets-content">
      <div 
        v-for="dateGroup in groupedAssets" 
        :key="dateGroup.date"
        class="date-group"
      >
        <!-- 日期标题和全选 -->
        <div class="date-header">
          <div class="date-title">{{ dateGroup.date }}</div>
          <div class="date-actions" v-if="batchMode">
            <el-checkbox 
              :checked="dateGroup.allSelected"
              :indeterminate="dateGroup.indeterminate"
              @change="(val) => toggleDateGroupSelection(dateGroup, val)"
            >
              全选
            </el-checkbox>
          </div>
        </div>

        <!-- 图片/视频网格 -->
        <div class="images-grid">
          <div 
            v-for="asset in dateGroup.assets" 
            :key="asset.id"
            class="image-item"
            :class="{ selected: asset.selected }"
            @click="handleAssetClick(asset, dateGroup)"
          >
            <div class="image-wrapper">
              <img 
                v-if="asset.type === 1"
                :src="asset.thumbnail || asset.coverUrl" 
                :alt="asset.name"
                class="asset-image"
              />
              <div 
                v-else-if="asset.type === 2" 
                class="video-thumbnail"
                @mouseenter="handleVideoHover(asset, true)"
                @mouseleave="handleVideoHover(asset, false)"
              >
                <video 
                  :ref="el => setVideoRef(el, asset.id)"
                  :src="asset.url || asset.materialUrl" 
                  class="asset-image"
                  muted
                  loop
                  playsinline
                />
                <div class="video-overlay" :class="{ 'video-playing': asset.isPlaying }">
                  <el-icon size="24"><VideoPlay /></el-icon>
                </div>
              </div>
              <div class="selection-overlay" v-if="batchMode && asset.selected">
                <el-icon class="check-icon"><Check /></el-icon>
              </div>
            </div>
          </div>
        </div>
      </div>
      <!-- 滚动哨兵元素和加载状态 -->
      <div v-if="hasMore && !initialLoading && groupedAssets.length > 0" class="scroll-sentinel">
        <div v-if="loadingMore" class="loading-more">
          <el-icon class="is-loading"><Loading /></el-icon>
          <span>加载中...</span>
        </div>
      </div>
      
      <!-- 没有更多数据提示 -->
      <div v-if="!hasMore && !initialLoading && groupedAssets.length > 0" class="no-more-data">
        <span>没有更多数据了</span>
      </div>

      <!-- 空状态 -->
      <div v-if="groupedAssets.length === 0 && !initialLoading" class="empty-state">
        <div class="empty-icon">{{ activeTab === 'image' ? '📷' : '🎬' }}</div>
        <p>暂无{{ activeTab === 'image' ? '图片' : '视频' }}资产</p>
      </div>

      <!-- 初始加载状态 -->
      <div v-if="initialLoading" class="initial-loading">
        <div class="loading-spinner">
          <el-icon class="is-loading"><Loading /></el-icon>
        </div>
        <div class="loading-text">加载中...</div>
      </div>
    </div>



    <!-- 预览对话框 -->
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
      <div v-if="currentAsset" class="preview-content">
        <div class="preview-close-btn" @click="previewVisible = false">
          <el-icon><Close /></el-icon>
        </div>
        
        <div class="preview-layout">
          <!-- 左侧：媒体展示区 -->
          <div class="preview-media-section">
            <div class="media-container">
              <img 
                v-if="currentAsset.type === 1" 
                :src="currentAssetDetail?.materialUrl || currentAsset.url || currentAsset.materialUrl" 
                :alt="currentAsset.name"
                class="preview-image"
              />
              <video 
                v-else-if="currentAsset.type === 2"
                :src="currentAssetDetail?.materialUrl || currentAsset.url || currentAsset.materialUrl"
                controls
                class="preview-video"
                autoplay
                muted
              />
              
              <!-- 右侧上下切换按钮 -->
              <div v-if="previewAssetList.length > 1" class="preview-nav-buttons">
                <div 
                  class="preview-nav-btn up-btn"
                  :class="{ disabled: currentPreviewIndex === 0 }"
                  @click="currentPreviewIndex > 0 && prevAsset()"
                >
                  <el-icon><ArrowUp /></el-icon>
                </div>
                <div 
                  class="preview-nav-btn down-btn"
                  :class="{ disabled: currentPreviewIndex === previewAssetList.length - 1 }"
                  @click="currentPreviewIndex < previewAssetList.length - 1 && nextAsset()"
                >
                  <el-icon><ArrowDown /></el-icon>
                </div>
              </div>
            </div>
          </div>
          
          <!-- 右侧：信息面板 -->
          <div class="preview-info-section">
            <div class="info-content">
              <!-- 标题 -->
              <div class="preview-header">
                <div class="header-icon">
                  <el-icon><VideoCamera v-if="currentAsset.type === 2" /><Picture v-else /></el-icon>
                </div>
                <h3 class="header-title">{{ currentAsset.type === 1 ? '图片详情' : '视频详情' }}</h3>
              </div>
              
              <!-- 元数据信息 -->
              <div class="preview-metadata-section" v-if="currentAssetDetail || !loadingDetail">
                <div class="metadata-row">
                  <!-- AI模型 -->
                  <div class="metadata-item-compact" v-if="currentAssetDetail?.userInput?.tags?.find(t => t.key === 'aiDriver')?.val">
                    <span class="metadata-text-compact">{{ currentAssetDetail.userInput.tags.find(t => t.key === 'aiDriver')?.val }}</span>
                  </div>
                  
                  <!-- 图片尺寸比例 -->
                  <div class="metadata-item-compact" v-if="currentAsset.type === 1 && currentAssetDetail?.userInput?.tags?.find(t => t.key === 'aspectRatio')?.val">
                    <span class="metadata-text-compact">{{ currentAssetDetail.userInput.tags.find(t => t.key === 'aspectRatio')?.val }}</span>
                  </div>
                  
                  <!-- 视频尺寸比例 -->
                  <div class="metadata-item-compact" v-if="currentAsset.type === 2 && currentAssetDetail?.userInput?.tags?.find(t => t.key === 'aspectRatio')?.val">
                    <span class="metadata-text-compact">{{ currentAssetDetail.userInput.tags.find(t => t.key === 'aspectRatio')?.val }}</span>
                  </div>
                  
                  <!-- 分辨率 -->
                  <div class="metadata-item-compact" v-if="currentAssetDetail?.userInput?.tags?.find(t => t.key === 'resolutionRatio')?.val">
                    <span class="metadata-text-compact">{{ currentAssetDetail.userInput.tags.find(t => t.key === 'resolutionRatio')?.val }}</span>
                  </div>
                  
                  <!-- 图片张数 -->
                  <div class="metadata-item-compact" v-if="currentAsset.type === 1 && currentAssetDetail?.userInput?.tags?.find(t => t.key === 'genImageNum')?.val">
                    <span class="metadata-text-compact">{{ currentAssetDetail.userInput.tags.find(t => t.key === 'genImageNum')?.val }}张</span>
                  </div>
                  
                  <!-- 视频时长 -->
                  <div class="metadata-item-compact" v-if="currentAsset.type === 2 && currentAssetDetail?.userInput?.tags?.find(t => t.key === 'duration')?.val">
                    <span class="metadata-text-compact">{{ currentAssetDetail.userInput.tags.find(t => t.key === 'duration')?.val }}秒</span>
                  </div>
                </div>
              </div>
              
              <!-- 加载状态 -->
              <div v-if="loadingDetail" class="prompt-placeholder">
                <el-icon class="is-loading"><Loading /></el-icon>
                <span>加载详情中...</span>
              </div>
              
              <!-- 提示词 -->
              <div class="preview-prompt-section" v-if="getPromptFromTags()">
                <div class="prompt-label">
                  <el-icon><Edit /></el-icon>
                  <span>生成提示词</span>
                </div>
                <div class="prompt-text">{{ getPromptFromTags() }}</div>
              </div>
              
              <!-- 占位符 - 如果没有提示词 -->
              <div v-if="!getPromptFromTags() && !loadingDetail" class="prompt-placeholder">
                <el-icon><Edit /></el-icon>
                <span>暂无详细信息</span>
              </div>
              
              <!-- 操作按钮 -->
              <div class="preview-actions">
                <el-button 
                  type="primary" 
                  @click="downloadCurrentAsset"
                  class="preview-action-btn primary-btn download-btn"
                >
                  <el-icon><Download /></el-icon>
                  <span>保存素材</span>
                </el-button>
                
                <!-- 底部固定按钮组 - 图片预览时显示 -->
                <div v-if="currentAsset.type === 1" class="preview-bottom-actions">
                  <el-button 
                    @click="handleImageToVideo" 
                    class="preview-bottom-btn"
                  >
                    <el-icon><VideoCamera /></el-icon>
                    <span>图生视频</span>
                  </el-button>
                  
                  <el-button 
                    @click="handleUseAsReference" 
                    class="preview-bottom-btn"
                  >
                    <el-icon><Picture /></el-icon>
                    <span>作为参考图</span>
                  </el-button>
                </div>
                
                <!-- 底部固定按钮组 - 视频预览时显示 -->
                <div v-if="currentAsset.type === 2" class="preview-bottom-actions">
                  <el-button 
                    @click="handleVideoReEdit" 
                    class="preview-bottom-btn"
                  >
                    <el-icon><Edit /></el-icon>
                    <span>重新编辑</span>
                  </el-button>
                  
                  <el-button 
                    @click="handleVideoRegenerate" 
                    class="preview-bottom-btn"
                  >
                    <el-icon><Refresh /></el-icon>
                    <span>再次生成</span>
                  </el-button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onUnmounted, type ComponentPublicInstance } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Check, VideoPlay, Download, Close, Select, Loading, Picture, VideoCamera, Edit, Refresh, ArrowUp, ArrowDown } from '@element-plus/icons-vue'
import { downloadFile, downloadFiles } from '../utils'
import { getAssetsResults, deleteGenerate, getAssetDetail } from '../api/assetsView'
import { useRouter } from 'vue-router'
import { useGenerateStore } from '../stores/generate'

const router = useRouter()
const generateStore = useGenerateStore()

interface Asset {
  id: number
  coverUrl: string
  createTime: string
  duration: number
  materialId: number
  materialUrl: string
  type: number // 1: 图片, 2: 视频
  userInputId: number
  selected?: boolean
  isPlaying?: boolean
  // 计算属性
  name?: string
  url?: string
  thumbnail?: string
  size?: number
  createdAt?: number
}

interface AssetDetail {
  id: number
  type: number
  userInputId: number
  coverUri: string
  coverUrl: string
  materialUri: string
  materialUrl: string
  duration: number
  materialId: number
  createTime: string
  userInput: {
    id: number
    type: number
    aiDriver: string
    status: number
    createTime: string
    tags: Array<{
      id: number
      name: string
      key: string
      val: string
      showVal: string
      attr: string
      type: number
      materialId: number
      sort: number
    }>
  }
}

interface DateGroup {
  date: string
  assets: Asset[]
  allSelected: boolean
  indeterminate: boolean
}

interface ApiResponse {
  code: number
  data: {
    list: Asset[]
  }
}

// 分页相关状态
const currentPage = ref(1)
const pageSize = ref(20)
const loadingMore = ref(false)
const hasMore = ref(true)
const initialLoading = ref(true)

// 滚动加载相关
const loadMoreObserver = ref<IntersectionObserver | null>(null)

const activeTab = ref<'image' | 'video'>('image')
const dateRange = ref<[Date, Date] | null>(null)
const previewVisible = ref(false)
const currentAsset = ref<Asset | null>(null)
const currentAssetDetail = ref<AssetDetail | null>(null)
const loadingDetail = ref(false)
// 预览列表相关状态
const previewAssetList = ref<Asset[]>([])
const currentPreviewIndex = ref(0)
const batchMode = ref(false) // 批量操作模式
// 资产数据
const assets = ref<Asset[]>([])
// 视频元素引用映射
const videoRefs = new Map<number, HTMLVideoElement>()
//获取资产列表数据
const getAssetsList = async (page: number = 1, append: boolean = false) => {
  if (loadingMore.value) return
  
  try {
    loadingMore.value = true
    
    // 首次加载时设置初始加载状态
    if (page === 1 && !append) {
      initialLoading.value = true
    }

    // 构建请求参数
    const params: Record<string, string | number> = {
      page,
      pageSize: pageSize.value,
      type: activeTab.value === 'image' ? 1 : 2 // 1=图片, 2=视频
    }

    // 添加日期筛选参数
    if (dateRange.value) {
      const [start, end] = dateRange.value
      // 使用本地时间格式化日期，避免时区问题
      const formatDate = (date: Date) => {
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        return `${year}-${month}-${day}`
      }
      
      params.startTime = formatDate(start)
      params.endTime = formatDate(end)
    }

    const response = await getAssetsResults(params) as ApiResponse
    console.log('获取资产列表成功:', response)
    
    if (response && response.data) {
      const { list } = response.data
      
      // 转换API数据格式为组件需要的格式
      const transformedAssets = list.map((item: Asset) => ({
        ...item,
        // 添加计算属性
        name: `${item.type === 1 ? '图片' : '视频'}_${item.id}${item.type === 1 ? '.jpg' : '.mp4'}`,
        url: item.materialUrl,
        thumbnail: item.coverUrl,
        size: 0, // API没有提供文件大小，设为0
        createdAt: new Date(item.createTime).getTime(),
        selected: false
      }))
      
      if (append) {
        assets.value = [...assets.value, ...transformedAssets]
      } else {
        assets.value = transformedAssets
        currentPage.value = 1
      }
      
      // 判断是否还有更多数据
      hasMore.value = list.length >= pageSize.value
      
      console.log(`加载完成 - 页码: ${page}, 新增数据: ${list.length}, 总数据: ${assets.value.length}, 还有更多: ${hasMore.value}`)
    }
  } catch (error) {
    console.error('获取资产列表失败:', error)
    ElMessage.error('资产初始化失败，请稍后重试')
  } finally {
    loadingMore.value = false
    
    // 首次加载完成后关闭初始加载状态
    if (initialLoading.value) {
      initialLoading.value = false
    }
    
    // 每次加载完成后重新设置 Observer
    if (hasMore.value) {
      setTimeout(() => {
        setupIntersectionObserver()
      }, 300)
    }
  }
}

// 初始获取资产列表 
getAssetsList()

// 过滤后的资产（现在直接使用assets，因为筛选在API层面完成）
const filteredAssets = computed(() => {
  return assets.value
})

// 按日期分组
const groupedAssets = computed(() => {
  const groups: { [key: string]: Asset[] } = {}
  
  filteredAssets.value.forEach(asset => {
    const date = new Date(asset.createdAt || 0)
    const dateKey = formatDateKey(date)
    
    if (!groups[dateKey]) {
      groups[dateKey] = []
    }
    groups[dateKey].push(asset)
  })

  // 转换为数组并计算选择状态
  return Object.entries(groups)
    .map(([date, assets]) => {
      const selectedCount = assets.filter(a => a.selected).length
      return {
        date,
        assets,
        allSelected: selectedCount === assets.length && assets.length > 0,
        indeterminate: selectedCount > 0 && selectedCount < assets.length
      }
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
})

// 计算选中的资产数量
const selectedCount = computed(() => {
  return assets.value.filter(asset => asset.selected).length
})

const hasSelectedItems = computed(() => selectedCount.value > 0)

// 切换tab
const switchTab = (tab: 'image' | 'video') => {
  activeTab.value = tab
  // 切换tab时清除所有选择状态并重新加载数据
  assets.value.forEach(asset => {
    asset.selected = false
  })
  // 断开旧的 Observer
  if (loadMoreObserver.value) {
    loadMoreObserver.value.disconnect()
    loadMoreObserver.value = null
  }
  // 重置状态
  currentPage.value = 1
  hasMore.value = true
  getAssetsList(1, false)
}

// 启用批量操作模式
const enableBatchMode = () => {
  batchMode.value = true
}

// 取消批量操作模式
const cancelBatchMode = () => {
  batchMode.value = false
  // 清除所有选择状态
  assets.value.forEach(asset => {
    asset.selected = false
  })
}

// 格式化日期显示
const formatDate = (date: Date) => {
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  
  if (date.toDateString() === today.toDateString()) {
    return '今天'
  } else if (date.toDateString() === yesterday.toDateString()) {
    return '昨天'
  } else {
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  }
}

// 格式化日期作为分组key
const formatDateKey = (date: Date) => {
  return formatDate(date)
}

// 处理资产点击事件
const handleAssetClick = (asset: Asset, dateGroup: DateGroup) => {
  if (batchMode.value) {
    // 批量操作模式下，点击切换选择状态
    toggleAssetSelection(asset, dateGroup)
  } else {
    // 非批量操作模式下，点击预览
    previewAsset(asset)
  }
}

// 切换单个资产选择状态
const toggleAssetSelection = (asset: Asset, dateGroup: DateGroup) => {
  asset.selected = !asset.selected
  updateDateGroupSelection(dateGroup)
}

// 切换日期组选择状态
const toggleDateGroupSelection = (dateGroup: DateGroup, newState: boolean) => {
  // 直接使用传入的新状态值
  dateGroup.assets.forEach(asset => {
    asset.selected = newState
  })
}

// 更新日期组选择状态
const updateDateGroupSelection = (dateGroup: DateGroup) => {
  const selectedCount = dateGroup.assets.filter(a => a.selected).length
  dateGroup.allSelected = selectedCount === dateGroup.assets.length && dateGroup.assets.length > 0
  dateGroup.indeterminate = selectedCount > 0 && selectedCount < dateGroup.assets.length
}

// 预览资产
const previewAsset = async (asset: Asset) => {
  currentAsset.value = asset
  currentAssetDetail.value = null
  previewVisible.value = true
  
  // 设置预览列表（当前日期组的所有资产）
  const currentDateGroup = groupedAssets.value.find(group => 
    group.assets.some(a => a.id === asset.id)
  )
  
  if (currentDateGroup) {
    // 过滤相同类型的资产
    previewAssetList.value = currentDateGroup.assets.filter(a => a.type === asset.type)
    // 找到当前资产在列表中的索引
    currentPreviewIndex.value = previewAssetList.value.findIndex(a => a.id === asset.id)
  } else {
    // 如果没有找到日期组，创建单个资产的列表
    previewAssetList.value = [asset]
    currentPreviewIndex.value = 0
  }
  
  // 加载详细信息
  await loadAssetDetail(asset)
}

// 下载当前预览的资产
const downloadCurrentAsset = async () => {
  if (currentAsset.value) {
    try {
      const url = currentAsset.value.url || currentAsset.value.materialUrl
      const filename = currentAsset.value.name || `${currentAsset.value.type === 1 ? '图片' : '视频'}_${currentAsset.value.id}${currentAsset.value.type === 1 ? '.jpg' : '.mp4'}`
      await downloadFile(url, filename)
      ElMessage.success('开始下载')
    } catch (error) {
      console.error('下载失败:', error)
      ElMessage.error('下载失败，请重试')
    }
  }
}

// 批量删除
const batchDelete = async () => {
  const selectedAssets = assets.value.filter(asset => asset.selected)
  
  if (selectedAssets.length === 0) {
    ElMessage.warning(`请先选择要删除的${activeTab.value === 'image' ? '图片' : '视频'}`)
    return
  }

  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedAssets.length} 个${activeTab.value === 'image' ? '图片' : '视频'}吗？`,
      '批量删除确认',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    // 调用删除接口
    const userAssetIds = selectedAssets.map(asset => asset.id)
    await deleteGenerate({
      userAssetIds
    })
    
    // 删除选中的资产
    selectedAssets.forEach(asset => {
      const index = assets.value.findIndex(a => a.id === asset.id)
      if (index > -1) {
        assets.value.splice(index, 1)
      }
    })
    
    ElMessage.success(`成功删除 ${selectedAssets.length} 个${activeTab.value === 'image' ? '图片' : '视频'}`)
    
    // 删除后退出批量操作模式
    cancelBatchMode()
  } catch (error: unknown) {
    // 如果是用户取消删除，不显示错误信息
    if (error !== 'cancel') {
      console.error('批量删除失败:', error)
      ElMessage.error('批量删除失败，请重试')
    }
  }
}

// 批量下载
const batchDownload = async () => {
  const selectedAssets = assets.value.filter(asset => asset.selected)
  
  if (selectedAssets.length === 0) {
    ElMessage.warning(`请先选择要下载的${activeTab.value === 'image' ? '图片' : '视频'}`)
    return
  }

  try {
    // 准备下载文件列表
    const files = selectedAssets.map(asset => ({
      url: asset.url || asset.materialUrl,
      filename: asset.name || `${asset.type === 1 ? '图片' : '视频'}_${asset.id}${asset.type === 1 ? '.jpg' : '.mp4'}`
    }))

    // 使用批量下载工具函数
    await downloadFiles(files, {
      delay: 500, // 每个文件间隔500ms
      onProgress: (current, total) => {
        ElMessage.info(`正在下载 ${current}/${total} 个文件`)
      },
      onError: (error, file) => {
        console.error(`下载文件 ${file.filename} 失败:`, error)
        ElMessage.error(`下载文件 ${file.filename} 失败`)
      }
    })
    
    ElMessage.success(`成功下载 ${selectedAssets.length} 个文件`)
    
    // 下载后退出批量操作模式
    cancelBatchMode()
  } catch (error) {
    console.error('批量下载失败:', error)
    ElMessage.error('批量下载失败，请重试')
  }
}

// 日期范围变化处理
const onDateRangeChange = () => {
  // 清除所有选择状态并重新加载数据
  assets.value.forEach(asset => {
    asset.selected = false
  })
  // 断开旧的 Observer
  if (loadMoreObserver.value) {
    loadMoreObserver.value.disconnect()
    loadMoreObserver.value = null
  }
  // 重置状态
  currentPage.value = 1
  hasMore.value = true
  getAssetsList(1, false)
}

// 设置 Intersection Observer 监听底部元素
const setupIntersectionObserver = () => {
  // 断开旧的 Observer
  if (loadMoreObserver.value) {
    loadMoreObserver.value.disconnect()
    loadMoreObserver.value = null
  }
  
  // 查找滚动哨兵元素
  const sentinelEl = document.querySelector('.scroll-sentinel')
  
  if (!sentinelEl || !hasMore.value || loadingMore.value) {
    console.log('Observer 设置条件不满足:', { 
      sentinelEl: !!sentinelEl, 
      hasMore: hasMore.value, 
      loadingMore: loadingMore.value 
    })
    return
  }
  
  console.log('设置 Intersection Observer')
  
  // 创建 Intersection Observer
  loadMoreObserver.value = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        console.log('Observer 触发:', { 
          isIntersecting: entry.isIntersecting, 
          hasMore: hasMore.value, 
          loadingMore: loadingMore.value,
          currentPage: currentPage.value
        })
        
        // 简化条件判断
        if (entry.isIntersecting && hasMore.value && !loadingMore.value) {
          console.log('触发加载更多，当前页:', currentPage.value)
          currentPage.value++
          getAssetsList(currentPage.value, true)
        }
      })
    },
    {
      root: null,
      rootMargin: '100px', // 提前100px触发
      threshold: 0.1
    }
  )
  
  loadMoreObserver.value.observe(sentinelEl)
  console.log('Observer 已设置并开始监听')
}

// 加载资产详情
const loadAssetDetail = async (asset: Asset) => {
  try {
    loadingDetail.value = true
    const response = await getAssetDetail({ id: asset.id }) as { data: AssetDetail }
    if (response && response.data) {
      currentAssetDetail.value = response.data
    }
  } catch (error) {
    console.error('获取资产详情失败:', error)
    ElMessage.error('获取资产详情失败')
  } finally {
    loadingDetail.value = false
  }
}

// 切换到上一个资产
const prevAsset = () => {
  if (currentPreviewIndex.value > 0) {
    currentPreviewIndex.value--
    updatePreviewAsset()
  }
}

// 切换到下一个资产
const nextAsset = () => {
  if (currentPreviewIndex.value < previewAssetList.value.length - 1) {
    currentPreviewIndex.value++
    updatePreviewAsset()
  }
}

// 更新预览资产
const updatePreviewAsset = () => {
  const currentPreviewAsset = previewAssetList.value[currentPreviewIndex.value]
  if (currentPreviewAsset) {
    currentAsset.value = currentPreviewAsset
    currentAssetDetail.value = null
    loadAssetDetail(currentPreviewAsset)
  }
}

// 从标签中获取提示词
const getPromptFromTags = () => {
  if (!currentAssetDetail.value?.userInput?.tags) return ''
  
  // 查找提示词相关的标签
  const promptTag = currentAssetDetail.value.userInput.tags.find(tag => 
    tag.key === 'prompt' || tag.key === 'userPrompt' || tag.key === 'text' || tag.name === '提示词'
  )
  
  return promptTag?.val || promptTag?.showVal || ''
}

// 监听日期范围和tab变化，清除选择状态
watch([dateRange, activeTab], () => {
  assets.value.forEach(asset => {
    asset.selected = false
  })
})

// 组件卸载时清理
onUnmounted(() => {
  // 断开 Intersection Observer
  if (loadMoreObserver.value) {
    loadMoreObserver.value.disconnect()
    loadMoreObserver.value = null
  }
  
  // 移除键盘事件监听
  document.removeEventListener('keydown', handleKeydown)
})

// 键盘导航处理
const handleKeydown = (event: KeyboardEvent) => {
  if (!previewVisible.value) return
  
  if (event.key === 'ArrowLeft') {
    prevAsset()
  } else if (event.key === 'ArrowRight') {
    nextAsset()
  } else if (event.key === 'Escape') {
    previewVisible.value = false
  }
}

// 添加键盘事件监听
document.addEventListener('keydown', handleKeydown)

// 图生视频功能
const handleImageToVideo = () => {
  if (!currentAsset.value) return
  
  // 使用 store 设置配置
  generateStore.setConfig({
    mode: 'video',
    referenceImages: [{
      url: currentAsset.value.url || currentAsset.value.materialUrl,
      val: currentAssetDetail.value?.materialUri || currentAsset.value.materialUrl
    }]
  })
  
  // 关闭预览弹窗
  previewVisible.value = false
  
  // 跳转到生成页面
  router.push('/mobgiAI/generate')
  
  ElMessage.success('已跳转到视频生成页面')
}

// 作为参考图功能
const handleUseAsReference = () => {
  if (!currentAsset.value) return
  
  // 使用 store 设置配置
  generateStore.setConfig({
    mode: 'image',
    referenceImages: [{
      url: currentAsset.value.url || currentAsset.value.materialUrl,
      val: currentAssetDetail.value?.materialUri || currentAsset.value.materialUrl
    }]
  })
  
  // 关闭预览弹窗
  previewVisible.value = false
  
  // 跳转到生成页面
  router.push('/mobgiAI/generate')
  
  ElMessage.success('已跳转到图片生成页面')
}

// 视频重新编辑功能
const handleVideoReEdit = () => {
  if (!currentAsset.value || !currentAssetDetail.value) return
  
  // 使用 store 设置配置（从资产详情中提取所有参数）
  generateStore.setConfigFromAsset(currentAssetDetail.value, 'video')
  
  // 关闭预览弹窗
  previewVisible.value = false
  
  // 跳转到生成页面
  router.push('/mobgiAI/generate')
  
  ElMessage.success('已跳转到视频生成页面')
}

// 视频再次生成功能
const handleVideoRegenerate = () => {
  if (!currentAsset.value || !currentAssetDetail.value) return
  
  // 使用 store 设置配置（从资产详情中提取所有参数，但不包含参考视频）
  generateStore.setConfigFromAsset(currentAssetDetail.value, 'video')
  // 清除参考视频，因为是再次生成
  generateStore.clearReferenceVideo()
  
  // 设置自动调用 retry 的标志和 userInputId
  generateStore.setConfig({
    autoRetry: true,
    retryUserInputId: currentAssetDetail.value.userInputId
  })
  
  // 关闭预览弹窗
  previewVisible.value = false
  
  // 跳转到生成页面
  router.push('/mobgiAI/generate')
  
  ElMessage.success('正在重新生成...')
}

// 设置视频元素引用
const setVideoRef = (el: Element | ComponentPublicInstance | null, assetId: number) => {
  if (el && el instanceof HTMLVideoElement) {
    videoRefs.set(assetId, el)
  }
}

// 处理视频 hover 事件
const handleVideoHover = async (asset: Asset, isHovering: boolean) => {
  const videoEl = videoRefs.get(asset.id)
  if (!videoEl) return

  try {
    if (isHovering) {
      asset.isPlaying = true
      videoEl.currentTime = 0 // 从头开始播放
      await videoEl.play()
    } else {
      asset.isPlaying = false
      videoEl.pause()
      videoEl.currentTime = 0 // 重置到开始
    }
  } catch (error) {
    console.error('视频播放控制失败:', error)
  }
}
</script>

<style scoped>
.assets-container {
  padding: 0;
  background: #000;
  min-height: 100%;
  height: 100%;
  color: #fff;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.assets-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: #000;
  border-bottom: 1px solid #333;
  flex-shrink: 0;
  position: sticky;
  top: 0;
  z-index: 10;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 24px;
}

.asset-tabs {
  display: flex;
  gap: 0;
}

.tab-item {
  padding: 8px 16px;
  cursor: pointer;
  color: #666;
  border-bottom: 2px solid transparent;
  transition: all 0.3s ease;
  font-size: 14px;
}

.tab-item:hover {
  color: #fff;
}

.tab-item.active {
  color: #409eff;
  border-bottom-color: #409eff;
}

.batch-mode-toggle {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  cursor: pointer;
  color: #666;
  border-bottom: 2px solid transparent;
  transition: all 0.3s ease;
  font-size: 14px;
  margin-left: 24px;
}

.batch-mode-toggle:hover {
  color: #fff;
}

.batch-mode-toggle.active {
  color: #409eff;
  border-bottom-color: #409eff;
}

.batch-icon {
  font-size: 16px;
}

.batch-mode-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  background: transparent;
  border: 1px solid #444;
  border-radius: 6px;
  color: #fff;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.batch-mode-btn:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: #666;
}

.batch-mode-btn .batch-icon {
  font-size: 16px;
}

.batch-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.batch-action-btn {
  padding: 6px 14px;
  background: transparent;
  border: 1px solid #444;
  border-radius: 6px;
  color: #fff;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.batch-action-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.05);
  border-color: #666;
}

.batch-action-btn.primary {
  background: #409eff;
  border-color: #409eff;
  color: #fff;
}

.batch-action-btn.primary:hover:not(:disabled) {
  background: #66b1ff;
  border-color: #66b1ff;
}

.batch-action-btn.danger {
  background: #f56c6c;
  border-color: #f56c6c;
  color: #fff;
}

.batch-action-btn.danger:hover:not(:disabled) {
  background: #f78989;
  border-color: #f78989;
}

.batch-action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.assets-content {
  padding: 24px;
  flex: 1;
  overflow-y: auto;
}

.date-group {
  margin-bottom: 40px;
}

.date-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid #333;
}

.date-title {
  font-size: 18px;
  font-weight: 500;
  color: #fff;
}

.date-actions {
  display: flex;
  align-items: center;
}

.images-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 8px;
}

.image-item {
  position: relative;
  aspect-ratio: 1;
  cursor: pointer;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.2s ease;
}

.image-item:hover {
  transform: scale(1.02);
}

.image-item.selected {
  outline: 3px solid #409eff;
  outline-offset: 2px;
}

.image-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
}

.asset-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  background: #333;
}

.video-thumbnail {
  position: relative;
  width: 100%;
  height: 100%;
}

.video-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0, 0, 0, 0.6);
  border-radius: 50%;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  transition: opacity 0.3s ease, transform 0.3s ease;
  pointer-events: none;
}

.video-overlay.video-playing {
  opacity: 0;
  transform: translate(-50%, -50%) scale(0.8);
}

.selection-overlay {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 24px;
  height: 24px;
  background: #409eff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.check-icon {
  font-size: 14px;
}

.empty-state {
  text-align: center;
  padding: 80px 20px;
  color: #666;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.empty-state p {
  margin: 0;
  font-size: 16px;
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
  background: #000;
  padding: 0;
  position: relative;
  overflow: hidden !important;
  margin: 0;
  height: 100vh;
  max-height: 100vh;
}

/* 媒体容器需要相对定位 */
.media-container {
  position: relative;
  z-index: 1;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0;
  padding: 0;
}

.preview-image,
.preview-video {
  max-width: calc(100% - 40px);
  max-height: 80vh;
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

/* 右侧上下切换按钮容器 */
.preview-nav-buttons {
  position: absolute;
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  gap: 16px;
  z-index: 10;
}

/* 上下切换按钮 - 无背景样式 */
.preview-nav-btn {
  width: 40px;
  height: 40px;
  border: none;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  color: rgba(255, 255, 255, 0.7);
}

.preview-nav-btn:hover:not(.disabled) {
  color: #ffffff;
  transform: scale(1.2);
}

.preview-nav-btn:active:not(.disabled) {
  transform: scale(0.9);
}

.preview-nav-btn.disabled {
  color: rgba(255, 255, 255, 0.4);
  cursor: not-allowed;
  opacity: 0.5;
}

.preview-nav-btn .el-icon {
  font-size: 32px;
  font-weight: 600;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5));
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
  padding: 60px 20px 24px 20px;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow-y: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

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

/* 元数据区域 */
.preview-metadata-section {
  margin-bottom: 16px;
}

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

.metadata-text-compact {
  font-size: 12px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.95);
}

/* 提示词区域 */
.preview-prompt-section {
  flex: 0 0 auto;
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
  max-height: 486px;
}

.prompt-text:hover {
  background: rgba(0, 0, 0, 0.3);
  border-color: rgba(255, 255, 255, 0.1);
}

.prompt-text .info-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
  gap: 12px;
}

.prompt-text .info-item:last-child {
  margin-bottom: 0;
}

.prompt-text .info-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  min-width: 80px;
  flex-shrink: 0;
}

.prompt-text .info-value {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.95);
  text-align: right;
  flex: 1;
  word-break: break-word;
}

.prompt-text .info-value.status {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
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

.prompt-placeholder .is-loading {
  animation: rotating 2s linear infinite;
}

/* 状态样式 */
.status-pending {
  background: rgba(255, 193, 7, 0.2);
  color: #ffc107;
}

.status-processing {
  background: rgba(64, 158, 255, 0.2);
  color: #409eff;
}

.status-completed {
  background: rgba(103, 194, 58, 0.2);
  color: #67c23a;
}

.status-failed {
  background: rgba(245, 108, 108, 0.2);
  color: #f56c6c;
}

.status-unknown {
  background: rgba(144, 147, 153, 0.2);
  color: #909399;
}

/* 操作按钮 */
.preview-actions {
  display: flex;
  flex-direction: column;
  gap: 0;
  padding-top: 4px;
  flex-shrink: 0;
  margin-top: auto;
  position: sticky;
  bottom: 0;
  background: transparent;
  padding-top: 20px;
  margin-left: -20px;
  margin-right: -20px;
  margin-bottom: -20px;
  padding-left: 20px;
  padding-right: 20px;
  padding-bottom: 20px;
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
  margin-bottom: 16px;
}

.preview-action-btn.primary-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #ffffff;
  box-shadow: 
    0 8px 24px rgba(102, 126, 234, 0.4),
    0 0 0 1px rgba(255, 255, 255, 0.1) inset;
}

.preview-action-btn.danger-btn {
  background: linear-gradient(135deg, #f56c6c 0%, #e85a5a 100%);
  color: #ffffff;
  box-shadow: 
    0 8px 24px rgba(245, 108, 108, 0.4),
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

.preview-action-btn.danger-btn:hover {
  transform: translateY(-3px);
  box-shadow: 
    0 12px 36px rgba(245, 108, 108, 0.5),
    0 0 0 1px rgba(255, 255, 255, 0.15) inset;
  background: linear-gradient(135deg, #f78989 0%, #f06666 100%);
}

.preview-action-btn:active {
  transform: translateY(-1px);
}

.preview-action-btn .el-icon {
  font-size: 20px;
}

/* 底部固定按钮组 */
.preview-bottom-actions {
  display: flex;
  gap: 12px;
  padding: 0;
  background: transparent;
  border-radius: 0;
  border: none;
}

.preview-bottom-btn {
  flex: 1;
  height: 48px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
  background: rgba(255, 255, 255, 0.03);
  color: rgba(255, 255, 255, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.08);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  backdrop-filter: blur(10px);
}

.preview-bottom-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.05), transparent);
  transition: left 0.5s ease;
}

.preview-bottom-btn:hover::before {
  left: 100%;
}

.preview-bottom-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.15);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  color: rgba(255, 255, 255, 0.85);
}

.preview-bottom-btn:active {
  transform: translateY(0);
}

.preview-bottom-btn .el-icon {
  font-size: 16px;
}

/* Element Plus 组件样式覆盖 */
:deep(.el-checkbox) {
  color: #fff;
}

:deep(.el-checkbox__label) {
  color: #fff;
}

:deep(.el-checkbox__input.is-checked .el-checkbox__inner) {
  background-color: #409eff;
  border-color: #409eff;
}

:deep(.el-checkbox__input.is-indeterminate .el-checkbox__inner) {
  background-color: #409eff;
  border-color: #409eff;
}

:deep(.el-date-editor) {
  background-color: #1a1a1a;
  border-color: #333;
  color: #fff;
  height: 30px;
}

:deep(.el-date-editor .el-input__inner) {
  background-color: transparent;
  border: none;
  color: #fff;
}

:deep(.el-date-editor .el-input__prefix) {
  color: #666;
}

:deep(.el-date-editor .el-input__suffix) {
  color: #666;
}

:deep(.el-date-editor .el-range-input) {
  color: #f5f5f5;
}
:deep(.el-date-editor .el-range-separator) {
  color: #79797a;
}
:deep(.el-button--primary) {
  background-color: #409eff;
  border-color: #409eff;
}

:deep(.el-button--primary:hover) {
  background-color: #66b1ff;
  border-color: #66b1ff;
}

:deep(.el-button--danger) {
  background-color: #f56c6c;
  border-color: #f56c6c;
}

:deep(.el-button--danger:hover) {
  background-color: #f78989;
  border-color: #f78989;
}

:deep(.preview-dialog .el-dialog) {
  background-color: #1a1a1a;
}

:deep(.preview-dialog .el-dialog__header) {
  background-color: #1a1a1a;
  border-bottom: 1px solid #333;
}

:deep(.preview-dialog .el-dialog__title) {
  color: #fff;
}

:deep(.preview-dialog .el-dialog__body) {
  background-color: #1a1a1a;
  color: #fff;
}

/* 滚动加载相关样式 */
.scroll-sentinel {
  height: 1px; /* 减小高度，避免初始就可见 */
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 40px 0; /* 增加上下边距 */
}

.loading-more {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #666;
  font-size: 14px;
  padding: 20px 0;
}

.loading-more .is-loading {
  animation: rotating 2s linear infinite;
}

.no-more-data {
  text-align: center;
  padding: 20px;
  color: #666;
  font-size: 14px;
}

.initial-loading {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  z-index: 10;
}

.loading-spinner .is-loading {
  font-size: 32px;
  color: #409eff;
  animation: rotating 2s linear infinite;
}

.loading-text {
  color: #666;
  font-size: 16px;
}

@keyframes rotating {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .assets-toolbar {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }
  
  .toolbar-left,
  .toolbar-right {
    justify-content: center;
  }
  
  .toolbar-left {
    flex-direction: column;
    gap: 12px;
  }
  
  .images-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 6px;
  }
  
  .assets-content {
    padding: 16px;
  }
  
  .date-group {
    margin-bottom: 30px;
  }
  
  /* 移动端预览弹窗 */
  :deep(.preview-dialog .el-dialog) {
    width: 95% !important;
    margin: 2.5vh auto;
    max-height: 95vh;
  }
  
  .preview-header {
    padding: 16px;
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }
  
  .preview-actions {
    justify-content: center;
  }
  
  .asset-details {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  
  .preview-footer {
    padding: 16px;
  }
}

/* 加载详情样式 */
.loading-detail {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 20px;
  color: #666;
  font-size: 14px;
}

.loading-detail .is-loading {
  animation: rotating 2s linear infinite;
}

/* 标签样式 */
.asset-tags {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #333;
}

.tags-title {
  font-size: 14px;
  color: #fff;
  font-weight: 500;
  margin-bottom: 12px;
}

.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag-item {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: rgba(64, 158, 255, 0.1);
  border: 1px solid rgba(64, 158, 255, 0.3);
  border-radius: 4px;
  font-size: 12px;
}

.tag-name {
  color: #409eff;
  font-weight: 500;
}

.tag-value {
  color: #fff;
}

@media (max-width: 768px) {
  .assets-toolbar {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }
  
  .toolbar-left,
  .toolbar-right {
    justify-content: center;
  }
  
  .toolbar-left {
    flex-direction: column;
    gap: 12px;
  }
  
  .images-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 6px;
  }
  
  .assets-content {
    padding: 16px;
  }
  
  .date-group {
    margin-bottom: 30px;
  }
  
  /* 移动端预览弹窗 - 改为上下布局 */
  .preview-layout {
    flex-direction: column;
  }
  
  .preview-media-section {
    height: 60%;
    width: 100%;
  }
  
  .preview-info-section {
    width: 100%;
    height: 40%;
    border-left: none;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
  }
  
  .info-content {
    padding: 20px 16px 16px 16px;
  }
  
  .preview-actions {
    flex-direction: row;
    gap: 12px;
  }
  
  .preview-action-btn {
    flex: 1;
    height: 40px;
  }
}

@media (min-width: 769px) and (max-width: 1024px) {
  .images-grid {
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  }
}

@media (min-width: 1025px) {
  .images-grid {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  }
}

@media (min-width: 1400px) {
  .images-grid {
    grid-template-columns: repeat(auto-fill, minmax(215px, 1fr));
  }
}
</style>