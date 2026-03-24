---
title: 串口数据 - 嵌入式通信的基础
date: 2026-03-24
tags: [嵌入式, UART, 通信, C语言]
description: 掌握串口数据的高效收发方案，从中断到 DMA 的完整实现
---

# 串口数据

串口（UART，Universal Asynchronous Receiver/Transmitter）是嵌入式系统中最古老也最常用的通信接口。说它"古老"，是因为它的历史可以追溯到上世纪 60 年代的主机和终端通信；说它"常用"，是因为几乎每一款 MCU 都自带至少一个串口外设。

串口的魅力在于**简单**——两根线（TX、RX）就能通信，不需要时钟线，不需要片选信号。但"简单"不等于"简陋"，要实现高效可靠的数据收发，还是有不少门道的。

## 串口是怎么工作的？

想象两个人打电话：你说话，对方听；对方说话，你听。串口也是这样——TX（发送端）说话，RX（接收端）听。但电话有"喂？听得到吗？"的确认，串口没有——它是异步的，双方约定好速度（波特率），各自按节奏发、按节奏收。

<iframe src="/learning-notes/demos/uart-data.html" width="100%" height="600" frameborder="0" style="border-radius: 8px; margin: 16px 0;"></iframe>

### 串口帧结构

一个串口数据帧由以下几部分组成：

```
起始位(1bit) + 数据位(5-9bit) + 校验位(0-1bit) + 停止位(1-2bit)
```

空闲时线路保持高电平，当检测到下降沿（高变低）时，表示一个字节开始了。这就是"起始位"。之后是 5-9 位数据（通常用 8 位），可选的校验位，最后是停止位（回到高电平）。

### 关键参数详解

| 参数 | 常见值 | 说明 |
|------|--------|------|
| 波特率 | 9600, 115200, 921600 | 每秒传输的比特数 |
| 数据位 | 8 | 每帧数据的位数，8 位最常见 |
| 停止位 | 1 | 帧结束标志，给接收端处理时间 |
| 校验位 | None, Odd, Even | 简单的错误检测机制 |

::: tip 波特率的选择
- **9600**：传统低速设备，如 GPS 模块
- **115200**：最常见的调试波特率，平衡速度和稳定性
- **921600**：高速数据传输，需要 DMA 配合
:::

## 接收数据的三种方案

嵌入式开发中，接收串口数据有三种主流方案，各有适用场景。

### 方案对比

| 方案 | CPU 占用 | 实现复杂度 | 适用场景 |
|------|---------|-----------|---------|
| 轮询接收 | 高 | 简单 | 仅调试用 |
| 中断接收 | 中 | 中等 | 大多数场景 |
| DMA 接收 | 低 | 较复杂 | 高波特率、大数据量 |

### 方案一：中断接收（最常用）

中断接收是最经典的方案：每收到一个字节，硬件产生一个中断，在中断服务函数里把数据存起来。

#### 环形缓冲区结构定义

首先定义一个环形缓冲区来暂存接收到的数据：

```c
#define RX_BUF_SIZE  256

typedef struct {
    uint8_t buffer[RX_BUF_SIZE];
    volatile uint16_t head;
    volatile uint16_t tail;
} RingBuffer;
```

这里用 `volatile` 修饰 `head` 和 `tail`，因为它们会在中断和主循环两个上下文中被访问。编译器如果不加 `volatile`，可能会把值缓存到寄存器里，导致主循环永远看不到中断更新后的值。

#### 中断服务函数

```c
RingBuffer rx_buf = {0};

void USART1_IRQHandler(void) {
    if (USART_GetITStatus(USART1, USART_IT_RXNE)) {
        uint8_t data = USART_ReceiveData(USART1);
        
        uint16_t next = (rx_buf.head + 1) % RX_BUF_SIZE;
        if (next != rx_buf.tail) {
            rx_buf.buffer[rx_buf.head] = data;
            rx_buf.head = next;
        }
    }
}
```

中断函数的逻辑很简单：读一个字节，存到缓冲区，移动写指针。注意满判断——如果 `next == tail`，说明缓冲区满了，这个字节只能丢弃。

#### 主循环读取函数

```c
uint16_t uart_read(uint8_t *data, uint16_t len) {
    uint16_t count = 0;
    
    while (count < len && rx_buf.head != rx_buf.tail) {
        data[count++] = rx_buf.buffer[rx_buf.tail];
        rx_buf.tail = (rx_buf.tail + 1) % RX_BUF_SIZE;
    }
    
    return count;
}
```

