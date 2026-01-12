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
        
        <!-- 批量操作 -->
        <div class="batch-operations" v-if="hasSelectedItems">
          <span class="batch-text">批量操作 ({{ selectedCount }})</span>
        </div>
      </div>
      <div class="toolbar-right">
        <!-- 批量操作按钮 -->
        <div class="batch-actions" v-if="hasSelectedItems">
          <el-button 
            type="danger" 
            size="small"
            @click="batchDelete"
          >
            删除
          </el-button>
          <el-button 
            type="primary" 
            size="small"
            @click="batchDownload"
          >
            下载
          </el-button>
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
          <div class="date-actions">
            <el-checkbox 
              v-model="dateGroup.allSelected"
              :indeterminate="dateGroup.indeterminate"
              @change="toggleDateGroupSelection(dateGroup)"
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
                v-if="asset.type === 'image'"
                :src="asset.thumbnail" 
                :alt="asset.name"
                class="asset-image"
              />
              <div v-else-if="asset.type === 'video'" class="video-thumbnail">
                <video :src="asset.url" class="asset-image" />
                <div class="video-overlay">
                  <el-icon size="24"><VideoPlay /></el-icon>
                </div>
              </div>
              <div class="selection-overlay" v-if="asset.selected">
                <el-icon class="check-icon"><Check /></el-icon>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-if="groupedAssets.length === 0" class="empty-state">
      <div class="empty-icon">{{ activeTab === 'image' ? '📷' : '🎬' }}</div>
      <p>暂无{{ activeTab === 'image' ? '图片' : '视频' }}资产</p>
    </div>

    <!-- 预览对话框 -->
    <el-dialog 
      v-model="previewVisible" 
      :show-close="false"
      width="90%" 
      center
      class="preview-dialog"
      :close-on-click-modal="true"
      :close-on-press-escape="true"
    >
      <template #header>
        <div class="preview-header">
          <div class="preview-title">
            <span class="asset-name">{{ currentAsset?.name || '预览' }}</span>
            <div class="asset-meta">
              <span class="meta-item">{{ formatFileSize(currentAsset?.size || 0) }}</span>
              <span class="meta-divider">•</span>
              <span class="meta-item">{{ formatDate(new Date(currentAsset?.createdAt || 0)) }}</span>
            </div>
          </div>
          <div class="preview-actions">
            <el-button 
              type="primary" 
              size="small" 
              @click="downloadCurrentAsset"
              class="action-btn"
            >
              <el-icon><Download /></el-icon>
              下载
            </el-button>
            <el-button 
              type="danger" 
              size="small" 
              @click="deleteCurrentAsset"
              class="action-btn"
            >
              <el-icon><Delete /></el-icon>
              删除
            </el-button>
            <el-button 
              size="small" 
              @click="previewVisible = false"
              class="close-btn"
            >
              <el-icon><Close /></el-icon>
            </el-button>
          </div>
        </div>
      </template>
      
      <div v-if="currentAsset" class="asset-preview-content">
        <div class="preview-media">
          <img 
            v-if="currentAsset.type === 'image'" 
            :src="currentAsset.url" 
            :alt="currentAsset.name"
            class="preview-image"
          />
          <video 
            v-else-if="currentAsset.type === 'video'"
            :src="currentAsset.url"
            controls
            class="preview-video"
            autoplay
            muted
          />
        </div>
        
        <!-- 底部信息栏 -->
        <div class="preview-footer">
          <div class="asset-details">
            <div class="detail-item">
              <span class="detail-label">类型</span>
              <span class="detail-value">{{ currentAsset.type === 'image' ? '图片' : '视频' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">大小</span>
              <span class="detail-value">{{ formatFileSize(currentAsset.size) }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">创建时间</span>
              <span class="detail-value">{{ new Date(currentAsset.createdAt).toLocaleString('zh-CN') }}</span>
            </div>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Check, VideoPlay, Download, Delete, Close } from '@element-plus/icons-vue'

interface Asset {
  id: string
  name: string
  type: 'image' | 'video'
  url: string
  thumbnail: string
  size: number
  createdAt: number
  selected?: boolean
}

interface DateGroup {
  date: string
  assets: Asset[]
  allSelected: boolean
  indeterminate: boolean
}

const activeTab = ref<'image' | 'video'>('image')
const dateRange = ref<[Date, Date] | null>(null)
const previewVisible = ref(false)
const currentAsset = ref<Asset | null>(null)

// 模拟数据 - 包含图片和视频
const assets = ref<Asset[]>([
  // 今天的图片
  {
    id: '1',
    name: '生成的图片1.jpg',
    type: 'image',
    url: 'https://picsum.photos/800/600?random=1',
    thumbnail: 'https://picsum.photos/300/200?random=1',
    size: 1024 * 500,
    createdAt: new Date('2025-01-12').getTime(),
    selected: false
  },
  {
    id: '2',
    name: '生成的图片2.jpg',
    type: 'image',
    url: 'https://picsum.photos/800/600?random=2',
    thumbnail: 'https://picsum.photos/300/200?random=2',
    size: 1024 * 600,
    createdAt: new Date('2025-01-12').getTime(),
    selected: false
  },
  {
    id: '3',
    name: '生成的视频1.mp4',
    type: 'video',
    url: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
    thumbnail: 'https://picsum.photos/300/200?random=3',
    size: 1024 * 1024 * 5,
    createdAt: new Date('2025-01-12').getTime(),
    selected: false
  },
  {
    id: '4',
    name: '生成的图片3.jpg',
    type: 'image',
    url: 'https://picsum.photos/800/600?random=4',
    thumbnail: 'https://picsum.photos/300/200?random=4',
    size: 1024 * 800,
    createdAt: new Date('2025-01-12').getTime(),
    selected: false
  },
  {
    id: '5',
    name: '生成的视频2.mp4',
    type: 'video',
    url: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_2mb.mp4',
    thumbnail: 'https://picsum.photos/300/200?random=5',
    size: 1024 * 1024 * 8,
    createdAt: new Date('2025-01-12').getTime(),
    selected: false
  },
  // 昨天的资产
  {
    id: '6',
    name: '生成的图片4.jpg',
    type: 'image',
    url: 'https://picsum.photos/800/600?random=6',
    thumbnail: 'https://picsum.photos/300/200?random=6',
    size: 1024 * 400,
    createdAt: new Date('2025-01-11').getTime(),
    selected: false
  },
  {
    id: '7',
    name: '生成的视频3.mp4',
    type: 'video',
    url: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_3mb.mp4',
    thumbnail: 'https://picsum.photos/300/200?random=7',
    size: 1024 * 1024 * 10,
    createdAt: new Date('2025-01-11').getTime(),
    selected: false
  },
  {
    id: '8',
    name: '生成的图片5.jpg',
    type: 'image',
    url: 'https://picsum.photos/800/600?random=8',
    thumbnail: 'https://picsum.photos/300/200?random=8',
    size: 1024 * 600,
    createdAt: new Date('2025-01-11').getTime(),
    selected: false
  },
  // 2024-12-15的资产
  {
    id: '9',
    name: '生成的图片6.jpg',
    type: 'image',
    url: 'https://picsum.photos/800/600?random=9',
    thumbnail: 'https://picsum.photos/300/200?random=9',
    size: 1024 * 700,
    createdAt: new Date('2024-12-15').getTime(),
    selected: false
  },
  {
    id: '10',
    name: '生成的视频4.mp4',
    type: 'video',
    url: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_4mb.mp4',
    thumbnail: 'https://picsum.photos/300/200?random=10',
    size: 1024 * 1024 * 12,
    createdAt: new Date('2024-12-15').getTime(),
    selected: false
  }
])

// 过滤后的资产
const filteredAssets = computed(() => {
  let filtered = assets.value.filter(asset => asset.type === activeTab.value)

  // 日期筛选
  if (dateRange.value) {
    const [start, end] = dateRange.value
    filtered = filtered.filter(asset => {
      const assetDate = new Date(asset.createdAt)
      return assetDate >= start && assetDate <= end
    })
  }

  return filtered
})

// 按日期分组
const groupedAssets = computed(() => {
  const groups: { [key: string]: Asset[] } = {}
  
  filteredAssets.value.forEach(asset => {
    const date = new Date(asset.createdAt)
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
  return assets.value.filter(asset => asset.selected && asset.type === activeTab.value).length
})

const hasSelectedItems = computed(() => selectedCount.value > 0)

// 切换tab
const switchTab = (tab: 'image' | 'video') => {
  activeTab.value = tab
  // 切换tab时清除所有选择状态
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

// 格式化文件大小
const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 处理资产点击事件
const handleAssetClick = (asset: Asset, dateGroup: DateGroup) => {
  if (hasSelectedItems.value) {
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
const toggleDateGroupSelection = (dateGroup: DateGroup) => {
  const newState = !dateGroup.allSelected
  dateGroup.assets.forEach(asset => {
    asset.selected = newState
  })
  updateDateGroupSelection(dateGroup)
}

// 更新日期组选择状态
const updateDateGroupSelection = (dateGroup: DateGroup) => {
  const selectedCount = dateGroup.assets.filter(a => a.selected).length
  dateGroup.allSelected = selectedCount === dateGroup.assets.length && dateGroup.assets.length > 0
  dateGroup.indeterminate = selectedCount > 0 && selectedCount < dateGroup.assets.length
}

// 预览资产
const previewAsset = (asset: Asset) => {
  currentAsset.value = asset
  previewVisible.value = true
}

// 下载当前预览的资产
const downloadCurrentAsset = () => {
  if (currentAsset.value) {
    const link = document.createElement('a')
    link.href = currentAsset.value.url
    link.download = currentAsset.value.name
    link.click()
    ElMessage.success('开始下载')
  }
}

// 删除当前预览的资产
const deleteCurrentAsset = async () => {
  if (!currentAsset.value) return
  
  try {
    await ElMessageBox.confirm(
      `确定要删除 "${currentAsset.value.name}" 吗？`,
      '确认删除',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    const index = assets.value.findIndex(a => a.id === currentAsset.value!.id)
    if (index > -1) {
      assets.value.splice(index, 1)
      ElMessage.success('删除成功')
      previewVisible.value = false
    }
  } catch {
    // 用户取消删除
  }
}

// 批量删除
const batchDelete = async () => {
  const selectedAssets = assets.value.filter(asset => asset.selected && asset.type === activeTab.value)
  
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
    
    // 删除选中的资产
    selectedAssets.forEach(asset => {
      const index = assets.value.findIndex(a => a.id === asset.id)
      if (index > -1) {
        assets.value.splice(index, 1)
      }
    })
    
    ElMessage.success(`成功删除 ${selectedAssets.length} 个${activeTab.value === 'image' ? '图片' : '视频'}`)
  } catch {
    // 用户取消删除
  }
}

// 批量下载
const batchDownload = () => {
  const selectedAssets = assets.value.filter(asset => asset.selected && asset.type === activeTab.value)
  
  if (selectedAssets.length === 0) {
    ElMessage.warning(`请先选择要下载的${activeTab.value === 'image' ? '图片' : '视频'}`)
    return
  }

  // 模拟批量下载
  selectedAssets.forEach((asset, index) => {
    setTimeout(() => {
      const link = document.createElement('a')
      link.href = asset.url
      link.download = asset.name
      link.click()
    }, index * 500) // 每个文件间隔500ms下载
  })
  
  ElMessage.success(`开始下载 ${selectedAssets.length} 个文件`)
}

// 日期范围变化处理
const onDateRangeChange = () => {
  // 清除所有选择状态
  assets.value.forEach(asset => {
    asset.selected = false
  })
}

// 监听日期范围和tab变化，清除选择状态
watch([dateRange, activeTab], () => {
  assets.value.forEach(asset => {
    asset.selected = false
  })
})
</script>

<style scoped>
.assets-container {
  padding: 0;
  background: #000;
  min-height: 100vh;
  color: #fff;
}

.assets-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: #000;
  border-bottom: 1px solid #333;
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

.batch-operations {
  display: flex;
  align-items: center;
  gap: 12px;
}

.batch-text {
  color: #409eff;
  font-size: 14px;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.batch-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.assets-content {
  padding: 24px;
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

/* 预览弹窗样式 */
.preview-dialog {
  --el-dialog-bg-color: #1a1a1a;
  --el-dialog-border-radius: 16px;
}

:deep(.preview-dialog .el-dialog) {
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8);
  border: 1px solid #333;
  max-height: 90vh;
  overflow: hidden;
}

:deep(.preview-dialog .el-dialog__header) {
  padding: 0;
  margin: 0;
  border-bottom: none;
  background: transparent;
}

:deep(.preview-dialog .el-dialog__body) {
  padding: 0;
  background: transparent;
  max-height: calc(90vh - 80px);
  overflow: hidden;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid #333;
}

.preview-title {
  flex: 1;
}

.asset-name {
  font-size: 18px;
  font-weight: 600;
  color: #fff;
  display: block;
  margin-bottom: 4px;
}

.asset-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #999;
}

.meta-item {
  color: #999;
}

.meta-divider {
  color: #666;
}

.preview-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.3s ease;
}

.close-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid #444;
  color: #fff;
  transition: all 0.3s ease;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: #666;
}

.asset-preview-content {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.preview-media {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #000;
  min-height: 400px;
  max-height: calc(90vh - 200px);
  overflow: hidden;
}

.preview-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: 8px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
}

.preview-video {
  max-width: 100%;
  max-height: 100%;
  border-radius: 8px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
}

.preview-footer {
  padding: 20px 24px;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(10px);
  border-top: 1px solid #333;
}

.asset-details {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detail-label {
  font-size: 12px;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 500;
}

.detail-value {
  font-size: 14px;
  color: #fff;
  font-weight: 500;
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
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  }
}
</style>