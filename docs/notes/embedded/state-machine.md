---
title: 状态机 - 嵌入式复杂逻辑的优雅解决方案
date: 2026-03-24
tags: [嵌入式, 设计模式, C语言, 协议解析]
description: 掌握状态机设计模式，优雅处理复杂逻辑和协议解析
---

# 状态机

## 什么是状态机？

状态机（State Machine）是一种行为模型，它用**有限个状态**来描述系统在不同条件下的行为。系统在某一时刻只能处于一个状态，当特定事件发生时，会从一个状态**转换**到另一个状态。

听起来抽象？其实生活中到处都是状态机：

- **红绿灯**：红灯 → 绿灯 → 黄灯 → 红灯
- **电梯**：停止 → 上行 → 停止 → 开门 → 关门
- **TCP 连接**：CLOSED → SYN_SENT → ESTABLISHED → FIN_WAIT → CLOSED
- **音乐播放器**：停止 → 播放 → 暂停 → 播放

状态机的核心思想：**把复杂的逻辑拆分成多个独立的状态，每个状态只关心自己的行为**。

<CollapsibleIframe src="/learning-notes/demos/state-machine/state-machine.html" title="状态机演示" :height="500" />

## 状态机的四个要素

一个完整的状态机包含四个基本要素：

| 要素 | 说明 | 示例 |
|------|------|------|
| **状态（State）** | 系统在某一时刻的状况 | 空闲、运行、暂停 |
| **事件（Event）** | 触发状态改变的条件 | 启动、停止、暂停 |
| **转换（Transition）** | 从一个状态到另一个状态 | 空闲 → 运行 |
| **动作（Action）** | 状态转换时执行的操作 | 启动电机、显示状态 |

## 为什么需要状态机？

### 问题：复杂的 if-else 嵌套

假设你要实现一个简单的设备控制系统：

```c
void control_system(int event) {
    if (system_is_off) {
        if (event == POWER_ON) {
            if (battery_ok) {
                if (hardware_init_ok) {
                    start_system();
                } else {
                    show_error();
                }
            } else {
                show_low_battery();
            }
        }
    } else if (system_is_running) {
        if (event == POWER_OFF) {
            stop_system();
        } else if (event == PAUSE) {
            pause_system();
        } else if (event == ERROR) {
            handle_error();
        }
        // ... 更多条件
    }
    // ... 更多状态
}
```

这种代码有几个问题：

1. **难以阅读**：层层嵌套，逻辑分散在各处
2. **难以维护**：修改一个状态的行为，可能影响其他代码
3. **容易出错**：遗漏某个条件，系统行为异常
4. **难以测试**：无法单独测试某个状态

### 解决：状态机

用状态机重构，每个状态的处理逻辑清晰独立：

```c
void state_machine(int event) {
    switch (current_state) {
        case STATE_OFF:
            handle_off_state(event);
            break;
        case STATE_RUNNING:
            handle_running_state(event);
            break;
        case STATE_PAUSED:
            handle_paused_state(event);
            break;
        case STATE_ERROR:
            handle_error_state(event);
            break;
    }
}
```

::: tip 状态机的优势
- **清晰**：每个状态的行为一目了然
- **独立**：修改一个状态不影响其他状态
- **可测试**：每个状态可以单独测试
- **可视化**：状态转换图直观展示系统行为
:::

## 实现方式一：Switch-Case

最简单直接的方式，适合状态较少的场景。

### 定义状态和事件

```c
typedef enum {
    STATE_IDLE,
    STATE_RUNNING,
    STATE_PAUSED,
    STATE_ERROR
} SystemState;

typedef enum {
    EVENT_START,
    EVENT_STOP,
    EVENT_PAUSE,
    EVENT_RESUME,
    EVENT_ERROR
} SystemEvent;
```

上述代码定义了状态机的状态枚举和事件枚举：

**SystemState 枚举说明：**

| 枚举值 | 值 | 说明 |
|--------|-----|------|
| `STATE_IDLE` | 0 | 空闲状态，系统未运行 |
| `STATE_RUNNING` | 1 | 运行状态，系统正常工作 |
| `STATE_PAUSED` | 2 | 暂停状态，系统暂停但可恢复 |
| `STATE_ERROR` | 3 | 错误状态，系统发生异常 |

**SystemEvent 枚举说明：**

| 枚举值 | 值 | 说明 |
|--------|-----|------|
| `EVENT_START` | 0 | 启动事件，触发系统开始运行 |
| `EVENT_STOP` | 1 | 停止事件，触发系统停止 |
| `EVENT_PAUSE` | 2 | 暂停事件，触发系统暂停 |
| `EVENT_RESUME` | 3 | 恢复事件，从暂停恢复运行 |
| `EVENT_ERROR` | 4 | 错误事件，触发系统进入错误状态 |

