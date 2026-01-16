/*
 * @Author: joven 632795201@qq.com
 * @Date: 2026-01-12 16:04:31
 * @LastEditors: joven 632795201@qq.com
 * @LastEditTime: 2026-01-13 17:23:26
 * @FilePath: \workspace\mobgiai-admin\src\services\tos.js
 * @Description: 火山引擎TOS上传服务
 */
// 1. 导入TOS SDK核心类
import { TosClient } from '@volcengine/tos-sdk';

/**
 * 火山引擎TOS 视频上传核心方法
 * @param {File} file - input:file 拿到的视频文件对象
 * @param {Object} tosConfig - 后端返回的tos配置+临时凭证
 * @param {Function} onProgress - 上传进度回调函数，参数为进度值(0-1)
 * @returns {Promise<string>} 上传成功后返回「视频的完整访问地址」
 */
export const uploadBigVideoToTOS = async function uploadBigVideoToTOS(file, tosConfig, onProgress) {
  return new Promise((resolve, reject) => {
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
      stsToken: tosConfig.sessionToken,  // ✅ 修正：使用 stsToken 而不是 sessionToken
      region: tosConfig.region,
      bucket: tosConfig.bucket,
      // 移除可能导致问题的 endpoint 和 cname 配置
      // endpoint: tosConfig.endpoint,
      // secure: true,
      // cname: true
    };

    const client = new TosClient(clientConfig);

    console.log('TOS客户端创建成功');
    
    // 生成唯一文件名
    const timeStamp = new Date().getTime();
    const randomNum = Math.floor(Math.random() * 1000000);
    const fileNameSuffix = file.name.substring(file.name.lastIndexOf('.'));
    const uploadFileName = tosConfig.mainPath+`/videos/${timeStamp}_${randomNum}${fileNameSuffix}`;

    console.log('上传文件名：', uploadFileName);

    // 分片上传核心配置
    client.uploadFile({
      bucket: tosConfig.bucket,
      key: uploadFileName,
      file: file,
      partSize: 5 * 1024 * 1024, // 分片大小：5MB/片（可自定义，推荐5-10MB）
      headers: {
        'Content-Type': file.type || 'video/mp4',  // ✅ 确保视频也有正确的MIME类型
        'Cache-Control': 'public, max-age=31536000',  // 设置缓存策略
        'Content-Disposition': 'inline',  // 浏览器内联播放
      },
      progress: (p) => {
        // ✅ 实时获取上传进度，可做进度条展示
        console.log('视频上传进度：', Math.floor(p * 100) + '%');
        // 如果传入了进度回调函数，则调用它
        if (typeof onProgress === 'function') {
          onProgress(p);
        }
      }
    }).then((data) => {
      console.log('上传成功，返回数据：', data);
      console.log('上传成功，返回的域名：', tosConfig.publicDomain);      
      // 上传成功，构建完整的访问URL
      const videoUrl = `${tosConfig.publicDomain}${uploadFileName}`;
      console.log('最终视频地址：', videoUrl);
      resolve({videoUrl,uploadFileName});
    }).catch((err) => {
      console.error('大视频上传失败：', err);
      
      // 详细错误分析
      let errorMessage = '上传失败';
      if (err.statusCode === 403) {
        errorMessage = '权限被拒绝(403)：请检查TOS临时凭证权限或是否过期';
      } else if (err.statusCode === 404) {
        errorMessage = '存储桶不存在(404)：请检查bucket名称是否正确';
      } else if (err.statusCode === 400) {
        errorMessage = '请求参数错误(400)：请检查文件格式或大小';
      } else if (err.code === 'InvalidAccessKeyId') {
        errorMessage = 'AccessKey无效：请检查accessKeyId是否正确';
      } else if (err.code === 'SignatureDoesNotMatch') {
        errorMessage = '签名不匹配：请检查accessKeySecret是否正确';
      } else if (err.code === 'TokenExpired') {
        errorMessage = '临时凭证已过期：请重新获取TOS配置';
      }
      
      reject(new Error(`${errorMessage}: ${err.message || err}`));
    });
  });
}

