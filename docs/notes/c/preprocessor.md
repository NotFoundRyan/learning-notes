---
title: 预处理器 - C 语言的编译前处理
date: 2026-03-27
tags: [C语言, 预处理器, 宏, 条件编译]
description: 深入理解 C 语言预处理器，掌握宏定义、条件编译、文件包含等核心功能
---

# 预处理器

## 什么是预处理器？

预处理器是 C 编译过程的**第一个阶段**，在编译器之前处理源代码。它处理以 `#` 开头的预处理指令，完成宏展开、文件包含、条件编译等工作。

### 编译流程

```
源代码 (.c)
    │
    ▼
┌─────────────────────────────────────────────────────────────┐
│                    预处理阶段                                │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ 1. 处理 #include：展开头文件                            ││
│  │ 2. 处理 #define：展开宏定义                             ││
│  │ 3. 处理 #if/#ifdef：条件编译                            ││
│  │ 4. 删除注释                                             ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
    │
    ▼
预处理后的代码 (.i)
    │
    ▼
┌─────────────────────────────────────────────────────────────┐
│                    编译阶段                                  │
│  词法分析 → 语法分析 → 语义分析 → 中间代码生成              │
└─────────────────────────────────────────────────────────────┘
    │
    ▼
汇编代码 (.s)
    │
    ▼
目标文件 (.o)
    │
    ▼
可执行文件
```

上述图示展示了 C 语言的编译流程。

**预处理指令列表：**

| 指令 | 说明 |
|------|------|
| `#include` | 文件包含 |
| `#define` | 宏定义 |
| `#undef` | 取消宏定义 |
| `#if` | 条件编译 |
| `#ifdef` | 如果定义了宏 |
| `#ifndef` | 如果没有定义宏 |
| `#else` | 否则 |
| `#elif` | 否则如果 |
| `#endif` | 结束条件编译 |
| `#pragma` | 编译器指令 |
| `#error` | 生成错误信息 |
| `#line` | 修改行号 |

## 宏定义

### 基本宏

```c
/*
 * 宏定义语法：
 * #define 宏名 替换文本
 */

// 常量定义
#define PI 3.14159
#define MAX_SIZE 100
#define DEBUG 1

// 表达式
#define SQUARE(x) ((x) * (x))
#define MAX(a, b) ((a) > (b) ? (a) : (b))
#define MIN(a, b) ((a) < (b) ? (a) : (b))

int main(void)
{
    double area = PI * SQUARE(5);  // 展开为: 3.14159 * ((5) * (5))
    int m = MAX(10, 20);           // 展开为: ((10) > (20) ? (10) : (20))
    
    return 0;
}
```

上述代码展示了基本宏的定义和使用。

**宏展开过程：**

```
源代码：
    double area = PI * SQUARE(5);

预处理后：
    double area = 3.14159 * ((5) * (5));
```

上述图示展示了宏展开过程。

### 宏的注意事项

```c
/*
 * 问题 1：缺少括号
 */
#define SQUARE_BAD(x) x * x

int a = 5;
int result = SQUARE_BAD(a + 1);  // 展开为: a + 1 * a + 1 = 5 + 5 + 1 = 11
                                  // 期望: 36

/*
 * 正确写法：使用括号
 */
#define SQUARE_GOOD(x) ((x) * (x))
int result2 = SQUARE_GOOD(a + 1);  // 展开为: ((a + 1) * (a + 1)) = 36

/*
 * 问题 2：副作用
 */
#define MAX_BAD(a, b) ((a) > (b) ? (a) : (b))

int x = 5, y = 3;
int max = MAX_BAD(x++, y++);  // x 或 y 可能自增两次！

/*
 * 正确做法：使用函数或临时变量
 */
int max_safe(int a, int b) {
    return a > b ? a : b;
}
```

上述代码展示了宏定义的常见问题。

**宏 vs 函数对比：**

| 特性 | 宏 | 函数 |
|------|-----|------|
| 执行速度 | 快（无调用开销） | 慢（有调用开销） |
| 代码大小 | 每次展开增加代码 | 只有一份代码 |
| 类型检查 | 无 | 有 |
| 调试 | 困难 | 容易 |
| 副作用 | 可能有 | 无 |

### 多行宏

```c
/*
 * 多行宏使用反斜杠续行
 */
#define SWAP(a, b, type) \
    do { \
        type temp = a; \
        a = b; \
        b = temp; \
    } while (0)

/*
 * 使用 do { ... } while (0) 的原因：
 * 确保宏在任何上下文中都能正确工作
 */

int main(void)
{
    int x = 10, y = 20;
    SWAP(x, y, int);  // 交换 x 和 y
    
    return 0;
}
```

