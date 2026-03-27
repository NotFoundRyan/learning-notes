---
title: 函数详解 - C 语言模块化编程基础
date: 2026-03-27
tags: [C语言, 函数, 参数传递, 递归]
description: 深入理解 C 语言函数，掌握参数传递、作用域、递归、函数指针等核心概念
---

# 函数详解

## 什么是函数？

函数是 **完成特定任务的独立代码块**。它是 C 语言模块化编程的基础，通过函数可以将复杂问题分解为多个小问题，提高代码的可读性和复用性。

### 函数的基本结构

```c
int add(int a, int b)
{
    return a + b;
}
```

上述代码定义了一个简单的加法函数：

**函数组成：**

| 部分 | 说明 |
|------|------|
| `int` | 返回类型，表示函数返回整数 |
| `add` | 函数名，用于调用函数 |
| `(int a, int b)` | 参数列表，定义输入数据 |
| `return a + b;` | 函数体，执行具体操作并返回结果 |

### 函数声明与定义

```c
int add(int a, int b);  

int add(int a, int b)   
{
    return a + b;
}
```

上述代码展示了函数的声明和定义：

**声明与定义的区别：**

| 特性 | 声明 | 定义 |
|------|------|------|
| 关键字 | 无特殊关键字 | 无特殊关键字 |
| 函数体 | 无，以分号结尾 | 有，包含具体代码 |
| 作用 | 告诉编译器函数存在 | 实现函数功能 |
| 次数 | 可以多次声明 | 只能定义一次 |

## 参数传递

### 值传递

```c
void swap_wrong(int a, int b)
{
    int temp = a;
    a = b;
    b = temp;
}

void swap_right(int *a, int *b)
{
    int temp = *a;
    *a = *b;
    *b = temp;
}

int main(void)
{
    int x = 10, y = 20;
    
    swap_wrong(x, y);
    printf("x=%d, y=%d\n", x, y);  
    
    swap_right(&x, &y);
    printf("x=%d, y=%d\n", x, y);  
    return 0;
}
```

上述代码展示了值传递与指针传递的区别：

```
┌─────────────────────────────────────────────────────────────┐
│                    值传递过程                                │
│                                                             │
│  调用 swap_wrong(x, y):                                     │
│                                                             │
│  main 函数:           swap_wrong 函数:                      │
│  ┌───┬───┐           ┌───┬───┐                              │
│  │ x │ y │           │ a │ b │                              │
│  │10 │20 │           │10 │20 │  ← 复制了值                   │
│  └───┴───┘           └───┴───┘                              │
│                                                             │
│  函数内交换 a 和 b:                                          │
│  ┌───┬───┐                                                  │
│  │ a │ b │                                                  │
│  │20 │10 │  ← 交换了副本                                    │
│  └───┴───┘                                                  │
│                                                             │
│  main 中的 x, y 不受影响                                     │
├─────────────────────────────────────────────────────────────┤
│                    指针传递过程                              │
│                                                             │
│  调用 swap_right(&x, &y):                                   │
│                                                             │
│  main 函数:           swap_right 函数:                      │
│  ┌───┬───┐           ┌───┬───┐                              │
│  │ x │ y │    ◄────  │ a │ b │                              │
│  │10 │20 │           │&x │&y │  ← 传递了地址                 │
│  └───┴───┘           └───┴───┘                              │
│      ▲                   │                                   │
│      └───────────────────┘                                   │
│                                                             │
│  通过地址修改:                                               │
│  *a = 20, *b = 10                                           │
│                                                             │
│  main 中的 x, y 被修改                                       │
└─────────────────────────────────────────────────────────────┘
```

### 数组参数

```c
void print_array(int arr[], int size)
{
    for (int i = 0; i < size; i++) {
        printf("%d ", arr[i]);
    }
    printf("\n");
}

void print_array_ptr(int *arr, int size)
{
    for (int i = 0; i < size; i++) {
        printf("%d ", arr[i]);
    }
    printf("\n");
}
```

上述代码展示了数组作为参数的传递方式：

**关键点：**

