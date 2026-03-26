---
title: 内存管理 - 从用户态到内核态的完整解析
date: 2026-03-27
tags: [C语言, C++, 内存管理, Linux内核, 嵌入式]
description: 从用户态 malloc/free 到内核态 kmalloc/vmalloc，深入理解动态内存分配原理、Slab 分配器、DMA 内存管理及最佳实践
---

# 内存管理

## 为什么需要动态内存分配？

在程序运行前，我们往往无法确定需要多少内存。比如：

- 读取一个文件，文件大小未知
- 处理用户输入，输入长度未知
- 管理动态数据结构（链表、树等）
- **内核驱动中，设备缓冲区大小运行时确定**

动态内存分配让我们能够在**运行时**按需申请内存，用完后再释放，灵活高效。

## 用户态内存分配

### C 语言：malloc/free

#### malloc 基本用法

```c
#include <stdlib.h>

void malloc_example(void) {
    int *p = (int *)malloc(sizeof(int) * 10);
    
    if (p == NULL) {
        printf("内存分配失败\n");
        return;
    }
    
    for (int i = 0; i < 10; i++) {
        p[i] = i * 2;
    }
    
    free(p);
    p = NULL;
}
```

上述代码展示了 malloc 的标准使用方式。

**关键步骤说明：**

| 步骤 | 代码 | 说明 |
|------|------|------|
| 分配 | `malloc(size)` | 在堆上分配 size 字节 |
| 检查 | `if (p == NULL)` | 必须检查返回值 |
| 使用 | `p[i] = value` | 通过指针访问内存 |
| 释放 | `free(p)` | 归还内存 |
| 置空 | `p = NULL` | 防止野指针 |

#### malloc 函数族

```c
void *malloc(size_t size);           // 分配 size 字节，内容未初始化
void *calloc(size_t n, size_t size); // 分配 n*size 字节，初始化为 0
void *realloc(void *ptr, size_t size); // 调整已分配内存大小
void free(void *ptr);                // 释放内存
```

上述代码展示了 C 语言内存管理函数的原型。

**函数对比：**

| 函数 | 初始化 | 参数 | 返回值 | 适用场景 |
|------|--------|------|--------|----------|
| `malloc` | 未初始化 | 字节数 | 成功返回指针，失败返回 NULL | 通用 |
| `calloc` | 初始化为 0 | 元素个数、元素大小 | 成功返回指针，失败返回 NULL | 数组 |
| `realloc` | 保留原数据 | 原指针、新大小 | 成功返回指针，失败返回 NULL | 动态扩容 |

#### glibc malloc 实现原理

glibc 的 malloc 使用 **ptmalloc**（Per-Thread MALLOC）实现：

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

**malloc 分配策略：**

| 大小范围 | 分配位置 | 说明 |
|----------|----------|------|
| < 80 字节 | fast bin | 单向链表，LIFO，不合并 |
| < 512 字节 | small bin | 双向链表，FIFO，合并相邻空闲块 |
| >= 512 字节 | large bin | 按大小排序，最佳适配 |
| > 128KB | mmap | 直接向操作系统申请 |

### C++：new/delete

#### new 基本用法

```cpp
void new_example(void) {
    int *p = new int;          // 分配单个 int
    int *arr = new int[10];    // 分配数组
    
    *p = 100;
    for (int i = 0; i < 10; i++) {
        arr[i] = i;
    }
    
    delete p;          // 释放单个对象
    delete[] arr;      // 释放数组
}
```

上述代码展示了 new/delete 的基本用法。

**关键区别：**

| 操作符 | 用途 | 配对 |
|--------|------|------|
| `new` | 分配单个对象 | `delete` |
| `new[]` | 分配数组 | `delete[]` |

#### new 与构造函数

```cpp
class Student {
public:
    std::string name;
    int age;
    
    Student(const std::string& n, int a) : name(n), age(a) {
        std::cout << "构造函数: " << name << std::endl;
    }
    
    ~Student() {
        std::cout << "析构函数: " << name << std::endl;
    }
};

void class_example(void) {
    Student *s = new Student("张三", 20);
    // 输出: 构造函数: 张三
    
    delete s;
    // 输出: 析构函数: 张三
}
```

