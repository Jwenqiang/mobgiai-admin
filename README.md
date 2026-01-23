# MobgiAI - AI内容生成平台

一个基于 Vue 3 + Element Plus + TypeScript + Vite 构建的现代化 AI 内容生成平台，支持图片生成、视频生成和资产管理。

## ✨ 功能特性

### 核心功能
- 🔐 **手机号验证码登录** - 安全便捷的登录系统，支持短信验证码
- 🎨 **AI图片生成** - 支持多种主流图片生成模型（Seedream 4.5/4.0、可灵 O1/2.0）
- 🎬 **AI视频生成** - 支持多种视频生成模型（Seedance 1.5/1.0 Pro、可灵 O1/2.6）
- 💼 **资产管理** - 按日期分组展示，支持图片/视频分类查看
- 📥 **智能下载** - 优化的文件下载功能，支持单个和批量下载
- 📱 **响应式设计** - 完美适配桌面端、平板和移动端

### 高级特性
- 🖼️ **参考图片上传** - 支持最多5张参考图片，实时预览和管理
- 🎥 **多模态视频生成** - 支持首尾帧、多模态参考、视频编辑等多种模式
- 🔄 **智能模型切换** - 生成方式与模型自动联动，参数动态调整
- ⚡ **实时任务管理** - 支持多任务并发，实时显示生成进度
- 🎯 **精细参数控制** - 比例、分辨率、时长、音频等全方位配置
- 🌐 **TOS云存储集成** - 火山引擎TOS对象存储，安全可靠
- 🔄 **智能轮询机制** - 自动轮询生成中的任务，完成后自动更新结果
- 🖼️ **多图预览切换** - 支持左右切换查看同一结果的多张图片，键盘快捷键操作

## 🛠️ 技术栈

| 技术 | 版本 | 说明 |
|------|------|------|
| Vue | 3.5.26 | 渐进式 JavaScript 框架 |
| TypeScript | 5.9.3 | JavaScript 的超集，提供类型安全 |
| Vite | 7.3.0 | 下一代前端构建工具 |
| Element Plus | 2.13.0 | 基于 Vue 3 的组件库 |
| Pinia | 3.0.4 | Vue 的状态管理库 |
| Vue Router | 4.6.4 | Vue 官方路由管理器 |
| Axios | 1.13.2 | 基于 Promise 的 HTTP 客户端 |
| @volcengine/tos-sdk | 2.9.0 | 火山引擎对象存储 SDK |

## 🚀 快速开始

### 环境要求
- Node.js >= 20.19.0 或 >= 22.12.0
- npm 或 yarn 或 pnpm

### 安装依赖
```bash
npm install
```

### 启动开发服务器
```bash
npm run dev
```
访问 http://localhost:5173

### 构建生产版本
```bash
npm run build
```

### 预览生产构建
```bash
npm run preview
```

### 类型检查
```bash
npm run type-check
```

### 代码检查和修复
```bash
npm run lint
```

## 📁 项目结构

```
mobgiai-admin/
├── public/                 # 静态资源
│   ├── favicon.ico
│   └── logo.svg
├── src/
│   ├── api/               # API 接口定义
│   │   ├── index.ts       # 通用 API 方法（get/post/login等）
│   │   └── generate.ts    # 生成相关 API
│   ├── assets/            # 资源文件
│   │   ├── base.css
│   │   ├── main.css
│   │   └── logo.svg
│   ├── components/        # 公共组件
│   │   └── index.ts
│   ├── layout/            # 布局组件
│   │   └── MainLayout.vue
│   ├── router/            # 路由配置
│   │   └── index.ts
│   ├── services/          # 业务服务
│   │   ├── api.ts
│   │   ├── tos.js         # TOS 上传服务
│   │   └── tos.d.ts
│   ├── stores/            # 状态管理
│   │   ├── index.ts
│   │   └── auth.ts        # 认证状态
│   ├── utils/             # 工具函数
│   │   ├── index.ts       # 通用工具（下载、格式化等）
│   │   └── request.ts     # HTTP 请求封装
│   ├── views/             # 页面组件
│   │   ├── LoginView.vue          # 登录页
│   │   ├── ImageGenerateView.vue  # 图片/视频生成页
│   │   ├── AssetsView.vue         # 资产管理页
│   │   └── uploadTos.vue          # TOS 上传测试页
│   ├── App.vue            # 根组件
│   └── main.ts            # 应用入口
├── .env.development       # 开发环境配置
├── .env.production        # 生产环境配置
├── index.html             # HTML 模板
├── vite.config.ts         # Vite 配置
├── tsconfig.json          # TypeScript 配置
└── package.json           # 项目依赖
```

## 🎯 核心功能详解

### 1. 用户认证系统

#### 登录流程
1. 输入手机号（支持中国大陆手机号格式验证）
2. 获取短信验证码（60秒倒计时）
3. 输入验证码完成登录/注册
4. 自动保存登录状态（Token + 用户信息）

#### 技术实现
- 使用 Pinia 管理认证状态
- Token 持久化存储（localStorage）
- 路由守卫自动验证登录状态
- 请求拦截器自动添加 Authorization 头

