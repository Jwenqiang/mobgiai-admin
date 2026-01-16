# 视频上传进度功能说明

## 功能概述
为视频上传添加了实时进度显示功能，用户可以看到上传百分比和加载动画。

## 修改的文件

### 1. `src/services/tos.js`
- 修改 `uploadBigVideoToTOS` 函数签名，添加 `onProgress` 回调参数
- 在上传进度回调中调用 `onProgress` 函数，传递进度值（0-1）

### 2. `src/views/ImageGenerateView.vue`

#### 响应式变量（约第1940行）
```javascript
const videoUploadProgress = ref(0) // 视频上传进度 0-100
const isVideoUploading = ref(false) // 视频是否正在上传
```

#### 上传处理函数（约第2137行）
- 在上传开始时设置 `isVideoUploading = true` 和 `videoUploadProgress = 0`
- 调用 `uploadBigVideoToTOS` 时传递进度回调函数
- 在回调中更新 `videoUploadProgress` 的值
- 上传完成或失败后重置状态

#### UI 模板修改
在两个视频上传区域添加了进度显示：

1. **居中输入区域**（约第135-160行）
   - 添加 `:disabled="isVideoUploading"` 禁用上传按钮
   - 添加 `uploading` class 状态
   - 使用 `el-progress` 组件显示圆形进度条
   - 显示百分比和提示文字

2. **有内容时的输入区域**（约第1020-1050行）
   - 相同的进度显示逻辑
   - 使用 compact 样式适配较小的尺寸

#### 样式（约第3635行）
```css
.upload-area-video.uploading { /* 上传中状态样式 */ }
.upload-progress-overlay { /* 进度覆盖层 */ }
.progress-text { /* 百分比文字 */ }
.progress-tip { /* 提示文字 */ }
```

## 使用效果

1. **上传前**：显示视频图标占位符
2. **上传中**：
   - 显示圆形进度条
   - 实时更新百分比（0% - 100%）
   - 显示"视频上传中..."提示
   - 禁用上传按钮防止重复上传
3. **上传完成**：显示上传的视频预览

## 技术细节

- 使用 Element Plus 的 `el-progress` 组件
- 进度值从 TOS SDK 的 `progress` 回调获取（0-1），转换为百分比（0-100）
- 支持大文件分片上传（5MB/片）
- 优雅的加载动画和过渡效果
