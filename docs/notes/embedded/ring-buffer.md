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

<CollapsibleIframe src="/learning-notes/demos/ring-buffer.html" title="环形缓冲区演示" :height="320" />

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

## 为什么缓冲区大小必须是 2 的幂次方

注意看取模操作，这里没有用 `%`，而是用了 `&`：

```c
(rb->head + 1) & (RING_BUF_SIZE - 1)
```

当 `RING_BUF_SIZE` 是 2 的幂次方（如 64、128、256）时，`x % SIZE` 等价于 `x & (SIZE - 1)`。位与操作比取模快得多，在没有硬件除法器的 MCU 上（比如 Cortex-M0），这个差距相当可观。

<CollapsibleIframe src="/learning-notes/demos/bitwise-mod.html" title="位运算取模演示" :height="380" />

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

<CollapsibleIframe src="/learning-notes/demos/ring-full-empty.html" title="满/空判断演示" :height="420" />

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

<CollapsibleIframe src="/learning-notes/demos/ring-dma.html" title="DMA 模式演示" :height="400" />

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
