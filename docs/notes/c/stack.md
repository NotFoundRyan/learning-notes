---
title: 堆栈内存 - 从用户态到内核态的深度解析
date: 2026-03-27
tags: [C语言, 内存管理, 堆栈, Linux内核, 嵌入式]
description: 从用户态内存布局到内核态内存分配，深入理解栈和堆的工作原理、DMA与缓存一致性、内存屏障等核心概念
---

# 堆栈内存

## 什么是程序内存？

当你运行一个 C 程序时，操作系统会为它分配一块连续的**虚拟内存空间**。这块空间被划分为几个不同的区域，每个区域有特定的用途和管理方式。

理解内存布局是成为优秀 C 程序员的必经之路——它能帮助你：

- 理解变量的生命周期和作用域
- 避免内存泄漏和野指针
- 编写更高效、更安全的代码
- 排查难以定位的内存问题
- **理解用户态与内核态的内存交互**

## 程序的内存布局

### 用户空间内存布局

一个典型的 Linux 进程在内存中的布局如下：

```
高地址 (用户空间顶端，接近内核空间)
┌─────────────────────────────┐
│      内核空间 (1GB)          │  ← 用户程序不可直接访问
├─────────────────────────────┤ ← 0xC0000000 (x86 32位)
│      栈区 (Stack)            │  ← 向下增长
│           ↓                 │
│                             │
│           ↑                 │
│      内存映射区 (mmap)       │  ← 共享库、映射文件
├─────────────────────────────┤
│      堆区 (Heap)             │  ← 向上增长
├─────────────────────────────┤
│      BSS 段                  │  ← 未初始化的全局/静态变量
├─────────────────────────────┤
│      数据段 (.data)          │  ← 已初始化的全局/静态变量
├─────────────────────────────┤
│      代码段 (.text)          │  ← 程序指令（只读）
├─────────────────────────────┤
│      只读数据段 (.rodata)    │  ← 字符串常量、const 变量
└─────────────────────────────┘
低地址
```

上述图示展示了 Linux 进程的完整内存布局。

**各区域详细说明：**

| 区域 | 内容 | 特点 | 管理方式 |
|------|------|------|----------|
| 代码段 | 程序的机器指令 | 只读、可共享、可执行 | 编译时确定 |
| 只读数据段 | 字符串常量、const 全局变量 | 只读 | 编译时确定 |
| 数据段 | 已初始化的全局/静态变量 | 可读写 | 编译时确定 |
| BSS 段 | 未初始化的全局/静态变量 | 自动初始化为 0 | 编译时确定 |
| 堆区 | 动态分配的内存 | 手动管理 | 程序员控制 |
| 内存映射区 | mmap 映射的内存 | 文件映射、共享内存 | 程序员控制 |
| 栈区 | 局部变量、函数参数、返回地址 | 自动管理 | 编译器控制 |

### 虚拟内存与物理内存

现代操作系统使用**虚拟内存**技术，每个进程都有独立的虚拟地址空间：

```
┌─────────────────────────────────────────────────────────────┐
│                        进程 A                                │
│  ┌─────────┐                                                │
│  │ 虚拟地址 │──────┐                                        │
│  │ 0x1000  │      │                                        │
│  └─────────┘      │  页表映射                               │
│                   ▼                                        │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐                    │
│  │ 虚拟地址 │──│  页表   │──│ 物理地址 │                    │
│  │ 0x2000  │  └─────────┘  │ 0x5000  │                    │
│  └─────────┘               └─────────┘                    │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                        进程 B                                │
│  ┌─────────┐                                                │
│  │ 虚拟地址 │──────┐                                        │
│  │ 0x1000  │      │  页表映射（不同的页表）                  │
│  └─────────┘      │                                        │
│                   ▼                                        │
│               ┌─────────┐  ┌─────────┐                    │
│               │  页表   │──│ 物理地址 │                    │
│               └─────────┘  │ 0x8000  │                    │
│                            └─────────┘                    │
└─────────────────────────────────────────────────────────────┘
```

上述图示展示了虚拟内存到物理内存的映射关系。

**虚拟内存的优势：**

| 优势 | 说明 |
|------|------|
| 进程隔离 | 每个进程有独立的地址空间，互不干扰 |
| 内存保护 | 可以设置页的权限（读/写/执行） |
| 内存共享 | 不同进程可以映射同一物理页 |
| 按需分配 | 只有实际访问时才分配物理页 |

## 栈（Stack）

### 什么是栈？

