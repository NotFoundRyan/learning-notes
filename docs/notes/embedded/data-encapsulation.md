---
title: 数据封装 - 嵌入式通信的数据打包艺术
date: 2026-03-24
tags: [嵌入式, 通信协议, C语言, 数据结构]
category: embedded/protocol
description: 掌握数据封装技术，设计可靠的数据帧结构和序列化方案
difficulty: beginner
---

# 数据封装

> ⏱️ 阅读时长：约 10 分钟
> 📊 难度等级：初级
> 🎯 读完你将学会：数据帧结构设计、CRC 校验原理、数据打包解包、序列化处理

## TL;DR

> - **数据封装**把原始数据打包成帧，解决边界、类型、完整性问题
> - **帧结构**包含帧头、长度、命令、数据、CRC、帧尾
> - **CRC 校验**保证数据完整性，比简单校验和更可靠
> - **序列化**处理多字节数据的字节序问题
>
> 如果你想快速了解实现方式，跳到[数据打包](#数据打包)。

## 什么是数据封装？

数据封装就是把原始数据按照特定格式"打包"的过程。就像寄快递，你不能把东西随便一扔，得先装进盒子里，贴上地址标签，写上收件人信息。

在嵌入式通信中，一个完整的数据帧通常包含：

| 字段 | 作用 | 示例 |
|------|------|------|
| **帧头** | 标识数据帧的开始 | 0xAA 0x55 |
| **长度** | 告诉接收方数据有多大 | 数据字节数 |
| **命令** | 区分不同类型的数据 | 0x01=读版本 |
| **数据** | 真正要传输的内容 | 温度值、配置参数 |
| **校验** | 验证数据是否完整 | CRC16 |
| **帧尾** | 标识数据帧的结束 | 0x0D |

<CollapsibleIframe src="/learning-notes/demos/data-frame.html" title="帧结构可视化" :height="500" />

<CollapsibleIframe src="/learning-notes/demos/data-crc.html" title="CRC 校验计算" :height="500" />

## 为什么需要数据封装？

### 问题：原始数据传输

假设你要传输一个温度值 `25.6°C`，直接发送：

```c
float temperature = 25.6;
uart_send(&temperature, sizeof(float));
```

这样做有几个问题：

1. **不知道数据边界**：接收方怎么知道这 4 个字节是一个 float？
2. **不知道数据类型**：这 4 个字节是温度还是湿度？
3. **不知道数据完整性**：传输过程中出错怎么办？
4. **不知道数据顺序**：大端还是小端？

### 解决：封装成帧

把数据封装成帧：

```
[AA 55][04][01][00 00 CC CD][XX XX][0D]
 帧头  长度 命令   温度数据   CRC   帧尾
```

接收方收到后，可以：

1. 通过帧头 `AA 55` 知道新帧开始
2. 通过长度 `04` 知道数据有 4 字节
3. 通过命令 `01` 知道这是温度数据
4. 通过 CRC 验证数据完整性
5. 通过帧尾 `0D` 确认帧结束

## 帧结构设计

### 基本帧格式

```
+--------+--------+--------+--------+--------+--------+--------+
| Header | Length | Cmd    | Data   | CRC    | Tail   |
| 2B     | 1B     | 1B     | NB     | 2B     | 1B     |
+--------+--------+--------+--------+--------+--------+--------+
```

### 定义常量

```c
#define FRAME_HEADER_H   0xAA
#define FRAME_HEADER_L   0x55
#define FRAME_TAIL       0x0D
#define MAX_DATA_LEN     128
```

### 定义命令类型

```c
typedef enum {
    CMD_READ_VERSION  = 0x01,  // 读版本
    CMD_READ_STATUS   = 0x02,  // 读状态
    CMD_SET_CONFIG    = 0x03,  // 设置配置
    CMD_READ_DATA     = 0x04,  // 读数据
    CMD_WRITE_DATA    = 0x05,  // 写数据
    CMD_ACK           = 0x80,  // 应答
    CMD_NACK          = 0x81   // 错误应答
} CommandType;
```

### 定义错误码

```c
typedef enum {
    ERR_NONE         = 0x00,  // 无错误
    ERR_CRC          = 0x01,  // CRC 错误
    ERR_LENGTH       = 0x02,  // 长度错误
    ERR_CMD_UNKNOWN  = 0x03,  // 未知命令
    ERR_PARAM        = 0x04   // 参数错误
} ErrorCode;
```

## CRC 校验

CRC（循环冗余校验）是最常用的校验算法。它通过多项式除法计算出一个校验值，能检测出大多数传输错误。

### CRC16 算法

```c
uint16_t calculate_crc16(uint8_t *data, uint16_t len) {
    uint16_t crc = 0xFFFF;

    for (uint16_t i = 0; i < len; i++) {
        crc ^= data[i];
        for (uint8_t j = 0; j < 8; j++) {
            if (crc & 0x0001) {
                crc = (crc >> 1) ^ 0xA001;
            } else {
                crc >>= 1;
            }
        }
    }

    return crc;
}
```

### CRC 校验的特点

| 特性 | 说明 |
|------|------|
| 检错能力 | 能检测所有奇数个错误、所有双比特错误 |
| 计算复杂度 | O(n)，适合嵌入式 |
| 常用多项式 | CRC-16/MODBUS: 0xA001 |

::: tip 为什么用 CRC 而不是简单校验和？
- 校验和：只能检测奇数个比特错误
- 异或校验：只能检测奇数个比特错误
- CRC：能检测更多类型的错误，包括突发错误
:::

## 数据打包

### 打包函数

```c
uint16_t pack_frame(uint8_t cmd, uint8_t *data, uint8_t dataLen,
                    uint8_t *buffer) {
    uint16_t index = 0;

    // 帧头
    buffer[index++] = FRAME_HEADER_H;
    buffer[index++] = FRAME_HEADER_L;

    // 长度（命令 + 数据）
    buffer[index++] = dataLen + 1;

    // 命令
    buffer[index++] = cmd;

    // 数据
    if (dataLen > 0 && data != NULL) {
        memcpy(&buffer[index], data, dataLen);
        index += dataLen;
    }

    // CRC（从长度字段开始计算）
    uint16_t crc = calculate_crc16(&buffer[3], dataLen + 1);
    buffer[index++] = crc & 0xFF;
    buffer[index++] = (crc >> 8) & 0xFF;

    // 帧尾
    buffer[index++] = FRAME_TAIL;

    return index;
}
```

### 使用示例

```c
uint8_t tempData[4];
serialize_float(25.6, tempData);  // 序列化浮点数

uint8_t txBuffer[64];
uint16_t frameLen = pack_frame(CMD_READ_DATA, tempData, 4, txBuffer);

uart_send(txBuffer, frameLen);
```

## 数据解包

### 解析状态

```c
typedef enum {
    PARSE_IDLE,
    PARSE_HEADER_H,
    PARSE_HEADER_L,
    PARSE_LENGTH,
    PARSE_COMMAND,
    PARSE_DATA,
    PARSE_CRC_L,
    PARSE_CRC_H,
    PARSE_TAIL
} ParseState;
```

### 解析器结构

```c
typedef struct {
    ParseState state;
    uint8_t buffer[MAX_DATA_LEN];
    uint8_t dataLen;
    uint8_t command;
    uint16_t crcReceived;
    uint8_t dataIndex;
    bool frameReady;
} FrameParser;
```

### 解析函数

```c
bool parse_byte(FrameParser *parser, uint8_t byte) {
    switch (parser->state) {
        case PARSE_IDLE:
            if (byte == FRAME_HEADER_H) {
                parser->state = PARSE_HEADER_H;
            }
            break;

        case PARSE_HEADER_H:
            if (byte == FRAME_HEADER_L) {
                parser->state = PARSE_HEADER_L;
            } else {
                parser->state = PARSE_IDLE;
            }
            break;

        case PARSE_HEADER_L:
            parser->dataLen = byte - 1;  // 减去命令字节
            parser->dataIndex = 0;
            parser->state = PARSE_LENGTH;
            break;

        case PARSE_LENGTH:
            parser->command = byte;
            if (parser->dataLen > 0) {
                parser->state = PARSE_DATA;
            } else {
                parser->state = PARSE_CRC_L;
            }
            break;

        case PARSE_DATA:
            parser->buffer[parser->dataIndex++] = byte;
            if (parser->dataIndex >= parser->dataLen) {
                parser->state = PARSE_CRC_L;
            }
            break;

        case PARSE_CRC_L:
            parser->crcReceived = byte;
            parser->state = PARSE_CRC_H;
            break;

        case PARSE_CRC_H:
            parser->crcReceived |= (byte << 8);
            parser->state = PARSE_TAIL;
            break;

        case PARSE_TAIL:
            parser->state = PARSE_IDLE;
            if (byte == FRAME_TAIL) {
                // 验证 CRC
                uint8_t tempBuffer[MAX_DATA_LEN + 1];
                tempBuffer[0] = parser->dataLen + 1;
                tempBuffer[1] = parser->command;
                memcpy(&tempBuffer[2], parser->buffer, parser->dataLen);

                uint16_t crcCalc = calculate_crc16(tempBuffer, parser->dataLen + 2);
                if (crcCalc == parser->crcReceived) {
                    parser->frameReady = true;
                    return true;
                }
            }
            break;
    }

    return false;
}
```

## 数据序列化

### 字节序问题

多字节数据在传输时，字节序是个大问题：

| 字节序 | 说明 | 示例（0x12345678） |
|--------|------|-------------------|
| 大端序 | 高位在前 | 12 34 56 78 |
| 小端序 | 低位在前 | 78 56 34 12 |

网络通信通常使用**大端序**（网络字节序）。

### 浮点数序列化

```c
void serialize_float(float value, uint8_t *buffer) {
    uint32_t intValue;
    memcpy(&intValue, &value, 4);  // 避免直接指针转换

    // 大端序
    buffer[0] = (intValue >> 24) & 0xFF;
    buffer[1] = (intValue >> 16) & 0xFF;
    buffer[2] = (intValue >> 8) & 0xFF;
    buffer[3] = intValue & 0xFF;
}

float deserialize_float(uint8_t *buffer) {
    uint32_t intValue = (buffer[0] << 24) | (buffer[1] << 16) |
                        (buffer[2] << 8) | buffer[3];
    float value;
    memcpy(&value, &intValue, 4);
    return value;
}
```

### 结构体序列化

```c
#pragma pack(push, 1)  // 1字节对齐

typedef struct {
    uint32_t timestamp;
    float temperature;
    float humidity;
    uint16_t pressure;
    uint8_t status;
} SensorData;

#pragma pack(pop)

void serialize_sensor_data(SensorData *data, uint8_t *buffer) {
    uint16_t index = 0;

    // 时间戳（大端序）
    buffer[index++] = (data->timestamp >> 24) & 0xFF;
    buffer[index++] = (data->timestamp >> 16) & 0xFF;
    buffer[index++] = (data->timestamp >> 8) & 0xFF;
    buffer[index++] = data->timestamp & 0xFF;

    // 温度
    serialize_float(data->temperature, &buffer[index]);
    index += 4;

    // 湿度
    serialize_float(data->humidity, &buffer[index]);
    index += 4;

    // 气压
    buffer[index++] = (data->pressure >> 8) & 0xFF;
    buffer[index++] = data->pressure & 0xFF;

    // 状态
    buffer[index++] = data->status;
}
```

::: warning 关于 #pragma pack
使用 `#pragma pack(push, 1)` 可以取消结构体的字节对齐，确保结构体紧凑。但要注意：
- 可能影响 CPU 访问效率
- 某些平台不支持非对齐访问
:::

## 总结

1. **数据封装**把原始数据打包成帧，解决边界、类型、完整性问题
2. **帧结构**包含帧头、长度、命令、数据、CRC、帧尾
3. **CRC 校验**保证数据完整性，比简单校验和更可靠
4. **状态机解析**逐字节处理接收数据，健壮可靠
5. **序列化**处理多字节数据的字节序问题

## 相关主题

- [通信协议](/notes/embedded/protocol) - 完整的协议设计
- [串口数据](/notes/embedded/uart-data) - 串口数据传输
- [UDP/TCP](/notes/embedded/network) - 网络数据封装