| 声明方式 | 实际类型 | 说明 |
|----------|----------|------|
| `int arr[]` | `int *arr` | 数组退化为指针 |
| `int *arr` | `int *arr` | 明确是指针 |
| `int arr[10]` | `int *arr` | 大小被忽略 |

**注意：** 数组作为参数时会退化为指针，无法通过 `sizeof` 获取数组大小，必须单独传递数组长度。

### const 参数

```c
int sum_array(const int *arr, int size)
{
    int total = 0;
    for (int i = 0; i < size; i++) {
        total += arr[i];
    }
    
    return total;
}
```

上述代码展示了 `const` 参数的使用：

**const 参数的作用：**

| 位置 | 含义 | 示例 |
|------|------|------|
| `const int *p` | 指向的值不可修改 | `*p = 10` 错误 |
| `int * const p` | 指针本身不可修改 | `p = &a` 错误 |
| `const int * const p` | 都不可修改 | 两者都错误 |

## 返回值

### 返回基本类型

```c
int max(int a, int b)
{
    return (a > b) ? a : b;
}

double divide(int a, int b)
{
    if (b == 0) {
        return 0.0;  
    }
    return (double)a / b;
}
```

上述代码展示了基本类型的返回值：

**返回值规则：**
- 返回值类型必须与函数声明一致
- 可以通过类型转换返回不同类型
- 无返回值使用 `void`

### 返回指针

```c
int *find_max(int *arr, int size)
{
    if (size <= 0) {
        return NULL;
    }
    
    int *max_ptr = arr;
    for (int i = 1; i < size; i++) {
        if (arr[i] > *max_ptr) {
            max_ptr = &arr[i];
        }
    }
    
    return max_ptr;
}

int *wrong_return(void)
{
    int local = 10;
    return &local;  
}
```

上述代码展示了返回指针的正确与错误方式：

**返回指针的规则：**

| 返回对象 | 安全性 | 说明 |
|----------|--------|------|
| 静态变量 | 安全 | 生命周期贯穿程序 |
| 动态分配内存 | 安全 | 调用者负责释放 |
| 参数传入的指针 | 安全 | 生命周期由调用者管理 |
| 局部变量 | **危险** | 函数返回后失效 |

### 返回结构体

```c
typedef struct {
    int x;
    int y;
} Point;

Point create_point(int x, int y)
{
    Point p = {x, y};
    return p;  
}

Point *create_point_heap(int x, int y)
{
    Point *p = malloc(sizeof(Point));
    if (p) {
        p->x = x;
        p->y = y;
    }
    return p;  
}
```

上述代码展示了结构体的返回方式：

**两种方式对比：**

| 方式 | 优点 | 缺点 |
|------|------|------|
| 返回结构体值 | 简单安全，自动管理内存 | 大结构体复制开销大 |
| 返回结构体指针 | 效率高，适合大结构体 | 需要手动释放内存 |

## 作用域与生命周期

### 变量作用域

```c
int global_var = 100;  

void func(void)
{
    int local_var = 10;  
    
    {
        int block_var = 20;  
        local_var = 30;      
        global_var = 200;    
    }
    
}

static int file_var = 50;  

static void internal_func(void)
{
    
}
```

上述代码展示了不同作用域的变量：

**作用域类型：**

| 类型 | 作用域 | 生命周期 | 初始化 |
|------|--------|----------|--------|
| 全局变量 | 整个程序 | 程序运行期间 | 自动初始化为 0 |
| 局部变量 | 函数内部 | 函数执行期间 | 未初始化，值不确定 |
| 块变量 | 代码块内 | 代码块执行期间 | 未初始化，值不确定 |
| 静态全局变量 | 当前文件 | 程序运行期间 | 自动初始化为 0 |
| 静态局部变量 | 函数内部 | 程序运行期间 | 只初始化一次 |

### 静态局部变量

```c
void counter(void)
{
    static int count = 0;  
    count++;
    printf("调用次数: %d\n", count);
}

int main(void)
{
    counter();  
    counter();  
    counter();  
    return 0;
}
```

上述代码展示了静态局部变量的特性：

