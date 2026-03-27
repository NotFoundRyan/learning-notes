---
title: 正则化技术
date: 2026-03-28
tags: [深度学习, 正则化, Dropout, BatchNorm]
category: deep-learning
description: 从零开始讲解正则化技术，包括过拟合问题、Dropout、BatchNorm、L2 正则化的原理与实践，帮助新手理解如何防止模型过拟合
difficulty: beginner
prerequisites:
  - /notes/deep-learning/loss-optimizer
---

# 正则化技术

> 阅读时长：约 15 分钟
> 难度等级：入门
> 读完你将学会：理解过拟合问题、掌握 Dropout 和 BatchNorm 的使用、学会选择合适的正则化方法

## 要点速览

> - **过拟合**是模型在训练集表现好、测试集表现差的现象
> - **Dropout** 随机丢弃神经元，防止过度依赖
> - **BatchNorm** 标准化每层输入，加速训练并起到正则化作用
> - **L2 正则化**惩罚大权重，使模型更简单

## 前置知识

阅读本文前，你需要了解：

- [损失函数与优化器](/notes/deep-learning/loss-optimizer) - 理解训练过程

本文不假设你了解：

- 任何正则化技术
- 复杂的统计学概念

***

## 一、什么是过拟合？

### 1.1 问题引入

假设你在准备考试：

- **死记硬背**：把练习题答案全背下来 → 考试遇到新题就不会了
- **理解原理**：掌握解题方法 → 遇到新题也能做对

神经网络也会遇到同样的问题：

| 情况 | 训练集表现 | 测试集表现 | 结论 |
|------|-----------|-----------|------|
| 欠拟合 | 差 | 差 | 模型太简单，学不到规律 |
| 正常 | 好 | 好 | 模型学到真正的规律 |
| 过拟合 | 很好 | 差 | 模型"死记硬背"了训练数据 |

### 1.2 过拟合的表现

```
训练损失：持续下降 ✓
验证损失：先降后升 ✗  ← 过拟合信号
```

<CollapsibleIframe src="/learning-notes/demos/overfitting.html" title="过拟合可视化" :height="350" />

### 1.3 为什么会过拟合？

**根本原因：模型太复杂，数据太少**

- 参数量远大于样本量
- 训练时间过长
- 模型学到了训练数据的"噪声"而非"规律"

### 本节要点

> **记住这三点：**
> 1. 过拟合 = 训练好、测试差
> 2. 验证损失上升是过拟合的信号
> 3. 模型太复杂、数据太少会导致过拟合

***

## 二、Dropout

### 2.1 核心思想

**Dropout（随机失活）**：训练时随机"关掉"一部分神经元，让模型不依赖任何单个神经元。

**类比理解**：团队工作中，如果某个成员总是缺席，其他人就会学会备份他的技能。Dropout 就是让神经网络中的每个神经元都学会"备份"。

### 2.2 工作原理

```
训练时：
输入 → [神经元1] ───× (被丢弃)
    → [神经元2] ───→ 输出
    → [神经元3] ───× (被丢弃)
    
测试时：
输入 → [神经元1] ───→ (权重 × 0.8)
    → [神经元2] ───→ 输出
    → [神经元3] ───→ (权重 × 0.8)
```

**关键点：**
- 训练时：以概率 $p$ 随机丢弃神经元
- 测试时：所有神经元都工作，但权重乘以 $(1-p)$

### 2.3 代码实现

```python
# 片段：Dropout 实现
import numpy as np

class Dropout:
    """
    Dropout 层
    
    参数:
        p: 丢弃概率，通常设为 0.2 ~ 0.5
    """
    
    def __init__(self, p=0.5):
        self.p = p
        self.mask = None
        self.training = True
    
    def forward(self, x):
        if self.training:
            # 生成随机掩码
            self.mask = np.random.rand(*x.shape) > self.p
            # 缩放以保持期望值不变
            return x * self.mask / (1 - self.p)
        else:
            # 测试时直接返回
            return x
    
    def backward(self, grad_output):
        if self.training:
            # 梯度只传给未被丢弃的神经元
            return grad_output * self.mask / (1 - self.p)
        else:
            return grad_output
```

上述代码实现了 Dropout 的核心逻辑：

**参数说明：**

