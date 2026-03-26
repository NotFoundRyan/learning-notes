---
title: 物联网技术
date: 2026-03-27
tags: [物联网, IoT, MQTT, 嵌入式]
description: 物联网开发技术笔记，涵盖通信协议、传感器接口、边缘计算等核心内容
---

# 物联网技术

本系列文章深入讲解物联网开发技术，从通信协议到实际应用，帮助你掌握 IoT 系统开发技能。

## 系列文章

### 通信协议

- [MQTT 协议](/notes/iot/mqtt) - 轻量级消息协议，IoT 通信标准

### 传感器接口

- [传感器接口](/notes/iot/sensor) - I2C、SPI、ADC 等常用接口

## 学习路径

```mermaid
flowchart TD
    A[嵌入式基础] --> B[通信协议]
    B --> C[传感器接口]
    C --> D[边缘计算]
    D --> E[云平台对接]
    
    B --> B1[MQTT]
    B --> B2[CoAP]
    B --> B3[HTTP/REST]
```

## 前置知识

学习本系列文章前，你需要：

- 熟练掌握 C 语言编程
- 了解嵌入式系统基础
- 熟悉网络通信概念

## 相关主题

- [硬件基础](/notes/hardware/) - ARM 架构、RTOS
- [嵌入式开发](/notes/embedded/) - 嵌入式系统开发
- [TCP/IP 协议](/notes/cs/tcp-ip) - 网络通信基础
