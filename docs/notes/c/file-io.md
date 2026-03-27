---
title: 文件操作 - C 语言持久化存储
date: 2026-03-27
tags: [C语言, 文件操作, I/O, 持久化]
description: 深入理解 C 语言文件操作，掌握文件读写、二进制文件、文件定位等核心技术
---

# 文件操作

## 什么是文件操作？

文件操作是程序与外部存储设备交互的方式，用于 **持久化存储数据**。C 语言提供了标准 I/O 库，通过文件指针和缓冲机制实现高效的文件读写。

### 文件的基本概念

```
┌─────────────────────────────────────────────────────────────┐
│                    文件操作流程                              │
│                                                             │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐  │
│  │ 打开文件 │───►│ 读写文件 │───►│ 关闭文件 │───►│   结束  │  │
│  │ fopen   │    │ fread   │    │ fclose  │    │         │  │
│  │         │    │ fwrite  │    │         │    │         │  │
│  │         │    │ fprintf │    │         │    │         │  │
│  └─────────┘    └─────────┘    └─────────┘    └─────────┘  │
│                                                             │
│  文件指针 (FILE*):                                          │
│  - 指向文件控制块的指针                                      │
│  - 包含文件状态、缓冲区、当前位置等信息                       │
│  - 由 fopen 返回，fclose 后失效                              │
└─────────────────────────────────────────────────────────────┘
```

### 文本文件 vs 二进制文件

| 特性 | 文本文件 | 二进制文件 |
|------|----------|------------|
| 存储方式 | ASCII 字符 | 原始字节 |
| 可读性 | 人可读 | 需要程序解析 |
| 换行处理 | 自动转换 | 不转换 |
| 跨平台 | 可能有问题 | 一致性好 |
| 空间效率 | 较低 | 较高 |

## 文件的打开与关闭

### fopen 函数

```c
FILE *fopen(const char *filename, const char *mode);
```

上述函数用于打开文件：

**参数说明：**
- `filename`：文件路径，可以是相对路径或绝对路径
- `mode`：打开模式字符串

**返回值：**
- 成功：返回文件指针
- 失败：返回 `NULL`

### 打开模式

```c
FILE *fp1 = fopen("data.txt", "r");    
FILE *fp2 = fopen("data.txt", "w");    
FILE *fp3 = fopen("data.txt", "a");    
FILE *fp4 = fopen("data.txt", "r+");   
FILE *fp5 = fopen("data.txt", "w+");   
FILE *fp6 = fopen("data.txt", "a+");   

FILE *fp7 = fopen("data.bin", "rb");   
FILE *fp8 = fopen("data.bin", "wb");   
```

上述代码展示了各种打开模式：

**模式说明：**

| 模式 | 说明 | 文件存在 | 文件不存在 |
|------|------|----------|------------|
| `r` | 只读 | 打开 | 失败 |
| `w` | 只写 | 清空 | 创建 |
| `a` | 追加 | 打开 | 创建 |
| `r+` | 读写 | 打开 | 失败 |
| `w+` | 读写 | 清空 | 创建 |
| `a+` | 读写追加 | 打开 | 创建 |
| `b` | 二进制模式 | - | - |

### fclose 函数

```c
int fclose(FILE *stream);
```

上述函数用于关闭文件：

**参数说明：**
- `stream`：要关闭的文件指针

**返回值：**
- 成功：返回 0
- 失败：返回 `EOF`

### 完整的打开关闭示例

```c
#include <stdio.h>
#include <stdlib.h>

int main(void)
{
    FILE *fp = fopen("data.txt", "w");
    if (fp == NULL) {
        perror("打开文件失败");
        return EXIT_FAILURE;
    }
    
    fprintf(fp, "Hello, World!\n");
    
    if (fclose(fp) != 0) {
        perror("关闭文件失败");
        return EXIT_FAILURE;
    }
    
    printf("文件操作成功\n");
    return EXIT_SUCCESS;
}
```

上述代码展示了完整的文件操作流程：