上述代码展示了多行宏的定义方式。

**为什么使用 `do { ... } while (0)`？**

```c
// 不使用 do-while 的问题
#define SWAP_BAD(a, b, type) \
    { type temp = a; a = b; b = temp; }

if (condition)
    SWAP_BAD(x, y, int);  // 多了一个分号
else
    do_something();

// 展开后：
if (condition)
    { type temp = a; a = b; b = temp; };  // 空语句！
else
    do_something();  // else 悬空错误！

// 使用 do-while 正确：
if (condition)
    SWAP(x, y, int);  // 正确
else
    do_something();
```

上述代码解释了使用 `do { ... } while (0)` 的原因。

### 字符串化与连接

```c
/*
 * # 运算符：将参数转换为字符串
 */
#define STRINGIFY(x) #x
#define TOSTRING(x) STRINGIFY(x)

int main(void)
{
    printf("%s\n", STRINGIFY(hello));    // 输出: hello
    printf("%s\n", STRINGIFY(hello world));  // 输出: hello world
    
    #define VALUE 100
    printf("%s\n", TOSTRING(VALUE));     // 输出: 100（先展开 VALUE）
    
    return 0;
}

/*
 * ## 运算符：连接两个标记
 */
#define CONCAT(a, b) a ## b
#define MAKE_FUNC(name) void func_ ## name(void)

MAKE_FUNC(test)  // 展开为: void func_test(void)
{
    printf("test function\n");
}

int main(void)
{
    int CONCAT(var, 1) = 10;  // 展开为: int var1 = 10;
    func_test();              // 调用生成的函数
    
    return 0;
}
```

上述代码展示了字符串化和连接运算符的使用。

**运算符说明：**

| 运算符 | 说明 | 示例 |
|--------|------|------|
| `#` | 字符串化 | `#hello` → `"hello"` |
| `##` | 标记连接 | `a ## b` → `ab` |

### 可变参数宏

```c
/*
 * 可变参数宏
 * __VA_ARGS__ 表示可变参数
 */
#define DEBUG_PRINT(fmt, ...) \
    printf("[DEBUG] " fmt "\n", ##__VA_ARGS__)

/*
 * ##__VA_ARGS__ 的作用：
 * 如果没有可变参数，去掉前面的逗号
 */

int main(void)
{
    DEBUG_PRINT("Hello");                    // [DEBUG] Hello
    DEBUG_PRINT("Value: %d", 42);            // [DEBUG] Value: 42
    DEBUG_PRINT("x=%d, y=%d", 10, 20);       // [DEBUG] x=10, y=20
    
    return 0;
}
```

上述代码展示了可变参数宏的使用。

## 文件包含

### #include 指令

```c
/*
 * #include <filename>
 * 在系统目录中搜索头文件
 */
#include <stdio.h>      // 标准库头文件
#include <stdlib.h>
#include <string.h>

/*
 * #include "filename"
 * 先在当前目录搜索，再搜索系统目录
 */
#include "myheader.h"   // 自定义头文件
#include "utils.h"
```

上述代码展示了 `#include` 的两种形式。

**搜索路径对比：**

| 形式 | 搜索顺序 | 用途 |
|------|----------|------|
| `#include <file>` | 系统目录 | 标准库头文件 |
| `#include "file"` | 当前目录 → 系统目录 | 自定义头文件 |

### 头文件保护

```c
/*
 * 方式一：#ifndef 保护
 */
#ifndef MYHEADER_H
#define MYHEADER_H

// 头文件内容
struct Point {
    int x;
    int y;
};

void print_point(struct Point *p);

#endif // MYHEADER_H

/*
 * 方式二：#pragma once（推荐）
 * 更简洁，大多数编译器支持
 */
#pragma once

// 头文件内容
struct Point {
    int x;
    int y;
};

void print_point(struct Point *p);
```

上述代码展示了头文件保护的两种方式。

**为什么需要头文件保护？**

```
没有保护的情况：

file1.c:
    #include "a.h"
    #include "b.h"  // b.h 也包含了 a.h

a.h 被包含两次，导致重复定义错误！

有保护的情况：

第一次包含 a.h:
    #ifndef A_H → 真，定义 A_H，包含内容

第二次包含 a.h:
    #ifndef A_H → 假，跳过内容
```

上述图示解释了头文件保护的作用。

## 条件编译

### 基本条件编译