### 状态变量

```c
SystemState current_state = STATE_IDLE;
```

### 状态处理函数

```c
void handle_event(SystemEvent event) {
    switch (current_state) {
        case STATE_IDLE:
            if (event == EVENT_START) {
                start_system();
                current_state = STATE_RUNNING;
            } else if (event == EVENT_ERROR) {
                current_state = STATE_ERROR;
            }
            break;

        case STATE_RUNNING:
            if (event == EVENT_STOP) {
                stop_system();
                current_state = STATE_IDLE;
            } else if (event == EVENT_PAUSE) {
                pause_system();
                current_state = STATE_PAUSED;
            } else if (event == EVENT_ERROR) {
                emergency_stop();
                current_state = STATE_ERROR;
            }
            break;

        case STATE_PAUSED:
            if (event == EVENT_RESUME) {
                resume_system();
                current_state = STATE_RUNNING;
            } else if (event == EVENT_STOP) {
                stop_system();
                current_state = STATE_IDLE;
            }
            break;

        case STATE_ERROR:
            if (event == EVENT_STOP) {
                reset_system();
                current_state = STATE_IDLE;
            }
            break;
    }
}
```

上述代码实现了 Switch-Case 方式的状态机事件处理函数：

**参数说明：**
- `event`：要处理的事件类型，类型为 `SystemEvent` 枚举

**状态转换逻辑：**

| 当前状态 | 事件 | 动作 | 下一状态 |
|----------|------|------|----------|
| STATE_IDLE | EVENT_START | start_system() | STATE_RUNNING |
| STATE_IDLE | EVENT_ERROR | 无 | STATE_ERROR |
| STATE_RUNNING | EVENT_STOP | stop_system() | STATE_IDLE |
| STATE_RUNNING | EVENT_PAUSE | pause_system() | STATE_PAUSED |
| STATE_RUNNING | EVENT_ERROR | emergency_stop() | STATE_ERROR |
| STATE_PAUSED | EVENT_RESUME | resume_system() | STATE_RUNNING |
| STATE_PAUSED | EVENT_STOP | stop_system() | STATE_IDLE |
| STATE_ERROR | EVENT_STOP | reset_system() | STATE_IDLE |

**逐行解释：**

`switch (current_state)` - 根据当前状态分发处理逻辑，每个 case 分支处理一个状态的逻辑。

`case STATE_IDLE:` - 处理空闲状态。在此状态下，系统只响应 START 和 ERROR 事件，其他事件被忽略。

`start_system()` - 调用系统启动函数，执行硬件初始化等操作。

`current_state = STATE_RUNNING` - 更新状态变量，完成状态转换。

`case STATE_RUNNING:` - 处理运行状态。在此状态下，系统响应 STOP、PAUSE、ERROR 事件。

`emergency_stop()` - 紧急停止函数，在错误发生时立即停止系统，可能需要关闭电机、切断电源等。

`case STATE_PAUSED:` - 处理暂停状态。在此状态下，系统可以恢复运行或完全停止。

`case STATE_ERROR:` - 处理错误状态。这是系统的安全状态，只有 STOP 事件能将其重置。

### 优缺点

| 优点 | 缺点 |
|------|------|
| 实现简单 | 状态多时代码冗长 |
| 易于理解 | 转换逻辑分散 |
| 调试方便 | 不易扩展 |

## 实现方式二：状态表驱动

当状态和事件较多时，用表格来管理转换规则更清晰。

### 定义转换规则结构

```c
typedef struct {
    SystemState current;    // 当前状态
    SystemEvent event;      // 触发事件
    SystemState next;       // 下一状态
    void (*action)(void);   // 执行动作
} StateTransition;
```

上述代码定义了状态转换规则的结构体：

**结构体成员说明：**

| 成员 | 类型 | 说明 |
|------|------|------|
| `current` | `SystemState` | 当前状态，转换的起点 |
| `event` | `SystemEvent` | 触发转换的事件 |
| `next` | `SystemState` | 目标状态，转换的终点 |
| `action` | `void (*)(void)` | 状态转换时执行的函数指针，可以为 NULL 表示无动作 |

### 定义动作函数

```c
void action_start(void) { printf("Starting...\n"); }
void action_stop(void) { printf("Stopping...\n"); }
void action_pause(void) { printf("Pausing...\n"); }
void action_resume(void) { printf("Resuming...\n"); }
```

### 状态转换表

