---
title: 数组与字符串 - C 语言数据组织基础
date: 2026-03-27
tags: [C语言, 数组, 字符串, 内存布局]
description: 深入理解 C 语言数组与字符串，掌握内存布局、指针运算、字符串处理等核心概念
---

# 数组与字符串

## 什么是数组？

数组是 **相同类型元素的连续内存集合**。它是 C 语言中最基础的数据结构，用于存储一组相关的数据。

### 数组的内存布局

```
┌─────────────────────────────────────────────────────────────┐
│                    数组内存布局                              │
│                                                             │
│  int arr[5] = {10, 20, 30, 40, 50};                        │
│                                                             │
│  内存地址:    0x1000  0x1004  0x1008  0x100C  0x1010       │
│             ┌──────┬──────┬──────┬──────┬──────┐           │
│  索引:      │  0   │  1   │  2   │  3   │  4   │           │
│             ├──────┼──────┼──────┼──────┼──────┤           │
│  值:        │  10  │  20  │  30  │  40  │  50  │           │
│             └──────┴──────┴──────┴──────┴──────┘           │
│                 ▲                                           │
│                 │                                           │
│              arr 指向首元素地址                              │
│                                                             │
│  sizeof(arr) = 20 字节 (5 × 4 字节)                         │
│  sizeof(arr[0]) = 4 字节                                    │
│  元素个数 = sizeof(arr) / sizeof(arr[0]) = 5                │
└─────────────────────────────────────────────────────────────┘
```

上述图示展示了数组在内存中的连续存储方式。

### 数组声明与初始化

```c
int arr1[5];                    
int arr2[5] = {1, 2, 3, 4, 5};  
int arr3[5] = {1, 2};           
int arr4[] = {1, 2, 3};         
int arr5[5] = {0};              
```

上述代码展示了数组的多种声明和初始化方式：

| 声明方式 | 说明 |
|----------|------|
| `arr1` | 未初始化，元素值不确定（静态存储会初始化为 0） |
| `arr2` | 完全初始化，所有元素都有指定值 |
| `arr3` | 部分初始化，未指定的元素自动初始化为 0 |
| `arr4` | 自动推断大小，数组长度为 3 |
| `arr5` | 全部初始化为 0 |

## 数组与指针的关系

### 数组名是指针常量

```c
int arr[5] = {1, 2, 3, 4, 5};
int *p = arr;          

printf("%p\n", arr);   
printf("%p\n", &arr[0]); 
printf("%p\n", p);     
```

上述代码演示了数组名与指针的关系：

**关键点：**

| 表达式 | 类型 | 说明 |
|--------|------|------|
| `arr` | `int *` | 数组首元素地址，不可修改 |
| `&arr[0]` | `int *` | 首元素地址，与 arr 相同 |
| `&arr` | `int (*)[5]` | 整个数组的地址 |
| `p` | `int *` | 指向首元素的指针，可修改 |

### 指针运算

```c
int arr[5] = {10, 20, 30, 40, 50};
int *p = arr;

printf("%d\n", *p);       
printf("%d\n", *(p + 1)); 
printf("%d\n", p[2]);     
printf("%d\n", *(arr + 3)); 
```

上述代码展示了指针运算的多种等价写法：

**指针运算规则：**

```
指针 + n 的实际偏移量 = n × sizeof(指针指向的类型)

对于 int *p：
p + 1 实际偏移 4 字节
p + 2 实际偏移 8 字节

等价关系：
arr[i]  ≡  *(arr + i)  ≡  *(i + arr)  ≡  i[arr]
p[i]    ≡  *(p + i)
```

### 数组名与指针的区别

```c
int arr[5] = {1, 2, 3, 4, 5};
int *p = arr;

printf("sizeof(arr) = %zu\n", sizeof(arr));   
printf("sizeof(p) = %zu\n", sizeof(p));       

arr = p;  
p = arr;  
```

