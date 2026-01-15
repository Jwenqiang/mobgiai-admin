# 预览对话框美化更新

## 更新概述

完全重新设计了图片和视频预览对话框，去除了白色背景，采用全新的沉浸式暗色设计。

## 主要改进

### 1. 去除白底，采用透明设计
- **对话框背景**：完全透明，无边框
- **遮罩层**：深色半透明 `rgba(0, 0, 0, 0.92)` + 模糊效果
- **沉浸式体验**：内容直接浮现在暗色背景上

### 2. 全新的视觉设计

#### 关闭按钮
- 位置：右上角浮动
- 设计：半透明圆形按钮，带模糊效果
- 交互：悬停时旋转90度并放大
- 样式：
  ```css
  background: rgba(255, 255, 255, 0.1)
  border: 1px solid rgba(255, 255, 255, 0.2)
  backdrop-filter: blur(10px)
  ```

#### 媒体展示区域
- **背景**：完全透明
- **装饰光晕**：
  - 中心位置的径向渐变光晕
  - 紫色调 `rgba(102, 126, 234, 0.15)`
  - 60px 模糊效果
  - 4秒循环脉动动画
- **图片/视频样式**：
  - 16px 圆角
  - 多层阴影效果
  - 1px 白色边框
  - 悬停时轻微放大（1.02倍）

#### 信息面板
- **背景**：渐变设计
  ```css
  linear-gradient(
    180deg,
    rgba(18, 18, 28, 0) 0%,      /* 顶部透明 */
    rgba(18, 18, 28, 0.8) 20%,   /* 中间半透明 */
    rgba(18, 18, 28, 0.95) 100%  /* 底部不透明 */
  )
  ```
- **顶部装饰线**：紫色渐变线条
- **模糊效果**：30px backdrop-filter

#### 提示词区域
- **标签**：
  - 大写字母，1px 字间距
  - 紫色图标 `#667eea`
  - 半透明白色文字
- **文本框**：
  - 极浅的半透明背景
  - 悬停时背景加深
  - 自定义滚动条样式
  - 最大高度 120px

#### 操作按钮
- **渐变背景**：紫色到粉色 `#667eea → #764ba2`
- **多重效果**：
  - 内阴影：白色边框效果
  - 外阴影：紫色光晕
  - 光泽动画：悬停时从左到右的光泽扫过
- **交互动画**：
  - 悬停：上移3px + 阴影增强
  - 点击：上移1px
  - 过渡：0.4s cubic-bezier 缓动

### 3. 动画效果

#### 脉动光晕动画
```css
@keyframes pulse {
  0%, 100% {
    opacity: 0.5;
    transform: translate(-50%, -50%) scale(1);
  }
  50% {
    opacity: 0.8;
    transform: translate(-50%, -50%) scale(1.1);
  }
}
```

#### 按钮光泽动画
- 伪元素从左侧滑入到右侧
- 半透明白色渐变
- 0.6s 过渡时间

### 4. 响应式优化

#### 移动端 (<768px)
- 对话框宽度：95%
- 关闭按钮：36x36px
- 媒体内容：最大高度 55vh
- 内边距：减小到 20px
- 按钮高度：42px

#### 桌面端
- 对话框最大宽度：1400px
- 关闭按钮：44x44px
- 媒体内容：最大高度 70vh
- 内边距：40px
- 按钮高度：48px

## 技术实现

### 关键CSS技巧

1. **透明对话框**
```css
.preview-dialog :deep(.el-dialog) {
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
}
```

2. **深色遮罩**
```css
.preview-dialog :deep(.el-overlay) {
  background-color: rgba(0, 0, 0, 0.92) !important;
  backdrop-filter: blur(20px);
}
```

3. **渐变信息面板**
```css
background: linear-gradient(
  180deg,
  rgba(18, 18, 28, 0) 0%,
  rgba(18, 18, 28, 0.8) 20%,
  rgba(18, 18, 28, 0.95) 100%
);
```

4. **多层阴影**
```css
box-shadow: 
  0 20px 60px rgba(0, 0, 0, 0.6),
  0 0 0 1px rgba(255, 255, 255, 0.1);
```

### HTML 结构
```vue
<el-dialog :show-close="false">
  <div class="preview-content">
    <!-- 关闭按钮 -->
    <div class="preview-close-btn" @click="close">
      <el-icon><Close /></el-icon>
    </div>
    
    <!-- 媒体展示区 -->
    <div class="preview-media-wrapper">
      <img/video />
    </div>
    
    <!-- 信息面板 -->
    <div class="preview-info-panel">
      <!-- 提示词 -->
      <div class="preview-prompt-section">
        <div class="prompt-label">...</div>
        <div class="prompt-text">...</div>
      </div>
      
      <!-- 操作按钮 -->
      <div class="preview-actions">
        <el-button>下载</el-button>
      </div>
    </div>
  </div>
</el-dialog>
```

## 视觉效果对比

### 之前
- ❌ 白色对话框背景
- ❌ 生硬的边框
- ❌ 简单的阴影
- ❌ 默认关闭按钮

### 现在
- ✅ 透明沉浸式设计
- ✅ 深色模糊遮罩
- ✅ 脉动光晕装饰
- ✅ 自定义关闭按钮
- ✅ 渐变信息面板
- ✅ 多层阴影效果
- ✅ 流畅的动画过渡
- ✅ 光泽扫过效果

## 颜色方案

| 元素 | 颜色 | 用途 |
|------|------|------|
| 遮罩层 | `rgba(0, 0, 0, 0.92)` | 深色背景 |
| 光晕 | `rgba(102, 126, 234, 0.15)` | 装饰效果 |
| 信息面板 | `rgba(18, 18, 28, 0.95)` | 底部背景 |
| 强调色 | `#667eea` | 图标、按钮 |
| 渐变 | `#667eea → #764ba2` | 按钮背景 |
| 文字 | `rgba(255, 255, 255, 0.95)` | 主要文字 |
| 次要文字 | `rgba(255, 255, 255, 0.6)` | 标签文字 |

## 用户体验提升

1. **沉浸式观看**：去除白底，专注于内容本身
2. **视觉舒适**：深色背景减少眼睛疲劳
3. **现代美观**：渐变、模糊、动画等现代设计元素
4. **交互反馈**：丰富的悬停和点击动画
5. **信息完整**：提示词清晰展示
6. **操作便捷**：大按钮，明确的视觉层次

## 浏览器兼容性

- ✅ Chrome/Edge (Chromium)
- ✅ Firefox
- ✅ Safari
- ⚠️ backdrop-filter 需要现代浏览器支持

## 性能优化

- 使用 CSS transform 而非 position 进行动画
- GPU 加速的 transform 和 opacity 动画
- 合理使用 backdrop-filter（仅在必要位置）
- 动画使用 cubic-bezier 缓动函数

## 测试建议

1. ✅ 点击图片预览，检查视觉效果
2. ✅ 点击视频预览，检查播放器样式
3. ✅ 测试关闭按钮的旋转动画
4. ✅ 测试按钮的光泽扫过效果
5. ✅ 检查提示词滚动条样式
6. ✅ 在不同屏幕尺寸下测试响应式
7. ✅ 测试悬停和点击的所有交互动画
