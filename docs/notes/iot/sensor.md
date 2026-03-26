---
title: 传感器接口 - 嵌入式外设通信
date: 2026-03-27
tags: [物联网, 传感器, I2C, SPI, ADC]
description: 深入理解传感器接口技术，掌握 I2C、SPI、ADC 等常用接口原理与编程
---

# 传感器接口

## 常见传感器接口

传感器是物联网系统的"感官"，负责采集环境数据。常见的传感器接口包括：

| 接口类型 | 特点 | 典型应用 |
|----------|------|----------|
| I2C | 两线制、多设备 | 温湿度传感器、EEPROM |
| SPI | 高速、全双工 | Flash、显示屏、ADC |
| UART | 简单、可靠 | GPS、蓝牙模块 |
| ADC | 模拟信号采集 | 光敏电阻、温度传感器 |
| GPIO | 数字信号 | 按键、LED、红外 |

## I2C 接口

### I2C 协议原理

```
I2C 总线时序：
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  SDA ──┐     ┌───┐     ┌───┐     ┌───┐     ┌───┐     ┌───┐ │
│        │     │   │     │   │     │   │     │   │     │   │ │
│        └─────┘   └─────┘   └─────┘   └─────┘   └─────┘   └─│
│                                                             │
│  SCL ────┐   ┌───┐   ┌───┐   ┌───┐   ┌───┐   ┌───┐   ┌────│
│          │   │   │   │   │   │   │   │   │   │   │   │    │
│          └───┘   └───┘   └───┘   └───┘   └───┘   └───┘    │
│                                                             │
│        START   8位数据    ACK    8位数据    ACK    STOP    │
└─────────────────────────────────────────────────────────────┘
```

I2C 总线特点：

- **两线制**：SDA（数据线）+ SCL（时钟线）
- **多主多从**：支持多个主设备和从设备
- **地址寻址**：7 位或 10 位地址
- **应答机制**：每字节传输后有 ACK/NACK

### I2C 编程示例

```c
#include <stdint.h>

#define I2C_READ    0x01
#define I2C_WRITE   0x00

typedef struct {
    void (*start)(void);
    void (*stop)(void);
    void (*send_byte)(uint8_t data);
    uint8_t (*recv_byte)(void);
    void (*send_ack)(uint8_t ack);
    uint8_t (*wait_ack)(void);
} i2c_ops_t;

static i2c_ops_t i2c;

int i2c_write(uint8_t dev_addr, uint8_t reg_addr, uint8_t *data, uint16_t len)
{
    uint16_t i;
    
    i2c.start();
    
    i2c.send_byte((dev_addr << 1) | I2C_WRITE);
    if (i2c.wait_ack() != 0) {
        i2c.stop();
        return -1;
    }
    
    i2c.send_byte(reg_addr);
    if (i2c.wait_ack() != 0) {
        i2c.stop();
        return -1;
    }
    
    for (i = 0; i < len; i++) {
        i2c.send_byte(data[i]);
        if (i2c.wait_ack() != 0) {
            i2c.stop();
            return -1;
        }
    }
    
    i2c.stop();
    return 0;
}

int i2c_read(uint8_t dev_addr, uint8_t reg_addr, uint8_t *data, uint16_t len)
{
    uint16_t i;
    
    i2c.start();
    
    i2c.send_byte((dev_addr << 1) | I2C_WRITE);
    if (i2c.wait_ack() != 0) {
        i2c.stop();
        return -1;
    }
    
    i2c.send_byte(reg_addr);
    if (i2c.wait_ack() != 0) {
        i2c.stop();
        return -1;
    }
    
    i2c.start();
    
    i2c.send_byte((dev_addr << 1) | I2C_READ);
    if (i2c.wait_ack() != 0) {
        i2c.stop();
        return -1;
    }
    
    for (i = 0; i < len; i++) {
        data[i] = i2c.recv_byte();
        i2c.send_ack((i == len - 1) ? 1 : 0);
    }
    
    i2c.stop();
    return 0;
}
```

## SPI 接口

### SPI 协议原理

```
SPI 总线连接：
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  ┌──────────┐                    ┌──────────┐              │
│  │          │───── MOSI ────────►│          │              │
│  │          │                    │          │              │
│  │  Master  │◄──── MISO ─────────│  Slave   │              │
│  │          │                    │          │              │
│  │          │───── SCLK ────────►│          │              │
│  │          │                    │          │              │
│  │          │───── CS ──────────►│          │              │
│  └──────────┘                    └──────────┘              │
│                                                             │
│  MOSI: Master Out Slave In   主机输出从机输入               │
│  MISO: Master In Slave Out   主机输入从机输出               │
│  SCLK: Serial Clock          串行时钟                       │
│  CS:   Chip Select           片选信号                       │
└─────────────────────────────────────────────────────────────┘
```

SPI 四种工作模式：

| 模式 | CPOL | CPHA | 空闲电平 | 采样边沿 |
|------|------|------|----------|----------|
| 0 | 0 | 0 | 低 | 上升沿 |
| 1 | 0 | 1 | 低 | 下降沿 |
| 2 | 1 | 0 | 高 | 下降沿 |
| 3 | 1 | 1 | 高 | 上升沿 |

### SPI 编程示例

