---
title: 位运算 - C 语言底层操作利器
date: 2026-03-27
tags: [C语言, 位运算, 底层编程, 嵌入式]
description: 深入理解 C 语言位运算，掌握位操作技巧、位域、位掩码等底层核心技术
---

# 位运算

## 什么是位运算？

位运算是对 **整数在二进制位级别上的操作**。在嵌入式开发、系统编程、算法优化等领域，位运算因其高效性而被广泛使用。

### 二进制基础

```
┌─────────────────────────────────────────────────────────────┐
│                    二进制表示                                │
│                                                             │
│  十进制 42 的二进制表示:                                     │
│                                                             │
│  42 = 32 + 8 + 2 = 0b00101010                               │
│                                                             │
│  位编号:   7  6  5  4  3  2  1  0                            │
│          ┌──┬──┬──┬──┬──┬──┬──┬──┐                          │
│          │ 0│ 0│ 1│ 0│ 1│ 0│ 1│ 0│                          │
│          └──┴──┴──┴──┴──┴──┴──┴──┘                          │
│            │     │     │     │                              │
│           32     8     2     权重                           │
│                                                             │
│  有符号整数 (补码表示):                                      │
│  正数: 直接存储二进制                                        │
│  负数: 按位取反 + 1                                         │
│                                                             │
│  -42 的补码:                                                │
│  42  = 00101010                                             │
│  取反 = 11010101                                            │
│  +1  = 11010110  ← -42 的补码                               │
└─────────────────────────────────────────────────────────────┘
```

### 位运算符一览

| 运算符 | 名称 | 说明 | 示例 |
|--------|------|------|------|
| `&` | 按位与 | 两位都为 1 才为 1 | `0b1010 & 0b1100 = 0b1000` |
| `\|` | 按位或 | 有一位为 1 就为 1 | `0b1010 \| 0b1100 = 0b1110` |
| `^` | 按位异或 | 两位不同为 1 | `0b1010 ^ 0b1100 = 0b0110` |
| `~` | 按位取反 | 0 变 1，1 变 0 | `~0b1010 = 0b0101` |
| `<<` | 左移 | 各位左移 n 位 | `0b0010 << 2 = 0b1000` |
| `>>` | 右移 | 各位右移 n 位 | `0b1000 >> 2 = 0b0010` |

## 按位与运算 (&)

### 运算规则

```c
0 & 0 = 0
0 & 1 = 0
1 & 0 = 0
1 & 1 = 1
```

上述规则可以总结为：**有 0 则 0，全 1 才 1**。

### 应用场景

#### 1. 清零特定位

```c
uint8_t value = 0b11011010;
uint8_t mask  = 0b11110000;
uint8_t result = value & mask;

printf("清零低4位: 0x%02X\n", result);
```

上述代码展示了如何清零特定位：

**运算过程：**

```
  11011010
& 11110000
──────────
  11010000  ← 低4位被清零
```

#### 2. 提取特定位

```c
uint8_t value = 0b11011010;
uint8_t low_nibble = value & 0x0F;
uint8_t high_nibble = (value >> 4) & 0x0F;

printf("低4位: 0x%X\n", low_nibble);
printf("高4位: 0x%X\n", high_nibble);
```

上述代码展示了如何提取特定位：

**参数说明：**
- `value`：原始数据
- `0x0F`：掩码，二进制为 `00001111`

**返回值：**
- `low_nibble`：低 4 位数据
- `high_nibble`：高 4 位数据

#### 3. 判断奇偶

```c
bool is_odd(int n)
{
    return n & 1;
}

bool is_even(int n)
{
    return !(n & 1);
}
```

上述代码展示了使用位运算判断奇偶：

**原理：**
- 奇数的最低位一定是 1
- 偶数的最低位一定是 0
- `n & 1` 提取最低位

## 按位或运算 (|)

### 运算规则

```c
0 | 0 = 0
0 | 1 = 1
1 | 0 = 1
1 | 1 = 1
```

上述规则可以总结为：**有 1 则 1，全 0 才 0**。

### 应用场景

#### 1. 设置特定位

