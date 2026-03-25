<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useMusicStore } from '../composables/useMusicStore'
import PlayIcon from './icons/PlayIcon.vue'
import PauseIcon from './icons/PauseIcon.vue'
import PrevIcon from './icons/PrevIcon.vue'
import NextIcon from './icons/NextIcon.vue'
import VolumeIcon from './icons/VolumeIcon.vue'
import VolumeMuteIcon from './icons/VolumeMuteIcon.vue'
import LoopIcon from './icons/LoopIcon.vue'
import RepeatIcon from './icons/RepeatIcon.vue'
import ShuffleIcon from './icons/ShuffleIcon.vue'
import PlaylistIcon from './icons/PlaylistIcon.vue'
import LyricIcon from './icons/LyricIcon.vue'
import AlbumIcon from './icons/AlbumIcon.vue'

const {
  currentPlaylistSongs,
  currentIndex,
  currentSong,
  isPlaying,
  currentTime,
  duration,
  progress,
  volume,
  playMode,
  lyrics,
  currentLyricIndex,
  loadPlaylists,
  playSong,
  togglePlay,
  next,
  prev,
  seekByPercent,
  setVolume,
  togglePlayMode,
  getSongCover
} = useMusicStore()

const showPlaylist = ref(true)
const showLyrics = ref(true)
const progressRef = ref<HTMLElement | null>(null)
const volumeRef = ref<HTMLElement | null>(null)
const lyricContainerRef = ref<HTMLElement | null>(null)

const isDragging = ref(false)
const isDraggingVolume = ref(false)

const playModeIcon = computed(() => {
  switch (playMode.value) {
    case 'sequence': return RepeatIcon
    case 'loop': return LoopIcon
    case 'single': return RepeatIcon
    case 'shuffle': return ShuffleIcon
    default: return RepeatIcon
  }
})

const playModeTitle = computed(() => {
  switch (playMode.value) {
    case 'sequence': return '顺序播放'
    case 'loop': return '列表循环'
    case 'single': return '单曲循环'
    case 'shuffle': return '随机播放'
    default: return '顺序播放'
  }
})

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

function handleProgressClick(e: MouseEvent) {
  if (!progressRef.value) return
  const rect = progressRef.value.getBoundingClientRect()
  const percent = ((e.clientX - rect.left) / rect.width) * 100
  seekByPercent(Math.max(0, Math.min(100, percent)))
}

function handleProgressDrag(e: MouseEvent) {
  if (!isDragging.value || !progressRef.value) return
  const rect = progressRef.value.getBoundingClientRect()
  const percent = ((e.clientX - rect.left) / rect.width) * 100
  seekByPercent(Math.max(0, Math.min(100, percent)))
}

function startDrag() {
  isDragging.value = true
  document.addEventListener('mousemove', handleProgressDrag)
  document.addEventListener('mouseup', stopDrag)
}

function stopDrag() {
  isDragging.value = false
  document.removeEventListener('mousemove', handleProgressDrag)
  document.removeEventListener('mouseup', stopDrag)
}

function handleVolumeClick(e: MouseEvent) {
  if (!volumeRef.value) return
  const rect = volumeRef.value.getBoundingClientRect()
  const percent = ((e.clientX - rect.left) / rect.width) * 100
  setVolume(Math.max(0, Math.min(1, percent / 100)))
}

function handleVolumeDrag(e: MouseEvent) {
  if (!isDraggingVolume.value || !volumeRef.value) return
  const rect = volumeRef.value.getBoundingClientRect()
  const percent = ((e.clientX - rect.left) / rect.width) * 100
  setVolume(Math.max(0, Math.min(1, percent / 100)))
}

function startVolumeDrag() {
  isDraggingVolume.value = true
  document.addEventListener('mousemove', handleVolumeDrag)
  document.addEventListener('mouseup', stopVolumeDrag)
}

function stopVolumeDrag() {
  isDraggingVolume.value = false
  document.removeEventListener('mousemove', handleVolumeDrag)
  document.removeEventListener('mouseup', stopVolumeDrag)
}

function scrollToCurrentLyric() {
  nextTick(() => {
    if (!lyricContainerRef.value || currentLyricIndex.value < 0) return
    const container = lyricContainerRef.value
    const activeElement = container.querySelector('.lyric-line.active')
    if (activeElement) {
      const containerHeight = container.clientHeight
      const elementTop = (activeElement as HTMLElement).offsetTop
      const elementHeight = (activeElement as HTMLElement).clientHeight
      container.scrollTop = elementTop - containerHeight / 2 + elementHeight / 2
    }
  })
}

