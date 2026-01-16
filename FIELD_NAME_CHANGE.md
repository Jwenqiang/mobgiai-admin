# 字段名称修改说明

## 修改内容

将生成接口返回的字段 `inputId` 统一改为 `userInputId`

## 修改原因

为了与后端接口字段命名保持一致，提高代码可读性和维护性。

## 修改范围

### 文件：`src/views/ImageGenerateView.vue`

#### 1. 接口定义
```typescript
// 修改前
interface GenerationTask {
  // ...
  inputId?: number // 添加 inputId 字段
}

// 修改后
interface GenerationTask {
  // ...
  userInputId?: number // 添加 userInputId 字段
}
```

#### 2. 状态变量
```typescript
// 修改前
const pendingInputIds = ref<Set<number>>(new Set()) // 待轮询的 inputId 集合

// 修改后
const pendingUserInputIds = ref<Set<number>>(new Set()) // 待轮询的 userInputId 集合
```

#### 3. 生成请求处理
```typescript
// 修改前
const sendGenerateRequest = async (task: GenerationObj, taskId: string) => {
  // ...
  if (response && response.data && response.data.inputId) {
    const inputId = response.data.inputId
    const generationTask = generationTasks.value.find(t => t.id === taskId)
    if (generationTask) {
      generationTask.inputId = inputId
    }
    pendingInputIds.value.add(inputId)
    // ...
  }
}

// 修改后
const sendGenerateRequest = async (task: GenerationObj, taskId: string) => {
  // ...
  if (response && response.data && response.data.userInputId) {
    const userInputId = response.data.userInputId
    const generationTask = generationTasks.value.find(t => t.id === taskId)
    if (generationTask) {
      generationTask.userInputId = userInputId
    }
    pendingUserInputIds.value.add(userInputId)
    // ...
  }
}
```

#### 4. 轮询启动检查
```typescript
// 修改前
const startPolling = () => {
  if (pollingTimer.value) return
  if (pendingInputIds.value.size === 0) return
  // ...
}

// 修改后
const startPolling = () => {
  if (pollingTimer.value) return
  if (pendingUserInputIds.value.size === 0) return
  // ...
}
```

#### 5. 轮询状态查询
```typescript
// 修改前
const pollGenerateStatus = async () => {
  if (pendingInputIds.value.size === 0) {
    stopPolling()
    return
  }
  
  const userInputIds = Array.from(pendingInputIds.value).join(',')
  const response = await getGenerateStatus({ userInputIds })
  
  for (const statusItem of statusList) {
    const inputId = statusItem.userInputId
    
    if (statusItem.status === 2 && statusItem.assets && statusItem.assets.length > 0) {
      pendingInputIds.value.delete(inputId)
      const taskIndex = generationTasks.value.findIndex(t => t.inputId === inputId)
      // ...
      const newResult: HistoryResult = {
        id: statusItem.id || inputId,
        // ...
      }
    }
  }
  
  if (pendingInputIds.value.size === 0) {
    stopPolling()
  }
}

// 修改后
const pollGenerateStatus = async () => {
  if (pendingUserInputIds.value.size === 0) {
    stopPolling()
    return
  }
  
  const userInputIds = Array.from(pendingUserInputIds.value).join(',')
  const response = await getGenerateStatus({ userInputIds })
  
  for (const statusItem of statusList) {
    const userInputId = statusItem.userInputId
    
    if (statusItem.status === 2 && statusItem.assets && statusItem.assets.length > 0) {
      pendingUserInputIds.value.delete(userInputId)
      const taskIndex = generationTasks.value.findIndex(t => t.userInputId === userInputId)
      // ...
      const newResult: HistoryResult = {
        id: statusItem.id || userInputId,
        // ...
      }
    }
  }
  
  if (pendingUserInputIds.value.size === 0) {
    stopPolling()
  }
}
```

## 修改详情

