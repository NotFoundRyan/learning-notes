import DefaultTheme from 'vitepress/theme'
import './style.css'
import { onMounted, watch, nextTick } from 'vue'
import { useRoute } from 'vitepress'
import mediumZoom from 'medium-zoom'
import BackToTop from './components/BackToTop.vue'
import ReadingStats from './components/ReadingStats.vue'
import GiscusComments from './components/GiscusComments.vue'
import CopyCode from './components/CopyCode.vue'
import ReadingProgress from './components/ReadingProgress.vue'

export default {
  ...DefaultTheme,
  Layout: () => {
    return h(DefaultTheme.Layout, null, {
      'doc-after': () => h(GiscusComments),
      'doc-before': () => h(ReadingStats),
      'layout-bottom': () => h(BackToTop),
      'content-bottom': () => h(CopyCode),
      'layout-top': () => h(ReadingProgress)
    })
  },
  setup() {
    const route = useRoute()

    onMounted(() => {
      initZoom()
    })

    watch(
      () => route.path,
      () => nextTick(() => initZoom())
    )

    function initZoom() {
      mediumZoom('.main img', {
        background: 'var(--vp-c-bg)',
        margin: 24
      })
    }
  }
}

import { h } from 'vue'