/**
 * 火山引擎TOS 图片上传方法
 * @param {File} file - 图片文件对象
 * @param {Object} tosConfig - TOS配置
 * @returns {Promise<string>} 上传成功后返回图片的完整访问地址
 */
export const uploadImageToTOS = async function uploadImageToTOS(file, tosConfig) {
  return new Promise((resolve, reject) => {
    console.log('=== TOS图片上传调试信息 ===');
    console.log('文件信息：', {
      name: file.name,
      size: file.size,
      type: file.type
    });

    // 检查必要参数
    if (!tosConfig.accessKeyId || !tosConfig.sessionToken || !tosConfig.region || !tosConfig.bucket) {
      reject(new Error('TOS配置参数不完整'));
      return;
    }

    if (!tosConfig.accessKeySecret && !tosConfig.secretAccessKey) {
      reject(new Error('缺少密钥参数'));
      return;
    }

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      reject(new Error('文件类型错误：请选择图片文件'));
      return;
    }

    // 创建TOS客户端
    const client = new TosClient({
      accessKeyId: tosConfig.accessKeyId,
      accessKeySecret: tosConfig.accessKeySecret || tosConfig.secretAccessKey,
      stsToken: tosConfig.sessionToken,
      region: tosConfig.region,
      bucket: tosConfig.bucket,
    });

    // 生成唯一文件名
    const timeStamp = new Date().getTime();
    const randomNum = Math.floor(Math.random() * 1000000);
    const fileNameSuffix = file.name.substring(file.name.lastIndexOf('.'));
    const uploadFileName = tosConfig.mainPath+`/images/${timeStamp}_${randomNum}${fileNameSuffix}`;

    // 获取正确的Content-Type
    const getContentType = (file) => {
      console.log('开始检测Content-Type...');
      
      // 优先使用文件自带的type
      if (file.type && file.type.startsWith('image/')) {
        console.log('使用文件自带的type:', file.type);
        return file.type;
      }
      
      // 根据文件扩展名推断MIME类型
      const ext = file.name.toLowerCase().split('.').pop();
      console.log('文件扩展名:', ext);
      
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
      
      const detectedType = mimeTypes[ext] || 'application/octet-stream';
      console.log('根据扩展名检测到的类型:', detectedType);
      return detectedType;
    };

    const contentType = getContentType(file);
    console.log('最终设置Content-Type：', contentType);

    // 额外验证：如果仍然不是图片类型，强制设置
    const finalContentType = contentType.startsWith('image/') ? contentType : 'image/jpeg';
    console.log('强制验证后的Content-Type：', finalContentType);

    // 图片直接上传（不分片）
    // 尝试多种方式设置Content-Type
    const uploadParams = {
      bucket: tosConfig.bucket,
      key: uploadFileName,
      body: file,
      contentType: finalContentType,  // 直接设置contentType参数
    };

    client.putObject(uploadParams).then((data) => {
      console.log('图片上传成功：', data);
      const imageUrl = data.url || `${tosConfig.publicDomain}${uploadFileName}`;
      console.log('最终图片地址：', imageUrl);
      resolve({ imageUrl, uploadFileName });
    }).catch((err) => {
      console.error('图片上传失败：', err);
      
      // 详细错误分析
      let errorMessage = '图片上传失败';
      if (err.statusCode === 403) {
        errorMessage = '权限被拒绝(403)：请检查TOS临时凭证权限';
      } else if (err.statusCode === 413) {
        errorMessage = '文件过大(413)：请选择较小的图片文件';
      } else if (err.code === 'InvalidAccessKeyId') {
        errorMessage = 'AccessKey无效：请检查accessKeyId是否正确';
      }
      
      reject(new Error(`${errorMessage}: ${err.message || err}`));
    });
  });
}
