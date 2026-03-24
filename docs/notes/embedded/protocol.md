---
title: 通信协议 - 嵌入式设备间的对话规则
date: 2026-03-24
tags: [嵌入式, 通信协议, C语言, 状态机]
description: 设计可靠的嵌入式通信协议，包含帧结构、命令处理和错误恢复
---

# 通信协议

如果把串口比作"电话线"，那通信协议就是"对话规则"。两个人打电话，需要约定谁先说话、怎么确认对方听懂了、没听清怎么办。设备之间也一样——通信协议定义了数据怎么打包、怎么确认、出错怎么处理。

好的协议设计能让通信**可靠、高效、易扩展**。差的协议则会让你在调试时抓狂：数据丢三落四，设备状态混乱，加个功能要改一堆代码。

## 协议设计三原则

设计协议时，需要平衡三个目标：

### 可靠性

数据必须准确送达，不能丢、不能错、不能乱序。

- **数据校验**：CRC、校验和，检测传输错误
- **应答机制**：ACK/NACK，确认收到
- **重传机制**：超时重发，处理丢包
- **序列号**：检测重复、乱序

### 实时性

嵌入式系统往往有实时性要求，协议不能太"啰嗦"。

- **最小开销**：帧头帧尾尽量短
- **优先级**：紧急命令优先处理
- **超时设计**：不能无限等待

### 可扩展性

协议要能适应未来的需求变化。

- **版本字段**：区分不同版本
- **预留字段**：为未来功能留空间
- **灵活数据区**：变长数据支持

<iframe src="/learning-notes/demos/protocol.html" width="100%" height="600" frameborder="0" style="border-radius: 8px; margin: 16px 0;"></iframe>

## 协议帧结构设计

帧是协议的基本单位，就像文章的"段落"。一帧数据包含完整的语义，接收端收到完整的一帧才能正确解析。

### 帧结构总览

一个典型的协议帧结构：

```
┌────────┬────────┬─────┬─────┬──────────┬───────┬──────┐
│ Header │ Length │ Seq │ Cmd │   Data   │  CRC  │ Tail │
│  2B    │   1B   │ 1B  │ 1B  │   0~NB   │  2B   │  1B  │
└────────┴────────┴─────┴─────┴──────────┴───────┴──────┘
```

### 各字段详解

| 字段 | 大小 | 作用 |
|------|------|------|
| Header | 2 字节 | 帧头，用于帧同步 |
| Length | 1 字节 | 数据区长度 |
| Seq | 1 字节 | 序列号，用于应答匹配 |
| Cmd | 1 字节 | 命令码，标识帧类型 |
| Data | 变长 | 实际数据内容 |
| CRC | 2 字节 | 校验码，检测错误 |
| Tail | 1 字节 | 帧尾，可选 |

### 帧头帧尾的选择

帧头帧尾的作用是**帧同步**——让接收端知道一帧从哪里开始、到哪里结束。

#### 常见帧头选择

```c
#define FRAME_HEADER_H  0xAA
#define FRAME_HEADER_L  0x55
```

为什么选 `0xAA 0x55`？看看它们的二进制形式：

```
0xAA = 10101010
0x55 = 01010101
```

这是两个交替的比特模式，在串口线上会产生明显的跳变，有利于接收端同步。而且这两个值在 ASCII 码里是可打印字符，调试时方便观察。

#### 帧尾的必要性

帧尾是可选的。有些协议用帧尾，有些不用：

| 方案 | 优点 | 缺点 |
|------|------|------|
| 有帧尾 | 双重保险，易于调试 | 多一字节开销 |
| 无帧尾 | 更紧凑 | 完全依赖长度字段 |

::: tip 建议
调试阶段建议加帧尾，发布版本可以去掉。帧尾值通常选 `0x0D`（回车）或 `0x0A`（换行），方便串口调试工具显示。
:::

## 命令码设计

命令码（Cmd）是协议的"动词"，告诉对方这一帧数据要做什么。

### 命令码定义

```c
typedef enum {
    CMD_READ_VERSION = 0x01,
    CMD_READ_STATUS  = 0x02,
    CMD_SET_CONFIG   = 0x03,
    CMD_WRITE_DATA   = 0x04,
    CMD_ACK          = 0x80,
    CMD_NACK         = 0x81
} CommandType;
```

### 命令码分配建议

| 范围 | 用途 |
|------|------|
| 0x00 | 保留 |
| 0x01 ~ 0x3F | 读命令（查询类） |
| 0x40 ~ 0x7F | 写命令（控制类） |
| 0x80 ~ 0xBF | 应答命令 |
| 0xC0 ~ 0xFF | 错误命令 |