```c
#include <stdint.h>

typedef struct {
    void (*init)(uint8_t mode, uint32_t speed);
    void (*cs_select)(void);
    void (*cs_deselect)(void);
    uint8_t (*transfer)(uint8_t data);
} spi_ops_t;

static spi_ops_t spi;

int spi_write_read(uint8_t *tx_buf, uint8_t *rx_buf, uint16_t len)
{
    uint16_t i;
    
    spi.cs_select();
    
    for (i = 0; i < len; i++) {
        rx_buf[i] = spi.transfer(tx_buf[i]);
    }
    
    spi.cs_deselect();
    
    return 0;
}

uint8_t spi_read_reg(uint8_t reg_addr)
{
    uint8_t tx_buf[2] = {reg_addr, 0xFF};
    uint8_t rx_buf[2];
    
    spi_write_read(tx_buf, rx_buf, 2);
    
    return rx_buf[1];
}

void spi_write_reg(uint8_t reg_addr, uint8_t data)
{
    uint8_t tx_buf[2] = {reg_addr, data};
    uint8_t rx_buf[2];
    
    spi_write_read(tx_buf, rx_buf, 2);
}
```

## ADC 接口

### ADC 基本原理

```
ADC 转换过程：
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  模拟信号          采样保持          量化编码          数字值│
│                                                             │
│  ────┐            ┌────┐            ┌────┐            ┌───┐│
│      │            │    │            │    │            │   ││
│      │     ────►  │ S/H│    ────►   │ ADC│    ────►   │n位││
│      │            │    │            │    │            │   ││
│  ────┘            └────┘            └────┘            └───┘│
│                                                             │
│  连续电压         离散采样         数字转换        二进制数  │
└─────────────────────────────────────────────────────────────┘
```

ADC 关键参数：

| 参数 | 说明 |
|------|------|
| 分辨率 | 位数，如 12 位 ADC 可分辨 4096 个等级 |
| 采样率 | 每秒采样次数，单位 SPS |
| 精度 | 实际值与测量值的偏差 |
| 参考电压 | ADC 转换的基准电压 |

### ADC 编程示例

```c
#include <stdint.h>

typedef struct {
    void (*init)(uint8_t channel, uint8_t resolution);
    void (*start)(void);
    uint8_t (*is_busy)(void);
    uint16_t (*read)(void);
} adc_ops_t;

static adc_ops_t adc;

uint16_t adc_read_channel(uint8_t channel)
{
    adc.init(channel, 12);
    adc.start();
    
    while (adc.is_busy()) {
        ;
    }
    
    return adc.read();
}

float adc_to_voltage(uint16_t adc_value, float vref)
{
    return (float)adc_value * vref / 4095.0f;
}

float read_temperature(void)
{
    uint16_t adc_val;
    float voltage;
    float temperature;
    
    adc_val = adc_read_channel(0);
    voltage = adc_to_voltage(adc_val, 3.3f);
    
    temperature = (voltage - 0.5f) / 0.01f;
    
    return temperature;
}
```

## 传感器驱动示例

### DHT11 温湿度传感器

```c
#include <stdint.h>
#include <delay.h>

#define DHT11_PIN   5

typedef struct {
    uint8_t humidity_int;
    uint8_t humidity_dec;
    uint8_t temp_int;
    uint8_t temp_dec;
    uint8_t checksum;
} dht11_data_t;

static void dht11_start(void)
{
    gpio_set_mode(DHT11_PIN, GPIO_OUTPUT);
    gpio_write(DHT11_PIN, 0);
    delay_ms(18);
    gpio_write(DHT11_PIN, 1);
    delay_us(30);
    gpio_set_mode(DHT11_PIN, GPIO_INPUT);
}

static uint8_t dht11_check_response(void)
{
    uint8_t timeout = 100;
    
    while (gpio_read(DHT11_PIN) && timeout--);
    if (timeout == 0) return 0;
    
    timeout = 100;
    while (!gpio_read(DHT11_PIN) && timeout--);
    if (timeout == 0) return 0;
    
    timeout = 100;
    while (gpio_read(DHT11_PIN) && timeout--);
    if (timeout == 0) return 0;
    
    return 1;
}

static uint8_t dht11_read_byte(void)
{
    uint8_t i, data = 0;
    
    for (i = 0; i < 8; i++) {
        while (!gpio_read(DHT11_PIN));
        delay_us(40);
        
        data <<= 1;
        if (gpio_read(DHT11_PIN)) {
            data |= 1;
            while (gpio_read(DHT11_PIN));
        }
    }
    
    return data;
}

int dht11_read(dht11_data_t *data)
{
    uint8_t i;
    uint8_t buf[5];
    
    dht11_start();
    
    if (!dht11_check_response()) {
        return -1;
    }
    
    for (i = 0; i < 5; i++) {
        buf[i] = dht11_read_byte();
    }
    
    if (buf[4] != ((buf[0] + buf[1] + buf[2] + buf[3]) & 0xFF)) {
        return -2;
    }
    
    data->humidity_int = buf[0];
    data->humidity_dec = buf[1];
    data->temp_int = buf[2];
    data->temp_dec = buf[3];
    data->checksum = buf[4];
    
    return 0;
}
```

## 接口对比

| 特性 | I2C | SPI | UART |
|------|-----|-----|------|
| 线数 | 2 | 4 | 2 |
| 速度 | 中 | 高 | 低-中 |
| 全双工 | 否 | 是 | 是 |
| 多设备 | 是 | 是 | 否 |
| 距离 | 短 | 短 | 长 |

## 参考资料

[1] I2C-bus specification. NXP Semiconductors

[2] SPI Block Guide. Motorola

[3] DHT11 Datasheet. Aosong Electronics

## 相关主题

- [MQTT 协议](/notes/iot/mqtt) - 物联网通信协议
- [串口数据解析](/notes/embedded/uart-data) - UART 通信详解
- [协议设计](/notes/embedded/protocol) - 自定义通信协议