```c
/*
 * #if / #elif / #else / #endif
 */
#define VERSION 2

#if VERSION == 1
    #define FEATURE_A 1
#elif VERSION == 2
    #define FEATURE_A 1
    #define FEATURE_B 1
#else
    #define FEATURE_C 1
#endif

/*
 * #ifdef / #ifndef
 */
#ifdef DEBUG
    #define LOG(msg) printf("[DEBUG] %s\n", msg)
#else
    #define LOG(msg)  // 空定义
#endif

#ifndef BUFFER_SIZE
    #define BUFFER_SIZE 1024
#endif

/*
 * defined 运算符
 */
#if defined(DEBUG) && !defined(RELEASE)
    #define LOG_ENABLED 1
#endif
```

上述代码展示了条件编译的基本用法。

**条件编译指令：**

| 指令 | 说明 |
|------|------|
| `#if 表达式` | 如果表达式为真 |
| `#ifdef 宏` | 如果宏已定义 |
| `#ifndef 宏` | 如果宏未定义 |
| `#elif 表达式` | 否则如果 |
| `#else` | 否则 |
| `#endif` | 结束条件块 |
| `defined(宏)` | 判断宏是否定义 |

### 平台相关代码

```c
/*
 * 跨平台代码
 */
#if defined(_WIN32) || defined(_WIN64)
    #define PLATFORM_WINDOWS
    #include <windows.h>
#elif defined(__linux__)
    #define PLATFORM_LINUX
    #include <unistd.h>
#elif defined(__APPLE__)
    #define PLATFORM_MACOS
    #include <dispatch/dispatch.h>
#endif

#ifdef PLATFORM_WINDOWS
    #define SLEEP(ms) Sleep(ms)
#else
    #define SLEEP(ms) usleep((ms) * 1000)
#endif

void delay(int milliseconds)
{
    SLEEP(milliseconds);
}
```

上述代码展示了使用条件编译处理平台差异。

### 调试代码

```c
/*
 * 调试开关
 */
#ifdef DEBUG
    #define DPRINTF(fmt, ...) \
        fprintf(stderr, "[DEBUG %s:%d] " fmt "\n", \
                __FILE__, __LINE__, ##__VA_ARGS__)
#else
    #define DPRINTF(fmt, ...)  // 空定义
#endif

int divide(int a, int b)
{
    DPRINTF("divide(%d, %d)", a, b);
    
    if (b == 0) {
        DPRINTF("Error: division by zero");
        return 0;
    }
    
    return a / b;
}

// 编译时开启调试：
// gcc -DDEBUG program.c -o program
```

上述代码展示了使用条件编译控制调试代码。

## 预定义宏

### 标准预定义宏

```c
#include <stdio.h>

int main(void)
{
    /*
     * 标准预定义宏
     */
    printf("文件名: %s\n", __FILE__);          // 当前源文件名
    printf("行号: %d\n", __LINE__);            // 当前行号
    printf("函数名: %s\n", __func__);          // 当前函数名
    printf("日期: %s\n", __DATE__);            // 编译日期
    printf("时间: %s\n", __TIME__);            // 编译时间
    printf("标准: %ld\n", __STDC_VERSION__);   // C 标准版本
    
    return 0;
}
```

上述代码展示了标准预定义宏的使用。

**预定义宏列表：**

| 宏 | 说明 | 示例 |
|-----|------|------|
| `__FILE__` | 当前文件名 | `"main.c"` |
| `__LINE__` | 当前行号 | `42` |
| `__func__` | 当前函数名 | `"main"` |
| `__DATE__` | 编译日期 | `"Mar 27 2026"` |
| `__TIME__` | 编译时间 | `"10:30:45"` |
| `__STDC__` | 是否符合标准 | `1` |
| `__STDC_VERSION__` | C 标准版本 | `201112L` (C11) |

### 编译器预定义宏

```c
/*
 * GCC 预定义宏
 */
#ifdef __GNUC__
    #define GCC_VERSION (__GNUC__ * 10000 + __GNUC_MINOR__ * 100 + __GNUC_PATCHLEVEL__)
    printf("GCC 版本: %d\n", GCC_VERSION);
#endif

/*
 * 平台检测
 */
#ifdef _WIN32
    printf("Windows 平台\n");
#endif

#ifdef __linux__
    printf("Linux 平台\n");
#endif

#ifdef __arm__
    printf("ARM 架构\n");
#endif

#ifdef __x86_64__
    printf("x86-64 架构\n");
#endif
```

上述代码展示了编译器预定义宏的使用。

## #pragma 指令

### 常用 pragma

