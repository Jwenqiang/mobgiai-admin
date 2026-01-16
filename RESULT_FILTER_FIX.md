# 结果列表过滤修复说明

## 问题描述

生成时如果后端没有立即返回成功数据，前端不应该在结果页添加进行中的任务。

## 问题原因

原来的 `fetchGenerateResults` 函数会获取所有状态的任务（包括进行中的任务），导致：
1. 进行中的任务会同时出现在两个地方：
   - `generationTasks` 数组（显示"生成中"卡片）
   - `historyResults` 数组（结果列表）
2. 造成重复显示和混乱

## 解决方案

### 1. 修改结果列表过滤逻辑

修改 `fetchGenerateResults` 函数，添加过滤条件，只显示已完成的任务（status === 2）：

```typescript
const formattedResults: HistoryResult[] = list
  .filter((item: { status: number }) => item.status === 2) // 只显示已完成的任务
  .map((item: {
    // ... 映射逻辑
  })
```

### 2. 更新轮询状态处理逻辑

根据新的 API 数据结构，修改 `pollGenerateStatus` 函数：

**新的数据结构：**
```typescript
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
            type: number,
            coverUri: string,
            materialUri: string,
            coverUrl: string,
            materialUrl: string,
            createTime: string
          }
        ],
        createTime: string
      }
    ]
  }
}
```

**关键修改：**
- 从 `response.data` 改为 `response.data.list`
- 从 `statusItem.id` 改为 `statusItem.userInputId`
- 增加 `assets` 数组的检查，确保有生成的资源才认为任务完成

```typescript
if (response && response.data && response.data.list) {
  const statusList = response.data.list
  
  for (const statusItem of statusList) {
    const inputId = statusItem.userInputId
    
    // 状态为成功且有资源数据
    if (statusItem.status === 2 && statusItem.assets && statusItem.assets.length > 0) {
      pendingInputIds.value.delete(inputId)
      // 移除任务...
    }
  }
}
```

## 工作流程

1. **用户提交生成请求**
   - 创建任务并添加到 `generationTasks` 数组
   - 显示"生成中"卡片

2. **轮询任务状态**
   - 每10秒查询一次任务状态
   - 当任务完成（status === 2 且有 assets）时：
     - 从 `generationTasks` 中移除
     - 刷新 `historyResults` 列表

3. **结果列表显示**
   - 只显示已完成的任务（status === 2）
   - 不显示进行中的任务
   - 避免重复显示

## 修改文件

- `mobgiai-admin/src/views/ImageGenerateView.vue`
  - 修改 `fetchGenerateResults` 函数：添加 `.filter((item) => item.status === 2)` 过滤条件
  - 修改 `pollGenerateStatus` 函数：适配新的 API 数据结构
- `mobgiai-admin/POLLING_IMPLEMENTATION.md`
  - 更新 API 接口文档
  - 更新轮询状态处理示例代码

## 测试建议

1. 提交一个生成任务
2. 确认只在顶部显示"生成中"卡片
3. 确认结果列表中不显示该任务
4. 等待任务完成
5. 确认"生成中"卡片消失
6. 确认结果列表中出现完成的任务（包含 assets 资源）
