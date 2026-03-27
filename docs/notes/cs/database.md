---
title: 数据库基础 - 数据持久化核心
date: 2026-03-27
tags: [数据库, SQL, 关系型数据库, 数据建模]
description: 深入理解数据库基础，掌握 SQL 语言、关系模型、数据库设计等核心技术
---

# 数据库基础

## 什么是数据库？

数据库是 **有组织、可共享的数据集合**。它长期存储在计算机中，具有较小的冗余度、较高的数据独立性和易扩展性。数据库管理系统（DBMS）是管理数据库的软件系统。

### 数据库的发展历程

```
┌─────────────────────────────────────────────────────────────┐
│                    数据库发展历程                            │
│                                                             │
│  1960s: 人工管理阶段                                        │
│  - 数据不保存                                               │
│  - 数据面向程序                                             │
│  - 无数据管理软件                                           │
│                                                             │
│  1970s: 文件系统阶段                                        │
│  - 数据可长期保存                                           │
│  - 数据面向应用                                             │
│  - 数据冗余大                                              │
│                                                             │
│  1980s: 数据库系统阶段                                      │
│  - 数据结构化                                               │
│  - 数据共享性高                                             │
│  - 数据独立性好                                             │
│  - 数据由DBMS统一管理                                       │
│                                                             │
│  2000s: NoSQL/大数据阶段                                    │
│  - 海量数据存储                                             │
│  - 高并发访问                                               │
│  - 灵活的数据模型                                           │
└─────────────────────────────────────────────────────────────┘
```

### 数据库分类

| 类型 | 特点 | 代表产品 |
|------|------|----------|
| 关系型数据库 | 结构化数据、SQL、ACID | MySQL、PostgreSQL、Oracle |
| 文档数据库 | JSON 文档、灵活模式 | MongoDB、CouchDB |
| 键值数据库 | 简单快速、缓存 | Redis、Memcached |
| 列族数据库 | 大数据、列存储 | HBase、Cassandra |
| 图数据库 | 关系密集、图遍历 | Neo4j、JanusGraph |

## 关系模型

### 关系模型基础

```
┌─────────────────────────────────────────────────────────────┐
│                    关系模型概念                              │
│                                                             │
│  关系 (Relation): 一张表                                    │
│                                                             │
│  元组 (Tuple): 表中的一行                                    │
│                                                             │
│  属性 (Attribute): 表中的一列                                │
│                                                             │
│  候选键 (Candidate Key): 能唯一标识元组的最小属性集           │
│                                                             │
│  主键 (Primary Key): 从候选键中选定的一个                    │
│                                                             │
│  外键 (Foreign Key): 引用其他关系主键的属性                   │
│                                                             │
│  示例: 学生表                                               │
│  ┌────────┬────────┬────────┬────────┐                      │
│  │ 学号   │ 姓名   │ 年龄   │ 班级ID │                      │
│  │ (PK)  │        │        │ (FK)  │                      │
│  ├────────┼────────┼────────┼────────┤                      │
│  │ 1001   │ 张三   │ 20     │ 1      │                      │
│  │ 1002   │ 李四   │ 21     │ 1      │                      │
│  │ 1003   │ 王五   │ 19     │ 2      │                      │
│  └────────┴────────┴────────┴────────┘                      │
└─────────────────────────────────────────────────────────────┘
```

### 关系完整性约束

```sql
-- 实体完整性: 主键不能为空
CREATE TABLE students (
    id INT PRIMARY KEY,      
    name VARCHAR(50) NOT NULL,
    age INT
);

-- 参照完整性: 外键必须引用存在的主键
CREATE TABLE courses (
    id INT PRIMARY KEY,
    name VARCHAR(100)
);

CREATE TABLE enrollments (
    student_id INT,
    course_id INT,
    PRIMARY KEY (student_id, course_id),
    FOREIGN KEY (student_id) REFERENCES students(id),
    FOREIGN KEY (course_id) REFERENCES courses(id)
);

-- 用户自定义完整性
CREATE TABLE products (
    id INT PRIMARY KEY,
    name VARCHAR(100),
    price DECIMAL(10,2) CHECK (price > 0),
    stock INT DEFAULT 0
);
```

