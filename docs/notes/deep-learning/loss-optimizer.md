---
title: 损失函数与优化器
date: 2026-03-28
tags: [深度学习, 损失函数, 优化器, 梯度下降]
category: deep-learning
description: 深入讲解损失函数（MSE、Cross-Entropy）与优化器（SGD、Momentum、Adam）的原理，配合可视化演示帮助你理解训练过程
difficulty: intermediate
prerequisites:
  - /notes/deep-learning/forward-backward
---

# 损失函数与优化器

> 阅读时长：约 12 分钟
> 难度等级：中级
> 读完你将学会：理解各类损失函数的原理与选择、掌握优化器的工作机制、理解学习率的影响

## 要点速览

> - **MSE** 用于回归，**Cross-Entropy** 用于分类
> - **学习率**是最重要的超参数，需要仔细调整
> - **Adam** 是最常用的优化器，自适应调整每个参数的学习率

## 前置知识

阅读本文前，你需要了解：

- [前向传播与反向传播](/notes/deep-learning/forward-backward) - 梯度计算

本文不假设你了解：

- 任何深度学习框架
- 复杂的优化理论

***

## 损失函数

### 什么是损失函数？

损失函数（Loss Function）衡量模型预测值与真实值之间的差距。训练的目标就是**最小化损失函数**。

***

## 均方误差（MSE）

用于回归问题：

$$
L = \frac{1}{n}\sum_{i=1}^{n}(y_i - \hat{y}_i)^2
$$

### 梯度推导

$$
\frac{\partial L}{\partial \hat{y}_i} = \frac{2}{n}(\hat{y}_i - y_i)
$$

```python
# 片段：MSE 损失
import numpy as np

def mse_loss(y_pred, y_true):
    """均方误差损失函数"""
    return np.mean((y_pred - y_true) ** 2)

def mse_loss_gradient(y_pred, y_true):
    """MSE 损失的梯度"""
    n = y_pred.shape[0]
    return 2 * (y_pred - y_true) / n
```

***

## 交叉熵损失（Cross-Entropy）

### 二元交叉熵

用于二分类问题：

$$
L = -\frac{1}{n}\sum_{i=1}^{n}[y_i \log(\hat{y}_i) + (1-y_i)\log(1-\hat{y}_i)]
$$

### 梯度推导

$$
\frac{\partial L}{\partial \hat{y}_i} = -\frac{y_i}{\hat{y}_i} + \frac{1-y_i}{1-\hat{y}_i} = \frac{\hat{y}_i - y_i}{\hat{y}_i(1-\hat{y}_i)}
$$

### 多类交叉熵

用于多分类问题：

$$
L = -\sum_{i=1}^{n}\sum_{c=1}^{C} y_{i,c} \log(\hat{y}_{i,c})
$$

对于 one-hot 编码的标签，简化为：

$$
L = -\frac{1}{n}\sum_{i=1}^{n} \log(\hat{y}_{i, y_i})
$$

```python
# 片段：交叉熵损失
def cross_entropy_loss(y_pred, y_true):
    """
    交叉熵损失函数
    
    参数:
        y_pred: 预测概率分布
        y_true: 真实标签的 one-hot 编码
    """
    epsilon = 1e-15
    y_pred = np.clip(y_pred, epsilon, 1 - epsilon)
    return -np.sum(y_true * np.log(y_pred)) / y_pred.shape[0]

def cross_entropy_gradient(y_pred, y_true):
    """
    交叉熵损失的梯度
    
    对于 softmax + cross-entropy 组合，梯度简化为：
    ∂L/∂z = y_pred - y_true
    """
    return y_pred - y_true
```

### 损失函数选择

| 问题类型 | 推荐损失函数 | 输出层激活 | 梯度 |
|---------|-------------|-----------|------|
| 二分类 | Binary Cross-Entropy | Sigmoid | $\hat{y} - y$ |
| 多分类 | Categorical Cross-Entropy | Softmax | $\hat{y} - y$ |
| 回归 | MSE | 无/Linear | $\frac{2}{n}(\hat{y} - y)$ |

***

## 优化器

### 什么是优化器？

优化器（Optimizer）根据梯度更新模型参数，目标是找到损失函数的最小值。

***

## 梯度下降

最基础的优化算法：

$$
\theta_{t+1} = \theta_t - \eta \cdot \nabla L(\theta_t)
$$

其中 $\eta$ 是学习率（Learning Rate）。

```python
# 片段：梯度下降
def gradient_descent(params, gradients, learning_rate):
    """基础梯度下降"""
    for i in range(len(params)):
        params[i] -= learning_rate * gradients[i]
    return params
```

***

## 学习率的影响

学习率是最重要的超参数之一：

| 学习率 | 现象 |
|--------|------|
| 太大 | 损失震荡、发散 |
| 太小 | 收敛太慢、陷入局部最优 |
| 合适 | 平稳收敛 |

<CollapsibleIframe src="/learning-notes/demos/learning-rate.html" title="学习率影响可视化" :height="400" />

***

## SGD（随机梯度下降）

