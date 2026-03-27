---
title: 循环神经网络（RNN）基础
date: 2026-03-28
tags: [深度学习, RNN, 神经网络, 序列建模]
category: deep-learning
description: 深入讲解循环神经网络的核心概念，包括序列建模、时间依赖、隐藏状态等，配合代码示例帮助你理解 RNN 的工作原理
difficulty: intermediate
prerequisites:
  - /notes/cs/data-structure
---

# 循环神经网络（RNN）基础

> 阅读时长：约 18 分钟
> 难度等级：中级
> 读完你将学会：理解 RNN 的核心机制、手动实现 RNN 前向传播、认识梯度消失问题

## 要点速览

> - RNN 通过**隐藏状态**在时间步之间传递信息，实现**序列建模**
> - 核心公式：$h_t = \tanh(W_{hh}h_{t-1} + W_{xh}x_t + b_h)$
> - 主要问题：**梯度消失/爆炸**，难以学习长距离依赖
> - 变体：LSTM、GRU 通过门控机制解决长距离依赖问题

如果你只是想快速了解 RNN 的核心思想，可以跳到[核心概念](#核心概念)部分。

## 前置知识

阅读本文前，你需要了解：

- 基本的矩阵运算（[复习：数据结构基础](/notes/cs/data-structure)）
- Python 编程基础
- 神经网络的基本概念（前向传播、反向传播）

本文不假设你了解：

- 任何深度学习框架的高级用法
- 复杂的优化算法

## 什么是循环神经网络？

循环神经网络（Recurrent Neural Network，RNN）是一种专门处理**序列数据**的神经网络。与 CNN 处理空间结构不同，RNN 处理的是时间结构。

### 序列数据的特点

序列数据具有**时间依赖性**：当前时刻的数据与之前时刻的数据相关。

```
时间步:    t-2    t-1     t     t+1    t+2
           ↓      ↓       ↓     ↓      ↓
序列:     [我] → [爱] → [学习] → [深度] → [学习]
```

**常见序列数据：**

| 类型 | 示例 | 特点 |
|------|------|------|
| 文本 | "我爱学习" | 词序决定语义 |
| 语音 | 音频波形 | 时间连续 |
| 时间序列 | 股票价格 | 时间依赖 |
| 视频 | 帧序列 | 空间+时间 |

### RNN 的核心思想

RNN 的核心思想是：**维护一个隐藏状态，在时间步之间传递信息**。

类比理解：想象你在读一本书，每读一个词，你的大脑会记住之前的内容，并影响对当前词的理解。RNN 的隐藏状态就像你的"短期记忆"。

## 为什么需要 RNN？

### 前馈网络的局限

传统的前馈网络（包括 CNN）无法处理变长序列：

```
问题 1：输入长度不固定
"我喜欢" → 3 个词
"我非常喜欢深度学习" → 6 个词

问题 2：无法建模时间依赖
"我吃了苹果" vs "苹果吃了我"
词相同，顺序不同，含义完全不同
```

### RNN 的优势

| 特性 | 前馈网络 | RNN |
|------|---------|-----|
| 输入长度 | 固定 | 可变 |
| 时间依赖 | 无 | 有 |
| 参数共享 | 无 | 时间步间共享 |
| 序列理解 | 差 | 好 |

## 核心概念

### 隐藏状态

隐藏状态（Hidden State）是 RNN 的"记忆"，存储了之前所有时间步的信息。

```python
# 片段：隐藏状态的概念
import numpy as np

# 初始隐藏状态（通常初始化为 0）
h_0 = np.zeros(hidden_size)

# 每个时间步更新隐藏状态
h_t = np.tanh(W_hh @ h_prev + W_xh @ x_t + b_h)
```

### RNN 单元结构

一个 RNN 单元在每个时间步执行以下操作：

$$
h_t = \tanh(W_{hh} h_{t-1} + W_{xh} x_t + b_h)
$$

$$
y_t = W_{hy} h_t + b_y
$$

```python
# 片段：单个 RNN 单元
class RNNCell:
    """
    单个 RNN 单元实现
    """
    
    def __init__(self, input_size, hidden_size):
        # 初始化权重
        self.W_xh = np.random.randn(hidden_size, input_size) * 0.01
        self.W_hh = np.random.randn(hidden_size, hidden_size) * 0.01
        self.b_h = np.zeros(hidden_size)
        
        # 输出层权重
        self.W_hy = np.random.randn(output_size, hidden_size) * 0.01
        self.b_y = np.zeros(output_size)
    
    def forward(self, x_t, h_prev):
        """
        单步前向传播
        
        参数:
            x_t: 当前时间步输入 (input_size,)
            h_prev: 上一时间步隐藏状态 (hidden_size,)
        
        返回:
            h_t: 当前隐藏状态
            y_t: 当前输出
        """
        # 计算新的隐藏状态
        h_t = np.tanh(
            self.W_hh @ h_prev + 
            self.W_xh @ x_t + 
            self.b_h
        )
        
        # 计算输出
        y_t = self.W_hy @ h_t + self.b_y
        
        return h_t, y_t
```

上述代码实现了 RNN 单元的核心逻辑：

**参数说明：**

| 参数 | 形状 | 说明 |
|------|------|------|
| `W_xh` | (hidden_size, input_size) | 输入到隐藏层的权重 |
| `W_hh` | (hidden_size, hidden_size) | 隐藏层到隐藏层的权重 |
| `W_hy` | (output_size, hidden_size) | 隐藏层到输出的权重 |
| `b_h` | (hidden_size,) | 隐藏层偏置 |
| `b_y` | (output_size,) | 输出层偏置 |

**逐行解释：**

`self.W_hh @ h_prev` - 将上一时刻的隐藏状态变换到当前时刻。

`self.W_xh @ x_t` - 将当前输入变换到隐藏空间。

`np.tanh(...)` - 使用 tanh 激活函数，将值压缩到 (-1, 1) 范围。

### 完整 RNN 前向传播

```python
# 片段：完整 RNN 前向传播
class SimpleRNN:
    """
    完整的 RNN 实现
    """
    
    def __init__(self, input_size, hidden_size, output_size):
        self.input_size = input_size
        self.hidden_size = hidden_size
        self.output_size = output_size
        
        # 初始化权重
        self.W_xh = np.random.randn(hidden_size, input_size) * 0.01
        self.W_hh = np.random.randn(hidden_size, hidden_size) * 0.01
        self.b_h = np.zeros(hidden_size)
        
        self.W_hy = np.random.randn(output_size, hidden_size) * 0.01
        self.b_y = np.zeros(output_size)
    
    def forward(self, x_sequence):
        """
        处理整个序列
        
        参数:
            x_sequence: 输入序列 (seq_len, input_size)
        
        返回:
            outputs: 所有时间步的输出 (seq_len, output_size)
            hidden_states: 所有隐藏状态 (seq_len, hidden_size)
        """
        seq_len = x_sequence.shape[0]
        
        # 存储所有时间步的结果
        hidden_states = np.zeros((seq_len, self.hidden_size))
        outputs = np.zeros((seq_len, self.output_size))
        
        # 初始隐藏状态
        h_prev = np.zeros(self.hidden_size)
        
        # 逐时间步处理
        for t in range(seq_len):
            x_t = x_sequence[t]
            
            # 计算隐藏状态
            h_t = np.tanh(
                self.W_hh @ h_prev + 
                self.W_xh @ x_t + 
                self.b_h
            )
            
            # 计算输出
            y_t = self.W_hy @ h_t + self.b_y
            
            # 保存结果
            hidden_states[t] = h_t
            outputs[t] = y_t
            
            # 更新隐藏状态
            h_prev = h_t
        
        return outputs, hidden_states
```

### 时间展开视图

RNN 可以在时间维度上展开，便于理解：

```
        t=1         t=2         t=3
        ↓           ↓           ↓
输入:   x₁    →    x₂    →    x₃
        ↓           ↓           ↓
隐藏:   h₁    →    h₂    →    h₃
        ↓           ↓           ↓
输出:   y₁          y₂          y₃
```

**关键点：所有时间步共享同一组权重**，这就是"循环"的含义。

### 本节要点

> **记住这三点：**
> 1. 隐藏状态是 RNN 的"记忆"，在时间步之间传递
> 2. 每个时间步使用相同的权重（参数共享）
> 3. tanh 激活函数控制隐藏状态的范围

## 梯度问题

### 梯度消失

RNN 训练时需要通过时间反向传播（BPTT），梯度会经过多个时间步连乘。

$$
\frac{\partial L}{\partial h_0} = \frac{\partial L}{\partial h_T} \prod_{t=1}^{T} \frac{\partial h_t}{\partial h_{t-1}}
$$

当 $\frac{\partial h_t}{\partial h_{t-1}} < 1$ 时，梯度会指数级衰减：

```python
# 片段：演示梯度消失
def demonstrate_vanishing_gradient(seq_len=20):
    """
    演示梯度消失问题
    """
    # 假设每个时间步的梯度为 0.5
    gradient_per_step = 0.5
    
    # 经过 seq_len 个时间步后的梯度
    final_gradient = gradient_per_step ** seq_len
    
    print(f"初始梯度: 1.0")
    print(f"每个时间步保留: {gradient_per_step}")
    print(f"经过 {seq_len} 步后: {final_gradient:.10f}")
    print(f"梯度几乎为 0，无法学习长距离依赖")

demonstrate_vanishing_gradient()
```

**输出：**

```
初始梯度: 1.0
每个时间步保留: 0.5
经过 20 步后: 0.0000009537
梯度几乎为 0，无法学习长距离依赖
```

### 梯度爆炸

当 $\frac{\partial h_t}{\partial h_{t-1}} > 1$ 时，梯度会指数级增长：

```python
# 片段：演示梯度爆炸
def demonstrate_exploding_gradient(seq_len=20):
    """
    演示梯度爆炸问题
    """
    gradient_per_step = 1.5
    
    final_gradient = gradient_per_step ** seq_len
    
    print(f"初始梯度: 1.0")
    print(f"每个时间步放大: {gradient_per_step}")
    print(f"经过 {seq_len} 步后: {final_gradient:.2f}")
    print(f"梯度爆炸，数值不稳定")

demonstrate_exploding_gradient()
```

**输出：**

```
初始梯度: 1.0
每个时间步放大: 1.5
经过 20 步后: 3325.26
梯度爆炸，数值不稳定
```

### 解决方案

| 问题 | 解决方案 |
|------|---------|
| 梯度消失 | 使用 LSTM/GRU（门控机制） |
| 梯度爆炸 | 梯度裁剪（Gradient Clipping） |

```python
# 片段：梯度裁剪
def clip_gradient(grad, max_norm=5.0):
    """
    梯度裁剪
    
    参数:
        grad: 梯度
        max_norm: 最大范数
    """
    grad_norm = np.linalg.norm(grad)
    if grad_norm > max_norm:
        grad = grad * (max_norm / grad_norm)
    return grad
```

## RNN 变体

### 双向 RNN（BiRNN）

双向 RNN 同时考虑过去和未来的信息：

```python
# 片段：双向 RNN 概念
class BiRNN:
    """
    双向 RNN：前向 + 后向
    """
    
    def forward(self, x_sequence):
        # 前向 RNN：从左到右
        forward_outputs = self.forward_rnn(x_sequence)
        
        # 后向 RNN：从右到左
        backward_outputs = self.backward_rnn(x_sequence[::-1])
        
        # 拼接两个方向的输出
        outputs = np.concatenate([forward_outputs, backward_outputs], axis=-1)
        
        return outputs
```

### 深层 RNN

将多个 RNN 层堆叠：

```
输入序列
    ↓
RNN 层 1
    ↓
RNN 层 2
    ↓
RNN 层 3
    ↓
输出
```

## 完整示例：字符级语言模型

```python
# 完整示例：可直接运行
import numpy as np

class CharRNN:
    """
    字符级语言模型
    输入一个字符序列，预测下一个字符
    """
    
    def __init__(self, vocab_size, hidden_size):
        self.vocab_size = vocab_size
        self.hidden_size = hidden_size
        
        # 初始化权重
        self.W_xh = np.random.randn(hidden_size, vocab_size) * 0.01
        self.W_hh = np.random.randn(hidden_size, hidden_size) * 0.01
        self.b_h = np.zeros(hidden_size)
        
        self.W_hy = np.random.randn(vocab_size, hidden_size) * 0.01
        self.b_y = np.zeros(vocab_size)
    
    def softmax(self, x):
        """Softmax 激活函数"""
        exp_x = np.exp(x - np.max(x))
        return exp_x / np.sum(exp_x)
    
    def forward(self, inputs, h_prev=None):
        """
        前向传播
        
        参数:
            inputs: one-hot 编码的输入序列 (seq_len, vocab_size)
            h_prev: 初始隐藏状态
        
        返回:
            probs: 每个时间步的输出概率 (seq_len, vocab_size)
            h_last: 最后的隐藏状态
            cache: 用于反向传播的缓存
        """
        if h_prev is None:
            h_prev = np.zeros(self.hidden_size)
        
        seq_len = inputs.shape[0]
        
        # 缓存
        hidden_states = []
        outputs = []
        h = h_prev
        
        # 前向传播
        for t in range(seq_len):
            x_t = inputs[t]
            
            # 隐藏状态
            h = np.tanh(self.W_xh @ x_t + self.W_hh @ h + self.b_h)
            hidden_states.append(h)
            
            # 输出
            y = self.W_hy @ h + self.b_y
            outputs.append(y)
        
        # Softmax 得到概率
        probs = np.array([self.softmax(o) for o in outputs])
        
        cache = {
            'inputs': inputs,
            'hidden_states': hidden_states,
            'h_prev': h_prev
        }
        
        return probs, h, cache
    
    def sample(self, seed_char_idx, char_to_idx, idx_to_char, length=50):
        """
        从模型采样生成文本
        
        参数:
            seed_char_idx: 种子字符的索引
            char_to_idx: 字符到索引的映射
            idx_to_char: 索引到字符的映射
            length: 生成文本的长度
        """
        h = np.zeros(self.hidden_size)
        current_char = seed_char_idx
        
        generated = []
        
        for _ in range(length):
            # One-hot 编码
            x = np.zeros(self.vocab_size)
            x[current_char] = 1
            
            # 前向传播
            h = np.tanh(self.W_xh @ x + self.W_hh @ h + self.b_h)
            y = self.W_hy @ h + self.b_y
            
            # 采样
            probs = self.softmax(y)
            next_char = np.random.choice(self.vocab_size, p=probs)
            
            generated.append(idx_to_char[next_char])
            current_char = next_char
        
        return ''.join(generated)


# 测试
if __name__ == "__main__":
    # 简单的字符集
    chars = "abcdefghijklmnopqrstuvwxyz "
    char_to_idx = {c: i for i, c in enumerate(chars)}
    idx_to_char = {i: c for i, c in enumerate(chars)}
    
    vocab_size = len(chars)
    hidden_size = 64
    
    # 创建模型
    model = CharRNN(vocab_size, hidden_size)
    
    # 测试前向传播
    test_text = "hello"
    inputs = np.zeros((len(test_text), vocab_size))
    for i, c in enumerate(test_text):
        inputs[i, char_to_idx[c]] = 1
    
    probs, h_last, cache = model.forward(inputs)
    
    print(f"输入: {test_text}")
    print(f"输入形状: {inputs.shape}")
    print(f"输出概率形状: {probs.shape}")
    print(f"最后隐藏状态形状: {h_last.shape}")
    
    # 采样测试（未训练，输出随机）
    print(f"\n采样生成（未训练）:")
    generated = model.sample(char_to_idx['h'], char_to_idx, idx_to_char, length=20)
    print(f"生成文本: {generated}")
```

**编译与运行：**

```bash
python char_rnn.py
```

**预期输出：**

```
输入: hello
输入形状: (5, 27)
输出概率形状: (5, 27)
最后隐藏状态形状: (64,)

采样生成（未训练）:
生成文本: xkqmz lopwertyuiopasdf
```

## 常见陷阱与最佳实践

### 常见陷阱

::: warning
**陷阱 1：忘记初始化隐藏状态**

每个序列开始时，必须重置隐藏状态：

```python
# 错误：使用上一个序列的隐藏状态
for batch in dataloader:
    output, h = model(batch, h)  # h 没有重置

# 正确：每个序列重置隐藏状态
for batch in dataloader:
    h = model.init_hidden()  # 重置为 0
    output, h = model(batch, h)
```
:::

::: danger
**陷阱 2：处理变长序列时没有填充/截断**

RNN 需要统一长度的输入：

```python
# 错误：序列长度不一致
sequences = [[1, 2, 3], [1, 2], [1, 2, 3, 4, 5]]  # 无法组成 batch

# 正确：填充到相同长度
# 使用特殊符号 <PAD> 填充
sequences = [
    [1, 2, 3, <PAD>, <PAD>],
    [1, 2, <PAD>, <PAD>, <PAD>],
    [1, 2, 3, 4, 5]
]
```
:::

::: warning
**陷阱 3：使用 ReLU 导致数值不稳定**

RNN 中使用 ReLU 可能导致数值爆炸：

```python
# 有风险：ReLU 在 RNN 中可能导致数值爆炸
h = relu(W @ h_prev + W @ x)

# 推荐：使用 tanh
h = np.tanh(W @ h_prev + W @ x)
```
:::

### 最佳实践

1. **使用 LSTM/GRU 替代原始 RNN**：门控机制解决长距离依赖
2. **梯度裁剪**：防止梯度爆炸
3. **双向 RNN**：当未来信息重要时使用
4. **Teacher Forcing**：训练时使用真实标签作为下一时间步输入

## 总结

1. RNN 通过隐藏状态在时间步之间传递信息，适合处理序列数据
2. 核心问题：梯度消失/爆炸，难以学习长距离依赖
3. 变体：LSTM、GRU 通过门控机制解决长距离依赖问题
4. 实践中推荐使用 LSTM/GRU 而非原始 RNN

## 更新日志

| 日期 | 内容 |
|------|------|
| 2026-03-28 | 初稿发布 |

## 参考资料

[1] Rumelhart et al. Learning representations by back-propagating errors. 1986.

[2] Bengio et al. Learning Long-Term Dependencies with Gradient Descent is Difficult. 1994.

## 相关主题

- [CNN 基础](/notes/deep-learning/cnn) - 图像特征提取
- [LSTM 详解](/notes/deep-learning/lstm) - 解决长距离依赖
- [Transformer 架构](/notes/deep-learning/transformer) - 注意力机制
