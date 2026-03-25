<template>
  <div class="collapsible-iframe">
    <div class="iframe-header" @click="toggle">
      <span class="iframe-title">{{ title }}</span>
      <span class="toggle-icon" :class="{ collapsed: !isExpanded }">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </span>
    </div>
    <div class="iframe-container" :style="{ height: isExpanded ? height + 'px' : '0px' }">
      <iframe
        :src="src"
        width="100%"
        :height="height"
        frameborder="0"
        :style="{ borderRadius: '0 0 8px 8px' }"
        loading="lazy"
      ></iframe>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  src: {
    type: String,
    required: true
  },
  title: {
    type: String,
    default: '交互演示'
  },
  height: {
    type: Number,
    default: 500
  },
  defaultExpanded: {
    type: Boolean,
    default: false
  }
})

const isExpanded = ref(props.defaultExpanded)

const toggle = () => {
  isExpanded.value = !isExpanded.value
}
</script>

<style scoped>
.collapsible-iframe {
  margin: 16px 0;
  border-radius: 12px;
  overflow: hidden;
  background: rgba(50, 50, 55, 0.4);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
}

.iframe-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  cursor: pointer;
  user-select: none;
  background: rgba(40, 40, 45, 0.6);
  transition: background 0.2s ease;
}

.iframe-header:hover {
  background: rgba(50, 50, 55, 0.8);
}

.iframe-title {
  font-size: 14px;
  font-weight: 500;
  color: #e0e0e0;
  letter-spacing: 0.5px;
}

.toggle-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #888;
  transition: transform 0.3s ease;
}

.toggle-icon.collapsed {
  transform: rotate(-90deg);
}

.iframe-container {
  overflow: hidden;
  transition: height 0.3s ease;
}

.iframe-container iframe {
  display: block;
  margin: 0;
}
</style>
