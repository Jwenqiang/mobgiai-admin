# 重新编辑功能实现说明

## 功能概述
实现了结果项点击"重新编辑"按钮时，自动填充生成器、图片、视频及下拉框的数据和选中状态，并在生成器的相应框中显示上传的图片和视频。

## 实现的功能

### 1. 基础信息填充
- ✅ 填充提示词（prompt）
- ✅ 设置生成模式（图片生成/视频生成）
- ✅ 设置AI模型（根据 aiDriver 查找并选中）

### 2. 图片生成参数填充（type === 1）
- ✅ 比例（aspectRatio）：从 imageSizes 中查找并选中
- ✅ 分辨率（size）：从 resolutions 中查找并选中（2K/4K）
- ✅ 图片张数（genImageNum）：从 imageCounts 中查找并选中
- ✅ **参考图片显示**：从 tags 中提取 images 标签，结合 assets 恢复图片预览，显示在上传框中

### 3. 视频生成参数填充（type === 2）
- ✅ 比例（aspectRatio）：设置 selectedRatio
- ✅ 分辨率（resolution）：设置 selectedQuality
- ✅ 时长（duration）：设置 selectedDuration
- ✅ 生成声音（generateAudio）：设置 enableAudio
- ✅ 生成模式（mode）：设置 generationMode（标准/专家）
- ✅ 保留原声（keepOriginalSound）：设置 keepOriginalAudio
- ✅ 可灵参考类型（referType）：从 keLingOptions 中查找并选中

### 4. 视频上传内容显示 ⭐
- ✅ **首帧图显示**：恢复 firstFrameImage 和 firstFrameImageVal，图片显示在首帧图上传框中
- ✅ **尾帧图显示**：恢复 lastFrameImage 和 lastFrameImageVal，图片显示在尾帧图上传框中
- ✅ **参考视频显示**：恢复 referenceVideo 和 referenceVideoVal，视频显示在视频上传框中
- ✅ **参考图片显示**：恢复 videoReferenceImages 和 videoReferenceImagesVal（最多4张），图片显示在多模态参考图片区域

## 技术实现细节

### 数据结构
```typescript
interface Tag {
  id: number
  name: string
  key: string
  val: string
  type?: number // 1=图片, 2=视频
}

interface Asset {
  id: number
  type: number // 1=图片, 2=视频
  materialUrl: string // 实际资源URL
  coverUrl: string // 封面/缩略图URL
}

interface HistoryResult {
  id: number
  type: number // 1: 图片, 2: 视频
  status: number
  createTime: string
  assets: Asset[]
  tags: Tag[]
  prompt?: string
}
```

### 核心逻辑

#### 1. 异步加载模型配置
```typescript
// 先调用 fetchModelConfig(aiDriver) 加载对应模型的配置
await fetchModelConfig(aiDriverTag)
// 确保下拉选项（如比例、分辨率等）已正确加载
// 然后再设置当前选中的模型
```

#### 2. 智能资源匹配算法
为了确保图片和视频能正确显示在对应的框中，实现了智能匹配算法：

**文件名匹配**：
```typescript
const matchingAsset = imageAssets.find(asset => {
  const assetFileName = asset.materialUrl?.split('/').pop()?.split('?')[0] || ''
  return assetFileName.includes(imgTag.val) || imgTag.val.includes(assetFileName)
})
```

**避免重复使用**：
```typescript
const usedAssetUrls = new Set<string>()
// 标记已使用的资源
if (firstFrameImage.value) usedAssetUrls.add(firstFrameImage.value)
if (lastFrameImage.value) usedAssetUrls.add(lastFrameImage.value)
// 查找时排除已使用的资源
const isNotUsed = !usedAssetUrls.has(assetUrl)
```

**索引回退匹配**：
```typescript
// 如果文件名匹配失败，使用索引匹配作为回退方案
if (!matchingAsset && imageAssets[index]) {
  matchingAsset = imageAssets[index]
}
```

#### 3. 图片生成模式的参考图片恢复
```typescript
// 1. 从 tags 中提取所有 images 标签
const imageTags = result.tags?.filter(t => t.key === 'images' && t.type === 1)

// 2. 从 assets 中获取所有图片资源
const imageAssets = result.assets?.filter(a => a.type === 1)

// 3. 通过文件名或索引匹配，恢复每张图片
imageTags.forEach((imgTag, index) => {
  // 智能匹配资源
  const matchingAsset = findMatchingAsset(imgTag, imageAssets, index)
  
  // 创建 UploadFile 对象
  referenceImages.value.push({
    uid: uniqueId,
    name: imgTag.val,
    url: matchingAsset.coverUrl || matchingAsset.materialUrl,
    raw: temporaryFile,
    val: imgTag.val // 保存 uploadFileName 用于提交
  })
})
```