**关键点：**
1. 检查 `fopen` 返回值是否为 `NULL`
2. 使用 `perror` 输出错误信息
3. 确保文件被正确关闭
4. 使用 `EXIT_SUCCESS` 和 `EXIT_FAILURE` 作为返回值

## 字符级 I/O

### fgetc 和 fputc

```c
int fgetc(FILE *stream);
int fputc(int c, FILE *stream);
```

上述函数用于单字符读写：

**参数说明：**
- `stream`：文件指针
- `c`：要写入的字符

**返回值：**
- `fgetc`：成功返回读取的字符，失败返回 `EOF`
- `fputc`：成功返回写入的字符，失败返回 `EOF`

### 复制文件示例

```c
int copy_file(const char *src, const char *dst)
{
    FILE *fp_src = fopen(src, "rb");
    if (fp_src == NULL) {
        perror("打开源文件失败");
        return -1;
    }
    
    FILE *fp_dst = fopen(dst, "wb");
    if (fp_dst == NULL) {
        perror("打开目标文件失败");
        fclose(fp_src);
        return -1;
    }
    
    int ch;
    while ((ch = fgetc(fp_src)) != EOF) {
        if (fputc(ch, fp_dst) == EOF) {
            perror("写入文件失败");
            break;
        }
    }
    
    fclose(fp_src);
    fclose(fp_dst);
    
    return 0;
}
```

上述代码实现了文件复制功能：

**实现原理：**
1. 以二进制模式打开源文件和目标文件
2. 逐字符读取源文件
3. 将每个字符写入目标文件
4. 遇到 `EOF` 结束循环

### getchar 和 putchar

```c
int getchar(void);  
int putchar(int c); 
```

上述函数是 `fgetc(stdin)` 和 `fputc(c, stdout)` 的简化版本。

## 行级 I/O

### fgets 和 fputs

```c
char *fgets(char *s, int n, FILE *stream);
int fputs(const char *s, FILE *stream);
```

上述函数用于字符串读写：

**参数说明：**
- `s`：缓冲区地址
- `n`：缓冲区大小
- `stream`：文件指针

**返回值：**
- `fgets`：成功返回 `s`，失败返回 `NULL`
- `fputs`：成功返回非负值，失败返回 `EOF`

### fgets 的行为

```c
char buffer[100];
if (fgets(buffer, sizeof(buffer), stdin) != NULL) {
    printf("读取到: %s", buffer);
}
```

上述代码展示了 `fgets` 的使用：

**fgets 的特点：**
- 最多读取 `n-1` 个字符
- 遇到换行符会停止并包含换行符
- 自动添加 `'\0'` 终止符
- 安全，不会溢出缓冲区

```
┌─────────────────────────────────────────────────────────────┐
│                    fgets 读取行为                            │
│                                                             │
│  文件内容: "Hello World\n"                                  │
│  缓冲区大小: 100                                             │
│                                                             │
│  读取结果: "Hello World\n\0"                                │
│           └──────────────┘ 包含换行符                        │
│                                                             │
│  文件内容: "VeryLongString..." (超过缓冲区)                  │
│  缓冲区大小: 10                                              │
│                                                             │
│  读取结果: "VeryLong\0" (只读取 9 个字符)                    │
│           下次 fgets 继续读取剩余部分                        │
└─────────────────────────────────────────────────────────────┘
```

### 读取文件所有行

```c
void print_file_lines(const char *filename)
{
    FILE *fp = fopen(filename, "r");
    if (fp == NULL) {
        perror("打开文件失败");
        return;
    }
    
    char line[256];
    int line_num = 0;
    
    while (fgets(line, sizeof(line), fp) != NULL) {
        printf("%4d: %s", ++line_num, line);
    }
    
    fclose(fp);
}
```

上述代码实现了逐行读取文件：

**参数说明：**
- `filename`：要读取的文件名

**实现原理：**
- 使用 `fgets` 循环读取每一行
- `fgets` 返回 `NULL` 表示文件结束或出错

## 格式化 I/O

### fprintf 和 fscanf

```c
int fprintf(FILE *stream, const char *format, ...);
int fscanf(FILE *stream, const char *format, ...);
```