这样分配的好处是：最高位为 1 表示应答/错误，方便快速判断帧类型。

### 错误码定义

```c
typedef enum {
    ERR_NONE         = 0x00,
    ERR_CRC          = 0x01,
    ERR_CMD_UNKNOWN  = 0x02,
    ERR_PARAM        = 0x03,
    ERR_BUSY         = 0x04,
    ERR_TIMEOUT      = 0x05
} ErrorCode;
```

## 帧打包实现

打包就是把数据组装成协议帧格式。

### 打包函数原型

```c
uint16_t pack_frame(uint8_t cmd, uint8_t *data, uint8_t len, 
                    uint8_t *out, uint8_t seq);
```

参数说明：
- `cmd`：命令码
- `data`：数据区内容
- `len`：数据区长度
- `out`：输出缓冲区
- `seq`：序列号

### 帧头写入

```c
uint16_t i = 0;

out[i++] = FRAME_HEADER_H;
out[i++] = FRAME_HEADER_L;
```

帧头固定两字节，直接写入。

### 长度和序列号

```c
out[i++] = len + 2;
out[i++] = seq;
out[i++] = cmd;
```

长度字段填写的是"从序列号开始"的数据长度，即 `Seq + Cmd + Data` 的总长度。

### 数据区拷贝

```c
if (len > 0) {
    memcpy(&out[i], data, len);
    i += len;
}
```

数据区可以为空（比如查询命令），所以要先判断长度。

### CRC 校验码

```c
uint16_t crc = calc_crc16(&out[3], len + 2);
out[i++] = crc & 0xFF;
out[i++] = (crc >> 8) & 0xFF;
out[i++] = FRAME_TAIL;

return i;
```

CRC 校验的范围是"从长度字段到数据区结束"。关于 CRC 算法，详见 [数据封装](/notes/embedded/data-encapsulation)。

## 帧解析实现

解析是打包的逆过程：从字节流中识别出一帧帧数据。

### 为什么用状态机？

串口是字节流，数据一个一个到来。你不能假设"一次 read 就收到完整的一帧"。状态机可以逐字节处理，非常健壮——即使中间出错，也能恢复。

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

### 解析上下文

```c
typedef struct {
    ParseState state;
    uint8_t buffer[256];
    uint8_t length;
    uint8_t seq;
    uint8_t cmd;
    uint8_t data_len;
    uint8_t data_idx;
    uint16_t crc;
} ParseContext;
```

### 状态机核心逻辑

```c
bool parse_byte(ParseContext *ctx, uint8_t byte, ParsedFrame *frame) {
    switch (ctx->state) {
        case STATE_IDLE:
            if (byte == FRAME_HEADER_H) {
                ctx->state = STATE_HEADER_H;
            }
            break;
            
        case STATE_HEADER_H:
            if (byte == FRAME_HEADER_L) {
                ctx->state = STATE_LENGTH;
            } else {
                ctx->state = STATE_IDLE;
            }
            break;
            
        case STATE_LENGTH:
            ctx->data_len = byte - 2;
            ctx->data_idx = 0;
            ctx->state = STATE_SEQ;
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
            ctx->crc = byte;
            ctx->state = STATE_CRC_H;
            break;
            
        case STATE_CRC_H:
            ctx->crc |= (byte << 8);
            ctx->state = STATE_TAIL;
            break;
            
        case STATE_TAIL:
            ctx->state = STATE_IDLE;
            if (byte == FRAME_TAIL) {
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

状态机返回 `true` 表示收到完整的一帧，`frame` 结构体中包含解析结果。

::: tip 状态机的健壮性
即使数据流中混入垃圾数据，状态机也能自动恢复——它会一直等待有效的帧头，然后开始解析。
:::

## 应答机制

应答机制是可靠通信的核心。发送方发一帧，接收方回一帧应答，双方都知道数据送达了。

### ACK 应答

```c
void send_ack(uint8_t seq, uint8_t cmd) {
    uint8_t data[2] = {seq, cmd};
    uint8_t frame[16];
    uint16_t len = pack_frame(CMD_ACK, data, 2, frame, 0);
    uart_send(frame, len);
}
```

ACK 帧的数据区包含两个字段：确认的序列号和确认的命令码。

### NACK 应答

```c
void send_nack(uint8_t seq, uint8_t err) {
    uint8_t data[2] = {seq, err};
    uint8_t frame[16];
    uint16_t len = pack_frame(CMD_NACK, data, 2, frame, 0);
    uart_send(frame, len);
}
```

NACK 帧的数据区包含序列号和错误码，告诉发送方出了什么问题。

### 应答流程

```
发送方                        接收方
  |                             |
  |------- Frame(seq=1) ------>|
  |                             |
  |<------ ACK(seq=1) ---------|
  |                             |
  |------- Frame(seq=2) ------>|
  |                             |
  |<------ NACK(seq=2,err) ----|
  |                             |
  |------- Frame(seq=2) ------>|  (重发)
  |                             |
  |<------ ACK(seq=2) ---------|