```python
# 片段：SGD 优化器
class SGD:
    def __init__(self, learning_rate=0.01):
        self.lr = learning_rate
    
    def step(self, params, gradients):
        for i in range(len(params)):
            params[i] -= self.lr * gradients[i]
```

***

## SGD with Momentum

### 更新公式

$$
\begin{aligned}
v_t &= \beta v_{t-1} + (1-\beta) \nabla L(\theta_t) \\
\theta_{t+1} &= \theta_t - \eta v_t
\end{aligned}
$$

```python
# 片段：带动量的 SGD
class SGDMomentum:
    def __init__(self, learning_rate=0.01, momentum=0.9):
        self.lr = learning_rate
        self.momentum = momentum
        self.velocities = None
    
    def step(self, params, gradients):
        if self.velocities is None:
            self.velocities = [np.zeros_like(p) for p in params]
        
        for i in range(len(params)):
            self.velocities[i] = self.momentum * self.velocities[i] + (1 - self.momentum) * gradients[i]
            params[i] -= self.lr * self.velocities[i]
```

**Momentum 的作用：**
- 加速收敛
- 避免陷入局部最优
- 平滑梯度方向

***

## Adam

Adam 结合了动量和自适应学习率。

### 更新公式

$$
\begin{aligned}
m_t &= \beta_1 m_{t-1} + (1-\beta_1) g_t \\
v_t &= \beta_2 v_{t-1} + (1-\beta_2) g_t^2 \\
\hat{m}_t &= \frac{m_t}{1-\beta_1^t} \\
\hat{v}_t &= \frac{v_t}{1-\beta_2^t} \\
\theta_{t+1} &= \theta_t - \frac{\eta}{\sqrt{\hat{v}_t} + \epsilon} \hat{m}_t
\end{aligned}
$$

```python
# 片段：Adam 优化器
class Adam:
    def __init__(self, learning_rate=0.001, beta1=0.9, beta2=0.999, epsilon=1e-8):
        self.lr = learning_rate
        self.beta1 = beta1
        self.beta2 = beta2
        self.epsilon = epsilon
        self.m = None
        self.v = None
        self.t = 0
    
    def step(self, params, gradients):
        if self.m is None:
            self.m = [np.zeros_like(p) for p in params]
            self.v = [np.zeros_like(p) for p in params]
        
        self.t += 1
        
        for i in range(len(params)):
            g = gradients[i]
            
            # 更新一阶矩（梯度均值）
            self.m[i] = self.beta1 * self.m[i] + (1 - self.beta1) * g
            
            # 更新二阶矩（梯度方差）
            self.v[i] = self.beta2 * self.v[i] + (1 - self.beta2) * (g ** 2)
            
            # 偏差修正
            m_hat = self.m[i] / (1 - self.beta1 ** self.t)
            v_hat = self.v[i] / (1 - self.beta2 ** self.t)
            
            # 更新参数
            params[i] -= self.lr * m_hat / (np.sqrt(v_hat) + self.epsilon)
```

**Adam 的优势：**
- 自适应学习率：每个参数有不同的学习率
- 结合动量：加速收敛
- 偏差修正：解决初始阶段偏差问题

***

## 优化器对比

| 优化器 | 特点 | 适用场景 |
|--------|------|---------|
| SGD | 简单、稳定 | 凸优化、精细调优 |
| SGD+Momentum | 加速收敛 | 深层网络 |
| Adam | 自适应学习率 | **大多数情况** |

***

## 权重初始化

### 为什么初始化很重要？

- **全零初始化**：所有神经元学习相同的特征
- **过大初始化**：激活值饱和，梯度消失
- **过小初始化**：激活值过小，梯度消失

### Xavier 初始化

适用于 Sigmoid、Tanh 等饱和激活函数：

$$
W \sim \mathcal{N}\left(0, \sqrt{\frac{2}{n_{in} + n_{out}}}\right)
$$

### He 初始化

适用于 ReLU 及其变体：

$$
W \sim \mathcal{N}\left(0, \sqrt{\frac{2}{n_{in}}}\right)
$$

```python
# 片段：权重初始化
def xavier_init(shape):
    """Xavier 初始化"""
    fan_in, fan_out = shape[1], shape[0]
    scale = np.sqrt(2.0 / (fan_in + fan_out))
    return np.random.randn(*shape) * scale

def he_init(shape):
    """He 初始化（适用于 ReLU）"""
    fan_in = shape[1]
    scale = np.sqrt(2.0 / fan_in)
    return np.random.randn(*shape) * scale
```

***

## 本节要点

> **记住这三点：**
> 1. MSE 用于回归，Cross-Entropy 用于分类
> 2. 学习率是最重要的超参数，需要仔细调整
> 3. Adam 是最常用的优化器，自适应调整每个参数的学习率

## 更新日志

| 日期 | 内容 |
|------|------|
| 2026-03-28 | 初稿发布 |

## 相关主题

- [前向传播与反向传播](/notes/deep-learning/forward-backward) - 梯度计算
- [CNN 基础](/notes/deep-learning/cnn) - 图像处理
