import { defineConfig } from 'vitepress'

export default defineConfig({
  title: "学习笔记",
  description: "个人学习笔记网站",
  lang: 'zh-CN',
  base: '/learning-notes/',

  head: [
    ['link', { rel: 'icon', href: '/logo.svg' }],
    ['meta', { name: 'description', content: '个人学习笔记网站，记录嵌入式开发、前端技术等学习心得' }],
    ['meta', { name: 'keywords', content: '学习笔记,嵌入式开发,前端技术,编程,环形缓冲区' }],
    ['meta', { property: 'og:title', content: '学习笔记' }],
    ['meta', { property: 'og:description', content: '个人学习笔记网站，记录嵌入式开发、前端技术等学习心得' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:url', content: 'https://NotFoundRyan.github.io/learning-notes/' }],
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
    ['meta', { name: 'twitter:title', content: '学习笔记' }],
    ['meta', { name: 'twitter:description', content: '个人学习笔记网站，记录嵌入式开发、前端技术等学习心得' }]
  ],

  themeConfig: {
    logo: '/logo.svg',

    nav: [
      { text: '首页', link: '/' },
      { text: '笔记', link: '/notes/' },
      { text: '歌单', link: '/music/' }
    ],

    sidebar: {
      '/notes/': [
        {
          text: '学习笔记',
          items: [
            { text: '笔记索引', link: '/notes/' }
          ]
        },
        {
          text: 'C 语言',
          collapsed: false,
          items: [
            { text: '指针详解', link: '/notes/c/pointer' },
            { text: '结构体与联合体', link: '/notes/c/struct-union' },
            { text: '预处理器', link: '/notes/c/preprocessor' },
            { text: '堆栈内存', link: '/notes/c/stack' },
            { text: 'static 关键字', link: '/notes/c/static' },
            { text: '内存管理', link: '/notes/c/memory-management' }
          ]
        },
        {
          text: '计算机基础',
          collapsed: false,
          items: [
            { text: '进程与线程', link: '/notes/cs/process-thread' },
            { text: 'TCP/IP 协议', link: '/notes/cs/tcp-ip' }
          ]
        },
        {
          text: '硬件基础',
          collapsed: false,
          items: [
            { text: 'ARM 架构', link: '/notes/hardware/arm-architecture' },
            { text: 'RTOS', link: '/notes/hardware/rtos' }
          ]
        },
        {
          text: '嵌入式 Linux',
          collapsed: false,
          items: [
            { text: 'Shell 脚本', link: '/notes/linux/shell' },
            { text: 'Makefile', link: '/notes/linux/makefile' },
            { text: '内核模块开发', link: '/notes/linux/kernel-module' },
            { text: '字符设备驱动', link: '/notes/linux/char-driver' }
          ]
        },
        {
          text: '物联网技术',
          collapsed: false,
          items: [
            { text: 'MQTT 协议', link: '/notes/iot/mqtt' }
          ]
        },
        {
          text: '嵌入式开发',
          collapsed: false,
          items: [
            { text: '环形缓冲区', link: '/notes/embedded/ring-buffer' },
            { text: '回调函数', link: '/notes/embedded/callback' },
            { text: '状态机', link: '/notes/embedded/state-machine' },
            { text: '数据封装', link: '/notes/embedded/data-encapsulation' },
            { text: '串口数据', link: '/notes/embedded/uart-data' },
            { text: '通信协议', link: '/notes/embedded/protocol' },
            { text: 'UDP/TCP', link: '/notes/embedded/network' }
          ]
        }
      ]
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/' }
    ],

    footer: {
      message: '基于 VitePress 构建',
      copyright: 'Copyright © 2026-present'
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

  lastUpdated: true,

  sitemap: {
    hostname: 'https://NotFoundRyan.github.io/learning-notes/'
  }
})