watch(currentLyricIndex, () => {
  scrollToCurrentLyric()
})

onMounted(() => {
  loadPlaylists()
})
</script>

<template>
  <div class="music-player">
    <div class="player-main">
      <div class="cover-section">
        <div class="cover-wrapper">
          <img v-if="currentCover" :src="currentCover" alt="cover" class="cover-image" />
          <AlbumIcon v-else :size="80" class="cover-placeholder" />
        </div>
      </div>

      <div class="info-section">
        <div class="song-info" v-if="currentSong">
          <span class="song-title">{{ currentSong.title }}</span>
          <span class="song-artist">{{ currentSong.artist }}</span>
        </div>

        <div class="progress-section">
          <span class="time">{{ formatTime(currentTime) }}</span>
          <div
            ref="progressRef"
            class="progress-bar"
            @click="handleProgressClick"
            @mousedown="startDrag"
          >
            <div class="progress-bg">
              <div class="progress-fill" :style="{ width: `${progress}%` }">
                <div class="progress-thumb"></div>
              </div>
            </div>
          </div>
          <span class="time">{{ formatTime(duration) }}</span>
        </div>

        <div class="controls-section">
          <div class="main-controls">
            <button class="control-btn" @click="prev" title="上一首">
              <PrevIcon :size="20" />
            </button>
            <button class="control-btn play-btn" @click="togglePlay">
              <PauseIcon v-if="isPlaying" :size="24" />
              <PlayIcon v-else :size="24" />
            </button>
            <button class="control-btn" @click="next" title="下一首">
              <NextIcon :size="20" />
            </button>
          </div>

          <div class="extra-controls">
            <button class="control-btn small" @click="togglePlayMode" :title="playModeTitle">
              <component :is="playModeIcon" :size="18" />
            </button>
            <div class="volume-control">
              <button class="control-btn small" @click="setVolume(volume > 0 ? 0 : 0.8)">
                <VolumeMuteIcon v-if="volume === 0" :size="18" />
                <VolumeIcon v-else :size="18" />
              </button>
              <div
                ref="volumeRef"
                class="volume-bar"
                @click="handleVolumeClick"
                @mousedown="startVolumeDrag"
              >
                <div class="volume-fill" :style="{ width: `${volume * 100}%` }"></div>
              </div>
            </div>
            <button class="control-btn small" @click="showLyrics = !showLyrics" title="歌词">
              <LyricIcon :size="18" />
            </button>
            <button class="control-btn small" @click="showPlaylist = !showPlaylist" title="播放列表">
              <PlaylistIcon :size="18" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="player-content">
      <div class="lyrics-section" v-if="showLyrics && lyrics.length > 0" ref="lyricContainerRef">
        <div
          v-for="(line, index) in lyrics"
          :key="index"
          class="lyric-line"
          :class="{ active: index === currentLyricIndex }"
        >
          {{ line.text }}
        </div>
      </div>

      <div class="playlist-section" v-if="showPlaylist">
        <div class="playlist-header">
          <span class="header-title">播放列表</span>
          <span class="header-count">{{ currentPlaylistSongs.length }} 首</span>
        </div>
        <div class="playlist-items">
          <div
            v-for="(song, index) in currentPlaylistSongs"
            :key="song.id"
            class="playlist-item"
            :class="{ active: index === currentIndex }"
            @click="playSong(index)"
          >
            <span class="item-index">{{ index + 1 }}</span>
            <div class="item-cover">
              <img v-if="getSongCover(song.id)" :src="getSongCover(song.id)" alt="cover" />
              <AlbumIcon v-else :size="32" />
            </div>
            <div class="item-info">
              <span class="item-title">{{ song.title }}</span>
              <span class="item-artist">{{ song.artist }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="empty-state" v-if="currentPlaylistSongs.length === 0">
      <p>暂无歌曲</p>
      <p class="hint">请将音频文件放入 public/music/songs/ 目录</p>
    </div>
  </div>
</template>

<style scoped>
.music-player {
  background: var(--vp-c-bg-soft);
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid var(--vp-c-divider);
}

.player-main {
  display: flex;
  gap: 24px;
  padding: 24px;
  border-bottom: 1px solid var(--vp-c-divider);
}

.cover-section {
  flex-shrink: 0;
}

.cover-wrapper {
  width: 160px;
  height: 160px;
  border-radius: 8px;
  overflow: hidden;
  background: var(--vp-c-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--vp-c-divider);
}

.cover-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cover-placeholder {
  color: var(--vp-c-text-3);
}

.info-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.song-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.song-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--vp-c-text-1);
}