上述函数用于格式化读写：

**参数说明：**
- `stream`：文件指针
- `format`：格式字符串
- `...`：可变参数

**返回值：**
- `fprintf`：返回写入的字符数
- `fscanf`：返回成功匹配的项目数

### 写入结构化数据

```c
typedef struct {
    char name[32];
    int age;
    float score;
} Student;

void save_students(const char *filename, Student *students, int count)
{
    FILE *fp = fopen(filename, "w");
    if (fp == NULL) {
        perror("打开文件失败");
        return;
    }
    
    for (int i = 0; i < count; i++) {
        fprintf(fp, "%s %d %.2f\n", 
                students[i].name, 
                students[i].age, 
                students[i].score);
    }
    
    fclose(fp);
}
```

上述代码实现了写入结构化数据：

**文件格式：**
```
Alice 20 85.50
Bob 21 92.30
Charlie 19 78.90
```

### 读取结构化数据

```c
int load_students(const char *filename, Student *students, int max_count)
{
    FILE *fp = fopen(filename, "r");
    if (fp == NULL) {
        perror("打开文件失败");
        return 0;
    }
    
    int count = 0;
    while (count < max_count && 
           fscanf(fp, "%31s %d %f", 
                  students[count].name, 
                  &students[count].age, 
                  &students[count].score) == 3) {
        count++;
    }
    
    fclose(fp);
    return count;
}
```

上述代码实现了读取结构化数据：

**注意事项：**
- 使用 `%31s` 限制字符串长度，防止溢出
- 检查 `fscanf` 返回值是否等于预期项目数
- 使用 `&` 获取变量的地址

## 二进制 I/O

### fread 和 fwrite

```c
size_t fread(void *ptr, size_t size, size_t nmemb, FILE *stream);
size_t fwrite(const void *ptr, size_t size, size_t nmemb, FILE *stream);
```

上述函数用于二进制块读写：

**参数说明：**
- `ptr`：数据缓冲区指针
- `size`：每个元素的大小
- `nmemb`：元素个数
- `stream`：文件指针

**返回值：**
- 返回实际读写的元素个数

### 写入结构体数组

```c
int save_students_binary(const char *filename, Student *students, int count)
{
    FILE *fp = fopen(filename, "wb");
    if (fp == NULL) {
        perror("打开文件失败");
        return -1;
    }
    
    size_t written = fwrite(students, sizeof(Student), count, fp);
    fclose(fp);
    
    return (written == count) ? 0 : -1;
}
```

上述代码实现了二进制写入结构体数组：

**二进制写入特点：**
- 直接写入内存中的原始字节
- 不进行任何格式转换
- 效率高，适合大量数据

### 读取结构体数组

```c
int load_students_binary(const char *filename, Student *students, int max_count)
{
    FILE *fp = fopen(filename, "rb");
    if (fp == NULL) {
        perror("打开文件失败");
        return 0;
    }
    
    size_t count = fread(students, sizeof(Student), max_count, fp);
    fclose(fp);
    
    return (int)count;
}
```

上述代码实现了二进制读取结构体数组：

**二进制读写注意事项：**

```
┌─────────────────────────────────────────────────────────────┐
│                  二进制文件注意事项                          │
│                                                             │
│  1. 结构体对齐问题                                          │
│     - 不同编译器可能有不同的对齐方式                         │
│     - 使用 #pragma pack 或 __attribute__((packed))          │
│                                                             │
│  2. 字节序问题                                              │
│     - 大端序: 高位字节在前                                   │
│     - 小端序: 低位字节在前                                   │
│     - 跨平台需要统一字节序                                   │
│                                                             │
│  3. 指针成员                                                │
│     - 不能直接保存指针值                                     │
│     - 需要序列化指针指向的内容                               │
│                                                             │
│  4. 平台差异                                                │
│     - int、long 等类型大小可能不同                           │
│     - 使用固定大小类型 (int32_t, uint64_t)                   │
└─────────────────────────────────────────────────────────────┘
```

## 文件定位

### fseek 和 ftell

