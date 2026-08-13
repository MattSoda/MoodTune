import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import ErrorMessage from '../components/ErrorMessage'
import LoadingState from '../components/LoadingState'
import SongCard from '../components/SongCard'
import { useAuth } from '../context/AuthContext'
import { usePlayer } from '../context/PlayerContext'
import { moodTuneApi } from '../services/moodTuneApi'
import { clearRecommendationDraft, readRecommendationDraft } from '../utils/recommendationDraft'

export default function RecommendationsPage() {
  const { state } = useLocation()
  const { user } = useAuth()
  const { currentTrack, isPlayerOpen, openPlayer, closePlayer } = usePlayer()
  const [selection] = useState(() => state?.mood && state?.mode ? state : readRecommendationDraft())
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(Boolean(selection?.mood && selection?.mode))
  const [notice, setNotice] = useState('')

  useEffect(() => {
    if (!selection?.mood || !selection?.mode) return
    clearRecommendationDraft()
    moodTuneApi.recommend({
      mood: selection.mood,
      mode: selection.mode,
      activity: selection.activity,
      preferred_genres: selection.preferredGenres,
      limit: 20,
    }).then(setResult).catch((requestError) => setError(requestError.message)).finally(() => setIsLoading(false))
  }, [selection])

  const saveFavorite = async (trackId) => {
    try {
      await moodTuneApi.addFavorite(trackId)
      setNotice('Saved to favorites.')
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  const toggleSpotifyPlayer = (trackId, index) => {
    if (isPlayerOpen && currentTrack?.track_id?.trim() === trackId) closePlayer()
    else openPlayer(result?.recommendations || [], index)
  }

  if (!selection?.mood || !selection?.mode) return <section className="content-page"><div className="page-header"><p className="page-eyebrow">Personalized selection</p><h1 className="page-title">Recommendations</h1><p className="page-copy">Choose a mood and recommendation mode first.</p></div><Link className="button-primary inline-flex" to="/">Choose my mood</Link></section>
  return <section className="content-page">
    <div className="page-header"><p className="page-eyebrow">Personalized selection</p><h1 className="page-title">Your recommendations</h1></div>
    <div className="surface flex flex-wrap gap-2 p-4 text-sm sm:p-5"><span className="badge">Current mood: <strong className="ml-1 capitalize text-white">{result?.current_mood || selection.mood}</strong></span><span className="badge">Mode: <strong className="ml-1 text-white">{selection.mode === 'feel_better' ? 'Make Me Feel Better' : 'Match My Mood'}</strong></span><span className="badge">Target: <strong className="ml-1 capitalize text-lavender-200">{result?.target_mood || '…'}</strong></span>{selection.activity && <span className="badge">Activity: <strong className="ml-1 capitalize text-white">{selection.activity}</strong></span>}{selection.preferredGenres?.length > 0 && <span className="badge">Genres: <strong className="ml-1 text-white">{selection.preferredGenres.join(', ')}</strong></span>}</div>
    {isLoading && <LoadingState label="Finding songs that fit your target mood…" />}<ErrorMessage message={error} />{notice && <p className="notice-success">{notice}</p>}<div className="space-y-3">{result?.recommendations.map((song, index) => <SongCard key={song.track_id || `recommendation-${index}`} song={song} onFavorite={user ? saveFavorite : undefined} isSpotifyPlayerActive={isPlayerOpen && typeof song.track_id === 'string' && currentTrack?.track_id?.trim() === song.track_id.trim()} onToggleSpotifyPlayer={(trackId) => toggleSpotifyPlayer(trackId, index)} />)}</div>{result && <p className="border-t border-white/[0.07] pt-4 text-xs leading-5 text-zinc-600">Tracks are selected to match the {result.target_mood} musical profile. They are not a medical treatment or guarantee of mood improvement.</p>}
  </section>
}
