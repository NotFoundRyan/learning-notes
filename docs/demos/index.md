# 演示动画

这里展示了各种动画演示效果。

## CSS 动画

纯 CSS 实现的动画效果，包括渐变背景、毛玻璃效果等。

[查看 CSS 动画演示](/demos/css-animation)

## JavaScript 动画

使用 JavaScript 和 Canvas 实现的粒子动画效果。

[查看 JS 动画演示](/demos/js-animation)

## 嵌入式开发演示

环形缓冲区相关的交互式演示。

[查看环形缓冲区笔记](/notes/embedded/ring-buffer)

## 如何创建演示

1. 在 `docs/public/demos/` 目录下创建 HTML 文件
2. 在 `docs/demos/` 目录下创建对应的 `.md` 文档
3. 使用 iframe 嵌入或直接链接到 HTML 文件

## 文件结构

```
docs/
├── demos/
│   ├── index.md           # 演示索引
│   ├── css-animation.md   # CSS 动画文档
│   └── js-animation.md    # JS 动画文档
└── public/
    └── demos/
        ├── css-animation.html
        ├── particle-animation.html
        ├── ring-buffer.html
        ├── bitwise-mod.html
        ├── ring-full-empty.html
        └── ring-dma.html
```
