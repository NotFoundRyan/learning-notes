---
title: UDP/TCP - 嵌入式网络通信
date: 2026-03-24
tags: [嵌入式, 网络, TCP, UDP, 物联网]
description: 理解 UDP 和 TCP 的区别与应用，实现嵌入式网络通信
---

# UDP/TCP 网络通信

物联网时代，嵌入式设备联网已成标配。从智能家居到工业控制，从环境监测到远程医疗，网络通信能力让嵌入式设备"开口说话"、"耳听八方"。

传输层协议是网络通信的核心，UDP 和 TCP 是两大主角。它们就像两种性格截然不同的快递员：UDP 是"甩手掌柜"，扔下包裹就走；TCP 是"贴心管家"，确认签收才放心。

## UDP 和 TCP 的本质区别

### 形象比喻

**UDP（User Datagram Protocol，用户数据报协议）** 就像寄明信片：

- 写好地址，扔进邮筒，完事
- 不知道对方收到没有
- 可能寄丢了
- 可能后寄的先到

**TCP（Transmission Control Protocol，传输控制协议）** 就像寄挂号信：

- 先确认对方地址有效
- 每封信都要签收回执
- 丢了会重寄
- 保证按顺序到达

<CollapsibleIframe src="/learning-notes/demos/network-compare.html" title="UDP/TCP 对比演示" :height="600" />

### 特性对比

| 特性 | UDP | TCP |
|------|-----|-----|
| 连接方式 | 无连接 | 面向连接 |
| 可靠性 | 不保证送达 | 保证送达 |
| 顺序 | 可能乱序 | 保证顺序 |
| 速度 | 快 | 相对慢 |
| 资源消耗 | 低 | 高 |
| 适用场景 | 实时、广播 | 文件、HTTP |

### 为什么 UDP 不可靠还能用？

很多人疑惑：既然 UDP 不可靠，为什么还有人用？

答案是：**有些场景不需要可靠，或者可靠性的代价太大**。

比如实时视频通话：丢几帧画面，人眼根本察觉不到；但如果为了可靠性重传，画面就会卡顿——这才是用户无法忍受的。

再比如设备发现：广播一个"谁在？"的消息，有的设备收到就回复，没收到就算了，反正过会儿再问一次。

## UDP 编程

UDP 编程非常简单：创建套接字，然后直接发、直接收。

### UDP 编程模型

```
客户端                          服务器
   |                              |
   |  socket()                    |  socket()
   |                              |     |
   |                              |  bind()
   |                              |     |
   |  sendto() ---------------->  |  recvfrom()
   |                              |     |
   |  <---------------- recvfrom()|  sendto()
   |                              |
```

注意：UDP 服务器需要 `bind()` 绑定端口，客户端不需要。

### 创建 UDP 套接字

```c
int udp_socket;

udp_socket = socket(AF_INET, SOCK_DGRAM, 0);
if (udp_socket < 0) {
    perror("socket create failed");
    return -1;
}
```

参数说明：
- `AF_INET`：IPv4 地址族
- `SOCK_DGRAM`：数据报套接字（UDP）
- `0`：协议自动选择

### 服务器地址结构

```c
struct sockaddr_in server_addr;

server_addr.sin_family = AF_INET;
server_addr.sin_port = htons(8080);
server_addr.sin_addr.s_addr = inet_addr("192.168.1.100");
```

这里有几个重要的转换函数：
- `htons()`：主机字节序转网络字节序（短整型）
- `inet_addr()`：点分十进制 IP 转网络地址

### UDP 发送数据

```c
int udp_send(uint8_t *data, uint16_t len) {
    return sendto(udp_socket, data, len, 0,
                  (struct sockaddr *)&server_addr,
                  sizeof(server_addr));
}
```

`sendto()` 函数直接发送数据到指定地址，不需要先建立连接。

### UDP 接收数据

```c
int udp_recv(uint8_t *data, uint16_t max_len) {
    struct sockaddr_in from;
    socklen_t from_len = sizeof(from);
    
    return recvfrom(udp_socket, data, max_len, 0,
                    (struct sockaddr *)&from, &from_len);
}
```

`recvfrom()` 会返回数据来源地址，可以知道是谁发来的。

### UDP 服务器绑定端口

```c
void udp_server_init(uint16_t port) {
    struct sockaddr_in addr;
    
    addr.sin_family = AF_INET;
    addr.sin_port = htons(port);
    addr.sin_addr.s_addr = htonl(INADDR_ANY);
    
    bind(udp_socket, (struct sockaddr *)&addr, sizeof(addr));
}
```

`INADDR_ANY` 表示监听所有网络接口，适合多网卡设备。

### UDP 组播（多播）

组播是一对多通信的利器。发送方发一次，多个接收方都能收到。

#### 加入组播组

```c
void udp_join_group(char *group_ip, uint16_t port) {
    struct ip_mreq mreq;
    
    mreq.imr_multiaddr.s_addr = inet_addr(group_ip);
    mreq.imr_interface.s_addr = htonl(INADDR_ANY);
    
    setsockopt(udp_socket, IPPROTO_IP, IP_ADD_MEMBERSHIP,
               &mreq, sizeof(mreq));
}
```