```c
StateTransition state_table[] = {
    // 当前状态        事件            下一状态         动作
    {STATE_IDLE,    EVENT_START,    STATE_RUNNING,  action_start},
    {STATE_IDLE,    EVENT_ERROR,    STATE_ERROR,    NULL},
    {STATE_RUNNING, EVENT_STOP,     STATE_IDLE,     action_stop},
    {STATE_RUNNING, EVENT_PAUSE,    STATE_PAUSED,   action_pause},
    {STATE_RUNNING, EVENT_ERROR,    STATE_ERROR,    NULL},
    {STATE_PAUSED,  EVENT_RESUME,   STATE_RUNNING,  action_resume},
    {STATE_PAUSED,  EVENT_STOP,     STATE_IDLE,     action_stop},
    {STATE_ERROR,   EVENT_STOP,     STATE_IDLE,     NULL}
};

#define TABLE_SIZE (sizeof(state_table) / sizeof(StateTransition))
```

上述代码定义了状态转换表：

**转换表说明：**

这个表格完整描述了状态机的所有转换规则。每一行代表一条转换规则：当处于 `current` 状态时，如果收到 `event` 事件，则执行 `action` 函数并转换到 `next` 状态。

**TABLE_SIZE 宏说明：**

`sizeof(state_table)` - 获取整个数组占用的字节数。

`sizeof(StateTransition)` - 获取单个结构体元素的字节数。

两者相除得到数组元素个数，这样添加新规则时无需手动更新计数。

### 查表处理事件

```c
void process_event(SystemEvent event) {
    for (int i = 0; i < TABLE_SIZE; i++) {
        if (state_table[i].current == current_state &&
            state_table[i].event == event) {

            // 执行动作
            if (state_table[i].action) {
                state_table[i].action();
            }

            // 状态转换
            current_state = state_table[i].next;
            return;
        }
    }

    printf("Invalid event in current state\n");
}
```

上述代码实现了状态表的查表处理函数：

**参数说明：**
- `event`：要处理的事件类型

**逐行解释：**

`for (int i = 0; i < TABLE_SIZE; i++)` - 遍历状态转换表，查找匹配的规则。

`if (state_table[i].current == current_state && state_table[i].event == event)` - 同时匹配当前状态和事件，只有两者都匹配时才执行转换。

`if (state_table[i].action)` - 检查是否有关联的动作函数。如果 action 不为 NULL，则执行它。

`state_table[i].action()` - 调用状态转换关联的动作函数。

`current_state = state_table[i].next` - 更新当前状态，完成状态转换。

`return` - 找到匹配后立即返回，避免继续遍历。

`printf("Invalid event in current state\n")` - 如果遍历完整个表都没找到匹配的规则，说明当前状态下收到的事件是无效的。

### 优缺点

| 优点 | 缺点 |
|------|------|
| 转换规则集中 | 需要遍历查找 |
| 易于扩展 | 状态多时表很大 |
| 可配置化 | 调试稍复杂 |

::: tip 状态表的优点
- **可配置**：状态转换规则可以放在配置文件中
- **易扩展**：添加新状态只需增加表格条目
- **可视化**：表格本身就是状态转换图
:::

## 实现方式三：函数指针

每个状态对应一个处理函数，灵活性最高。

### 定义状态结构

```c
typedef struct State State;
typedef void (*StateHandler)(State *state, SystemEvent event);

struct State {
    StateHandler handler;   // 状态处理函数
    SystemState id;         // 状态标识
    void *data;             // 状态私有数据
};
```

### 定义状态处理函数

```c
void idle_handler(State *state, SystemEvent event);
void running_handler(State *state, SystemEvent event);
void paused_handler(State *state, SystemEvent event);
void error_handler(State *state, SystemEvent event);
```

### 各状态处理函数实现

```c
void idle_handler(State *state, SystemEvent event) {
    switch (event) {
        case EVENT_START:
            printf("Starting system\n");
            state->handler = running_handler;
            state->id = STATE_RUNNING;
            break;
        case EVENT_ERROR:
            printf("Error in idle\n");
            state->handler = error_handler;
            state->id = STATE_ERROR;
            break;
    }
}

void running_handler(State *state, SystemEvent event) {
    switch (event) {
        case EVENT_STOP:
            printf("Stopping system\n");
            state->handler = idle_handler;
            state->id = STATE_IDLE;
            break;
        case EVENT_PAUSE:
            printf("Pausing system\n");
            state->handler = paused_handler;
            state->id = STATE_PAUSED;
            break;
        case EVENT_ERROR:
            printf("Error in running\n");
            state->handler = error_handler;
            state->id = STATE_ERROR;
            break;
    }
}

void paused_handler(State *state, SystemEvent event) {
    switch (event) {
        case EVENT_RESUME:
            printf("Resuming system\n");
            state->handler = running_handler;
            state->id = STATE_RUNNING;
            break;
        case EVENT_STOP:
            printf("Stopping from pause\n");
            state->handler = idle_handler;
            state->id = STATE_IDLE;
            break;
    }
}

void error_handler(State *state, SystemEvent event) {
    if (event == EVENT_STOP) {
        printf("Resetting from error\n");
        state->handler = idle_handler;
        state->id = STATE_IDLE;
    }
}
```

