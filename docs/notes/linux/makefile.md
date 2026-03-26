---
title: Makefile 语法 - 构建系统基础
date: 2026-03-27
tags: [Linux, Makefile, 构建系统, 编译]
description: 深入理解 Makefile 语法，掌握目标、依赖、变量、函数等核心概念，高效管理项目构建
---

# Makefile 语法

## 什么是 Makefile？

Makefile 是一个**描述项目构建规则的文件**，`make` 工具根据 Makefile 中的规则自动编译和链接程序。它的核心优势是：

- **增量编译**：只编译修改过的文件
- **依赖管理**：自动处理文件依赖关系
- **自动化构建**：一条命令完成整个项目构建

### 基本结构

```makefile
# Makefile 基本结构
目标: 依赖
	命令

# 示例
hello: hello.c
	gcc hello.c -o hello
```

上述代码展示了 Makefile 的基本结构。

**Makefile 执行流程：**

```
┌─────────────────────────────────────────────────────────────┐
│                    make 执行流程                             │
│                                                             │
│  1. 读取 Makefile                                           │
│      │                                                      │
│      ▼                                                      │
│  2. 查找第一个目标（默认目标）                               │
│      │                                                      │
│      ▼                                                      │
│  3. 检查依赖文件                                            │
│      │                                                      │
│      ├─► 依赖不存在 → 查找依赖的目标规则                    │
│      │                                                      │
│      ├─► 依赖比目标新 → 执行命令                            │
│      │                                                      │
│      └─► 目标比依赖新 → 跳过命令                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

上述图示展示了 make 的执行流程。

## 基本语法

### 目标与依赖

```makefile
# 简单示例
# 目标: hello
# 依赖: hello.c
# 命令: gcc hello.c -o hello

hello: hello.c
	gcc hello.c -o hello

# 多文件编译
app: main.o utils.o
	gcc main.o utils.o -o app

main.o: main.c
	gcc -c main.c -o main.o

utils.o: utils.c
	gcc -c utils.c -o utils.o

# 清理目标
clean:
	rm -f *.o app
```

上述代码展示了目标与依赖的基本用法。

**语法要点：**

| 要点 | 说明 |
|------|------|
| 目标 | 要生成的文件或动作 |
| 依赖 | 目标需要的输入文件 |
| 命令 | 必须以 Tab 开头，不能是空格 |
| 注释 | 以 `#` 开头 |

### 伪目标

```makefile
# .PHONY 声明伪目标
# 伪目标不是文件，而是动作

.PHONY: clean all install

clean:
	rm -f *.o app

all: app test

install: app
	cp app /usr/local/bin/

# 不使用 .PHONY 的问题：
# 如果存在名为 clean 的文件，make clean 将不会执行
```

上述代码展示了伪目标的定义方式。

**常用伪目标：**

| 目标 | 说明 |
|------|------|
| `all` | 构建所有目标 |
| `clean` | 清理构建产物 |
| `install` | 安装程序 |
| `uninstall` | 卸载程序 |
| `test` | 运行测试 |
| `dist` | 打包发布 |

## 变量

### 变量定义与使用

```makefile
# 变量定义
CC = gcc
CFLAGS = -Wall -g -O2
LDFLAGS = -lpthread
TARGET = app
SRCS = main.c utils.c parser.c
OBJS = main.o utils.o parser.o

# 变量使用 $(变量名)
$(TARGET): $(OBJS)
	$(CC) $(OBJS) -o $(TARGET) $(LDFLAGS)

%.o: %.c
	$(CC) $(CFLAGS) -c $< -o $@

clean:
	rm -f $(OBJS) $(TARGET)
```

上述代码展示了变量的定义和使用。

**变量类型：**

| 类型 | 定义方式 | 说明 |
|------|----------|------|
| 递归展开 | `VAR = value` | 使用时展开，可引用后续定义的变量 |
| 简单展开 | `VAR := value` | 定义时展开，性能更好 |
| 条件赋值 | `VAR ?= value` | 变量未定义时才赋值 |
| 追加赋值 | `VAR += value` | 追加到变量末尾 |

```makefile
# 变量类型示例

# 递归展开（可能导致无限循环）
A = $(B)
B = $(A)  # 危险！

# 简单展开（推荐）
A := $(B)
B := hello

# 条件赋值
PREFIX ?= /usr/local

# 追加赋值
CFLAGS := -Wall
CFLAGS += -g
# 结果: CFLAGS = -Wall -g
```