栈是一种**后进先出（LIFO, Last In First Out）**的数据结构，由编译器自动管理。每次函数调用都会在栈上创建一个新的**栈帧（Stack Frame）**，用于存储该函数的局部变量、参数和返回地址。

### 栈的特点

- **自动管理**：变量的创建和销毁由编译器自动完成
- **速度快**：栈内存分配只需移动栈指针（SP），效率极高
- **大小有限**：Linux 默认 8MB，可通过 `ulimit -s` 调整
- **生命周期确定**：变量在函数返回时自动销毁
- **连续内存**：栈上的内存是连续的，有利于 CPU 缓存
- **线程独立**：每个线程有独立的栈空间

### 栈帧结构（x86-64）

当一个函数被调用时，会在栈上创建一个栈帧：

```c
void function(int a, int b) {
    int c = a + b;
    int d = c * 2;
}

int main(void) {
    function(1, 2);
    return 0;
}
```

调用 `function(1, 2)` 时的栈帧结构（x86-64 调用约定）：

```
高地址
┌──────────────────────────────────┐
│         参数 b = 2 (rsi)          │  ← 前 6 个整数参数通过寄存器传递
├──────────────────────────────────┤
│         参数 a = 1 (rdi)          │  ← 超过 6 个参数才压栈
├──────────────────────────────────┤
│         返回地址 (rip)            │  ← call 指令自动压入
├──────────────────────────────────┤
│         保存的 rbp                │  ← push rbp
├──────────────────────────────────┤
│         局部变量 c                │
├──────────────────────────────────┤
│         局部变量 d                │
├──────────────────────────────────┤
│         对齐填充 (可选)           │  ← 16 字节对齐要求
└──────────────────────────────────┘
低地址
```

上述栈帧结构展示了 x86-64 架构下的函数调用约定。

**x86-64 调用约定要点：**

| 要点 | 说明 |
|------|------|
| 参数传递 | 前 6 个整数参数通过 rdi, rsi, rdx, rcx, r8, r9 传递 |
| 返回值 | 整数返回值通过 rax 传递 |
| 调用者保存 | rax, rcx, rdx, rsi, rdi, r8-r11 由调用者保存 |
| 被调用者保存 | rbx, rbp, r12-r15 由被调用者保存 |
| 栈对齐 | 调用函数前，栈指针必须 16 字节对齐 |

### ARM 架构的栈帧

在嵌入式开发中，ARM 架构的栈帧有所不同：

```c
void function(int a, int b) {
    int c = a + b;
}
```

ARM（AAPCS 调用约定）栈帧结构：

```
高地址
┌──────────────────────────────────┐
│         参数 a (r0)               │  ← 前 4 个参数通过 r0-r3 传递
├──────────────────────────────────┤
│         参数 b (r1)               │
├──────────────────────────────────┤
│         返回地址 (lr)             │  ← bl 指令自动保存到 lr
├──────────────────────────────────┤
│         保存的 fp (r11)           │  ← push {fp, lr}
├──────────────────────────────────┤
│         局部变量 c                │
├──────────────────────────────────┤
│         保存的寄存器              │  ← push {r4-r10} (如果使用)
└──────────────────────────────────┘
低地址
```

上述图示展示了 ARM 架构的栈帧结构。

**ARM 与 x86-64 的主要区别：**

| 特性 | x86-64 | ARM |
|------|--------|-----|
| 参数寄存器 | 6 个 (rdi-r9) | 4 个 (r0-r3) |
| 返回地址寄存器 | 压栈 | lr (r14) |
| 栈指针 | rsp | sp (r13) |
| 帧指针 | rbp | fp (r11) |
| 栈增长方向 | 向下 | 向下 |

### 栈溢出

栈空间有限，如果使用不当会导致栈溢出：

```c
void recursive(int n) {
    int buffer[1024];  // 每次调用占用 4KB
    if (n > 0) {
        recursive(n - 1);  // 递归
    }
}

int main(void) {
    recursive(100000);  // 栈溢出！
    return 0;
}
```

上述代码演示了栈溢出的典型场景。

**问题分析：**

- 每次递归调用分配 4KB 局部变量
- 递归 100000 次需要约 400MB 栈空间
- 远超栈大小限制，导致栈溢出
- **栈溢出会覆盖相邻内存区域，可能导致程序崩溃或安全漏洞**

**嵌入式系统中的栈溢出风险：**

