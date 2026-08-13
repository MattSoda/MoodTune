import { useEffect, useRef, useState } from 'react'
import { usePlayer } from '../context/PlayerContext'
import SpotifyPlayer from './SpotifyPlayer'

export default function PersistentSpotifyPlayer() {
  const {
    playlist,
    currentTrackIndex,
    currentTrack,
    isPlayerOpen,
    isPlaying,
    autoplayOnLoad,
    closePlayer,
    previousTrack,
    nextTrack,
    setIsPlaying,
  } = usePlayer()
  const spotifyPlayer = useRef(null)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    if (!isPlayerOpen) setIsReady(false)
  }, [isPlayerOpen])

  if (!isPlayerOpen || !currentTrack) return null

  const togglePlayback = () => {
    if (!isReady) return
    if (isPlaying) {
      spotifyPlayer.current?.pause()
      setIsPlaying(false)
    } else {
      spotifyPlayer.current?.play()
      setIsPlaying(true)
    }
  }

  return (
    <aside
      aria-label="Persistent Spotify player"
      className="fixed inset-x-2 bottom-2 z-40 max-h-[calc(100vh-1rem)] overflow-y-auto rounded-2xl border border-lavender-300/20 bg-[#0c0c0f]/95 p-3 shadow-[0_24px_80px_rgba(0,0,0,.78),0_0_35px_rgba(139,92,246,.13)] backdrop-blur-xl sm:inset-x-auto sm:bottom-4 sm:right-4 sm:w-[min(34rem,calc(100vw-2rem))] sm:p-4"
      data-testid="persistent-spotify-player"
    >
      <div className="flex min-w-0 items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white">{currentTrack.track_name || 'Untitled track'}</p>
          <p className="mt-0.5 truncate text-xs text-zinc-400">{currentTrack.artists || 'Unknown artist'}</p>
        </div>
        <a className="shrink-0 rounded-lg px-2 py-1.5 text-xs font-medium text-emerald-300 transition hover:bg-emerald-300/[0.07]" href={`https://open.spotify.com/track/${currentTrack.track_id.trim()}`} target="_blank" rel="noopener noreferrer">Open in Spotify ↗</a>
        <button type="button" aria-label="Close player" title="Close" onClick={closePlayer} className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-white/[0.09] text-lg text-zinc-400 transition hover:border-rose-300/40 hover:bg-rose-400/[0.08] hover:text-rose-100">×</button>
      </div>

      <div className="mt-3">
        <SpotifyPlayer
          ref={spotifyPlayer}
          trackId={currentTrack.track_id}
          autoplayOnLoad={autoplayOnLoad}
          onPlaybackStateChange={setIsPlaying}
          onReadyChange={setIsReady}
        />
      </div>

      <div className="mt-3 flex items-center justify-center gap-2" aria-label="Player controls">
        <button type="button" aria-label="Previous track" title="Previous" disabled={currentTrackIndex === 0} onClick={previousTrack} className="button-secondary grid h-10 w-12 place-items-center p-0 text-lg disabled:cursor-not-allowed disabled:opacity-35">⏮</button>
        <button type="button" aria-label={isPlaying ? 'Pause' : 'Play'} title={isPlaying ? 'Pause' : 'Play'} disabled={!isReady} onClick={togglePlayback} className="button-primary grid h-10 min-w-14 place-items-center px-4 text-base disabled:cursor-wait">{isPlaying ? '⏸' : '▶'}</button>
        <button type="button" aria-label="Next track" title="Next" disabled={currentTrackIndex === playlist.length - 1} onClick={nextTrack} className="button-secondary grid h-10 w-12 place-items-center p-0 text-lg disabled:cursor-not-allowed disabled:opacity-35">⏭</button>
      </div>
    </aside>
  )
}