上述代码展示了 new 调用构造函数的特性。

**new 执行过程：**

1. 调用 `operator new` 分配内存
2. 调用构造函数初始化对象
3. 返回对象指针

**delete 执行过程：**

1. 调用析构函数清理资源
2. 调用 `operator delete` 释放内存

### malloc vs new 对比

| 特性 | malloc/free | new/delete |
|------|-------------|------------|
| 语言 | C | C++ |
| 返回类型 | `void*`（需要转换） | 具体类型指针 |
| 构造/析构 | 不调用 | 自动调用 |
| 失败处理 | 返回 NULL | 抛出异常（默认） |
| 大小计算 | 手动计算 | 自动计算 |
| 重载 | 不可重载 | 可重载 |

## Linux 内核内存分配

### 内核内存分配函数

Linux 内核提供了多种内存分配函数，各有适用场景：

```c
#include <linux/slab.h>
#include <linux/vmalloc.h>
#include <linux/gfp.h>
#include <linux/dma-mapping.h>

// 物理连续内存分配
void *kmalloc(size_t size, gfp_t flags);
void *kzalloc(size_t size, gfp_t flags);  // 初始化为 0
void kfree(const void *objp);

// 虚拟连续内存分配
void *vmalloc(unsigned long size);
void vfree(const void *addr);

// 页级分配
unsigned long __get_free_pages(gfp_t gfp_mask, unsigned int order);
void free_pages(unsigned long addr, unsigned int order);

// DMA 一致性内存
void *dma_alloc_coherent(struct device *dev, size_t size, 
                         dma_addr_t *dma_handle, gfp_t gfp);
void dma_free_coherent(struct device *dev, size_t size, 
                       void *vaddr, dma_addr_t dma_handle);
```

上述代码展示了 Linux 内核的主要内存分配函数。

**内核内存分配函数对比：**

| 函数 | 物理内存 | 虚拟内存 | 适用场景 | 限制 |
|------|----------|----------|----------|------|
| `kmalloc` | 连续 | 连续 | 小块内存、DMA | 最大 4MB |
| `kzalloc` | 连续 | 连续 | 需要初始化的内存 | 最大 4MB |
| `vmalloc` | 不连续 | 连续 | 大块内存 | 不能用于 DMA |
| `__get_free_pages` | 连续 | 连续 | 大块连续内存 | 2^n 页 |
| `dma_alloc_coherent` | 连续 | 连续 | DMA 传输 | 需要设备支持 |

### kmalloc 详解

kmalloc 是内核中最常用的内存分配函数，它分配的内存**物理连续**：

```c
// GFP 标志说明
#define GFP_KERNEL      // 内核内存，可能睡眠
#define GFP_ATOMIC      // 原子分配，不会睡眠
#define GFP_DMA         // 适合 DMA 的内存（低地址）
#define GFP_HIGHUSER    // 用户空间内存
#define GFP_NOWAIT      // 不睡眠，但可能失败

// 使用示例
void *buf = kmalloc(1024, GFP_KERNEL);
if (!buf) {
    return -ENOMEM;
}

// 使用内存...

kfree(buf);
```

上述代码展示了 kmalloc 的使用方式。

**GFP 标志详解：**

| 标志 | 说明 | 使用场景 |
|------|------|----------|
| `GFP_KERNEL` | 正常内核内存分配，可能睡眠 | 进程上下文 |
| `GFP_ATOMIC` | 原子分配，不会睡眠 | 中断上下文、自旋锁内 |
| `GFP_DMA` | DMA 可用内存（低 16MB） | ISA 设备 DMA |
| `GFP_DMA32` | DMA 可用内存（低 4GB） | 32 位 DMA 设备 |
| `GFP_HIGHUSER` | 高端用户内存 | 用户空间映射 |

**kmalloc 的实现：**

kmalloc 基于 Slab 分配器实现：

```
kmalloc(256, GFP_KERNEL)
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│                    Slab 分配器                               │
│  ┌─────────────┬─────────────┬─────────────┬─────────────┐ │
│  │ kmalloc-64  │ kmalloc-128 │ kmalloc-256 │ kmalloc-512 │ │
│  │  (64字节)   │  (128字节)  │  (256字节)  │  (512字节)  │ │
│  └─────────────┴─────────────┴─────────────┴─────────────┘ │
│                         │                                   │
│                         ▼                                   │
│              从 kmalloc-256 缓存分配                         │
└─────────────────────────────────────────────────────────────┘
```