```c
void task_handler(void) {
    char buffer[2048];  // 在 RTOS 任务栈中分配
    // 如果任务栈只有 2KB，这里就会溢出
}

void main_task(void *arg) {
    while (1) {
        task_handler();  // 危险！
    }
}

// FreeRTOS 任务创建
xTaskCreate(main_task, "Task", 512, NULL, 1, NULL);
// 512 * 4 = 2048 字节栈空间，刚好不够用
```

上述代码展示了 RTOS 中常见的栈溢出问题。

**RTOS 栈溢出检测：**

```c
// FreeRTOS 栈溢出钩子函数
void vApplicationStackOverflowHook(TaskHandle_t xTask, char *pcTaskName) {
    printf("Stack overflow in task: %s\n", pcTaskName);
    while (1);  // 死循环，方便调试
}

// 在 FreeRTOSConfig.h 中启用
#define configCHECK_FOR_STACK_OVERFLOW 2
```

上述代码展示了 FreeRTOS 的栈溢出检测机制。

## 堆（Heap）

### 什么是堆？

堆是用于动态内存分配的区域，由程序员手动管理。与栈不同，堆上的内存需要显式申请和释放。

### 堆的特点

- **手动管理**：需要调用 malloc/free 申请和释放
- **大小灵活**：受限于系统可用内存
- **速度较慢**：需要查找合适的空闲块
- **生命周期可控**：由程序员决定何时释放
- **可能碎片化**：频繁分配释放会产生内存碎片

### glibc malloc 实现原理

glibc 的 malloc 使用 **ptmalloc**（Per-Thread MALLOC）实现，核心思想是将内存组织成多个"arena"：

```
┌─────────────────────────────────────────────────────────────┐
│                      堆内存区域                              │
│  ┌─────────────────────────────────────────────────────────┐│
│  │                    Main Arena                            ││
│  │  ┌─────────┬─────────┬─────────┬─────────┬─────────┐   ││
│  │  │  Chunk  │  Chunk  │  Chunk  │  Chunk  │  Chunk  │   ││
│  │  │ (已分配) │ (空闲)  │ (已分配) │ (空闲)  │ (已分配) │   ││
│  │  └─────────┴─────────┴─────────┴─────────┴─────────┘   ││
│  │       ↑              ↑              ↑                   ││
│  │    fast bin      small bin      large bin               ││
│  └─────────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────┐│
│  │                  Thread Arena                            ││
│  │  (每个线程有自己的 arena，减少锁竞争)                      ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

上述图示展示了 ptmalloc 的内存组织方式。

**Chunk 结构：**

```c
struct malloc_chunk {
    size_t mchunk_prev_size;  // 前一个 chunk 大小（仅当前一个空闲时有效）
    size_t mchunk_size;       // 当前 chunk 大小，低 3 位是标志位
    struct malloc_chunk* fd;  // 前向指针（仅空闲 chunk 使用）
    struct malloc_chunk* bk;  // 后向指针（仅空闲 chunk 使用）
};

// 标志位
#define PREV_INUSE     0x1    // 前一个 chunk 正在使用
#define IS_MMAPPED     0x2    // 通过 mmap 分配
#define NON_MAIN_ARENA 0x4    // 不属于 main arena
```

上述代码展示了 malloc chunk 的结构定义。

**malloc 分配策略：**

| 大小范围 | 分配位置 | 说明 |
|----------|----------|------|
| < 80 字节 | fast bin | 单向链表，LIFO，不合并 |
| < 512 字节 | small bin | 双向链表，FIFO，合并相邻空闲块 |
| >= 512 字节 | large bin | 按大小排序，最佳适配 |
| > 128KB | mmap | 直接向操作系统申请 |

### 常见的堆错误

#### 内存泄漏

```c
void memory_leak(void) {
    int *p = (int *)malloc(sizeof(int) * 100);
    // 使用 p...
    return;  // 忘记 free(p)，内存泄漏！
}
```

上述代码演示了内存泄漏问题。

**嵌入式系统中的内存泄漏更危险：**

- 嵌入式设备通常长期运行，内存泄漏会累积
- 没有 MMU 的系统，内存泄漏可能导致系统崩溃
- 没有虚拟内存，无法通过交换空间缓解

#### 野指针与 UAF（Use-After-Free）

```c
void wild_pointer(void) {
    int *p = (int *)malloc(sizeof(int));
    free(p);
    
    *p = 10;  // UAF：使用已释放的内存
}