上述 SQL 展示了三种完整性约束：

**完整性约束类型：**

| 类型 | 说明 | 约束 |
|------|------|------|
| 实体完整性 | 主键唯一且非空 | `PRIMARY KEY` |
| 参照完整性 | 外键引用必须有效 | `FOREIGN KEY` |
| 用户定义完整性 | 业务规则约束 | `CHECK`、`NOT NULL`、`UNIQUE` |

## SQL 语言

### 数据定义语言 (DDL)

```sql
-- 创建表
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('active', 'inactive') DEFAULT 'active'
);

-- 修改表结构
ALTER TABLE users ADD COLUMN phone VARCHAR(20);
ALTER TABLE users MODIFY COLUMN email VARCHAR(200);
ALTER TABLE users DROP COLUMN phone;

-- 删除表
DROP TABLE IF EXISTS users;

-- 创建索引
CREATE INDEX idx_email ON users(email);
CREATE UNIQUE INDEX idx_username ON users(username);
```

上述 SQL 展示了数据定义操作：

**DDL 语句说明：**

| 语句 | 功能 |
|------|------|
| `CREATE` | 创建数据库对象 |
| `ALTER` | 修改数据库对象 |
| `DROP` | 删除数据库对象 |
| `TRUNCATE` | 清空表数据 |

### 数据操作语言 (DML)

```sql
-- 插入数据
INSERT INTO users (username, email) VALUES ('alice', 'alice@example.com');
INSERT INTO users (username, email) VALUES 
    ('bob', 'bob@example.com'),
    ('charlie', 'charlie@example.com');

-- 更新数据
UPDATE users SET status = 'inactive' WHERE id = 1;
UPDATE users SET email = 'new@example.com', status = 'active' WHERE username = 'alice';

-- 删除数据
DELETE FROM users WHERE id = 1;
DELETE FROM users WHERE status = 'inactive';

-- 查询数据
SELECT * FROM users;
SELECT id, username FROM users WHERE status = 'active';
SELECT DISTINCT status FROM users;
```

上述 SQL 展示了数据操作：

**DML 语句说明：**

| 语句 | 功能 | 示例 |
|------|------|------|
| `INSERT` | 插入数据 | `INSERT INTO table VALUES (...)` |
| `UPDATE` | 更新数据 | `UPDATE table SET col = val WHERE ...` |
| `DELETE` | 删除数据 | `DELETE FROM table WHERE ...` |
| `SELECT` | 查询数据 | `SELECT * FROM table WHERE ...` |

### 数据查询语言 (DQL)

```sql
-- 基本查询
SELECT id, username, email 
FROM users 
WHERE status = 'active' 
ORDER BY created_at DESC 
LIMIT 10;

-- 聚合函数
SELECT status, COUNT(*) as count 
FROM users 
GROUP BY status 
HAVING count > 0;

-- 多表连接
SELECT u.username, o.order_id, o.total
FROM users u
INNER JOIN orders o ON u.id = o.user_id
WHERE o.total > 100;

-- 子查询
SELECT * FROM users 
WHERE id IN (SELECT user_id FROM orders WHERE total > 1000);

-- 联合查询
SELECT username FROM users
UNION
SELECT name FROM customers;
```

上述 SQL 展示了复杂查询：

**查询关键字说明：**

| 关键字 | 功能 |
|------|------|
| `WHERE` | 行过滤条件 |
| `GROUP BY` | 分组 |
| `HAVING` | 分组后过滤 |
| `ORDER BY` | 排序 |
| `LIMIT` | 限制结果数量 |
| `JOIN` | 表连接 |

### 连接类型