上述代码揭示了数组名与指针的本质区别：

| 特性 | 数组名 | 指针变量 |
|------|--------|----------|
| 本质 | 地址常量 | 变量 |
| `sizeof` | 整个数组大小 | 指针本身大小 |
| 可修改 | 否 | 是 |
| 作为参数 | 退化为指针 | 保持为指针 |

## 数组越界问题

### 越界访问的危害

```c
int arr[5] = {1, 2, 3, 4, 5};

arr[5] = 100;   
arr[-1] = 200;  
```

上述代码展示了危险的越界访问：

```
┌─────────────────────────────────────────────────────────────┐
│                    数组越界访问                              │
│                                                             │
│  内存布局:                                                  │
│                                                             │
│  ┌──────┬──────┬──────┬──────┬──────┬──────┬──────┐        │
│  │ 其他  │ arr[0]│ arr[1]│ arr[2]│ arr[3]│ arr[4]│ 其他  │        │
│  │ 数据  │   1   │   2   │   3   │   4   │   5   │ 数据  │        │
│  └──────┴──────┴──────┴──────┴──────┴──────┴──────┘        │
│     ▲                                            ▲          │
│     │                                            │          │
│  arr[-1]                                      arr[5]        │
│  (访问其他内存)                              (访问其他内存)  │
│                                                             │
│  后果:                                                      │
│  1. 数据损坏: 修改了其他变量的值                             │
│  2. 程序崩溃: 访问了受保护的内存区域                         │
│  3. 安全漏洞: 缓冲区溢出攻击的根源                           │
└─────────────────────────────────────────────────────────────┘
```

### 安全的数组访问

```c
#define ARRAY_SIZE(arr)  (sizeof(arr) / sizeof((arr)[0]))

int safe_get(int *arr, size_t size, size_t index)
{
    if (index >= size) {
        return -1;  
    }
    return arr[index];
}

void safe_set(int *arr, size_t size, size_t index, int value)
{
    if (index < size) {
        arr[index] = value;
    }
}
```

上述代码实现了安全的数组访问函数：

**参数说明：**
- `arr`：数组指针
- `size`：数组大小
- `index`：访问索引
- `value`：要设置的值

**返回值：**
- `safe_get`：成功返回元素值，失败返回 -1
- `safe_set`：无返回值，通过边界检查保证安全

## 多维数组

### 二维数组的内存布局

```c
int matrix[3][4] = {
    {1, 2, 3, 4},
    {5, 6, 7, 8},
    {9, 10, 11, 12}
};
```

上述代码定义了一个 3 行 4 列的二维数组：

```
┌─────────────────────────────────────────────────────────────┐
│                  二维数组内存布局                            │
│                                                             │
│  逻辑视图:                                                  │
│  ┌────┬────┬────┬────┐                                     │
│  │ 1  │ 2  │ 3  │ 4  │  ← matrix[0]                        │
│  ├────┼────┼────┼────┤                                     │
│  │ 5  │ 6  │ 7  │ 8  │  ← matrix[1]                        │
│  ├────┼────┼────┼────┤                                     │
│  │ 9  │ 10 │ 11 │ 12 │  ← matrix[2]                        │
│  └────┴────┴────┴────┘                                     │
│                                                             │
│  物理内存 (行优先存储):                                      │
│  ┌───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┐        │
│  │ 1 │ 2 │ 3 │ 4 │ 5 │ 6 │ 7 │ 8 │ 9 │10 │11 │12 │        │
│  └───┴───┴───┴───┴───┴───┴───┴───┴───┴───┴───┴───┘        │
│  └─────matrix[0]─────┘└─────matrix[1]─────┘└─────matrix[2]─┘│
│                                                             │
│  地址计算:                                                  │
│  matrix[i][j] 的地址 = base + (i * cols + j) * sizeof(int) │
└─────────────────────────────────────────────────────────────┘
```