void dangling_pointer(void) {
    int *p = (int *)malloc(sizeof(int));
    int *q = p;
    free(p);
    
    *q = 10;  // 悬空指针，同样是 UAF
}
```

上述代码演示了野指针和悬空指针问题。

**UAF 的危害：**

| 危害 | 说明 |
|------|------|
| 数据损坏 | 已释放的内存可能被其他代码使用 |
| 安全漏洞 | 攻击者可以利用 UAF 执行任意代码 |
| 难以调试 | 问题可能在不相关的地方才表现出来 |

## 内核态内存管理

### 内核内存分配函数

Linux 内核提供了多种内存分配函数，各有适用场景：

```c
#include <linux/slab.h>
#include <linux/vmalloc.h>
#include <linux/dma-mapping.h>

void *kmalloc(size_t size, gfp_t flags);     // 物理连续内存
void *kzalloc(size_t size, gfp_t flags);     // 物理连续内存，初始化为 0
void *vmalloc(unsigned long size);           // 虚拟连续内存
void *dma_alloc_coherent(struct device *dev, size_t size, 
                         dma_addr_t *dma_handle, gfp_t gfp);  // DMA 一致性内存
```

上述代码展示了 Linux 内核的主要内存分配函数。

**内核内存分配函数对比：**

| 函数 | 物理内存 | 虚拟内存 | 适用场景 | 限制 |
|------|----------|----------|----------|------|
| `kmalloc` | 连续 | 连续 | 小块内存、DMA | 最大 4MB |
| `kzalloc` | 连续 | 连续 | 需要初始化的内存 | 最大 4MB |
| `vmalloc` | 不连续 | 连续 | 大块内存 | 不能用于 DMA |
| `dma_alloc_coherent` | 连续 | 连续 | DMA 传输 | 需要设备支持 |
| `__get_free_pages` | 连续 | 连续 | 大块连续内存 | 2^n 页 |

### kmalloc 与 vmalloc 的区别

```c
// kmalloc：物理内存连续
void *p1 = kmalloc(1024, GFP_KERNEL);
// 优点：DMA 可用、访问速度快
// 缺点：可能产生内存碎片、大块分配困难

// vmalloc：虚拟内存连续，物理内存不连续
void *p2 = vmalloc(1024 * 1024);  // 1MB
// 优点：可以分配大块内存
// 缺点：需要建立页表映射、不能用于 DMA
```

上述代码对比了 kmalloc 和 vmalloc 的用法。

**内存布局对比：**

```
kmalloc 分配：
虚拟地址: 0xffff8880_00001000 ──┐
                               │ 直接映射
物理地址: 0x00000000_0010000 ───┘

vmalloc 分配：
虚拟地址: 0xffffc900_00000000 ──┐
                               │ 页表映射
物理地址: ┌─────────────────────┤
          │ 0x1000 (页1)        │
          │ 0x5000 (页2)        │← 物理页不连续
          │ 0x9000 (页3)        │
          └─────────────────────┘
```

上述图示展示了 kmalloc 和 vmalloc 的内存布局差异。

### Slab 分配器

Slab 分配器是内核用于高效管理小对象的机制：

```c
// 创建 slab 缓存
struct kmem_cache *my_cache = kmem_cache_create(
    "my_objects",           // 缓存名称
    sizeof(struct my_obj),  // 对象大小
    0,                      // 对齐方式
    SLAB_HWCACHE_ALIGN,     // 标志
    NULL                    // 构造函数
);

// 从缓存分配对象
struct my_obj *obj = kmem_cache_alloc(my_cache, GFP_KERNEL);

// 释放对象
kmem_cache_free(my_cache, obj);

// 销毁缓存
kmem_cache_destroy(my_cache);
```

上述代码展示了 Slab 分配器的使用方式。

**Slab 分配器的优势：**

| 优势 | 说明 |
|------|------|
| 减少碎片 | 相同大小的对象从同一缓存分配 |
| 提高速度 | 预分配对象，分配释放只需链表操作 |
| 缓存友好 | 对象在缓存中对齐 |
| 调试支持 | 可以检测越界、使用后释放等问题 |

## DMA 与缓存一致性

### DMA 内存分配

DMA（Direct Memory Access）允许外设直接访问内存，绕过 CPU：

```c
// 分配 DMA 一致性内存
void *virt_addr;
dma_addr_t dma_addr;

virt_addr = dma_alloc_coherent(dev, size, &dma_addr, GFP_KERNEL);
// virt_addr: CPU 访问的虚拟地址
// dma_addr:  DMA 控制器使用的物理地址

