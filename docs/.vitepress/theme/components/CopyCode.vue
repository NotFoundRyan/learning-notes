<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { useRoute } from 'vitepress'

const route = useRoute()

const addCopyButtons = () => {
  const codeBlocks = document.querySelectorAll('.vp-doc div[class*="language-"]')
  
  codeBlocks.forEach((block) => {
    if (block.querySelector('.copy-code-button')) return
    
    const button = document.createElement('button')
    button.className = 'copy-code-button'
    button.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
      </svg>
    `
    button.title = '复制代码'
    
    button.addEventListener('click', async () => {
      const code = block.querySelector('code')?.textContent || ''
      try {
        await navigator.clipboard.writeText(code)
        button.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        `
        button.title = '已复制!'
        setTimeout(() => {
          button.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
          `
          button.title = '复制代码'
        }, 2000)
      } catch (err) {
        console.error('复制失败:', err)
      }
    })
    
    block.appendChild(button)
  })
}

onMounted(() => {
  addCopyButtons()
})

watch(
  () => route.path,
  () => {
    setTimeout(() => {
      addCopyButtons()
    }, 100)
  }
)
</script>

<template>
  <div></div>
</template>

<style>
.copy-code-button {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 32px;
  height: 32px;
  padding: 6px;
  border: none;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  cursor: pointer;
  opacity: 0;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--vp-c-text-2);
  z-index: 10;
}

.vp-doc div[class*="language-"]:hover .copy-code-button {
  opacity: 1;
}

.copy-code-button:hover {
  background: rgba(255, 255, 255, 0.2);
  color: var(--vp-c-text-1);
  transform: scale(1.1);
}

.copy-code-button:active {
  transform: scale(0.95);
}

.dark .copy-code-button {
  background: rgba(255, 255, 255, 0.05);
}

.dark .copy-code-button:hover {
  background: rgba(255, 255, 255, 0.1);
}
</style>
