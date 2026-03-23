# 笔记模板

这里提供了不同类型的笔记模板，方便快速创建新的笔记。

## 模板列表

### 算法笔记模板

适用于记录算法学习、LeetCode 题解等。

**特点：**
- 问题描述
- 思路分析
- 多语言代码实现
- 复杂度分析
- 图解说明

[查看模板](/templates/algorithm-template)

### 前端笔记模板

适用于记录前端技术、CSS 技巧、JavaScript 等。

**特点：**
- HTML/CSS/JS 代码示例
- 实际演示
- 兼容性说明
- 最佳实践

[查看模板](/templates/frontend-template)

### 后端笔记模板

适用于记录后端技术、API 设计、数据库等。

**特点：**
- 环境配置
- API 设计
- 中间件
- 安全考虑
- 部署方案

[查看模板](/templates/backend-template)

## 使用方法

1. 复制对应的模板文件到 `docs/notes/` 目录
2. 重命名为你的笔记名称
3. 填写内容并删除不需要的部分

## 文件命名规范

```
docs/notes/
├── algorithm/
│   ├── two-sum.md
│   └── binary-search.md
├── frontend/
│   ├── css-grid.md
│   └── javascript-async.md
└── backend/
    ├── express-basics.md
    └── database-design.md
```

## Front Matter 配置

每个笔记文件开头可以添加以下配置：

```yaml
---
title: 笔记标题
date: 2024-01-01
tags: [标签1, 标签2]
description: 简短描述
---
```