// 使用完成后释放
dma_free_coherent(dev, size, virt_addr, dma_addr);
```

上述代码展示了 DMA 内存的分配方式。

### 缓存一致性问题

DMA 操作中，CPU 高速缓存和内存数据可能不一致：

```
问题场景：
┌─────────────────────────────────────────────────────────────┐
│  CPU 写入数据到内存                                          │
│  ┌─────────┐      ┌─────────┐      ┌─────────┐            │
│  │ CPU 缓存 │ ──── │  内存   │ ──── │ DMA 控制器│           │
│  │  数据 A  │      │  数据 B  │      │  读取 B  │            │
│  └─────────┘      └─────────┘      └─────────┘            │
│       ↑                                    ↑               │
│    CPU 修改了 A                         DMA 读取 B          │
│    但 A 还在缓存中                      B 是旧数据！         │
│    内存中还是旧的 B                                         │
└─────────────────────────────────────────────────────────────┘
```

上述图示展示了 DMA 缓存一致性问题。

**解决方案：**

```c
// 方案一：dma_alloc_coherent（一致性 DMA 映射）
// 自动处理缓存一致性，但性能较低
void *buf = dma_alloc_coherent(dev, size, &dma_handle, GFP_KERNEL);

// 方案二：流式 DMA 映射（需要手动同步）
void *buf = kmalloc(size, GFP_KERNEL);
dma_addr_t dma_handle = dma_map_single(dev, buf, size, DMA_TO_DEVICE);

// CPU 写入数据后，同步到内存
dma_sync_single_for_device(dev, dma_handle, size, DMA_TO_DEVICE);

// DMA 完成后，CPU 读取前同步
dma_sync_single_for_cpu(dev, dma_handle, size, DMA_FROM_DEVICE);

dma_unmap_single(dev, dma_handle, size, DMA_TO_DEVICE);
```

上述代码展示了两种 DMA 缓存一致性解决方案。

**两种方案对比：**

| 方案 | 优点 | 缺点 | 适用场景 |
|------|------|------|----------|
| 一致性映射 | 简单，自动同步 | 性能较低，内存有限 | 控制结构、小缓冲区 |
| 流式映射 | 性能高，灵活 | 需要手动同步 | 大数据传输 |

### 内存屏障

在多核系统和 DMA 操作中，需要使用内存屏障确保操作顺序：

```c
// 写内存屏障：确保之前的写操作完成
wmb();

// 读内存屏障：确保之前的读操作完成
rmb();

// 全内存屏障：确保之前的读写操作都完成
mb();

// SMP 内存屏障：仅在多核系统中有效
smp_wmb();
smp_rmb();
smp_mb();

// DMA 操作示例
*descriptor = DMA_DESC_READY;  // 设置描述符
wmb();                          // 确保描述符写入完成
*dma_start = 1;                 // 启动 DMA
```

上述代码展示了内存屏障的使用方式。

**内存屏障的作用：**

| 屏障类型 | 作用 | 使用场景 |
|----------|------|----------|
| `wmb()` | 写操作有序 | DMA 启动前 |
| `rmb()` | 读操作有序 | 读取 DMA 结果前 |
| `mb()` | 读写有序 | 通用场景 |
| `smp_*` | 多核同步 | 多核系统 |

## 嵌入式系统内存管理

### RTOS 内存池

在 RTOS 中，通常使用内存池来管理内存，避免碎片：

```c
#define MEM_POOL_SIZE  4096
#define MEM_BLOCK_SIZE 64

static uint8_t mem_pool[MEM_POOL_SIZE];
static uint8_t mem_pool_used[MEM_POOL_SIZE / MEM_BLOCK_SIZE];

void* mem_pool_alloc(void) {
    for (int i = 0; i < MEM_POOL_SIZE / MEM_BLOCK_SIZE; i++) {
        if (!mem_pool_used[i]) {
            mem_pool_used[i] = 1;
            return &mem_pool[i * MEM_BLOCK_SIZE];
        }
    }
    return NULL;  // 内存池已满
}

void mem_pool_free(void *ptr) {
    int index = ((uint8_t*)ptr - mem_pool) / MEM_BLOCK_SIZE;
    if (index >= 0 && index < MEM_POOL_SIZE / MEM_BLOCK_SIZE) {
        mem_pool_used[index] = 0;
    }
}
```

上述代码实现了简单的固定大小内存池。

**内存池的优势：**

| 优势 | 说明 |
|------|------|
| 无碎片 | 固定大小块分配 |
| 分配快 | O(1) 时间复杂度 |
| 可预测 | 内存使用量确定 |
| 安全 | 不会分配失败 |

### FreeRTOS 堆管理

FreeRTOS 提供了多种堆管理方案：

```c
// heap_1.c：最简单，只能分配不能释放
void *pvPortMalloc(size_t xWantedSize);

