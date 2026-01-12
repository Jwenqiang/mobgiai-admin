#!/bin/bash

# MobgiAI 部署脚本

echo "🚀 开始部署 MobgiAI..."

# 检查 Node.js 版本
echo "📋 检查环境..."
node_version=$(node -v)
echo "Node.js 版本: $node_version"

# 安装依赖
echo "📦 安装依赖..."
npm install

# 类型检查
echo "🔍 类型检查..."
npm run type-check

# 代码检查
echo "🔧 代码检查..."
npm run lint

# 构建项目
echo "🏗️ 构建项目..."
npm run build

# 检查构建结果
if [ -d "dist" ]; then
    echo "✅ 构建成功！"
    echo "📁 构建文件位于 dist/ 目录"
    
    # 显示构建文件大小
    echo "📊 构建文件大小:"
    du -sh dist/*
    
    echo "🎉 部署准备完成！"
    echo "💡 提示: 将 dist/ 目录上传到您的服务器即可"
else
    echo "❌ 构建失败！"
    exit 1
fi