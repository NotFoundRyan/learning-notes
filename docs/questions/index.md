---
title: 题库
---

# 题库

欢迎来到题库！这里收集了各类编程相关的练习题目，帮助你巩固所学知识。

<div class="question-cards">
  <a class="question-card" data-url="https://www.ruankaodaren.com/exam/#/">
    <span class="question-card-title">软考达人</span>
    <span class="question-card-desc">专业的软考刷题题库</span>
  </a>
  <a class="question-card" data-url="https://mianbao.zutils.cn/">
    <span class="question-card-title">面包刷题</span>
    <span class="question-card-desc">嵌入式面试刷题平台</span>
  </a>
</div>

<div class="question-fullscreen" id="question-fullscreen">
  <div class="question-fullscreen-header">
    <button class="question-back-btn" id="question-back-btn">
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
      <span>返回题库</span>
    </button>
    <a class="question-open-link" id="question-open-link" href="" target="_blank" title="在新窗口打开">
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
    </a>
  </div>
  <iframe id="question-iframe" src="" frameborder="0" allowfullscreen></iframe>
</div>

<style>
.question-cards {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin: 24px 0;
}

.question-card {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  padding: 16px 32px;
  background: var(--vp-c-bg);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border: var(--glass-border);
  border-radius: 50px;
  box-shadow: var(--glass-shadow);
  text-decoration: none !important;
  color: var(--vp-c-text-1) !important;
  transition: all 0.3s ease;
  cursor: pointer;
}

.question-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px 0 rgba(0, 0, 0, 0.15);
}

.dark .question-card:hover {
  box-shadow: 0 12px 40px 0 rgba(0, 0, 0, 0.5);
}

.question-card-title {
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.question-card-desc {
  font-size: 11px;
  color: var(--vp-c-text-3);
  font-weight: 400;
  margin-top: 2px;
}

.question-fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 999;
  background: var(--vp-c-bg);
  display: none;
  flex-direction: column;
}

.question-fullscreen.active {
  display: flex;
}

.question-fullscreen-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  background: var(--vp-c-bg-soft);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border-bottom: var(--glass-border);
  box-shadow: var(--glass-shadow);
}

.question-back-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: var(--vp-c-bg);
  border: var(--glass-border);
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  color: var(--vp-c-text-1);
  cursor: pointer;
  transition: all 0.2s ease;
}

.question-back-btn:hover {
  background: var(--vp-c-bg-mute);
  transform: translateX(-2px);
}

.question-open-link {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px;
  background: var(--vp-c-bg);
  border: var(--glass-border);
  border-radius: 8px;
  color: var(--vp-c-text-2);
  text-decoration: none !important;
  transition: all 0.2s ease;
}

.question-open-link:hover {
  background: var(--vp-c-bg-mute);
  color: var(--vp-c-text-1);
}

#question-iframe {
  flex: 1;
  width: 100%;
  border: none;
}

@media (max-width: 640px) {
  .question-cards {
    justify-content: center;
  }

  .question-card {
    padding: 14px 24px;
  }

  .question-fullscreen-header {
    padding: 10px 16px;
  }

  .question-back-btn span {
    display: none;
  }

  .question-back-btn {
    padding: 10px;
  }
}
</style>

<script setup>
import { onMounted, onUnmounted } from 'vue'

onMounted(() => {
  document.body.classList.add('question-page-wide')

  const cards = document.querySelectorAll('.question-card')
  const fullscreen = document.getElementById('question-fullscreen')
  const iframe = document.getElementById('question-iframe')
  const backBtn = document.getElementById('question-back-btn')
  const openLink = document.getElementById('question-open-link')

  cards.forEach(card => {
    card.addEventListener('click', (e) => {
      e.preventDefault()
      const url = card.dataset.url
      iframe.src = url
      openLink.href = url
      fullscreen.classList.add('active')
      document.body.style.overflow = 'hidden'
    })
  })

  backBtn.addEventListener('click', () => {
    fullscreen.classList.remove('active')
    document.body.style.overflow = ''
    setTimeout(() => {
      iframe.src = ''
    }, 300)
  })

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && fullscreen.classList.contains('active')) {
      backBtn.click()
    }
  })
})

onUnmounted(() => {
  document.body.classList.remove('question-page-wide')
})
</script>
