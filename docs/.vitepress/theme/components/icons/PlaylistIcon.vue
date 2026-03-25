<script setup lang="ts">
defineProps<{
  size?: number
}>()
</script>

<template>
  <svg :width="size || 24" :height="size || 24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2ZM6 20V4H13V9H18V20H6ZM9 13V19H7V13H9ZM15 15V19H17V15H15ZM11 11V19H13V11H11Z" fill="currentColor"/>
  </svg>
</template>