### 二维数组与指针

```c
int matrix[3][4];

int (*p1)[4] = matrix;    
int *p2 = &matrix[0][0];  

printf("%d\n", matrix[1][2]);       
printf("%d\n", *(*(matrix + 1) + 2)); 
printf("%d\n", p1[1][2]);           
printf("%d\n", *(p2 + 1 * 4 + 2));  
```

上述代码展示了二维数组的多种访问方式：

**指针类型说明：**

| 声明 | 类型 | 说明 |
|------|------|------|
| `matrix` | `int (*)[4]` | 指向包含 4 个 int 元素的数组的指针 |
| `matrix[i]` | `int *` | 第 i 行的首元素地址 |
| `matrix[i][j]` | `int` | 第 i 行第 j 列的元素 |
| `p1` | `int (*)[4]` | 行指针，与 matrix 类型相同 |
| `p2` | `int *` | 元素指针，需要手动计算偏移 |

## 字符串基础

### 字符串的本质

```c
char str1[] = "Hello";     
char *str2 = "World";      
char str3[10] = "Hi";      
```

上述代码展示了字符串的不同定义方式：

```
┌─────────────────────────────────────────────────────────────┐
│                    字符串内存布局                            │
│                                                             │
│  char str1[] = "Hello";                                    │
│  ┌───┬───┬───┬───┬───┬───┐                                 │
│  │ H │ e │ l │ l │ o │\0 │                                 │
│  └───┴───┴───┴───┴───┴───┘                                 │
│  可修改，存储在栈上或全局区                                  │
│                                                             │
│  char *str2 = "World";                                     │
│  str2 ──► ┌───┬───┬───┬───┬───┬───┐                        │
│           │ W │ o │ r │ l │ d │\0 │                        │
│           └───┴───┴───┴───┴───┴───┘                        │
│           不可修改，存储在只读数据段                          │
│                                                             │
│  char str3[10] = "Hi";                                     │
│  ┌───┬───┬───┬───┬───┬───┬───┬───┬───┬───┐                │
│  │ H │ i │\0 │\0 │\0 │\0 │\0 │\0 │\0 │\0 │                │
│  └───┴───┴───┴───┴───┴───┴───┴───┴───┴───┘                │
│  未使用的空间自动填充 '\0'                                   │
└─────────────────────────────────────────────────────────────┘
```

### 字符串与字符数组的区别

```c
char arr[] = {'H', 'e', 'l', 'l', 'o'};  
char str[] = "Hello";                     

printf("arr 长度: %zu\n", sizeof(arr));   
printf("str 长度: %zu\n", sizeof(str));   
printf("arr 字符串长度: %zu\n", strlen(arr));  
printf("str 字符串长度: %zu\n", strlen(str));  
```

上述代码揭示了字符数组与字符串的关键区别：

| 特性 | 字符数组 | 字符串 |
|------|----------|--------|
| 结尾 | 无特定结尾 | 以 `'\0'` 结尾 |
| `sizeof` | 元素个数 | 元素个数 + 1（包含 `'\0'`） |
| `strlen` | 不确定 | `'\0'` 前的字符数 |
| 初始化 | 需要逐个字符 | 可以用字符串字面量 |

## 字符串操作函数

### 字符串长度

```c
#include <string.h>

size_t my_strlen(const char *s)
{
    const char *p = s;
    while (*p) {
        p++;
    }
    return p - s;
}
```

上述代码实现了自定义的字符串长度计算函数：

**参数说明：**
- `s`：字符串指针，指向以 `'\0'` 结尾的字符串

**返回值：**
- 返回字符串长度，不包括 `'\0'`

**实现原理：**
1. 保存起始地址到 `p`
2. 遍历字符串直到遇到 `'\0'`
3. 通过指针差值计算长度

### 字符串复制

