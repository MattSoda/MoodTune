import SpotifyPlayer, { isUsableSpotifyTrackId } from './SpotifyPlayer'

export default function SongCard({
  song,
  onFavorite,
  onRemove,
  isFavorite = false,
  isSpotifyPlayerActive = false,
  onToggleSpotifyPlayer,
}) {
  const hasSpotifyPlayback = typeof onToggleSpotifyPlayer === 'function' && isUsableSpotifyTrackId(song.track_id)
  const spotifyTrackId = hasSpotifyPlayback ? song.track_id.trim() : null

  return (
    <article className="surface flex min-w-0 flex-col gap-4 overflow-hidden p-4 transition hover:border-slate-700">
      <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-lg font-semibold">{song.track_name}</h2>
          <p className="truncate text-sm text-slate-300">{song.artists}</p>
          <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-300">
            <span className="badge capitalize">{song.predicted_mood || song.mood}</span>
            <span className="badge">{song.genres || song.track_genres}</span>
            <span className="badge">Popularity {song.popularity}</span>
            {song.recommendation_score !== undefined && <span className="rounded-full bg-violet-500/20 px-2.5 py-1 font-medium text-violet-200">Match score {song.recommendation_score}</span>}
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {hasSpotifyPlayback && (
            <>
              <button
                type="button"
                className="button-secondary text-sm text-violet-100"
                aria-expanded={isSpotifyPlayerActive}
                onClick={() => onToggleSpotifyPlayer(spotifyTrackId)}
              >
                {isSpotifyPlayerActive ? 'Hide player' : 'Play'}
              </button>
              <a
                className="rounded-lg px-2 py-2.5 text-sm font-medium text-emerald-300 transition hover:text-emerald-200"
                href={`https://open.spotify.com/track/${spotifyTrackId}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open in Spotify ↗
              </a>
            </>
          )}
          {onFavorite && !isFavorite && <button type="button" onClick={() => onFavorite(song.track_id)} className="button-secondary text-sm text-violet-100">Save favorite</button>}
          {onRemove && <button type="button" onClick={() => onRemove(song.track_id)} className="rounded-lg border border-rose-400/60 px-3 py-2.5 text-sm text-rose-100 transition hover:bg-rose-400/10">Remove</button>}
        </div>
      </div>
      {hasSpotifyPlayback && isSpotifyPlayerActive && <SpotifyPlayer trackId={spotifyTrackId} />}
    </article>
  )
}