### 2. AI 图片生成

#### 支持的模型
- **Seedream 4.5** - 最新版本，效果更佳
- **Seedream 4.0** - 稳定版本
- **可灵 O1** - 高质量图片生成
- **可灵 2.0** - 快速生成

#### 参数配置
- **比例选择**: 21:9、16:9、3:2、4:3、1:1、3:4、2:3、9:16
- **分辨率**: 高清2K、超清4K（根据模型动态显示）
- **生成数量**: 1-4张（可配置）
- **参考图片**: 最多5张，支持拖拽上传和预览

#### 生成流程
1. 选择生成模型
2. 上传参考图片（可选）
3. 输入提示词描述
4. 配置生成参数
5. 点击生成，实时显示进度
6. 生成完成后可预览、下载或重新生成

### 3. AI 视频生成

#### 支持的模型
- **Seedance 1.5 Pro** - 专业级视频生成
- **Seedance 1.0 Pro** - 稳定版本
- **可灵 O1** - 高质量视频生成
- **可灵 2.6** - 快速生成

#### 生成模式

##### 首尾帧模式
- 上传首帧图片（必需）
- 上传尾帧图片（可选，部分模型支持）
- 支持首尾帧图片交换
- 适合制作转场动画

##### 多模态参考模式（可灵 O1）
- 上传参考视频（必需）
- 上传参考图片（最多4张）
- 结合视频和图片生成新内容
- 支持视频上传进度显示

##### 视频编辑模式（可灵 O1）
- 上传原始视频
- 通过提示词进行智能编辑
- 保留或替换原视频音频

#### 参数配置
- **比例**: 16:9、9:16、1:1 等
- **分辨率**: 标清、高清、超清
- **时长**: 5秒、10秒（根据模型）
- **音频**: 开启/关闭同时生成声音
- **生成模式**: 标准/专业（部分模型）

### 4. 资产管理

#### 功能特性
- **分类查看**: 图片/视频独立展示
- **日期分组**: 按创建日期自动分组（今天、昨天、具体日期）
- **批量操作**: 支持多选、批量下载、批量删除
- **日期筛选**: 自定义日期范围筛选
- **预览功能**: 点击资产查看大图/播放视频
- **详细信息**: 显示文件大小、创建时间等元数据

#### 交互设计
- 网格布局，响应式适配
- 悬停显示操作按钮
- 选中状态高亮显示
- 全选/取消全选快捷操作

### 5. 文件上传与管理

#### 图片上传
- **支持格式**: JPG、PNG、GIF、WebP、BMP、SVG
- **上传方式**: 点击上传、拖拽上传
- **实时预览**: 80x80px 缩略图
- **管理功能**: 删除、预览原图、重新排序
- **数量限制**: 最多5张（图片生成）或4张（视频参考）

#### 视频上传
- **支持格式**: MP4、WebM、AVI、MOV
- **上传进度**: 实时显示上传百分比
- **预览功能**: 视频缩略图和播放预览
- **大小限制**: 根据模型要求动态调整

#### TOS 云存储
- 使用火山引擎 TOS 对象存储
- 自动获取临时访问凭证（STS Token）
- 支持分片上传大文件
- 上传进度实时反馈

### 6. 任务管理系统

#### 并发控制
- 最大并发任务数: 3个
- 超出限制自动排队
- 任务状态实时更新

#### 任务状态
- **排队中 (status=0)**: 等待处理
- **生成中 (status=1)**: 显示进度动画，自动轮询状态
- **已完成 (status=2)**: 显示生成结果
- **失败 (status=3)**: 显示错误信息，支持重试

#### 智能轮询机制
- 自动检测列表中 `status === 1` 的记录
- 每 10 秒轮询一次任务状态
- 状态变为已完成时自动替换数据并显示结果
- 所有任务完成后自动停止轮询
- 组件卸载时自动清理定时器

#### 历史记录
- 自动保存生成历史
- 按时间倒序排列
- 支持查看详细参数
- 一键重新生成

### 7. 图片预览功能

#### 多图片浏览
- 自动识别生成结果中的所有图片
- 支持在同一预览窗口中浏览多张图片
- 显示当前图片位置（如：2 / 4）

#### 切换方式
- **左右箭头按钮**: 点击切换上一张/下一张
- **键盘快捷键**: 
  - `←` 左箭头键：上一张
  - `→` 右箭头键：下一张
  - `Esc` 键：关闭预览
- 到达首尾时自动隐藏对应按钮

#### 信息展示
- 生成提示词
- AI 模型信息
- 图片尺寸比例
- 分辨率
- 图片张数

#### 操作功能
- 下载当前预览的图片
- 关闭预览窗口
- 毛玻璃效果的现代化 UI 设计

## 🔧 API 接口说明

### 认证相关
```typescript
// 发送验证码
POST /api/v1/misc/send_sms
Body: { mobile: string }

// 登录/注册
POST /api/v1/user_auth/login
Body: { mobile: string, code: string }
Response: { token: string, uid: string, expiredTime: number }

// 登出
POST /api/v1/user_auth/logout
```

