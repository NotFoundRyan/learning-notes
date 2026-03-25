import { ref, computed } from 'vue'
import type { Ref } from 'vue'

export interface Song {
  id: number
  title: string
  artist: string
  src: string
  lyric?: string
  cover?: string
}

export interface Playlist {
  id: string
  name: string
  description?: string
  cover?: string
  songs: Song[]
}

export interface LyricLine {
  time: number
  text: string
}

export type PlayMode = 'sequence' | 'loop' | 'single' | 'shuffle'

declare global {
  interface Window {
    __musicAudio?: HTMLAudioElement
  }
}

function getGlobalAudio(): HTMLAudioElement | null {
  return window.__musicAudio || null
}

function setGlobalAudio(audio: HTMLAudioElement) {
  window.__musicAudio = audio
}

const playlists: Ref<Playlist[]> = ref([])
const currentPlaylistId = ref<string>('default')
const currentPlaylistSongs: Ref<Song[]> = ref([])
const currentIndex = ref(-1)
const isPlaying = ref(false)
const currentTime = ref(0)
const duration = ref(0)
const volume = ref(0.8)
const playMode = ref<PlayMode>('sequence')
const lyrics = ref<LyricLine[]>([])
const currentLyricIndex = ref(-1)
const isPlayerVisible = ref(false)
const songCovers: Ref<Map<number, string>> = ref(new Map())

const currentSong = computed(() => {
  if (currentIndex.value >= 0 && currentIndex.value < currentPlaylistSongs.value.length) {
    return currentPlaylistSongs.value[currentIndex.value]
  }
  return null
})

const currentPlaylist = computed(() => {
  return playlists.value.find(p => p.id === currentPlaylistId.value)
})

const progress = computed(() => {
  if (duration.value === 0) return 0
  return (currentTime.value / duration.value) * 100
})

const currentLyric = computed(() => {
  if (currentLyricIndex.value >= 0 && currentLyricIndex.value < lyrics.value.length) {
    return lyrics.value[currentLyricIndex.value].text
  }
  return ''
})

function parseLrc(lrcText: string): LyricLine[] {
  const lines = lrcText.split('\n')
  const result: LyricLine[] = []
  const timeRegex = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/g

  for (const line of lines) {
    const matches = [...line.matchAll(timeRegex)]
    if (matches.length > 0) {
      const text = line.replace(timeRegex, '').trim()
      if (text) {
        for (const match of matches) {
          const minutes = parseInt(match[1])
          const seconds = parseInt(match[2])
          const milliseconds = parseInt(match[3].padEnd(3, '0'))
          const time = minutes * 60 + seconds + milliseconds / 1000
          result.push({ time, text })
        }
      }
    }
  }

  return result.sort((a, b) => a.time - b.time)
}

async function loadLyric(lyricUrl?: string) {
  lyrics.value = []
  currentLyricIndex.value = -1

  if (!lyricUrl) return

  try {
    const response = await fetch(lyricUrl)
    if (response.ok) {
      const lrcText = await response.text()
      lyrics.value = parseLrc(lrcText)
    }
  } catch (error) {
    console.error('Failed to load lyric:', error)
  }
}

async function extractFlacCover(audioUrl: string, songId: number): Promise<string | null> {
  try {
    const response = await fetch(audioUrl)
    if (!response.ok) return null

    const buffer = await response.arrayBuffer()
    const view = new DataView(buffer)

    const fLaC = 0x664C6143
    if (view.getUint32(0) !== fLaC) return null

    let offset = 4
    while (offset < buffer.byteLength) {
      const isLast = (view.getUint8(offset) & 0x80) !== 0
      const type = view.getUint8(offset) & 0x7F
      const length = (view.getUint8(offset + 1) << 16) | (view.getUint8(offset + 2) << 8) | view.getUint8(offset + 3)

      if (type === 4) {
        const pictureData = new Uint8Array(buffer, offset + 4, length)
        let picOffset = 0

        picOffset += 4

        const mimeLen = (pictureData[picOffset] << 24) | (pictureData[picOffset + 1] << 16) | (pictureData[picOffset + 2] << 8) | pictureData[picOffset + 3]
        picOffset += 4 + mimeLen

        const descLen = (pictureData[picOffset] << 24) | (pictureData[picOffset + 1] << 16) | (pictureData[picOffset + 2] << 8) | pictureData[picOffset + 3]
        picOffset += 4 + descLen

        picOffset += 4 + 4

        picOffset += 4
        picOffset += 4

        picOffset += 4 + 4

        const picDataLen = (pictureData[picOffset] << 24) | (pictureData[picOffset + 1] << 16) | (pictureData[picOffset + 2] << 8) | pictureData[picOffset + 3]
        picOffset += 4

        const imageData = pictureData.slice(picOffset, picOffset + picDataLen)
        const blob = new Blob([imageData], { type: 'image/jpeg' })
        const coverUrl = URL.createObjectURL(blob)
        songCovers.value.set(songId, coverUrl)
        return coverUrl
      }

      offset += 4 + length
      if (isLast) break
    }
  } catch (error) {
    console.error('Failed to extract FLAC cover:', error)
  }
  return null
}

