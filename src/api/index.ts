import { request, uploadFile } from '@/utils/request';
import type { AxiosProgressEvent } from 'axios';
import axios from 'axios';

// 判断是否为完整URL
const isFullUrl = (url: string): boolean => {
  return /^https?:\/\//.test(url);
};

// 创建独立的axios实例用于全域名请求
const createFullUrlRequest = (fullUrl: string) => {
  const instance = axios.create({
    timeout: 60000,
    headers: { 'Content-Type': 'application/json;charset=utf-8' }
  });
  
  // 添加token
  instance.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });
  
  return instance({ url: fullUrl, method: 'get' });
};

// 通用 GET 请求
export const get = <T = unknown>(url: string, params?: object, allowRepeat?: boolean, timeout?: number): Promise<T> => {
  // 如果是完整URL，使用独立请求
  if (isFullUrl(url)) {
    return createFullUrlRequest(url) as Promise<T>;
  }
  return request({ url, method: 'get', params, allowRepeat, timeout });
};

// 通用 POST 请求
export const post = <T = unknown>(url: string, data?: object, allowRepeat?: boolean): Promise<T> => {
  // 如果是完整URL，使用独立的axios实例
  if (isFullUrl(url)) {
    const instance = axios.create({
      timeout: 60000,
      headers: { 'Content-Type': 'application/json;charset=utf-8' }
    });
    
    instance.interceptors.request.use((config) => {
      const token = localStorage.getItem('token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
    
    return instance({ url, method: 'post', data }) as Promise<T>;
  }
  return request({ url, method: 'post', data, allowRepeat });
};

// 图片上传（10分钟超时）
// export const uploadImage = (file: File, onProgress?: (e: AxiosProgressEvent) => void) => {
//   return uploadFile('/upload/image', file, 600000, onProgress);
// };

// // 视频上传（不限超时）
// export const uploadVideo = (file: File, onProgress?: (e: AxiosProgressEvent) => void) => {
//   return uploadFile('/upload/video', file, 0, onProgress);
// };

// 登录接口
export const login = (data: { mobile: string; code: string }) => {
  return post('/api/v1/user_auth/login', data);
};
// 登出接口
export const logout = () => {
  return get('/api/v1/user_/logout');
};
// 验证码接口
export const getCode = (data: { mobile: string }) => {
  return post('/api/v1/misc/send_sms', data);
};

export const getUserList = (params: { page: number; size: number }) => {
  return get('/user/list', params);
};

// 导入TOS类型
import type { TosTokenResponse as ToSConfig } from '@/services/tos'

// TOS配置接口类型定义（API响应格式）
interface TosApiResponse {
  code?: number;
  data?: ToSConfig;
  message?: string;
}

// TOS获取配置接口
export const getTosToken = async (): Promise<ToSConfig> => {
  try {
    console.log('开始请求TOS配置...');
    const response = await get<TosApiResponse>('/api/v1/misc/sts_token');
    console.log('TOS配置API响应:', response);
    
    // 检查响应数据结构
    if (!response) {
      throw new Error('TOS配置API返回空数据');
    }
    
    // 如果后端返回的数据有特定结构，需要适配
    // 例如：{ code: 200, data: { accessKeyId: '...', ... }, message: 'success' }
    const tosConfig = (response as any).data || response;
    
    if (!tosConfig || !tosConfig.accessKeyId) {
      throw new Error('TOS配置数据为空或格式不正确');
    }
    
    console.log('解析后的TOS配置:', tosConfig);
    return tosConfig as ToSConfig;
  } catch (error) {
    console.error('获取TOS配置失败:', error);
    throw error;
  }
};