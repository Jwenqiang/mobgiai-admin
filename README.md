# MobgiAI - AI内容生成平台

一个基于 Vue3 + Element Plus + TypeScript + Vite 构建的AI内容生成平台，支持图片生成、视频生成和资产管理。

## 功能特性

- 🔐 手机号验证码登录系统
- 🎨 AI图片生成功能（支持多种模型和参数配置）
- 🎬 AI视频生成功能（支持首尾帧、多模态参考等模式）
- 💼 资产管理和展示
- 📥 优化的文件下载功能
- 📱 响应式设计，支持多设备
- 🖼️ 图片上传预览功能（最多5张参考图片）
- 🎥 视频上传和预览功能
- 🔄 生成方式与模型联动切换

## 技术栈

- **前端框架**: Vue 3 + TypeScript
- **构建工具**: Vite
- **UI组件库**: Element Plus
- **状态管理**: Pinia
- **路由管理**: Vue Router
- **HTTP客户端**: Axios（统一API管理）

## 快速开始

### 环境要求
- Node.js 16+
- npm 或 yarn

### 安装依赖
```bash
npm install
```

### 启动开发服务器
```bash
npm run dev
```

### 构建生产版本
```bash
npm run build
```

## 项目结构

```
src/
├── layout/           # 布局组件
├── views/            # 页面组件
│   ├── ImageGenerateView.vue  # 图片/视频生成页面（集成）
│   ├── VideoGenerateView.vue  # 独立视频生成页面
│   ├── AssetsView.vue         # 资产管理页面
│   └── uploadTos.vue          # TOS上传页面
├── components/       # 公共组件
├── stores/           # 状态管理
├── services/         # API服务
├── utils/            # 工具函数
├── api/              # API接口管理
└── router/           # 路由配置
```

## 页面路由

- `/login` - 登录页面
- `/dashboard/assets` - 资产管理
- `/dashboard/image-generate` - 图片/视频生成（集成页面）
- `/dashboard/video-generate` - 视频生成（独立页面）

## 核心功能说明

### 1. 图片/视频生成集成页面

支持在同一页面中进行图片和视频生成，具有以下特性：

#### 生成方式切换
- **图片生成模式**：支持多种图片生成模型（Seedream 4.5、Seedream 4.0、可灵 O1、可灵 2.0）
- **视频生成模式**：支持多种视频生成模型（Seedance 1.5 Pro、Seedance 1.0 Pro、可灵 O1、可灵 2.6）

#### 图片生成功能
- 参考图片上传（最多5张）
- 比例选择：21:9、16:9、3:2、4:3、1:1、3:4、2:3、9:16
- 分辨率选择：高清2K、超清4K
- 图片张数：1-4张
- 艺术风格选择

#### 视频生成功能
- **首尾帧模式**：上传首帧和尾帧图片生成视频
- **多模态参考模式**：上传参考视频和图片（最多4张）
- **视频编辑模式**：智能视频编辑功能
- 视频参数配置：比例、分辨率、时长、音频开关

#### 可灵模型特殊功能
当选择可灵模型时，提供三种特殊模式：
- 首尾帧：基于首尾帧生成视频
- 多模态参考：多模态内容参考生成
- 视频编辑：智能视频编辑功能

### 2. 文件上传功能

#### 图片上传
- 支持拖拽上传和点击上传
- 实时缩略图预览（80x80px主界面，50x50px悬浮面板）
- 右上角删除按钮（悬浮显示）
- 点击预览原图功能
- 最多5张图片限制

#### 视频上传
- 支持视频文件上传和预览
- 首尾帧图片交换功能
- 参考图片网格显示和管理

### 3. API统一管理

项目使用统一的API接口管理：

```typescript
import { get, post, uploadImage, uploadVideo } from '@/api/index'

// 基础API调用
const data = await get('/api/users')
const result = await post('/api/login', { username: 'admin', password: '123456' })

// 文件上传
const imageResult = await uploadImage(file, (progress) => {
  console.log('上传进度:', progress.loaded / progress.total * 100 + '%')
})
```

#### API特性
- 自动添加 Authorization token
- 请求/响应拦截器
- 重复请求取消
- 统一错误处理
- 支持全域名接口
- 文件上传进度监控

#### 环境配置
- **开发环境**: `http://10.41.3.233:19000`
- **生产环境**: `https://api.mobgiai.com`

### 4. 下载功能优化

项目已优化所有下载操作，支持稳定的浏览器直接下载：

#### 主要特性
- 多层降级策略确保兼容性
- 支持单个文件和批量下载
- 自动错误处理和重试
- 支持自定义文件名和请求头
- 内存管理优化

#### 使用示例
```javascript
import { downloadFile, downloadFiles, downloadJSON } from '@/utils'

// 单个文件下载
await downloadFile('https://example.com/file.pdf', 'document.pdf')

// 批量下载
await downloadFiles([
  { url: 'https://example.com/file1.jpg', filename: 'image1.jpg' },
  { url: 'https://example.com/file2.jpg', filename: 'image2.jpg' }
])

// JSON数据下载
downloadJSON({ data: 'example' }, 'data.json')
```

### 5. UI设计优化

界面采用现代化设计风格，参考即梦网站设计：

#### 设计特色
- 渐变背景：紫色渐变背景 `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`
- 玻璃拟态效果：使用 `backdrop-filter: blur()` 和半透明背景
- 动画效果：微妙的动画和过渡效果
- 响应式设计：支持桌面端、平板和移动端

#### 交互优化
- 悬浮效果：缩略图悬浮时放大并显示删除按钮
- 视觉反馈：所有操作都有清晰的视觉反馈
- 流畅动画：平滑的过渡和变换效果

## 开发指南

### 代码规范
- 使用 TypeScript 进行类型检查
- 遵循 Vue 3 Composition API 最佳实践
- 使用 ESLint 进行代码规范检查

### 样式管理
- 使用 scoped CSS 避免样式冲突
- 深度选择器 `:deep()` 修改第三方组件样式
- CSS 变量统一管理主题色彩

### 状态管理
- 使用 Pinia 进行全局状态管理
- 组件内部使用 ref/reactive 管理局部状态

## 浏览器兼容性

- Chrome 88+
- Firefox 85+
- Safari 14+
- Edge 88+

## 许可证

MIT License