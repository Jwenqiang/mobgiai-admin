# 生成结果轮询功能说明

## 功能概述
当生成结果列表中存在 `status === 1`（生成中）的记录时，系统会自动启动轮询机制，每 10 秒查询一次这些记录的状态。当状态变为 `status === 2`（已完成）时，会自动替换列表中对应的记录并显示完整的生成结果。

## 实现细节

### 1. 数据结构
- `pendingResultIds`: 存储历史记录中 `status === 1` 的记录 ID
- `pendingUserInputIds`: 存储新生成任务的 userInputId
- `pollingTimer`: 轮询定时器

### 2. 工作流程

#### 加载列表时
1. 调用 `fetchGenerateResults()` 获取生成结果列表
2. 检查返回的数据中是否有 `status === 1` 的记录
3. 如果有，将这些记录的 ID 添加到 `pendingResultIds` 集合
4. 启动轮询 `startPolling()`

#### 轮询过程
1. 每 10 秒执行一次 `pollGenerateStatus()`
2. 合并 `pendingResultIds` 和 `pendingUserInputIds` 中的所有 ID
3. 调用 `getGenerateStatus()` API 查询这些 ID 的最新状态
4. 根据返回的状态进行处理：

   **状态为 2（已完成）：**
   - 如果是历史记录（在 `pendingResultIds` 中）：
     - 在 `historyResults` 中找到对应记录
     - 用新数据替换原记录（包括 assets、tags 等完整信息）
     - 显示成功提示
   - 如果是新生成任务（在 `pendingUserInputIds` 中）：
     - 从任务列表中移除
     - 将完成的结果添加到列表底部
     - 滚动到底部显示新结果

   **状态为 3（失败）：**
   - 从待轮询列表中移除
   - 更新列表中的状态为失败
   - 显示错误提示

5. 当所有待轮询的 ID 都处理完成后，自动停止轮询

### 3. 关键函数

#### `fetchGenerateResults(page, append)`
- 获取生成结果列表
- 检测 `status === 1` 的记录并启动轮询

#### `startPolling()`
- 启动轮询定时器
- 每 10 秒调用一次 `pollGenerateStatus()`

#### `pollGenerateStatus()`
- 查询所有待轮询 ID 的状态
- 根据状态更新列表数据
- 处理完成后自动停止轮询

#### `stopPolling()`
- 停止轮询定时器
- 清理资源

## 状态说明
- `status === 0`: 排队中
- `status === 1`: 生成中（会触发轮询）
- `status === 2`: 已完成
- `status === 3`: 生成失败

## 用户体验
1. 用户打开页面，看到列表中有"生成中"的记录
2. 系统自动在后台轮询这些记录的状态
3. 当生成完成时，记录会自动更新为完整的结果（包括图片/视频）
4. 用户无需手动刷新页面即可看到最新结果

## 注意事项
- 轮询间隔为 10 秒，可根据需要调整
- 轮询会在所有待处理记录完成后自动停止
- 组件卸载时会自动清理轮询定时器
- 支持同时轮询历史记录和新生成任务
