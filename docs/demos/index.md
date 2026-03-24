# 演示动画

这里展示了各种动画演示效果。

## CSS 动画

[查看 CSS 动画演示](/demos/css-animation)

可以在 iframe 中嵌入：

<iframe src="/learning-notes/demos/css-animation.html" width="100%" height="300" style="border: none; border-radius: 12px;"></iframe>

## JavaScript 动画

[查看 JS 动画演示](/demos/js-animation)

<iframe src="/learning-notes/demos/particle-animation.html" width="100%" height="400" style="border: none; border-radius: 12px;"></iframe>

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
        └── particle-animation.html
```
