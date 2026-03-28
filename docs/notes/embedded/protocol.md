---
title: 通信协议 - 嵌入式设备间的对话规则
date: 2026-03-27
tags: [嵌入式, 通信协议, C语言, 状态机, 串口]
category: embedded/protocol
description: 深入理解嵌入式通信协议设计，掌握帧结构、状态机解析、CRC校验、应答重传等核心技术
difficulty: intermediate
---

# 通信协议

> ⏱️ 阅读时长：约 20 分钟
> 📊 难度等级：中级
> 🎯 读完你将学会：协议帧结构设计、CRC 校验、状态机解析、应答重传机制

## 要点速览

> - **帧结构**：帧头 + 长度 + 序列号 + 命令 + 数据 + CRC + 帧尾
> - **CRC 校验**：检测传输错误，查表法高效实现
> - **状态机解析**：逐字节处理，健壮可靠，自动恢复
> - **应答重传**：ACK 确认成功，超时重发，限制重传次数
>
> 如果你想快速了解实现方式，跳到[状态机解析实现](#状态机解析实现)。

## 什么是通信协议？

通信协议是 **设备之间交换数据的规则约定**。如果把串口比作"电话线"，那通信协议就是"对话规则"——两个人打电话，需要约定谁先说话、怎么确认对方听懂了、没听清怎么办。

### 通信协议的作用

```
┌─────────────────────────────────────────────────────────────┐
│                    通信协议的作用                            │
│                                                             │
│  没有协议:                                                  │
│  ┌──────┐                      ┌──────┐                    │
│  │ 设备A │─── 0x01 0x02 0x03 ──►│ 设备B │                    │
│  └──────┘                      └──────┘                    │
│            B 不知道这些字节是什么意思                         │
│            不知道从哪里开始、到哪里结束                        │
│            不知道数据是否正确                                 │
│                                                             │
│  有协议:                                                    │
│  ┌──────┐                      ┌──────┐                    │
│  │ 设备A │─── [AA 55][03][01] ──►│ 设备B │                    │
│  │      │    [CMD][DATA][CRC]    │      │                    │
│  └──────┘    ◄─── [ACK] ────────└──────┘                    │
│                                                             │
│  B 知道:                                                    │
│  1. AA 55 是帧头，新的一帧开始了                             │
│  2. 03 是长度，后面有 3 字节数据                             │
│  3. CMD 是命令码，知道要做什么                               │
│  4. CRC 是校验，可以验证数据正确性                           │
│  5. 收到后回复 ACK 确认                                      │
└─────────────────────────────────────────────────────────────┘
```

### 协议设计三原则

设计协议时，需要平衡三个目标：

| 原则 | 说明 | 实现手段 |
|------|------|----------|
| 可靠性 | 数据准确送达，不丢不错不乱序 | CRC 校验、应答机制、重传机制、序列号 |
| 实时性 | 满足系统实时性要求 | 最小开销、优先级、超时设计 |
| 可扩展性 | 适应未来需求变化 | 版本字段、预留字段、变长数据 |

## 串口通信底层原理

### UART 硬件结构

```
┌─────────────────────────────────────────────────────────────┐
│                    UART 硬件结构                             │
│                                                             │
│  发送端:                                                    │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────┐      │
│  │ CPU 写入 │───►│ 发送保持 │───►│ 发送移位 │───►│ TX  │───►│
│  │ THR 寄存器│    │ 寄存器   │    │ 寄存器   │    │ 引脚 │      │
│  └─────────┘    └─────────┘    └─────────┘    └─────┘      │
│                      并转串                                  │
│                                                             │
│  接收端:                                                    │
│  ┌─────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐      │
│  │ RX  │───►│ 接收移位 │───►│ 接收缓冲 │───►│ CPU 读取 │◄───│
│  │ 引脚 │    │ 寄存器   │    │ 寄存器   │    │ RBR 寄存器│      │
│  └─────┘    └─────────┘    └─────────┘    └─────────┘      │
│                串转并                                        │
└─────────────────────────────────────────────────────────────┘
```

### 数据帧格式

```
┌─────────────────────────────────────────────────────────────┐
│                    UART 数据帧格式                           │
│                                                             │
│  空闲状态 (高电平):                                          │
│  ──────────────────────────────────────────────             │
│                                                             │
│  发送一个字节 0x55 (01010101):                               │
│                                                             │
│       ┌─┐─┐─┐─┐─┐─┐─┐─┐─┐─┐                               │
│  ────┘ │ │ │ │ │ │ │ │ │ │ └─────                          │
│        S 0 1 0 1 0 1 0 1 0 S                                │
│        t D D D D D D D D t                                  │
│        a a a a a a a a o                                    │
│        r t t t t t t t p                                    │
│        t                    │                               │
│        ▲                     ▲                              │
│        │                     │                              │
│     起始位(0)              停止位(1)                         │
│                                                             │
│  时序 (9600 bps, 每位 104μs):                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ 起始位: 104μs                                        │  │
│  │ 数据位: 8 × 104μs = 832μs                           │  │
│  │ 停止位: 104μs                                        │  │
│  │ 总时间: 10 × 104μs = 1.04ms                         │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 寄存器级操作

```c
#define USART1_BASE      0x40011000
#define USART1_SR        (*(volatile uint32_t *)(USART1_BASE + 0x00))
#define USART1_DR        (*(volatile uint32_t *)(USART1_BASE + 0x04))
#define USART1_BRR       (*(volatile uint32_t *)(USART1_BASE + 0x08))
#define USART1_CR1       (*(volatile uint32_t *)(USART1_BASE + 0x0C))

#define USART_SR_TXE     (1 << 7)   
#define USART_SR_RXNE    (1 << 5)   

void uart_send_byte(uint8_t data)
{
    while (!(USART1_SR & USART_SR_TXE)) {
        
    }
    USART1_DR = data;
}

uint8_t uart_recv_byte(void)
{
    while (!(USART1_SR & USART_SR_RXNE)) {
        
    }
    return (uint8_t)USART1_DR;
}
```

上述代码展示了串口收发的寄存器级操作：

**寄存器说明：**

| 寄存器 | 偏移 | 作用 |
|--------|------|------|
| SR | 0x00 | 状态寄存器，包含 TXE、RXNE 等标志 |
| DR | 0x04 | 数据寄存器，写入发送、读取接收 |
| BRR | 0x08 | 波特率寄存器 |
| CR1 | 0x0C | 控制寄存器 1 |

**状态标志说明：**

| 标志 | 位 | 说明 |
|------|-----|------|
| TXE | 7 | 发送数据寄存器空，可以写入新数据 |
| RXNE | 5 | 接收数据寄存器非空，可以读取数据 |
| TC | 6 | 发送完成，移位寄存器也空了 |
| FE | 1 | 帧错误，停止位检测错误 |
| PE | 0 | 奇偶校验错误 |

## 协议帧结构设计

### 帧结构总览

帧是协议的基本单位，就像文章的"段落"。一帧数据包含完整的语义，接收端收到完整的一帧才能正确解析。

```
┌─────────────────────────────────────────────────────────────┐
│                    协议帧结构                                │
│                                                             │
│  ┌────────┬────────┬─────┬─────┬──────────┬───────┬──────┐ │
│  │ Header │ Length │ Seq │ Cmd │   Data   │  CRC  │ Tail │ │
│  │  2B    │   1B   │ 1B  │ 1B  │   0~NB   │  2B   │  1B  │ │
│  └────────┴────────┴─────┴─────┴──────────┴───────┴──────┘ │
│                                                             │
│  字段说明:                                                  │
│  ┌─────────┬──────────────────────────────────────────────┐│
│  │ Header  │ 帧头 0xAA 0x55，用于帧同步                   ││
│  ├─────────┼──────────────────────────────────────────────┤│
│  │ Length  │ 数据区长度，用于确定帧边界                    ││
│  ├─────────┼──────────────────────────────────────────────┤│
│  │ Seq     │ 序列号，用于应答匹配和重复检测                ││
│  ├─────────┼──────────────────────────────────────────────┤│
│  │ Cmd     │ 命令码，标识帧类型和操作                      ││
│  ├─────────┼──────────────────────────────────────────────┤│
│  │ Data    │ 实际数据内容，变长                            ││
│  ├─────────┼──────────────────────────────────────────────┤│
│  │ CRC     │ CRC-16 校验码，检测传输错误                   ││
│  ├─────────┼──────────────────────────────────────────────┤│
│  │ Tail    │ 帧尾 0x0D，可选，便于调试                     ││
│  └─────────┴──────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

### 帧头帧尾的选择

```c
#define FRAME_HEADER_H  0xAA
#define FRAME_HEADER_L  0x55
#define FRAME_TAIL      0x0D
```

上述代码定义了帧头和帧尾：

**为什么选择 0xAA 0x55？**

```
0xAA = 10101010 (二进制)
0x55 = 01010101 (二进制)

特点:
1. 交替的比特模式，在串口线上产生明显跳变
2. 有利于接收端时钟同步
3. 在 ASCII 码中是可打印字符，方便调试
4. 不容易与常见数据值冲突
```

### 命令码设计

```c
typedef enum {
    CMD_READ_VERSION = 0x01,
    CMD_READ_STATUS  = 0x02,
    CMD_SET_CONFIG   = 0x03,
    CMD_WRITE_DATA   = 0x04,
    CMD_HEARTBEAT    = 0x05,
    
    CMD_ACK          = 0x80,
    CMD_NACK         = 0x81
} CommandType;

typedef enum {
    ERR_NONE         = 0x00,
    ERR_CRC          = 0x01,
    ERR_CMD_UNKNOWN  = 0x02,
    ERR_PARAM        = 0x03,
    ERR_BUSY         = 0x04,
    ERR_TIMEOUT      = 0x05
} ErrorCode;
```

上述代码定义了命令码和错误码：

**命令码分配策略：**

| 范围 | 用途 | 最高位 |
|------|------|--------|
| 0x01 ~ 0x3F | 读命令（查询类） | 0 |
| 0x40 ~ 0x7F | 写命令（控制类） | 0 |
| 0x80 ~ 0xBF | 应答命令 | 1 |
| 0xC0 ~ 0xFF | 错误命令 | 1 |

**设计优势：** 最高位为 1 表示应答/错误，可以快速判断帧类型。

## CRC 校验原理

### CRC 基本概念

CRC（循环冗余校验）是一种基于 **多项式除法** 的校验算法。它将数据看作一个大的二进制数，用一个固定的多项式去除，得到的余数就是 CRC 值。

```
┌─────────────────────────────────────────────────────────────┐
│                    CRC 计算原理                              │
│                                                             │
│  CRC-16 多项式: x^16 + x^15 + x^2 + 1 = 0x18005            │
│                                                             │
│  计算过程 (简化):                                           │
│                                                             │
│  数据: 0x31 0x32 (ASCII "12")                               │
│                                                             │
│  步骤:                                                      │
│  1. 数据左移 16 位，后面补 0                                │
│     0011 0001 0011 0010 0000 0000 0000 0000                │
│                                                             │
│  2. 用多项式 (去掉最高位) 进行异或除法                       │
│     多项式: 1 1000 0000 0000 0101                          │
│                                                             │
│  3. 得到的余数就是 CRC                                      │
│     CRC = 0x4B37                                            │
│                                                             │
│  发送: [数据] [CRC_L] [CRC_H]                               │
│        0x31 0x32 0x37 0x4B                                  │
│                                                             │
│  接收端重新计算 CRC，如果结果为 0，说明数据正确              │
└─────────────────────────────────────────────────────────────┘
```

### CRC-16 查表法实现

```c
static const uint16_t crc16_table[256] = {
    0x0000, 0x1021, 0x2042, 0x3063, 0x4084, 0x50A5, 0x60C6, 0x70E7,
    0x8108, 0x9129, 0xA14A, 0xB16B, 0xC18C, 0xD1AD, 0xE1CE, 0xF1EF,
    
};

uint16_t calc_crc16(const uint8_t *data, uint16_t len)
{
    uint16_t crc = 0;
    
    while (len--) {
        uint8_t index = (crc >> 8) ^ *data++;
        crc = (crc << 8) ^ crc16_table[index];
    }
    
    return crc;
}
```

上述代码实现了 CRC-16 查表法：

**参数说明：**
- `data`：要计算 CRC 的数据指针
- `len`：数据长度

**返回值：**
- 返回 16 位 CRC 校验值

**查表法原理：**

```
传统方法: 每个字节需要 8 次移位和条件异或
查表法:   每个字节只需要 1 次查表和 2 次异或

性能提升: 约 8 倍

查表法原理:
1. CRC 寄存器高 8 位与当前字节异或，得到表索引
2. CRC 寄存器左移 8 位
3. 与表中对应值异或
4. 重复处理所有字节
```

### CRC 校验范围

```c
uint16_t pack_frame(uint8_t cmd, uint8_t *data, uint8_t len,
                    uint8_t *out, uint8_t seq)
{
    uint16_t i = 0;
    
    out[i++] = FRAME_HEADER_H;
    out[i++] = FRAME_HEADER_L;
    out[i++] = len + 2;  
    out[i++] = seq;
    out[i++] = cmd;
    
    if (len > 0 && data != NULL) {
        memcpy(&out[i], data, len);
        i += len;
    }
    
    uint16_t crc = calc_crc16(&out[4], len + 2);
    out[i++] = crc & 0xFF;
    out[i++] = (crc >> 8) & 0xFF;
    out[i++] = FRAME_TAIL;
    
    return i;
}
```

上述代码实现了帧打包函数：

**CRC 校验范围：** 从 Seq 字段开始到 Data 结束，不包含帧头和帧尾。

**为什么不校验帧头帧尾？**
- 帧头帧尾用于帧同步，由状态机保证正确
- 校验数据内容更有意义
- 减少计算量

## 状态机解析实现

### 为什么用状态机？

串口是 **字节流**，数据一个一个到来。你不能假设"一次 read 就收到完整的一帧"。状态机可以逐字节处理，非常健壮——即使中间出错，也能恢复。

```
┌─────────────────────────────────────────────────────────────┐
│                    字节流接收示意                            │
│                                                             │
│  发送端发送: [AA][55][03][01][02][XX][XX][0D]               │
│                                                             │
│  接收端可能收到:                                            │
│  情况1: 一次收到全部 8 字节                                  │
│  情况2: 分两次 [AA 55 03] [01 02 XX XX 0D]                  │
│  情况3: 分多次 [AA] [55] [03] [01] ...                      │
│  情况4: 中间有噪声 [AA] [00] [AA] [55] ...                  │
│                                                             │
│  状态机可以正确处理所有情况！                                │
└─────────────────────────────────────────────────────────────┘
```

### 解析状态定义

```c
typedef enum {
    STATE_IDLE,      
    STATE_HEADER_H,  
    STATE_HEADER_L,  
    STATE_LENGTH,    
    STATE_SEQ,       
    STATE_CMD,       
    STATE_DATA,      
    STATE_CRC_L,     
    STATE_CRC_H,     
    STATE_TAIL       
} ParseState;
```

上述代码定义了解析状态机的所有状态：

**状态说明：**

| 状态 | 说明 | 触发条件 |
|------|------|----------|
| STATE_IDLE | 空闲状态，等待帧头 | 收到 0xAA |
| STATE_HEADER_H | 收到帧头高字节 | 收到 0x55 |
| STATE_HEADER_L | 收到帧头低字节 | 收到长度字节 |
| STATE_LENGTH | 解析长度 | 收到序列号 |
| STATE_SEQ | 解析序列号 | 收到命令码 |
| STATE_CMD | 解析命令码 | 有数据则进入 DATA |
| STATE_DATA | 接收数据 | 数据收完进入 CRC |
| STATE_CRC_L | 接收 CRC 低字节 | 收到进入 CRC_H |
| STATE_CRC_H | 接收 CRC 高字节 | 收到进入 TAIL |
| STATE_TAIL | 等待帧尾 | 收到 0x0D，帧完成 |

### 解析上下文结构

```c
typedef struct {
    ParseState state;           
    uint8_t buffer[256];        
    uint8_t length;             
    uint8_t seq;                
    uint8_t cmd;                
    uint8_t data_len;           
    uint8_t data_idx;           
    uint16_t crc_recv;          
    uint16_t crc_calc;          
} ParseContext;
```

上述代码定义了解析上下文结构：

**成员说明：**

| 成员 | 类型 | 说明 |
|------|------|------|
| `state` | `ParseState` | 当前状态机状态 |
| `buffer` | `uint8_t[256]` | 数据区缓冲区 |
| `length` | `uint8_t` | 帧长度字段值 |
| `seq` | `uint8_t` | 序列号 |
| `cmd` | `uint8_t` | 命令码 |
| `data_len` | `uint8_t` | 数据区长度 |
| `data_idx` | `uint8_t` | 当前数据接收索引 |
| `crc_recv` | `uint16_t` | 接收到的 CRC 值 |
| `crc_calc` | `uint16_t` | 计算得到的 CRC 值 |

### 状态机核心实现

```c
typedef struct {
    uint8_t cmd;
    uint8_t seq;
    uint8_t *data;
    uint8_t len;
} ParsedFrame;

bool parse_byte(ParseContext *ctx, uint8_t byte, ParsedFrame *frame)
{
    switch (ctx->state) {
        case STATE_IDLE:
            if (byte == FRAME_HEADER_H) {
                ctx->state = STATE_HEADER_H;
            }
            break;
            
        case STATE_HEADER_H:
            if (byte == FRAME_HEADER_L) {
                ctx->state = STATE_LENGTH;
                ctx->data_idx = 0;
            } else if (byte == FRAME_HEADER_H) {
                
            } else {
                ctx->state = STATE_IDLE;
            }
            break;
            
        case STATE_LENGTH:
            if (byte == 0 || byte > 250) {
                ctx->state = STATE_IDLE;
            } else {
                ctx->data_len = byte - 2;  
                ctx->state = STATE_SEQ;
            }
            break;
            
        case STATE_SEQ:
            ctx->seq = byte;
            ctx->state = STATE_CMD;
            break;
            
        case STATE_CMD:
            ctx->cmd = byte;
            if (ctx->data_len > 0) {
                ctx->state = STATE_DATA;
            } else {
                ctx->state = STATE_CRC_L;
            }
            break;
            
        case STATE_DATA:
            ctx->buffer[ctx->data_idx++] = byte;
            if (ctx->data_idx >= ctx->data_len) {
                ctx->state = STATE_CRC_L;
            }
            break;
            
        case STATE_CRC_L:
            ctx->crc_recv = byte;
            ctx->state = STATE_CRC_H;
            break;
            
        case STATE_CRC_H:
            ctx->crc_recv |= (byte << 8);
            ctx->crc_calc = calc_crc16(ctx->buffer, ctx->data_len + 2);
            ctx->state = STATE_TAIL;
            break;
            
        case STATE_TAIL:
            ctx->state = STATE_IDLE;
            if (byte == FRAME_TAIL && ctx->crc_recv == ctx->crc_calc) {
                frame->cmd = ctx->cmd;
                frame->seq = ctx->seq;
                frame->data = ctx->buffer;
                frame->len = ctx->data_len;
                return true;
            }
            break;
    }
    
    return false;
}
```

上述代码实现了状态机解析的核心逻辑：

**返回值说明：**
- `true`：收到完整有效的一帧，`frame` 中包含解析结果
- `false`：帧未完成或解析出错

**状态机健壮性：**

```
┌─────────────────────────────────────────────────────────────┐
│                    状态机错误恢复                            │
│                                                             │
│  正常流程:                                                  │
│  IDLE → HEADER_H → HEADER_L → LENGTH → ... → TAIL → IDLE   │
│                                                             │
│  错误情况1: 帧头后跟非 0x55                                  │
│  IDLE → HEADER_H → (收到非 0x55) → IDLE                     │
│  自动恢复，继续等待有效帧头                                  │
│                                                             │
│  错误情况2: 长度字段异常                                     │
│  IDLE → ... → LENGTH → (长度为 0 或过大) → IDLE             │
│  拒绝异常帧，回到空闲状态                                    │
│                                                             │
│  错误情况3: CRC 校验失败                                     │
│  IDLE → ... → TAIL → (CRC 不匹配) → IDLE                    │
│  丢弃错误帧，不返回成功                                      │
└─────────────────────────────────────────────────────────────┘
```

### 与环形缓冲区配合

```c
void protocol_process(ParseContext *ctx)
{
    uint8_t byte;
    ParsedFrame frame;
    
    while (ring_buf_read(&uart_rx_buf, &byte, 1) > 0) {
        if (parse_byte(ctx, byte, &frame)) {
            handle_frame(&frame);
        }
    }
}
```

上述代码展示了协议处理与环形缓冲区的配合：

**处理流程：**
1. 从环形缓冲区读取一个字节
2. 将字节送入状态机解析
3. 如果收到完整帧，调用处理函数
4. 循环处理直到缓冲区为空

## 应答与重传机制

### 应答机制

```c
void send_ack(uint8_t seq, uint8_t cmd)
{
    uint8_t data[2] = {seq, cmd};
    uint8_t frame[16];
    uint16_t len = pack_frame(CMD_ACK, data, 2, frame, 0);
    uart_send(frame, len);
}

void send_nack(uint8_t seq, uint8_t err)
{
    uint8_t data[2] = {seq, err};
    uint8_t frame[16];
    uint16_t len = pack_frame(CMD_NACK, data, 2, frame, 0);
    uart_send(frame, len);
}
```

上述代码实现了 ACK/NACK 应答函数：

**应答帧格式：**

```
ACK 帧:
┌────────┬────────┬─────┬────────┬──────────┬───────┬──────┐
│ AA 55  │   02   │ 00  │  0x80  │ seq cmd  │ CRC   │ 0D   │
└────────┴────────┴─────┴────────┴──────────┴───────┴──────┘

NACK 帧:
┌────────┬────────┬─────┬────────┬──────────┬───────┬──────┐
│ AA 55  │   02   │ 00  │  0x81  │ seq err  │ CRC   │ 0D   │
└────────┴────────┴─────┴────────┴──────────┴───────┴──────┘
```

### 应答时序

```
┌─────────────────────────────────────────────────────────────┐
│                    应答时序图                                │
│                                                             │
│  发送方                        接收方                        │
│    │                             │                          │
│    │──── Frame(seq=1, cmd=01) ──►│                          │
│    │                             │ 解析成功                  │
│    │◄────── ACK(seq=1) ─────────│                          │
│    │                             │                          │
│    │──── Frame(seq=2, cmd=02) ──►│                          │
│    │                             │ CRC 错误                  │
│    │◄────── NACK(seq=2, err=01)─│                          │
│    │                             │                          │
│    │──── Frame(seq=2, cmd=02) ──►│  (重发)                  │
│    │                             │ 解析成功                  │
│    │◄────── ACK(seq=2) ─────────│                          │
│    │                             │                          │
└─────────────────────────────────────────────────────────────┘
```

### 重传机制实现

```c
#define MAX_RETRY    3
#define TIMEOUT_MS   100

typedef struct {
    uint8_t buffer[256];        
    uint16_t length;            
    uint8_t seq;                
    uint8_t retry;              
    uint32_t send_time;         
    bool waiting;               
} RetransmitContext;

static RetransmitContext retransmit;
static uint8_t current_seq = 0;

bool send_with_retry(uint8_t cmd, uint8_t *data, uint8_t len)
{
    if (retransmit.waiting) {
        return false;  
    }
    
    retransmit.seq = current_seq++;
    retransmit.length = pack_frame(cmd, data, len, 
                                    retransmit.buffer, retransmit.seq);
    retransmit.retry = 0;
    retransmit.waiting = true;
    retransmit.send_time = get_tick();
    
    uart_send(retransmit.buffer, retransmit.length);
    return true;
}

void check_timeout(void)
{
    if (!retransmit.waiting) {
        return;
    }
    
    if (get_tick() - retransmit.send_time > TIMEOUT_MS) {
        if (retransmit.retry < MAX_RETRY) {
            uart_send(retransmit.buffer, retransmit.length);
            retransmit.retry++;
            retransmit.send_time = get_tick();
        } else {
            retransmit.waiting = false;
            on_transmit_failed();
        }
    }
}

void on_ack_received(uint8_t seq)
{
    if (retransmit.waiting && retransmit.seq == seq) {
        retransmit.waiting = false;
    }
}
```

上述代码实现了完整的重传机制：

**重传流程：**

```
┌─────────────────────────────────────────────────────────────┐
│                    重传流程                                  │
│                                                             │
│  1. 发送帧，记录序列号和发送时间                             │
│     ┌─────────────────────────────────────────────────────┐│
│     │ waiting = true                                      ││
│     │ retry = 0                                           ││
│     │ send_time = current_tick                            ││
│     │ uart_send(frame)                                    ││
│     └─────────────────────────────────────────────────────┘│
│                                                             │
│  2. 定时检查超时                                            │
│     ┌─────────────────────────────────────────────────────┐│
│     │ if (current_tick - send_time > TIMEOUT) {           ││
│     │     if (retry < MAX_RETRY) {                        ││
│     │         重发帧                                      ││
│     │         retry++                                     ││
│     │     } else {                                        ││
│     │         上报失败                                    ││
│     │     }                                               ││
│     │ }                                                   ││
│     └─────────────────────────────────────────────────────┘│
│                                                             │
│  3. 收到 ACK，清除等待状态                                   │
│     ┌─────────────────────────────────────────────────────┐│
│     │ if (ACK.seq == waiting_seq) {                       ││
│     │     waiting = false                                 ││
│     │ }                                                   ││
│     └─────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

## 心跳机制

### 心跳的作用

心跳用于 **检测连接状态**。如果对方"失联"了，应该及时发现问题。

```c
typedef struct {
    uint32_t last_rx_time;      
    uint32_t timeout_ms;        
    bool connected;             
} HeartbeatContext;

static HeartbeatContext heartbeat = {
    .timeout_ms = 5000,  
    .connected = false
};

void heartbeat_feed(void)
{
    heartbeat.last_rx_time = get_tick();
    heartbeat.connected = true;
}

bool heartbeat_check(void)
{
    if (heartbeat.connected && 
        get_tick() - heartbeat.last_rx_time > heartbeat.timeout_ms) {
        heartbeat.connected = false;
        on_connection_lost();
        return false;
    }
    return true;
}

void send_heartbeat(void)
{
    uint8_t frame[8];
    uint16_t len = pack_frame(CMD_HEARTBEAT, NULL, 0, frame, 0);
    uart_send(frame, len);
}
```

上述代码实现了心跳机制：

**心跳时序：**

```
┌─────────────────────────────────────────────────────────────┐
│                    心跳时序                                  │
│                                                             │
│  设备A                        设备B                          │
│    │                             │                          │
│    │──── Heartbeat ─────────────►│                          │
│    │                             │ 收到，喂狗                │
│    │◄──── Heartbeat ────────────│                          │
│    │ 收到，喂狗                  │                          │
│    │                             │                          │
│    │  (5 秒内无通信)             │                          │
│    │                             │                          │
│    │──── Heartbeat ─────────────►│                          │
│    │                             │                          │
│    │  (无响应)                   │                          │
│    │                             │                          │
│    │  超时，连接断开             │                          │
│    │  on_connection_lost()       │                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 数据区转义处理

### 转义的必要性

如果数据区恰好出现 `0xAA 0x55`，会被误认为是帧头。需要进行转义处理。

```c
#define ESCAPE_CHAR   0x7D
#define ESCAPE_XOR    0x20

uint16_t pack_frame_escape(uint8_t cmd, uint8_t *data, uint8_t len,
                           uint8_t *out, uint8_t seq)
{
    uint16_t i = 0;
    
    out[i++] = FRAME_HEADER_H;
    out[i++] = FRAME_HEADER_L;
    out[i++] = len + 2;
    out[i++] = seq;
    out[i++] = cmd;
    
    for (uint8_t j = 0; j < len; j++) {
        uint8_t byte = data[j];
        if (byte == FRAME_HEADER_H || byte == FRAME_HEADER_L || 
            byte == ESCAPE_CHAR || byte == FRAME_TAIL) {
            out[i++] = ESCAPE_CHAR;
            out[i++] = byte ^ ESCAPE_XOR;
        } else {
            out[i++] = byte;
        }
    }
    
    uint16_t crc = calc_crc16(&out[4], i - 4);
    out[i++] = crc & 0xFF;
    out[i++] = (crc >> 8) & 0xFF;
    out[i++] = FRAME_TAIL;
    
    return i;
}
```

上述代码实现了带转义的帧打包：

**转义规则：**

| 原始字节 | 转义后 | 说明 |
|----------|--------|------|
| 0xAA (帧头) | 0x7D 0x8A | 0xAA ^ 0x20 = 0x8A |
| 0x55 (帧头) | 0x7D 0x75 | 0x55 ^ 0x20 = 0x75 |
| 0x7D (转义符) | 0x7D 0x5D | 0x7D ^ 0x20 = 0x5D |
| 0x0D (帧尾) | 0x7D 0x2D | 0x0D ^ 0x20 = 0x2D |

## 总结

| 概念 | 要点 |
|------|------|
| 帧结构 | 帧头 + 长度 + 序列号 + 命令 + 数据 + CRC + 帧尾 |
| CRC 校验 | 检测传输错误，查表法高效实现 |
| 状态机解析 | 逐字节处理，健壮可靠，自动恢复 |
| 应答机制 | ACK 确认成功，NACK 报告错误 |
| 重传机制 | 超时重发，限制重传次数 |
| 心跳机制 | 检测连接状态，及时发现失联 |
| 数据转义 | 避免数据区与帧头帧尾冲突 |

## 参考资料

[1] Serial Programming Guide for POSIX Operating Systems

[2] Modbus Protocol Specification

[3] HDLC Protocol Specification

## 相关主题

- [数据封装](/notes/embedded/data-encapsulation) - 数据帧设计与 CRC
- [状态机](/notes/embedded/state-machine) - 协议解析状态机
- [串口数据](/notes/embedded/uart-data) - 串口通信基础
- [环形缓冲区](/notes/embedded/ring-buffer) - 数据缓冲
- [寄存器详解](/notes/embedded/register) - UART 寄存器操作
