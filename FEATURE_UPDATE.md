# 功能更新说明

## 预览对话框功能统一

### 更新内容
统一了预览对话框和列表视频的"重新编辑"和"再次生成"功能，使它们使用相同的参数恢复逻辑。

### 修改的函数

#### 1. `handleVideoReEdit()` - 重新编辑功能
- **位置**: `mobgiai-admin/src/views/ImageGenerateView.vue` (约第4108行)
- **改进**:
  - 优先使用 `previewMetadata.value` 中存储的完整结果数据
  - 调用统一的 `editGeneration()` 函数来恢复所有参数
  - 包括：提示词、模型、比例、分辨率、时长、生成声音、生成模式、保留原声、可灵参考类型、首尾帧图、参考视频、参考图片等
  - 如果没有完整数据，则使用简化逻辑（仅恢复提示词）

#### 2. `handleVideoRegenerate()` - 再次生成功能
- **位置**: `mobgiai-admin/src/views/ImageGenerateView.vue` (约第4175行)
- **改进**:
  - 优先使用 `previewMetadata.value` 中存储的完整结果数据
  - 调用统一的 `regenerateFromHistory()` 函数来直接重新生成
  - 使用 `postAIGenerateRetry` API 接口，传入原始的 `userInputId`
  - 如果没有完整数据，则提示用户从历史记录中重新生成

### 技术细节

#### 数据流
1. 用户点击视频预览 → `previewVideo()` 函数被调用
2. `previewVideo()` 将完整的 `HistoryResult` 数据存储到 `previewMetadata.value`
3. 用户点击"重新编辑"或"再次生成" → 调用对应的处理函数
4. 处理函数检查 `previewMetadata.value` 是否存在
5. 如果存在，调用统一的 `editGeneration()` 或 `regenerateFromHistory()` 函数
6. 这些函数会恢复所有生成参数，包括上传的图片和视频

#### 关键变量
- `previewMetadata`: 存储当前预览视频的完整历史记录数据
- `previewPrompt`: 存储当前预览视频的提示词
- `previewVideoUrl`: 存储当前预览视频的URL
- `previewVideoData`: 存储当前预览视频的基本信息

### 用户体验改进
1. **参数完整性**: 现在预览对话框的重新编辑和再次生成功能会恢复所有原始参数，包括上传的图片和视频
2. **功能一致性**: 预览对话框和列表视频的功能行为完全一致
3. **操作便捷性**: 用户可以从任何位置（预览对话框或历史列表）快速重新编辑或再次生成内容

### 测试建议
1. 测试从预览对话框点击"重新编辑"，验证所有参数是否正确恢复
2. 测试从预览对话框点击"再次生成"，验证是否能正确调用API并生成新内容
3. 测试不同类型的视频（首尾帧、多模态参考、视频编辑等），确保参数恢复正确
4. 测试图片生成的重新编辑和再次生成功能（如果适用）

### 构建状态
✅ 构建成功 (2025-01-29)
