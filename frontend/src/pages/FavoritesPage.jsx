import { useEffect, useState } from 'react'
import ErrorMessage from '../components/ErrorMessage'
import LoadingState from '../components/LoadingState'
import SongCard from '../components/SongCard'
import { usePlayer } from '../context/PlayerContext'
import { moodTuneApi } from '../services/moodTuneApi'

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState([])
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const { currentTrack, isPlayerOpen, openPlayer, closePlayer } = usePlayer()

  const load = () => {
    setIsLoading(true)
    moodTuneApi.favorites().then((response) => setFavorites(response.favorites)).catch((requestError) => setError(requestError.message)).finally(() => setIsLoading(false))
  }
  useEffect(load, [])

  const remove = async (trackId) => {
    try {
      await moodTuneApi.removeFavorite(trackId)
      setFavorites((items) => items.filter((song) => song.track_id !== trackId))
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  const toggleSpotifyPlayer = (trackId, index) => {
    if (isPlayerOpen && currentTrack?.track_id?.trim() === trackId) closePlayer()
    else openPlayer(favorites, index)
  }

  return <section className="content-page"><div className="page-header"><p className="page-eyebrow">Your collection</p><h1 className="page-title">Favorites</h1><p className="page-copy">The songs worth returning to. Play them here or let them refine your future recommendations.</p></div><ErrorMessage message={error} />{isLoading ? <LoadingState label="Loading your favorites…" /> : favorites.length ? <div className="space-y-3">{favorites.map((song, index) => <SongCard key={song.track_id || `favorite-${index}`} song={song} onRemove={remove} isSpotifyPlayerActive={isPlayerOpen && typeof song.track_id === 'string' && currentTrack?.track_id?.trim() === song.track_id.trim()} onToggleSpotifyPlayer={(trackId) => toggleSpotifyPlayer(trackId, index)} />)}</div> : <p className="empty-state">No favorites yet. Save a song from recommendations or search to start your collection.</p>}</section>
}
