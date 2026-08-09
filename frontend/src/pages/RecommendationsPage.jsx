import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import ErrorMessage from '../components/ErrorMessage'
import LoadingState from '../components/LoadingState'
import SongCard from '../components/SongCard'
import { useAuth } from '../context/AuthContext'
import { moodTuneApi } from '../services/moodTuneApi'

export default function RecommendationsPage() {
  const { state } = useLocation()
  const { user } = useAuth()
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(Boolean(state?.mood && state?.mode))
  const [notice, setNotice] = useState('')
  const [activeTrackId, setActiveTrackId] = useState(null)

  useEffect(() => {
    if (!state?.mood || !state?.mode) return
    setActiveTrackId(null)
    moodTuneApi.recommend({ mood: state.mood, mode: state.mode, activity: state.activity, preferred_genres: state.preferredGenres, limit: 20 })
      .then(setResult).catch((requestError) => setError(requestError.message)).finally(() => setIsLoading(false))
  }, [state?.mood, state?.mode, state?.activity, state?.preferredGenres])

  const saveFavorite = async (trackId) => {
    try { await moodTuneApi.addFavorite(trackId); setNotice('Saved to favorites.') }
    catch (requestError) { setError(requestError.message) }
  }

  const toggleSpotifyPlayer = (trackId) => {
    setActiveTrackId((currentTrackId) => currentTrackId === trackId ? null : trackId)
  }

  if (!state?.mood || !state?.mode) return <section className="space-y-4"><h1 className="text-3xl font-bold">Recommendations</h1><p className="text-slate-300">Choose a mood and recommendation mode first.</p><Link className="text-violet-300 underline" to="/">Choose my mood</Link></section>
  return (
    <section className="space-y-6"><div><p className="text-sm font-semibold uppercase tracking-[0.18em] text-violet-300">Personalized selection</p><h1 className="page-title mt-2">Your recommendations</h1><div className="surface mt-4 flex flex-wrap gap-x-5 gap-y-2 p-4 text-sm text-slate-300"><span>Current mood: <strong className="capitalize text-white">{result?.current_mood || state.mood}</strong></span><span>Mode: <strong className="text-white">{state.mode === 'feel_better' ? 'Make Me Feel Better' : 'Match My Mood'}</strong></span><span>Target: <strong className="capitalize text-white">{result?.target_mood || '…'}</strong></span>{state.activity && <span>Activity: <strong className="capitalize text-white">{state.activity}</strong></span>}{state.preferredGenres?.length > 0 && <span>Genres: <strong className="text-white">{state.preferredGenres.join(', ')}</strong></span>}</div></div>
      {isLoading && <LoadingState label="Finding songs that fit your target mood…" />}
      <ErrorMessage message={error} />
      {notice && <p className="text-sm text-emerald-200">{notice}</p>}
      <div className="space-y-3">{result?.recommendations.map((song) => <SongCard key={song.track_id} song={song} onFavorite={user ? saveFavorite : undefined} isSpotifyPlayerActive={typeof song.track_id === 'string' && activeTrackId === song.track_id.trim()} onToggleSpotifyPlayer={toggleSpotifyPlayer} />)}</div>
      {result && <p className="text-sm text-slate-400">Tracks are selected to match the {result.target_mood} musical profile. They are not a medical treatment or guarantee of mood improvement.</p>}
    </section>
  )
}
