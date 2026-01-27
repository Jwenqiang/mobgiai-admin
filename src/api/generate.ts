import { get,post } from '@/api/index';
//true表示允许接口重复请求
// 获取模型配置接口
export const getImgModelConfig = (params?:object) => {
  return get('/api/v1/ai/options', params, true);
}
//获取生成结果列表
export const getGenerateResults = (params?:object) => {
  return get('/api/v1/user_input/list', params, true);
}
//AI生成接口 不允许重复提交
export const postAIGenerate = (data:object) => {
  return post('/api/v1/user_input/generate', data);
}
//查询提交任务的id 轮询接口 不设超时时间
export const getGenerateStatus = (params:object) => {
  return get('/api/v1/user_input/status', params, true, 0);
}
//再次生成接口
export const postAIGenerateRetry = (data:object) => {
  return post('/api/v1/user_input/retry', data);
}
//删除接口
export const deleteGenerate = (data:object) => {
  return post('/api/v1/user_input/delete', data);
}