# 生成接口错误处理修复

## 问题描述

1. **生成接口返回错误信息提示不正确**：当接口返回错误（如"处理中的任务过多，请稍后"）时，界面没有正确显示错误信息
2. **生成接口异常时，任务仍被添加到队列**：当接口调用失败时，任务应该从 `generationTasks` 中移除，不应该显示在"正在生成"队列中

## 修复内容

### 1. 修改 `src/utils/request.ts`

**响应拦截器 - 错误响应处理**：
- 当接口返回非成功状态码时，显示错误提示并返回包含完整错误信息的 rejected Promise
- 确保错误信息（`msg`）能正确传递给调用方

```typescript
// 响应拦截器
service.interceptors.response.use(
  (response: AxiosResponse) => {
    // ... 省略其他代码
    
    if (resData.code === 200 || resData.code === 0) {
      return resData;
    } else {
      // 显示错误提示
      const errorMsg = resData.msg || '接口请求失败';
      ElMessage.error(errorMsg);
      // 返回包含错误信息的 rejected Promise
      return Promise.reject({ msg: errorMsg, code: resData.code, data: resData });
    }
  },
  (error: AxiosError) => {
    // ... 省略其他代码
    
    // 处理网络错误
    const errorMsg = error.message || '网络异常';
    ElMessage.error(errorMsg);
    return Promise.reject({ msg: errorMsg, error });
  }
);
```

### 2. 修改 `src/views/ImageGenerateView.vue`

**sendGenerateRequest 函数**：
- 在 catch 块中，从 `generationTasks` 中移除失败的任务
- 正确提取并显示错误信息
- 重新抛出错误，让调用方知道失败了
- 将成功提示移到接口调用成功后显示

```typescript
const sendGenerateRequest = async (task: GenerationObj, taskId: string) => {
  try {
    const response = await postAIGenerate(task)
    console.log('生成请求成功:', response)
    
    if (response && response.data && response.data.userInputId) {
      const userInputId = response.data.userInputId
      const generationTask = generationTasks.value.find(t => t.id === taskId)
      if (generationTask) {
        generationTask.userInputId = userInputId
      }
      
      pendingUserInputIds.value.add(userInputId)
      startPolling()
      
      // 显示成功提示
      ElMessage.success('已添加到生成队列')
    }
    
    return response
  } catch (error: any) {
    console.error('生成请求失败:', error)
    
    // 从任务列表中移除失败的任务
    const taskIndex = generationTasks.value.findIndex(t => t.id === taskId)
    if (taskIndex > -1) {
      generationTasks.value.splice(taskIndex, 1)
    }
    
    // 显示错误信息
    const errorMsg = error?.msg || error?.message || '生成请求失败'
    ElMessage.error(errorMsg)
    
    // 重新抛出错误
    throw error
  }
}
```

**handleGenerate 函数**：
- 移除了原来在函数末尾的 `ElMessage.success('已添加到生成队列')`
- 成功提示现在在 `sendGenerateRequest` 中，只有接口调用成功时才显示

```typescript
const handleGenerate = async () => {
  // ... 省略验证代码
  
  // 添加到任务列表
  generationTasks.value.push(newTask)
  
  // 滚动到顶部
  setTimeout(() => {
    scrollToTop()
  }, 100)
  
  // 组装请求参数
  const requestTask = buildGenerateRequestTask()
  
  // 调用生成接口，传入 taskId
  await sendGenerateRequest(requestTask, taskId)
  // 移除了这里的 ElMessage.success('已添加到生成队列')
}
```

## 修复效果

1. ✅ 当接口返回错误时（如"处理中的任务过多，请稍后"），会正确显示错误信息
2. ✅ 接口调用失败时，任务会从"正在生成"队列中移除，不会显示在结果页
3. ✅ 只有接口调用成功时，才会显示"已添加到生成队列"的提示
4. ✅ 错误信息能够正确从后端传递到前端界面

## 测试建议

1. 测试正常生成流程，确认成功提示正常显示
2. 测试接口返回错误的情况（如任务过多），确认错误信息正确显示且任务不在队列中
3. 测试网络异常情况，确认错误处理正常