```c
uint8_t value = 0b11010000;
uint8_t mask  = 0b00001111;
uint8_t result = value | mask;

printf("设置低4位: 0x%02X\n", result);
```

上述代码展示了如何设置特定位：

**运算过程：**

```
  11010000
| 00001111
──────────
  11011111  ← 低4位被设置为1
```

#### 2. 组合标志位

```c
#define FLAG_READ    0x01
#define FLAG_WRITE   0x02
#define FLAG_EXECUTE 0x04

uint8_t permissions = 0;

permissions |= FLAG_READ;
permissions |= FLAG_WRITE;
permissions |= FLAG_EXECUTE;

bool can_read = permissions & FLAG_READ;
bool can_write = permissions & FLAG_WRITE;
```

上述代码展示了标志位的组合使用：

**标志位设计原则：**
- 每个标志占用一个独立的位
- 使用 `|` 组合多个标志
- 使用 `&` 检查标志是否存在

## 按位异或运算 (^)

### 运算规则

```c
0 ^ 0 = 0
0 ^ 1 = 1
1 ^ 0 = 1
1 ^ 1 = 0
```

上述规则可以总结为：**相同为 0，不同为 1**。

### 异或的重要性质

```
┌─────────────────────────────────────────────────────────────┐
│                    异或运算性质                              │
│                                                             │
│  1. 交换律:  a ^ b = b ^ a                                  │
│                                                             │
│  2. 结合律:  (a ^ b) ^ c = a ^ (b ^ c)                      │
│                                                             │
│  3. 自反性:  a ^ a = 0                                      │
│                                                             │
│  4. 恒等性:  a ^ 0 = a                                      │
│                                                             │
│  5. 可逆性:  (a ^ b) ^ b = a                                │
│                                                             │
│  应用:                                                      │
│  - 交换两个变量                                             │
│  - 简单加密                                                 │
│  - 校验和计算                                               │
└─────────────────────────────────────────────────────────────┘
```

### 应用场景

#### 1. 交换两个变量

```c
void swap(int *a, int *b)
{
    *a ^= *b;
    *b ^= *a;
    *a ^= *b;
}

int main(void)
{
    int x = 10, y = 20;
    printf("交换前: x=%d, y=%d\n", x, y);
    swap(&x, &y);
    printf("交换后: x=%d, y=%d\n", x, y);
    return 0;
}
```

上述代码展示了不使用临时变量交换两个数：

**运算过程：**

```
初始: a = 10 (0b1010), b = 20 (0b10100)

步骤1: a = a ^ b = 10 ^ 20 = 0b11110 (30)
步骤2: b = b ^ a = 20 ^ 30 = 0b01010 (10)  ← b 变成了原来的 a
步骤3: a = a ^ b = 30 ^ 10 = 0b10100 (20)  ← a 变成了原来的 b

结果: a = 20, b = 10
```

#### 2. 翻转特定位

```c
uint8_t value = 0b11010010;
uint8_t mask  = 0b00001111;
uint8_t result = value ^ mask;

printf("翻转低4位: 0x%02X\n", result);
```

上述代码展示了如何翻转特定位：

**运算过程：**

```
  11010010
^ 00001111
──────────
  11011101  ← 低4位被翻转
```

#### 3. 简单加密

```c
void encrypt(char *data, size_t len, char key)
{
    for (size_t i = 0; i < len; i++) {
        data[i] ^= key;
    }
}

void decrypt(char *data, size_t len, char key)
{
    encrypt(data, len, key);
}
```

上述代码展示了简单的异或加密：

**原理：**
- 加密：`密文 = 明文 ^ 密钥`
- 解密：`明文 = 密文 ^ 密钥`
- 因为 `(明文 ^ 密钥) ^ 密钥 = 明文`

## 按位取反运算 (~)

### 运算规则

```c
~0 = 1
~1 = 0
```

### 应用场景

#### 1. 构造掩码

```c
uint8_t mask = ~0x0F;

printf("掩码: 0x%02X\n", mask);
```

上述代码展示了如何构造掩码：

**运算过程：**

```
  0x0F    = 00001111
  ~0x0F   = 11110000  ← 高4位为1，低4位为0
```

