# 重新编辑功能测试示例

## 测试数据示例

### 示例1：图片生成记录

```javascript
const imageGenerationResult = {
  id: 12345,
  type: 1, // 图片生成
  status: 2, // 已完成
  createTime: '2024-01-15 10:30:00',
  prompt: '一只可爱的小猫坐在窗台上看风景',
  tags: [
    { id: 1, key: 'prompt', val: '一只可爱的小猫坐在窗台上看风景', name: '提示词' },
    { id: 2, key: 'aiDriver', val: 'flux-pro', name: 'AI模型' },
    { id: 3, key: 'aspectRatio', val: '16:9', name: '比例' },
    { id: 4, key: 'size', val: '4k', name: '分辨率' },
    { id: 5, key: 'genImageNum', val: '4', name: '图片张数' },
    { id: 6, key: 'images', val: 'ref_image_001.jpg', name: '参考图片1', type: 1 },
    { id: 7, key: 'images', val: 'ref_image_002.jpg', name: '参考图片2', type: 1 },
    { id: 8, key: 'images', val: 'ref_image_003.jpg', name: '参考图片3', type: 1 }
  ],
  assets: [
    {
      id: 101,
      type: 1,
      materialUrl: 'https://example.com/images/ref_image_001.jpg',
      coverUrl: 'https://example.com/images/ref_image_001_thumb.jpg'
    },
    {
      id: 102,
      type: 1,
      materialUrl: 'https://example.com/images/ref_image_002.jpg',
      coverUrl: 'https://example.com/images/ref_image_002_thumb.jpg'
    },
    {
      id: 103,
      type: 1,
      materialUrl: 'https://example.com/images/ref_image_003.jpg',
      coverUrl: 'https://example.com/images/ref_image_003_thumb.jpg'
    }
  ]
}
```

**预期结果：**
- ✅ 提示词填充："一只可爱的小猫坐在窗台上看风景"
- ✅ 生成模式：图片生成
- ✅ AI模型：flux-pro
- ✅ 比例：16:9
- ✅ 分辨率：4K
- ✅ 图片张数：4张
- ✅ **参考图片显示：3张图片显示在上传预览区域**

---

### 示例2：视频生成记录（首尾帧模式）

```javascript
const videoGenerationResult = {
  id: 67890,
  type: 2, // 视频生成
  status: 2, // 已完成
  createTime: '2024-01-15 11:00:00',
  prompt: '一个美丽的日出场景，从黑夜到白天的过渡',
  tags: [
    { id: 1, key: 'prompt', val: '一个美丽的日出场景，从黑夜到白天的过渡', name: '提示词' },
    { id: 2, key: 'aiDriver', val: 'runway-gen3', name: 'AI模型' },
    { id: 3, key: 'aspectRatio', val: '16:9', name: '比例' },
    { id: 4, key: 'resolution', val: '1080p', name: '分辨率' },
    { id: 5, key: 'duration', val: '5', name: '时长' },
    { id: 6, key: 'generateAudio', val: 'yes', name: '生成声音' },
    { id: 7, key: 'mode', val: 'pro', name: '生成模式' },
    { id: 8, key: 'imageFirst', val: 'first_frame_001.jpg', name: '首帧图', type: 1 },
    { id: 9, key: 'imageTail', val: 'last_frame_001.jpg', name: '尾帧图', type: 1 }
  ],
  assets: [
    {
      id: 201,
      type: 1,
      materialUrl: 'https://example.com/frames/first_frame_001.jpg',
      coverUrl: 'https://example.com/frames/first_frame_001_thumb.jpg'
    },
    {
      id: 202,
      type: 1,
      materialUrl: 'https://example.com/frames/last_frame_001.jpg',
      coverUrl: 'https://example.com/frames/last_frame_001_thumb.jpg'
    },
    {
      id: 203,
      type: 2,
      materialUrl: 'https://example.com/videos/generated_video_001.mp4',
      coverUrl: 'https://example.com/videos/generated_video_001_thumb.jpg'
    }
  ]
}
```

