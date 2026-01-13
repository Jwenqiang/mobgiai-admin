# 火山引擎TOS上传使用指南

## 概述

本项目已集成火山引擎TOS（对象存储）上传功能，支持视频和图片文件的上传。

## 功能特性

- ✅ 支持大文件分片上传（视频）
- ✅ 支持实时上传进度显示
- ✅ 支持图片直接上传
- ✅ 完整的错误处理和用户反馈
- ✅ TypeScript类型安全
- ✅ 响应式UI界面

## 技术架构

### 1. 依赖包
```json
{
  "@volcengine/tos-sdk": "^2.9.0"
}
```

### 2. 核心文件结构
```
src/
├── services/tos.js          # TOS上传核心服务
├── api/index.ts             # API接口（获取TOS临时凭证）
└── views/uploadTos.vue      # 上传页面组件
```

## 使用方法

### 1. 后端API配置

确保后端提供获取TOS临时凭证的接口：

```typescript
// 接口地址：POST /api/v1/tos/get_sts_token
// 返回格式：
{
  "accessKeyId": "AKTP***",
  "accessKeySecret": "***", // 或 secretAccessKey
  "sessionToken": "***",
  "region": "cn-beijing", // 如：cn-beijing, us-east-1
  "bucket": "your-bucket-name",
  "mainPath": "videos/" // 可选，文件上传路径前缀
}
```

### 2. 前端使用

#### 在Vue组件中使用：

```vue
<template>
  <div>
    <!-- 视频上传 -->
    <input type="file" accept="video/*" @change="handleVideoUpload" />
    
    <!-- 图片上传 -->
    <input type="file" accept="image/*" @change="handleImageUpload" />
  </div>
</template>

<script setup>
import { uploadBigVideoToTOS, uploadImageToTOS } from '@/services/tos.js'
import { getTosToken } from '@/api/index'

const handleVideoUpload = async (e) => {
  const file = e.target.files[0]
  if (!file) return
  
  try {
    // 获取TOS配置
    const tosConfig = await getTosToken()
    
    // 上传视频
    const videoUrl = await uploadBigVideoToTOS(file, tosConfig)
    console.log('视频地址：', videoUrl)
  } catch (error) {
    console.error('上传失败：', error)
  }
}

const handleImageUpload = async (e) => {
  const file = e.target.files[0]
  if (!file) return
  
  try {
    const tosConfig = await getTosToken()
    const imageUrl = await uploadImageToTOS(file, tosConfig)
    console.log('图片地址：', imageUrl)
  } catch (error) {
    console.error('上传失败：', error)
  }
}
</script>
```

### 3. 直接调用服务方法

```javascript
import { uploadBigVideoToTOS, uploadImageToTOS } from '@/services/tos.js'
import { getTosToken } from '@/api/index'

// 上传视频
async function uploadVideo(file) {
  const tosConfig = await getTosToken()
  return await uploadBigVideoToTOS(file, tosConfig)
}

// 上传图片
async function uploadImage(file) {
  const tosConfig = await getTosToken()
  return await uploadImageToTOS(file, tosConfig)
}
```

## API参考

### uploadBigVideoToTOS(file, tosConfig)

大视频分片上传方法

**参数：**
- `file`: File对象，视频文件
- `tosConfig`: TOS配置对象

**返回：** Promise<string> - 视频访问URL

**特性：**
- 自动分片上传（5MB/片）
- 实时进度回调
- 错误重试机制

### uploadImageToTOS(file, tosConfig)

图片上传方法

**参数：**
- `file`: File对象，图片文件
- `tosConfig`: TOS配置对象

**返回：** Promise<string> - 图片访问URL

### getTosToken()

获取TOS临时凭证

**返回：** Promise<TosConfig> - TOS配置对象

## 配置说明

### TOS配置对象结构

```typescript
interface TosConfig {
  accessKeyId: string        // 访问密钥ID
  accessKeySecret?: string   // 访问密钥Secret
  secretAccessKey?: string   // 访问密钥Secret（备用字段名）
  sessionToken: string       // 临时会话令牌
  region: string            // 地域，如：cn-beijing
  bucket: string            // 存储桶名称
  mainPath?: string         // 文件路径前缀（可选）
}
```

### 支持的地域

- `cn-beijing` - 华北2（北京）
- `cn-shanghai` - 华东2（上海）
- `cn-guangzhou` - 华南1（广州）
- `us-east-1` - 美国东部（弗吉尼亚）
- 更多地域请参考火山引擎官方文档

## 错误处理

常见错误及解决方案：

1. **缺少必要参数**
   ```
   错误：缺少 accessKeyId 参数
   解决：检查后端返回的TOS配置是否完整
   ```

2. **权限不足**
   ```
   错误：Access Denied
   解决：检查TOS临时凭证权限配置
   ```

3. **网络超时**
   ```
   错误：Network timeout
   解决：检查网络连接，或调整分片大小
   ```

## 最佳实践

1. **文件大小限制**
   - 视频文件：建议 < 2GB
   - 图片文件：建议 < 50MB

2. **文件格式支持**
   - 视频：mp4, avi, mov, wmv, flv, webm
   - 图片：jpg, jpeg, png, gif, webp, bmp

3. **性能优化**
   - 大文件使用分片上传
   - 合理设置分片大小（5-10MB）
   - 添加上传进度显示

4. **安全考虑**
   - 使用临时凭证，避免长期密钥泄露
   - 设置合理的凭证过期时间
   - 前端不存储敏感信息

## 故障排查

### 开启调试日志

在浏览器控制台查看详细日志：

```javascript
// TOS上传过程会自动输出调试信息
console.log('=== TOS上传调试信息 ===')
```

### 常用调试命令

```javascript
// 检查TOS配置
console.log('TOS配置：', tosConfig)

// 检查文件信息
console.log('文件信息：', {
  name: file.name,
  size: file.size,
  type: file.type
})
```

## 更新日志

- **v1.0.0** - 初始版本，支持视频和图片上传
- **v1.1.0** - 添加进度显示和错误处理
- **v1.2.0** - 完善TypeScript类型定义

## 相关链接

- [火山引擎TOS官方文档](https://www.volcengine.com/docs/6349)
- [TOS JavaScript SDK](https://github.com/volcengine/ve-tos-js-sdk)
- [TOS控制台](https://console.volcengine.com/tos)