// heap_2.c：可以释放，但不合并相邻空闲块
void vPortFree(void *pv);

// heap_4.c：可以释放，合并相邻空闲块（推荐）
void *pvPortMalloc(size_t xWantedSize);
void vPortFree(void *pv);

// heap_5.c：支持多个不连续内存区域
void vPortDefineHeapRegions(HeapRegion_t *pxHeapRegions);
```

上述代码展示了 FreeRTOS 的堆管理方案。

**FreeRTOS 堆方案对比：**

| 方案 | 碎片 | 合并 | 多区域 | 适用场景 |
|------|------|------|--------|----------|
| heap_1 | 无 | - | 否 | 只分配不释放 |
| heap_2 | 有 | 否 | 否 | 固定大小分配 |
| heap_4 | 少 | 是 | 否 | 通用场景 |
| heap_5 | 少 | 是 | 是 | 多内存区域 |

## 调试与检测

### 用户态内存检测

```bash
# Valgrind 内存检测
valgrind --leak-check=full --show-leak-kinds=all ./program

# AddressSanitizer（编译时）
gcc -fsanitize=address -g program.c -o program

# 查看进程内存映射
cat /proc/<pid>/maps

# 查看进程内存使用
cat /proc/<pid>/status | grep -E 'VmSize|VmRSS|VmStk|VmData'
```

### 内核态内存检测

```bash
# 启用内核内存检测
echo 1 > /proc/sys/vm/slab_debug

# 查看 slab 信息
cat /proc/slabinfo

# 查看内存碎片
cat /proc/buddyinfo

# 使用 kmemcheck 检测未初始化内存
# 需要内核编译时启用 CONFIG_KMEMCHECK
```

### 嵌入式内存调试

```c
// 内存分配跟踪
#ifdef DEBUG_MEMORY
#define MALLOC(size) debug_malloc(size, __FILE__, __LINE__)
#define FREE(ptr)    debug_free(ptr, __FILE__, __LINE__)

void* debug_malloc(size_t size, const char *file, int line) {
    void *ptr = malloc(size);
    printf("[ALLOC] %p (%zu bytes) at %s:%d\n", ptr, size, file, line);
    return ptr;
}

void debug_free(void *ptr, const char *file, int line) {
    printf("[FREE] %p at %s:%d\n", ptr, file, line);
    free(ptr);
}
#else
#define MALLOC(size) malloc(size)
#define FREE(ptr)    free(ptr)
#endif
```

上述代码展示了嵌入式系统的内存调试技巧。

## 总结

| 层次 | 内存类型 | 分配方式 | 特点 |
|------|----------|----------|------|
| 用户态 | 栈 | 编译器自动 | 快速、有限、自动管理 |
| 用户态 | 堆 | malloc/free | 灵活、手动管理 |
| 用户态 | mmap | mmap/munmap | 文件映射、共享内存 |
| 内核态 | kmalloc | kmalloc/kfree | 物理连续、DMA 可用 |
| 内核态 | vmalloc | vmalloc/vfree | 虚拟连续、大块内存 |
| 内核态 | slab | kmem_cache | 高效小对象管理 |
| 内核态 | DMA | dma_alloc_coherent | 缓存一致性 |

**核心要点：**

1. **用户态栈**：编译器自动管理，速度快但空间有限
2. **用户态堆**：程序员手动管理，灵活但需要谨慎
3. **内核态内存**：kmalloc 物理连续，vmalloc 虚拟连续
4. **DMA 内存**：必须处理缓存一致性问题
5. **内存屏障**：确保操作顺序，避免竞态条件
6. **嵌入式内存**：使用内存池避免碎片

## 参考资料

[1] CSAPP: Computer Systems: A Programmer's Perspective. https://csapp.cs.cmu.edu/

[2] Linux Kernel Documentation. https://www.kernel.org/doc/

[3] Understanding the Linux Virtual Memory Manager. Mel Gorman

[4] FreeRTOS Memory Management. https://www.freertos.org/a00111.html

## 相关主题

- [内存管理](/notes/c/memory-management) - malloc/free 与内核内存分配
- [static 关键字](/notes/c/static) - 变量的存储类
- [回调函数](/notes/embedded/callback) - 函数指针与栈帧
