import { useCallback, useEffect, useRef, useState } from 'react'
import ErrorMessage from '../components/ErrorMessage'
import LoadingState from '../components/LoadingState'
import SongCard from '../components/SongCard'
import { SONG_MOODS } from '../constants/moods'
import { useAuth } from '../context/AuthContext'
import useRequireAuth from '../hooks/useRequireAuth'
import { moodTuneApi } from '../services/moodTuneApi'
import { saveSearchDraft, takeSearchDraft } from '../utils/searchDraft'

function MoodFilter({ value, onChange }) {
  const menu = useRef(null)
  const chooseMood = (nextMood) => {
    onChange(nextMood)
    menu.current?.removeAttribute('open')
  }

  return <details ref={menu} className="group relative sm:col-span-2" onKeyDown={(event) => { if (event.key === 'Escape') menu.current?.removeAttribute('open') }}>
    <summary className="flex min-h-[2.85rem] cursor-pointer list-none items-center justify-between rounded-xl border border-white/[0.1] bg-black/30 px-4 text-sm text-zinc-200 transition hover:border-lavender-300/50 hover:bg-lavender-300/[0.04] group-open:border-lavender-300/70 group-open:bg-lavender-300/[0.07] group-open:shadow-[0_0_22px_rgba(167,139,250,.1)]">
      <span className="flex items-center gap-2"><span className={`h-2 w-2 rounded-full ${value ? 'bg-lavender-300 shadow-[0_0_10px_rgba(196,181,253,.7)]' : 'bg-zinc-600'}`} /><span className="capitalize">{value || 'Any mood'}</span></span>
      <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4 text-zinc-500 transition group-open:rotate-180 group-open:text-lavender-300" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="m5 7.5 5 5 5-5" strokeLinecap="round" strokeLinejoin="round" /></svg>
    </summary>
    <div role="listbox" aria-label="Mood filter" className="absolute left-0 right-0 z-20 mt-2 grid max-h-72 grid-cols-2 gap-1 overflow-y-auto rounded-2xl border border-white/[0.12] bg-[#0c0c10]/[0.98] p-2 shadow-[0_24px_70px_rgba(0,0,0,.72),0_0_30px_rgba(139,92,246,.08)] backdrop-blur-xl">
      {['', ...SONG_MOODS].map((moodOption) => {
        const selected = value === moodOption
        return <button key={moodOption || 'any'} type="button" role="option" aria-selected={selected} onClick={() => chooseMood(moodOption)} className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm capitalize transition ${selected ? 'bg-lavender-300/[0.14] text-lavender-100 shadow-[inset_0_0_0_1px_rgba(196,181,253,.25)]' : 'text-zinc-400 hover:bg-white/[0.06] hover:text-white'}`}><span className={`grid h-4 w-4 place-items-center rounded-full border ${selected ? 'border-lavender-300 bg-lavender-300 text-[0.6rem] text-[#100d14]' : 'border-zinc-700'}`}>{selected ? '✓' : ''}</span>{moodOption || 'Any mood'}</button>
      })}
    </div>
  </details>
}

function DiscoverySection({ title, subtitle, items, onChoose, onDelete, onClear }) {
  if (!items?.length) return null
  return <section className="search-discovery-section" aria-label={title}>
    <div className="flex items-end justify-between gap-4">
      <div><h2 className="text-sm font-semibold text-zinc-100">{title}</h2><p className="mt-0.5 text-xs text-zinc-500">{subtitle}</p></div>
      {onClear && <button type="button" onClick={onClear} className="text-xs text-zinc-500 transition hover:text-lavender-200">Clear all</button>}
    </div>
    <div className="mt-3 flex flex-wrap gap-2">{items.map((item) => <div key={item.id || `${title}-${item.query}`} className="group/chip flex max-w-full items-center rounded-full border border-white/[0.09] bg-white/[0.035] transition hover:border-lavender-300/45 hover:bg-lavender-300/[0.07]">
      <button type="button" onClick={() => onChoose(item.query)} title={item.reason || undefined} className="max-w-[15rem] truncate px-3 py-2 text-left text-xs text-zinc-300 transition group-hover/chip:text-lavender-100">{item.label || item.query}</button>
      {onDelete && <button type="button" onClick={() => onDelete(item.id)} aria-label={`Delete recent search ${item.query}`} className="mr-1 grid h-6 w-6 place-items-center rounded-full text-zinc-600 transition hover:bg-white/[0.08] hover:text-zinc-200">×</button>}
    </div>)}</div>
  </section>
}

function SearchDiscovery({ discovery, onChoose, onDelete, onClear }) {
  if (!discovery) return null
  return <div className="grid gap-4 rounded-2xl border border-white/[0.08] bg-[#0c0c0f]/80 p-4 sm:grid-cols-3 sm:p-5">
    <DiscoverySection title="Recent" subtitle="Pick up where you left off" items={discovery.recent} onChoose={onChoose} onDelete={onDelete} onClear={discovery.recent?.length ? onClear : undefined} />
    <DiscoverySection title="Recommended for you" subtitle={discovery.meta?.cold_start ? 'Popular places to start' : 'Songs related to your searches'} items={discovery.recommended} onChoose={onChoose} />
    <DiscoverySection title="Trending" subtitle="Most popular songs in the catalogue" items={discovery.trending} onChoose={onChoose} />
  </div>
}

export default function SearchPage() {
  const { user } = useAuth()
  const requireAuth = useRequireAuth()
  const [query, setQuery] = useState('')
  const [mood, setMood] = useState('')
  const [genre, setGenre] = useState('')
  const [results, setResults] = useState([])
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [showDiscovery, setShowDiscovery] = useState(true)
  const [activeTrackId, setActiveTrackId] = useState(null)
  const [discovery, setDiscovery] = useState(null)
  const requestId = useRef(0)
  const debounceTimer = useRef(null)
  const suppressDebounce = useRef(false)

  const refreshDiscovery = useCallback(async () => {
    if (typeof moodTuneApi.searchDiscovery !== 'function') return
    try {
      setDiscovery(await moodTuneApi.searchDiscovery({ limit: 8 }))
    } catch {
      // Search remains usable if discovery storage is temporarily unavailable.
    }
  }, [])

  const runSearch = useCallback(async ({ query: nextQuery, mood: nextMood = '', genre: nextGenre = '' }, { record = false } = {}) => {
    const currentRequest = ++requestId.current
    setError('')
    setNotice('')
    setIsLoading(true)
    setActiveTrackId(null)
    try {
      const response = await moodTuneApi.search({ q: nextQuery, mood: nextMood || undefined, genre: nextGenre || undefined, limit: 20, record: record || undefined })
      if (currentRequest === requestId.current) setResults(response.results)
      if (record) await refreshDiscovery()
    } catch (requestError) {
      if (currentRequest === requestId.current) setError(requestError.message)
    } finally {
      if (currentRequest === requestId.current) {
        setIsLoading(false)
        setHasSearched(true)
      }
    }
  }, [refreshDiscovery])

  useEffect(() => { refreshDiscovery() }, [refreshDiscovery, user])

  useEffect(() => {
    if (!user) return
    const draft = takeSearchDraft()
    if (!draft?.query) return
    setQuery(draft.query)
    setMood(draft.mood || '')
    setGenre(draft.genre || '')
  }, [user])

  useEffect(() => {
    clearTimeout(debounceTimer.current)
    if (suppressDebounce.current) {
      suppressDebounce.current = false
      return undefined
    }
    if (!user || query.trim().length < 2) {
      if (query.trim().length < 2) {
        requestId.current += 1
        setResults([])
        setIsLoading(false)
      }
      return undefined
    }
    debounceTimer.current = setTimeout(() => {
      runSearch({ query: query.trim(), mood, genre: genre.trim() })
    }, 350)
    return () => clearTimeout(debounceTimer.current)
  }, [genre, mood, query, runSearch, user])

  const search = (event) => {
    event.preventDefault()
    const draft = { query: query.trim(), mood, genre: genre.trim() }
    if (!draft.query) return setError('Enter a track, artist, or genre to search.')
    if (!user) {
      saveSearchDraft(draft)
      requireAuth('/search')
      return
    }
    setShowDiscovery(false)
    clearTimeout(debounceTimer.current)
    runSearch(draft, { record: true })
  }

  const chooseSuggestion = (suggestion) => {
    suppressDebounce.current = true
    setQuery(suggestion)
    setHasSearched(false)
    if (!user) return
    setShowDiscovery(false)
    clearTimeout(debounceTimer.current)
    runSearch({ query: suggestion, mood, genre: genre.trim() }, { record: true })
  }

  const deleteRecent = async (searchId) => {
    if (!user) return
    try {
      await moodTuneApi.deleteRecentSearch(searchId)
      setDiscovery((current) => current ? { ...current, recent: current.recent.filter((item) => item.id !== searchId) } : current)
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  const clearRecent = async () => {
    if (!user) return
    try {
      await moodTuneApi.clearRecentSearches()
      setDiscovery((current) => current ? { ...current, recent: [] } : current)
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  const saveFavorite = async (trackId) => {
    try {
      await moodTuneApi.addFavorite(trackId)
      setNotice('Saved to favorites.')
    } catch (requestError) {
      setError(requestError.message)
    }
  }
  const toggleSpotifyPlayer = (trackId) => setActiveTrackId((currentTrackId) => currentTrackId === trackId ? null : trackId)

  return <section className="content-page"><div className="page-header"><p className="page-eyebrow">Explore the catalogue</p><h1 className="page-title">Find your next favorite</h1><p className="page-copy">Search by song, artist, mood, or genre and discover something that fits.</p></div>
    <form onSubmit={search} className="filter-panel grid gap-3 sm:grid-cols-6"><label className="sm:col-span-3"><span className="sr-only">Search songs or artists</span><input value={query} onChange={(event) => { setQuery(event.target.value); setHasSearched(false); setShowDiscovery(true) }} placeholder="Search songs or artists" className="input-control mt-0" /></label><MoodFilter value={mood} onChange={(nextMood) => { setMood(nextMood); setHasSearched(false) }} /><button className="button-primary sm:row-span-2">Search</button><label className="sm:col-span-5"><span className="sr-only">Genre filter</span><input value={genre} onChange={(event) => { setGenre(event.target.value); setHasSearched(false) }} placeholder="Optional genre filter" className="input-control mt-0" /></label></form>
    {showDiscovery && <SearchDiscovery discovery={discovery} onChoose={chooseSuggestion} onDelete={deleteRecent} onClear={clearRecent} />}
    <ErrorMessage message={error} />{notice && <p className="notice-success">{notice}</p>}{isLoading && <LoadingState label="Searching the catalogue…" />}{!isLoading && results.length > 0 && <div className="space-y-3">{results.map((song) => <SongCard key={song.track_id} song={song} onFavorite={user ? saveFavorite : undefined} isSpotifyPlayerActive={typeof song.track_id === 'string' && activeTrackId === song.track_id.trim()} onToggleSpotifyPlayer={toggleSpotifyPlayer} />)}</div>}{!isLoading && hasSearched && query && results.length === 0 && !error && user && <p className="empty-state">No matching songs found. Try a broader search.</p>}
  </section>
}
