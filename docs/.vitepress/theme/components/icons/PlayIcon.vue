<script setup lang="ts">
defineProps<{
  size?: number
}>()
</script>

<template>
  <svg :width="size || 24" :height="size || 24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 5V19L19 12L8 5Z" fill="currentColor"/>
  </svg>
</template>
