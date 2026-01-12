<template>
  <div class="assets-container">
    <div class="assets-header">
      <h2>我的资产</h2>
      <div class="assets-stats">
        <div class="stat-item">
          <span class="stat-number">{{ totalAssets }}</span>
          <span class="stat-label">总资产</span>
        </div>
        <div class="stat-item">
          <span class="stat-number">{{ imageCount }}</span>
          <span class="stat-label">图片</span>
        </div>
        <div class="stat-item">
          <span class="stat-number">{{ videoCount }}</span>
          <span class="stat-label">视频</span>
        </div>
      </div>
    </div>

    <div class="assets-toolbar">
      <div class="toolbar-left">
        <el-select v-model="filterType" placeholder="全部类型" style="width: 120px">
          <el-option label="全部类型" value="all" />
          <el-option label="图片" value="image" />
          <el-option label="视频" value="video" />
        </el-select>
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          style="width: 240px"
        />
      </div>
      <div class="toolbar-right">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索资产..."
          style="width: 200px"
          clearable
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-button type="primary" @click="uploadAsset">
          <el-icon><Upload /></el-icon>
          上传资产
        </el-button>
      </div>
    </div>

    <div class="assets-grid">
      <div 
        v-for="asset in filteredAssets" 
        :key="asset.id"
        class="asset-card"
        @click="previewAsset(asset)"
      >
        <div class="asset-preview">
          <img 
            v-if="asset.type === 'image'" 
            :src="asset.thumbnail" 
            :alt="asset.name"
            class="asset-thumbnail"
          />
          <div v-else-if="asset.type === 'video'" class="video-thumbnail">
            <video :src="asset.url" class="asset-thumbnail" />
            <div class="video-overlay">
              <el-icon size="24"><VideoPlay /></el-icon>
            </div>
          </div>
        </div>
        
        <div class="asset-info">
          <div class="asset-name">{{ asset.name }}</div>
          <div class="asset-meta">
            <span class="asset-size">{{ formatFileSize(asset.size) }}</span>
            <span class="asset-date">{{ formatTime(asset.createdAt) }}</span>
          </div>
        </div>
        
        <div class="asset-actions">
          <el-button type="text" size="small" @click.stop="downloadAsset(asset)">
            <el-icon><Download /></el-icon>
          </el-button>
          <el-button type="text" size="small" @click.stop="deleteAsset(asset)">
            <el-icon><Delete /></el-icon>
          </el-button>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-if="filteredAssets.length === 0" class="empty-state">
      <el-icon size="60" color="#ccc"><FolderOpened /></el-icon>
      <p>暂无资产</p>
      <el-button type="primary" @click="uploadAsset">上传第一个资产</el-button>
    </div>

    <!-- 预览对话框 -->
    <el-dialog v-model="previewVisible" title="资产预览" width="60%" center>
      <div v-if="currentAsset" class="asset-preview-dialog">
        <img 
          v-if="currentAsset.type === 'image'" 
          :src="currentAsset.url" 
          style="width: 100%; max-height: 500px; object-fit: contain;"
        />
        <video 
          v-else-if="currentAsset.type === 'video'"
          :src="currentAsset.url"
          controls
          style="width: 100%; max-height: 500px;"
        />
        <div class="preview-info">
          <h3>{{ currentAsset.name }}</h3>
          <p>大小: {{ formatFileSize(currentAsset.size) }}</p>
          <p>创建时间: {{ new Date(currentAsset.createdAt).toLocaleString() }}</p>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Search, Upload, Download, Delete, VideoPlay, FolderOpened
} from '@element-plus/icons-vue'
import { formatFileSize, formatTime } from '../utils'

interface Asset {
  id: string
  name: string
  type: 'image' | 'video'
  url: string
  thumbnail: string
  size: number
  createdAt: number
}

const filterType = ref('all')
const dateRange = ref<[Date, Date] | null>(null)
const searchKeyword = ref('')
const previewVisible = ref(false)
const currentAsset = ref<Asset | null>(null)

// 模拟数据
const assets = ref<Asset[]>([
  {
    id: '1',
    name: '生成的图片1.jpg',
    type: 'image',
    url: 'https://picsum.photos/400/300?random=1',
    thumbnail: 'https://picsum.photos/200/150?random=1',
    size: 1024 * 500,
    createdAt: Date.now() - 1000 * 60 * 30
  },
  {
    id: '2',
    name: '生成的视频1.mp4',
    type: 'video',
    url: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
    thumbnail: 'https://picsum.photos/200/150?random=2',
    size: 1024 * 1024 * 5,
    createdAt: Date.now() - 1000 * 60 * 60
  },
  {
    id: '3',
    name: '生成的图片2.jpg',
    type: 'image',
    url: 'https://picsum.photos/400/300?random=3',
    thumbnail: 'https://picsum.photos/200/150?random=3',
    size: 1024 * 800,
    createdAt: Date.now() - 1000 * 60 * 60 * 2
  }
])

