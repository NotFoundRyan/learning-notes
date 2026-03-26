---
title: 结构体与联合体 - C 语言复合数据类型
date: 2026-03-27
tags: [C语言, 结构体, 联合体, 内存对齐]
description: 深入理解 C 语言结构体与联合体，掌握内存对齐、位域、嵌套结构等核心概念
---

# 结构体与联合体

## 什么是结构体？

结构体（Structure）是 C 语言中用于**将不同类型的数据组合在一起**的自定义数据类型。它允许你将相关的数据组织成一个整体，便于管理和传递。

### 结构体定义

```c
/*
 * 结构体定义语法
 * struct 结构体名 {
 *     类型 成员名1;
 *     类型 成员名2;
 *     ...
 * };
 */

// 定义学生结构体
struct Student {
    char name[32];      // 姓名
    int age;            // 年龄
    float score;        // 分数
};

// 定义结构体变量
struct Student stu1;                    // 方式一
struct Student stu2 = {"张三", 20, 85.5}; // 方式二：初始化

// 使用 typedef 简化
typedef struct {
    char name[32];
    int age;
    float score;
} Student;

Student stu3;  // 不需要 struct 关键字
```

上述代码展示了结构体的定义方式。

**结构体内存布局：**

```
struct Student {
    char name[32];  // 32 字节
    int age;        // 4 字节
    float score;    // 4 字节
};

内存布局（未对齐）：
┌─────────────────────────────────────────────────────────────┐
│  name[0-31]     │   age    │  score   │                    │
│  32 字节        │  4 字节  │  4 字节  │                    │
│  偏移: 0        │ 偏移: 32 │ 偏移: 36 │                    │
└─────────────────────────────────────────────────────────────┘
总大小: 40 字节
```

上述图示展示了结构体的内存布局。

## 结构体操作

### 成员访问

```c
#include <string.h>

struct Student {
    char name[32];
    int age;
    float score;
};

int main(void)
{
    struct Student stu;
    
    /*
     * 点运算符 (.)：直接访问结构体成员
     * 用于结构体变量
     */
    strcpy(stu.name, "李四");
    stu.age = 21;
    stu.score = 90.5;
    
    /*
     * 箭头运算符 (->)：通过指针访问结构体成员
     * 用于结构体指针
     * 等价于 (*ptr).member
     */
    struct Student *p = &stu;
    printf("姓名: %s\n", p->name);      // 使用 ->
    printf("年龄: %d\n", (*p).age);     // 使用 * 和 .
    printf("分数: %.1f\n", p->score);
    
    return 0;
}
```

上述代码展示了结构体成员的访问方式。

**点运算符 vs 箭头运算符：**

```
结构体变量：
┌─────────────────────────────────────────────────────────────┐
│  struct Student stu;                                        │
│                                                             │
│  stu.name    → 直接访问成员                                 │
│  stu.age     → 直接访问成员                                 │
└─────────────────────────────────────────────────────────────┘

结构体指针：
┌─────────────────────────────────────────────────────────────┐
│  struct Student *p = &stu;                                  │
│                                                             │
│  p->name    → 通过指针访问成员                              │
│  (*p).name  → 先解引用，再访问成员                          │
│  p->name 等价于 (*p).name                                   │
└─────────────────────────────────────────────────────────────┘
```

上述图示展示了两种运算符的区别。

### 结构体数组

```c
struct Student {
    char name[32];
    int age;
    float score;
};

int main(void)
{
    // 结构体数组
    struct Student class[3] = {
        {"张三", 20, 85.5},
        {"李四", 21, 90.0},
        {"王五", 19, 78.5}
    };
    
    // 遍历数组
    for (int i = 0; i < 3; i++) {
        printf("%s: %d岁, %.1f分\n", 
               class[i].name, 
               class[i].age, 
               class[i].score);
    }
    
    // 使用指针遍历
    struct Student *p;
    for (p = class; p < class + 3; p++) {
        printf("%s: %d岁\n", p->name, p->age);
    }
    
    return 0;
}
```

上述代码展示了结构体数组的使用方式。

**结构体数组内存布局：**

```
class[0]              class[1]              class[2]
┌──────────────────┬──────────────────┬──────────────────┐
│ name[32]         │ name[32]         │ name[32]         │
│ age (4)          │ age (4)          │ age (4)          │
│ score (4)        │ score (4)        │ score (4)        │
└──────────────────┴──────────────────┴──────────────────┘
     40 字节            40 字节            40 字节

class 指向数组首地址
class + 1 指向 class[1]
class + 2 指向 class[2]
```

