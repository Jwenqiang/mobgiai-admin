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
    // 调试：打印配置信息
    console.log('=== TOS上传调试信息 ===');
    console.log('文件信息：', {
      name: file.name,
      size: file.size,
      type: file.type
    });
    console.log('TOS配置参数：', {
      accessKeyId: tosConfig.accessKeyId ? `${tosConfig.accessKeyId.substring(0, 8)}...` : '未设置',
      accessKeySecret: tosConfig.accessKeySecret ? '已设置' : '未设置',
      secretAccessKey: tosConfig.secretAccessKey ? '已设置' : '未设置',
      sessionToken: tosConfig.sessionToken ? `${tosConfig.sessionToken.substring(0, 20)}...` : '未设置',
      region: tosConfig.region,
      bucket: tosConfig.bucket
    });

    // 检查必要参数
    if (!tosConfig.accessKeyId) {
      reject(new Error('缺少 accessKeyId 参数'));
      return;
    }
    if (!tosConfig.accessKeySecret && !tosConfig.secretAccessKey) {
      reject(new Error('缺少 accessKeySecret 或 secretAccessKey 参数'));
      return;
    }
    if (!tosConfig.sessionToken) {
      reject(new Error('缺少 sessionToken 参数'));
      return;
    }
    if (!tosConfig.region) {
      reject(new Error('缺少 region 参数'));
      return;
    }
    if (!tosConfig.bucket) {
      reject(new Error('缺少 bucket 参数'));
      return;
    }

    // 2. 创建TOS客户端实例
    const clientConfig = {
      accessKeyId: tosConfig.accessKeyId,
      accessKeySecret: tosConfig.accessKeySecret || tosConfig.secretAccessKey,
      sessionToken: tosConfig.sessionToken,
      region: tosConfig.region,
      bucket: tosConfig.bucket,
    };
    
    console.log('创建TOS客户端配置：', {
      ...clientConfig,
      accessKeyId: clientConfig.accessKeyId.substring(0, 8) + '...',
      accessKeySecret: '***',
      sessionToken: clientConfig.sessionToken.substring(0, 20) + '...'
    });

    const client = new TOS(clientConfig);

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