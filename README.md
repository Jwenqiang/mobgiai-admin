# MobgiAI - AI内容生成平台

一个基于 Vue3 + Element Plus + TypeScript + Vite 构建的AI内容生成平台，支持图片生成、视频生成和资产管理。

## 功能特性

- 🔐 手机号验证码登录系统
- 🎨 AI图片生成功能
- 🎬 AI视频生成功能  
- 💼 资产管理和展示
- 📥 优化的文件下载功能
- 📱 响应式设计，支持多设备

## 技术栈

- **前端框架**: Vue 3 + TypeScript
- **构建工具**: Vite
- **UI组件库**: Element Plus
- **状态管理**: Pinia
- **路由管理**: Vue Router

## 快速开始

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
├── components/       # 公共组件
├── stores/           # 状态管理
├── services/         # API服务
├── utils/            # 工具函数
└── router/           # 路由配置
```

## 页面路由

- `/login` - 登录页面
- `/dashboard/assets` - 资产管理
- `/dashboard/image-generate` - 图片生成
- `/dashboard/video-generate` - 视频生成

## 下载功能

项目已优化所有下载操作，支持稳定的浏览器直接下载：

### 主要特性
- ✅ 多层降级策略确保兼容性
- ✅ 支持单个文件和批量下载
- ✅ 自动错误处理和重试
- ✅ 支持自定义文件名和请求头
- ✅ 内存管理优化

### 使用示例
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

详细说明请查看 [DOWNLOAD_OPTIMIZATION.md](./DOWNLOAD_OPTIMIZATION.md)

## 许可证

MIT License