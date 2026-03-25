<script setup lang="ts">
defineProps<{
  size?: number
}>()
</script>

<template>
  <svg :width="size || 24" :height="size || 24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 9V15H7L12 20V4L7 9H3ZM16 12C16 10.27 14.73 9 13 9V11C13.55 11 14 11.45 14 12C14 12.55 13.55 13 13 13V15C14.73 15 16 13.73 16 12ZM13 5V7C16.31 7 19 9.69 19 13H21C21 8.58 17.42 5 13 5ZM13 19V17C15.21 17 17.09 15.54 17.76 13.5H19.8C19.07 16.67 16.32 19 13 19Z" fill="currentColor"/>
  </svg>
</template>
