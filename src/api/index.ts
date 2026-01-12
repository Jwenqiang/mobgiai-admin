import { request, uploadFile } from '@/utils/request';
import type { AxiosProgressEvent } from 'axios';

// 通用 GET 请求
export const get = <T = any>(url: string, params?: object): Promise<T> => {
  return request({ url, method: 'get', params });
};

// 通用 POST 请求
export const post = <T = any>(url: string, data?: object): Promise<T> => {
  return request({ url, method: 'post', data });
};

// 图片上传（10分钟超时）
export const uploadImage = (file: File, onProgress?: (e: AxiosProgressEvent) => void) => {
  return uploadFile('/upload/image', file, 600000, onProgress);
};

// 视频上传（不限超时）
export const uploadVideo = (file: File, onProgress?: (e: AxiosProgressEvent) => void) => {
  return uploadFile('/upload/video', file, 0, onProgress);
};

// 业务接口示例
export const login = (data: { username: string; password: string }) => {
  return post('/auth/login', data);
};

export const getUserList = (params: { page: number; size: number }) => {
  return get('/user/list', params);
};