#### 2. 清除特定位

```c
uint8_t value = 0b11011111;
uint8_t bit_to_clear = 4;

value &= ~(1 << bit_to_clear);

printf("清除第4位: 0x%02X\n", value);
```

上述代码展示了如何清除特定位：

**运算过程：**

```
1 << 4      = 00010000
~(1 << 4)   = 11101111

  11011111
& 11101111
──────────
  11001111  ← 第4位被清除
```

## 移位运算

### 左移运算 (<<)

```c
uint8_t value = 0b00001010;
uint8_t result = value << 2;

printf("左移2位: 0x%02X\n", result);
```

上述代码展示了左移运算：

**运算过程：**

```
  00001010  << 2  =  00101000

  左移 n 位相当于乘以 2^n
  10 << 2 = 10 × 4 = 40
```

### 右移运算 (>>)

```c
uint8_t value = 0b00101000;
uint8_t result = value >> 2;

printf("右移2位: 0x%02X\n", result);
```

上述代码展示了右移运算：

**运算过程：**

```
  00101000  >> 2  =  00001010

  右移 n 位相当于除以 2^n
  40 >> 2 = 40 ÷ 4 = 10
```

### 算术右移 vs 逻辑右移

```c
int8_t value = -10;
int8_t arithmetic = value >> 1;
uint8_t logical = (uint8_t)value >> 1;

printf("算术右移: %d\n", arithmetic);
printf("逻辑右移: %u\n", logical);
```

上述代码展示了算术右移与逻辑右移的区别：

**两种右移方式：**

```
┌─────────────────────────────────────────────────────────────┐
│                    右移方式对比                              │
│                                                             │
│  原值: -10 (补码: 11110110)                                 │
│                                                             │
│  算术右移 (有符号数):                                        │
│  11110110 >> 1 = 11111011 (-5)                              │
│  高位补符号位 (1)                                           │
│                                                             │
│  逻辑右移 (无符号数):                                        │
│  11110110 >> 1 = 01111011 (123)                             │
│  高位补 0                                                   │
│                                                             │
│  总结:                                                      │
│  - 有符号数右移: 算术右移，保留符号                          │
│  - 无符号数右移: 逻辑右移，高位补 0                          │
└─────────────────────────────────────────────────────────────┘
```

## 位运算技巧

### 判断某位是否为 1

```c
bool is_bit_set(uint32_t value, uint8_t bit)
{
    return (value & (1U << bit)) != 0;
}
```

上述代码判断指定位置是否为 1：

**参数说明：**
- `value`：要检查的值
- `bit`：位索引（从 0 开始）

**返回值：**
- `true`：该位为 1
- `false`：该位为 0

### 设置某位为 1

```c
uint32_t set_bit(uint32_t value, uint8_t bit)
{
    return value | (1U << bit);
}
```

### 清除某位为 0

```c
uint32_t clear_bit(uint32_t value, uint8_t bit)
{
    return value & ~(1U << bit);
}
```

### 翻转某位

```c
uint32_t toggle_bit(uint32_t value, uint8_t bit)
{
    return value ^ (1U << bit);
}
```

### 统计 1 的个数

```c
int count_bits(uint32_t value)
{
    int count = 0;
    while (value) {
        count += value & 1;
        value >>= 1;
    }
    return count;
}

int count_bits_fast(uint32_t value)
{
    int count = 0;
    while (value) {
        value &= value - 1;
        count++;
    }
    return count;
}
```

上述代码展示了两种统计 1 的个数的方法：

**Brian Kernighan 算法原理：**

```
value & (value - 1) 的效果是清除最低位的 1

例如: value = 0b1011000

第一次: value = 1011000, value - 1 = 1010111
        value & (value - 1) = 1010000  (清除了第3位的1)
        count = 1

第二次: value = 1010000, value - 1 = 1001111
        value & (value - 1) = 1000000  (清除了第4位的1)
        count = 2

第三次: value = 1000000, value - 1 = 0111111
        value & (value - 1) = 0000000  (清除了第6位的1)
        count = 3

结果: 3 个 1
```

### 判断是否为 2 的幂

