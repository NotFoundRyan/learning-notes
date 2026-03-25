---
title: 回调函数 - 嵌入式模块解耦利器
date: 2026-03-24
tags: [嵌入式, 设计模式, C语言, 事件驱动]
description: 深入理解回调函数的设计模式与应用，实现模块解耦和异步事件处理
---

# 回调函数

## 什么是回调函数？

回调函数本质上就是**函数指针**的一种应用场景。把函数的地址（指针）作为参数传给另一个模块，当特定事件发生时，那个模块通过这个指针反过来调用你的函数——这就是"回调"。

听起来有点绕？其实生活中到处都是"回调"：

- 你给朋友留了个电话，说"到了给我打电话"——这是回调
- 快递员把包裹放驿站，发短信让你去取——这是回调
- 定闹钟，时间到了闹钟响——这也是回调

核心思想：**你定义函数，别人调用函数**。

<CollapsibleIframe src="/learning-notes/demos/callback-button.html" title="按键回调演示" :height="500" />

<CollapsibleIframe src="/learning-notes/demos/callback-timer.html" title="定时器回调演示" :height="500" />

<CollapsibleIframe src="/learning-notes/demos/callback-event.html" title="事件回调演示" :height="500" />

## 函数指针语法

在深入回调函数之前，先回顾一下函数指针的语法：

```c
// 声明一个函数指针
返回类型 (*指针名)(参数列表);

// 例如：指向一个 int func(int, int) 的函数
int (*pFunc)(int, int);

// 使用 typedef 简化
typedef int (*FuncType)(int, int);
FuncType pFunc;  // 等价于上面
```

函数指针可以指向任何匹配的函数：

```c
int add(int a, int b) { return a + b; }
int sub(int a, int b) { return a - b; }

pFunc = add;  // 指向 add
pFunc = sub;  // 指向 sub

int result = pFunc(3, 2);  // 通过指针调用
```

## 为什么需要回调函数？

### 问题：模块耦合

假设你在写一个按键扫描模块，想通知主程序按键被按下了。最直接的想法：

```c
// 按键模块
void key_scan(void) {
    if (key_pressed) {
        main_process_key(key_id);  // 直接调用主程序的函数
    }
}
```

这样做有几个问题：

1. **编译依赖**：按键模块必须 include 主程序的头文件
2. **复用困难**：换一个项目，主程序的函数名变了，按键模块也得改
3. **测试困难**：单独测试按键模块时，必须模拟主程序

### 解决：回调函数

用回调函数，按键模块只需要定义一个接口：

```c
// 按键模块的头文件
typedef void (*KeyCallback)(uint8_t keyId);

void key_register_callback(KeyCallback cb);
```

主程序注册自己的处理函数：

```c
// 主程序
void my_key_handler(uint8_t keyId) {
    printf("Key %d pressed\n", keyId);
}

int main(void) {
    key_register_callback(my_key_handler);
    // ...
}
```

现在按键模块完全不依赖主程序了——它只知道有一个回调函数需要调用，至于那个函数是谁、做什么，它一概不知。

::: tip 解耦的本质
回调函数实现了**控制反转（IoC）**：不是按键模块调用主程序，而是主程序把控制权"注入"到按键模块中。这是设计模式中"好莱坞原则"的体现：Don't call us, we'll call you.
:::

## 回调函数的基本实现

### 步骤一：定义回调类型

首先，用 typedef 定义一个回调函数类型：

```c
// 定义回调函数类型
typedef void (*CallbackFunc)(int param);
```

这行代码定义了一个名为 `CallbackFunc` 的类型，它可以指向任何"返回 void、接受一个 int 参数"的函数。

### 步骤二：保存回调指针

模块内部需要一个变量来保存注册的回调函数：

```c
// 全局变量，保存回调函数指针
static CallbackFunc g_callback = NULL;
```

用 `static` 限制作用域，防止外部直接访问。

### 步骤三：注册回调

提供一个注册函数，让外部传入回调：

```c
// 注册回调函数
void registerCallback(CallbackFunc callback) {
    g_callback = callback;
}
```

### 步骤四：触发回调

当事件发生时，调用注册的回调：

```c
// 触发事件
void triggerEvent(int data) {
    if (g_callback != NULL) {
        g_callback(data);  // 调用回调函数
    }
}
```

注意：**永远要检查指针是否为 NULL**。

## 实际应用场景

### 场景一：串口接收回调

串口收到数据了，怎么通知主程序？在中断里直接处理？不太合适——中断应该越短越好。

