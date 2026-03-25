<script setup lang="ts">
defineProps<{
  size?: number
}>()
</script>

<template>
  <svg :width="size || 24" :height="size || 24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M7 7H17V17H7V7Z" fill="currentColor"/>
  </svg>
</template>
