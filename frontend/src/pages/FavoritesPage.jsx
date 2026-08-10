import { useEffect, useState } from 'react'
import ErrorMessage from '../components/ErrorMessage'
import LoadingState from '../components/LoadingState'
import SongCard from '../components/SongCard'
import { moodTuneApi } from '../services/moodTuneApi'

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState([]); const [error, setError] = useState(''); const [isLoading, setIsLoading] = useState(true); const [activeTrackId, setActiveTrackId] = useState(null)
  const load = () => { setIsLoading(true); moodTuneApi.favorites().then((response) => setFavorites(response.favorites)).catch((requestError) => setError(requestError.message)).finally(() => setIsLoading(false)) }; useEffect(load, [])
  const remove = async (trackId) => { try { await moodTuneApi.removeFavorite(trackId); setFavorites((items) => items.filter((song) => song.track_id !== trackId)); setActiveTrackId((current) => current === trackId ? null : current) } catch (requestError) { setError(requestError.message) } }
  const toggleSpotifyPlayer = (trackId) => setActiveTrackId((current) => current === trackId ? null : trackId)
  return <section className="content-page"><div className="page-header"><p className="page-eyebrow">Your collection</p><h1 className="page-title">Favorites</h1><p className="page-copy">The songs worth returning to. Play them here or let them refine your future recommendations.</p></div><ErrorMessage message={error} />{isLoading ? <LoadingState label="Loading your favorites…" /> : favorites.length ? <div className="space-y-3">{favorites.map((song) => <SongCard key={song.track_id} song={song} onRemove={remove} isSpotifyPlayerActive={typeof song.track_id === 'string' && activeTrackId === song.track_id.trim()} onToggleSpotifyPlayer={toggleSpotifyPlayer} />)}</div> : <p className="empty-state">No favorites yet. Save a song from recommendations or search to start your collection.</p>}</section>
}