**预期结果：**
- ✅ 提示词填充："一个美丽的日出场景，从黑夜到白天的过渡"
- ✅ 生成模式：视频生成
- ✅ AI模型：runway-gen3
- ✅ 比例：16:9
- ✅ 分辨率：1080P
- ✅ 时长：5秒
- ✅ 生成声音：开启
- ✅ 生成模式：专家模式
- ✅ **首帧图显示：图片显示在首帧图上传框中**
- ✅ **尾帧图显示：图片显示在尾帧图上传框中**

---

### 示例3：视频生成记录（多模态参考模式）

```javascript
const videoMultimodalResult = {
  id: 11111,
  type: 2, // 视频生成
  status: 2, // 已完成
  createTime: '2024-01-15 12:00:00',
  prompt: '根据参考视频和图片生成一个相似风格的新视频',
  tags: [
    { id: 1, key: 'prompt', val: '根据参考视频和图片生成一个相似风格的新视频', name: '提示词' },
    { id: 2, key: 'aiDriver', val: 'keling-v1.6', name: 'AI模型' },
    { id: 3, key: 'aspectRatio', val: '9:16', name: '比例' },
    { id: 4, key: 'resolution', val: '720p', name: '分辨率' },
    { id: 5, key: 'duration', val: '10', name: '时长' },
    { id: 6, key: 'referType', val: 'multimodal', name: '参考类型' },
    { id: 7, key: 'uploadVideo', val: 'reference_video_001.mp4', name: '参考视频', type: 2 },
    { id: 8, key: 'images', val: 'ref_img_001.jpg', name: '参考图片1', type: 1 },
    { id: 9, key: 'images', val: 'ref_img_002.jpg', name: '参考图片2', type: 1 },
    { id: 10, key: 'images', val: 'ref_img_003.jpg', name: '参考图片3', type: 1 }
  ],
  assets: [
    {
      id: 301,
      type: 2,
      materialUrl: 'https://example.com/videos/reference_video_001.mp4',
      coverUrl: 'https://example.com/videos/reference_video_001_thumb.jpg'
    },
    {
      id: 302,
      type: 1,
      materialUrl: 'https://example.com/images/ref_img_001.jpg',
      coverUrl: 'https://example.com/images/ref_img_001_thumb.jpg'
    },
    {
      id: 303,
      type: 1,
      materialUrl: 'https://example.com/images/ref_img_002.jpg',
      coverUrl: 'https://example.com/images/ref_img_002_thumb.jpg'
    },
    {
      id: 304,
      type: 1,
      materialUrl: 'https://example.com/images/ref_img_003.jpg',
      coverUrl: 'https://example.com/images/ref_img_003_thumb.jpg'
    },
    {
      id: 305,
      type: 2,
      materialUrl: 'https://example.com/videos/generated_video_002.mp4',
      coverUrl: 'https://example.com/videos/generated_video_002_thumb.jpg'
    }
  ]
}
```

**预期结果：**
- ✅ 提示词填充："根据参考视频和图片生成一个相似风格的新视频"
- ✅ 生成模式：视频生成
- ✅ AI模型：可灵1.6
- ✅ 比例：9:16
- ✅ 分辨率：720P
- ✅ 时长：10秒
- ✅ 参考类型：多模态参考
- ✅ **参考视频显示：视频显示在视频上传框中**
- ✅ **参考图片显示：3张图片显示在缩略图预览区域**

---

## 测试步骤

### 1. 准备测试环境
```bash
cd mobgiai-admin
npm run dev
```

### 2. 打开浏览器控制台
按 F12 打开开发者工具，切换到 Console 标签页

### 3. 执行测试

#### 测试图片生成
1. 在历史记录中找到一个图片生成记录
2. 点击"重新编辑"按钮
3. 观察控制台输出：
   ```
   开始恢复参考图片: { imageTags: [...], imageAssets: [...] }
   参考图片1已恢复: https://...
   参考图片2已恢复: https://...
   参考图片3已恢复: https://...
   图片生成参数已恢复: { referenceImages: [...] }
   ```
