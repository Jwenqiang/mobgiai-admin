# API 统一使用指南

## 概述
已将项目改为统一使用 `src/api/index.ts` 中的 axios 请求接口，并配置了开发环境域名。

## 环境配置
- **开发环境**: `http://10.41.3.233:19000`
- **生产环境**: `https://api.mobgiai.com`

## 使用方法

### 1. 基础API调用
```typescript
import { get, post } from '@/api/index'

// GET 请求
const data = await get('/api/users')
const dataWithParams = await get('/api/users', { page: 1, size: 10 })

// POST 请求
const result = await post('/api/login', { username: 'admin', password: '123456' })
```

### 2. 全域名接口支持
如果传入完整的URL（以 http:// 或 https:// 开头），会自动使用该域名：

```typescript
// 使用完整URL
const data = await get('https://api.example.com/data')
const result = await post('http://localhost:3000/api/test', { data: 'test' })
```

### 3. 文件上传
```typescript
import { uploadImage, uploadVideo } from '@/api/index'

// 图片上传（10分钟超时）
const imageResult = await uploadImage(file, (progress) => {
  console.log('上传进度:', progress.loaded / progress.total * 100 + '%')
})

// 视频上传（无超时限制）
const videoResult = await uploadVideo(file, (progress) => {
  console.log('上传进度:', progress.loaded / progress.total * 100 + '%')
})
```

### 4. 业务接口示例
```typescript
import { login, getUserList, getTosToken } from '@/api/index'

// 登录
const loginResult = await login({ username: 'admin', password: '123456' })

// 获取用户列表
const users = await getUserList({ page: 1, size: 10 })

// 获取TOS令牌
const tosConfig = await getTosToken()
```

## 特性
- ✅ 自动添加 Authorization token
- ✅ 请求/响应拦截器
- ✅ 重复请求取消
- ✅ 统一错误处理
- ✅ 支持全域名接口
- ✅ 文件上传进度监控
- ✅ TypeScript 类型支持

## 注意事项
1. 所有接口都会自动添加 localStorage 中的 token
2. 相对路径接口会使用环境变量中配置的基础URL
3. 完整URL接口会忽略基础URL配置
4. 上传接口支持进度回调