**静态局部变量的特点：**

```
┌─────────────────────────────────────────────────────────────┐
│                  静态局部变量内存布局                        │
│                                                             │
│  内存区域:                                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                  代码段 (.text)                      │   │
│  │                  存储程序指令                         │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │                  数据段 (.data)                      │   │
│  │         已初始化的全局变量和静态变量                  │   │
│  │         count (静态局部变量存储在这里)               │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │                  BSS 段 (.bss)                       │   │
│  │         未初始化的全局变量和静态变量                  │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │                  堆               │   │
│  │         动态分配的内存                               │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │                  栈               │   │
│  │         局部变量 (非静态)                            │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  静态局部变量:                                              │
│  - 存储在数据段，不在栈上                                   │
│  - 只初始化一次                                            │
│  - 值在函数调用之间保持                                     │
└─────────────────────────────────────────────────────────────┘
```

## 递归函数

### 递归的基本概念

```c
int factorial(int n)
{
    if (n <= 1) {
        return 1;  
    }
    return n * factorial(n - 1);  
}
```

上述代码实现了阶乘的递归计算：

**递归执行过程：**

```
┌─────────────────────────────────────────────────────────────┐
│                  factorial(4) 执行过程                      │
│                                                             │
│  factorial(4)                                               │
│      │                                                      │
│      ├─► 4 * factorial(3)                                   │
│      │       │                                              │
│      │       ├─► 3 * factorial(2)                           │
│      │       │       │                                      │
│      │       │       ├─► 2 * factorial(1)                   │
│      │       │       │       │                              │
│      │       │       │       └─► return 1  (基准情况)       │
│      │       │       │                                      │
│      │       │       └─► return 2 * 1 = 2                   │
│      │       │                                              │
│      │       └─► return 3 * 2 = 6                           │
│      │                                                      │
│      └─► return 4 * 6 = 24                                  │
│                                                             │
│  结果: 24                                                   │
└─────────────────────────────────────────────────────────────┘
```

### 递归与栈

```c
int fibonacci(int n)
{
    if (n <= 1) {
        return n;
    }
    return fibonacci(n - 1) + fibonacci(n - 2);
}
```

上述代码实现了斐波那契数列的递归计算：

**递归调用栈：**

```
调用 fibonacci(5):

栈帧结构:
┌────────────────┐
│ fibonacci(5)   │ ← 栈顶
├────────────────┤
│ fibonacci(4)   │
├────────────────┤
│ fibonacci(3)   │
├────────────────┤
│ fibonacci(2)   │
├────────────────┤
│ fibonacci(1)   │ ← 基准情况
└────────────────┘

问题: 重复计算
fibonacci(3) 被计算了 2 次
fibonacci(2) 被计算了 3 次
```

### 尾递归优化

```c
int factorial_tail(int n, int acc)
{
    if (n <= 1) {
        return acc;
    }
    return factorial_tail(n - 1, n * acc);
}

int factorial(int n)
{
    return factorial_tail(n, 1);
}
```

上述代码展示了尾递归的实现：

**尾递归特点：**

| 特性 | 普通递归 | 尾递归 |
|------|----------|--------|
| 递归调用位置 | 可能在表达式中间 | 函数最后一步 |
| 栈帧使用 | 每次调用创建新栈帧 | 可复用栈帧 |
| 空间复杂度 | O(n) | O(1)（优化后） |
| 编译器优化 | 无 | 可能优化为循环 |

### 递归转迭代

```c
int factorial_iterative(int n)
{
    int result = 1;
    for (int i = 2; i <= n; i++) {
        result *= i;
    }
    return result;
}

int fibonacci_iterative(int n)
{
    if (n <= 1) {
        return n;
    }
    
    int prev = 0, curr = 1;
    for (int i = 2; i <= n; i++) {
        int next = prev + curr;
        prev = curr;
        curr = next;
    }
    
    return curr;
}
```

上述代码将递归转换为迭代：

**递归与迭代对比：**