4. 检查页面：
   - ✅ 提示词是否正确填充
   - ✅ 下拉框是否选中正确的选项
   - ✅ **参考图片是否显示在上传预览区域**
   - ✅ 图片数量是否正确（如：参考图片 (3/5)）

#### 测试视频生成（首尾帧）
1. 在历史记录中找到一个首尾帧视频生成记录
2. 点击"重新编辑"按钮
3. 观察控制台输出：
   ```
   首帧图已恢复: https://...
   尾帧图已恢复: https://...
   视频生成参数已恢复: { firstFrame: ..., lastFrame: ..., ... }
   ```
4. 检查页面：
   - ✅ 提示词是否正确填充
   - ✅ 下拉框是否选中正确的选项
   - ✅ **首帧图是否显示在首帧图上传框中**
   - ✅ **尾帧图是否显示在尾帧图上传框中**
   - ✅ 可以点击交换按钮交换首尾帧

#### 测试视频生成（多模态）
1. 在历史记录中找到一个多模态视频生成记录
2. 点击"重新编辑"按钮
3. 观察控制台输出：
   ```
   参考视频已恢复: https://...
   参考图片1已恢复: https://...
   参考图片2已恢复: https://...
   参考图片3已恢复: https://...
   视频生成参数已恢复: { video: ..., referenceImages: [...] }
   ```
4. 检查页面：
   - ✅ 提示词是否正确填充
   - ✅ 下拉框是否选中正确的选项
   - ✅ **参考视频是否显示在视频上传框中**
   - ✅ **参考图片是否显示在缩略图预览区域**
   - ✅ 图片数量是否正确（如：3/4）
   - ✅ 可以点击图片预览大图
   - ✅ 可以删除单张图片

### 4. 测试重新生成
1. 修改提示词或参数
2. 点击"生成"按钮
3. 验证请求参数是否包含：
   - 正确的 uploadFileName（val 字段）
   - 正确的参数配置

---

## 常见问题排查

### 问题1：图片/视频没有显示
**可能原因：**
- tags 中的 val（文件名）与 assets 中的 URL 不匹配
- assets 数组为空或缺少对应的资源

**排查方法：**
```javascript
// 在控制台执行
console.log('Tags:', result.tags)
console.log('Assets:', result.assets)
```

**解决方案：**
- 检查文件名匹配逻辑
- 确保 assets 数组包含正确的资源

### 问题2：下拉框选项没有选中
**可能原因：**
- 模型配置还未加载完成
- 选项值不匹配

**排查方法：**
```javascript
// 在控制台执行
console.log('当前模型:', currentModel.value)
console.log('可用选项:', imageSizes.value)
```

**解决方案：**
- 确保 `await fetchModelConfig()` 执行完成
- 检查选项值的格式是否一致

### 问题3：参考图片顺序错乱
**可能原因：**
- 文件名匹配算法匹配到错误的资源
- 索引对应关系不正确

**排查方法：**
```javascript
// 查看匹配过程
console.log('Image Tags:', imageTags)
console.log('Image Assets:', imageAssets)
console.log('Matched Results:', referenceImages.value)
```

**解决方案：**
- 优化文件名匹配算法
- 使用更精确的匹配规则

---

## 性能优化建议

1. **缓存模型配置**：避免重复加载相同模型的配置
2. **懒加载资源**：只在需要时加载图片/视频预览
3. **防抖处理**：避免快速点击导致重复加载
4. **错误处理**：添加 try-catch 捕获异常情况

---

## 后续改进方向

1. **支持拖拽排序**：允许用户调整参考图片的顺序
2. **批量编辑**：支持同时编辑多个历史记录
3. **模板保存**：将常用配置保存为模板
4. **智能推荐**：根据历史记录推荐相似的参数配置
