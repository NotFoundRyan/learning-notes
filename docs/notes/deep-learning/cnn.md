---
title: 卷积神经网络（CNN）基础
date: 2026-03-28
tags: [深度学习, CNN, 神经网络, 图像处理]
category: deep-learning
description: 深入讲解卷积神经网络的核心概念，包括卷积层、池化层、特征提取等，配合代码示例帮助你理解 CNN 的工作原理
difficulty: intermediate
prerequisites:
  - /notes/cs/data-structure
---

# 卷积神经网络（CNN）基础

> 阅读时长：约 20 分钟
> 难度等级：中级
> 读完你将学会：理解 CNN 的核心组件、手动实现卷积操作、选择合适的网络架构

## 要点速览

> - CNN 通过**卷积操作**自动提取图像特征，无需人工设计特征
> - **卷积层**用滑动窗口提取局部特征，**池化层**降低特征维度
> - 核心参数：卷积核大小、步长、填充方式
> - 经典架构：LeNet → AlexNet → VGG → ResNet

如果你只是想快速了解 CNN 的核心思想，可以跳到[核心概念](#核心概念)部分。

## 前置知识

阅读本文前，你需要了解：

- 基本的矩阵运算（[复习：数据结构基础](/notes/cs/data-structure)）
- Python 编程基础
- 神经网络的基本概念（神经元、激活函数、反向传播）

本文不假设你了解：

- 任何深度学习框架的高级用法
- 复杂的优化算法

## 什么是卷积神经网络？

卷积神经网络（Convolutional Neural Network，CNN）是一种专门用于处理**网格结构数据**的神经网络，最典型的应用是图像识别。

### 从传统方法说起

在 CNN 出现之前，图像识别的流程是这样的：

```
原始图像 → 人工设计特征（SIFT、HOG） → 分类器（SVM） → 结果
```

这种方式的问题在于：**特征需要人工设计**，不同任务需要不同的特征工程。

### CNN 的核心思想

CNN 的核心思想是：**让网络自动学习特征**。

```
原始图像 → CNN（自动学习特征） → 分类结果
```

类比理解：想象你在看一张照片，你的眼睛会自动关注边缘、颜色、形状等特征，然后大脑综合这些特征做出判断。CNN 就是在模拟这个过程。

## 为什么需要 CNN？

### 全连接网络的问题

假设我们有一张 1000×1000 的彩色图像，如果用全连接网络：

$$
\text{参数量} = 1000 \times 1000 \times 3 \times \text{隐藏层神经元数}
$$

这会导致：
- **参数爆炸**：内存和计算资源无法承受
- **丢失空间信息**：图像被展平成一维向量，像素间的空间关系丢失

### CNN 的优势

| 特性 | 全连接网络 | CNN |
|------|-----------|-----|
| 参数量 | 非常大 | 大幅减少（权重共享） |
| 空间信息 | 丢失 | 保留 |
| 平移不变性 | 无 | 有 |
| 特征提取 | 需人工设计 | 自动学习 |

## 核心概念

### 卷积操作

卷积是 CNN 最核心的操作。理解卷积，需要掌握三个关键概念：

#### 1. 卷积核（Kernel/Filter）

卷积核是一个小的权重矩阵，用于在输入上滑动并提取特征。

```python
# 片段：展示卷积核的概念
import numpy as np

# 一个 3x3 的边缘检测卷积核
edge_kernel = np.array([
    [-1, -1, -1],
    [-1,  8, -1],
    [-1, -1, -1]
])
```

上述代码定义了一个边缘检测卷积核：

**卷积核说明：**

| 参数 | 值 | 说明 |
|------|-----|------|
| 大小 | 3×3 | 卷积核的尺寸 |
| 用途 | 边缘检测 | 中心像素与周围像素差异大时响应强 |
| 权重 | 中心为 8，周围为 -1 | 突出中心与边缘的对比 |

#### 2. 滑动窗口

卷积核在输入图像上滑动，每个位置计算一次点积。

```python
# 片段：手动实现二维卷积
def conv2d(input_image, kernel):
    """
    手动实现二维卷积操作
    
    参数:
        input_image: 输入图像 (H, W)
        kernel: 卷积核 (kH, kW)
    
    返回:
        output: 卷积结果
    """
    h, w = input_image.shape
    kh, kw = kernel.shape
    
    # 计算输出尺寸（无填充，步长为1）
    out_h = h - kh + 1
    out_w = w - kw + 1
    
    output = np.zeros((out_h, out_w))
    
    # 滑动窗口
    for i in range(out_h):
        for j in range(out_w):
            # 提取局部区域
            region = input_image[i:i+kh, j:j+kw]
            # 点积并求和
            output[i, j] = np.sum(region * kernel)
    
    return output
```

上述代码实现了二维卷积的核心逻辑：

**参数说明：**
- `input_image`：输入图像，二维数组
- `kernel`：卷积核，二维数组

**逐行解释：**

`out_h = h - kh + 1` - 计算输出高度，因为卷积核不能超出图像边界。

`region = input_image[i:i+kh, j:j+kw]` - 提取当前窗口覆盖的局部区域。

`output[i, j] = np.sum(region * kernel)` - 对应元素相乘后求和，得到一个输出值。

#### 3. 步长与填充

**步长（Stride）**：卷积核每次移动的距离。

**填充（Padding）**：在输入边缘填充 0，控制输出尺寸。

```python
# 片段：带填充和步长的卷积
def conv2d_advanced(input_image, kernel, stride=1, padding=0):
    """
    带填充和步长的二维卷积
    
    参数:
        input_image: 输入图像 (H, W)
        kernel: 卷积核 (kH, kW)
        stride: 步长
        padding: 填充大小
    """
    # 添加填充
    if padding > 0:
        input_image = np.pad(input_image, padding, mode='constant')
    
    h, w = input_image.shape
    kh, kw = kernel.shape
    
    # 计算输出尺寸
    out_h = (h - kh) // stride + 1
    out_w = (w - kw) // stride + 1
    
    output = np.zeros((out_h, out_w))
    
    for i in range(out_h):
        for j in range(out_w):
            si, sj = i * stride, j * stride
            region = input_image[si:si+kh, sj:sj+kw]
            output[i, j] = np.sum(region * kernel)
    
    return output
```

**输出尺寸计算公式：**

$$
O = \frac{W - K + 2P}{S} + 1
$$

其中：
- $O$：输出尺寸
- $W$：输入尺寸
- $K$：卷积核大小
- $P$：填充大小
- $S$：步长

### 池化操作

池化用于降低特征图的空间维度，减少参数量。

```python
# 片段：最大池化实现
def max_pool2d(input_feature, pool_size=2, stride=2):
    """
    最大池化操作
    
    参数:
        input_feature: 输入特征图 (H, W)
        pool_size: 池化窗口大小
        stride: 步长
    """
    h, w = input_feature.shape
    out_h = (h - pool_size) // stride + 1
    out_w = (w - pool_size) // stride + 1
    
    output = np.zeros((out_h, out_w))
    
    for i in range(out_h):
        for j in range(out_w):
            si, sj = i * stride, j * stride
            region = input_feature[si:si+pool_size, sj:sj+pool_size]
            output[i, j] = np.max(region)
    
    return output
```

**池化类型对比：**

| 类型 | 操作 | 特点 |
|------|------|------|
| 最大池化 | 取窗口内最大值 | 保留最显著特征 |
| 平均池化 | 取窗口内平均值 | 保留整体信息 |
| 全局池化 | 对整个特征图操作 | 常用于输出层 |

### 激活函数

CNN 中最常用的激活函数是 ReLU：

$$
\text{ReLU}(x) = \max(0, x)
$$

```python
# 片段：ReLU 激活函数
def relu(x):
    """ReLU 激活函数"""
    return np.maximum(0, x)
```

**为什么选择 ReLU？**

- 计算简单，梯度为 0 或 1
- 缓解梯度消失问题
- 使网络具有稀疏激活特性

### 本节要点

> **记住这三点：**
> 1. 卷积核是可学习的特征提取器，通过滑动窗口实现
> 2. 步长控制下采样程度，填充控制输出尺寸
> 3. 池化降低维度，ReLU 引入非线性

## 经典网络架构

### LeNet-5（1998）

LeNet 是最早的 CNN 之一，用于手写数字识别。

```
输入(32×32) → Conv(6@28×28) → Pool(6@14×14) → Conv(16@10×10) → Pool(16@5×5) → FC → 输出
```

### VGG（2014）

VGG 的核心思想：**用小卷积核堆叠替代大卷积核**。

```python
# 片段：VGG 块的定义
def vgg_block(num_convs, in_channels, out_channels):
    """
    VGG 块：多个 3x3 卷积 + 最大池化
    
    参数:
        num_convs: 卷积层数量
        in_channels: 输入通道数
        out_channels: 输出通道数
    """
    layers = []
    for _ in range(num_convs):
        layers.append(('conv', 3, out_channels))  # 3x3 卷积
        layers.append(('relu',))
    layers.append(('maxpool', 2))  # 2x2 最大池化
    return layers
```

**为什么用两个 3×3 卷积替代一个 5×5 卷积？**

- 参数量：$2 \times 3^2 = 18$ vs $5^2 = 25$
- 感受野相同：两个 3×3 的感受野也是 5×5
- 非线性更强：多了一层激活函数

### ResNet（2015）

ResNet 引入**残差连接**，解决了深层网络的训练问题。

```python
# 片段：残差块
class ResidualBlock:
    """
    残差块：F(x) + x
    """
    def __init__(self, channels):
        self.channels = channels
    
    def forward(self, x):
        # 主路径：两个卷积
        out = conv2d(x, self.channels)
        out = relu(out)
        out = conv2d(out, self.channels)
        
        # 残差连接：直接相加
        out = out + x
        out = relu(out)
        return out
```

**残差连接的作用：**

$$
\text{输出} = F(x) + x
$$

- 梯度可以直接通过跳跃连接回传
- 网络可以学习恒等映射
- 允许训练非常深的网络（100+ 层）

## 完整示例：简单 CNN

```python
# 完整示例：可直接运行
import numpy as np

class SimpleCNN:
    """
    一个简单的 CNN 实现
    结构：Conv -> ReLU -> Pool -> Conv -> ReLU -> Pool -> FC
    """
    
    def __init__(self):
        # 初始化卷积核（随机初始化）
        self.conv1_filters = np.random.randn(6, 3, 3) * 0.1
        self.conv2_filters = np.random.randn(16, 6, 3, 3) * 0.1
        
    def conv_forward(self, input_data, filters, stride=1):
        """卷积前向传播"""
        if len(input_data.shape) == 2:
            input_data = input_data[np.newaxis, :, :]
        
        num_filters, in_channels, kh, kw = filters.shape
        h, w = input_data.shape[1], input_data.shape[2]
        
        out_h = (h - kh) // stride + 1
        out_w = (w - kw) // stride + 1
        
        output = np.zeros((num_filters, out_h, out_w))
        
        for f in range(num_filters):
            for i in range(out_h):
                for j in range(out_w):
                    si, sj = i * stride, j * stride
                    region = input_data[:, si:si+kh, sj:sj+kw]
                    output[f, i, j] = np.sum(region * filters[f])
        
        return output
    
    def maxpool_forward(self, input_data, pool_size=2):
        """最大池化前向传播"""
        num_channels, h, w = input_data.shape
        out_h, out_w = h // pool_size, w // pool_size
        
        output = np.zeros((num_channels, out_h, out_w))
        
        for c in range(num_channels):
            for i in range(out_h):
                for j in range(out_w):
                    si, sj = i * pool_size, j * pool_size
                    region = input_data[c, si:si+pool_size, sj:sj+pool_size]
                    output[c, i, j] = np.max(region)
        
        return output
    
    def forward(self, x):
        """完整前向传播"""
        # 第一卷积块
        x = self.conv_forward(x, self.conv1_filters)
        x = np.maximum(0, x)  # ReLU
        x = self.maxpool_forward(x)
        
        # 第二卷积块
        x = self.conv_forward(x, self.conv2_filters)
        x = np.maximum(0, x)  # ReLU
        x = self.maxpool_forward(x)
        
        # 展平
        x = x.flatten()
        
        return x

# 测试
if __name__ == "__main__":
    # 创建随机输入（模拟 28x28 灰度图像）
    input_image = np.random.randn(1, 28, 28)
    
    # 创建网络
    cnn = SimpleCNN()
    
    # 前向传播
    features = cnn.forward(input_image)
    
    print(f"输入形状: {input_image.shape}")
    print(f"输出特征维度: {features.shape}")
```

**编译与运行：**

```bash
python simple_cnn.py
```

**预期输出：**

```
输入形状: (1, 28, 28)
输出特征维度: (400,)
```

## 常见陷阱与最佳实践

### 常见陷阱

::: warning
**陷阱 1：忽略维度顺序**

不同框架的维度顺序不同：
- PyTorch：`(N, C, H, W)` - 批次、通道、高度、宽度
- TensorFlow：`(N, H, W, C)` - 批次、高度、宽度、通道

维度顺序错误会导致完全错误的结果。
:::

::: danger
**陷阱 2：卷积核初始化不当**

如果卷积核初始化为全 0 或全相同值，所有滤波器会学习相同的特征。

```python
# 错误示例
kernel = np.zeros((3, 3))  # 所有滤波器将学习相同特征

# 正确示例
kernel = np.random.randn(3, 3) * 0.01  # 随机初始化
```
:::

::: warning
**陷阱 3：忘记非线性激活**

连续的线性操作（卷积、池化）仍然是线性的，必须加入激活函数。

```python
# 错误：缺少激活函数
x = conv(x)
x = conv(x)  # 两次线性变换 = 一次线性变换

# 正确
x = conv(x)
x = relu(x)  # 引入非线性
x = conv(x)
```
:::

### 最佳实践

1. **使用小卷积核堆叠**：多个 3×3 卷积比单个大卷积核更高效
2. **批量归一化**：在卷积后、激活前使用 BatchNorm
3. **数据增强**：随机翻转、旋转、裁剪增加数据多样性
4. **预训练模型**：使用 ImageNet 预训练权重进行迁移学习

## 总结

1. CNN 通过卷积操作自动学习图像特征，解决了传统方法需要人工设计特征的问题
2. 核心组件：卷积层（特征提取）、池化层（降维）、激活函数（非线性）
3. 经典架构演进：LeNet → AlexNet → VGG → ResNet，核心思想是加深网络、残差连接
4. 实践中注意维度顺序、初始化方法、激活函数的使用

## 更新日志

| 日期 | 内容 |
|------|------|
| 2026-03-28 | 初稿发布 |

## 参考资料

[1] LeCun et al. Gradient-Based Learning Applied to Document Recognition. 1998.

[2] Simonyan & Zisserman. Very Deep Convolutional Networks for Large-Scale Image Recognition. 2014.

[3] He et al. Deep Residual Learning for Image Recognition. 2015.

## 相关主题

- [RNN 基础](/notes/deep-learning/rnn) - 序列建模
- [Transformer 架构](/notes/deep-learning/transformer) - 注意力机制
