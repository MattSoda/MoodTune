import { useEffect, useState } from 'react'
import ErrorMessage from '../components/ErrorMessage'
import LoadingState from '../components/LoadingState'
import { moodTuneApi } from '../services/moodTuneApi'

export default function HistoryPage() {
  const [history, setHistory] = useState([]); const [error, setError] = useState(''); const [isLoading, setIsLoading] = useState(true)
  useEffect(() => { moodTuneApi.history().then((response) => setHistory(response.history)).catch((requestError) => setError(requestError.message)).finally(() => setIsLoading(false)) }, [])
  return <section className="space-y-6"><div><h1 className="text-3xl font-bold">Recommendation history</h1><p className="mt-2 text-slate-300">Review your previous mood-based music sessions.</p></div><ErrorMessage message={error} />{isLoading ? <LoadingState /> : history.length ? <ol className="space-y-3">{history.map((record, index) => <li key={`${record.created_at}-${index}`} className="rounded-xl border border-slate-800 bg-slate-900 p-4"><p className="font-medium capitalize">{record.current_mood} → {record.target_mood}</p><p className="mt-1 text-sm text-slate-300">{record.mode === 'feel_better' ? 'Make Me Feel Better' : 'Match My Mood'} · {record.track_ids?.length || 0} tracks</p><p className="mt-1 text-xs text-slate-400">{record.created_at ? new Date(record.created_at).toLocaleString() : 'Time unavailable'}</p></li>)}</ol> : <p className="text-slate-300">No recommendation history yet.</p>}</section>
}
