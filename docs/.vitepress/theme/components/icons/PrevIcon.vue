<script setup lang="ts">
defineProps<{
  size?: number
}>()
</script>

<template>
  <svg :width="size || 24" :height="size || 24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M6 6H8V18H6V6ZM16 6L10 12L16 18V6Z" fill="currentColor"/>
  </svg>
</template>
