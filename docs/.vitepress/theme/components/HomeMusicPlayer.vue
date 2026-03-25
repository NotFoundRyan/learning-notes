<script setup lang="ts">
import { onMounted } from 'vue'
import PlaylistList from './PlaylistList.vue'
import { useMusicStore } from '../composables/useMusicStore'

const { loadPlaylists } = useMusicStore()

onMounted(() => {
  loadPlaylists()
})
</script>

<template>
  <div class="home-music-section">
    <h2>音乐</h2>
    <PlaylistList />
  </div>
</template>

<style scoped>
.home-music-section {
  max-width: 900px;
  margin: 40px auto;
  padding: 0 24px;
}

.home-music-section h2 {
  text-align: center;
  margin-bottom: 20px;
  font-size: 1.5rem;
  color: var(--vp-c-text-1);
}
</style>
