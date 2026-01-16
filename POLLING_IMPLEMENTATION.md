# 生成任务轮询实现说明

## 功能概述
实现了图片/视频生成任务的状态轮询机制，确保生成任务完成后自动更新列表。

## 实现细节

### 1. 数据结构修改

#### GenerationTask 接口
```typescript
interface GenerationTask {
  id: string
  prompt: string
  model: Model
  size: Size
  resolution: Resolution
  imageCount: ImageCount
  aspectRatio?: Size
  referenceImages: UploadFile[]
  status: 'generating' | 'completed' | 'failed'
  progress: number
  progressText: string
  images: ImageResult[]
  createdAt: number
  inputId?: number // 新增：后端返回的任务ID
}
```

#### 新增状态变量
```typescript
const pollingTimer = ref<number | null>(null) // 轮询定时器
const pendingInputIds = ref<Set<number>>(new Set()) // 待轮询的 inputId 集合
```

### 2. 核心功能

#### 2.1 提交生成请求
```typescript
const sendGenerateRequest = async (task: GenerationObj, taskId: string) => {
  const response = await postAIGenerate(task)
  
  // 保存后端返回的 inputId
  if (response && response.data && response.data.id) {
    const inputId = response.data.id
    const generationTask = generationTasks.value.find(t => t.id === taskId)
    if (generationTask) {
      generationTask.inputId = inputId
    }
    
    // 添加到待轮询集合
    pendingInputIds.value.add(inputId)
    
    // 启动轮询
    startPolling()
  }
}
```

#### 2.2 启动轮询
```typescript
const startPolling = () => {
  // 防止重复启动
  if (pollingTimer.value) return
  
  // 没有待轮询任务时不启动
  if (pendingInputIds.value.size === 0) return
  
  // 每10秒轮询一次
  pollingTimer.value = window.setInterval(async () => {
    await pollGenerateStatus()
  }, 10000)
}
```

#### 2.3 轮询状态
```typescript
const pollGenerateStatus = async () => {
  if (pendingInputIds.value.size === 0) {
    stopPolling()
    return
  }
  
  // 将 Set 转换为逗号分隔的字符串
  const userInputIds = Array.from(pendingInputIds.value).join(',')
  
  // 调用状态查询接口
  const response = await getGenerateStatus({ userInputIds })
  
  if (response && response.data && response.data.list) {
    const statusList = response.data.list
    
    // 遍历返回的状态列表
    for (const statusItem of statusList) {
      const inputId = statusItem.userInputId
      
      // 如果状态为成功（status === 2）且有资源数据
      if (statusItem.status === 2 && statusItem.assets && statusItem.assets.length > 0) {
        // 从待轮询列表中移除
        pendingInputIds.value.delete(inputId)
        
        // 从任务列表中移除对应的任务
        const taskIndex = generationTasks.value.findIndex(t => t.inputId === inputId)
        if (taskIndex > -1) {
          generationTasks.value.splice(taskIndex, 1)
        }
      }
    }
    
    // 刷新列表
    if (pendingInputIds.value.size === 0) {
      stopPolling()
    }
    await fetchGenerateResults(1, false)
  }
}
```

#### 2.4 停止轮询
```typescript
const stopPolling = () => {
  if (pollingTimer.value) {
    clearInterval(pollingTimer.value)
    pollingTimer.value = null
  }
}
```

### 3. 生命周期管理

在组件卸载时清理定时器：
```typescript
onUnmounted(() => {
  // ... 其他清理代码
  
  // 清理轮询定时器
  stopPolling()
})
```

## 工作流程

1. **用户提交生成请求**
   - 调用 `handleGenerate()` 创建任务
   - 调用 `sendGenerateRequest()` 提交到后端

2. **保存 inputId**
   - 后端返回 `response.data.id`
   - 保存到任务的 `inputId` 字段
   - 添加到 `pendingInputIds` 集合

3. **启动轮询**
   - 检查是否已有轮询在运行
   - 启动 10 秒间隔的定时器

4. **轮询状态**
   - 将所有待查询的 inputId 组成逗号分隔字符串
   - 调用 `getGenerateStatus({ userInputIds })`
   - 检查返回的状态列表

5. **处理完成的任务**
   - 状态为成功（status === 2）且有资源数据时：
     - 从 `pendingInputIds` 中移除
     - 从 `generationTasks` 中移除
     - 刷新列表

6. **停止轮询**
   - 当 `pendingInputIds` 为空时自动停止
   - 组件卸载时强制停止

## API 接口

### getGenerateStatus
```typescript
// 请求参数
{
  userInputIds: string // 逗号分隔的 inputId 字符串，如 "123,456,789"
}

// 响应数据
{
  data: {
    list: [
      {
        userInputId: number,    // 任务ID
        type: number,           // 类型：1=图片，2=视频
        status: number,         // 状态：2 表示成功
        statusText: string,     // 状态文本
        jobId: string,          // 作业ID
        assets: [               // 生成的资源数组
          {
            id: number,
            type: number,       // 1=图片，2=视频
            coverUri: string,
            materialUri: string,
            coverUrl: string,
            materialUrl: string,
            createTime: string
          }
        ],
        createTime: string      // 创建时间
      }
    ]
  }
}
```

## 注意事项

1. **防止重复轮询**：使用 `pollingTimer` 检查是否已有轮询在运行
2. **自动停止**：当没有待轮询任务时自动停止定时器
3. **资源清理**：组件卸载时清理定时器，防止内存泄漏
4. **批量查询**：使用逗号分隔的字符串一次查询多个任务状态
5. **实时更新**：任务完成后立即刷新列表，提供良好的用户体验
