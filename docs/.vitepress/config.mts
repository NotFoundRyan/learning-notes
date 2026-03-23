import { defineConfig } from 'vitepress'

export default defineConfig({
  title: "学习笔记",
  description: "个人学习笔记网站",
  lang: 'zh-CN',

  head: [
    ['link', { rel: 'icon', href: '/logo.svg' }]
  ],

  themeConfig: {
    logo: '/logo.svg',

    nav: [
      { text: '首页', link: '/' },
      { text: '笔记', link: '/notes/' },
      { text: '演示', link: '/demos/' },
      { text: '模板', link: '/templates/' }
    ],

    sidebar: {
      '/notes/': [
        {
          text: '学习笔记',
          items: [
            { text: '笔记索引', link: '/notes/' },
            { text: 'Markdown 示例', link: '/notes/markdown-examples' },
            { text: '代码示例', link: '/notes/code-examples' }
          ]
        }
      ],
      '/demos/': [
        {
          text: '演示动画',
          items: [
            { text: '演示索引', link: '/demos/' },
            { text: 'CSS 动画', link: '/demos/css-animation' },
            { text: 'JS 动画', link: '/demos/js-animation' }
          ]
        }
      ],
      '/templates/': [
        {
          text: '笔记模板',
          items: [
            { text: '模板索引', link: '/templates/' },
            { text: '算法模板', link: '/templates/algorithm-template' },
            { text: '前端模板', link: '/templates/frontend-template' },
            { text: '后端模板', link: '/templates/backend-template' }
          ]
        }
      ]
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/' }
    ],

    footer: {
      message: '基于 VitePress 构建',
      copyright: 'Copyright © 2024-present'
    },

    search: {
      provider: 'local',
      options: {
        translations: {
          button: {
            buttonText: '搜索文档',
            buttonAriaLabel: '搜索文档'
          },
          modal: {
            noResultsText: '无法找到相关结果',
            resetButtonTitle: '清除查询条件',
            footer: {
              selectText: '选择',
              navigateText: '切换'
            }
          }
        }
      }
    },

    outline: {
      level: [2, 3],
      label: '目录'
    },

    docFooter: {
      prev: '上一页',
      next: '下一页'
    },

    lastUpdated: {
      text: '最后更新于',
      formatOptions: {
        dateStyle: 'short',
        timeStyle: 'short'
      }
    },

    returnToTopLabel: '返回顶部',
    sidebarMenuLabel: '菜单',
    darkModeSwitchLabel: '主题',
    lightModeSwitchTitle: '切换到浅色模式',
    darkModeSwitchTitle: '切换到深色模式'
  },

  markdown: {
    lineNumbers: true,
    math: true
  },

  lastUpdated: true
})
