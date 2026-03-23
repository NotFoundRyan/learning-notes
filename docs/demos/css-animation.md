# CSS 动画演示

这里展示纯 CSS 实现的动画效果。

## 渐变背景动画

<iframe src="/demos/css-animation.html" width="100%" height="300" style="border: none; border-radius: 12px;"></iframe>

## 源码

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CSS 动画演示</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(-45deg, #ee7752, #e73c7e, #23a6d5, #23d5ab);
      background-size: 400% 400%;
      animation: gradient 15s ease infinite;
    }
    
    .card {
      background: rgba(255, 255, 255, 0.72);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.18);
      border-radius: 16px;
      padding: 40px;
      box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.08);
      text-align: center;
    }
    
    h1 {
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 24px;
      color: #1a1a1a;
      margin-bottom: 16px;
    }
    
    p {
      font-family: system-ui, -apple-system, sans-serif;
      color: #525252;
    }
    
    @keyframes gradient {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }
  </style>
</head>
<body>
  <div class="card">
    <h1>CSS 渐变动画</h1>
    <p>纯 CSS 实现的背景渐变动画效果</p>
  </div>
</body>
</html>
```

## 关键技术

1. **渐变背景** - 使用 `linear-gradient` 创建多色渐变
2. **背景尺寸** - 放大背景尺寸以创建动画空间
3. **关键帧动画** - 使用 `@keyframes` 控制背景位置变化
4. **磨砂玻璃** - 使用 `backdrop-filter: blur()` 实现毛玻璃效果
