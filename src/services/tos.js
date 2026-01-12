// 1. 导入TOS SDK核心类
import { TOS } from '@volcengine/tos-sdk';

/**
 * 火山引擎TOS 视频上传核心方法
 * @param {File} file - input:file 拿到的视频文件对象
 * @param {Object} tosConfig - 后端返回的tos配置+临时凭证
 * @returns {Promise<string>} 上传成功后返回「视频的完整访问地址」
 */
// 🔥 推荐：大视频分片上传 + 进度监听 + 获取视频地址
export const uploadBigVideoToTOS= async function uploadBigVideoToTOS(file, tosConfig) {
  return new Promise((resolve, reject) => {
    const client = new TOS({
      accessKeyId: tosConfig.accessKeyId,
      secretAccessKey: tosConfig.secretAccessKey,
      sessionToken: tosConfig.sessionToken,
      region: tosConfig.region,
      bucket: tosConfig.bucket,
    });

    // 生成唯一文件名（同上）
    const timeStamp = new Date().getTime();
    const randomNum = Math.floor(Math.random() * 1000000);
    const fileNameSuffix = file.name.substring(file.name.lastIndexOf('.'));
    const uploadFileName = `${timeStamp}_${randomNum}${fileNameSuffix}`;

    // 分片上传核心配置
    client.uploadFile({
      key: uploadFileName,
      file: file,
      partSize: 5 * 1024 * 1024, // 分片大小：5MB/片（可自定义，推荐5-10MB）
      progress: (p) => {
        // ✅ 实时获取上传进度，可做进度条展示
        console.log('视频上传进度：', Math.floor(p * 100) + '%');
      }
    }).then((data) => {
      // 上传成功，获取视频地址
      const videoUrl = data.url;
      resolve(videoUrl);
    }).catch((err) => {
      console.error('大视频上传失败：', err);
      reject(err.message);
    });
  });
}