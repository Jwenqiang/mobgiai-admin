import { get,post } from '@/api/index';
//return最后的参数true表示允许接口重复请求
//获取资产列表
export const getAssetsResults = (params?:object) => {
  return get('/api/v1/user_asset/list', params, true);
}
//删除接口
export const deleteGenerate = (data:object) => {
  return post('/api/v1/user_asset/delete', data);
}
//预览详情接口
export const getAssetDetail = (params?:object) => {
  return get(`/api/v1/user_asset/detail`, params);
}