```
┌─────────────────────────────────────────────────────────────┐
│                    SQL 连接类型                              │
│                                                             │
│  INNER JOIN (内连接):                                       │
│  只返回两表中匹配的行                                        │
│                                                             │
│  ┌───────────┐     ┌───────────┐                           │
│  │    A      │  ∩  │    B      │                           │
│  └───────────┘     └───────────┘                           │
│                                                             │
│  LEFT JOIN (左外连接):                                      │
│  返回左表所有行，右表无匹配则为 NULL                          │
│                                                             │
│  ┌───────────┐     ┌───────────┐                           │
│  │    A      │  ◄──│    B      │                           │
│  └───────────┘     └───────────┘                           │
│                                                             │
│  RIGHT JOIN (右外连接):                                     │
│  返回右表所有行，左表无匹配则为 NULL                          │
│                                                             │
│  ┌───────────┐     ┌───────────┐                           │
│  │    A      │──►  │    B      │                           │
│  └───────────┘     └───────────┘                           │
│                                                             │
│  FULL OUTER JOIN (全外连接):                                │
│  返回两表所有行，无匹配则为 NULL                              │
│                                                             │
│  ┌───────────┐     ┌───────────┐                           │
│  │    A      │  ∪  │    B      │                           │
│  └───────────┘     └───────────┘                           │
└─────────────────────────────────────────────────────────────┘
```

## 数据库设计

### 范式理论

```
┌─────────────────────────────────────────────────────────────┐
│                    数据库范式                                │
│                                                             │
│  第一范式 (1NF):                                            │
│  - 属性不可再分                                             │
│  - 每个单元格只包含单一值                                    │
│                                                             │
│  第二范式 (2NF):                                            │
│  - 满足 1NF                                                 │
│  - 非主属性完全依赖于主键                                     │
│  - 消除部分函数依赖                                          │
│                                                             │
│  第三范式 (3NF):                                            │
│  - 满足 2NF                                                 │
│  - 非主属性不传递依赖于主键                                   │
│  - 消除传递函数依赖                                          │
│                                                             │
│  BCNF (BC 范式):                                            │
│  - 满足 3NF                                                 │
│  - 主属性不依赖于非主属性                                     │
│                                                             │
│  示例: 违反 2NF                                             │
│  ┌────────┬────────┬────────┬────────┐                      │
│  │ 学号   │ 课程号 │ 成绩   │ 课程名 │  ← 课程名依赖于课程号│
│  └────────┴────────┴────────┴────────┘    而非主键         │
│                                                             │
│  正确设计:                                                  │
│  学生-课程表: (学号, 课程号, 成绩)                           │
│  课程表: (课程号, 课程名)                                   │
└─────────────────────────────────────────────────────────────┘
```

### ER 模型

```
┌─────────────────────────────────────────────────────────────┐
│                    ER 模型图示                              │
│                                                             │
│  实体 (矩形):                                               │
│  ┌─────────────┐                                           │
│  │   学生      │                                           │
│  └─────────────┘                                           │
│                                                             │
│  属性 (椭圆):                                               │
│      ○ 学号                                                 │
│     /                                                       │
│  ┌─○────○──┐                                               │
│  │学生│姓名│                                                │
│  └──○────○──┘                                               │
│     \   /                                                   │
│      ○ 年龄                                                 │
│                                                             │
│  关系 (菱形):                                               │
│  ┌─────────────┐         ┌─────────────┐                   │
│  │   学生      │───◇─────│   课程      │                   │
│  └─────────────┘  选修   └─────────────┘                   │
│                                                             │
│  关系类型:                                                  │
│  - 一对一 (1:1): 身份证-公民                                │
│  - 一对多 (1:N): 班级-学生                                  │
│  - 多对多 (M:N): 学生-课程                                  │
└─────────────────────────────────────────────────────────────┘
```

## 事务

### ACID 特性