#### 组播地址范围

| 范围 | 用途 |
|------|------|
| 224.0.0.0 ~ 224.0.0.255 | 本地网络保留 |
| 224.0.1.0 ~ 238.255.255.255 | 全球可分配 |
| 239.0.0.0 ~ 239.255.255.255 | 私有网络 |

::: tip 组播应用场景
- 设备发现（如 SSDP、mDNS）
- 视频会议
- 股票行情推送
- IoT 设备群发指令
:::

## TCP 编程

TCP 编程比 UDP 复杂，因为需要建立连接、维护连接状态。

### TCP 编程模型

```
客户端                          服务器
   |                              |
   |  socket()                    |  socket()
   |                              |     |
   |                              |  bind()
   |                              |     |
   |                              |  listen()
   |                              |     |
   |  connect() --------------->  |  accept()
   |        (三次握手)             |     |
   |                              |  <--- 新套接字
   |  send() ------------------>  |  recv()
   |                              |     |
   |  <---------------- recv()    |  send()
   |                              |     |
   |  close()                     |  close()
   |        (四次挥手)             |
```

### TCP 客户端连接

```c
int tcp_socket;

bool tcp_connect(char *ip, uint16_t port) {
    tcp_socket = socket(AF_INET, SOCK_STREAM, 0);
    if (tcp_socket < 0) return false;
    
    struct sockaddr_in addr;
    addr.sin_family = AF_INET;
    addr.sin_port = htons(port);
    addr.sin_addr.s_addr = inet_addr(ip);
    
    return connect(tcp_socket, (struct sockaddr *)&addr, 
                   sizeof(addr)) == 0;
}
```

`SOCK_STREAM` 表示流式套接字（TCP）。`connect()` 会阻塞直到连接建立或超时。

### TCP 发送和接收

```c
int tcp_send(uint8_t *data, uint16_t len) {
    return send(tcp_socket, data, len, 0);
}

int tcp_recv(uint8_t *data, uint16_t max_len) {
    return recv(tcp_socket, data, max_len, 0);
}
```

TCP 是字节流，没有"消息边界"的概念。发送 100 字节，可能分两次收到 50+50，也可能一次收到 100。应用层需要自己处理消息边界。

### TCP 服务器实现

```c
int server_socket;
int client_sockets[MAX_CLIENTS];

void tcp_server_init(uint16_t port) {
    server_socket = socket(AF_INET, SOCK_STREAM, 0);
    
    struct sockaddr_in addr;
    addr.sin_family = AF_INET;
    addr.sin_port = htons(port);
    addr.sin_addr.s_addr = htonl(INADDR_ANY);
    
    bind(server_socket, (struct sockaddr *)&addr, sizeof(addr));
    listen(server_socket, MAX_CLIENTS);
}

int tcp_accept(void) {
    struct sockaddr_in client;
    socklen_t len = sizeof(client);
    return accept(server_socket, (struct sockaddr *)&client, &len);
}
```

`listen()` 的第二个参数是等待队列长度，表示同时可以有多少个连接在排队。

## TCP 三次握手详解

TCP 连接建立需要三次握手，这是 TCP 可靠性的基础。

### 握手过程

```
客户端                          服务器
   |                              |
   |  -------- SYN ------------>  |  第1次：请求连接
   |        seq=100               |
   |                              |
   |  <----- SYN+ACK -----------  |  第2次：确认并请求
   |        seq=300, ack=101      |
   |                              |
   |  -------- ACK ------------>  |  第3次：确认
   |        seq=101, ack=301      |
   |                              |
   |        连接建立               |
```

### 为什么要三次？

两次握手的问题：假设客户端发的第一个 SYN 在网络中滞留了，连接早已关闭后这个 SYN 才到达服务器。服务器以为是新连接请求，回复 SYN+ACK，然后一直等待客户端发数据——白白浪费资源。

三次握手可以解决这个问题：客户端收到意外的 SYN+ACK，会发送 RST 拒绝。

### 状态变迁

| 阶段 | 客户端状态 | 服务器状态 |
|------|-----------|-----------|
| 初始 | CLOSED | CLOSED |
| 服务器 listen | CLOSED | LISTEN |
| 客户端发送 SYN | SYN_SENT | LISTEN |
| 服务器回复 SYN+ACK | SYN_SENT | SYN_RCVD |
| 客户端回复 ACK | ESTABLISHED | SYN_RCVD |
| 服务器收到 ACK | ESTABLISHED | ESTABLISHED |

## TCP 四次挥手详解

连接关闭需要四次挥手，比建立连接多一次。

### 挥手过程

```
主动关闭方                      被动关闭方
   |                              |
   |  -------- FIN ------------>  |  第1次：请求关闭
   |                              |
   |  <-------- ACK ------------  |  第2次：确认
   |                              |
   |  <-------- FIN ------------  |  第3次：请求关闭
   |                              |
   |  -------- ACK ------------>  |  第4次：确认
   |                              |
   |        连接关闭               |
```

