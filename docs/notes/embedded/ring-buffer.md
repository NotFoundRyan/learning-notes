---
title: 环形缓冲区 - 嵌入式开发必备数据结构
date: 2026-03-24
tags: [嵌入式, 数据结构, C语言, DMA]
description: 深入理解环形缓冲区的原理与实现，包含 DMA 优化方案
---

# 环形缓冲区

## 为什么叫"环"？

环形缓冲区本质上就是一个**定长数组**，加上两个索引—— `head`（写指针）和 `tail`（读指针）。写数据时 head 往前走，读数据时 tail 往前走。关键在于：**走到数组末尾时，绕回开头**。

这就是"环"的由来。物理上是一段连续内存，逻辑上首尾相连。

<CollapsibleIframe src="/learning-notes/demos/ring-buffer/ring-buffer.html" title="环形缓冲区演示" :height="320" />

### 与普通队列的对比

| 特性 | 普通数组队列 | 环形缓冲区 |
|------|-------------|-----------|
| 数据搬移 | 需要整体前移或浪费空间 | 不需要搬移 |
| 内存分配 | 可能需要动态分配 | 编译期确定 |
| 适用场景 | 通用场景 | 嵌入式、实时系统 |

环形缓冲区最大的好处是**不需要搬移数据**。普通数组队列读完前面的数据后，要么整体前移，要么浪费空间。环形缓冲区天然解决了这个问题——读写指针追着跑就行。

对嵌入式场景来说还有一个关键优势：**内存在编译期就确定了，不需要动态分配**。在资源紧张的 MCU 上，这一点非常重要。

## 基础实现

```c
#define RING_BUF_SIZE  256   /* 必须是2的幂次方! */

typedef struct {
    uint8_t  buf[RING_BUF_SIZE];
    volatile uint32_t head;  /* 写索引 */
    volatile uint32_t tail;  /* 读索引 */
} ring_buf_t;

/* 写入一个字节 —— 通常在中断中调用 */
int ring_buf_put(ring_buf_t *rb, uint8_t data)
{
    uint32_t next = (rb->head + 1) & (RING_BUF_SIZE - 1);
    if (next == rb->tail)
        return -1;        /* 满了，丢弃 */

    rb->buf[rb->head] = data;
    rb->head = next;
    return 0;
}

/* 读出一个字节 —— 通常在主循环中调用 */
int ring_buf_get(ring_buf_t *rb, uint8_t *data)
{
    if (rb->head == rb->tail)
        return -1;        /* 空的 */

    *data = rb->buf[rb->tail];
    rb->tail = (rb->tail + 1) & (RING_BUF_SIZE - 1);
    return 0;
}
```

上述代码实现了环形缓冲区的核心数据结构和读写函数：

**结构体成员说明：**

| 成员 | 类型 | 说明 |
|------|------|------|
| `buf` | `uint8_t[RING_BUF_SIZE]` | 实际存储数据的数组，大小必须是 2 的幂次方 |
| `head` | `volatile uint32_t` | 写索引，指向下一个要写入的位置，由生产者更新 |
| `tail` | `volatile uint32_t` | 读索引，指向下一个要读取的位置，由消费者更新 |

**ring_buf_put 函数说明：**

**参数说明：**
- `rb`：指向环形缓冲区结构体的指针
- `data`：要写入的字节数据

**返回值：**
- 成功：返回 `0`
- 失败：返回 `-1`（缓冲区已满时）

**逐行解释：**

`uint32_t next = (rb->head + 1) & (RING_BUF_SIZE - 1)` - 计算下一个写入位置，使用位与运算实现取模，当 head 到达数组末尾时自动绕回开头。

`if (next == rb->tail) return -1` - 判断缓冲区是否已满。如果下一个写入位置等于读索引，说明 head 即将追上 tail，缓冲区满了，丢弃数据。

`rb->buf[rb->head] = data` - 将数据写入当前 head 指向的位置。

`rb->head = next` - 更新 head 指针，指向下一个写入位置。

**ring_buf_get 函数说明：**

**参数说明：**
- `rb`：指向环形缓冲区结构体的指针
- `data`：输出参数，用于存储读取到的字节

**返回值：**
- 成功：返回 `0`
- 失败：返回 `-1`（缓冲区为空时）

**逐行解释：**

`if (rb->head == rb->tail) return -1` - 判断缓冲区是否为空。当 head 等于 tail 时，说明没有数据可读。

`*data = rb->buf[rb->tail]` - 从 tail 指向的位置读取数据。

`rb->tail = (rb->tail + 1) & (RING_BUF_SIZE - 1)` - 更新 tail 指针，使用位与运算实现循环。

## 为什么缓冲区大小必须是 2 的幂次方

注意看取模操作，这里没有用 `%`，而是用了 `&`：

```c
(rb->head + 1) & (RING_BUF_SIZE - 1)
```

当 `RING_BUF_SIZE` 是 2 的幂次方（如 64、128、256）时，`x % SIZE` 等价于 `x & (SIZE - 1)`。位与操作比取模快得多，在没有硬件除法器的 MCU 上（比如 Cortex-M0），这个差距相当可观。

<CollapsibleIframe src="/learning-notes/demos/bitwise/bitwise-mod.html" title="位运算取模演示" :height="380" />

::: tip 性能对比
| 操作 | 指令周期 (Cortex-M0) |
|------|---------------------|
| 取模 % | 2-12 周期 |
| 位与 & | 1 周期 |
:::

## volatile 的作用

注意 `head` 和 `tail` 都声明成了 `volatile`。为什么？

在典型的嵌入式使用场景中：
- 中断写 `head`，主循环读 `head`
- 主循环写 `tail`，中断读 `tail`