上述图示展示了结构体数组的内存布局。

### 结构体作为函数参数

```c
struct Point {
    int x;
    int y;
};

/*
 * 值传递：复制整个结构体
 * 开销大，不推荐用于大型结构体
 */
void print_point_value(struct Point p)
{
    printf("(%d, %d)\n", p.x, p.y);
}

/*
 * 指针传递：只传递地址
 * 推荐方式，效率高
 */
void print_point_ptr(const struct Point *p)
{
    printf("(%d, %d)\n", p->x, p->y);
}

/*
 * 修改结构体
 * 必须使用指针
 */
void move_point(struct Point *p, int dx, int dy)
{
    p->x += dx;
    p->y += dy;
}

int main(void)
{
    struct Point pt = {10, 20};
    
    print_point_value(pt);      // 值传递
    print_point_ptr(&pt);       // 指针传递
    
    move_point(&pt, 5, -3);     // 修改结构体
    print_point_ptr(&pt);       // (15, 17)
    
    return 0;
}
```

上述代码展示了结构体作为函数参数的方式。

**值传递 vs 指针传递：**

| 方式 | 开销 | 能否修改原结构体 | 适用场景 |
|------|------|------------------|----------|
| 值传递 | 大（复制整个结构体） | 不能 | 小型结构体 |
| 指针传递 | 小（只传地址） | 能 | 大型结构体、需要修改 |

## 内存对齐

### 什么是内存对齐？

为了提高 CPU 访问内存的效率，编译器会对结构体成员进行**对齐处理**，使每个成员的起始地址是其大小的整数倍。

```c
struct Example {
    char a;     // 1 字节
    int b;      // 4 字节
    char c;     // 1 字节
};

// 未对齐布局（假设）：
// a (1) | b (4) | c (1) = 6 字节

// 实际对齐布局：
// ┌───────┬───────────────┬───────┬───────────────┐
// │ a (1) │ padding (3)   │ b (4) │ c (1) │ pad(3)│
// └───────┴───────────────┴───────┴───────────────┘
// 总大小: 12 字节
```

上述代码展示了内存对齐的效果。

**对齐规则：**

```
1. 成员对齐：每个成员的起始地址是其大小的整数倍
2. 结构体对齐：结构体总大小是最大成员大小的整数倍
3. 填充字节：编译器自动插入填充字节

示例：
struct Align {
    char a;     // 偏移 0，大小 1
    // 填充 3 字节
    int b;      // 偏移 4，大小 4
    char c;     // 偏移 8，大小 1
    // 填充 3 字节（结构体大小需是 4 的倍数）
};
// 总大小: 12 字节
```

上述图示展示了内存对齐规则。

### 优化结构体布局

```c
// 优化前：24 字节
struct Bad {
    char a;     // 1 + 7 填充
    double b;   // 8
    char c;     // 1 + 7 填充
};

// 优化后：16 字节
struct Good {
    double b;   // 8
    char a;     // 1
    char c;     // 1 + 6 填充
};

/*
 * 优化原则：
 * 将大尺寸成员放在前面
 * 将相同类型的成员放在一起
 */
```

上述代码展示了结构体布局优化技巧。

**优化前后对比：**

```
优化前 (struct Bad)：
┌───────┬───────────────────┬───────┬───────────────────┐
│ a (1) │ padding (7)       │ b (8) │ c (1) │ padding (7)│
└───────┴───────────────────┴───────┴───────────────────┘
总大小: 24 字节

优化后 (struct Good)：
┌───────────────────┬───────┬───────┬───────────────┐
│ b (8)             │ a (1) │ c (1) │ padding (6)   │
└───────────────────┴───────┴───────┴───────────────┘
总大小: 16 字节
```

上述图示展示了优化前后的内存布局对比。

### 使用 `#pragma pack`

```c
/*
 * #pragma pack(n)：设置对齐边界
 * n = 1, 2, 4, 8, 16
 */

#pragma pack(1)  // 1 字节对齐，无填充
struct Packed {
    char a;     // 1
    int b;      // 4
    char c;     // 1
};
#pragma pack()  // 恢复默认对齐
// 总大小: 6 字节

#pragma pack(2)  // 2 字节对齐
struct Packed2 {
    char a;     // 1 + 1 填充
    int b;      // 4
    char c;     // 1 + 1 填充
};
#pragma pack()
// 总大小: 8 字节
```

上述代码展示了使用 `#pragma pack` 控制对齐。

## 联合体

### 什么是联合体？

