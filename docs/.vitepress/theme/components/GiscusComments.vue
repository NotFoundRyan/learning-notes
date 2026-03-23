<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue'
import { useData } from 'vitepress'

const { frontmatter, isDark } = useData()
const giscusContainer = ref<HTMLElement | null>(null)
const shouldShow = ref(false)

const loadGiscus = () => {
  if (!giscusContainer.value) return
  
  giscusContainer.value.innerHTML = ''
  
  const script = document.createElement('script')
  script.src = 'https://giscus.app/client.js'
  script.setAttribute('data-repo', 'your-username/your-repo')
  script.setAttribute('data-repo-id', 'your-repo-id')
  script.setAttribute('data-category', 'Announcements')
  script.setAttribute('data-category-id', 'your-category-id')
  script.setAttribute('data-mapping', 'pathname')
  script.setAttribute('data-strict', '0')
  script.setAttribute('data-reactions-enabled', '1')
  script.setAttribute('data-emit-metadata', '0')
  script.setAttribute('data-input-position', 'top')
  script.setAttribute('data-theme', isDark.value ? 'dark' : 'light')
  script.setAttribute('data-lang', 'zh-CN')
  script.setAttribute('crossorigin', 'anonymous')
  script.async = true
  
  giscusContainer.value.appendChild(script)
}

onMounted(() => {
  if (!frontmatter.value.layout) {
    shouldShow.value = true
    nextTick(loadGiscus)
  }
})

watch(isDark, () => {
  if (shouldShow.value) {
    loadGiscus()
  }
})
</script>

<template>
  <div v-if="shouldShow" class="giscus-container">
    <h3 class="comment-title">评论</h3>
    <div ref="giscusContainer" class="giscus"></div>
  </div>
</template>

<style scoped>
.giscus-container {
  margin-top: 48px;
  padding-top: 32px;
  border-top: 1px solid var(--vp-c-divider);
}

.comment-title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 24px;
  color: var(--vp-c-text-1);
}

.giscus {
  border-radius: 12px;
  overflow: hidden;
}

.giscus :deep(.giscus) {
  max-width: 100%;
}
</style>
