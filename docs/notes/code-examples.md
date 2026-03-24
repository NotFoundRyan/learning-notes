# 代码示例

这里展示代码相关的功能。

## 代码高亮

支持多种编程语言的语法高亮：

### JavaScript

```javascript
const greeting = (name) => {
  return `Hello, ${name}!`
}

console.log(greeting('World'))
```

### TypeScript

```typescript
interface User {
  id: number
  name: string
  email: string
}

function createUser(data: User): User {
  return { ...data }
}
```

### Python

```python
class Calculator:
    def add(self, a: int, b: int) -> int:
        return a + b
    
    def multiply(self, a: int, b: int) -> int:
        return a * b

calc = Calculator()
print(calc.add(2, 3))
```

### CSS

```css
.glass-card {
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 16px;
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.08);
}
```

## 代码组

::: code-group

```javascript [JavaScript]
export default {
  name: 'MyComponent',
  data() {
    return {
      message: 'Hello!'
    }
  }
}
```

```typescript [TypeScript]
interface Component {
  name: string
  data(): { message: string }
}

export default {
  name: 'MyComponent',
  data() {
    return {
      message: 'Hello!'
    }
  }
} as Component
```

:::

## 行号

```javascript {1,3-5}
function highlightLines() {
  const a = 1
  const b = 2
  const c = 3
  const d = 4
  return a + b + c + d
}
```

## 嵌入 HTML 演示

你可以在 `public/demos/` 目录下放置 HTML 文件，然后在笔记中通过 iframe 嵌入：

```html
<iframe src="/learning-notes/demos/css-animation.html" width="100%" height="300"></iframe>
```

效果如下：

<iframe src="/learning-notes/demos/css-animation.html" width="100%" height="300" style="border: none; border-radius: 12px;"></iframe>
