<script setup lang="ts">
defineProps<{
  size?: number
}>()
</script>

<template>
  <svg :width="size || 24" :height="size || 24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M6 4H10V20H6V4ZM14 4H18V20H14V4Z" fill="currentColor"/>
  </svg>
</template>
