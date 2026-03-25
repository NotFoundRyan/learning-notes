<script setup lang="ts">
defineProps<{
  size?: number
}>()
</script>

<template>
  <svg :width="size || 24" :height="size || 24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M16 18H18V6H16V18ZM8 6L14 12L8 18V6Z" fill="currentColor"/>
  </svg>
</template>