| 特性 | 递归 | 迭代 |
|------|------|------|
| 代码可读性 | 通常更清晰 | 可能更复杂 |
| 空间效率 | 需要栈空间 | 通常更高效 |
| 栈溢出风险 | 有 | 无 |
| 调试难度 | 较难 | 较易 |

## 函数指针

### 函数指针基础

```c
int add(int a, int b) { return a + b; }
int sub(int a, int b) { return a - b; }
int mul(int a, int b) { return a * b; }

int main(void)
{
    int (*op)(int, int);  
    
    op = add;
    printf("10 + 5 = %d\n", op(10, 5));
    
    op = sub;
    printf("10 - 5 = %d\n", op(10, 5));
    
    op = mul;
    printf("10 * 5 = %d\n", op(10, 5));
    
    return 0;
}
```

上述代码展示了函数指针的基本用法：

**函数指针语法：**

```c
返回类型 (*指针名)(参数类型列表);

int (*fp)(int, int);          

typedef int (*Operation)(int, int);  
Operation op = add;          
```

### 函数指针数组

```c
int add(int a, int b) { return a + b; }
int sub(int a, int b) { return a - b; }
int mul(int a, int b) { return a * b; }
int div(int a, int b) { return b ? a / b : 0; }

int main(void)
{
    int (*operations[])(int, int) = {add, sub, mul, div};
    char *op_names[] = {"+", "-", "*", "/"};
    
    int a = 20, b = 5;
    for (int i = 0; i < 4; i++) {
        printf("%d %s %d = %d\n", a, op_names[i], b, operations[i](a, b));
    }
    
    return 0;
}
```

上述代码展示了函数指针数组的应用：

**函数指针数组用途：**
- 实现命令模式
- 状态机实现
- 策略模式
- 回调机制

### 回调函数

```c
typedef int (*CompareFunc)(const void *, const void *);

void bubble_sort(void *arr, size_t count, size_t size, CompareFunc cmp)
{
    char *base = (char *)arr;
    char *temp = malloc(size);
    
    for (size_t i = 0; i < count - 1; i++) {
        for (size_t j = 0; j < count - 1 - i; j++) {
            void *a = base + j * size;
            void *b = base + (j + 1) * size;
            
            if (cmp(a, b) > 0) {
                memcpy(temp, a, size);
                memcpy(a, b, size);
                memcpy(b, temp, size);
            }
        }
    }
    
    free(temp);
}

int compare_int(const void *a, const void *b)
{
    return *(int *)a - *(int *)b;
}

int compare_int_desc(const void *a, const void *b)
{
    return *(int *)b - *(int *)a;
}
```

上述代码展示了回调函数在排序中的应用：

**回调函数的优势：**
- 将算法与比较逻辑分离
- 同一排序函数支持不同排序规则
- 提高代码复用性

## 可变参数函数

### 可变参数基础

```c
#include <stdarg.h>

int sum(int count, ...)
{
    va_list args;
    int total = 0;
    
    va_start(args, count);
    
    for (int i = 0; i < count; i++) {
        total += va_arg(args, int);
    }
    
    va_end(args);
    
    return total;
}

int main(void)
{
    printf("Sum: %d\n", sum(3, 10, 20, 30));       
    printf("Sum: %d\n", sum(5, 1, 2, 3, 4, 5));    
    return 0;
}
```

上述代码展示了可变参数函数的实现：

**可变参数宏：**

| 宏 | 说明 |
|------|------|
| `va_list` | 可变参数列表类型 |
| `va_start(list, last_fixed)` | 初始化参数列表，`last_fixed` 是最后一个固定参数 |
| `va_arg(list, type)` | 获取下一个参数，`type` 是参数类型 |
| `va_end(list)` | 清理参数列表 |

### 可变参数实现原理