```c
char *my_strcpy(char *dest, const char *src)
{
    char *ret = dest;
    while ((*dest++ = *src++) != '\0') {
        ;
    }
    return ret;
}

char *my_strncpy(char *dest, const char *src, size_t n)
{
    size_t i;
    for (i = 0; i < n && src[i] != '\0'; i++) {
        dest[i] = src[i];
    }
    for (; i < n; i++) {
        dest[i] = '\0';
    }
    return dest;
}
```

上述代码实现了字符串复制函数：

**参数说明：**
- `dest`：目标缓冲区，必须有足够空间
- `src`：源字符串
- `n`：最多复制的字符数

**返回值：**
- 返回目标字符串指针

**注意事项：**
- `strcpy` 不检查目标缓冲区大小，可能导致溢出
- `strncpy` 如果源字符串长度超过 n，不会自动添加 `'\0'`

### 字符串连接

```c
char *my_strcat(char *dest, const char *src)
{
    char *ret = dest;
    while (*dest) {
        dest++;
    }
    while ((*dest++ = *src++) != '\0') {
        ;
    }
    return ret;
}
```

上述代码实现了字符串连接函数：

**参数说明：**
- `dest`：目标字符串，必须有足够空间容纳连接后的结果
- `src`：要追加的源字符串

**返回值：**
- 返回目标字符串指针

**实现原理：**
1. 先找到 dest 的末尾（`'\0'` 位置）
2. 从该位置开始复制 src 的内容

### 字符串比较

```c
int my_strcmp(const char *s1, const char *s2)
{
    while (*s1 && (*s1 == *s2)) {
        s1++;
        s2++;
    }
    return *(unsigned char *)s1 - *(unsigned char *)s2;
}
```

上述代码实现了字符串比较函数：

**参数说明：**
- `s1`、`s2`：要比较的两个字符串

**返回值：**
- `< 0`：s1 小于 s2
- `= 0`：s1 等于 s2
- `> 0`：s1 大于 s2

**比较规则：**
- 按字典序逐字符比较
- 比较的是字符的 ASCII 码值

### 安全的字符串函数

```c
#include <string.h>

size_t strlcpy(char *dest, const char *src, size_t size)
{
    size_t src_len = strlen(src);
    if (size > 0) {
        size_t copy_len = (src_len < size - 1) ? src_len : size - 1;
        memcpy(dest, src, copy_len);
        dest[copy_len] = '\0';
    }
    return src_len;
}

size_t strlcat(char *dest, const char *src, size_t size)
{
    size_t dest_len = strlen(dest);
    size_t src_len = strlen(src);
    
    if (dest_len >= size) {
        return size + src_len;
    }
    
    size_t copy_len = (src_len < size - dest_len - 1) ? 
                       src_len : size - dest_len - 1;
    memcpy(dest + dest_len, src, copy_len);
    dest[dest_len + copy_len] = '\0';
    
    return dest_len + src_len;
}
```

上述代码实现了安全的字符串操作函数：

**参数说明：**
- `dest`：目标缓冲区
- `src`：源字符串
- `size`：目标缓冲区总大小

**返回值：**
- 返回源字符串长度或尝试创建的字符串长度

**安全特性：**
- 保证结果字符串以 `'\0'` 结尾
- 不会写入超过缓冲区大小的数据
- 返回值可用于检测截断

## 字符串查找函数

### 查找字符

```c
char *my_strchr(const char *s, int c)
{
    while (*s && *s != (char)c) {
        s++;
    }
    if (*s == (char)c) {
        return (char *)s;
    }
    return NULL;
}

char *my_strrchr(const char *s, int c)
{
    const char *last = NULL;
    while (*s) {
        if (*s == (char)c) {
            last = s;
        }
        s++;
    }
    if ((char)c == '\0') {
        return (char *)s;
    }
    return (char *)last;
}
```

上述代码实现了字符查找函数：

**参数说明：**
- `s`：要搜索的字符串
- `c`：要查找的字符

