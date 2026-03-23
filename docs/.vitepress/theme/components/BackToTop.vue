<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const showButton = ref(false)
const scrollProgress = ref(0)

const handleScroll = () => {
  const scrollTop = window.scrollY
  const docHeight = document.documentElement.scrollHeight - window.innerHeight
  scrollProgress.value = (scrollTop / docHeight) * 100
  showButton.value = scrollTop > 300
}

const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  })
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<template>
  <Transition name="fade">
    <button
      v-if="showButton"
      class="back-to-top"
      @click="scrollToTop"
      :title="'返回顶部'"
    >
      <svg
        class="progress-ring"
        width="44"
        height="44"
      >
        <circle
          class="progress-ring-bg"
          cx="22"
          cy="22"
          r="18"
        />
        <circle
          class="progress-ring-progress"
          cx="22"
          cy="22"
          r="18"
          :stroke-dasharray="113.1"
          :stroke-dashoffset="113.1 - (113.1 * scrollProgress) / 100"
        />
      </svg>
      <svg
        class="arrow-icon"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <path d="M18 15l-6-6-6 6"/>
      </svg>
    </button>
  </Transition>
</template>

<style scoped>
.back-to-top {
  position: fixed;
  bottom: 32px;
  right: 32px;
  width: 44px;
  height: 44px;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  z-index: 999;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.back-to-top:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
}

.progress-ring {
  position: absolute;
  top: 0;
  left: 0;
  transform: rotate(-90deg);
}

.progress-ring-bg {
  fill: none;
  stroke: rgba(0, 0, 0, 0.1);
  stroke-width: 2;
}

.progress-ring-progress {
  fill: none;
  stroke: #1a1a1a;
  stroke-width: 2;
  stroke-linecap: round;
  transition: stroke-dashoffset 0.1s ease;
}

.arrow-icon {
  position: relative;
  color: #1a1a1a;
}

.dark .back-to-top {
  background: rgba(26, 26, 26, 0.72);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.3);
}

.dark .progress-ring-bg {
  stroke: rgba(255, 255, 255, 0.1);
}

.dark .progress-ring-progress {
  stroke: #f5f5f5;
}

.dark .arrow-icon {
  color: #f5f5f5;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

@media (max-width: 768px) {
  .back-to-top {
    bottom: 20px;
    right: 20px;
  }
}
</style>
