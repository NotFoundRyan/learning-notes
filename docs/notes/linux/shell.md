---
title: Shell 脚本语法 - Linux 命令行编程
date: 2026-03-27
tags: [Linux, Shell, Bash, 脚本]
description: 深入理解 Shell 脚本编程，掌握变量、流程控制、函数、文本处理等核心技能
---

# Shell 脚本语法

## 什么是 Shell？

Shell 是**用户与 Linux 内核之间的桥梁**，它是一个命令行解释器，负责接收用户输入的命令并传递给内核执行。常见的 Shell 包括：

- **Bash**（Bourne Again Shell）：最常用，Linux 默认
- **Zsh**：功能强大，配置丰富
- **Dash**：轻量级，启动快

### 脚本基本结构

```bash
#!/bin/bash
# 这是一个简单的 Shell 脚本

# 输出欢迎信息
echo "Hello, World!"

# 定义变量
name="Shell"

# 使用变量
echo "Welcome to $name scripting!"
```

上述代码展示了 Shell 脚本的基本结构。

**脚本执行方式：**

```bash
# 方式一：添加执行权限
chmod +x script.sh
./script.sh

# 方式二：使用解释器
bash script.sh

# 方式三：source（在当前 shell 执行）
source script.sh
# 或
. script.sh
```

上述命令展示了脚本的三种执行方式。

**执行方式对比：**

| 方式 | 是否需要执行权限 | 是否创建子进程 | 用途 |
|------|------------------|----------------|------|
| `./script.sh` | 是 | 是 | 普通执行 |
| `bash script.sh` | 否 | 是 | 指定解释器 |
| `source script.sh` | 否 | 否 | 加载环境变量 |

## 变量

### 变量定义与使用

```bash
#!/bin/bash

# 变量定义（等号两边不能有空格）
name="张三"
age=25
score=95.5

# 使用变量（$变量名 或 ${变量名}）
echo "姓名: $name"
echo "年龄: ${age}岁"
echo "分数: $score"

# 只读变量
readonly PI=3.14159
# PI=3.14  # 错误：只读变量不能修改

# 删除变量
unset score
echo "分数: $score"  # 输出空
```

上述代码展示了变量的定义和使用。

**变量命名规则：**

| 规则 | 说明 |
|------|------|
| 首字符 | 字母或下划线 |
| 其他字符 | 字母、数字、下划线 |
| 大小写 | 区分大小写 |
| 不能使用 | Shell 关键字 |

### 特殊变量

```bash
#!/bin/bash

echo "脚本名: $0"           # 脚本名称
echo "第一个参数: $1"       # 第一个参数
echo "第二个参数: $2"       # 第二个参数
echo "参数个数: $#"         # 参数个数
echo "所有参数: $@"         # 所有参数（列表）
echo "所有参数: $*"         # 所有参数（字符串）
echo "上一命令退出码: $?"   # 上一命令退出状态
echo "当前进程 PID: $$"     # 当前进程 ID
echo "后台进程 PID: $!"     # 最后一个后台进程 ID

# 执行示例：
# ./script.sh arg1 arg2 arg3
```

上述代码展示了 Shell 的特殊变量。

**特殊变量说明：**

| 变量 | 说明 | 示例 |
|------|------|------|
| `$0` | 脚本名称 | `./script.sh` |
| `$1-$9` | 第 1-9 个参数 | `arg1` |
| `${10}` | 第 10 个及以后的参数 | `arg10` |
| `$#` | 参数个数 | `3` |
| `$@` | 所有参数（列表） | `arg1 arg2 arg3` |
| `$*` | 所有参数（字符串） | `arg1 arg2 arg3` |
| `$?` | 上一命令退出码 | `0` |
| `$$` | 当前进程 PID | `12345` |

### 变量类型

```bash
#!/bin/bash

# 字符串
str1="Hello"
str2='World'      # 单引号：原样输出，不解析变量
str3="Hello $str2"  # 双引号：解析变量

echo "$str1"      # Hello
echo '$str1'      # $str1
echo "$str3"      # Hello World

# 字符串操作
echo "长度: ${#str1}"           # 长度: 5
echo "切片: ${str1:0:3}"        # 切片: Hel
echo "拼接: ${str1}${str2}"     # 拼接: HelloWorld

# 数组
arr=(1 2 3 4 5)
echo "第一个元素: ${arr[0]}"    # 1
echo "所有元素: ${arr[@]}"      # 1 2 3 4 5
echo "数组长度: ${#arr[@]}"     # 5

# 关联数组（需要 declare）
declare -A person
person[name]="张三"
person[age]=25
echo "姓名: ${person[name]}"
```

