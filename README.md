# 学习笔记

个人学习笔记网站，基于 VitePress 构建。

## 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run docs:dev

# 构建生产版本
npm run docs:build

# 预览生产版本
npm run docs:preview
```

## 目录结构

```
docs/
├── .vitepress/     # VitePress 配置
│   ├── config.mts  # 主配置文件
│   └── theme/      # 主题自定义
├── notes/          # Markdown 笔记
├── demos/          # 演示文档
└── public/         # 静态资源
    ├── images/     # 图片资源
    └── demos/      # HTML 演示文件
```

## 功能特性

- Markdown 渲染
- 代码高亮
- 数学公式
- 演示动画
- 响应式设计
- 暗黑模式
- 本地搜索

## 部署

项目使用 GitHub Actions 自动部署到 GitHub Pages。

推送代码到 `main` 分支即可触发自动部署。
