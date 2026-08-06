import { useState } from 'react'
import ErrorMessage from '../components/ErrorMessage'
import LoadingState from '../components/LoadingState'
import SongCard from '../components/SongCard'
import { SONG_MOODS } from '../constants/moods'
import { useAuth } from '../context/AuthContext'
import { moodTuneApi } from '../services/moodTuneApi'

export default function SearchPage() {
  const { user } = useAuth()
  const [query, setQuery] = useState('')
  const [mood, setMood] = useState('')
  const [genre, setGenre] = useState('')
  const [results, setResults] = useState([])
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const search = async (event) => {
    event.preventDefault(); setError(''); setNotice('')
    if (!query.trim()) return setError('Enter a track, artist, or genre to search.')
    setIsLoading(true)
    try { const response = await moodTuneApi.search({ q: query.trim(), mood: mood || undefined, genre: genre.trim() || undefined, limit: 20 }); setResults(response.results) }
    catch (requestError) { setError(requestError.message) } finally { setIsLoading(false) }
  }
  const saveFavorite = async (trackId) => { try { await moodTuneApi.addFavorite(trackId); setNotice('Saved to favorites.') } catch (requestError) { setError(requestError.message) } }
  return <section className="space-y-6"><div><h1 className="text-3xl font-bold">Search the catalogue</h1><p className="mt-2 text-slate-300">Find songs by track, artist, or genre.</p></div>
    <form onSubmit={search} className="grid gap-3 rounded-xl border border-slate-800 bg-slate-900 p-4 sm:grid-cols-4"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search songs or artists" className="rounded border border-slate-700 bg-slate-950 p-2 sm:col-span-2" /><select value={mood} onChange={(event) => setMood(event.target.value)} className="rounded border border-slate-700 bg-slate-950 p-2"><option value="">Any mood</option>{SONG_MOODS.map((value) => <option key={value} value={value}>{value}</option>)}</select><button className="rounded bg-violet-500 px-4 py-2 font-semibold">Search</button><input value={genre} onChange={(event) => setGenre(event.target.value)} placeholder="Optional genre filter" className="rounded border border-slate-700 bg-slate-950 p-2 sm:col-span-2" /></form>
    <ErrorMessage message={error} />{notice && <p className="text-sm text-emerald-200">{notice}</p>}{isLoading && <LoadingState label="Searching the catalogue…" />}
    {!isLoading && results.length > 0 && <div className="space-y-3">{results.map((song) => <SongCard key={song.track_id} song={song} onFavorite={user ? saveFavorite : undefined} />)}</div>}
    {!isLoading && query && results.length === 0 && !error && <p className="text-slate-300">No matching songs found.</p>}
  </section>
}