上述代码展示了 Shell 的变量类型。

**引号区别：**

```
单引号 ''：
┌─────────────────────────────────────────────────────────────┐
│  原样输出，不解析变量和命令                                  │
│  echo '$HOME'  →  $HOME                                     │
└─────────────────────────────────────────────────────────────┘

双引号 ""：
┌─────────────────────────────────────────────────────────────┐
│  解析变量和命令                                              │
│  echo "$HOME"  →  /home/user                                │
└─────────────────────────────────────────────────────────────┘

反引号 `` 或 $()：
┌─────────────────────────────────────────────────────────────┐
│  执行命令并获取输出                                          │
│  echo `date`  →  Fri Mar 27 10:00:00 CST 2026               │
│  echo $(date)  →  Fri Mar 27 10:00:00 CST 2026              │
└─────────────────────────────────────────────────────────────┘
```

上述图示展示了三种引号的区别。

## 流程控制

### 条件判断

```bash
#!/bin/bash

# if 语句
age=18

if [ $age -ge 18 ]; then
    echo "成年人"
elif [ $age -ge 12 ]; then
    echo "青少年"
else
    echo "儿童"
fi

# test 命令与 [ ] 等价
if test $age -ge 18; then
    echo "成年人"
fi

# [[ ]] 是 Bash 扩展，支持正则和逻辑运算
if [[ $age -ge 18 && $age -lt 60 ]]; then
    echo "工作年龄"
fi
```

上述代码展示了 if 条件判断语句。

**条件判断语法对比：**

| 语法 | 说明 | 推荐场景 |
|------|------|----------|
| `[ ]` | POSIX 标准 | 跨平台脚本 |
| `[[ ]]` | Bash 扩展 | Bash 脚本 |
| `(( ))` | 算术运算 | 数值比较 |

### 比较运算符

```bash
#!/bin/bash

# 数值比较
a=10
b=20

# [ ] 中的数值比较符
[ $a -eq $b ]    # 等于
[ $a -ne $b ]    # 不等于
[ $a -gt $b ]    # 大于
[ $a -ge $b ]    # 大于等于
[ $a -lt $b ]    # 小于
[ $a -le $b ]    # 小于等于

# (( )) 中的数值比较符（更直观）
(( a == b ))     # 等于
(( a != b ))     # 不等于
(( a > b ))      # 大于
(( a >= b ))     # 大于等于
(( a < b ))      # 小于
(( a <= b ))     # 小于等于

# 字符串比较
str1="hello"
str2="world"

[ $str1 = $str2 ]    # 相等
[ $str1 != $str2 ]   # 不相等
[ -z $str1 ]         # 长度为 0
[ -n $str1 ]         # 长度不为 0
```

上述代码展示了比较运算符的使用。

**数值比较符：**

| 运算符 | 说明 | 英文 |
|--------|------|------|
| `-eq` | 等于 | equal |
| `-ne` | 不等于 | not equal |
| `-gt` | 大于 | greater than |
| `-ge` | 大于等于 | greater or equal |
| `-lt` | 小于 | less than |
| `-le` | 小于等于 | less or equal |

### 文件测试

```bash
#!/bin/bash

file="/etc/passwd"

# 文件测试
[ -e $file ]    # 文件是否存在
[ -f $file ]    # 是否为普通文件
[ -d $file ]    # 是否为目录
[ -r $file ]    # 是否可读
[ -w $file ]    # 是否可写
[ -x $file ]    # 是否可执行
[ -s $file ]    # 文件大小是否大于 0
[ -L $file ]    # 是否为符号链接

# 示例
if [ -f $file ]; then
    echo "$file 是普通文件"
fi

if [ -d "/tmp" ]; then
    echo "/tmp 是目录"
fi
```

上述代码展示了文件测试运算符。

**文件测试符：**

| 运算符 | 说明 |
|--------|------|
| `-e` | 文件存在 |
| `-f` | 普通文件 |
| `-d` | 目录 |
| `-r` | 可读 |
| `-w` | 可写 |
| `-x` | 可执行 |
| `-s` | 非空文件 |
| `-L` | 符号链接 |

### 循环语句