联合体（Union）是一种特殊的数据类型，**所有成员共享同一块内存空间**。联合体的大小等于最大成员的大小。

```c
/*
 * 联合体定义
 * 所有成员从同一地址开始
 */
union Data {
    int i;
    float f;
    char str[4];
};

int main(void)
{
    union Data data;
    
    printf("联合体大小: %zu\n", sizeof(data));  // 4 字节
    
    data.i = 42;
    printf("i = %d\n", data.i);    // 42
    
    data.f = 3.14f;
    printf("f = %f\n", data.f);    // 3.14
    printf("i = %d\n", data.i);    // 值被覆盖！
    
    return 0;
}
```

上述代码展示了联合体的基本用法。

**联合体内存布局：**

```
union Data {
    int i;        // 4 字节
    float f;      // 4 字节
    char str[4];  // 4 字节
};

内存布局：
┌─────────────────────────────────────────────────────────────┐
│  所有成员共享同一块 4 字节内存                               │
│                                                             │
│  ┌───────┬───────┬───────┬───────┐                         │
│  │ byte0 │ byte1 │ byte2 │ byte3 │                         │
│  └───────┴───────┴───────┴───────┘                         │
│      ↑                                                     │
│      │                                                     │
│  ┌───┴───┐  ┌───┴───┐  ┌───┴───┐                          │
│  │   i   │  │   f   │  │  str  │                          │
│  └───────┘  └───────┘  └───────┘                          │
│  所有成员从同一地址开始                                      │
└─────────────────────────────────────────────────────────────┘
```

上述图示展示了联合体的内存布局。

### 联合体应用

#### 类型转换

```c
/*
 * 使用联合体进行类型转换
 * 避免指针转换的未定义行为
 */
typedef union {
    float f;
    uint32_t u;
    uint8_t bytes[4];
} FloatConverter;

int main(void)
{
    FloatConverter conv;
    
    conv.f = 3.14f;
    
    // 查看 float 的二进制表示
    printf("float: %f\n", conv.f);
    printf("uint32: 0x%08X\n", conv.u);
    printf("bytes: %02X %02X %02X %02X\n",
           conv.bytes[0], conv.bytes[1],
           conv.bytes[2], conv.bytes[3]);
    
    return 0;
}
```

上述代码展示了联合体用于类型转换。

#### 协议解析

```c
/*
 * 网络协议解析
 * 同一数据有多种解释方式
 */
typedef struct {
    uint8_t type;
    union {
        struct {
            uint16_t x;
            uint16_t y;
        } mouse;
        struct {
            uint8_t key;
            uint8_t state;
        } keyboard;
        struct {
            int16_t dx;
            int16_t dy;
        } joystick;
    } data;
} InputEvent;

void handle_event(InputEvent *event)
{
    switch (event->type) {
        case 1:  // 鼠标事件
            printf("Mouse: (%d, %d)\n", 
                   event->data.mouse.x, 
                   event->data.mouse.y);
            break;
        case 2:  // 键盘事件
            printf("Keyboard: key=%d, state=%d\n",
                   event->data.keyboard.key,
                   event->data.keyboard.state);
            break;
        case 3:  // 摇杆事件
            printf("Joystick: dx=%d, dy=%d\n",
                   event->data.joystick.dx,
                   event->data.joystick.dy);
            break;
    }
}
```

上述代码展示了联合体在协议解析中的应用。

## 位域

### 什么是位域？

位域（Bit Field）允许按位定义结构体成员，用于节省内存空间。

```c
/*
 * 位域定义
 * 成员名 : 位数
 */
struct Flags {
    unsigned int ready : 1;     // 1 位
    unsigned int error : 1;     // 1 位
    unsigned int mode  : 2;     // 2 位
    unsigned int count : 4;     // 4 位
    unsigned int       : 0;     // 对齐到下一个存储单元
    unsigned int id    : 8;     // 8 位
};

int main(void)
{
    struct Flags f = {0};
    
    f.ready = 1;
    f.mode = 3;
    f.count = 15;
    f.id = 100;
    
    printf("结构体大小: %zu\n", sizeof(f));  // 8 字节
    
    return 0;
}
```

上述代码展示了位域的定义和使用。

**位域内存布局：**