### 变量名修改
| 修改前 | 修改后 | 说明 |
|--------|--------|------|
| `inputId` | `userInputId` | 接口字段名 |
| `pendingInputIds` | `pendingUserInputIds` | 待轮询的ID集合 |
| `generationTask.inputId` | `generationTask.userInputId` | 任务对象中的ID字段 |
| `t.inputId` | `t.userInputId` | 查找任务时的字段名 |

### 修改位置统计
- 接口定义：1处
- 状态变量：1处
- 生成请求处理：4处
- 轮询启动检查：1处
- 轮询状态查询：7处

**总计：14处修改**

## 影响范围

### 前端
- ✅ `ImageGenerateView.vue` - 图片/视频生成页面
- ✅ 生成任务管理
- ✅ 轮询状态查询

### 后端接口
需要确保后端接口返回的字段名为 `userInputId`：

#### 生成接口响应
```json
{
  "code": 200,
  "data": {
    "userInputId": 12345  // 必须使用 userInputId
  }
}
```

#### 状态查询接口响应
```json
{
  "code": 200,
  "data": {
    "list": [
      {
        "userInputId": 12345,  // 必须使用 userInputId
        "status": 2,
        "assets": [...]
      }
    ]
  }
}
```

## 测试建议

### 1. 生成请求测试
- [ ] 发起图片生成请求
- [ ] 检查响应中的 `userInputId` 是否正确保存
- [ ] 验证任务对象中的 `userInputId` 字段

### 2. 轮询测试
- [ ] 验证轮询请求参数中的 `userInputIds` 格式
- [ ] 检查轮询响应中的 `userInputId` 是否正确匹配
- [ ] 验证任务完成后是否正确从轮询列表中移除

### 3. 控制台日志检查
```javascript
// 生成请求成功后
console.log('生成请求成功:', response)
// 应该看到 response.data.userInputId

// 轮询状态查询
console.log('轮询参数:', { userInputIds })
// 应该看到逗号分隔的 userInputId 列表

// 任务匹配
console.log('查找任务:', generationTasks.value)
// 应该看到任务对象中有 userInputId 字段
```

### 4. 边界情况测试
- [ ] 后端返回的字段名不是 `userInputId` 时的处理
- [ ] 多个任务同时生成时的 ID 管理
- [ ] 轮询过程中任务被手动删除的情况

## 兼容性说明

### 向后兼容
如果后端暂时还在使用 `inputId` 字段名，需要：

1. **临时兼容方案**（不推荐）：
```typescript
// 同时支持两种字段名
if (response && response.data) {
  const userInputId = response.data.userInputId || response.data.inputId
  if (userInputId) {
    // 处理逻辑
  }
}
```

2. **推荐方案**：
   - 前后端同步修改
   - 统一使用 `userInputId`
   - 避免字段名不一致导致的问题

## 注意事项

1. **字段名一致性**
   - 前端使用 `userInputId`
   - 后端返回 `userInputId`
   - 数据库字段可以是 `user_input_id`（遵循各自命名规范）

2. **类型安全**
   - TypeScript 接口已更新
   - 编译时会检查字段名
   - 避免运行时错误

3. **调试信息**
   - 保留了详细的控制台日志
   - 便于排查字段名相关问题

4. **文档更新**
   - API 文档需要同步更新
   - 接口说明需要使用新字段名

## 回滚方案

如果需要回滚到旧的字段名，执行以下替换：

```bash
# 在 ImageGenerateView.vue 中
userInputId → inputId
pendingUserInputIds → pendingInputIds
```

或者使用 Git 回滚：
```bash
git checkout HEAD -- src/views/ImageGenerateView.vue
```

## 相关文档

- [轮询实现说明](./POLLING_IMPLEMENTATION.md)
- [重新编辑功能](./EDIT_GENERATION_FEATURE.md)
- [视频上传进度](./VIDEO_UPLOAD_PROGRESS.md)

---

**修改日期**: 2024-01-16  
**修改人**: AI Assistant  
**审核状态**: 待审核
