import DefaultTheme from 'vitepress/theme'
import './style.css'
import { onMounted, watch, nextTick, computed, h } from 'vue'
import { useRoute } from 'vitepress'
import type { EnhanceAppContext } from 'vitepress'
import mediumZoom from 'medium-zoom'
import BackToTop from './components/BackToTop.vue'
import ReadingStats from './components/ReadingStats.vue'
import GiscusComments from './components/GiscusComments.vue'
import CopyCode from './components/CopyCode.vue'
import ReadingProgress from './components/ReadingProgress.vue'
import CollapsibleIframe from './components/CollapsibleIframe.vue'
import MusicPlayer from './components/MusicPlayer.vue'
import FloatingPlayer from './components/FloatingPlayer.vue'
import HomeMusicPlayer from './components/HomeMusicPlayer.vue'
import PlaylistList from './components/PlaylistList.vue'
import HomeAvatar from './components/HomeAvatar.vue'
import { useMusicStore } from './composables/useMusicStore'

export default {
  ...DefaultTheme,
  Layout: () => {
    const route = useRoute()
    const { isPlayerVisible, isPlaying } = useMusicStore()

    const showFloatingPlayer = computed(() => {
      const path = route.path
      const isMusicPage = path.includes('/music/')
      const isHomePage = path === '/' || path === '/learning-notes/' || path === '/learning-notes'
      return isPlayerVisible.value && !isMusicPage && !isHomePage
    })

    return h(DefaultTheme.Layout, null, {
      'doc-after': () => h(GiscusComments),
      'doc-before': () => h(ReadingStats),
      'content-bottom': () => h(CopyCode),
      'layout-top': () => h(ReadingProgress),
      'layout-bottom': () => [
        h(BackToTop),
        showFloatingPlayer.value ? h(FloatingPlayer) : null
      ],
      'home-features-after': () => h(HomeMusicPlayer),
      'home-hero-after': () => h(HomeAvatar)
    })
  },
  enhanceApp({ app }: EnhanceAppContext) {
    app.component('CollapsibleIframe', CollapsibleIframe)
    app.component('MusicPlayer', MusicPlayer)
    app.component('PlaylistList', PlaylistList)
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