```c
int fseek(FILE *stream, long offset, int whence);
long ftell(FILE *stream);
```

上述函数用于文件定位：

**参数说明：**
- `stream`：文件指针
- `offset`：偏移量
- `whence`：起始位置

**whence 取值：**

| 常量 | 值 | 说明 |
|------|-----|------|
| `SEEK_SET` | 0 | 文件开头 |
| `SEEK_CUR` | 1 | 当前位置 |
| `SEEK_END` | 2 | 文件末尾 |

### 获取文件大小

```c
long get_file_size(const char *filename)
{
    FILE *fp = fopen(filename, "rb");
    if (fp == NULL) {
        return -1;
    }
    
    fseek(fp, 0, SEEK_END);
    long size = ftell(fp);
    fclose(fp);
    
    return size;
}
```

上述代码实现了获取文件大小：

**实现原理：**
1. 打开文件（二进制模式）
2. 定位到文件末尾
3. 获取当前位置（即文件大小）

### rewind 函数

```c
void rewind(FILE *stream);
```

上述函数将文件位置重置到开头，等价于 `fseek(stream, 0, SEEK_SET)`。

### 读取文件中间部分

```c
int read_at_offset(const char *filename, long offset, void *buffer, size_t size)
{
    FILE *fp = fopen(filename, "rb");
    if (fp == NULL) {
        return -1;
    }
    
    if (fseek(fp, offset, SEEK_SET) != 0) {
        fclose(fp);
        return -1;
    }
    
    size_t read = fread(buffer, 1, size, fp);
    fclose(fp);
    
    return (int)read;
}
```

上述代码实现了从指定位置读取数据：

**参数说明：**
- `filename`：文件名
- `offset`：起始偏移量
- `buffer`：数据缓冲区
- `size`：读取大小

**返回值：**
- 成功返回读取的字节数
- 失败返回 -1

## 错误处理

### ferror 和 feof

```c
int ferror(FILE *stream);
int feof(FILE *stream);
```

上述函数用于检测文件状态：

**返回值：**
- `ferror`：发生错误返回非零值
- `feof`：到达文件末尾返回非零值

### clearerr 函数

```c
void clearerr(FILE *stream);
```

上述函数清除文件错误标志和文件结束标志。

### 安全的读取循环

```c
void safe_read_file(const char *filename)
{
    FILE *fp = fopen(filename, "rb");
    if (fp == NULL) {
        perror("打开文件失败");
        return;
    }
    
    char buffer[1024];
    size_t bytes_read;
    
    while ((bytes_read = fread(buffer, 1, sizeof(buffer), fp)) > 0) {
        
        fwrite(buffer, 1, bytes_read, stdout);
    }
    
    if (ferror(fp)) {
        perror("读取文件出错");
    }
    
    if (feof(fp)) {
        printf("\n[文件读取完成]\n");
    }
    
    fclose(fp);
}
```

上述代码展示了安全的文件读取：

**关键点：**
- 使用 `fread` 返回值判断读取结果
- 使用 `ferror` 检测是否出错
- 使用 `feof` 确认是否到达文件末尾

## 标准流

### 预定义的文件指针

```c
FILE *stdin;   
FILE *stdout;  
FILE *stderr;  
```

上述是 C 语言预定义的标准流：

**标准流说明：**

| 流 | 说明 | 默认设备 |
|------|------|----------|
| `stdin` | 标准输入 | 键盘 |
| `stdout` | 标准输出 | 屏幕 |
| `stderr` | 标准错误 | 屏幕 |

### 使用标准流

```c
#include <stdio.h>

int main(void)
{
    fprintf(stdout, "这是标准输出\n");
    fprintf(stderr, "这是标准错误\n");
    
    char buffer[100];
    fprintf(stdout, "请输入: ");
    if (fgets(buffer, sizeof(buffer), stdin) != NULL) {
        fprintf(stdout, "你输入了: %s", buffer);
    }
    
    return 0;
}
```

上述代码展示了标准流的使用：

**stdout vs stderr：**
- `stdout` 是缓冲的，可能延迟输出
- `stderr` 是无缓冲的，立即输出
- 重定向时，`stdout` 和 `stderr` 可以分开处理