```
┌─────────────────────────────────────────────────────────────┐
│                    事务 ACID 特性                           │
│                                                             │
│  Atomicity (原子性):                                        │
│  - 事务是不可分割的工作单位                                 │
│  - 要么全部执行，要么全部不执行                               │
│                                                             │
│  Consistency (一致性):                                      │
│  - 事务执行前后数据库保持一致状态                             │
│  - 满足所有完整性约束                                        │
│                                                             │
│  Isolation (隔离性):                                        │
│  - 多个事务并发执行时互不干扰                                 │
│  - 每个事务感觉不到其他事务的存在                             │
│                                                             │
│  Durability (持久性):                                       │
│  - 事务一旦提交，对数据库的修改是永久的                        │
│  - 即使系统故障也不会丢失                                    │
└─────────────────────────────────────────────────────────────┘
```

### 事务控制

```sql
-- 开始事务
BEGIN TRANSACTION;

-- 执行操作
UPDATE accounts SET balance = balance - 100 WHERE id = 1;
UPDATE accounts SET balance = balance + 100 WHERE id = 2;

-- 提交事务
COMMIT;

-- 回滚事务
ROLLBACK;

-- 设置保存点
SAVEPOINT transfer_point;

-- 回滚到保存点
ROLLBACK TO transfer_point;
```

上述 SQL 展示了事务控制语句：

**事务语句说明：**

| 语句 | 功能 |
|------|------|
| `BEGIN` | 开始事务 |
| `COMMIT` | 提交事务 |
| `ROLLBACK` | 回滚事务 |
| `SAVEPOINT` | 设置保存点 |

### 隔离级别

```sql
-- 读未提交
SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;

-- 读已提交
SET TRANSACTION ISOLATION LEVEL READ COMMITTED;

-- 可重复读
SET TRANSACTION ISOLATION LEVEL REPEATABLE READ;

-- 串行化
SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;
```

上述 SQL 展示了隔离级别设置：

**隔离级别对比：**

| 隔离级别 | 脏读 | 不可重复读 | 幻读 | 性能 |
|----------|------|------------|------|------|
| 读未提交 | 可能 | 可能 | 可能 | 最高 |
| 读已提交 | 不可能 | 可能 | 可能 | 高 |
| 可重复读 | 不可能 | 不可能 | 可能 | 中 |
| 串行化 | 不可能 | 不可能 | 不可能 | 最低 |

**并发问题说明：**

| 问题 | 说明 |
|------|------|
| 脏读 | 读到其他事务未提交的数据 |
| 不可重复读 | 同一事务两次读取结果不同 |
| 幻读 | 同一事务两次查询记录数不同 |

## 索引

### 索引类型

```
┌─────────────────────────────────────────────────────────────┐
│                    索引类型                                  │
│                                                             │
│  B+ 树索引:                                                 │
│  - 最常用的索引类型                                          │
│  - 支持范围查询、排序                                        │
│  - 自动维护平衡                                             │
│                                                             │
│           ┌───┐                                             │
│           │ 50│                                             │
│           └─┬─┘                                             │
│         ┌───┼───┐                                           │
│         │   │   │                                           │
│        ┌┴┐ ┌┴┐ ┌┴┐                                          │
│        │20│ │50│ │80│                                       │
│        └┬┘ └┬┘ └┬┘                                          │
│       ┌┴┐┌┴┐┌┴┐┌┴┐                                          │
│       │...│...│...│...│                                      │
│                                                             │
│  哈希索引:                                                  │
│  - 等值查询极快                                             │
│  - 不支持范围查询                                           │
│  - Memory 引擎默认                                          │
│                                                             │
│  全文索引:                                                  │
│  - 文本搜索优化                                             │
│  - 支持分词、模糊匹配                                        │
│                                                             │
│  空间索引:                                                  │
│  - 地理数据类型                                             │
│  - 空间查询优化                                             │
└─────────────────────────────────────────────────────────────┘
```

### 索引设计原则

```sql
-- 适合创建索引的情况
CREATE INDEX idx_user_email ON users(email);      -- 唯一性高的列
CREATE INDEX idx_order_date ON orders(created_at); -- 经常用于排序的列
CREATE INDEX idx_product_cat ON products(category_id); -- 外键列

-- 复合索引 (注意顺序)
CREATE INDEX idx_user_status_date ON users(status, created_at);

-- 不适合创建索引的情况
-- 1. 区分度低的列 (如性别)
-- 2. 频繁更新的列
-- 3. 数据量小的表
-- 4. 很少用于查询的列
```