```
┌─────────────────────────────────────────────────────────────┐
│                  可变参数内存布局                            │
│                                                             │
│  调用 sum(3, 10, 20, 30):                                   │
│                                                             │
│  栈布局 (从高地址到低地址):                                   │
│  ┌──────────┐                                              │
│  │    30    │ ← va_arg(args, int) 第3次                    │
│  ├──────────┤                                              │
│  │    20    │ ← va_arg(args, int) 第2次                    │
│  ├──────────┤                                              │
│  │    10    │ ← va_arg(args, int) 第1次                    │
│  ├──────────┤                                              │
│  │    3     │ ← count (最后一个固定参数)                    │
│  ├──────────┤                                              │
│  │ 返回地址 │                                              │
│  └──────────┘                                              │
│                                                             │
│  va_start(args, count):                                     │
│  让 args 指向 count 之后的第一个可变参数                     │
│                                                             │
│  va_arg(args, int):                                         │
│  读取当前位置的值，然后移动到下一个参数                       │
└─────────────────────────────────────────────────────────────┘
```

### 实现类似 printf 的函数

```c
#include <stdarg.h>

void my_printf(const char *format, ...)
{
    va_list args;
    va_start(args, format);
    
    while (*format) {
        if (*format == '%') {
            format++;
            switch (*format) {
                case 'd': {
                    int val = va_arg(args, int);
                    printf("%d", val);
                    break;
                }
                case 's': {
                    char *str = va_arg(args, char *);
                    printf("%s", str);
                    break;
                }
                case 'c': {
                    char ch = (char)va_arg(args, int);
                    putchar(ch);
                    break;
                }
                case '%':
                    putchar('%');
                    break;
                default:
                    putchar('%');
                    putchar(*format);
            }
        } else {
            putchar(*format);
        }
        format++;
    }
    
    va_end(args);
}
```

上述代码实现了一个简化版的 `printf`：

**参数说明：**
- `format`：格式字符串
- `...`：可变参数

**支持的格式：**
- `%d`：整数
- `%s`：字符串
- `%c`：字符
- `%%`：百分号

## 内联函数

### 内联函数基础

```c
inline int square(int x)
{
    return x * x;
}

int main(void)
{
    int a = 5;
    int b = square(a);  
    return 0;
}
```

上述代码展示了内联函数的定义：

**内联函数特点：**

| 特性 | 内联函数 | 普通函数 |
|------|----------|----------|
| 调用方式 | 代码展开 | 跳转执行 |
| 函数调用开销 | 无 | 有 |
| 代码大小 | 可能增大 | 不变 |
| 适用场景 | 简短、频繁调用的函数 | 复杂函数 |

### 内联函数的展开

```
┌─────────────────────────────────────────────────────────────┐
│                    内联函数展开                              │
│                                                             │
│  源代码:                                                    │
│  int b = square(a);                                         │
│                                                             │
│  展开后 (编译器决定):                                        │
│  int b = a * a;                                             │
│                                                             │
│  生成的汇编 (无函数调用):                                    │
│  mov  eax, [a]        ; 加载 a                              │
│  imul eax, eax        ; eax = a * a                         │
│  mov  [b], eax        ; 存储 b                              │
│                                                             │
│  对比普通函数调用:                                           │
│  push [a]             ; 压栈参数                            │
│  call square          ; 调用函数                            │
│  add  esp, 4          ; 清理栈                              │
│  mov  [b], eax        ; 存储返回值                          │
└─────────────────────────────────────────────────────────────┘
```

## 总结

| 概念 | 要点 |
|------|------|
| 参数传递 | C 语言只有值传递，指针传递本质也是值传递 |
| 返回值 | 不要返回局部变量的指针 |
| 作用域 | 全局变量、局部变量、静态变量有不同的生命周期 |
| 递归 | 需要基准情况和递归步骤，注意栈溢出 |
| 函数指针 | 实现回调、策略模式等高级功能 |
| 可变参数 | 使用 `stdarg.h` 中的宏处理 |
| 内联函数 | 适合简单、频繁调用的函数 |

## 参考资料

[1] C Programming Language. Brian W. Kernighan, Dennis M. Ritchie

[2] C Primer Plus. Stephen Prata

[3] Expert C Programming. Peter van der Linden

## 相关主题

- [指针详解](/notes/c/pointer) - 函数指针的应用
- [内存管理](/notes/c/memory-management) - 动态内存分配
- [回调函数](/notes/embedded/callback) - 函数指针的实战应用