```
struct Flags {
    unsigned int ready : 1;   // bit 0
    unsigned int error : 1;   // bit 1
    unsigned int mode  : 2;   // bit 2-3
    unsigned int count : 4;   // bit 4-7
    unsigned int       : 0;   // 对齐边界
    unsigned int id    : 8;   // bit 0-7 (新单元)
};

内存布局：
┌─────────────────────────────────────────────────────────────┐
│  第一个 32 位单元                                           │
│  ┌───┬───┬─────┬───────┬─────────────────────────────────┐ │
│  │ r │ e │ mode│ count │         未使用                   │ │
│  │ 1 │ 1 │  2  │   4   │            24                   │ │
│  └───┴───┴─────┴───────┴─────────────────────────────────┘ │
│                                                             │
│  第二个 32 位单元                                           │
│  ┌─────────┬─────────────────────────────────────────────┐ │
│  │   id    │              未使用                          │ │
│  │    8    │                24                            │ │
│  └─────────┴─────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
总大小: 8 字节
```

上述图示展示了位域的内存布局。

### 位域应用

```c
/*
 * 硬件寄存器映射
 */
typedef struct {
    volatile uint32_t TXEN   : 1;    // 发送使能
    volatile uint32_t RXEN   : 1;    // 接收使能
    volatile uint32_t TXIE   : 1;    // 发送中断使能
    volatile uint32_t RXIE   : 1;    // 接收中断使能
    volatile uint32_t        : 4;    // 保留
    volatile uint32_t BR     : 3;    // 波特率选择
    volatile uint32_t        : 5;    // 保留
    volatile uint32_t TXIF   : 1;    // 发送中断标志
    volatile uint32_t RXIF   : 1;    // 接收中断标志
    volatile uint32_t        : 14;   // 保留
} UART_CTRL;

#define UART_CTRL_REG ((volatile UART_CTRL*)0x40001000)

void uart_init(void)
{
    UART_CTRL_REG->TXEN = 1;
    UART_CTRL_REG->RXEN = 1;
    UART_CTRL_REG->BR = 7;  // 115200 baud
}
```

上述代码展示了位域在硬件寄存器映射中的应用。

## 嵌套结构体

### 结构体嵌套

```c
struct Date {
    int year;
    int month;
    int day;
};

struct Person {
    char name[32];
    struct Date birthday;    // 嵌套结构体
    struct Date *deathday;   // 嵌套结构体指针
};

int main(void)
{
    struct Person person = {
        .name = "张三",
        .birthday = {1990, 5, 15}
    };
    
    // 访问嵌套成员
    printf("姓名: %s\n", person.name);
    printf("生日: %d-%d-%d\n", 
           person.birthday.year,
           person.birthday.month,
           person.birthday.day);
    
    return 0;
}
```

上述代码展示了结构体嵌套的使用。

### 自引用结构体

```c
/*
 * 自引用结构体：链表节点
 */
struct Node {
    int data;
    struct Node *next;    // 指向自身的指针
};

/*
 * 双向链表节点
 */
struct DNode {
    int data;
    struct DNode *prev;
    struct DNode *next;
};

/*
 * 二叉树节点
 */
struct TreeNode {
    int data;
    struct TreeNode *left;
    struct TreeNode *right;
};
```

上述代码展示了自引用结构体的使用。

**链表内存布局：**

```
链表结构：
┌─────────┐     ┌─────────┐     ┌─────────┐
│ data: 1 │     │ data: 2 │     │ data: 3 │
│ next ───┼────►│ next ───┼────►│ next ───┼────► NULL
└─────────┘     └─────────┘     └─────────┘
    节点1           节点2           节点3
```

上述图示展示了链表的内存布局。

## 结构体与联合体对比

| 特性 | 结构体 | 联合体 |
|------|--------|--------|
| 内存分配 | 每个成员独立空间 | 所有成员共享空间 |
| 大小 | 所有成员大小之和（含对齐） | 最大成员大小 |
| 成员访问 | 可同时访问所有成员 | 同一时间只能使用一个成员 |
| 用途 | 组织相关数据 | 节省内存、类型转换 |

## 总结

| 概念 | 说明 |
|------|------|
| 结构体 | 将不同类型数据组合在一起 |
| 联合体 | 所有成员共享同一内存空间 |
| 内存对齐 | 提高访问效率，编译器自动处理 |
| 位域 | 按位定义成员，节省空间 |
| 嵌套结构体 | 结构体包含其他结构体 |
| 自引用 | 结构体包含指向自身的指针 |

## 参考资料

[1] C Programming Language. Brian W. Kernighan, Dennis M. Ritchie

[2] C Primer Plus. Stephen Prata

[3] Expert C Programming. Peter van der Linden

## 相关主题

- [指针详解](/notes/c/pointer) - C 语言的核心灵魂
- [内存管理](/notes/c/memory-management) - 动态内存分配
- [预处理器](/notes/c/preprocessor) - 宏与条件编译