```c
/*
 * #pragma once：头文件保护
 */
#pragma once

/*
 * #pragma pack：内存对齐
 */
#pragma pack(push, 1)  // 保存当前对齐，设置为 1 字节对齐
struct Packed {
    char a;
    int b;
};
#pragma pack(pop)  // 恢复之前的对齐

/*
 * #pragma message：编译时输出消息
 */
#pragma message("Compiling " __FILE__)

/*
 * #pragma warning：控制警告
 */
#pragma warning(disable: 4996)  // 禁用特定警告

/*
 * #pragma error：生成错误
 */
#if __STDC_VERSION__ < 201112L
    #pragma error("C11 or later required")
#endif
```

上述代码展示了 `#pragma` 指令的常见用法。

### GCC 属性

```c
/*
 * __attribute__：GCC 特有属性
 */

// 函数属性
__attribute__((deprecated)) void old_function(void);
__attribute__((noreturn)) void exit_program(void);
__attribute__((always_inline)) static inline int add(int a, int b) {
    return a + b;
}

// 变量属性
int aligned_var __attribute__((aligned(16)));
int packed_struct __attribute__((packed));

// 格式检查
__attribute__((format(printf, 1, 2)))
void my_printf(const char *fmt, ...);
```

上述代码展示了 GCC 属性的使用。

## #error 和 #line

### #error 指令

```c
/*
 * #error：生成编译错误
 */
#ifndef ARCH
    #error "ARCH must be defined"
#endif

#if __STDC_VERSION__ < 199901L
    #error "C99 or later is required"
#endif

/*
 * #warning：生成编译警告（GCC 扩展）
 */
#ifdef DEBUG
    #warning "Debug mode is enabled"
#endif
```

上述代码展示了 `#error` 指令的使用。

### #line 指令

```c
/*
 * #line：修改 __LINE__ 和 __FILE__
 */
#line 100 "custom.c"

printf("行号: %d\n", __LINE__);  // 输出: 100
printf("文件: %s\n", __FILE__);  // 输出: custom.c
```

上述代码展示了 `#line` 指令的使用。

## 调试宏

### 断言宏

```c
/*
 * 自定义断言宏
 */
#ifdef DEBUG
    #define ASSERT(expr) \
        do { \
            if (!(expr)) { \
                fprintf(stderr, "Assertion failed: %s\n", #expr); \
                fprintf(stderr, "  File: %s, Line: %d\n", __FILE__, __LINE__); \
                abort(); \
            } \
        } while (0)
#else
    #define ASSERT(expr)  // 空定义
#endif

int divide(int a, int b)
{
    ASSERT(b != 0);  // 调试模式下检查
    return a / b;
}
```

上述代码展示了自定义断言宏的实现。

### 日志宏

```c
/*
 * 日志级别
 */
typedef enum {
    LOG_DEBUG,
    LOG_INFO,
    LOG_WARN,
    LOG_ERROR
} LogLevel;

#define LOG(level, fmt, ...) \
    do { \
        const char *level_str[] = {"DEBUG", "INFO", "WARN", "ERROR"}; \
        fprintf(stderr, "[%s][%s:%d] " fmt "\n", \
                level_str[level], __FILE__, __LINE__, ##__VA_ARGS__); \
    } while (0)

#define LOG_DEBUG_(fmt, ...) LOG(LOG_DEBUG, fmt, ##__VA_ARGS__)
#define LOG_INFO_(fmt, ...) LOG(LOG_INFO, fmt, ##__VA_ARGS__)
#define LOG_WARN(fmt, ...) LOG(LOG_WARN, fmt, ##__VA_ARGS__)
#define LOG_ERROR(fmt, ...) LOG(LOG_ERROR, fmt, ##__VA_ARGS__)

int main(void)
{
    LOG_INFO_("Program started");
    LOG_DEBUG_("Value: %d", 42);
    LOG_ERROR_("Something went wrong");
    
    return 0;
}
```

上述代码展示了日志宏的实现。

## 总结

| 概念 | 说明 |
|------|------|
| `#define` | 宏定义，文本替换 |
| `#include` | 文件包含 |
| `#ifdef/#ifndef` | 条件编译 |
| `#pragma` | 编译器指令 |
| `#` | 字符串化运算符 |
| `##` | 连接运算符 |
| `__VA_ARGS__` | 可变参数 |
| 预定义宏 | `__FILE__`, `__LINE__`, `__func__` 等 |

## 参考资料

[1] C Programming Language. Brian W. Kernighan, Dennis M. Ritchie

[2] C Primer Plus. Stephen Prata

[3] GCC Manual. https://gcc.gnu.org/onlinedocs/

## 相关主题

- [指针详解](/notes/c/pointer) - C 语言的核心灵魂
- [结构体与联合体](/notes/c/struct-union) - 复合数据类型
- [内存管理](/notes/c/memory-management) - 动态内存分配