```c
bool is_power_of_two(uint32_t value)
{
    return value && !(value & (value - 1));
}
```

上述代码判断一个数是否为 2 的幂：

**原理：**
- 2 的幂的二进制表示只有一个 1
- `value & (value - 1)` 会清除这个唯一的 1
- 结果为 0 说明是 2 的幂

```
验证:
8  = 0b1000,  7  = 0b0111,  8 & 7  = 0  ✓
16 = 0b10000, 15 = 0b01111, 16 & 15 = 0  ✓
6  = 0b0110,  5  = 0b0101,  6 & 5  = 4  ✗
```

### 获取最低位的 1

```c
uint32_t get_lowest_bit(uint32_t value)
{
    return value & (-value);
}
```

上述代码获取最低位的 1：

**原理：**
- `-value` 是 `value` 的补码，即 `~value + 1`
- 这个操作会保留最低位的 1，其他位清零

```
例如: value = 0b1011000

~value     = 0b0100111
~value + 1 = 0b0101000  (-value)

value & (-value) = 0b1011000 & 0b0101000 = 0b0001000
结果: 最低位的 1 被保留
```

### 循环移位

```c
uint32_t rotate_left(uint32_t value, int shift)
{
    const int bits = sizeof(value) * 8;
    shift &= bits - 1;
    return (value << shift) | (value >> (bits - shift));
}

uint32_t rotate_right(uint32_t value, int shift)
{
    const int bits = sizeof(value) * 8;
    shift &= bits - 1;
    return (value >> shift) | (value << (bits - shift));
}
```

上述代码实现了循环移位：

**参数说明：**
- `value`：要移位的值
- `shift`：移位位数

**循环移位示意：**

```
循环左移 2 位:
  10110011 << 2 = 11001100
  10110011 >> 6 = 00000010
  结果 = 11001110

循环右移 2 位:
  10110011 >> 2 = 00101100
  10110011 << 6 = 11000000
  结果 = 11101100
```

## 位域 (Bit Fields)

### 位域定义

```c
typedef struct {
    uint32_t flag1 : 1;
    uint32_t flag2 : 1;
    uint32_t mode  : 3;
    uint32_t value : 8;
    uint32_t       : 3;
    uint32_t id    : 16;
} StatusRegister;
```

上述代码定义了一个位域结构体：

**位域成员说明：**

| 成员 | 位数 | 范围 | 说明 |
|------|------|------|------|
| `flag1` | 1 | 0-1 | 单个标志位 |
| `flag2` | 1 | 0-1 | 单个标志位 |
| `mode` | 3 | 0-7 | 3 位可表示 8 种模式 |
| `value` | 8 | 0-255 | 8 位数值 |
| (无名) | 3 | - | 填充位，不使用 |
| `id` | 16 | 0-65535 | 16 位标识符 |

### 位域的使用

```c
StatusRegister reg = {0};

reg.flag1 = 1;
reg.flag2 = 0;
reg.mode = 5;
reg.value = 128;
reg.id = 0x1234;

printf("Size: %zu bytes\n", sizeof(reg));
printf("flag1: %u\n", reg.flag1);
printf("mode: %u\n", reg.mode);
```

上述代码展示了位域的使用：

**位域的内存布局：**

```
┌─────────────────────────────────────────────────────────────┐
│                    位域内存布局                              │
│                                                             │
│  32 位字:                                                   │
│  ┌───┬───┬─────┬─────────┬───────┬─────────────────┐        │
│  │ f1│ f2│ mode│  value  │ 填充  │       id        │        │
│  │ 1 │ 0 │ 101 │10000000 │ 000   │ 0001001000110100│        │
│  └───┴───┴─────┴─────────┴───────┴─────────────────┘        │
│   1位 1位  3位     8位      3位         16位                │
│                                                             │
│  总计: 32 位 = 4 字节                                        │
└─────────────────────────────────────────────────────────────┘
```

### 位域的注意事项

```c
typedef struct {
    uint8_t  a : 3;
    uint16_t b : 5;
    uint32_t c : 10;
} BadAlignment;

typedef struct {
    uint32_t a : 3;
    uint32_t b : 5;
    uint32_t c : 10;
} GoodAlignment;
```