上述代码展示了不同类型的变量定义方式。

### 自动变量

```makefile
# 自动变量：在命令中自动设置

app: main.o utils.o
# $@ = app (目标)
# $^ = main.o utils.o (所有依赖)
# $< = main.o (第一个依赖)
# $? = 比目标新的依赖

%.o: %.c
# $@ = 目标文件名 (如 main.o)
# $< = 第一个依赖 (如 main.c)
# $* = 不含扩展名的目标 (如 main)

# 示例
app: main.o utils.o
	$(CC) $^ -o $@    # gcc main.o utils.o -o app

%.o: %.c
	$(CC) $(CFLAGS) -c $< -o $@
```

上述代码展示了自动变量的使用。

**自动变量列表：**

| 变量 | 说明 |
|------|------|
| `$@` | 目标文件名 |
| `$<` | 第一个依赖文件名 |
| `$^` | 所有依赖文件名（去重） |
| `$+` | 所有依赖文件名（不去重） |
| `$?` | 比目标新的依赖文件名 |
| `$*` | 不含扩展名的目标名 |
| `$%` | 目标成员名（库文件） |

### 预定义变量

```makefile
# Make 预定义变量

# 编译器
CC      # C 编译器，默认 cc
CXX     # C++ 编译器，默认 g++
AR      # 静态库工具，默认 ar

# 编译选项
CFLAGS  # C 编译选项
CXXFLAGS # C++ 编译选项
LDFLAGS # 链接选项
LDLIBS  # 链接库

# 示例：覆盖预定义变量
CC = arm-linux-gcc
CFLAGS = -Wall -O2 -march=armv7
```

上述代码展示了预定义变量的使用。

## 模式规则

### 通配符规则

```makefile
# % 通配符
# %.o 匹配任意 .o 文件
# %.c 匹配对应的 .c 文件

# 通用编译规则
%.o: %.c
	$(CC) $(CFLAGS) -c $< -o $@

# 多目录编译
build/%.o: src/%.c
	$(CC) $(CFLAGS) -c $< -o $@

# 示例：编译所有 .c 文件
SRCS = $(wildcard src/*.c)
OBJS = $(patsubst src/%.c, build/%.o, $(SRCS))

app: $(OBJS)
	$(CC) $^ -o $@

build/%.o: src/%.c
	@mkdir -p build
	$(CC) $(CFLAGS) -c $< -o $@
```

上述代码展示了模式规则的使用。

### 静态模式

```makefile
# 静态模式：限定规则适用范围
# $(targets): %.o: %.c

OBJS = main.o utils.o parser.o

$(OBJS): %.o: %.c
	$(CC) $(CFLAGS) -c $< -o $@

# 等价于：
# main.o: main.c
#     $(CC) $(CFLAGS) -c main.c -o main.o
# utils.o: utils.c
#     $(CC) $(CFLAGS) -c utils.c -o utils.o
# parser.o: parser.c
#     $(CC) $(CFLAGS) -c parser.c -o parser.o
```

上述代码展示了静态模式的使用。

## 函数

### 字符串函数

```makefile
# 字符串替换
$(subst from,to,text)
# 示例
SRC = hello world
DST = $(subst world,make,$(SRC))
# DST = hello make

# 模式替换
$(patsubst pattern,replacement,text)
# 示例
SRCS = main.c utils.c parser.c
OBJS = $(patsubst %.c,%.o,$(SRCS))
# OBJS = main.o utils.o parser.o

# 去空格
$(strip string)

# 查找字符串
$(findstring find,text)
# 返回 find 或空

# 过滤
$(filter pattern,text)
# 示例
FILES = main.c utils.h parser.c test.h
SRCS = $(filter %.c,$(FILES))
# SRCS = main.c parser.c

# 反过滤
$(filter-out pattern,text)
```

上述代码展示了字符串函数的使用。

### 文件名函数