```c
// 定义回调类型
typedef void (*UartRxCallback)(uint8_t *data, uint16_t len);

// 保存回调
static UartRxCallback g_uartRxCallback = NULL;
static uint8_t rxBuffer[256];
static uint16_t rxIndex = 0;

// 注册函数
void uart_register_rx_callback(UartRxCallback cb) {
    g_uartRxCallback = cb;
}
```

中断服务函数中触发回调：

```c
void USART1_IRQHandler(void) {
    if (USART_GetITStatus(USART1, USART_IT_RXNE)) {
        uint8_t data = USART_ReceiveData(USART1);
        rxBuffer[rxIndex++] = data;
        
        if (data == '\n') {  // 收到完整一行
            if (g_uartRxCallback) {
                g_uartRxCallback(rxBuffer, rxIndex);
            }
            rxIndex = 0;
        }
    }
}
```

主程序注册回调：

```c
void uart_rx_handler(uint8_t *data, uint16_t len) {
    process_command(data, len);
}

int main(void) {
    uart_register_rx_callback(uart_rx_handler);
    while (1) {
        // 主循环可以做其他事情
    }
}
```

### 场景二：定时器回调

软件定时器是回调函数的典型应用场景。先定义定时器结构：

```c
typedef void (*TimerCallback)(void);

typedef struct {
    uint32_t period;       // 周期（ms）
    uint32_t counter;      // 计数器
    TimerCallback callback; // 回调函数
    bool enabled;          // 是否启用
} SoftTimer;

static SoftTimer timers[MAX_TIMERS];
```

创建定时器：

```c
void timer_create(uint32_t period, TimerCallback cb) {
    for (int i = 0; i < MAX_TIMERS; i++) {
        if (!timers[i].enabled) {
            timers[i].period = period;
            timers[i].counter = 0;
            timers[i].callback = cb;
            timers[i].enabled = true;
            return;
        }
    }
}
```

在 1ms 定时器中断中处理：

```c
void timer_tick(void) {
    for (int i = 0; i < MAX_TIMERS; i++) {
        if (timers[i].enabled) {
            timers[i].counter++;
            if (timers[i].counter >= timers[i].period) {
                timers[i].counter = 0;
                if (timers[i].callback) {
                    timers[i].callback();
                }
            }
        }
    }
}
```

使用起来非常简洁：

```c
void led_blink(void) {
    GPIO_ToggleBits(LED_GPIO, LED_PIN);
}

int main(void) {
    timer_create(500, led_blink);  // 每 500ms 闪烁一次
    while (1);
}
```

### 场景三：按键回调

按键处理是回调函数的经典应用。先定义事件类型：

```c
typedef enum {
    KEY_EVENT_PRESS,       // 按下
    KEY_EVENT_RELEASE,     // 释放
    KEY_EVENT_LONG_PRESS   // 长按
} KeyEvent;

typedef void (*KeyCallback)(uint8_t keyId, KeyEvent event);
```

按键扫描函数：

```c
void key_scan(void) {
    for (int i = 0; i < KEY_COUNT; i++) {
        bool currentState = read_key(i);
        
        // 检测按下
        if (currentState && !keys[i].lastState) {
            keys[i].pressTime = getTick();
            if (keys[i].callback) {
                keys[i].callback(i, KEY_EVENT_PRESS);
            }
        }
        
        // 检测长按（2秒）
        if (currentState && keys[i].lastState) {
            if (getTick() - keys[i].pressTime > 2000) {
                if (keys[i].callback) {
                    keys[i].callback(i, KEY_EVENT_LONG_PRESS);
                }
                keys[i].pressTime = getTick();  // 防止重复触发
            }
        }
        
        // 检测释放
        if (!currentState && keys[i].lastState) {
            if (keys[i].callback) {
                keys[i].callback(i, KEY_EVENT_RELEASE);
            }
        }
        
        keys[i].lastState = currentState;
    }
}
```

## 带上下文的回调

有时候回调函数需要知道"是谁触发的"。比如多个设备共用一个回调：

### 问题：多个实例

```c
void device_callback(uint8_t deviceId, int event) {
    // 需要根据 deviceId 区分设备
    switch (deviceId) {
        case 0: // 设备0的处理
            break;
        case 1: // 设备1的处理
            break;
    }
}
```

这种方式不够优雅——回调函数里要写 switch-case。

### 解决：上下文指针

更好的做法是传入一个 `void *context` 指针：

