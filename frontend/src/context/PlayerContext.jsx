import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { isUsableSpotifyTrackId } from '../utils/spotify'

const PlayerContext = createContext(null)

function playableTracks(tracks) {
  return Array.isArray(tracks)
    ? tracks.filter((track) => isUsableSpotifyTrackId(track?.track_id))
    : []
}

export function PlayerProvider({ children }) {
  const [playlist, setPlaylist] = useState([])
  const [currentTrackIndex, setCurrentTrackIndex] = useState(-1)
  const [isPlayerOpen, setIsPlayerOpen] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [autoplayOnLoad, setAutoplayOnLoad] = useState(false)

  const currentTrack = playlist[currentTrackIndex] || null

  const openPlayer = useCallback((tracks, requestedIndex) => {
    if (!Array.isArray(tracks) || !Number.isInteger(requestedIndex)) return false
    const requestedTrack = tracks[requestedIndex]
    if (!isUsableSpotifyTrackId(requestedTrack?.track_id)) return false

    const nextPlaylist = playableTracks(tracks)
    const nextIndex = nextPlaylist.indexOf(requestedTrack)
    if (nextIndex < 0) return false

    setPlaylist(nextPlaylist)
    setCurrentTrackIndex(nextIndex)
    setAutoplayOnLoad(true)
    setIsPlaying(false)
    setIsPlayerOpen(true)
    return true
  }, [])

  const closePlayer = useCallback(() => {
    setIsPlayerOpen(false)
    setIsPlaying(false)
    setAutoplayOnLoad(false)
    setPlaylist([])
    setCurrentTrackIndex(-1)
  }, [])

  const previousTrack = useCallback(() => {
    if (currentTrackIndex <= 0) return
    setAutoplayOnLoad(false)
    setIsPlaying(false)
    setCurrentTrackIndex(currentTrackIndex - 1)
  }, [currentTrackIndex])

  const nextTrack = useCallback(() => {
    if (currentTrackIndex < 0 || currentTrackIndex >= playlist.length - 1) return
    setAutoplayOnLoad(false)
    setIsPlaying(false)
    setCurrentTrackIndex(currentTrackIndex + 1)
  }, [currentTrackIndex, playlist.length])

  const value = useMemo(() => ({
    playlist,
    currentTrackIndex,
    currentTrack,
    isPlayerOpen,
    isPlaying,
    autoplayOnLoad,
    openPlayer,
    closePlayer,
    previousTrack,
    nextTrack,
    setIsPlaying,
  }), [
    playlist,
    currentTrackIndex,
    currentTrack,
    isPlayerOpen,
    isPlaying,
    autoplayOnLoad,
    openPlayer,
    closePlayer,
    previousTrack,
    nextTrack,
  ])

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>
}

export function usePlayer() {
  const context = useContext(PlayerContext)
  if (!context) throw new Error('usePlayer must be used inside PlayerProvider.')
  return context
}
