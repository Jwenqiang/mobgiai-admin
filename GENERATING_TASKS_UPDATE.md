# 多任务生成状态优化

## 更新内容

优化了多任务生成状态的显示方式，现在生成任务会直接插入到结果列表的头部，生成完成后自动移除。

## 主要修改

### 1. 布局调整

#### 之前的布局
```
┌─────────────────────────┐
│  多任务生成中状态区域    │  ← 独立的容器
│  (generating-tasks)     │
└─────────────────────────┘
┌─────────────────────────┐
│  历史结果列表           │
│  (results-display)      │
└─────────────────────────┘
```

#### 现在的布局
```
┌─────────────────────────┐
│  results-display        │
│  ┌───────────────────┐  │
│  │ 生成中任务 1      │  │ ← 插入到列表头部
│  └───────────────────┘  │
│  ┌───────────────────┐  │
│  │ 生成中任务 2      │  │
│  └───────────────────┘  │
│  ┌───────────────────┐  │
│  │ 历史结果 1        │  │ ← 往下推移
│  └───────────────────┘  │
│  ┌───────────────────┐  │
│  │ 历史结果 2        │  │
│  └───────────────────┘  │
└─────────────────────────┘
```

### 2. 模板修改

#### 结果展示区域
- 移除了独立的 `generating-tasks` 容器
- 生成中的任务直接在 `results-display` 中渲染
- 使用 `v-for` 遍历 `generationTasks`，显示在历史结果之前

#### 生成中卡片
- 添加 `.generating` class 标识
- 显示进度条和状态文本
- 根据生成模式显示对应图标（图片/视频）
- 显示生成中的占位符动画

### 3. 逻辑修改

#### 任务完成处理
```javascript
// 之前：3秒后移除
setTimeout(() => {
  generationTasks.value.splice(index, 1)
}, 3000)

// 现在：立即移除并刷新列表
const index = generationTasks.value.findIndex(t => t.id === taskId)
if (index > -1) {
  generationTasks.value.splice(index, 1)
}
await fetchGenerateResults(1, false)
```

#### 任务失败处理
- 失败的任务也立即从列表中移除
- 不再等待3秒延迟

### 4. 样式优化

#### 生成中卡片样式
```css
.generation-card.generating {
  border-bottom: 1px solid rgba(74, 144, 226, 0.2); /* 蓝色边框 */
  animation: slideInFromTop 0.4s ease-out; /* 滑入动画 */
}
```

#### 动画效果
- **slideInFromTop**: 从上方滑入的动画
- **shimmer**: 缩略图的闪烁效果
- **pulse**: 图标的脉冲效果
- **progressShine**: 进度条的光泽效果
- **statusPulse**: 状态标签的脉冲效果
- **dotPulse**: 加载点的脉冲效果

#### 视觉特征
- 蓝色主题（#4A90E2）用于生成中状态
- 虚线边框的缩略图和占位符
- 半透明背景和渐变效果
- 多层动画叠加营造动态感

### 5. 用户体验改进

#### 提交任务时
1. 任务立即出现在列表顶部
2. 带有滑入动画，视觉反馈明显
3. 历史结果自然向下推移

#### 生成过程中
1. 实时显示进度条（0% → 25% → 50% → 75% → 100%）
2. 动态更新状态文本
3. 多个动画效果提供视觉反馈

#### 生成完成后
1. 任务立即从列表中消失
2. 历史记录自动刷新
3. 新结果出现在列表顶部
4. 无需等待延迟，体验更流畅

## 技术细节

### 条件渲染
```vue
<div v-if="historyResults.length > 0 || generationTasks.length > 0" class="results-display">
  <!-- 生成中任务 -->
  <div v-for="task in generationTasks" :key="task.id" class="generation-card generating">
    ...
  </div>
  
  <!-- 历史结果 -->
  <div v-for="result in historyResults" :key="result.id" class="generation-card">
    ...
  </div>
</div>
```

### 任务数据结构
```typescript
interface GenerationTask {
  id: string
  prompt: string
  model: Model
  size: Size
  resolution: Resolution
  imageCount: ImageCount
  referenceImages: UploadFile[]
  status: 'generating' | 'completed' | 'failed'
  progress: number // 0-100
  progressText: string
  images: ImageResult[]
  createdAt: number
}
```

## 优势

1. **更直观**: 生成任务和历史结果在同一列表中，位置关系清晰
2. **更流畅**: 立即移除完成的任务，无延迟等待
3. **更统一**: 使用相同的卡片样式，视觉一致性更好
4. **更高效**: 减少了DOM结构层级，性能更优

## 兼容性

- 保持了原有的 `generationTasks` 数据结构
- 保持了原有的生成逻辑和API调用
- 只修改了UI展示方式，不影响业务逻辑