### 生成相关
```typescript
// 获取模型配置
GET /api/v1/ai/options
Response: { models: Model[], sizes: Size[], ... }

// 提交生成任务
POST /api/v1/user_input/generate
Body: { prompt: string, model: string, params: object }
Response: { userInputId: number }

// 查询任务状态（支持批量查询）
GET /api/v1/user_input/status?userInputIds=1,2,3
Response: { 
  list: [{
    id: number,
    userInputId: number,
    status: number,  // 0=排队中, 1=生成中, 2=已完成, 3=失败
    assets: Asset[],
    tags: Tag[]
  }]
}

// 获取生成历史
GET /api/v1/user_input/list?page=1&size=20
Response: { list: GenerateResult[], total: number }

// 重新生成
POST /api/v1/user_input/retry
Body: { userInputId: number }
```

### TOS 相关
```typescript
// 获取 TOS 临时凭证
GET /api/v1/misc/sts_token
Response: {
  accessKeyId: string,
  secretAccessKey: string,
  sessionToken: string,
  bucket: string,
  region: string
}
```

## 🎨 UI/UX 设计

### 设计理念
- **现代化**: 采用渐变背景和玻璃拟态效果
- **简洁**: 扁平化设计，减少视觉干扰
- **流畅**: 丰富的动画和过渡效果
- **响应式**: 完美适配各种屏幕尺寸

### 色彩方案
- **主色调**: 紫色渐变 `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`
- **强调色**: 蓝色 `#4A90E2`
- **背景色**: 深色主题 `#000000` / `#1a1a1a`
- **文字色**: 白色 `#ffffff` / 灰色 `#666666`

### 交互反馈
- 按钮悬停效果
- 加载动画
- 进度指示器
- 成功/错误提示
- 平滑的页面过渡

## 🔐 安全性

### 认证安全
- Token 过期自动刷新
- 敏感信息加密存储
- HTTPS 加密传输
- CORS 跨域保护

### 数据安全
- 请求签名验证
- 防重放攻击
- XSS 防护
- CSRF 防护

## 📊 性能优化

### 前端优化
- 路由懒加载
- 组件按需加载
- 图片懒加载
- 防抖和节流
- 虚拟滚动（大列表）

### 网络优化
- 请求去重
- 请求取消
- 响应缓存
- 并发控制
- 超时重试

### 构建优化
- Tree Shaking
- 代码分割
- 资源压缩
- Gzip 压缩
- CDN 加速

## 🌐 浏览器兼容性

| 浏览器 | 版本要求 |
|--------|---------|
| Chrome | >= 88 |
| Firefox | >= 85 |
| Safari | >= 14 |
| Edge | >= 88 |

## 🔄 环境配置

### 开发环境
```env
VITE_APP_TITLE=MobgiAI
VITE_API_BASE_URL=https://coforge-test.mobgi.com
VITE_APP_BASE_API=https://coforge-test.mobgi.com
VITE_APP_UPLOAD_URL=https://coforge-test.mobgi.com
```

### 生产环境
```env
VITE_APP_TITLE=MobgiAI
VITE_API_BASE_URL=https://coforge-test.mobgi.com
VITE_APP_BASE_API=https://coforge-test.mobgi.com
VITE_APP_UPLOAD_URL=https://coforge-test.mobgi.com
```

## 📝 开发规范

### 代码规范
- 使用 TypeScript 进行类型检查
- 遵循 Vue 3 Composition API 最佳实践
- 使用 ESLint 进行代码规范检查
- 统一的命名规范（camelCase、PascalCase）

### 组件规范
- 单文件组件（SFC）
- Props 类型定义
- Emits 事件定义
- 合理的组件拆分

### 样式规范
- 使用 scoped CSS 避免样式冲突
- 深度选择器 `:deep()` 修改第三方组件样式
- CSS 变量统一管理主题色彩
- 响应式设计优先

### Git 规范
- feat: 新功能
- fix: 修复bug
- docs: 文档更新
- style: 代码格式调整
- refactor: 代码重构
- perf: 性能优化
- test: 测试相关
- chore: 构建/工具相关

## 🐛 常见问题

### 1. 登录失败
- 检查手机号格式是否正确
- 确认验证码是否正确
- 检查网络连接

### 2. 上传失败
- 检查文件格式是否支持
- 确认文件大小是否超限
- 检查 TOS 配置是否正确

### 3. 生成失败
- 检查提示词是否符合要求
- 确认参数配置是否正确
- 查看错误提示信息

### 4. 下载失败
- 检查浏览器是否阻止下载
- 尝试使用其他浏览器
- 检查网络连接

### 5. 生成中的任务不更新
- 系统会自动每 10 秒轮询一次状态
- 如果长时间未更新，可以刷新页面
- 检查网络连接是否稳定

### 6. 图片预览无法切换
- 确保生成结果包含多张图片
- 使用键盘左右箭头键或点击屏幕两侧按钮
- 单张图片时不显示切换按钮

## 📄 许可证

MIT License

Copyright (c) 2025 MobgiAI

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

---

**MobgiAI** - 让 AI 创作更简单 🚀