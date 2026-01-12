# 下载功能优化说明

## 概述

本次更新优化了项目中所有的下载操作，使其能够更稳定地通过浏览器直接下载文件，提升了用户体验和兼容性。

## 主要改进

### 1. 新增通用下载工具函数

在 `src/utils/index.ts` 中新增了以下工具函数：

- `downloadFile()` - 通用文件下载函数，支持多种下载方式
- `downloadFiles()` - 批量文件下载函数
- `downloadBlob()` - 从Blob对象创建下载
- `downloadText()` - 下载文本内容为文件
- `downloadJSON()` - 下载JSON数据为文件

### 2. 优化的下载策略

新的下载函数采用了多层降级策略：

1. **首选方式**: 使用 `fetch + blob` 方式下载
   - 更好的错误处理
   - 支持自定义请求头
   - 可以处理跨域问题
   - 自动从响应头获取文件名

2. **降级方式**: 传统的 `<a>` 标签下载
   - 当fetch方式失败时自动降级
   - 保持向后兼容性

### 3. 更新的文件

#### mobgiai-admin项目
- `src/views/AssetsView.vue` - 资产管理页面的单个和批量下载
- `src/views/VideoGenerateView.vue` - 视频生成页面的下载功能
- `src/views/ImageGenerateView.vue` - 图片生成页面的下载功能

#### pcProgram项目
- `src/utils/index.js` - 新增下载工具函数
- `src/views/Settings.vue` - 设置导出功能

## 功能特性

### 1. 错误处理
- 自动重试机制
- 详细的错误日志
- 用户友好的错误提示

### 2. 批量下载
- 支持批量下载多个文件
- 可配置下载间隔时间
- 进度回调支持
- 单个文件失败不影响其他文件

### 3. 浏览器兼容性
- 支持现代浏览器的fetch API
- 自动降级到传统下载方式
- 处理不同浏览器的下载限制

### 4. 文件名处理
- 自动从响应头获取文件名
- 支持自定义文件名
- 处理特殊字符和编码问题

## 使用示例

### 单个文件下载
```javascript
import { downloadFile } from '@/utils'

// 基本用法
await downloadFile('https://example.com/file.pdf', 'document.pdf')

// 带选项的用法
await downloadFile('https://api.example.com/download', 'file.zip', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer token' },
  body: JSON.stringify({ fileId: 123 })
})
```

### 批量下载
```javascript
import { downloadFiles } from '@/utils'

const files = [
  { url: 'https://example.com/file1.jpg', filename: 'image1.jpg' },
  { url: 'https://example.com/file2.jpg', filename: 'image2.jpg' }
]

await downloadFiles(files, {
  delay: 500,
  onProgress: (current, total) => {
    console.log(`下载进度: ${current}/${total}`)
  },
  onError: (error, file) => {
    console.error(`下载失败: ${file.filename}`, error)
  }
})
```

### Blob下载
```javascript
import { downloadBlob, downloadJSON } from '@/utils'

// 下载Blob对象
const blob = new Blob(['Hello World'], { type: 'text/plain' })
downloadBlob(blob, 'hello.txt')

// 下载JSON数据
const data = { name: 'John', age: 30 }
downloadJSON(data, 'user.json')
```

## 注意事项

1. **浏览器限制**: 某些浏览器可能会阻止同时下载多个文件，批量下载功能会自动添加延迟来避免这个问题。

2. **跨域问题**: 如果下载的文件来自不同域名，可能会遇到CORS限制，此时会自动降级到传统下载方式。

3. **文件大小**: 对于大文件，建议使用流式下载或分块下载，当前实现适用于中小型文件。

4. **移动端兼容**: 在移动端浏览器中，下载行为可能有所不同，建议进行充分测试。

## 性能优化

- 使用 `URL.revokeObjectURL()` 及时释放内存
- 批量下载时合理控制并发数量
- 错误重试机制避免不必要的网络请求

## 未来改进

- [ ] 支持下载进度显示
- [ ] 支持断点续传
- [ ] 支持压缩包批量下载
- [ ] 支持云存储直链下载