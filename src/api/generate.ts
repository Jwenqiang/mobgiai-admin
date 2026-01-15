import { get,post } from '@/api/index';
// 获取模型配置接口
export const getImgModelConfig = (params?:object) => {
  return get('/api/v1/ai/driver/options', params);
}
//获取生成结果列表
export const getGenerateResults = (params?:object) => {
  return get('/api/v1/user_input/list', params);
}