主循环调用这个函数来取数据。返回值是实际读取的字节数，可能小于请求的 `len`。

::: warning 中断接收的局限
当波特率很高时（比如 921600），每秒会有约 92000 个字节，也就是每 10 微秒一个中断。如果中断处理来不及，数据就会丢失。这时候就该 DMA 上场了。
:::

### 方案二：DMA 接收（高速场景）

DMA（Direct Memory Access）是一种硬件机制，可以在不占用 CPU 的情况下搬运数据。让 DMA 直接把串口数据搬到内存缓冲区，CPU 只需要定期来取就行。

#### DMA 缓冲区定义

```c
#define DMA_BUF_SIZE  512

uint8_t dma_rx_buf[DMA_BUF_SIZE];
```

DMA 模式下不需要环形缓冲区的 head/tail 指针，因为 DMA 硬件会告诉我们"当前写到哪了"。

#### DMA 初始化

```c
void uart_dma_init(void) {
    DMA_InitTypeDef dma = {
        .DMA_PeripheralBaseAddr = (uint32_t)&USART1->DR,
        .DMA_MemoryBaseAddr = (uint32_t)dma_rx_buf,
        .DMA_DIR = DMA_DIR_PeripheralToMemory,
        .DMA_BufferSize = DMA_BUF_SIZE,
        .DMA_PeripheralInc = DMA_PeripheralInc_Disable,
        .DMA_MemoryInc = DMA_MemoryInc_Enable,
        .DMA_Mode = DMA_Mode_Circular,
    };
    DMA_Init(DMA1_Channel5, &dma);
    DMA_Cmd(DMA1_Channel5, ENABLE);
    
    USART_ITConfig(USART1, USART_IT_IDLE, ENABLE);
}
```

关键配置是 `DMA_Mode_Circular`（循环模式）。当 DMA 写满缓冲区后，会自动回到开头继续写，形成一个逻辑上的环形缓冲区。

#### 空闲中断处理

```c
void USART1_IRQHandler(void) {
    if (USART_GetITStatus(USART1, USART_IT_IDLE)) {
        USART_ReceiveData(USART1);
        
        uint16_t remaining = DMA_GetCurrDataCounter(DMA1_Channel5);
        uint16_t received = DMA_BUF_SIZE - remaining;
        
        process_data(dma_rx_buf, received);
    }
}
```

空闲中断（IDLE）是串口的一个特殊中断：当 RX 线上持续一段时间没有数据变化时触发。这非常适合判断"一帧数据接收完成"。

::: tip DMA 的优势
- **零 CPU 开销**：数据搬运完全由 DMA 完成
- **高波特率支持**：即使 921600 甚至更高也没问题
- **自动循环**：循环模式下无需手动重启
:::

## 发送数据的方案

发送数据相对简单，因为主动权在我们手里。

### 中断发送

发送端也需要缓冲区，因为调用者可能一次性写入很多数据，但串口只能一个字节一个字节地发。

#### 发送缓冲区结构

```c
#define TX_BUF_SIZE  256

typedef struct {
    uint8_t buffer[TX_BUF_SIZE];
    uint16_t head;
    uint16_t tail;
    volatile bool busy;
} TxBuffer;

TxBuffer tx_buf = {0};
```

`busy` 标志表示当前是否正在发送。如果正在发送，新数据只需要写入缓冲区，发送中断会自动把数据发出去。

#### 写入发送缓冲区

```c
uint16_t uart_write(uint8_t *data, uint16_t len) {
    uint16_t count = 0;
    
    while (count < len) {
        uint16_t next = (tx_buf.head + 1) % TX_BUF_SIZE;
        if (next == tx_buf.tail) break;
        
        tx_buf.buffer[tx_buf.head] = data[count++];
        tx_buf.head = next;
    }
    
    if (!tx_buf.busy && tx_buf.head != tx_buf.tail) {
        tx_buf.busy = true;
        USART_SendData(USART1, tx_buf.buffer[tx_buf.tail]);
        tx_buf.tail = (tx_buf.tail + 1) % TX_BUF_SIZE;
        USART_ITConfig(USART1, USART_IT_TXE, ENABLE);
    }
    
    return count;
}
```