**返回值：**
- 找到：返回指向该字符的指针
- 未找到：返回 `NULL`

**函数区别：**
- `strchr`：从前往后查找，返回第一次出现的位置
- `strrchr`：从后往前查找，返回最后一次出现的位置

### 查找子串

```c
char *my_strstr(const char *haystack, const char *needle)
{
    if (*needle == '\0') {
        return (char *)haystack;
    }
    
    while (*haystack) {
        const char *h = haystack;
        const char *n = needle;
        
        while (*h && *n && *h == *n) {
            h++;
            n++;
        }
        
        if (*n == '\0') {
            return (char *)haystack;
        }
        
        haystack++;
    }
    
    return NULL;
}
```

上述代码实现了子串查找函数：

**参数说明：**
- `haystack`：被搜索的字符串
- `needle`：要查找的子串

**返回值：**
- 找到：返回子串首次出现的位置
- 未找到：返回 `NULL`

**实现原理：**
- 使用双重循环逐个位置尝试匹配
- 外层循环遍历 haystack 的每个起始位置
- 内层循环比较字符是否匹配

## 字符串与数字转换

### 字符串转数字

```c
int my_atoi(const char *s)
{
    int result = 0;
    int sign = 1;
    
    while (*s == ' ' || *s == '\t') {
        s++;
    }
    
    if (*s == '-') {
        sign = -1;
        s++;
    } else if (*s == '+') {
        s++;
    }
    
    while (*s >= '0' && *s <= '9') {
        result = result * 10 + (*s - '0');
        s++;
    }
    
    return sign * result;
}
```

上述代码实现了字符串转整数的函数：

**参数说明：**
- `s`：要转换的字符串

**返回值：**
- 返回转换后的整数值

**转换过程：**
1. 跳过前导空白字符
2. 处理正负号
3. 逐字符转换为数字

### 数字转字符串

```c
void my_itoa(int value, char *str, int base)
{
    char *p = str;
    int is_negative = 0;
    unsigned int uvalue;
    
    if (value < 0 && base == 10) {
        is_negative = 1;
        uvalue = -value;
    } else {
        uvalue = (unsigned int)value;
    }
    
    do {
        int digit = uvalue % base;
        *p++ = (digit < 10) ? ('0' + digit) : ('a' + digit - 10);
        uvalue /= base;
    } while (uvalue > 0);
    
    if (is_negative) {
        *p++ = '-';
    }
    
    *p = '\0';
    
    char *start = str;
    char *end = p - 1;
    while (start < end) {
        char tmp = *start;
        *start++ = *end;
        *end-- = tmp;
    }
}
```

上述代码实现了整数转字符串的函数：

**参数说明：**
- `value`：要转换的整数
- `str`：存储结果的缓冲区
- `base`：进制（2-36）

**转换过程：**
1. 处理负数
2. 逐位取余得到数字字符
3. 反转字符串得到正确顺序

## 字符串数组

### 字符串数组的定义

```c
char *str_array[] = {
    "Hello",
    "World",
    "C Programming"
};

char str_matrix[][20] = {
    "Hello",
    "World",
    "C Programming"
};
```

上述代码展示了两种字符串数组的定义方式：

**内存布局对比：**