上述图示展示了 kmalloc 基于 Slab 分配器的实现。

### vmalloc 详解

vmalloc 分配的内存**虚拟连续但物理不连续**：

```c
#include <linux/vmalloc.h>

void *buf = vmalloc(1024 * 1024);  // 分配 1MB
if (!buf) {
    return -ENOMEM;
}

// 使用内存...

vfree(buf);
```

上述代码展示了 vmalloc 的使用方式。

**kmalloc vs vmalloc 内存布局：**

```
kmalloc 分配：
虚拟地址: 0xffff8880_00001000 ──┐
                               │ 直接映射（线性映射区）
物理地址: 0x00000000_0010000 ───┘

vmalloc 分配：
虚拟地址: 0xffffc900_00000000 ──┐
                               │ 页表映射（vmalloc 区）
物理地址: ┌─────────────────────┤
          │ 0x1000 (页1)        │
          │ 0x5000 (页2)        │← 物理页不连续
          │ 0x9000 (页3)        │
          └─────────────────────┘
```

上述图示展示了 kmalloc 和 vmalloc 的内存布局差异。

**选择原则：**

| 场景 | 推荐函数 | 原因 |
|------|----------|------|
| 小块内存 (< 4KB) | kmalloc | 效率高 |
| DMA 缓冲区 | kmalloc 或 dma_alloc_coherent | 需要物理连续 |
| 大块内存 (> 128KB) | vmalloc | 避免内存碎片 |
| 驱动缓冲区 | vmalloc | 灵活 |

### Slab 分配器

Slab 分配器是内核用于高效管理小对象的机制：

```c
// 创建 slab 缓存
struct kmem_cache *my_cache = kmem_cache_create(
    "my_objects",           // 缓存名称
    sizeof(struct my_obj),  // 对象大小
    0,                      // 对齐方式
    SLAB_HWCACHE_ALIGN,     // 标志：硬件缓存对齐
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

**Slab 分配器结构：**

```
┌─────────────────────────────────────────────────────────────┐
│                    Slab 缓存 (kmem_cache)                    │
│  ┌─────────────────────────────────────────────────────────┐│
│  │                    Slab 列表                             ││
│  │  ┌─────────────────────────────────────────────────────┐││
│  │  │ 空闲 Slab (full)    │ 部分空闲 Slab (partial)       │││
│  │  │ ┌───┬───┬───┬───┐   │ ┌───┬───┬───┬───┐            │││
│  │  │ │   │   │   │   │   │ │   │ X │   │ X │            │││
│  │  │ └───┴───┴───┴───┘   │ └───┴───┴───┴───┘            │││
│  │  └─────────────────────────────────────────────────────┘││
│  │  ┌─────────────────────────────────────────────────────┐││
│  │  │ 已满 Slab (full)                                    │││
│  │  │ ┌───┬───┬───┬───┐                                  │││
│  │  │ │ X │ X │ X │ X │                                  │││
│  │  │ └───┴───┴───┴───┘                                  │││
│  │  └─────────────────────────────────────────────────────┘││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘

每个 Slab 包含多个对象：
┌─────────────────────────────────────────────────────────────┐
│ Slab 结构                                                    │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ Slab 头部 (管理信息)                                     ││
│  ├─────────────────────────────────────────────────────────┤│
│  │ 对象1 │ 对象2 │ 对象3 │ 对象4 │ ... │ 对象N            ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

上述图示展示了 Slab 分配器的结构。

**Slab 分配器的优势：**

| 优势 | 说明 |
|------|------|
| 减少碎片 | 相同大小的对象从同一缓存分配 |
| 提高速度 | 预分配对象，分配释放只需链表操作 |
| 缓存友好 | 对象在缓存中对齐 |
| 调试支持 | 可以检测越界、使用后释放等问题 |

**内核常用 Slab 缓存：**