## 临时文件

### tmpfile 函数

```c
FILE *tmpfile(void);
```

上述函数创建临时文件：

**返回值：**
- 成功：返回文件指针
- 失败：返回 `NULL`

**特点：**
- 文件以 `"wb+"` 模式打开
- 文件关闭或程序结束时自动删除
- 文件名由系统自动生成

### tmpnam 函数

```c
char *tmpnam(char *s);
```

上述函数生成唯一的临时文件名：

**参数说明：**
- `s`：存储文件名的缓冲区（至少 `L_tmpnam` 字节）
- 传入 `NULL` 则使用内部静态缓冲区

**返回值：**
- 返回生成的文件名指针

### 使用临时文件

```c
void process_with_temp(void)
{
    FILE *tmp = tmpfile();
    if (tmp == NULL) {
        perror("创建临时文件失败");
        return;
    }
    
    fprintf(tmp, "临时数据: %d\n", 12345);
    
    rewind(tmp);
    
    char buffer[100];
    while (fgets(buffer, sizeof(buffer), tmp) != NULL) {
        printf("%s", buffer);
    }
    
    fclose(tmp);  
}
```

上述代码展示了临时文件的使用：

**使用场景：**
- 中间结果存储
- 大数据处理
- 临时缓存

## 文件缓冲

### setvbuf 函数

```c
int setvbuf(FILE *stream, char *buf, int mode, size_t size);
```

上述函数设置文件缓冲区：

**参数说明：**
- `stream`：文件指针
- `buf`：自定义缓冲区（`NULL` 表示自动分配）
- `mode`：缓冲模式
- `size`：缓冲区大小

**缓冲模式：**

| 模式 | 说明 |
|------|------|
| `_IOFBF` | 全缓冲 |
| `_IOLBF` | 行缓冲 |
| `_IONBF` | 无缓冲 |

### fflush 函数

```c
int fflush(FILE *stream);
```

上述函数刷新缓冲区：

**参数说明：**
- `stream`：文件指针，`NULL` 表示刷新所有输出流

**返回值：**
- 成功：返回 0
- 失败：返回 `EOF`

### 缓冲区设置示例

```c
void demo_buffering(void)
{
    FILE *fp = fopen("data.txt", "w");
    if (fp == NULL) {
        return;
    }
    
    char buffer[4096];
    setvbuf(fp, buffer, _IOFBF, sizeof(buffer));
    
    for (int i = 0; i < 10000; i++) {
        fprintf(fp, "Line %d\n", i);
    }
    
    fflush(fp);
    
    fclose(fp);
}
```

上述代码展示了缓冲区设置：

**缓冲区选择原则：**

| 场景 | 推荐模式 | 原因 |
|------|----------|------|
| 大量数据写入 | 全缓冲 | 减少 I/O 次数 |
| 交互式输出 | 行缓冲 | 及时显示 |
| 错误日志 | 无缓冲 | 确保记录 |

## 总结

| 函数 | 用途 | 返回值 |
|------|------|--------|
| `fopen` | 打开文件 | 文件指针或 `NULL` |
| `fclose` | 关闭文件 | 0 或 `EOF` |
| `fgetc/fputc` | 字符读写 | 字符或 `EOF` |
| `fgets/fputs` | 字符串读写 | 指针或 `NULL` |
| `fread/fwrite` | 二进制读写 | 元素个数 |
| `fprintf/fscanf` | 格式化读写 | 字符数或匹配数 |
| `fseek/ftell` | 文件定位 | 0 或位置 |
| `feof/ferror` | 状态检测 | 非零表示真 |

## 参考资料

[1] C Programming Language. Brian W. Kernighan, Dennis M. Ritchie

[2] C Primer Plus. Stephen Prata

[3] The C Standard Library. P.J. Plauger

## 相关主题

- [内存管理](/notes/c/memory-management) - 动态内存分配
- [结构体与联合体](/notes/c/struct-union) - 数据组织
- [数组与字符串](/notes/c/array-string) - 数据处理