```makefile
# 获取目录
$(dir path)
# $(dir src/main.c) → src/

# 获取文件名
$(notdir path)
# $(notdir src/main.c) → main.c

# 获取后缀
$(suffix names)
# $(suffix main.c utils.h) → .c .h

# 获取basename
$(basename names)
# $(basename main.c utils.h) → main utils

# 添加后缀
$(addsuffix suffix,names)
# $(addsuffix .c,main utils) → main.c utils.c

# 添加前缀
$(addprefix prefix,names)
# $(addprefix src/,main.c utils.c) → src/main.c src/utils.c

# 通配符
$(wildcard pattern)
# $(wildcard *.c) → 返回所有 .c 文件
```

上述代码展示了文件名函数的使用。

### 条件函数

```makefile
# if 函数
$(if condition,then-part,else-part)

DEBUG ?= 0
CFLAGS = $(if $(filter 1,$(DEBUG)),-g -O0,-O2)

# or 函数
$(or condition1,condition2,...)

# and 函数
$(and condition1,condition2,...)

# 示例
ARCH ?= x86
CFLAGS += $(if $(or $(filter x86,$(ARCH)),$(filter amd64,$(ARCH))),-m64,-m32)
```

上述代码展示了条件函数的使用。

### shell 函数

```makefile
# 执行 shell 命令
$(shell command)

# 示例
DATE = $(shell date +%Y%m%d)
UNAME = $(shell uname -m)

# 获取当前目录
PWD = $(shell pwd)

# 获取文件数量
COUNT = $(shell ls *.c | wc -l)

# 使用示例
release:
	tar -czvf app-$(DATE).tar.gz app
```

上述代码展示了 shell 函数的使用。

## 条件判断

```makefile
# ifeq / ifneq
ifeq ($(CC),gcc)
    CFLAGS += -std=c11
else ifeq ($(CC),clang)
    CFLAGS += -std=c11
else
    CFLAGS += -std=c99
endif

# ifdef / ifndef
ifdef DEBUG
    CFLAGS += -g -DDEBUG
endif

ifndef PREFIX
    PREFIX := /usr/local
endif

# 完整示例
ARCH ?= x86

ifeq ($(ARCH),x86)
    CC = gcc
    CFLAGS = -m32
else ifeq ($(ARCH),x64)
    CC = gcc
    CFLAGS = -m64
else ifeq ($(ARCH),arm)
    CC = arm-linux-gcc
    CFLAGS = -march=armv7
endif
```

上述代码展示了条件判断的使用。

## 完整项目示例

### 单目录项目

```makefile
# Makefile for simple project

# 编译器设置
CC := gcc
CFLAGS := -Wall -Wextra -g -O2
LDFLAGS := -lpthread

# 文件
TARGET := app
SRCS := $(wildcard *.c)
OBJS := $(SRCS:.c=.o)

# 默认目标
all: $(TARGET)

# 链接
$(TARGET): $(OBJS)
	$(CC) $^ -o $@ $(LDFLAGS)

# 编译
%.o: %.c
	$(CC) $(CFLAGS) -c $< -o $@

# 清理
.PHONY: clean
clean:
	rm -f $(OBJS) $(TARGET)

# 安装
.PHONY: install
install: $(TARGET)
	install -m 755 $(TARGET) /usr/local/bin/

# 依赖关系（自动生成）
-include $(SRCS:.c=.d)

%.d: %.c
	$(CC) -MM $< > $@
```

上述代码展示了一个完整的单目录项目 Makefile。

### 多目录项目

```makefile
# Makefile for multi-directory project

# 目录结构
SRC_DIR := src
BUILD_DIR := build
BIN_DIR := bin

# 编译器设置
CC := gcc
CFLAGS := -Wall -Wextra -g -O2 -I$(SRC_DIR)
LDFLAGS := -lpthread

# 源文件
SRCS := $(wildcard $(SRC_DIR)/*.c)
OBJS := $(patsubst $(SRC_DIR)/%.c,$(BUILD_DIR)/%.o,$(SRCS))
TARGET := $(BIN_DIR)/app

# 默认目标
all: dirs $(TARGET)

# 创建目录
dirs:
	@mkdir -p $(BUILD_DIR) $(BIN_DIR)

# 链接
$(TARGET): $(OBJS)
	$(CC) $^ -o $@ $(LDFLAGS)

# 编译
$(BUILD_DIR)/%.o: $(SRC_DIR)/%.c
	$(CC) $(CFLAGS) -c $< -o $@

# 清理
.PHONY: clean
clean:
	rm -rf $(BUILD_DIR) $(BIN_DIR)

# 重新构建
.PHONY: rebuild
rebuild: clean all
```