```bash
$ cat /proc/slabinfo
slabinfo - version: 2.1
# name            <active_objs> <num_objs> <objsize> <objperslab> <pagesperslab>
kmalloc-8           1024        1024        8         512         1
kmalloc-16          512         512         16        256         1
kmalloc-32          256         256         32        128         1
kmalloc-64          128         128         64        64          1
kmalloc-128         64          64          128       32          1
kmalloc-256         32          32          256       16          1
task_struct         50          50          3584      9           8
inode_cache         100         100         608       26          4
dentry              200         200         192       21          1
```

上述命令展示了系统中活跃的 Slab 缓存。

### 内存池（mempool）

内核内存池用于保证在内存紧张时仍能分配成功：

```c
#include <linux/mempool.h>

// 创建内存池
mempool_t *pool = mempool_create(
    5,                          // 最小预分配数量
    mempool_alloc_slab,         // 分配函数
    mempool_free_slab,          // 释放函数
    my_cache                    // 数据源（slab 缓存）
);

// 从内存池分配
void *obj = mempool_alloc(pool, GFP_KERNEL);

// 释放到内存池
mempool_free(obj, pool);

// 销毁内存池
mempool_destroy(pool);
```

上述代码展示了内核内存池的使用方式。

**内存池工作原理：**

```
内存池状态：
┌─────────────────────────────────────────────────────────────┐
│  预分配对象池 (min_nr = 5)                                   │
│  ┌───┬───┬───┬───┬───┐                                      │
│  │ 1 │ 2 │ 3 │ 4 │ 5 │  ← 预分配的对象                       │
│  └───┴───┴───┴───┴───┘                                      │
│                                                              │
│  分配请求时：                                                 │
│  1. 先从预分配池取                                           │
│  2. 如果预分配池空，尝试从 slab 分配                          │
│  3. 如果系统内存不足，等待释放                                │
└─────────────────────────────────────────────────────────────┘
```

## DMA 内存管理

### DMA 内存分配

DMA（Direct Memory Access）允许外设直接访问内存：

```c
#include <linux/dma-mapping.h>

// 一致性 DMA 映射（适合长时间使用）
void *virt_addr;
dma_addr_t dma_addr;

virt_addr = dma_alloc_coherent(dev, size, &dma_addr, GFP_KERNEL);
// virt_addr: CPU 访问的虚拟地址
// dma_addr:  DMA 控制器使用的物理地址（总线地址）

// 使用...
cpu_write_data(virt_addr);
dma_start_transfer(dma_addr, size);
dma_wait_complete();

// 释放
dma_free_coherent(dev, size, virt_addr, dma_addr);
```

上述代码展示了 DMA 内存的分配方式。

### 流式 DMA 映射

```c
// 流式 DMA 映射（适合一次性传输）
void *buf = kmalloc(size, GFP_KERNEL);
dma_addr_t dma_addr;

// 映射为 DMA 可用
dma_addr = dma_map_single(dev, buf, size, DMA_TO_DEVICE);
if (dma_mapping_error(dev, dma_addr)) {
    kfree(buf);
    return -EIO;
}

// CPU 写入数据后，同步到内存
dma_sync_single_for_device(dev, dma_addr, size, DMA_TO_DEVICE);

// 启动 DMA 传输
dma_start(dma_addr, size);

// DMA 完成后，CPU 读取前同步
dma_sync_single_for_cpu(dev, dma_addr, size, DMA_FROM_DEVICE);

// 取消映射
dma_unmap_single(dev, dma_addr, size, DMA_TO_DEVICE);
kfree(buf);
```

上述代码展示了流式 DMA 映射的使用方式。

**一致性映射 vs 流式映射：**

| 特性 | 一致性映射 | 流式映射 |
|------|------------|----------|
| 缓存一致性 | 自动维护 | 手动同步 |
| 性能 | 较低 | 较高 |
| 适用场景 | 控制结构、频繁访问 | 大数据传输 |
| 内存限制 | 较严格 | 较宽松 |

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

## 嵌入式系统内存管理

### RTOS 内存池

在 RTOS 中，通常使用内存池来管理内存：

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

### 内存池与链表结合