### 为什么要四次？

建立连接时，SYN 和 ACK 可以合并发送（SYN+ACK）。但关闭连接时，被动方收到 FIN 后，可能还有数据要发送，不能立即关闭。所以 ACK 和 FIN 分开发送，就成了四次。

### TIME_WAIT 状态

主动关闭方在发送最后一个 ACK 后，会进入 TIME_WAIT 状态，等待 2MSL（Maximum Segment Lifetime，最大报文生存时间）。

为什么要等？因为最后一个 ACK 可能丢失，被动方会重发 FIN。如果主动方立即关闭，就无法响应重发的 FIN。

::: warning 嵌入式设备的 TIME_WAIT
嵌入式设备作为客户端频繁建立/断开连接时，TIME_WAIT 状态会占用资源。解决方案：
1. 设置 `SO_REUSEADDR` 选项
2. 使用长连接，减少连接次数
3. 让服务器主动关闭连接
:::

## 如何选择 UDP 还是 TCP？

### 选择 UDP 的场景

| 场景 | 原因 |
|------|------|
| 实时音视频 | 丢帧可接受，延迟不可接受 |
| 局域网设备发现 | 广播/组播需求 |
| DNS 查询 | 简单请求响应，开销小 |
| 传感器数据上报 | 丢一两条无所谓 |
| 游戏 | 实时性优先 |

### 选择 TCP 的场景

| 场景 | 原因 |
|------|------|
| 文件传输 | 数据必须完整 |
| HTTP 服务 | 标准 Web 协议 |
| 远程登录 | 命令必须准确执行 |
| 数据库连接 | 数据一致性要求 |
| 固件升级 | 升级包不能损坏 |

### 混合方案

有些场景可以结合两者：用 TCP 传输关键数据，用 UDP 传输实时数据。比如视频会议：控制信令用 TCP，音视频流用 UDP。

## 嵌入式网络编程技巧

### 非阻塞模式

嵌入式系统通常不能阻塞等待网络事件。

```c
int flags = fcntl(tcp_socket, F_GETFL, 0);
fcntl(tcp_socket, F_SETFL, flags | O_NONBLOCK);
```

设置非阻塞后，`recv()` 会立即返回：
- 有数据：返回数据长度
- 无数据：返回 -1，errno 为 EAGAIN 或 EWOULDBLOCK

### 超时设置

```c
struct timeval tv = {
    .tv_sec = 5,
    .tv_usec = 0
};

setsockopt(socket, SOL_SOCKET, SO_RCVTIMEO, &tv, sizeof(tv));
setsockopt(socket, SOL_SOCKET, SO_SNDTIMEO, &tv, sizeof(tv));
```

### 心跳保活

```c
int keepalive = 1;
int keepidle = 60;
int keepintvl = 5;
int keepcnt = 3;

setsockopt(socket, SOL_SOCKET, SO_KEEPALIVE, &keepalive, sizeof(keepalive));
setsockopt(socket, IPPROTO_TCP, TCP_KEEPIDLE, &keepidle, sizeof(keepidle));
setsockopt(socket, IPPROTO_TCP, TCP_KEEPINTVL, &keepintvl, sizeof(keepintvl));
setsockopt(socket, IPPROTO_TCP, TCP_KEEPCNT, &keepcnt, sizeof(keepcnt));
```

参数含义：
- `keepidle`：多久没数据开始发送心跳
- `keepintvl`：心跳间隔
- `keepcnt`：失败几次认为断开

## 常见问题

### Q: TCP 接收数据不完整怎么办？

TCP 是字节流，没有消息边界。解决方案：

1. **固定长度**：每条消息固定 N 字节
2. **长度前缀**：消息头带长度字段
3. **分隔符**：用特殊字符分隔消息

### Q: 如何处理网络断开？

检测断开的方法：
- `recv()` 返回 0：对端正常关闭
- `recv()` 返回 -1：检查 errno
- 心跳超时：对端异常断开

### Q: UDP 数据包大小限制？

UDP 理论最大 65507 字节（65535 - 8 字节 UDP 头 - 20 字节 IP 头）。但实际受 MTU 限制，以太网 MTU 是 1500 字节。超过 MTU 会触发 IP 分片，增加丢包风险。

建议：UDP 数据包控制在 1400 字节以内。

## 总结

1. **UDP** 无连接、快速、不可靠，适合实时场景和广播/组播
2. **TCP** 面向连接、可靠、有序，适合数据传输和需要可靠性的场景
3. **三次握手**建立 TCP 连接，确保双方都准备好
4. **四次挥手**关闭 TCP 连接，确保数据传输完成
5. **组播**是一对多通信的高效方案
6. **非阻塞和超时**是嵌入式网络编程的关键技巧

## 相关主题

- [通信协议](/notes/embedded/protocol) - 应用层协议设计
- [数据封装](/notes/embedded/data-encapsulation) - 数据帧设计
- [串口数据](/notes/embedded/uart-data) - 串口通信基础
- [状态机](/notes/embedded/state-machine) - 协议解析