function initAudio() {
  const existingAudio = getGlobalAudio()
  if (existingAudio) return

  const audio = new Audio()
  audio.volume = volume.value

  audio.addEventListener('timeupdate', () => {
    currentTime.value = audio.currentTime
    updateCurrentLyric()
  })

  audio.addEventListener('loadedmetadata', () => {
    duration.value = audio.duration
  })

  audio.addEventListener('ended', () => {
    handleSongEnd()
  })

  audio.addEventListener('error', (e) => {
    console.error('Audio error:', e)
  })

  audio.addEventListener('play', () => {
    isPlaying.value = true
  })

  audio.addEventListener('pause', () => {
    isPlaying.value = false
  })

  setGlobalAudio(audio)
}

function updateCurrentLyric() {
  if (lyrics.value.length === 0) return

  for (let i = lyrics.value.length - 1; i >= 0; i--) {
    if (currentTime.value >= lyrics.value[i].time) {
      currentLyricIndex.value = i
      return
    }
  }
  currentLyricIndex.value = -1
}

function handleSongEnd() {
  const audio = getGlobalAudio()
  switch (playMode.value) {
    case 'single':
      if (audio) {
        audio.currentTime = 0
        audio.play()
      }
      break
    case 'loop':
      next()
      break
    case 'shuffle':
      playRandom()
      break
    case 'sequence':
    default:
      if (currentIndex.value < currentPlaylistSongs.value.length - 1) {
        next()
      } else {
        isPlaying.value = false
      }
  }
}

async function loadPlaylists() {
  try {
    const response = await fetch('/learning-notes/music/playlist.json')
    if (response.ok) {
      const data = await response.json()
      playlists.value = data.playlists || []
      if (playlists.value.length > 0 && currentPlaylistSongs.value.length === 0) {
        selectPlaylist(playlists.value[0].id)
      }
    }
  } catch (error) {
    console.error('Failed to load playlists:', error)
  }
}

function selectPlaylist(playlistId: string) {
  currentPlaylistId.value = playlistId
  const playlist = playlists.value.find(p => p.id === playlistId)
  if (playlist) {
    currentPlaylistSongs.value = playlist.songs
  }
}

async function playSong(index: number) {
  if (index < 0 || index >= currentPlaylistSongs.value.length) return

  initAudio()
  currentIndex.value = index
  isPlayerVisible.value = true

  const audio = getGlobalAudio()
  if (audio && currentSong.value) {
    audio.src = currentSong.value.src
    await loadLyric(currentSong.value.lyric)

    if (!songCovers.value.has(currentSong.value.id)) {
      extractFlacCover(currentSong.value.src, currentSong.value.id)
    }

    await audio.play()
  }
}

function togglePlay() {
  const audio = getGlobalAudio()
  if (!audio) return

  if (isPlaying.value) {
    audio.pause()
  } else {
    audio.play()
  }
}

function pause() {
  const audio = getGlobalAudio()
  if (audio && isPlaying.value) {
    audio.pause()
  }
}

function play() {
  const audio = getGlobalAudio()
  if (audio && !isPlaying.value) {
    audio.play()
  }
}

function next() {
  if (currentPlaylistSongs.value.length === 0) return

  let nextIndex: number

  if (playMode.value === 'shuffle') {
    nextIndex = Math.floor(Math.random() * currentPlaylistSongs.value.length)
  } else {
    nextIndex = (currentIndex.value + 1) % currentPlaylistSongs.value.length
  }

  playSong(nextIndex)
}

function prev() {
  if (currentPlaylistSongs.value.length === 0) return

  let prevIndex: number

  if (playMode.value === 'shuffle') {
    prevIndex = Math.floor(Math.random() * currentPlaylistSongs.value.length)
  } else {
    prevIndex = currentIndex.value - 1
    if (prevIndex < 0) prevIndex = currentPlaylistSongs.value.length - 1
  }

  playSong(prevIndex)
}

function playRandom() {
  if (currentPlaylistSongs.value.length === 0) return
  const randomIndex = Math.floor(Math.random() * currentPlaylistSongs.value.length)
  playSong(randomIndex)
}

function seek(time: number) {
  const audio = getGlobalAudio()
  if (audio) {
    audio.currentTime = time
    currentTime.value = time
  }
}

function seekByPercent(percent: number) {
  const time = (percent / 100) * duration.value
  seek(time)
}

function setVolume(vol: number) {
  volume.value = vol
  const audio = getGlobalAudio()
  if (audio) {
    audio.volume = vol
  }
}

function togglePlayMode() {
  const modes: PlayMode[] = ['sequence', 'loop', 'single', 'shuffle']
  const currentModeIndex = modes.indexOf(playMode.value)
  playMode.value = modes[(currentModeIndex + 1) % modes.length]
}

function hidePlayer() {
  isPlayerVisible.value = false
}

function showPlayer() {
  isPlayerVisible.value = true
}

function getSongCover(songId: number): string | undefined {
  return songCovers.value.get(songId)
}

export function useMusicStore() {
  return {
    playlists,
    currentPlaylistId,
    currentPlaylist,
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
    currentLyric,
    isPlayerVisible,
    songCovers,
    loadPlaylists,
    selectPlaylist,
    playSong,
    togglePlay,
    play,
    pause,
    next,
    prev,
    seek,
    seekByPercent,
    setVolume,
    togglePlayMode,
    hidePlayer,
    showPlayer,
    initAudio,
    getSongCover,
    extractFlacCover
  }
}