如果不加 `volatile`，编译器可能把 `head` 的值缓存到寄存器里，主循环永远看到的是旧值——数据明明写进去了，但读端以为缓冲区是空的。

::: warning 注意
`volatile` 只保证每次都从内存读取，**不保证操作的原子性**。在单核 MCU 上，单生产者单消费者的场景下，`volatile` 就够了。但如果是多核系统或者涉及 DMA，还需要额外的内存屏障（memory barrier）。
:::

## 如何区分"满"和"空"

环形缓冲区有个经典问题：当 `head == tail` 时，到底是"满"还是"空"？

上面的实现采用了最常见的做法——**牺牲一个存储位**。满的判断条件是 `next_head == tail`，意味着 head 追上 tail 之前就停下来，永远保留一个空位。

<CollapsibleIframe src="/learning-notes/demos/ring-buffer/ring-full-empty.html" title="满/空判断演示" :height="420" />

**两种方案对比：**

| 方案 | 优点 | 缺点 |
|------|------|------|
| 牺牲一个字节 | 简单，无需原子操作 | 浪费 1 字节空间 |
| 使用 count 变量 | 用满全部空间 | 需要保证原子性，更复杂 |

多数时候，浪费一个字节是更划算的选择。

## DMA 模式

如果你的串口波特率到了 921600 甚至更高，逐字节中断的方案就撑不住了——中断太频繁，CPU 被打断得喘不过气。这时候就该让 DMA 上场。

### 核心思路

让 DMA 直接往环形缓冲区的数组里搬数据，CPU 只需要定期来看看 DMA 搬到哪了。

<CollapsibleIframe src="/learning-notes/demos/ring-buffer/ring-dma.html" title="DMA 模式演示" :height="400" />

```c
/* DMA配置为循环模式，目标地址指向 rb.buf */

/* 获取DMA当前写到哪了 */
uint32_t dma_get_head(ring_buf_t *rb)
{
    /* NDTR: 剩余未传输的数据数量 */
    /* DMA写位置 = 总大小 - 剩余数量 */
    return (RING_BUF_SIZE - __HAL_DMA_GET_COUNTER(&hdma_rx))
           & (RING_BUF_SIZE - 1);
}

/* 在主循环或定时器中断中调用 */
void process_uart_data(ring_buf_t *rb)
{
    uint32_t head = dma_get_head(rb);

    while (rb->tail != head) {
        uint8_t byte = rb->buf[rb->tail];
        rb->tail = (rb->tail + 1) & (RING_BUF_SIZE - 1);
        /* 送给协议解析器处理 */
        protocol_feed(byte);
    }
}
```

上述代码实现了 DMA 模式下的环形缓冲区数据处理：

**dma_get_head 函数说明：**

**返回值：**
- 返回 DMA 当前写入位置（head 索引）

**逐行解释：**

`__HAL_DMA_GET_COUNTER(&hdma_rx)` - 获取 DMA 控制器的 NDTR（Number of Data to Transfer）寄存器值，表示剩余未传输的数据数量。DMA 每传输一个字节，NDTR 减 1。

`RING_BUF_SIZE - NDTR` - 用总大小减去剩余数量，得到 DMA 已经写到的位置。例如，总大小 256，剩余 200，说明已经写了 56 个字节。

`& (RING_BUF_SIZE - 1)` - 使用位与运算确保索引在有效范围内，实现循环。

**process_uart_data 函数说明：**

**参数说明：**
- `rb`：指向环形缓冲区结构体的指针

**逐行解释：**

`uint32_t head = dma_get_head(rb)` - 获取 DMA 当前写入位置，作为数据处理的终点。

`while (rb->tail != head)` - 循环处理从 tail 到 head 之间的所有数据。tail 是上次处理到的位置，head 是 DMA 最新写入的位置。

`uint8_t byte = rb->buf[rb->tail]` - 从缓冲区读取一个字节。

`rb->tail = (rb->tail + 1) & (RING_BUF_SIZE - 1)` - 更新 tail 指针，移动到下一个位置。

`protocol_feed(byte)` - 将读取到的字节送给协议解析器处理。

**DMA 模式优势：**

| 特性 | 中断模式 | DMA 模式 |
|------|----------|----------|
| CPU 占用 | 每字节一次中断 | 几乎不占用 |
| 响应延迟 | 低 | 略高（轮询间隔） |
| 适用波特率 | < 921600 | 可达数 Mbps |
| 实现复杂度 | 简单 | 中等 |

这种方案的好处是：**接收数据完全不需要 CPU 介入**。DMA 在后台默默搬运，CPU 想什么时候来取就什么时候来取。哪怕主循环偶尔卡一下也没关系，只要别卡到缓冲区被覆盖就行。

## 常见问题

### Q: 如何判断缓冲区当前数据量？

```c
uint32_t ring_buf_count(ring_buf_t *rb)
{
    return (rb->head - rb->tail) & (RING_BUF_SIZE - 1);
}
```

### Q: 多生产者/多消费者怎么办？

需要加锁或使用无锁队列。单生产者单消费者场景下，本文的实现已经足够。

### Q: 缓冲区大小如何选择？

- 根据数据速率和处理能力估算
- 考虑最坏情况下的数据堆积
- 常见选择：64、128、256、512、1024

## 总结

1. **环形缓冲区**通过读写指针的循环移动，实现了无需数据搬移的队列
2. **2 的幂次方大小**配合位运算，可以显著提升性能
3. **volatile** 保证多上下文访问的可见性，但不保证原子性
4. **牺牲一个字节**是最简单可靠的满/空判断方案
5. **DMA 模式**可以大幅降低 CPU 负担，适合高速通信场景