上述代码展示了位域的对齐问题：

**注意事项：**

| 问题 | 说明 |
|------|------|
| 跨边界 | 位域成员不能跨越存储单元边界 |
| 对齐 | 不同类型的位域可能导致对齐填充 |
| 可移植性 | 位域的内存布局依赖于编译器 |
| 取地址 | 不能对位域成员取地址 |

## 位掩码应用

### 硬件寄存器操作

```c
#define GPIO_BASE       0x40020000
#define GPIO_MODER      (*(volatile uint32_t *)(GPIO_BASE + 0x00))
#define GPIO_OTYPER     (*(volatile uint32_t *)(GPIO_BASE + 0x04))
#define GPIO_ODR        (*(volatile uint32_t *)(GPIO_BASE + 0x14))

#define GPIO_MODE_INPUT     0x00
#define GPIO_MODE_OUTPUT    0x01
#define GPIO_MODE_AF        0x02
#define GPIO_MODE_ANALOG    0x03

void gpio_set_mode(uint8_t pin, uint8_t mode)
{
    uint32_t shift = pin * 2;
    uint32_t mask = 0x03 << shift;

    GPIO_MODER = (GPIO_MODER & ~mask) | ((mode & 0x03) << shift);
}

void gpio_set(uint8_t pin)
{
    GPIO_ODR |= (1U << pin);
}

void gpio_clear(uint8_t pin)
{
    GPIO_ODR &= ~(1U << pin);
}

void gpio_toggle(uint8_t pin)
{
    GPIO_ODR ^= (1U << pin);
}
```

上述代码展示了位运算在硬件寄存器操作中的应用：

**参数说明：**
- `pin`：GPIO 引脚号
- `mode`：引脚模式

**操作原理：**
- `GPIO_MODER` 每个引脚占用 2 位
- 先清除目标位，再设置新值

### 颜色编码

```c
typedef uint32_t Color;

#define COLOR_R(c)   (((c) >> 16) & 0xFF)
#define COLOR_G(c)   (((c) >> 8) & 0xFF)
#define COLOR_B(c)   ((c) & 0xFF)

#define COLOR_RGB(r, g, b)  (((r) << 16) | ((g) << 8) | (b))

Color blend_colors(Color c1, Color c2, uint8_t alpha)
{
    uint8_t r = (COLOR_R(c1) * (255 - alpha) + COLOR_R(c2) * alpha) / 255;
    uint8_t g = (COLOR_G(c1) * (255 - alpha) + COLOR_G(c2) * alpha) / 255;
    uint8_t b = (COLOR_B(c1) * (255 - alpha) + COLOR_B(c2) * alpha) / 255;
    return COLOR_RGB(r, g, b);
}
```

上述代码展示了位运算在颜色编码中的应用：

**RGB 颜色布局：**

```
32 位颜色值:
┌────────┬────────┬────────┬────────┐
│  保留  │   R    │   G    │   B    │
│  8位   │  8位   │  8位   │  8位   │
└────────┴────────┴────────┴────────┘
  24-31    16-23    8-15     0-7
```

## 总结

| 运算 | 用途 | 示例 |
|------|------|------|
| `&` | 清零、提取、判断 | `x & 0x0F` 提取低 4 位 |
| `\|` | 设置、组合 | `x \| 0x01` 设置最低位 |
| `^` | 翻转、交换、加密 | `x ^ x = 0` |
| `~` | 构造掩码 | `~0x0F` 高 4 位为 1 |
| `<<` | 乘法、移位 | `x << n` 等于 `x × 2^n` |
| `>>` | 除法、移位 | `x >> n` 等于 `x ÷ 2^n` |

## 参考资料

[1] C Programming Language. Brian W. Kernighan, Dennis M. Ritchie

[2] Hacker's Delight. Henry S. Warren

[3] STM32 Reference Manual

## 相关主题

- [寄存器详解](/notes/embedded/register) - 寄存器底层操作
- [预处理器](/notes/c/preprocessor) - 宏定义与位操作
- [指针详解](/notes/c/pointer) - 位运算与指针