这个函数先把数据写入缓冲区，然后检查是否需要启动发送。如果当前不忙，就发送第一个字节并开启发送中断。

#### 发送中断处理

```c
void USART1_IRQHandler(void) {
    if (USART_GetITStatus(USART1, USART_IT_TXE)) {
        if (tx_buf.head != tx_buf.tail) {
            USART_SendData(USART1, tx_buf.buffer[tx_buf.tail]);
            tx_buf.tail = (tx_buf.tail + 1) % TX_BUF_SIZE;
        } else {
            tx_buf.busy = false;
            USART_ITConfig(USART1, USART_IT_TXE, DISABLE);
        }
    }
}
```

发送中断的逻辑：缓冲区还有数据就继续发，发完了就关闭中断。

## 帧接收策略

串口是字节流，没有天然的"帧"边界。怎么知道一帧数据结束了？

### 超时检测法

最常用的方法是超时检测：如果一段时间（比如 10ms）没有新数据，就认为一帧结束了。

#### 帧接收器结构

```c
typedef struct {
    uint8_t buffer[256];
    uint16_t index;
    uint32_t last_time;
    uint16_t timeout;
    bool ready;
} FrameReceiver;
```

#### 超时检测函数

```c
bool frame_check(FrameReceiver *rx, uint32_t now) {
    if (rx->index > 0 && (now - rx->last_time) >= rx->timeout) {
        rx->ready = true;
        return true;
    }
    return false;
}
```

#### 主循环使用示例

```c
void main(void) {
    FrameReceiver rx = {.timeout = 10};
    
    while (1) {
        uint8_t data;
        if (uart_read(&data, 1)) {
            rx.buffer[rx.index++] = data;
            rx.last_time = get_tick();
        }
        
        if (frame_check(&rx, get_tick())) {
            process_frame(rx.buffer, rx.index);
            rx.index = 0;
        }
    }
}
```

### 协议帧边界法

更好的做法是在协议层面定义帧边界，比如：
- 固定帧头帧尾
- 长度字段
- 特殊转义字符

这部分在 [通信协议](/notes/embedded/protocol) 中详细介绍。

## 调试技巧

### 重定向 printf

在开发阶段，用 `printf` 调试非常方便。只需要重定向 `fputc` 函数：

```c
int fputc(int ch, FILE *f) {
    while (USART_GetFlagStatus(USART1, USART_FLAG_TXE) == RESET);
    USART_SendData(USART1, ch);
    return ch;
}
```

### 调试宏

```c
#ifdef DEBUG
    #define DBG(fmt, ...) printf("[%s] " fmt "\n", __func__, ##__VA_ARGS__)
#else
    #define DBG(fmt, ...)
#endif
```

使用示例：

```c
void process_data(uint8_t *data, uint16_t len) {
    DBG("received %d bytes", len);
}
```

发布版本只需要注释掉 `DEBUG` 宏定义，所有调试输出就消失了。

## 常见问题

### Q: 为什么数据会丢失？

可能原因：
1. **缓冲区溢出**：接收缓冲区太小，处理速度跟不上
2. **中断优先级**：其他中断占用了太长时间
3. **波特率误差**：双方波特率不一致

### Q: 如何选择缓冲区大小？

经验公式：

```
缓冲区大小 ≥ 波特率 / 10 × 最长处理间隔(秒)
```

例如：波特率 115200，主循环最坏 50ms 处理一次，则缓冲区至少需要 `115200 / 10 × 0.05 = 576` 字节。

### Q: DMA 和中断能混用吗？

可以。常见做法是 DMA 接收 + 中断发送，或者 DMA 收发都用。

## 总结

1. **串口帧结构**由起始位、数据位、校验位、停止位组成
2. **中断接收**适合大多数场景，实现简单可靠
3. **DMA 接收**适合高波特率，零 CPU 开销
4. **环形缓冲区**是数据缓冲的核心数据结构
5. **超时检测**是判断帧边界的常用方法
6. **printf 重定向**让调试更方便

## 相关主题

- [环形缓冲区](/notes/embedded/ring-buffer) - 高效数据缓冲
- [数据封装](/notes/embedded/data-encapsulation) - 数据帧设计
- [通信协议](/notes/embedded/protocol) - 协议设计
- [回调函数](/notes/embedded/callback) - 事件通知机制