```bash
#!/bin/bash

# for 循环（列表）
for i in 1 2 3 4 5; do
    echo "数字: $i"
done

# for 循环（范围）
for i in {1..5}; do
    echo "数字: $i"
done

# for 循环（C 风格）
for ((i=1; i<=5; i++)); do
    echo "数字: $i"
done

# for 循环（遍历文件）
for file in *.txt; do
    echo "文件: $file"
done

# while 循环
count=1
while [ $count -le 5 ]; do
    echo "计数: $count"
    ((count++))
done

# until 循环（条件为假时执行）
count=1
until [ $count -gt 5 ]; do
    echo "计数: $count"
    ((count++))
done

# 循环控制
for i in {1..10}; do
    if [ $i -eq 3 ]; then
        continue  # 跳过本次循环
    fi
    if [ $i -eq 7 ]; then
        break     # 退出循环
    fi
    echo "数字: $i"
done
```

上述代码展示了各种循环语句的使用。

**循环语句对比：**

| 循环 | 说明 | 适用场景 |
|------|------|----------|
| `for in` | 遍历列表 | 遍历文件、参数 |
| `for (())` | C 风格 | 数值循环 |
| `while` | 条件为真执行 | 不确定次数 |
| `until` | 条件为假执行 | 等待条件成立 |

### case 语句

```bash
#!/bin/bash

read -p "请输入选项 (1-3): " choice

case $choice in
    1)
        echo "选项一"
        ;;
    2)
        echo "选项二"
        ;;
    3)
        echo "选项三"
        ;;
    *)
        echo "无效选项"
        ;;
esac

# 模式匹配
read -p "请输入文件名: " filename

case $filename in
    *.txt)
        echo "文本文件"
        ;;
    *.sh)
        echo "Shell 脚本"
        ;;
    *.c|*.h)
        echo "C 源文件"
        ;;
    *)
        echo "未知类型"
        ;;
esac
```

上述代码展示了 case 语句的使用。

**case 模式说明：**

| 模式 | 说明 |
|------|------|
| `*` | 匹配任意字符串 |
| `?` | 匹配单个字符 |
| `[...]` | 匹配字符集 |
| `|` | 或运算 |
| `;;` | 结束分支 |

## 函数

### 函数定义

```bash
#!/bin/bash

# 函数定义方式一
function greet() {
    echo "Hello, $1!"
}

# 函数定义方式二
greet2() {
    echo "Hello, $1!"
}

# 调用函数
greet "张三"
greet2 "李四"

# 带返回值的函数
add() {
    local sum=$(($1 + $2))
    echo $sum  # 输出作为返回值
}

result=$(add 10 20)
echo "结果: $result"

# 使用 return 返回状态码
check_file() {
    if [ -f $1 ]; then
        return 0  # 成功
    else
        return 1  # 失败
    fi
}

check_file "/etc/passwd"
if [ $? -eq 0 ]; then
    echo "文件存在"
fi
```

上述代码展示了函数的定义和使用。

**函数返回值：**

| 方式 | 说明 | 获取方式 |
|------|------|----------|
| `echo` | 输出作为返回值 | `$(func)` |
| `return` | 状态码（0-255） | `$?` |

### 局部变量

```bash
#!/bin/bash

global_var="全局变量"

func() {
    local local_var="局部变量"
    echo "函数内: $global_var"
    echo "函数内: $local_var"
}

func
echo "函数外: $global_var"
echo "函数外: $local_var"  # 空，局部变量不可见
```

上述代码展示了局部变量的使用。

## 输入输出

### 读取输入

```bash
#!/bin/bash

# 读取用户输入
read -p "请输入姓名: " name
echo "你好, $name!"

# 读取多个变量
read -p "请输入姓名和年龄: " name age
echo "姓名: $name, 年龄: $age"

# 读取密码（不显示输入）
read -s -p "请输入密码: " password
echo ""
echo "密码已接收"

# 读取到数组
read -a arr -p "请输入多个值（空格分隔）: "
echo "第一个值: ${arr[0]}"

# 限时输入
read -t 5 -p "请在 5 秒内输入: " input
```

上述代码展示了读取用户输入的方式。

### 输出重定向

```bash
#!/bin/bash

# 输出重定向
echo "Hello" > file.txt      # 覆盖
echo "World" >> file.txt     # 追加

# 错误重定向
ls /nonexistent 2> error.log           # 只重定向错误
ls /nonexistent 2>&1 all.log           # 重定向标准输出和错误
ls /nonexistent &> all.log             # 同上（Bash 简写）

# 输入重定向
while read line; do
    echo "行: $line"
done < file.txt

# Here Document
cat << EOF
这是一段多行文本
变量: $HOME
EOF

# Here String
grep "pattern" <<< "search in this string"
```

上述代码展示了输入输出重定向的使用。

