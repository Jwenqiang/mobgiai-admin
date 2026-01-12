<template>
  <div class="demo-container">
    <el-button @click="handleLogin">模拟登录（防重复点击）</el-button>
    <el-button @click="handleUpload">上传视频</el-button>
  </div>
</template>

<script setup lang="ts">
import { onUnmounted } from 'vue';
import { post, uploadVideo } from '@/api/index';
import { cancelAllPending } from '@/utils/request';
import { ElMessage } from 'element-plus';

// 1. 防重复请求：快速点击多次只会发一次请求
const handleLogin = async () => {
  try {
    const res = await post('/auth/login', { username: 'admin', password: '123456' });
    console.log('登录成功', res);
    ElMessage.success('登录成功');
  } catch (err) {
    console.error(err);
  }
};

// 2. 上传视频（可手动取消，这里演示组件卸载时取消）
let uploadCancel: (() => void) | null = null;
const handleUpload = async () => {
  const file = new File(['test'], 'demo.mp4', { type: 'video/mp4' }); // 模拟文件
  try {
    await uploadVideo(file, (e) => {
      const progress = Math.round((e.loaded / (e.total || 1)) * 100);
      console.log(`上传进度：${progress}%`);
    });
  } catch (err) {
    console.error(err);
  }
};

// 3. 组件卸载时取消所有请求
onUnmounted(() => {
  cancelAllPending();
  ElMessage.info('组件卸载，已取消所有请求');
});
</script>