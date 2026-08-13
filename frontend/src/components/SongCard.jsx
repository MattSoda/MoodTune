import { useState } from 'react'
import { isUsableSpotifyTrackId } from '../utils/spotify'

export default function SongCard({ song, onFavorite, onRemove, isFavorite = false, isSpotifyPlayerActive = false, onToggleSpotifyPlayer }) {
  const hasSpotifyPlayback = typeof onToggleSpotifyPlayer === 'function' && isUsableSpotifyTrackId(song.track_id)
  const spotifyTrackId = hasSpotifyPlayback ? song.track_id.trim() : null
  const [artworkUrl, setArtworkUrl] = useState(song.album_image_url || song.image_url || song.cover_url || '')
  const [artworkRequested, setArtworkRequested] = useState(false)

  const loadArtwork = async () => {
    if (!hasSpotifyPlayback || artworkUrl || artworkRequested || import.meta.env.MODE === 'test') return
    setArtworkRequested(true)
    try {
      const spotifyUrl = `https://open.spotify.com/track/${spotifyTrackId}`
      const response = await fetch(`https://open.spotify.com/oembed?url=${encodeURIComponent(spotifyUrl)}`)
      if (!response.ok) return
      const metadata = await response.json()
      if (metadata.thumbnail_url) setArtworkUrl(metadata.thumbnail_url)
    } catch {
      // The generated disc remains visible if Spotify artwork is unavailable.
    }
  }

  const handleCardClick = (event) => {
    if (!hasSpotifyPlayback || event.target.closest('button, a, input, iframe')) return
    onToggleSpotifyPlayer(spotifyTrackId)
  }

  return (
    <article onClick={handleCardClick} onMouseEnter={loadArtwork} onFocusCapture={loadArtwork} className={`surface group flex min-w-0 flex-col gap-4 overflow-hidden p-4 transition duration-200 hover:-translate-y-0.5 hover:border-lavender-300/25 hover:shadow-[0_22px_60px_rgba(0,0,0,.4)] sm:p-5 ${hasSpotifyPlayback ? 'cursor-pointer' : ''}`}>
      <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center">
        {hasSpotifyPlayback && <div className={`song-artwork ${isSpotifyPlayerActive ? 'song-artwork-playing' : ''}`}>
          {artworkUrl ? <img src={artworkUrl} alt={`${song.track_name} cover artwork`} /> : <span className="song-artwork-fallback" aria-hidden="true">♪</span>}
        </div>}
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-lg font-semibold tracking-[-0.02em] text-white transition group-hover:text-lavender-100">{song.track_name}</h2>
          <p className="mt-0.5 truncate text-sm text-zinc-400">{song.artists}</p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-zinc-300"><span className="badge capitalize">{song.predicted_mood || song.mood}</span><span className="badge">{song.genres || song.track_genres}</span><span className="badge">Popularity {song.popularity}</span>{song.recommendation_score !== undefined && <span className="rounded-full border border-lavender-300/20 bg-lavender-300/[0.1] px-2.5 py-1 font-medium text-lavender-200">Match score {song.recommendation_score}</span>}</div>
        </div>
        <div className="flex min-w-0 flex-wrap items-center gap-2 [&>*]:max-sm:flex-1 [&>*]:max-sm:text-center">
          {hasSpotifyPlayback && <><button type="button" className="button-secondary text-sm" aria-expanded={isSpotifyPlayerActive} onClick={() => onToggleSpotifyPlayer(spotifyTrackId)}>{isSpotifyPlayerActive ? 'Hide player' : 'Play'}</button><a className="rounded-xl px-2 py-2.5 text-sm font-medium text-emerald-300 transition hover:bg-emerald-300/[0.06] hover:text-emerald-200" href={`https://open.spotify.com/track/${spotifyTrackId}`} target="_blank" rel="noopener noreferrer">Open in Spotify ↗</a></>}
          {onFavorite && !isFavorite && <button type="button" onClick={() => onFavorite(song.track_id)} className="button-secondary text-sm">Save favorite</button>}
          {onRemove && <button type="button" onClick={() => onRemove(song.track_id)} className="rounded-xl border border-rose-400/35 px-3 py-2.5 text-sm text-rose-100 transition hover:border-rose-300/60 hover:bg-rose-400/[0.08]">Remove</button>}
        </div>
      </div>
    </article>
  )
}