| 参数 | 说明 |
|------|------|
| `p` | 丢弃概率，通常 0.2 ~ 0.5 |
| `mask` | 随机掩码，决定哪些神经元被丢弃 |

**逐行解释：**

`self.mask = np.random.rand(*x.shape) > self.p` - 生成随机掩码，True 表示保留，False 表示丢弃。

`x * self.mask / (1 - self.p)` - 缩放输出，保持期望值不变。如果不缩放，测试时输出会变小。

### 2.4 使用建议

| 层位置 | 推荐丢弃率 |
|--------|-----------|
| 输入层后 | 0.2 |
| 隐藏层 | 0.5 |
| 输出层前 | 不建议使用 |

```python
# 片段：Dropout 在网络中的使用
class NetWithDropout:
    def __init__(self):
        self.dropout1 = Dropout(p=0.2)  # 输入层后
        self.dropout2 = Dropout(p=0.5)  # 隐藏层
    
    def forward(self, x):
        x = self.linear1(x)
        x = self.dropout1(x)  # 丢弃 20%
        x = self.relu(x)
        
        x = self.linear2(x)
        x = self.dropout2(x)  # 丢弃 50%
        x = self.relu(x)
        
        x = self.linear3(x)
        return x
```

### 本节要点

> **记住这三点：**
> 1. Dropout 训练时随机丢弃，测试时全部工作
> 2. 丢弃后要缩放，保持期望值不变
> 3. 隐藏层丢弃率通常设为 0.5

***

## 三、Batch Normalization

### 3.1 核心思想

**Batch Normalization（批归一化）**：对每一层的输入进行标准化，使其均值为 0、方差为 1。

**为什么需要它？**

训练过程中，每层的输入分布会不断变化（内部协变量偏移），导致：
- 训练不稳定
- 需要更小的学习率
- 收敛变慢

BatchNorm 通过标准化解决了这个问题。

### 3.2 计算过程

对于 mini-batch 中的每个特征：

$$
\begin{aligned}
\mu_B &= \frac{1}{m}\sum_{i=1}^{m} x_i \quad \text{(批次均值)} \\
\sigma_B^2 &= \frac{1}{m}\sum_{i=1}^{m} (x_i - \mu_B)^2 \quad \text{(批次方差)} \\
\hat{x}_i &= \frac{x_i - \mu_B}{\sqrt{\sigma_B^2 + \epsilon}} \quad \text{(标准化)} \\
y_i &= \gamma \hat{x}_i + \beta \quad \text{(缩放和平移)}
\end{aligned}
$$

**关键点：**
- $\gamma$ 和 $\beta$ 是可学习参数
- $\epsilon$ 是小常数（如 1e-5），防止除零

### 3.3 代码实现

```python
# 片段：BatchNorm 实现
class BatchNorm:
    """
    Batch Normalization 层
    
    参数:
        num_features: 特征数量
        momentum: 移动平均的动量
        eps: 防止除零的小常数
    """
    
    def __init__(self, num_features, momentum=0.1, eps=1e-5):
        self.gamma = np.ones(num_features)  # 缩放参数
        self.beta = np.zeros(num_features)  # 平移参数
        self.momentum = momentum
        self.eps = eps
        
        # 移动平均（测试时使用）
        self.running_mean = np.zeros(num_features)
        self.running_var = np.ones(num_features)
        
        self.training = True
    
    def forward(self, x):
        if self.training:
            # 计算批次统计量
            mean = np.mean(x, axis=0)
            var = np.var(x, axis=0)
            
            # 更新移动平均
            self.running_mean = (1 - self.momentum) * self.running_mean + self.momentum * mean
            self.running_var = (1 - self.momentum) * self.running_var + self.momentum * var
            
            # 标准化
            x_norm = (x - mean) / np.sqrt(var + self.eps)
        else:
            # 测试时使用移动平均
            x_norm = (x - self.running_mean) / np.sqrt(self.running_var + self.eps)
        
        # 缩放和平移
        return self.gamma * x_norm + self.beta
```

上述代码实现了 BatchNorm 的核心逻辑：

**参数说明：**

| 参数 | 说明 |
|------|------|
| `gamma` | 缩放参数，可学习 |
| `beta` | 平移参数，可学习 |
| `running_mean` | 训练时的均值移动平均 |
| `running_var` | 训练时的方差移动平均 |

**逐行解释：**