const totalAssets = computed(() => assets.value.length)
const imageCount = computed(() => assets.value.filter(a => a.type === 'image').length)
const videoCount = computed(() => assets.value.filter(a => a.type === 'video').length)

const filteredAssets = computed(() => {
  let filtered = assets.value

  // 类型筛选
  if (filterType.value !== 'all') {
    filtered = filtered.filter(asset => asset.type === filterType.value)
  }

  // 关键词搜索
  if (searchKeyword.value) {
    filtered = filtered.filter(asset => 
      asset.name.toLowerCase().includes(searchKeyword.value.toLowerCase())
    )
  }

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

const uploadAsset = () => {
  ElMessage.info('上传功能开发中...')
}

const previewAsset = (asset: Asset) => {
  currentAsset.value = asset
  previewVisible.value = true
}

const downloadAsset = (asset: Asset) => {
  // 创建下载链接
  const link = document.createElement('a')
  link.href = asset.url
  link.download = asset.name
  link.click()
  ElMessage.success('开始下载')
}

const deleteAsset = async (asset: Asset) => {
  try {
    await ElMessageBox.confirm(`确定要删除 "${asset.name}" 吗？`, '确认删除', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    const index = assets.value.findIndex(a => a.id === asset.id)
    if (index > -1) {
      assets.value.splice(index, 1)
      ElMessage.success('删除成功')
    }
  } catch {
    // 用户取消删除
  }
}
</script>

<style scoped>
.assets-container {
  padding: 24px 40px;
  background: #f5f7fa;
  min-height: 100vh;
  width: 100%;
  min-width: 768px;
}

.assets-header {
  margin-bottom: 24px;
}

.assets-header h2 {
  margin: 0 0 16px 0;
  font-size: 24px;
  font-weight: 600;
  color: #333;
}

.assets-stats {
  display: flex;
  gap: 24px;
}

.stat-item {
  background: white;
  padding: 16px 20px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  text-align: center;
  min-width: 100px;
}

.stat-number {
  display: block;
  font-size: 24px;
  font-weight: 600;
  color: #4A90E2;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: #666;
}

.assets-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding: 16px 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.toolbar-left {
  display: flex;
  gap: 16px;
  align-items: center;
}

.toolbar-right {
  display: flex;
  gap: 12px;
  align-items: center;
}

.assets-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 20px;
  width: 100%;
}

.asset-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  cursor: pointer;
  position: relative;
}

.asset-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.asset-preview {
  position: relative;
  width: 100%;
  height: 160px;
  overflow: hidden;
}

.asset-thumbnail {
  width: 100%;
  height: 100%;
  object-fit: cover;
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

.asset-info {
  padding: 12px 16px;
}

.asset-name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.asset-meta {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #666;
}

.asset-actions {
  position: absolute;
  top: 8px;
  right: 8px;
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.asset-card:hover .asset-actions {
  opacity: 1;
}

.asset-actions .el-button {
  background: rgba(255, 255, 255, 0.9);
  border: none;
  border-radius: 6px;
  width: 32px;
  height: 32px;
  padding: 0;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #666;
}

.empty-state p {
  margin: 16px 0 24px 0;
  font-size: 16px;
}

.asset-preview-dialog {
  text-align: center;
}

.preview-info {
  margin-top: 20px;
  text-align: left;
}

.preview-info h3 {
  margin: 0 0 12px 0;
  font-size: 18px;
  color: #333;
}

.preview-info p {
  margin: 8px 0;
  color: #666;
}

@media (max-width: 768px) {
  .assets-container {
    min-width: 768px;
    padding: 16px 20px;
    overflow-x: auto;
  }
  
  .assets-toolbar {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }
  
  .toolbar-left,
  .toolbar-right {
    justify-content: center;
  }
  
  .assets-grid {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 16px;
  }
  
  .assets-stats {
    flex-wrap: wrap;
    gap: 12px;
  }
}

@media (min-width: 769px) and (max-width: 1024px) {
  .assets-container {
    padding: 24px 30px;
  }
  
  .assets-grid {
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  }
}

@media (min-width: 1025px) {
  .assets-container {
    padding: 24px 40px;
  }
  
  .assets-grid {
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  }
}
</style>