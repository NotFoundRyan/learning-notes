<script setup lang="ts">
import { computed, ref, onUnmounted } from 'vue'
import { useRouter } from 'vitepress'
import { useMusicStore } from '../composables/useMusicStore'
import PlayIcon from './icons/PlayIcon.vue'
import PauseIcon from './icons/PauseIcon.vue'
import PrevIcon from './icons/PrevIcon.vue'
import NextIcon from './icons/NextIcon.vue'
import CloseIcon from './icons/CloseIcon.vue'
import AlbumIcon from './icons/AlbumIcon.vue'

const {
  currentSong,
  isPlaying,
  currentTime,
  duration,
  progress,
  togglePlay,
  next,
  prev,
  hidePlayer,
  getSongCover
} = useMusicStore()

const router = useRouter()

const hasSong = computed(() => currentSong.value !== null)

const currentCover = computed(() => {
  if (currentSong.value) {
    return getSongCover(currentSong.value.id)
  }
  return null
})

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

function goToMusicPage() {
  router.go('/learning-notes/music/')
}

const playerRef = ref<HTMLElement | null>(null)
const isDragging = ref(false)
const dragOffset = ref({ x: 0, y: 0 })
const position = ref({ x: 0, y: 0 })
const hasMoved = ref(false)

function startDrag(e: MouseEvent) {
  const target = e.target as HTMLElement
  if (target.closest('button') || target.closest('.player-cover') || target.closest('.song-info')) {
    return
  }
  if (!playerRef.value) return
  isDragging.value = true
  hasMoved.value = false
  const rect = playerRef.value.getBoundingClientRect()
  dragOffset.value = {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top
  }
  document.addEventListener('mousemove', onDrag)
  document.addEventListener('mouseup', stopDrag)
}

function onDrag(e: MouseEvent) {
  if (!isDragging.value || !playerRef.value) return
  hasMoved.value = true

  const newX = e.clientX - dragOffset.value.x
  const newY = e.clientY - dragOffset.value.y

  const playerWidth = playerRef.value.offsetWidth
  const playerHeight = playerRef.value.offsetHeight
  const windowWidth = window.innerWidth
  const windowHeight = window.innerHeight

  position.value = {
    x: Math.max(0, Math.min(newX, windowWidth - playerWidth)),
    y: Math.max(0, Math.min(newY, windowHeight - playerHeight))
  }
}

function stopDrag() {
  isDragging.value = false
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
}

function handleClick(e: MouseEvent) {
  if (hasMoved.value) {
    e.preventDefault()
    e.stopPropagation()
  }
  hasMoved.value = false
}

onUnmounted(() => {
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
})
</script>

<template>
  <Transition name="slide-up">
    <div
      v-if="hasSong"
      ref="playerRef"
      class="floating-player"
      :class="{ dragging: isDragging }"
      :style="{
        left: position.x ? `${position.x}px` : 'auto',
        top: position.y ? `${position.y}px` : 'auto',
        right: position.x ? 'auto' : '20px',
        bottom: position.y ? 'auto' : '20px'
      }"
    >
      <div
        class="drag-handle"
        @mousedown="startDrag"
        @click="handleClick"
      >
        <div class="player-cover" @click.stop="goToMusicPage">
          <img v-if="currentCover" :src="currentCover" alt="cover" />
          <AlbumIcon v-else :size="32" class="cover-placeholder" />
        </div>

        <div class="player-main">
          <div class="song-info" @click.stop="goToMusicPage">
            <span class="song-title">{{ currentSong?.title }}</span>
            <span class="song-artist">{{ currentSong?.artist }}</span>
          </div>

          <div class="mini-progress">
            <div class="mini-progress-fill" :style="{ width: `${progress}%` }"></div>
          </div>

          <div class="mini-controls">
            <button class="ctrl-btn" @mousedown.stop @click.stop="prev" title="上一首">
              <PrevIcon :size="16" />
            </button>
            <button class="ctrl-btn play" @mousedown.stop @click.stop="togglePlay">
              <PauseIcon v-if="isPlaying" :size="18" />
              <PlayIcon v-else :size="18" />
            </button>
            <button class="ctrl-btn" @mousedown.stop @click.stop="next" title="下一首">
              <NextIcon :size="16" />
            </button>
          </div>

          <div class="time-display">
            {{ formatTime(currentTime) }} / {{ formatTime(duration) }}
          </div>
        </div>

        <button class="close-btn" @mousedown.stop @click.stop="hidePlayer" title="关闭">
          <CloseIcon :size="14" />
        </button>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.floating-player {
  position: fixed;
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  transition: box-shadow 0.3s ease;
  user-select: none;
}

.floating-player:hover {
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.2);
}

.floating-player.dragging {
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25);
  cursor: grabbing;
}

.drag-handle {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  cursor: grab;
}

.drag-handle:active {
  cursor: grabbing;
}

.player-cover {
  width: 48px;
  height: 48px;
  border-radius: 6px;
  overflow: hidden;
  background: var(--vp-c-bg-soft);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  transition: transform 0.2s;
}

.player-cover:hover {
  transform: scale(1.05);
}

.player-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cover-placeholder {
  color: var(--vp-c-text-3);
}

.player-main {
  flex: 1;
  min-width: 200px;
}

.song-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-bottom: 6px;
  cursor: pointer;
}

.song-info:hover .song-title {
  color: var(--vp-c-brand-1);
}

.song-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--vp-c-text-1);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.song-artist {
  font-size: 0.75rem;
  color: var(--vp-c-text-2);
}

.mini-progress {
  height: 3px;
  background: var(--vp-c-divider);
  border-radius: 2px;
  margin-bottom: 8px;
  overflow: hidden;
}

.mini-progress-fill {
  height: 100%;
  background: var(--vp-c-text-1);
  transition: width 0.1s linear;
}

.mini-controls {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
}

.ctrl-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 6px;
  border-radius: 50%;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--vp-c-text-1);
}

.ctrl-btn:hover {
  background: var(--vp-c-default-soft);
}

.ctrl-btn.play {
  background: var(--vp-c-text-1);
  color: var(--vp-c-bg);
  width: 32px;
  height: 32px;
}

.ctrl-btn.play:hover {
  background: var(--vp-c-text-2);
}

.close-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  border-radius: 50%;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--vp-c-text-3);
  flex-shrink: 0;
  align-self: flex-start;
}

.close-btn:hover {
  background: var(--vp-c-default-soft);
  color: var(--vp-c-text-1);
}

.time-display {
  text-align: center;
  font-size: 0.7rem;
  color: var(--vp-c-text-3);
  margin-top: 4px;
  font-variant-numeric: tabular-nums;
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

@media (max-width: 640px) {
  .floating-player {
    left: 16px !important;
    right: 16px !important;
    bottom: 16px !important;
    top: auto !important;
  }

  .player-main {
    min-width: auto;
  }
}
</style>