**重定向符号：**

| 符号 | 说明 |
|------|------|
| `>` | 输出重定向（覆盖） |
| `>>` | 输出重定向（追加） |
| `<` | 输入重定向 |
| `2>` | 错误重定向 |
| `2>&1` | 错误重定向到标准输出 |
| `&>` | 标准输出和错误重定向 |
| `<<` | Here Document |
| `<<<` | Here String |

## 文本处理

### grep 文本搜索

```bash
#!/bin/bash

# 基本搜索
grep "pattern" file.txt

# 常用选项
grep -i "pattern" file.txt    # 忽略大小写
grep -v "pattern" file.txt    # 反向匹配
grep -n "pattern" file.txt    # 显示行号
grep -c "pattern" file.txt    # 统计匹配行数
grep -r "pattern" dir/        # 递归搜索
grep -l "pattern" *.txt       # 只显示文件名
grep -E "regex" file.txt      # 扩展正则表达式

# 示例
grep -rn "TODO" ./            # 递归搜索并显示行号
grep -v "^#" config.conf      # 排除注释行
grep -E "[0-9]{4}" data.txt   # 匹配 4 位数字
```

上述代码展示了 grep 的常用方式。

### sed 流编辑器

```bash
#!/bin/bash

# 替换（每行第一个）
sed 's/old/new/' file.txt

# 替换（所有）
sed 's/old/new/g' file.txt

# 替换（指定行）
sed '2s/old/new/' file.txt     # 第 2 行
sed '2,5s/old/new/' file.txt   # 第 2-5 行

# 删除行
sed '2d' file.txt              # 删除第 2 行
sed '/pattern/d' file.txt      # 删除匹配行
sed '/^$/d' file.txt           # 删除空行

# 插入和追加
sed '2i\新行' file.txt         # 在第 2 行前插入
sed '2a\新行' file.txt         # 在第 2 行后追加

# 直接修改文件
sed -i 's/old/new/g' file.txt

# 示例：批量替换
sed -i 's/192.168.1.1/10.0.0.1/g' *.conf
```

上述代码展示了 sed 的常用操作。

### awk 文本处理

```bash
#!/bin/bash

# 基本用法
awk '{print}' file.txt              # 打印所有行
awk '{print $1}' file.txt           # 打印第一列
awk '{print $1, $3}' file.txt       # 打印第一和第三列

# 指定分隔符
awk -F: '{print $1}' /etc/passwd    # 以 : 分隔

# 条件过滤
awk '$3 > 100' file.txt             # 第三列大于 100
awk '$1 == "root"' /etc/passwd      # 第一列等于 root

# 内置变量
awk '{print NR, $0}' file.txt       # NR: 行号
awk '{print NF, $0}' file.txt       # NF: 字段数
awk 'END {print NR}' file.txt       # 总行数

# 计算统计
awk '{sum += $1} END {print sum}' file.txt     # 求和
awk '{sum += $1} END {print sum/NR}' file.txt  # 平均值

# 格式化输出
awk '{printf "%-10s %5d\n", $1, $2}' file.txt

# 示例：分析日志
awk '{ip[$1]++} END {for (i in ip) print i, ip[i]}' access.log | sort -rn -k2 | head
```

上述代码展示了 awk 的常用操作。

**awk 内置变量：**

| 变量 | 说明 |
|------|------|
| `NR` | 当前记录号（行号） |
| `NF` | 当前记录字段数 |
| `$0` | 整行内容 |
| `$1-$n` | 第 n 个字段 |
| `FS` | 字段分隔符 |
| `RS` | 记录分隔符 |

## 总结

| 概念 | 说明 |
|------|------|
| 变量 | `$var` 或 `${var}` |
| 特殊变量 | `$0`, `$1`, `$#`, `$@`, `$?`, `$$` |
| 条件判断 | `if [ ]; then ... fi` |
| 循环 | `for`, `while`, `until` |
| 函数 | `function name() { }` |
| 重定向 | `>`, `>>`, `<`, `2>&1` |
| 文本处理 | `grep`, `sed`, `awk` |

## 参考资料

[1] Bash Manual. https://www.gnu.org/software/bash/manual/

[2] Advanced Bash-Scripting Guide. https://tldp.org/LDP/abs/html/

[3] Linux Command Line. William Shotts

## 相关主题

- [Makefile 语法](/notes/linux/makefile) - 构建系统
- [内核模块开发](/notes/linux/kernel-module) - Linux 内核编程
- [进程与线程](/notes/cs/process-thread) - 操作系统核心概念