```c
typedef void (*EventCallback)(void *context, int eventData);

typedef struct {
    EventCallback callback;
    void *context;  // 用户上下文
} EventHandler;

void registerEvent(EventHandler *handler, EventCallback cb, void *ctx) {
    handler->callback = cb;
    handler->context = ctx;
}

void triggerEvent(EventHandler *handler, int eventData) {
    if (handler->callback) {
        handler->callback(handler->context, eventData);
    }
}
```

使用示例：

```c
typedef struct {
    int id;
    char name[32];
} Device;

void deviceEventHandler(void *context, int event) {
    Device *device = (Device *)context;  // 转换回实际类型
    printf("Device %s (ID: %d) received event: %d\n", 
           device->name, device->id, event);
}

int main(void) {
    Device myDevice = {1, "Sensor"};
    EventHandler handler;
    
    registerEvent(&handler, deviceEventHandler, &myDevice);
    triggerEvent(&handler, 100);
}
```

## 回调函数表

当有多个事件类型时，可以用数组管理多个回调：

```c
#define MAX_EVENTS 16

typedef struct {
    uint8_t eventId;
    EventCallback callback;
    void *context;
} CallbackEntry;

static CallbackEntry callbackTable[MAX_EVENTS];
static uint8_t callbackCount = 0;

bool registerCallback(uint8_t eventId, EventCallback cb, void *ctx) {
    if (callbackCount >= MAX_EVENTS) {
        return false;
    }
    
    callbackTable[callbackCount].eventId = eventId;
    callbackTable[callbackCount].callback = cb;
    callbackTable[callbackCount].context = ctx;
    callbackCount++;
    
    return true;
}

void notifyEvent(uint8_t eventId, int eventData) {
    for (int i = 0; i < callbackCount; i++) {
        if (callbackTable[i].eventId == eventId) {
            if (callbackTable[i].callback) {
                callbackTable[i].callback(callbackTable[i].context, eventData);
            }
        }
    }
}
```

## 使用回调函数的注意事项

### 1. 空指针检查

永远记得检查回调函数是否为 NULL：

```c
// 好的习惯
if (g_callback != NULL) {
    g_callback(data);
}

// 或者用宏封装
#define SAFE_CALL(cb, ...) \
    do { \
        if (cb) { \
            cb(__VA_ARGS__); \
        } \
    } while(0)

// 使用
SAFE_CALL(g_callback, data);
```

### 2. 中断上下文

在中断中调用回调要特别小心：

```c
void ISR_Handler(void) {
    // 回调函数应该尽可能简短
    if (g_callback) {
        g_callback(data);  // 这个函数不能太耗时！
    }
}
```

::: warning 中断上下文限制
- 不能调用阻塞函数（如 delay、wait）
- 不能调用可能会阻塞的 API
- 执行时间要尽量短
- 避免调用非可重入函数
:::

更好的做法是设置标志位，在主循环中处理：

```c
volatile bool g_eventFlag = false;
volatile uint8_t g_eventData;

void ISR_Handler(void) {
    g_eventData = read_data();
    g_eventFlag = true;  // 只设置标志
}

void main(void) {
    while (1) {
        if (g_eventFlag) {
            g_eventFlag = false;
            if (g_callback) {
                g_callback(g_eventData);  // 在主循环中处理
            }
        }
    }
}
```

### 3. 可重入性

如果回调函数可能被多个地方同时调用，要考虑可重入性：

```c
volatile bool g_isProcessing = false;

void process_data(int data) {
    if (g_isProcessing) {
        return;  // 避免重入
    }
    
    g_isProcessing = true;
    // 处理数据...
    g_isProcessing = false;
}
```

## 回调函数 vs 其他方案

| 方案 | 优点 | 缺点 | 适用场景 |
|------|------|------|----------|
| 直接调用 | 简单直接 | 耦合度高 | 简单项目 |
| 回调函数 | 解耦、灵活 | 需要函数指针支持 | 事件驱动 |
| 消息队列 | 完全解耦 | 复杂度高 | 大型系统 |
| 观察者模式 | 面向对象 | C语言实现复杂 | C++项目 |

## 总结

1. **回调函数**本质上是通过函数指针实现的控制反转
2. **解耦模块**：被调用者定义接口，调用者提供实现
3. **异步通知**：中断、定时器等场景的理想选择
4. **上下文参数**：让同一个回调处理多个实例
5. **注意事项**：空指针检查、中断上下文、可重入性

## 相关主题

- [状态机](/notes/embedded/state-machine) - 状态机设计模式
- [数据封装](/notes/embedded/data-encapsulation) - 数据封装技术
- [串口数据](/notes/embedded/uart-data) - 串口数据处理
