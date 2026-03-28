---
title: 激活函数详解
date: 2026-03-28
tags: [深度学习, 激活函数, ReLU, Sigmoid, Softmax]
category: deep-learning
description: 深入讲解 Sigmoid、Tanh、ReLU、Leaky ReLU、Softmax 等激活函数的原理、导数推导、优缺点和适用场景
difficulty: beginner
prerequisites:
  - /notes/deep-learning/linear-layer
---

# 激活函数详解

> 阅读时长：约 15 分钟
> 难度等级：入门
> 读完你将学会：理解各类激活函数的原理与选择、掌握导数推导、理解 Softmax + Cross-Entropy 的梯度简化

## 要点速览

> - 激活函数**引入非线性**，是神经网络能拟合复杂函数的关键
> - **ReLU** 是隐藏层的默认选择，计算快且缓解梯度消失
> - **Softmax + Cross-Entropy** 组合的梯度简化为 $p - y$

## 前置知识

阅读本文前，你需要了解：

- [线性层](/notes/deep-learning/linear-layer) - 理解为什么需要非线性
- 基本的微积分概念

本文不假设你了解：

- 任何深度学习框架
- 复杂的数学推导

## 为什么需要激活函数？

如果只有线性层，无论叠加多少层，最终仍然是线性变换：

$$
W_2(W_1 x + b_1) + b_2 = (W_2 W_1) x + (W_2 b_1 + b_2)
$$

**激活函数引入非线性**，使神经网络能够拟合任意复杂的函数。

<CollapsibleIframe src="/learning-notes/demos/activation-functions/activation-functions.html" title="激活函数可视化" :height="400" />

***

## Sigmoid 函数

### 定义

$$
\sigma(x) = \frac{1}{1 + e^{-x}} = \frac{e^x}{e^x + 1}
$$

### 导数推导

$$
\begin{aligned}
\sigma'(x) &= \frac{d}{dx}\left(\frac{1}{1 + e^{-x}}\right) \\
&= \frac{e^{-x}}{(1 + e^{-x})^2} \\
&= \frac{1}{1 + e^{-x}} \cdot \frac{e^{-x}}{1 + e^{-x}} \\
&= \sigma(x) \cdot (1 - \sigma(x))
\end{aligned}
$$

### 特点

- 输出范围：**(0, 1)**
- 将任意实数映射到概率区间
- 导数最大值为 **0.25**（在 x=0 处）

```python
# 片段：Sigmoid 实现
import numpy as np

def sigmoid(x):
    """Sigmoid 激活函数"""
    return 1 / (1 + np.exp(-np.clip(x, -500, 500)))

def sigmoid_derivative(x):
    """Sigmoid 导数"""
    s = sigmoid(x)
    return s * (1 - s)
```

### 优缺点

| 优点 | 缺点 |
|------|------|
| 输出有界，适合概率输出 | **梯度消失问题严重**（导数最大 0.25） |
| 处处可导 | 输出非零中心，影响收敛 |
| 平滑连续 | 计算指数函数较慢 |

### 适用场景

- **二分类输出层**
- 注意力权重计算

***

## Tanh 函数

### 定义

$$
\tanh(x) = \frac{e^x - e^{-x}}{e^x + e^{-x}} = \frac{2}{1 + e^{-2x}} - 1
$$

### 导数推导

$$
\begin{aligned}
\tanh'(x) &= 1 - \tanh^2(x)
\end{aligned}
$$

**推导过程：**

设 $t = \tanh(x)$，则：

$$
\begin{aligned}
\tanh'(x) &= \frac{(e^x + e^{-x})(e^x + e^{-x}) - (e^x - e^{-x})(e^x - e^{-x})}{(e^x + e^{-x})^2} \\
&= \frac{(e^x + e^{-x})^2 - (e^x - e^{-x})^2}{(e^x + e^{-x})^2} \\
&= 1 - \tanh^2(x)
\end{aligned}
$$

```python
# 片段：Tanh 实现
def tanh(x):
    """Tanh 激活函数"""
    return np.tanh(x)

def tanh_derivative(x):
    """Tanh 导数"""
    return 1 - np.tanh(x) ** 2
```

### 特点

- 输出范围：**(-1, 1)**
- 零中心化，收敛更快
- 导数最大值为 **1**（在 x=0 处）

### 适用场景

- RNN 隐藏层
- 需要零中心的场景

***

## ReLU 函数

### 定义

$$
\text{ReLU}(x) = \max(0, x) = \begin{cases} x & \text{if } x > 0 \\ 0 & \text{if } x \leq 0 \end{cases}
$$

### 导数

$$
\text{ReLU}'(x) = \begin{cases} 1 & \text{if } x > 0 \\ 0 & \text{if } x \leq 0 \end{cases}
$$

```python
# 片段：ReLU 实现
def relu(x):
    """ReLU 激活函数"""
    return np.maximum(0, x)

def relu_derivative(x):
    """ReLU 导数"""
    return (x > 0).astype(float)
```