```
┌─────────────────────────────────────────────────────────────┐
│              指针数组方式 (char *str_array[])                │
│                                                             │
│  str_array ──► ┌──────┐     ┌───┬───┬───┬───┬───┬───┐      │
│                │  *   │────►│ H │ e │ l │ l │ o │\0 │      │
│                ├──────┤     └───┴───┴───┴───┴───┴───┘      │
│                │  *   │────►│ W │ o │ r │ l │ d │\0 │      │
│                ├──────┤     └───┴───┴───┴───┴───┴───┘      │
│                │  *   │────►│ C │...│ g │\0 │              │
│                └──────┘     └───┴───┴───┴───┘              │
│                                                             │
│  优点: 节省空间，字符串长度灵活                               │
│  缺点: 字符串不可修改                                        │
├─────────────────────────────────────────────────────────────┤
│              二维数组方式 (char str_matrix[][20])            │
│                                                             │
│  str_matrix ──► ┌───┬───┬───┬───┬───┬───┬───┬...┐          │
│                 │ H │ e │ l │ l │ o │\0 │   │   │          │
│                 ├───┼───┼───┼───┼───┼───┼───┼───┤          │
│                 │ W │ o │ r │ l │ d │\0 │   │   │          │
│                 ├───┼───┼───┼───┼───┼───┼───┼───┤          │
│                 │ C │...│ g │\0 │   │   │   │   │          │
│                 └───┴───┴───┴───┴───┴───┴───┴───┘          │
│                                                             │
│  优点: 字符串可修改                                          │
│  缺点: 浪费空间，每行固定长度                                 │
└─────────────────────────────────────────────────────────────┘
```

### 命令行参数

```c
int main(int argc, char *argv[])
{
    printf("参数个数: %d\n", argc);
    for (int i = 0; i < argc; i++) {
        printf("argv[%d] = %s\n", i, argv[i]);
    }
    return 0;
}
```

上述代码展示了命令行参数的处理：

**参数说明：**
- `argc`：参数个数（包括程序名）
- `argv`：参数字符串数组

**内存布局：**

```
执行命令: ./program hello world

argv ──► ┌──────┐
         │  *   │────► "./program\0"
         ├──────┤
         │  *   │────► "hello\0"
         ├──────┤
         │  *   │────► "world\0"
         ├──────┤
         │ NULL │
         └──────┘

argc = 3
```

## 常见问题与陷阱

### 字符串修改陷阱

```c
char *str = "Hello";
str[0] = 'h';  

char str[] = "Hello";
str[0] = 'h';    
```

上述代码展示了字符串修改的陷阱：

| 方式 | 存储位置 | 是否可修改 |
|------|----------|------------|
| `char *str = "..."` | 只读数据段 | 否 |
| `char str[] = "..."` | 栈/全局区 | 是 |

### 缓冲区溢出

```c
char buf[10];
strcpy(buf, "This is a very long string");  
strncpy(buf, "This is a very long string", sizeof(buf) - 1);
buf[sizeof(buf) - 1] = '\0';
```

上述代码展示了缓冲区溢出问题及解决方案：

**安全原则：**
1. 始终使用带长度限制的函数
2. 确保缓冲区以 `'\0'` 结尾
3. 使用 `sizeof` 获取缓冲区大小

### 未初始化的字符串

```c
char str[100];
printf("%s\n", str);  

char str[100] = {0};  
```

上述代码展示了字符串初始化的重要性：

**问题：**
- 未初始化的字符数组内容不确定
- 可能没有 `'\0'` 终止符
- `strlen`、`printf` 等函数会越界访问

## 总结

| 概念 | 要点 |
|------|------|
| 数组 | 连续内存，数组名是指针常量 |
| 指针运算 | `p + n` 偏移 `n × sizeof(type)` 字节 |
| 越界访问 | 危险操作，可能导致崩溃或安全漏洞 |
| 字符串 | 以 `'\0'` 结尾的字符数组 |
| 字符串函数 | 注意缓冲区大小，防止溢出 |
| 安全编程 | 使用带长度限制的函数 |

## 参考资料

[1] C Programming Language. Brian W. Kernighan, Dennis M. Ritchie

[2] C Primer Plus. Stephen Prata

[3] The C Standard Library. P.J. Plauger

## 相关主题

- [指针详解](/notes/c/pointer) - C 语言的核心灵魂
- [内存管理](/notes/c/memory-management) - 动态内存分配
- [结构体与联合体](/notes/c/struct-union) - 复合数据类型
