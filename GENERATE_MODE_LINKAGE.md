# 生成方式与模型联动功能

## 功能概述

实现了生成器底部下拉框的联动功能，当用户选择不同的生成方式时，模型选择器会自动切换到对应的模型列表。

## 实现详情

### 生成方式选项
- **图片生成**：专门用于图片内容生成
- **视频生成**：专门用于视频内容生成

### 模型配置

#### 图片生成模型
- **Seedream 4.5**：最新版本，画质更佳
- **Seedream 4.0**：稳定版本，效果出色  
- **可灵 O1**：支持自然语言描述，图片生成专用
- **可灵 2.0**：经典版本，稳定可靠

#### 视频生成模型
- **Seedance 1.5 Pro**：高质量视频，全新体验
- **Seedance 1.0 Pro**：效果稳定，超清画质
- **可灵 O1**：支持自然语言描述，视频图片多模态
- **可灵 2.6**：高质量生成，智能更新

## 联动逻辑

1. **默认状态**：页面加载时默认选择"图片生成"模式，显示图片生成模型列表
2. **模式切换**：当用户选择不同的生成方式时：
   - 自动切换到对应的模型列表
   - 如果当前选择的模型不在新模式的模型列表中，自动选择该模式的第一个模型
   - 保持其他参数设置不变

## 技术实现

### 数据结构
```typescript
// 图片生成模型
const imageModels = ref<Model[]>([...])

// 视频生成模型  
const videoModels = ref<Model[]>([...])

// 当前可用模型列表（动态变化）
const models = ref<Model[]>(imageModels.value)
```

### 联动方法
```typescript
const selectGenerateMode = (mode: { value: string; label: string }) => {
  currentGenerateMode.value = mode
  
  // 根据生成方式切换可用的模型列表
  if (mode.value === 'image') {
    models.value = imageModels.value
    // 智能切换当前选择的模型
    const currentModelExists = imageModels.value.find(model => model.id === currentModel.value.id)
    if (!currentModelExists) {
      currentModel.value = imageModels.value[0]
    }
  } else if (mode.value === 'video') {
    models.value = videoModels.value
    // 智能切换当前选择的模型
    const currentModelExists = videoModels.value.find(model => model.id === currentModel.value.id)
    if (!currentModelExists) {
      currentModel.value = videoModels.value[0]
    }
  }
  
  // 关闭弹出框
  generateModePopoverRef.value?.hide()
  panelGenerateModePopoverRef.value?.hide()
}
```

## 用户体验

- **无缝切换**：模式切换时界面流畅，无闪烁
- **智能选择**：自动选择合适的默认模型
- **状态保持**：其他参数设置在模式切换时保持不变
- **视觉反馈**：清晰的图标和文字提示当前选择的模式

## 测试

可以通过访问 `test-generate-mode-linkage.html` 文件来测试联动功能的基本逻辑。

## 注意事项

1. 模型列表的切换是响应式的，会立即反映在UI上
2. 联动逻辑确保用户始终有一个有效的模型选择
3. 模式切换时会自动关闭相关的弹出框，提供更好的用户体验