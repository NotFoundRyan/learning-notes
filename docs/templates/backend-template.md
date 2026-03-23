---
title: 后端笔记模板
date: 2024-01-01
tags: [后端, Node.js, 数据库]
---

# 后端技术标题

## 概述

在这里描述这个后端技术的基本概念和用途。

## 环境配置

### 安装依赖

```bash
npm install package-name
```

### 配置文件

```javascript
// config.js
module.exports = {
  port: 3000,
  database: {
    host: 'localhost',
    port: 5432,
    name: 'mydb'
  }
}
```

## 基础用法

### 创建服务

::: code-group

```javascript [Express]
const express = require('express')
const app = express()

app.get('/', (req, res) => {
  res.json({ message: 'Hello World' })
})

app.listen(3000, () => {
  console.log('Server running on port 3000')
})
```

```javascript [Koa]
const Koa = require('koa')
const app = new Koa()

app.use(async ctx => {
  ctx.body = { message: 'Hello World' }
})

app.listen(3000, () => {
  console.log('Server running on port 3000')
})
```

:::

### 数据库操作

```javascript
const { Pool } = require('pg')
const pool = new Pool()

async function getUsers() {
  const { rows } = await pool.query('SELECT * FROM users')
  return rows
}
```

## API 设计

### RESTful API

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | /api/users | 获取用户列表 |
| POST | /api/users | 创建用户 |
| PUT | /api/users/:id | 更新用户 |
| DELETE | /api/users/:id | 删除用户 |

### 请求示例

```bash
# 获取用户列表
curl http://localhost:3000/api/users

# 创建用户
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name": "John", "email": "john@example.com"}'
```

## 中间件

### 日志中间件

```javascript
function logger(req, res, next) {
  console.log(`${req.method} ${req.url} - ${new Date().toISOString()}`)
  next()
}

app.use(logger)
```

### 错误处理

```javascript
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ error: 'Something went wrong!' })
})
```

## 性能优化

### 数据库优化

1. 使用连接池
2. 添加索引
3. 使用缓存

### 代码优化

```javascript
// 使用 async/await
async function processData() {
  try {
    const data = await fetchData()
    const result = await process(data)
    return result
  } catch (error) {
    console.error(error)
    throw error
  }
}
```

## 安全考虑

::: warning 安全警告
- 输入验证
- SQL 注入防护
- XSS 防护
- CSRF 防护
:::

## 部署

### Docker 部署

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## 参考资料

- [官方文档](#)
- [API 参考](#)
