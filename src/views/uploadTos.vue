<template>
    <input 
    type="file" 
    accept="video/*" 
    @change="handleVideoUpload"
    />
</template>
<script setup lang="ts">
import {uploadBigVideoToTOS} from '../services/tos.js'
// 页面调用方法
async function handleVideoUpload(e) {
  const file = e.target.files[0];
  // 校验：是否选择了文件 + 是否为视频
  if (!file) return alert('请选择要上传的视频');
  if (!file.type.includes('video')) return alert('请选择正确的视频文件');

  try {
    // 1. 先请求后端接口，获取TOS临时配置（核心）
    const res = await fetch('/api/get-tos-sts-token').then(res => res.json());
    const tosConfig = res.data;

    // 2. 调用上传方法，获取视频地址
    const videoUrl = await uploadBigVideoToTOS(file, tosConfig);
    
    // 3. 拿到地址后的业务逻辑：存数据库/回显预览/赋值给表单等
    console.log('最终可用的视频地址：', videoUrl);
    alert('上传成功！视频地址：' + videoUrl);
  } catch (error) {
    alert(error);
  }
}
</script>