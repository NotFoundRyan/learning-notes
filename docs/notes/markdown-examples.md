# Markdown 示例

这里展示了 Markdown 的各种语法和功能。

## 文本格式

**粗体文本** 和 *斜体文本* 以及 `行内代码`。

~~删除线~~ 和 ==高亮文本==。

## 列表

### 无序列表

- 项目一
- 项目二
  - 子项目
  - 子项目
- 项目三

### 有序列表

1. 第一步
2. 第二步
3. 第三步

### 任务列表

- [x] 已完成任务
- [ ] 未完成任务
- [ ] 待办事项

## 引用

> 这是一段引用文本。
> 
> 可以包含多行内容。

## 代码块

```javascript
function greet(name) {
  console.log(`Hello, ${name}!`)
}

greet('World')
```

```python
def greet(name):
    print(f"Hello, {name}!")

greet("World")
```

## 表格

| 功能 | 描述 | 状态 |
|------|------|------|
| Markdown | 基础语法支持 | ✅ |
| 代码高亮 | 多语言支持 | ✅ |
| 动画演示 | HTML 嵌入 | ✅ |

## 图片

![示例图片](/images/placeholder.svg)

## 链接

[外部链接](https://github.com)

[内部链接](/notes/code-examples)

## 分割线

---

## 数学公式

行内公式：$E = mc^2$

块级公式：

$$
\frac{\partial f}{\partial x} = \lim_{h \to 0} \frac{f(x+h) - f(x)}{h}
$$

## 提示框

::: tip 提示
这是一个提示信息。
:::

::: warning 警告
这是一个警告信息。
:::

::: danger 危险
这是一个危险警告。
:::

::: details 点击展开
这是隐藏的详细内容。
:::
