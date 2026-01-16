import axios, {
  type AxiosRequestConfig,
  type AxiosResponse,
  type AxiosError,
  type Canceler,
  type InternalAxiosRequestConfig,
  type AxiosProgressEvent
} from 'axios';
import { ElMessage } from 'element-plus';

// 扩展 AxiosRequestConfig，添加 allowRepeat 配置项
declare module 'axios' {
  export interface AxiosRequestConfig {
    allowRepeat?: boolean; // 是否允许重复请求
  }
}

// 存储请求标识，用于取消请求
const pendingMap = new Map<string, Canceler>();

// 生成请求唯一标识（url + method + 参数）
const getPendingKey = (config: AxiosRequestConfig) => {
  const { url, method, params, data } = config;
  return [url, method, JSON.stringify(params), JSON.stringify(data)].join('&');
};

// 创建 axios 实例
const service = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 60000,
  headers: { 'Content-Type': 'application/json;charset=utf-8' }
});

// 请求拦截器：添加 token + 取消重复请求
service.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // 1. 如果配置了 allowRepeat: true，则跳过重复请求检查
    if (!config.allowRepeat) {
      const pendingKey = getPendingKey(config);
      if (pendingMap.has(pendingKey)) {
        // 给出友好提示
        ElMessage.warning('请求正在处理中，请勿重复提交');
        pendingMap.get(pendingKey)?.(); // 取消之前的请求
        pendingMap.delete(pendingKey);
      }
      // 2. 添加当前请求到 pendingMap
      config.cancelToken = new axios.CancelToken((cancel) => {
        pendingMap.set(pendingKey, cancel);
      });
    }
    // 3. 添加 token
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    ElMessage.error('请求拦截异常');
    return Promise.reject(error);
  }
);

// 响应拦截器：统一处理结果 + 清除 pending 请求
service.interceptors.response.use(
  (response: AxiosResponse) => {
    // 清除当前请求的 pending 标识（仅当未配置 allowRepeat 时）
    if (!response.config.allowRepeat) {
      const pendingKey = getPendingKey(response.config);
      pendingMap.delete(pendingKey);
    }

    // const { code, msg, data } = response.data;
    const resData = response.data;
    // 添加调试日志
    console.log('响应拦截器 - 接口返回:', resData);
    
    // 根据你的后端接口规范调整成功状态码判断
    if (resData.code === 200 || resData.code === 0) {  // 通常后端用0表示成功
      return resData;
    } else {
      // ElMessage.error(resData.msg || '接口请求失败');
      return Promise.reject(new Error(resData.msg));
    }
  },
  (error: AxiosError) => {
    // 清除当前请求的 pending 标识（仅当未配置 allowRepeat 时）
    if (error.config && !error.config.allowRepeat) {
      const pendingKey = getPendingKey(error.config);
      pendingMap.delete(pendingKey);
    }
    // 区分取消请求和其他错误
    if (axios.isCancel(error)) {
      console.log('请求已取消：', error.message);
      return Promise.reject(new Error('请求已取消'));
    }
    // ElMessage.error(error.message || '网络异常');
    return Promise.reject(error);
  }
);

/**
 * 通用请求方法
 * @param config Axios 配置
 */
export const request = <T = any>(config: AxiosRequestConfig): Promise<T> => {
  return service(config);
};

/**
 * 文件上传方法（0 = 不限超时）
 * @param url 接口地址
 * @param file 文件对象
 * @param timeout 超时时间
 * @param onProgress 进度回调
 */
export const uploadFile = <T = any>(
  url: string,
  file: File,
  timeout = 0,
  onProgress?: (e: AxiosProgressEvent) => void
): Promise<T> => {
  const formData = new FormData();
  formData.append('file', file);

  return service({
    url,
    method: 'post',
    data: formData,
    timeout,
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: onProgress
  });
};

/**
 * 取消所有待处理请求（用于页面跳转/组件卸载）
 */
export const cancelAllPending = () => {
  pendingMap.forEach((cancel) => cancel('页面跳转，取消所有请求'));
  pendingMap.clear();
};

export default service;