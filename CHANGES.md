# 跨域问题修复记录

## 修改内容

### 1. src/utils/index.ts
- 添加了 `convertToProxyUrl` 函数（当前直接返回原始 URL）
- 保留函数接口，方便将来需要时添加代理逻辑

### 2. src/views/ImageGenerateView.vue
- 在所有图片和视频标签上添加了 `crossorigin="anonymous"` 属性
- 使用 `convertToProxyUrl` 函数处理所有 TOS URL

## 修改位置

### 图片标签
- 生成结果的缩略图
- 生成结果的图片列表
- 图片预览对话框

### 视频标签
- 生成结果的视频
- 视频预览对话框

## 工作原理

1. **crossorigin 属性**：告诉浏览器这是跨域资源，允许正确处理 CORS 响应头
2. **直接使用原始 URL**：TOS 返回的 URL 通常已包含访问签名，可以直接使用
3. **保留转换函数**：如果将来需要添加代理逻辑，只需修改 `convertToProxyUrl` 函数

## 注意事项

- 如果遇到 403 错误，可能需要配置 TOS 的 CORS 规则或使用后端代理
- 如果 URL 签名过期，需要重新生成 URL
- 确保 TOS 存储桶配置了正确的访问权限

## 回滚方法

如果需要回滚修改：

1. 移除所有 `crossorigin="anonymous"` 属性
2. 将 `convertToProxyUrl(url)` 改回直接使用 `url`
3. 删除 `convertToProxyUrl` 函数