`mean = np.mean(x, axis=0)` - 计算批次内每个特征的均值。

`x_norm = (x - mean) / np.sqrt(var + self.eps)` - 标准化，使均值为 0、方差为 1。

`self.gamma * x_norm + self.beta` - 缩放和平移，让网络可以恢复原始分布（如果需要）。

### 3.4 使用位置

```python
# 片段：BatchNorm 在网络中的位置
class NetWithBatchNorm:
    def forward(self, x):
        # 线性层 → BatchNorm → 激活函数
        x = self.linear1(x)
        x = self.batchnorm1(x)  # BatchNorm 在激活前
        x = self.relu(x)
        
        x = self.linear2(x)
        x = self.batchnorm2(x)
        x = self.relu(x)
        
        return x
```

**推荐顺序：** 线性层 → BatchNorm → 激活函数

### 3.5 BatchNorm 的优势

| 优势 | 说明 |
|------|------|
| 加速收敛 | 可以使用更大的学习率 |
| 减少对初始化的依赖 | 输入被标准化 |
| 正则化效果 | 批次统计量引入噪声 |
| 防止梯度消失/爆炸 | 输出范围稳定 |

### 本节要点

> **记住这三点：**
> 1. BatchNorm 标准化每层输入，使训练更稳定
> 2. 训练用批次统计量，测试用移动平均
> 3. 位置：线性层 → BatchNorm → 激活函数

***

## 四、L2 正则化

### 4.1 核心思想

**L2 正则化（权重衰减）**：在损失函数中添加权重的平方和作为惩罚项。

$$
L_{reg} = L + \frac{\lambda}{2}\sum_{i} w_i^2
$$

**直观理解**：惩罚大权重，迫使模型使用更小的权重，使决策边界更平滑。

### 4.2 为什么有效？

```
无正则化：权重可能很大 → 模型复杂 → 容易过拟合
有正则化：权重被限制 → 模型简单 → 泛化更好
```

### 4.3 代码实现

```python
# 片段：L2 正则化实现
def l2_regularization(weights, lambda_reg):
    """
    计算 L2 正则化损失
    
    参数:
        weights: 权重列表
        lambda_reg: 正则化系数
    """
    l2_loss = 0
    for w in weights:
        l2_loss += np.sum(w ** 2)
    return 0.5 * lambda_reg * l2_loss

def l2_gradient(weights, lambda_reg):
    """
    计算 L2 正则化梯度
    
    参数:
        weights: 权重
        lambda_reg: 正则化系数
    """
    return lambda_reg * weights
```

**参数说明：**

| 参数 | 说明 |
|------|------|
| `lambda_reg` | 正则化系数，通常 1e-4 ~ 1e-2 |
| `weights` | 需要正则化的权重（不含偏置） |

### 4.4 在训练中使用

```python
# 片段：带 L2 正则化的训练循环
def train_step(model, x, y, lr, lambda_reg):
    # 前向传播
    y_pred = model.forward(x)
    
    # 计算损失（含正则化）
    loss = cross_entropy_loss(y_pred, y)
    loss += l2_regularization(model.weights(), lambda_reg)
    
    # 反向传播
    grads = model.backward(y)
    
    # 更新权重（含正则化梯度）
    for w, g in zip(model.weights(), grads):
        w -= lr * (g + lambda_reg * w)
```

### 4.5 正则化系数选择

| 系数 | 效果 |
|------|------|
| 太小（如 1e-6） | 正则化效果不明显 |
| 合适（如 1e-4 ~ 1e-2） | 平衡拟合和泛化 |
| 太大（如 1） | 欠拟合 |

### 本节要点

> **记住这三点：**
> 1. L2 正则化惩罚大权重，使模型更简单
> 2. 正则化系数通常设为 1e-4 ~ 1e-2
> 3. 偏置通常不参与正则化

***

## 五、如何选择正则化方法？

### 5.1 方法对比

| 方法 | 优点 | 缺点 | 适用场景 |
|------|------|------|---------|
| Dropout | 简单有效 | 训练变慢 | 全连接层 |
| BatchNorm | 加速训练 | 依赖批次大小 | 卷积层、全连接层 |
| L2 正则化 | 计算简单 | 效果有限 | 所有情况 |

### 5.2 实践建议

**入门推荐组合：**

