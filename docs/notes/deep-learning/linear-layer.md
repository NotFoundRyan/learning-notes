---
title: 线性层（全连接层）
date: 2026-03-28
tags: [深度学习, 线性层, 全连接层]
category: deep-learning
description: 深入讲解线性层的数学原理、几何意义、参数量计算，配合代码示例帮助你理解神经网络的基础构建块
difficulty: beginner
prerequisites:
  - /notes/deep-learning/tensor-dimension
---

# 线性层（全连接层）

> 阅读时长：约 10 分钟
> 难度等级：入门
> 读完你将学会：理解线性层的数学本质、掌握参数量计算、理解权重和偏置的作用

## 要点速览

> - 线性层执行**仿射变换**：$y = Wx + b$
> - **权重矩阵**的每一行是一个特征检测器
> - 参数量 = 输入维度 × 输出维度 + 输出维度

## 前置知识

阅读本文前，你需要了解：

- [张量与维度](/notes/deep-learning/tensor-dimension) - 理解矩阵乘法

本文不假设你了解：

- 任何深度学习框架
- 复杂的线性代数

## 什么是线性层？

线性层（Linear Layer）也称为全连接层（Fully Connected Layer）或密集层（Dense Layer），是神经网络最基本的构建块。

它执行**仿射变换**（Affine Transformation）：

$$
y = Wx + b
$$

其中：
- $x \in \mathbb{R}^{n}$：输入向量（$n$ 维）
- $W \in \mathbb{R}^{m \times n}$：权重矩阵（$m$ 行 $n$ 列）
- $b \in \mathbb{R}^{m}$：偏置向量（$m$ 维）
- $y \in \mathbb{R}^{m}$：输出向量（$m$ 维）

## 线性变换的几何意义

线性变换可以理解为对输入空间的**旋转、缩放和剪切**。

```
输入空间 (n维)  →  线性变换 W  →  输出空间 (m维)
     ↑                                    ↑
     x                                    y = Wx + b
```

### 权重矩阵 W 的作用

- 每一行 $W_i$ 代表一个"探测器"，检测输入的某种特征
- $W_i \cdot x$ 计算输入与该探测器的相似度
- 输出维度 $m$ 就是特征的数量

### 偏置 b 的作用

- 控制激活的阈值
- 提供平移能力，使决策边界不必过原点

```python
# 片段：线性层的实现
import numpy as np

class Linear:
    """
    线性层（全连接层）
    
    参数:
        in_features: 输入特征数
        out_features: 输出特征数
    """
    
    def __init__(self, in_features, out_features):
        # Xavier 初始化
        scale = np.sqrt(2.0 / (in_features + out_features))
        self.W = np.random.randn(out_features, in_features) * scale
        self.b = np.zeros(out_features)
        
        # 缓存用于反向传播
        self.input = None
    
    def forward(self, x):
        """
        前向传播
        
        参数:
            x: 输入 (batch_size, in_features) 或 (in_features,)
        
        返回:
            y: 输出 (batch_size, out_features) 或 (out_features,)
        """
        self.input = x
        return x @ self.W.T + self.b
    
    def backward(self, grad_output):
        """
        反向传播
        
        参数:
            grad_output: 来自上一层的梯度
        
        返回:
            grad_input: 传给下一层的梯度
            grad_W: 权重梯度
            grad_b: 偏置梯度
        """
        if self.input.ndim == 1:
            grad_W = np.outer(grad_output, self.input)
            grad_b = grad_output
        else:
            grad_W = grad_output.T @ self.input
            grad_b = np.sum(grad_output, axis=0)
        
        grad_input = grad_output @ self.W
        
        return grad_input, grad_W, grad_b
```

上述代码实现了线性层：

**参数说明：**

| 参数 | 形状 | 说明 |
|------|------|------|
| `W` | (out_features, in_features) | 权重矩阵 |
| `b` | (out_features,) | 偏置向量 |
| `x` | (batch_size, in_features) | 输入数据 |

**逐行解释：**

`scale = np.sqrt(2.0 / (in_features + out_features))` - Xavier 初始化的缩放因子，保持前向和反向传播时方差一致。

`x @ self.W.T + self.b` - 执行线性变换，注意转置操作使维度匹配。

`grad_output.T @ self.input` - 权重梯度，使用矩阵乘法批量计算。

## 参数量计算

线性层的参数量计算：

$$
\text{参数量} = m \times n + m = m(n + 1)
$$

**示例：**

| 层配置 | 权重参数 | 偏置参数 | 总参数 |
|--------|---------|---------|--------|
| Linear(784, 128) | 784 × 128 = 100,352 | 128 | 100,480 |
| Linear(128, 64) | 128 × 64 = 8,192 | 64 | 8,256 |
| Linear(64, 10) | 64 × 10 = 640 | 10 | 650 |

```python
# 片段：计算参数量
def count_parameters(in_features, out_features):
    """计算线性层的参数量"""
    weight_params = in_features * out_features
    bias_params = out_features
    return weight_params + bias_params

# 示例
print(f"Linear(784, 128): {count_parameters(784, 128):,} 参数")
print(f"Linear(128, 64): {count_parameters(128, 64):,} 参数")
print(f"Linear(64, 10): {count_parameters(64, 10):,} 参数")
```

## 为什么需要非线性？

如果只有线性层，无论叠加多少层，最终仍然是线性变换：

$$
W_2(W_1 x + b_1) + b_2 = (W_2 W_1) x + (W_2 b_1 + b_2)
$$

这就是为什么需要**激活函数**引入非线性。

## 本节要点

> **记住这三点：**
> 1. 线性层执行仿射变换 $y = Wx + b$
> 2. 权重矩阵的每一行是一个特征检测器
> 3. 参数量 = 输入维度 × 输出维度 + 输出维度

## 更新日志

| 日期 | 内容 |
|------|------|
| 2026-03-28 | 初稿发布 |

## 相关主题

- [张量与维度](/notes/deep-learning/tensor-dimension) - 数据结构基础
- [激活函数](/notes/deep-learning/activation-functions) - 引入非线性
- [前向与反向传播](/notes/deep-learning/forward-backward) - 计算梯度