```c
typedef struct Node {
    int data;
    struct Node *next;
} Node;

#define NODE_POOL_SIZE  100

static Node node_pool[NODE_POOL_SIZE];
static uint8_t node_used[NODE_POOL_SIZE] = {0};

Node* node_alloc(void) {
    for (int i = 0; i < NODE_POOL_SIZE; i++) {
        if (!node_used[i]) {
            node_used[i] = 1;
            return &node_pool[i];
        }
    }
    return NULL;
}

void node_free(Node *node) {
    int index = node - node_pool;
    if (index >= 0 && index < NODE_POOL_SIZE) {
        node_used[index] = 0;
        node->next = NULL;
    }
}

// 使用示例
Node *head = NULL;
Node *node = node_alloc();
if (node) {
    node->data = 100;
    node->next = head;
    head = node;
}
```

上述代码展示了内存池与链表结合的实现。

## 内存屏障

### 为什么需要内存屏障

在现代处理器中，指令执行可能被重排序：

```c
// 期望的执行顺序
data = 123;          // 步骤 1
ready = 1;           // 步骤 2

// 实际可能的重排序
ready = 1;           // 步骤 2 先执行！
data = 123;          // 步骤 1 后执行
```

上述代码展示了指令重排序问题。

### Linux 内核内存屏障

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

## 内存调试

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
#ifdef DEBUG_MEMORY
#define MALLOC(size) debug_malloc(size, __FILE__, __LINE__)
#define FREE(ptr)    debug_free(ptr, __FILE__, __LINE__)

typedef struct {
    void *ptr;
    size_t size;
    const char *file;
    int line;
} MemRecord;

static MemRecord mem_records[100];
static int mem_count = 0;

void* debug_malloc(size_t size, const char *file, int line) {
    void *ptr = malloc(size);
    if (ptr && mem_count < 100) {
        mem_records[mem_count].ptr = ptr;
        mem_records[mem_count].size = size;
        mem_records[mem_count].file = file;
        mem_records[mem_count].line = line;
        mem_count++;
    }
    printf("[ALLOC] %p (%zu bytes) at %s:%d\n", ptr, size, file, line);
    return ptr;
}

void debug_free(void *ptr, const char *file, int line) {
    printf("[FREE] %p at %s:%d\n", ptr, file, line);
    free(ptr);
}

void check_leaks(void) {
    printf("\n=== Memory Leak Report ===\n");
    for (int i = 0; i < mem_count; i++) {
        if (mem_records[i].ptr) {
            printf("LEAK: %p (%zu bytes) at %s:%d\n",
                   mem_records[i].ptr,
                   mem_records[i].size,
                   mem_records[i].file,
                   mem_records[i].line);
        }
    }
}
#else
#define MALLOC(size) malloc(size)
#define FREE(ptr)    free(ptr)
#endif
```

上述代码展示了嵌入式系统的内存调试技巧。

## 总结

### 内存分配函数选择

| 层次 | 函数 | 物理内存 | 适用场景 |
|------|------|----------|----------|
| 用户态 | malloc | 不连续 | 通用 |
| 用户态 | mmap | 可配置 | 文件映射、共享内存 |
| 内核态 | kmalloc | 连续 | 小块内存、DMA |
| 内核态 | vmalloc | 不连续 | 大块内存 |
| 内核态 | kmem_cache | 连续 | 固定大小对象 |
| 内核态 | dma_alloc_coherent | 连续 | DMA 缓冲区 |
| RTOS | 内存池 | 连续 | 嵌入式系统 |

### 最佳实践

1. **用户态**：配对使用 malloc/free，释放后置空指针
2. **内核态**：根据场景选择 kmalloc/vmalloc，注意 GFP 标志
3. **DMA**：正确处理缓存一致性，使用内存屏障
4. **RTOS**：使用内存池避免碎片，确保分配成功
5. **调试**：使用 Valgrind、ASan 等工具检测问题

## 参考资料

[1] C99 Standard. ISO/IEC 9899:1999

[2] Linux Kernel Documentation. https://www.kernel.org/doc/

[3] Understanding the Linux Virtual Memory Manager. Mel Gorman

[4] FreeRTOS Memory Management. https://www.freertos.org/a00111.html

## 相关主题

- [堆栈内存](/notes/c/stack) - 从用户态到内核态的深度解析
- [static 关键字](/notes/c/static) - 变量的存储类
- [环形缓冲区](/notes/embedded/ring-buffer) - 内存管理实践