```
全连接网络：Dropout + L2 正则化
卷积网络：BatchNorm + L2 正则化
```

**常见配置：**

```python
# 片段：典型的正则化配置
class TypicalNet:
    def __init__(self):
        # 全连接层：使用 Dropout
        self.dropout = Dropout(p=0.5)
        
        # 卷积层：使用 BatchNorm
        self.batchnorm = BatchNorm(num_features=64)
        
        # L2 正则化系数
        self.weight_decay = 1e-4
```

### 5.3 调试技巧

::: tip
**如何判断正则化效果？**

1. 观察训练损失和验证损失的差距
   - 差距大 → 过拟合 → 增强正则化
   - 差距小 → 正常或欠拟合

2. 观察权重分布
   - 权重很大 → 可能需要 L2 正则化
   - 权重接近 0 → 正则化可能太强
:::

***

## 六、完整示例

```python
# 完整示例：带正则化的神经网络
import numpy as np

class RegularizedNet:
    """
    带正则化的神经网络示例
    """
    
    def __init__(self, input_size, hidden_size, output_size, dropout_rate=0.5, weight_decay=1e-4):
        # 权重初始化
        self.W1 = np.random.randn(hidden_size, input_size) * np.sqrt(2.0 / input_size)
        self.b1 = np.zeros(hidden_size)
        self.W2 = np.random.randn(output_size, hidden_size) * np.sqrt(2.0 / hidden_size)
        self.b2 = np.zeros(output_size)
        
        # 正则化参数
        self.dropout_rate = dropout_rate
        self.weight_decay = weight_decay
        
        # BatchNorm 参数
        self.gamma1 = np.ones(hidden_size)
        self.beta1 = np.zeros(hidden_size)
        self.running_mean1 = np.zeros(hidden_size)
        self.running_var1 = np.ones(hidden_size)
        
        # 缓存
        self.cache = {}
        self.training = True
    
    def forward(self, x):
        # 第一层
        z1 = x @ self.W1.T + self.b1
        
        # BatchNorm
        if self.training:
            mean = np.mean(z1, axis=0)
            var = np.var(z1, axis=0)
            z1_norm = (z1 - mean) / np.sqrt(var + 1e-5)
            z1 = self.gamma1 * z1_norm + self.beta1
        else:
            z1_norm = (z1 - self.running_mean1) / np.sqrt(self.running_var1 + 1e-5)
            z1 = self.gamma1 * z1_norm + self.beta1
        
        # ReLU
        a1 = np.maximum(0, z1)
        
        # Dropout
        if self.training:
            mask = np.random.rand(*a1.shape) > self.dropout_rate
            a1 = a1 * mask / (1 - self.dropout_rate)
            self.cache['mask'] = mask
        
        # 第二层
        z2 = a1 @ self.W2.T + self.b2
        self.cache['a1'] = a1
        self.cache['z1'] = z1
        
        return z2
    
    def compute_loss(self, y_pred, y_true):
        # 交叉熵损失
        exp_pred = np.exp(y_pred - np.max(y_pred, axis=1, keepdims=True))
        probs = exp_pred / np.sum(exp_pred, axis=1, keepdims=True)
        ce_loss = -np.mean(np.log(probs[np.arange(len(y_true)), y_true] + 1e-10))
        
        # L2 正则化
        l2_loss = 0.5 * self.weight_decay * (np.sum(self.W1 ** 2) + np.sum(self.W2 ** 2))
        
        return ce_loss + l2_loss

# 使用示例
net = RegularizedNet(784, 128, 10, dropout_rate=0.3, weight_decay=1e-4)
```

***

## 七、总结

| 方法 | 一句话总结 |
|------|-----------|
| Dropout | 随机丢弃，防止依赖 |
| BatchNorm | 标准化输入，稳定训练 |
| L2 正则化 | 惩罚大权重，简化模型 |

**选择建议：**
- 全连接层：Dropout + L2
- 卷积层：BatchNorm + L2
- 小数据集：更强的正则化
- 大数据集：可以减弱正则化

## 更新日志

| 日期 | 内容 |
|------|------|
| 2026-03-28 | 初稿发布 |

## 相关主题

- [损失函数与优化器](/notes/deep-learning/loss-optimizer) - 训练基础
- [网络设计指南](/notes/deep-learning/network-design) - 如何设计网络结构
