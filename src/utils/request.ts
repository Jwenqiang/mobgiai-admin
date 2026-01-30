import axios, {
  type AxiosRequestConfig,
  type AxiosResponse,
  type AxiosError,
  type Canceler,
  type InternalAxiosRequestConfig,
  type AxiosProgressEvent
} from 'axios';
import { ElMessage } from 'element-plus';
import router from '@/router';
import { useAuthStore } from '@/stores/auth';

// 扩展 AxiosRequestConfig，添加 allowRepeat 配置项
declare module 'axios' {
  export interface AxiosRequestConfig {
    allowRepeat?: boolean; // 是否允许重复请求
  }
}

// 自定义错误类型
interface CustomError {
  msg: string;
  code?: number | string;
  data?: unknown;
  isDuplicate?: boolean;
  cancelled?: boolean;
  authError?: boolean;
  config?: AxiosRequestConfig;
  response?: {
    status: number;
    statusText: string;
    data?: {
      msg?: string;
      [key: string]: unknown;
    };
  };
  message?: string;
}

// 存储请求标识，用于取消请求
const pendingMap = new Map<string, Canceler>();

// 生成请求唯一标识（url + method + 参数）
const getPendingKey = (config: AxiosRequestConfig) => {
  const { url, method, params, data } = config;
  // 确保 data 统一处理：如果已经是字符串就直接用，否则序列化
  let dataStr = '';
  if (data) {
    dataStr = typeof data === 'string' ? data : JSON.stringify(data);
  }
  return [url, method, JSON.stringify(params), dataStr].join('&');
};

// 处理授权失败
let isHandlingAuthError = false; // 防止重复处理
const handleAuthError = () => {
  if (isHandlingAuthError) return;
  isHandlingAuthError = true;
  
  // 取消所有待处理的请求
  pendingMap.forEach((cancel) => cancel('授权失败，取消所有请求'));
  pendingMap.clear();
  
  // 清空登录信息
  const authStore = useAuthStore();
  authStore.clearAuth();
  
  // 提示用户（只显示一次）
  ElMessage.error('登录已过期，请重新登录');
  
  // 跳转到登录页
  router.push({
    path: '/login',
    query: { redirect: router.currentRoute.value.fullPath }
  }).finally(() => {
    // 重置标志，允许下次处理
    setTimeout(() => {
      isHandlingAuthError = false;
    }, 1000);
  });
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
        // 静默阻止重复请求，不显示提示
        return Promise.reject({ msg: '请求正在处理中，请勿重复提交', isDuplicate: true }) as Promise<InternalAxiosRequestConfig>;
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

    const resData = response.data;
    
    // 根据你的后端接口规范调整成功状态码判断
    if (resData.code === 200 || resData.code === 0) {
      return resData;
    } else {
      // 授权失败处理（401 未授权 或 403 禁止访问）
      if (resData.code === 401 || resData.code === 403 || resData.code === 200003) {
        handleAuthError();
        return Promise.reject({ msg: '授权失败', code: resData.code, authError: true });
      }
      // 业务错误：返回统一格式
      return Promise.reject({ 
        msg: resData.msg || '接口请求失败', 
        code: resData.code, 
        data: resData.data // 只返回 data 字段，不返回整个 resData
      });
    }
  },
  (error: AxiosError | CustomError) => {
    // 清除当前请求的 pending 标识（仅当未配置 allowRepeat 时）
    if (error.config && !error.config.allowRepeat) {
      const pendingKey = getPendingKey(error.config);
      pendingMap.delete(pendingKey);
    }
    
    // 如果是重复请求或已经格式化的错误，直接返回
    if ('isDuplicate' in error && error.isDuplicate) {
      return Promise.reject(error);
    }
    if ('cancelled' in error && error.cancelled) {
      return Promise.reject(error);
    }
    if ('authError' in error && error.authError) {
      return Promise.reject(error);
    }
    
    // 区分取消请求和其他错误
    if (axios.isCancel(error)) {
      return Promise.reject({ msg: '请求已取消', cancelled: true });
    }
    
    // 处理 HTTP 状态码错误（401/403）
    if ('response' in error && error.response) {
      const status = error.response.status;
      if (status === 401 || status === 403 || status === 200003) {
        handleAuthError();
        // 授权失败时不再显示额外的错误提示
        return Promise.reject({ msg: '授权失败', code: status, authError: true });
      }
      
      // 其他 HTTP 错误
      const responseData = error.response.data || {};
      const errorMsg = (typeof responseData === 'object' && 'msg' in responseData ? responseData.msg : null) || error.response.statusText || '请求失败';
      return Promise.reject({ 
        msg: errorMsg, 
        code: status,
        data: error.response.data 
      });
    }
    
    // 处理网络错误（没有 response 的情况，如超时、网络断开等）
    if (!isHandlingAuthError) {
      // const errorMsg = error.message || '网络异常';
      // ElMessage.error(errorMsg);
    }
    
    // 统一返回格式，不再包装原始 error 对象
    const errorMessage = 'message' in error ? error.message : '网络异常';
    const errorCode = 'code' in error ? error.code : 'NETWORK_ERROR';
    return Promise.reject({ 
      msg: errorMessage || '网络异常',
      code: errorCode || 'NETWORK_ERROR'
    });
  }
);

/**
 * 通用请求方法
 * @param config Axios 配置
 */
export const request = <T = unknown>(config: AxiosRequestConfig): Promise<T> => {
  return service(config);
};

/**
 * 文件上传方法（0 = 不限超时）
 * @param url 接口地址
 * @param file 文件对象
 * @param timeout 超时时间
 * @param onProgress 进度回调
 */
export const uploadFile = <T = unknown>(
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