```

## 重传机制

网络不可靠，数据可能丢失。重传机制确保数据最终送达。

### 重传上下文

```c
typedef struct {
    uint8_t buffer[256];
    uint16_t length;
    uint8_t retry;
    uint32_t time;
    bool waiting;
} RetransmitContext;
```

### 发送并等待应答

```c
bool send_with_retry(uint8_t cmd, uint8_t *data, uint8_t len) {
    if (retransmit.waiting) return false;
    
    retransmit.length = pack_frame(cmd, data, len, 
                                    retransmit.buffer, seq++);
    retransmit.retry = 0;
    retransmit.waiting = true;
    retransmit.time = get_tick();
    
    uart_send(retransmit.buffer, retransmit.length);
    return true;
}
```

### 超时检测与重传

```c
#define MAX_RETRY    3
#define TIMEOUT_MS   100

void check_timeout(void) {
    if (!retransmit.waiting) return;
    
    if (get_tick() - retransmit.time > TIMEOUT_MS) {
        if (retransmit.retry < MAX_RETRY) {
            uart_send(retransmit.buffer, retransmit.length);
            retransmit.retry++;
            retransmit.time = get_tick();
        } else {
            retransmit.waiting = false;
            on_transmit_failed();
        }
    }
}
```

### 收到应答后清除

```c
void on_ack_received(uint8_t seq) {
    if (retransmit.waiting) {
        retransmit.waiting = false;
    }
}
```

::: warning 重传次数限制
一定要限制重传次数，否则设备可能陷入无限重传的死循环。达到最大重传次数后，应该上报错误或进入安全模式。
:::

## 心跳机制

心跳用于检测连接状态。如果对方"失联"了，应该及时发现问题。

### 心跳上下文

```c
typedef struct {
    uint32_t last_rx;
    uint32_t timeout;
    bool connected;
} HeartbeatContext;
```

### 喂狗（收到数据时调用）

```c
void heartbeat_feed(void) {
    heartbeat.last_rx = get_tick();
    heartbeat.connected = true;
}
```

### 检查连接状态

```c
bool heartbeat_check(void) {
    if (heartbeat.connected && 
        get_tick() - heartbeat.last_rx > heartbeat.timeout) {
        heartbeat.connected = false;
        on_connection_lost();
        return false;
    }
    return true;
}
```

### 心跳帧发送

```c
void send_heartbeat(void) {
    uint8_t frame[8];
    uint16_t len = pack_frame(CMD_HEARTBEAT, NULL, 0, frame, 0);
    uart_send(frame, len);
}
```

心跳帧通常没有数据区，只是一个"我还活着"的信号。

## 常见问题

### Q: 数据区和帧头冲突怎么办？

如果数据区恰好出现 `0xAA 0x55`，会被误认为是帧头。解决方案：

1. **转义字符**：数据区出现特殊字符时，前面加转义符
2. **长度优先**：解析时严格按照长度字段，不依赖帧头匹配
3. **字节填充**：类似 HDLC 的 0x7E 填充方案

### Q: 序列号会溢出吗？

会。序列号通常是 8 位，范围 0~255。溢出后从 0 开始，这是正常的。只要应答匹配正确，序列号可以循环使用。

### Q: 如何处理多主机通信？

需要增加地址字段，并在协议层实现冲突检测和仲裁。CAN 总线在这方面有硬件支持。

## 总结

1. **协议帧**包含帧头、长度、序列号、命令、数据、CRC、帧尾
2. **状态机解析**逐字节处理，健壮可靠，能自动恢复
3. **应答机制**保证数据送达，ACK 确认成功，NACK 报告错误
4. **重传机制**处理丢包，但必须限制重传次数
5. **心跳机制**检测连接状态，及时发现设备失联

## 相关主题

- [数据封装](/notes/embedded/data-encapsulation) - 数据帧设计与 CRC
- [状态机](/notes/embedded/state-machine) - 协议解析状态机
- [串口数据](/notes/embedded/uart-data) - 串口通信基础
- [环形缓冲区](/notes/embedded/ring-buffer) - 数据缓冲
