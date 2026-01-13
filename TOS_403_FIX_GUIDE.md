# TOS视频上传403错误修复指南

## 问题描述
图片上传成功，但视频上传报403错误。

## 根本原因
视频上传和图片上传使用了不同的TOS客户端配置参数，导致视频上传时权限验证失败。

## 已修复的问题

### 1. 临时凭证字段名不一致
**问题：** 视频上传使用 `sessionToken`，图片上传使用 `stsToken`
**修复：** 统一使用 `stsToken` 字段

```javascript
// 修复前（视频上传）
const clientConfig = {
  sessionToken: tosConfig.sessionToken,  // ❌ 错误
  // ...
};

// 修复后（视频上传）
const clientConfig = {
  stsToken: tosConfig.sessionToken,  // ✅ 正确
  // ...
};
```

### 2. 移除可能导致冲突的配置
**问题：** 视频上传包含了 `endpoint`、`secure`、`cname` 等配置
**修复：** 移除这些可能导致权限问题的配置

```javascript
// 修复前
const clientConfig = {
  // ...
  endpoint: tosConfig.endpoint,  // ❌ 可能导致权限问题
  secure: true,
  cname: true
};

// 修复后
const clientConfig = {
  // ... 只保留必要配置
  // 移除了 endpoint, secure, cname
};
```

### 3. 增强错误处理
**改进：** 添加了详细的403错误分析和提示

```javascript
// 新增的错误处理
if (err.statusCode === 403) {
  errorMessage = '权限被拒绝(403)：请检查TOS临时凭证权限或是否过期';
} else if (err.code === 'TokenExpired') {
  errorMessage = '临时凭证已过期：请重新获取TOS配置';
}
```

## 测试步骤

### 1. 使用诊断工具
访问 `/tosTest` 页面，点击"运行TOS诊断"按钮：
- 检查网络连接
- 验证TOS配置
- 测试TOS服务连接

### 2. 测试文件上传
在同一页面分别测试：
- 图片上传（验证原有功能正常）
- 视频上传（验证403问题已修复）

### 3. 查看控制台日志
打开浏览器开发者工具，查看详细的调试信息：
```
=== TOS视频上传调试信息 ===
文件信息：{name: "test.mp4", size: 1024000, type: "video/mp4"}
TOS配置参数：{accessKeyId: "AKTP1234...", ...}
创建TOS客户端配置：{...}
```

## 常见403错误原因及解决方案

### 1. 临时凭证过期
**现象：** `TokenExpired` 错误
**解决：** 重新获取TOS配置

### 2. 权限不足
**现象：** `AccessDenied` 错误
**解决：** 检查后端TOS策略配置，确保包含视频上传权限

### 3. 存储桶权限
**现象：** 403 Forbidden
**解决：** 确认存储桶允许当前用户上传视频文件

### 4. 文件路径权限
**现象：** 特定路径403错误
**解决：** 检查 `videos/` 路径是否有写入权限

## 后端检查清单

确保后端TOS配置接口返回正确的权限：

```json
{
  "accessKeyId": "AKTP...",
  "accessKeySecret": "...",
  "sessionToken": "...",
  "region": "cn-beijing",
  "bucket": "your-bucket",
  "mainPath": "videos/"
}
```

### TOS策略示例
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "tos:PutObject",
        "tos:PutObjectAcl",
        "tos:GetObject"
      ],
      "Resource": [
        "arn:volc:tos:*:*:bucket/your-bucket/*"
      ]
    }
  ]
}
```

## 验证修复效果

1. **图片上传测试：** 应该继续正常工作
2. **视频上传测试：** 不再出现403错误
3. **错误提示：** 如果仍有问题，会显示更详细的错误信息

## 如果问题仍然存在

1. 运行TOS诊断工具查看具体错误
2. 检查浏览器控制台的详细日志
3. 确认后端TOS临时凭证的权限配置
4. 验证存储桶和文件路径权限设置

修复完成后，视频和图片上传应该都能正常工作。