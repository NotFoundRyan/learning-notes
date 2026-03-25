<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vitepress'
import { useMusicStore } from '../composables/useMusicStore'
import AlbumIcon from './icons/AlbumIcon.vue'
import MusicIcon from './icons/MusicIcon.vue'

const { playlists, loadPlaylists, selectPlaylist } = useMusicStore()
const router = useRouter()

onMounted(() => {
  loadPlaylists()
})

function goToPlaylist(playlistId: string) {
  selectPlaylist(playlistId)
  router.go(`/learning-notes/music/${playlistId}/`)
}
</script>

<template>
  <div class="playlist-list">
    <div class="list-header">
      <h2>我的歌单</h2>
      <span class="count">{{ playlists.length }} 个歌单</span>
    </div>

    <div class="list-content">
      <div
        v-for="playlist in playlists"
        :key="playlist.id"
        class="playlist-card"
        @click="goToPlaylist(playlist.id)"
      >
        <div class="card-cover">
          <AlbumIcon :size="48" class="cover-placeholder" />
        </div>
        <div class="card-info">
          <span class="card-name">{{ playlist.name }}</span>
          <span class="card-count">
            <MusicIcon :size="12" />
            {{ playlist.songs.length }} 首
          </span>
          <span v-if="playlist.description" class="card-desc">{{ playlist.description }}</span>
        </div>
      </div>
    </div>

    <div class="empty-state" v-if="playlists.length === 0">
      <p>暂无歌单</p>
      <p class="hint">请在 playlist.json 中添加歌单</p>
    </div>
  </div>
</template>

<style scoped>
.playlist-list {
  background: var(--vp-c-bg-soft);
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid var(--vp-c-divider);
}

.list-header {
  padding: 20px 24px;
  border-bottom: 1px solid var(--vp-c-divider);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.list-header h2 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--vp-c-text-1);
}

.count {
  font-size: 0.875rem;
  color: var(--vp-c-text-3);
}

.list-content {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
  padding: 16px;
}

.playlist-card {
  display: flex;
  gap: 16px;
  padding: 16px;
  background: var(--vp-c-bg);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid var(--vp-c-divider);
}

.playlist-card:hover {
  background: var(--vp-c-default-soft);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.card-cover {
  width: 80px;
  height: 80px;
  border-radius: 8px;
  background: var(--vp-c-bg-soft);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.cover-placeholder {
  color: var(--vp-c-text-3);
}

.card-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.card-name {
  font-size: 1rem;
  font-weight: 600;
  color: var(--vp-c-text-1);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-count {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.75rem;
  color: var(--vp-c-text-3);
}

.card-desc {
  font-size: 0.75rem;
  color: var(--vp-c-text-3);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: var(--vp-c-text-2);
}

.empty-state .hint {
  font-size: 0.875rem;
  color: var(--vp-c-text-3);
  margin-top: 8px;
}
</style>