#### 4. 视频生成模式的资源恢复
```typescript
// 分离图片和视频资源
const imageAssets = result.assets?.filter(a => a.type === 1) || []
const videoAssets = result.assets?.filter(a => a.type === 2) || []

// 首帧图恢复
if (imageFirstTag) {
  firstFrameImageVal.value = imageFirstTag.val // 文件名
  firstFrameImage.value = matchingAsset.coverUrl // 显示URL
}

// 尾帧图恢复（排除首帧图）
if (imageTailTag) {
  lastFrameImageVal.value = imageTailTag.val
  lastFrameImage.value = matchingAsset.coverUrl // 不同于首帧的资源
}

// 参考视频恢复
if (uploadVideoTag) {
  referenceVideoVal.value = uploadVideoTag.val
  referenceVideo.value = videoAsset.materialUrl
}

// 多模态参考图片恢复（最多4张，排除首尾帧）
videoImageTags.forEach((imgTag, index) => {
  if (index < 4) {
    videoReferenceImagesVal.value[index] = imgTag.val
    videoReferenceImages.value[index] = matchingAsset.coverUrl
  }
})
```

#### 5. 用户体验优化
```typescript
// 1. 添加控制台日志，便于调试
console.log('首帧图已恢复:', firstFrameImage.value)
console.log('参考图片已恢复:', referenceImages.value.map(img => img.url))

// 2. 填充完成后自动滚动到页面顶部
setTimeout(() => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}, 100)

// 3. 显示成功提示消息
ElMessage.success('已加载历史记录，可以重新编辑')
```

## 显示效果

### 图片生成模式
- 参考图片显示在页面顶部的预览列表中
- 每张图片都有删除按钮
- 点击图片可以预览大图
- 显示图片数量（如：参考图片 (3/5)）

### 视频生成模式

#### 首尾帧模式
```
[首帧图框] ⇄ [尾帧图框]
   ↓           ↓
 显示图片    显示图片
```

#### 多模态参考模式
```
[视频上传框]  [图片上传框 + 缩略图预览]
     ↓              ↓
  显示视频      显示1-4张图片
```

#### 编辑视频模式
```
[视频上传框]  [图片上传框 + 缩略图预览]
     ↓              ↓
  显示视频      显示1-4张图片
```

## 使用方法

用户点击历史记录卡片底部的"重新编辑"按钮：
```vue
<el-button class="action-button edit-button" @click="editGeneration(result)">
  <el-icon class="button-icon"><Edit /></el-icon>
  <span>重新编辑</span>
</el-button>
```

系统会自动：
1. ✅ 填充所有生成参数
2. ✅ **恢复上传的图片/视频并显示在对应的上传框中**
3. ✅ 选中对应的下拉选项
4. ✅ 滚动到输入区域
5. ✅ 用户可以看到之前上传的内容，修改后重新生成

## 注意事项

1. **模型配置加载**：必须先加载模型配置，否则下拉选项可能为空
2. **资源匹配策略**：
   - 优先使用文件名匹配（更准确）
   - 文件名匹配失败时使用索引匹配（回退方案）
   - 避免重复使用同一资源
3. **类型区分**：通过 `type` 字段区分图片（1）和视频（2）资源
4. **可选参数**：某些参数可能不存在，需要做好空值判断
5. **URL 处理**：
   - `materialUrl`：实际的资源URL（用于下载、播放）
   - `coverUrl`：封面/缩略图URL（用于预览显示）
   - 优先使用 `coverUrl`，不存在时使用 `materialUrl`

## 测试建议

### 1. 图片生成的重新编辑
- ✅ 验证比例、分辨率、张数是否正确选中
- ✅ **验证参考图片是否正确显示在上传预览区域**
- ✅ 验证图片可以点击预览
- ✅ 验证图片可以删除

### 2. 视频生成的重新编辑

#### 首尾帧模式
- ✅ **验证首帧图是否显示在首帧图上传框中**
- ✅ **验证尾帧图是否显示在尾帧图上传框中**
- ✅ 验证可以交换首尾帧
- ✅ 验证可以重新上传替换

#### 多模态参考模式
- ✅ **验证参考视频是否显示在视频上传框中**
- ✅ **验证参考图片是否显示在缩略图预览区域（最多4张）**
- ✅ 验证视频可以播放预览
- ✅ 验证图片可以点击预览
- ✅ 验证可以删除单张图片

#### 编辑视频模式
- ✅ **验证原视频是否显示在视频上传框中**
- ✅ **验证参考图片是否显示在缩略图预览区域**
- ✅ 验证所有参数是否正确

### 3. 不同模型的切换
- ✅ 验证模型配置是否正确加载
- ✅ 验证下拉选项是否正确更新
- ✅ 验证可灵模型的特殊选项是否正确

### 4. 边界情况
- ✅ 缺少某些参数的历史记录
- ✅ 没有上传图片/视频的记录
- ✅ 只有首帧图没有尾帧图
- ✅ 只有尾帧图没有首帧图
- ✅ 参考图片数量不足4张
- ✅ 不同状态的记录（排队中、生成中、失败）

## 调试信息

代码中添加了详细的控制台日志，便于调试：

```javascript
console.log('开始恢复参考图片:', { imageTags, imageAssets })
console.log('参考图片1已恢复:', imageUrl)
console.log('首帧图已恢复:', firstFrameImage.value)
console.log('尾帧图已恢复:', lastFrameImage.value)
console.log('参考视频已恢复:', referenceVideo.value)
console.log('视频生成参数已恢复:', { ... })
```

打开浏览器控制台可以查看详细的恢复过程。

