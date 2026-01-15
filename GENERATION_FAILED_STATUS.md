# 生成失败状态样式更新

## 更新内容

为 `historyResults` 中 `status === 3` 的生成失败情况添加了专门的样式展示，区分视频和图片类型。

## 主要修改

### 1. 模板部分 (Template)

#### 卡片状态标识
- 为失败的生成卡片添加 `generation-failed` class
- 为失败的缩略图添加 `failed-thumbnail` class

#### 缩略图区域
- **失败状态显示**：
  - 显示对应类型的图标（图片/视频）
  - 右下角显示红色错误徽章
  - 底部显示"生成失败"文字

#### 标签区域
- 添加红色的"生成失败"状态标签

#### 内容区域
- **失败状态**：显示大型失败提示
  - 大图标（根据类型显示图片或视频图标）
  - 错误徽章
  - 失败标题："图片生成失败" 或 "视频生成失败"
  - 提示文字："请检查参数设置或稍后重试"

### 2. 样式部分 (Style)

#### 失败状态样式
```css
/* 失败标签 */
.status-tag.failed - 红色背景的失败标签

/* 失败卡片 */
.generation-card.generation-failed - 红色边框的卡片

/* 失败缩略图 */
.generation-thumbnail.failed-thumbnail - 红色背景的缩略图容器
.failed-placeholder - 失败占位符布局
.failed-icon-wrapper - 图标包装器
.failed-overlay - 错误徽章覆盖层
.failed-text - 失败文字

/* 失败内容区域 */
.generation-images.failed-content - 虚线边框的失败内容区
.failed-message - 失败消息容器
.failed-icon-large - 大型失败图标
.error-badge - 错误徽章
.failed-info - 失败信息
.failed-title - 失败标题
.failed-desc - 失败描述
```

### 3. 图标导入
- 添加 `CircleClose` 图标用于错误提示

## 视觉效果

### 图片生成失败
- 缩略图：图片图标 + 错误徽章
- 内容区：大型图片图标 + "图片生成失败"

### 视频生成失败
- 缩略图：视频图标 + 错误徽章
- 内容区：大型视频图标 + "视频生成失败"

## 颜色方案
- 主色调：红色 (#ff4d4f, #ff6b6b)
- 背景：半透明红色 (rgba(255, 77, 79, 0.x))
- 边框：虚线红色边框用于内容区域

## 数据结构
```javascript
{
  id: 113,
  type: 2,        // 1: 图片, 2: 视频
  status: 3,      // 3: 生成失败
  assets: [],     // 失败时为空数组
  createTime: "2026-01-15 10:40:29",
  tags: [...]
}
```
