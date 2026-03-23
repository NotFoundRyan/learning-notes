<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useData } from 'vitepress'

const { frontmatter } = useData()
const readingTime = ref(0)
const wordCount = ref(0)

const statsText = computed(() => {
  const words = wordCount.value
  const time = readingTime.value
  return `约 ${words} 字 · 预计阅读 ${time} 分钟`
})

onMounted(() => {
  const article = document.querySelector('.vp-doc')
  if (article) {
    const text = article.textContent || ''
    const chineseChars = text.match(/[\u4e00-\u9fa5]/g)?.length || 0
    const englishWords = text.match(/[a-zA-Z]+/g)?.length || 0
    wordCount.value = chineseChars + englishWords
    readingTime.value = Math.ceil(wordCount.value / 400)
  }
})
</script>

<template>
  <div v-if="!frontmatter.layout" class="reading-stats">
    <div class="stats-container">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"/>
        <polyline points="12,6 12,12 16,14"/>
      </svg>
      <span>{{ statsText }}</span>
    </div>
  </div>
</template>

<style scoped>
.reading-stats {
  padding: 12px 0;
  margin-bottom: 16px;
  border-bottom: 1px solid var(--vp-c-divider);
}

.stats-container {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--vp-c-text-3);
  background: var(--vp-c-bg-soft);
  padding: 6px 12px;
  border-radius: 20px;
}

.stats-container svg {
  opacity: 0.7;
}
</style>
