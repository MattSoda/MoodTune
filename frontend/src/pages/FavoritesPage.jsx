import { useEffect, useState } from 'react'
import ErrorMessage from '../components/ErrorMessage'
import LoadingState from '../components/LoadingState'
import SongCard from '../components/SongCard'
import { moodTuneApi } from '../services/moodTuneApi'

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState([]); const [error, setError] = useState(''); const [isLoading, setIsLoading] = useState(true); const [activeTrackId, setActiveTrackId] = useState(null)
  const load = () => { setIsLoading(true); moodTuneApi.favorites().then((response) => setFavorites(response.favorites)).catch((requestError) => setError(requestError.message)).finally(() => setIsLoading(false)) }
  useEffect(load, [])
  const remove = async (trackId) => { try { await moodTuneApi.removeFavorite(trackId); setFavorites((items) => items.filter((song) => song.track_id !== trackId)); setActiveTrackId((current) => current === trackId ? null : current) } catch (requestError) { setError(requestError.message) } }
  const toggleSpotifyPlayer = (trackId) => setActiveTrackId((current) => current === trackId ? null : trackId)
  return <section className="space-y-6"><div><h1 className="text-3xl font-bold">Favorites</h1><p className="mt-2 text-slate-300">Songs you save can refine future recommendations. Play a saved Spotify track directly from this page.</p></div><ErrorMessage message={error} />{isLoading ? <LoadingState /> : favorites.length ? <div className="space-y-3">{favorites.map((song) => <SongCard key={song.track_id} song={song} onRemove={remove} isSpotifyPlayerActive={typeof song.track_id === 'string' && activeTrackId === song.track_id.trim()} onToggleSpotifyPlayer={toggleSpotifyPlayer} />)}</div> : <p className="text-slate-300">No favorites yet. Save songs from recommendations or search.</p>}</section>
}
