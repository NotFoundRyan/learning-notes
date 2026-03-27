---
title: 张量与维度
date: 2026-03-28
tags: [深度学习, 张量, 维度]
category: deep-learning
description: 深入讲解张量的概念、维度的含义、矩阵乘法规则，配合代码示例帮助你理解深度学习中的数据结构
difficulty: beginner
---

# 张量与维度

> 阅读时长：约 8 分钟
> 难度等级：入门
> 读完你将学会：理解张量的定义、掌握维度概念、正确进行矩阵乘法

## 要点速览

> - **张量**是深度学习的基本数据结构，可以理解为多维数组
> - **维度**表示数据的形状，决定了矩阵乘法是否可行
> - 深度学习中常见 4D 张量：`(批次, 高度, 宽度, 通道)`

## 前置知识

阅读本文前，你需要了解：

- 基本的 Python 编程
- 基本的数组概念

本文不假设你了解：

- 任何深度学习框架
- 复杂的线性代数

## 什么是张量？

张量（Tensor）是深度学习中最基本的数据结构，可以理解为**多维数组**。

| 维度 | 名称 | 示例 | 形状 |
|------|------|------|------|
| 0D | 标量（Scalar） | `5` | `()` |
| 1D | 向量（Vector） | `[1, 2, 3]` | `(3,)` |
| 2D | 矩阵（Matrix） | `[[1,2], [3,4]]` | `(2, 2)` |
| 3D | 三维张量 | RGB 图像 | `(H, W, C)` |
| 4D | 四维张量 | 图像批次 | `(N, H, W, C)` |

```python
# 片段：张量的维度理解
import numpy as np

# 0D 张量：标量
scalar = np.array(5)
print(f"标量形状: {scalar.shape}")  # ()

# 1D 张量：向量
vector = np.array([1, 2, 3, 4, 5])
print(f"向量形状: {vector.shape}")  # (5,)

# 2D 张量：矩阵
matrix = np.array([[1, 2, 3],
                   [4, 5, 6]])
print(f"矩阵形状: {matrix.shape}")  # (2, 3)

# 3D 张量：RGB 图像
image = np.random.randn(224, 224, 3)  # 高224, 宽224, 3通道
print(f"图像形状: {image.shape}")  # (224, 224, 3)

# 4D 张量：图像批次
batch = np.random.randn(32, 224, 224, 3)  # 32张图像
print(f"批次形状: {batch.shape}")  # (32, 224, 224, 3)
```

上述代码展示了不同维度的张量：

**维度说明：**

| 变量 | 维度 | 含义 |
|------|------|------|
| `scalar` | 0D | 单个数值 |
| `vector` | 1D | 一列数值 |
| `matrix` | 2D | 行列结构 |
| `image` | 3D | 高×宽×通道 |
| `batch` | 4D | 批次×高×宽×通道 |

## 维度的直观理解

<CollapsibleIframe src="/learning-notes/demos/tensor-dimension.html" title="张量维度可视化" :height="400" />

## 为什么维度很重要？

维度决定了：
1. **数据如何组织**：理解数据的结构
2. **矩阵乘法是否可行**：形状必须匹配
3. **内存占用**：维度越高，内存越大

```python
# 片段：维度不匹配的错误示例
A = np.random.randn(3, 4)  # 3行4列
B = np.random.randn(5, 6)  # 5行6列

# 错误：维度不匹配
# C = A @ B  # ValueError: matmul: Input operand 1 has a mismatch

# 正确：A的列数 = B的行数
B_correct = np.random.randn(4, 5)
C = A @ B_correct  # 结果形状: (3, 5)
print(f"矩阵乘法结果形状: {C.shape}")
```

**矩阵乘法规则：**

$$
(A \times B) @ (B \times C) = (A \times C)
$$

## 常见张量形状

| 场景 | 形状 | 说明 |
|------|------|------|
| MNIST 图像 | `(28, 28)` | 灰度图像 |
| CIFAR 图像 | `(32, 32, 3)` | RGB 图像 |
| ImageNet 批次 | `(N, 224, 224, 3)` | 批量 RGB 图像 |
| 文本序列 | `(batch, seq_len)` | 词索引序列 |
| 词嵌入 | `(batch, seq_len, embed_dim)` | 词向量序列 |

## 本节要点

> **记住这三点：**
> 1. 张量是深度学习的基本数据结构，从标量到高维张量
> 2. 维度决定了矩阵乘法是否可行，必须保证形状匹配
> 3. 深度学习中常见 4D 张量：`(批次, 高度, 宽度, 通道)`

## 更新日志

| 日期 | 内容 |
|------|------|
| 2026-03-28 | 初稿发布 |

## 相关主题

- [线性层](/notes/deep-learning/linear-layer) - 张量的线性变换
- [激活函数](/notes/deep-learning/activation-functions) - 引入非线性
