# 图片上传Content-Type修复指南

## 问题描述
上传的图片在服务端变成了文件，无法正常显示为图片。

## 根本原因
在使用TOS `putObject` 方法上传图片时，没有设置正确的 `Content-Type` 头信息，导致：
1. 服务端无法识别文件的MIME类型
2. 浏览器将图片当作普通文件处理
3. 图片无法在浏览器中正常显示

## 技术分析

### 问题对比
```javascript
// ❌ 修复前 - 缺少Content-Type
client.putObject({
  bucket: tosConfig.bucket,
  key: uploadFileName,
  body: file  // 只有文件内容，没有类型信息
});

// ✅ 修复后 - 包含完整的头信息
client.putObject({
  bucket: tosConfig.bucket,
  key: uploadFileName,
  body: file,
  headers: {
    'Content-Type': file.type || 'image/jpeg',
    'Cache-Control': 'public, max-age=31536000',
    'Content-Disposition': 'inline'
  }
});
```

### MIME类型映射
修复后的代码包含完整的MIME类型映射：

```javascript
const mimeTypes = {
  'jpg': 'image/jpeg',
  'jpeg': 'image/jpeg',
  'png': 'image/png',
  'gif': 'image/gif',
  'webp': 'image/webp',
  'bmp': 'image/bmp',
  'svg': 'image/svg+xml',
  'ico': 'image/x-icon'
};
```

## 修复内容

### 1. 添加Content-Type设置
```javascript
headers: {
  'Content-Type': getContentType(file),  // 正确的MIME类型
  'Cache-Control': 'public, max-age=31536000',  // 缓存策略
  'Content-Disposition': 'inline'  // 浏览器内联显示
}
```

### 2. 智能MIME类型检测
```javascript
const getContentType = (file) => {
  // 优先使用文件自带的type
  if (file.type) {
    return file.type;
  }
  
  // 根据文件扩展名推断MIME类型
  const ext = file.name.toLowerCase().split('.').pop();
  return mimeTypes[ext] || 'application/octet-stream';
};
```

### 3. 文件类型验证
```javascript
// 验证文件类型
if (!file.type.startsWith('image/')) {
  reject(new Error('文件类型错误：请选择图片文件'));
  return;
}
```

### 4. 增强调试信息
```javascript
console.log('文件MIME类型：', file.type);
console.log('设置Content-Type：', contentType);
```

## 修复效果

### 修复前
- 图片上传后显示为普通文件
- 浏览器无法识别图片格式
- 点击链接会下载文件而不是显示图片

### 修复后
- 图片上传后正确识别为图片类型
- 浏览器可以直接显示图片
- 支持图片预览和缓存

## 测试验证

### 1. 使用测试页面
访问 `/tosTest` 页面进行测试：
```
1. 选择图片文件上传
2. 查看上传成功后的预览效果
3. 点击链接验证浏览器显示效果
```

### 2. 检查控制台日志
```
=== TOS图片上传调试信息 ===
文件信息：{name: "test.jpg", size: 102400, type: "image/jpeg"}
上传文件名：images/1642012345_123456.jpg
文件MIME类型：image/jpeg
设置Content-Type：image/jpeg
图片上传成功
```

### 3. 验证HTTP响应头
使用浏览器开发者工具检查上传后的文件：
```
Content-Type: image/jpeg
Cache-Control: public, max-age=31536000
Content-Disposition: inline
```

## 支持的图片格式

修复后支持以下图片格式的正确识别：
- **JPEG/JPG** → `image/jpeg`
- **PNG** → `image/png`
- **GIF** → `image/gif`
- **WebP** → `image/webp`
- **BMP** → `image/bmp`
- **SVG** → `image/svg+xml`
- **ICO** → `image/x-icon`

## 最佳实践

### 1. 文件上传前验证
```javascript
// 检查文件类型
if (!file.type.startsWith('image/')) {
  throw new Error('请选择图片文件');
}

// 检查文件大小
if (file.size > 10 * 1024 * 1024) {  // 10MB
  throw new Error('图片文件过大');
}
```

### 2. 设置合适的缓存策略
```javascript
'Cache-Control': 'public, max-age=31536000'  // 1年缓存
```

### 3. 确保浏览器内联显示
```javascript
'Content-Disposition': 'inline'  // 而不是 'attachment'
```

## 常见问题

### Q: 为什么视频上传没有这个问题？
A: 视频使用 `uploadFile` 方法，SDK会自动处理Content-Type；图片使用 `putObject` 方法，需要手动设置。

### Q: 如何验证修复是否生效？
A: 上传图片后，在浏览器中直接访问图片URL，如果能正常显示说明修复成功。

### Q: 旧的图片文件怎么办？
A: 旧文件需要重新上传，或者通过TOS控制台手动修改Content-Type。

## 总结

通过添加正确的Content-Type头信息，图片上传后能够：
1. ✅ 被正确识别为图片类型
2. ✅ 在浏览器中正常显示
3. ✅ 支持图片预览功能
4. ✅ 享受浏览器缓存优化

这个修复确保了图片文件在TOS中的正确存储和访问。