上述 SQL 展示了索引创建：

**索引使用原则：**

| 原则 | 说明 |
|------|------|
| 选择性高 | 值分布越分散，索引效果越好 |
| 覆盖索引 | 索引包含查询所需的所有列 |
| 最左前缀 | 复合索引从左到右匹配 |
| 避免过度 | 索引过多影响写入性能 |

## 数据库优化

### 查询优化

```sql
-- 使用 EXPLAIN 分析查询计划
EXPLAIN SELECT * FROM users WHERE email = 'test@example.com';

-- 避免全表扫描
SELECT * FROM users WHERE id = 1;  -- 使用索引
SELECT * FROM users WHERE YEAR(created_at) = 2023;  -- 索引失效

-- 优化分页
SELECT * FROM users ORDER BY id LIMIT 10000, 10;  -- 慢
SELECT * FROM users WHERE id > 10000 ORDER BY id LIMIT 10;  -- 快

-- 避免 SELECT *
SELECT id, username FROM users;  -- 好
SELECT * FROM users;  -- 避免

-- 使用 JOIN 代替子查询
SELECT u.* FROM users u
JOIN orders o ON u.id = o.user_id
WHERE o.total > 100;  -- 好

SELECT * FROM users WHERE id IN (SELECT user_id FROM orders WHERE total > 100);  -- 可能慢
```

上述 SQL 展示了查询优化技巧：

**优化要点：**

| 技巧 | 说明 |
|------|------|
| 使用索引 | 确保 WHERE、JOIN 使用索引 |
| 避免函数 | 列上使用函数会使索引失效 |
| 覆盖索引 | 减少回表查询 |
| 合理分页 | 大偏移量使用游标分页 |

### 表结构优化

```sql
-- 选择合适的数据类型
CREATE TABLE products (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,  -- 无符号节省空间
    name VARCHAR(100) NOT NULL,                   -- 固定长度用 CHAR
    price DECIMAL(10,2),                          -- 精确数值用 DECIMAL
    description TEXT,                             -- 长文本用 TEXT
    status TINYINT,                               -- 小范围用 TINYINT
    created_at TIMESTAMP                          -- 时间戳
);

-- 垂直拆分
-- 主表: 核心字段
CREATE TABLE users (
    id INT PRIMARY KEY,
    username VARCHAR(50),
    email VARCHAR(100)
);

-- 扩展表: 不常用字段
CREATE TABLE user_profiles (
    user_id INT PRIMARY KEY,
    avatar VARCHAR(200),
    bio TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 水平拆分
-- 按时间分表
CREATE TABLE orders_2023_01 LIKE orders;
CREATE TABLE orders_2023_02 LIKE orders;
```

上述 SQL 展示了表结构优化：

**优化策略：**

| 策略 | 说明 |
|------|------|
| 数据类型 | 选择最小够用的类型 |
| 垂直拆分 | 按列拆分到多个表 |
| 水平拆分 | 按行拆分到多个表 |
| 反范式 | 适度冗余减少 JOIN |

## 总结

| 概念 | 要点 |
|------|------|
| 关系模型 | 表、行、列、主键、外键 |
| SQL | DDL、DML、DQL、DCL |
| 事务 | ACID 特性、隔离级别 |
| 索引 | B+ 树、哈希、全文索引 |
| 优化 | 查询优化、表结构优化 |

## 参考资料

[1] Database System Concepts. Abraham Silberschatz

[2] SQL 必知必会. Ben Forta

[3] 高性能 MySQL. Baron Schwartz

## 相关主题

- [数据结构基础](/notes/cs/data-structure) - 数据组织方式
- [文件操作](/notes/c/file-io) - 数据持久化
- [进程与线程](/notes/cs/process-thread) - 并发控制
