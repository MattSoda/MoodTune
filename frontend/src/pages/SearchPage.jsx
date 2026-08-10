import { useState } from 'react'
import ErrorMessage from '../components/ErrorMessage'
import LoadingState from '../components/LoadingState'
import SongCard from '../components/SongCard'
import { SONG_MOODS } from '../constants/moods'
import { useAuth } from '../context/AuthContext'
import { moodTuneApi } from '../services/moodTuneApi'

export default function SearchPage() {
  const { user } = useAuth(); const [query, setQuery] = useState(''); const [mood, setMood] = useState(''); const [genre, setGenre] = useState(''); const [results, setResults] = useState([]); const [error, setError] = useState(''); const [notice, setNotice] = useState(''); const [isLoading, setIsLoading] = useState(false)
  const search = async (event) => { event.preventDefault(); setError(''); setNotice(''); if (!query.trim()) return setError('Enter a track, artist, or genre to search.'); setIsLoading(true); try { const response = await moodTuneApi.search({ q: query.trim(), mood: mood || undefined, genre: genre.trim() || undefined, limit: 20 }); setResults(response.results) } catch (requestError) { setError(requestError.message) } finally { setIsLoading(false) } }
  const saveFavorite = async (trackId) => { try { await moodTuneApi.addFavorite(trackId); setNotice('Saved to favorites.') } catch (requestError) { setError(requestError.message) } }
  return <section className="content-page"><div className="page-header"><p className="page-eyebrow">Explore the catalogue</p><h1 className="page-title">Find your next favorite</h1><p className="page-copy">Search by song, artist, mood, or genre and discover something that fits.</p></div>
    <form onSubmit={search} className="filter-panel grid gap-3 sm:grid-cols-6"><label className="sm:col-span-3"><span className="sr-only">Search songs or artists</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search songs or artists" className="input-control mt-0" /></label><label className="sm:col-span-2"><span className="sr-only">Mood filter</span><select value={mood} onChange={(event) => setMood(event.target.value)} className="input-control mt-0 capitalize"><option value="">Any mood</option>{SONG_MOODS.map((value) => <option key={value} value={value}>{value}</option>)}</select></label><button className="button-primary sm:row-span-2">Search</button><label className="sm:col-span-5"><span className="sr-only">Genre filter</span><input value={genre} onChange={(event) => setGenre(event.target.value)} placeholder="Optional genre filter" className="input-control mt-0" /></label></form>
    <ErrorMessage message={error} />{notice && <p className="notice-success">{notice}</p>}{isLoading && <LoadingState label="Searching the catalogue…" />}{!isLoading && results.length > 0 && <div className="space-y-3">{results.map((song) => <SongCard key={song.track_id} song={song} onFavorite={user ? saveFavorite : undefined} />)}</div>}{!isLoading && query && results.length === 0 && !error && <p className="empty-state">No matching songs found. Try a broader search.</p>}
  </section>
}
