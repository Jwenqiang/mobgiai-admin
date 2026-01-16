# 再次生成功能实现

## 功能说明

点击"再次生成"按钮时，会调用 `postAIGenerateRetry` 接口，将结果的 id 传递给接口的 `userInputId` 参数，然后执行轮询逻辑获取生成结果。

## 实现细节

### 1. 接口定义

在 `src/api/generate.ts` 中已定义：

```typescript
// 再次生成接口
export const postAIGenerateRetry = (data:object) => {
  return post('/api/v1/user_input/retry', data);
}
```

### 2. 核心逻辑

修改了 `regenerateFromHistory` 函数，实现以下流程：

1. **创建生成任务**：在任务队列中添加一个新的生成任务，显示"正在重新生成..."状态
2. **调用重试接口**：调用 `postAIGenerateRetry({ userInputId: result.id })`
3. **获取 userInputId**：从接口响应中获取新的 `userInputId`
4. **添加到轮询队列**：将 `userInputId` 添加到 `pendingUserInputIds` 集合
5. **启动轮询**：调用 `startPolling()` 开始轮询任务状态
6. **更新结果**：轮询完成后，自动将结果插入到列表头部

### 3. 轮询机制

- 轮询间隔：10秒
- 轮询接口：`getGenerateStatus({ userInputIds })`
- 完成条件：`status === 2` 且有资源数据
- 自动停止：所有任务完成后自动停止轮询

### 4. 用户体验

- 点击"再次生成"后，任务立即显示在队列顶部
- 显示"正在重新生成..."状态
- 生成完成后，结果自动插入到列表头部
- 页面自动滚动到顶部查看新结果
- 失败时显示错误提示并移除任务

## 使用示例

用户在历史记录中点击"再次生成"按钮：

```vue
<el-button class="action-button regenerate-button" @click="regenerateFromHistory(result)">
  <el-icon class="button-icon"><Refresh /></el-icon>
  <span>再次生成</span>
</el-button>
```

## 注意事项

1. 会检查并发任务数限制（`maxConcurrentTasks`）
2. 失败时会自动从任务队列中移除
3. 支持同时多个再次生成任务
4. 轮询状态会自动管理，无需手动干预