### 状态机入口

```c
State current_state = {idle_handler, STATE_IDLE, NULL};

void state_machine(SystemEvent event) {
    if (current_state.handler) {
        current_state.handler(&current_state, event);
    }
}
```

### 优缺点

| 优点 | 缺点 |
|------|------|
| 最灵活 | 实现复杂 |
| 可扩展性强 | 需要函数指针支持 |
| 支持状态私有数据 | 调试困难 |

## 经典应用：协议解析

状态机在协议解析中应用广泛。比如解析一个简单的数据帧：

```
帧格式: [Header 0xAA][Length][Data...][Checksum]
```

### 定义解析状态

```c
typedef enum {
    PARSE_IDLE,
    PARSE_HEADER,
    PARSE_LENGTH,
    PARSE_DATA,
    PARSE_CHECKSUM
} ParseState;
```

### 定义解析器结构

```c
typedef struct {
    ParseState state;
    uint8_t buffer[256];
    uint8_t length;
    uint8_t index;
    uint8_t checksum;
    bool frame_ready;
} ProtocolParser;
```

### 解析函数

```c
bool parse_byte(ProtocolParser *parser, uint8_t byte) {
    switch (parser->state) {
        case PARSE_IDLE:
            if (byte == 0xAA) {
                parser->state = PARSE_HEADER;
            }
            break;

        case PARSE_HEADER:
            parser->length = byte;
            parser->index = 0;
            parser->checksum = 0;
            parser->state = PARSE_DATA;
            break;

        case PARSE_DATA:
            parser->buffer[parser->index++] = byte;
            parser->checksum += byte;

            if (parser->index >= parser->length) {
                parser->state = PARSE_CHECKSUM;
            }
            break;

        case PARSE_CHECKSUM:
            parser->state = PARSE_IDLE;
            if (byte == parser->checksum) {
                parser->frame_ready = true;
                return true;  // 解析成功
            }
            break;
    }

    return false;
}
```

### 使用示例

```c
ProtocolParser parser = {PARSE_IDLE};
uint8_t rx_data[] = {0xAA, 0x04, 0x01, 0x02, 0x03, 0x04, 0x0A};

for (int i = 0; i < sizeof(rx_data); i++) {
    if (parse_byte(&parser, rx_data[i])) {
        printf("Frame received!\n");
        // 处理 parser.buffer 中的数据
    }
}
```

## 状态机设计原则

### 1. 单一职责

一个状态机只负责一件事：

```c
// 好的设计 - 分离状态机
KeyStateMachine key_sm;      // 按键状态机
LedStateMachine led_sm;      // LED 状态机
ProtocolStateMachine proto_sm;  // 协议状态机

// 不好的设计 - 一个状态机处理所有事情
BigStateMachine everything_sm;  // 混杂了按键、LED、协议...
```

### 2. 状态完整性

确保每个状态都处理了所有可能的输入：

```c
void handle_state(SystemEvent event) {
    switch (event) {
        case EVENT_A: /* 处理 */ break;
        case EVENT_B: /* 处理 */ break;
        case EVENT_C: /* 处理 */ break;
        default:
            // 处理未知事件
            printf("Unknown event\n");
            break;
    }
}
```

### 3. 避免状态爆炸

当状态组合过多时，考虑拆分：

```c
// 状态爆炸：系统状态 × LED 状态 = 8 个状态
typedef enum {
    OFF_LED_OFF,
    OFF_LED_ON,
    RUNNING_LED_OFF,
    RUNNING_LED_ON,
    PAUSED_LED_OFF,
    PAUSED_LED_ON,
    ERROR_LED_OFF,
    ERROR_LED_ON
} BadState;  // 不好的设计

// 好的设计：分离关注点
SystemState system_state;  // OFF, RUNNING, PAUSED, ERROR
LedState led_state;        // OFF, ON, BLINK
```

## 状态机 vs 其他方案

| 方案 | 优点 | 缺点 | 适用场景 |
|------|------|------|----------|
| if-else | 简单直接 | 难维护 | 简单逻辑 |
| 状态机 | 清晰、可维护 | 需要设计 | 复杂逻辑 |
| 协程 | 灵活 | 需要调度器 | 多任务 |

## 总结

1. **状态机**用有限状态描述系统行为，让复杂逻辑变得清晰
2. **三种实现**：Switch-Case（简单）、状态表（可配置）、函数指针（灵活）
3. **协议解析**是状态机的经典应用场景
4. **设计原则**：单一职责、状态完整、避免状态爆炸

## 相关主题

- [回调函数](/notes/embedded/callback) - 回调函数设计模式
- [通信协议](/notes/embedded/protocol) - 协议解析状态机
- [串口数据](/notes/embedded/uart-data) - 串口数据状态机
