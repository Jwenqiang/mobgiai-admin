<template>
    <input 
    type="file" 
    accept="video/*" 
    @change="handleVideoUpload"
    />
</template>
<script setup lang="ts">
import { uploadBigVideoToTOS } from '../services/tos.js'
import { getTosToken } from '../api/index'

// 页面调用方法
const handleVideoUpload = async (e: Event) => {
  const target = e.target as HTMLInputElement;
  const file = target.files?.[0];
  
  // 校验：是否选择了文件 + 是否为视频
  if (!file) return alert('请选择要上传的视频');
  if (!file.type.includes('video')) return alert('请选择正确的视频文件');

  try {
    // 1. 使用统一的API接口请求后端，获取TOS临时配置
    console.log('开始请求TOS配置...');
    const tosConfig = await getTosToken();
    console.log('获取到的TOS临时配置：', tosConfig);
    console.log('TOS配置详细信息：', JSON.stringify(tosConfig, null, 2));

    // 检查配置完整性
    if (!tosConfig) {
      throw new Error('未获取到TOS配置');
    }

    // 检查必要字段
    const requiredFields = ['accessKeyId', 'sessionToken', 'region', 'bucket'];
    const missingFields = requiredFields.filter(field => !tosConfig[field]);
    if (missingFields.length > 0) {
      throw new Error(`TOS配置缺少必要字段: ${missingFields.join(', ')}`);
    }

    // 检查密钥字段
    if (!tosConfig.accessKeySecret && !tosConfig.secretAccessKey) {
      throw new Error('TOS配置缺少密钥字段 (accessKeySecret 或 secretAccessKey)');
    }

    // 2. 调用上传方法，获取视频地址
    const videoUrl = await uploadBigVideoToTOS(file, tosConfig);
    
    // 3. 拿到地址后的业务逻辑：存数据库/回显预览/赋值给表单等
    console.log('最终可用的视频地址：', videoUrl);
    alert('上传成功！视频地址：' + videoUrl);
  } catch (error) {
    console.error('上传失败详细信息：', error);
    alert('上传失败：' + (error.message || error));
  }
}
</script>