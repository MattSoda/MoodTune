export default function SongCard({ song, onFavorite, onRemove, isFavorite = false }) {
  return (
    <article className="surface flex flex-col gap-4 p-4 transition hover:border-slate-700 sm:flex-row sm:items-center">
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
      {onFavorite && !isFavorite && <button onClick={() => onFavorite(song.track_id)} className="button-secondary shrink-0 text-sm text-violet-100">Save favorite</button>}
      {onRemove && <button onClick={() => onRemove(song.track_id)} className="shrink-0 rounded-lg border border-rose-400/60 px-3 py-2.5 text-sm text-rose-100 transition hover:bg-rose-400/10">Remove</button>}
    </article>
  )
}