.song-artist {
  font-size: 0.875rem;
  color: var(--vp-c-text-2);
}

.progress-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.time {
  font-size: 0.75rem;
  color: var(--vp-c-text-3);
  min-width: 40px;
  font-variant-numeric: tabular-nums;
}

.progress-bar {
  flex: 1;
  cursor: pointer;
  padding: 8px 0;
}

.progress-bg {
  height: 4px;
  background: var(--vp-c-divider);
  border-radius: 2px;
  position: relative;
}

.progress-fill {
  height: 100%;
  background: var(--vp-c-text-1);
  border-radius: 2px;
  position: relative;
  transition: width 0.1s linear;
}

.progress-thumb {
  position: absolute;
  right: -6px;
  top: 50%;
  transform: translateY(-50%);
  width: 12px;
  height: 12px;
  background: var(--vp-c-text-1);
  border-radius: 50%;
  opacity: 0;
  transition: opacity 0.2s;
}

.progress-bar:hover .progress-thumb {
  opacity: 1;
}

.controls-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.main-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

.extra-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.control-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--vp-c-text-1);
}

.control-btn:hover {
  background: var(--vp-c-default-soft);
}

.control-btn.small {
  padding: 6px;
}

.play-btn {
  background: var(--vp-c-text-1);
  color: var(--vp-c-bg);
  width: 48px;
  height: 48px;
}

.play-btn:hover {
  background: var(--vp-c-text-2);
}

.volume-control {
  display: flex;
  align-items: center;
  gap: 4px;
}

.volume-bar {
  width: 60px;
  height: 4px;
  background: var(--vp-c-divider);
  border-radius: 2px;
  cursor: pointer;
  position: relative;
}

.volume-fill {
  height: 100%;
  background: var(--vp-c-text-1);
  border-radius: 2px;
  transition: width 0.1s;
}

.player-content {
  display: flex;
  border-top: 1px solid var(--vp-c-divider);
}

.lyrics-section {
  flex: 1;
  max-height: 300px;
  overflow-y: auto;
  text-align: center;
  padding: 16px;
  background: var(--vp-c-bg);
  border-right: 1px solid var(--vp-c-divider);
  scroll-behavior: smooth;
}

.lyric-line {
  padding: 8px 0;
  color: var(--vp-c-text-3);
  transition: all 0.3s;
}

.lyric-line.active {
  color: var(--vp-c-text-1);
  font-weight: 600;
  font-size: 1.1em;
}

.playlist-section {
  flex: 1;
  background: var(--vp-c-bg);
  max-height: 300px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.playlist-header {
  padding: 12px 16px;
  font-weight: 600;
  border-bottom: 1px solid var(--vp-c-divider);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-title {
  color: var(--vp-c-text-1);
}

.header-count {
  font-size: 0.75rem;
  font-weight: 400;
  color: var(--vp-c-text-3);
}

.playlist-items {
  flex: 1;
  overflow-y: auto;
}

.playlist-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 16px;
  cursor: pointer;
  transition: background 0.2s;
}

.playlist-item:hover {
  background: var(--vp-c-default-soft);
}

.playlist-item.active {
  background: var(--vp-c-default-soft);
}

.item-index {
  color: var(--vp-c-text-3);
  font-size: 0.75rem;
  min-width: 20px;
  text-align: center;
}

.item-cover {
  width: 40px;
  height: 40px;
  border-radius: 4px;
  overflow: hidden;
  background: var(--vp-c-bg-soft);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--vp-c-text-3);
}

.item-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.item-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.item-title {
  font-size: 0.875rem;
  color: var(--vp-c-text-1);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-artist {
  font-size: 0.75rem;
  color: var(--vp-c-text-3);
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

@media (max-width: 640px) {
  .player-main {
    flex-direction: column;
    align-items: center;
  }

  .cover-wrapper {
    width: 200px;
    height: 200px;
  }

  .info-section {
    width: 100%;
  }

  .player-content {
    flex-direction: column;
  }

  .lyrics-section {
    border-right: none;
    border-bottom: 1px solid var(--vp-c-divider);
  }
}
</style>