### 优缺点

| 优点 | 缺点 |
|------|------|
| **计算极快**（只需比较） | "死亡 ReLU"问题：负值区域梯度为 0 |
| 缓解梯度消失 | 输出非零中心 |
| 稀疏激活特性 | 在 x=0 处不可导（实际中无影响） |

### 适用场景

- **隐藏层的默认选择**
- 深层网络

***

## Leaky ReLU

### 定义

$$
\text{LeakyReLU}(x) = \begin{cases} x & \text{if } x > 0 \\ \alpha x & \text{if } x \leq 0 \end{cases}
$$

其中 $\alpha$ 是一个小常数，通常取 0.01。

### 导数

$$
\text{LeakyReLU}'(x) = \begin{cases} 1 & \text{if } x > 0 \\ \alpha & \text{if } x \leq 0 \end{cases}
$$

```python
# 片段：Leaky ReLU 实现
def leaky_relu(x, alpha=0.01):
    """Leaky ReLU 激活函数"""
    return np.where(x > 0, x, alpha * x)

def leaky_relu_derivative(x, alpha=0.01):
    """Leaky ReLU 导数"""
    return np.where(x > 0, 1, alpha)
```

### 优点

解决"死亡 ReLU"问题，负值区域仍有梯度。

### 适用场景

- 深层网络
- 需要避免死亡神经元的场景

***

## Softmax 函数

### 定义

$$
\text{Softmax}(x_i) = \frac{e^{x_i}}{\sum_{j=1}^{n} e^{x_j}}
$$

### 特点

- 将向量转换为**概率分布**
- 所有输出和为 **1**
- 最大值被放大，最小值被抑制

### 数值稳定性

为避免指数溢出，通常减去最大值：

$$
\text{Softmax}(x_i) = \frac{e^{x_i - \max(x)}}{\sum_{j=1}^{n} e^{x_j - \max(x)}}
$$

```python
# 片段：Softmax 实现
def softmax(x):
    """
    Softmax 激活函数
    
    参数:
        x: 输入向量 (n,) 或批次 (batch_size, n)
    """
    # 数值稳定性：减去最大值
    x_shifted = x - np.max(x, axis=-1, keepdims=True)
    exp_x = np.exp(x_shifted)
    return exp_x / np.sum(exp_x, axis=-1, keepdims=True)
```

### Softmax + Cross-Entropy 的梯度简化

设 $p = \text{Softmax}(z)$，$y$ 为 one-hot 标签，交叉熵损失为：

$$
L = -\sum_i y_i \log p_i
$$

**梯度推导：**

$$
\begin{aligned}
\frac{\partial L}{\partial z_i} &= \sum_j \frac{\partial L}{\partial p_j} \cdot \frac{\partial p_j}{\partial z_i} \\
&= p_i - y_i
\end{aligned}
$$

这个优美的结果使得 Softmax + Cross-Entropy 的梯度计算非常简洁。

```python
# 片段：Softmax + Cross-Entropy 梯度
def softmax_cross_entropy_gradient(y_pred, y_true):
    """
    Softmax + Cross-Entropy 的组合梯度
    
    参数:
        y_pred: Softmax 输出概率
        y_true: 真实标签的 one-hot 编码
    
    返回:
        梯度 = y_pred - y_true
    """
    return y_pred - y_true
```

### 适用场景

- **多分类问题的输出层**

***

## 激活函数对比

| 激活函数 | 输出范围 | 导数范围 | 主要优点 | 主要缺点 | 推荐场景 |
|---------|---------|---------|---------|---------|---------|
| Sigmoid | (0, 1) | (0, 0.25] | 输出有界 | 梯度消失 | 二分类输出 |
| Tanh | (-1, 1) | (0, 1] | 零中心 | 梯度消失 | RNN 隐藏层 |
| ReLU | [0, +∞) | {0, 1} | 计算快 | 死亡 ReLU | **隐藏层默认** |
| Leaky ReLU | (-∞, +∞) | {α, 1} | 无死亡 | 需调参 | 深层网络 |
| Softmax | (0, 1) | - | 概率分布 | - | 多分类输出 |

## 选择建议

1. **隐藏层**：默认使用 ReLU，如果出现死亡神经元则尝试 Leaky ReLU
2. **二分类输出层**：Sigmoid
3. **多分类输出层**：Softmax
4. **RNN 隐藏层**：Tanh

## 本节要点

> **记住这三点：**
> 1. 激活函数引入非线性，是神经网络能拟合复杂函数的关键
> 2. ReLU 是隐藏层的默认选择，计算快且缓解梯度消失
> 3. Softmax + Cross-Entropy 组合的梯度简化为 $p - y$

## 更新日志

| 日期 | 内容 |
|------|------|
| 2026-03-28 | 初稿发布 |

## 相关主题

- [线性层](/notes/deep-learning/linear-layer) - 线性变换
- [损失函数与优化器](/notes/deep-learning/loss-optimizer) - Cross-Entropy 损失