上述代码展示了一个多目录项目的 Makefile。

**目录结构：**

```
project/
├── Makefile
├── src/
│   ├── main.c
│   ├── utils.c
│   └── parser.c
├── build/
│   ├── main.o
│   ├── utils.o
│   └── parser.o
└── bin/
    └── app
```

### 库文件编译

```makefile
# 编译静态库

LIB_NAME := libmylib
SRCS := $(wildcard src/*.c)
OBJS := $(patsubst src/%.c,build/%.o,$(SRCS))

# 静态库
$(LIB_NAME).a: $(OBJS)
	ar rcs $@ $^

# 动态库
$(LIB_NAME).so: $(OBJS)
	$(CC) -shared -o $@ $^

build/%.o: src/%.c
	@mkdir -p build
	$(CC) $(CFLAGS) -fPIC -c $< -o $@

.PHONY: all static shared clean
all: static

static: $(LIB_NAME).a
shared: $(LIB_NAME).so

clean:
	rm -rf build $(LIB_NAME).a $(LIB_NAME).so
```

上述代码展示了静态库和动态库的编译方式。

## 调试技巧

### 显示命令

```makefile
# @ 前缀：不显示命令本身
# 默认：显示命令

# 显示命令
echo "Hello"
# 输出：
# echo "Hello"
# Hello

# 不显示命令
@echo "Hello"
# 输出：
# Hello

# 示例
.PHONY: info
info:
	@echo "CC = $(CC)"
	@echo "CFLAGS = $(CFLAGS)"
	@echo "SRCS = $(SRCS)"
	@echo "OBJS = $(OBJS)"
```

上述代码展示了命令显示控制。

### 忽略错误

```makefile
# - 前缀：忽略命令错误

clean:
	-rm -f *.o
	-rm -f app

# 即使 rm 失败（文件不存在），也继续执行
```

上述代码展示了忽略错误的方式。

### 调试选项

```bash
# 显示执行的命令（不实际执行）
make -n

# 显示变量值
make print-VARNAME
print-%:
	@echo $* = $($*)

# 调试模式
make -d

# 显示数据库
make -p

# 不重建目标
make -o target

# 强制重建
make -B
```

上述命令展示了 make 的调试选项。

## 常见问题

### Tab vs 空格

```makefile
# 错误：使用空格
target:
    command  # 错误！make 会报错

# 正确：使用 Tab
target:
	command  # 正确！
```

### 依赖缺失

```makefile
# 问题：头文件依赖缺失
main.o: main.c
	$(CC) $(CFLAGS) -c $< -o $@
# 如果 main.c 包含 utils.h，修改 utils.h 不会触发重新编译

# 解决方案：自动生成依赖
SRCS := $(wildcard *.c)
DEPS := $(SRCS:.c=.d)

%.d: %.c
	$(CC) -MM $< > $@

-include $(DEPS)
```

### 变量展开时机

```makefile
# 问题：递归展开变量的延迟求值
A = $(B)
B = $(C)
C = hello

# 使用时才展开
test:
	@echo $(A)  # hello

# 解决方案：使用简单展开变量
A := $(B)
B := $(C)
C := hello
# 此时 A 为空，因为 B 在 A 定义时还未定义
```

## 总结

| 概念 | 说明 |
|------|------|
| 目标 | 要生成的文件或动作 |
| 依赖 | 目标需要的输入文件 |
| 变量 | `=` 递归展开，`:=` 简单展开 |
| 自动变量 | `$@`, `$<`, `$^` 等 |
| 模式规则 | `%` 通配符 |
| 函数 | `$(function arguments)` |
| 条件判断 | `ifeq`, `ifdef` 等 |

## 参考资料

[1] GNU Make Manual. https://www.gnu.org/software/make/manual/

[2] Managing Projects with GNU Make. Robert Mecklenburg

[3] The Linux Programming Interface. Michael Kerrisk

## 相关主题

- [Shell 脚本语法](/notes/linux/shell) - Linux 命令行编程
- [内核模块开发](/notes/linux/kernel-module) - Linux 内核编程
- [预处理器](/notes/c/preprocessor) - C 语言宏与条件编译
