# 学习笔记

个人学习笔记网站，基于 VitePress 构建。

## 网站地址

- **在线访问**: https://NotFoundRyan.github.io/learning-notes/

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
│   └── embedded/   # 嵌入式开发笔记
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

## 更新部署

项目使用 GitHub Actions 自动部署到 GitHub Pages。

### 更新步骤

```bash
# 1. 本地预览确认无误
npm run docs:dev

# 2. 构建生产版本（可选，GitHub Actions 会自动构建）
npm run docs:build

# 3. 提交并推送代码
git add .
git commit -m "更新内容描述"
git push origin main
```

推送后 GitHub Actions 会自动构建并部署，通常 1-2 分钟完成。

### 查看部署状态

访问 GitHub 仓库的 Actions 页面查看部署进度：
https://github.com/NotFoundRyan/learning-notes/actions
