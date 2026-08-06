import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ACTIVITIES, PREFERRED_GENRES, RECOMMENDATION_MODES, USER_MOODS } from '../constants/moods'

export default function HomePage() {
  const navigate = useNavigate()
  const [mood, setMood] = useState('')
  const [activity, setActivity] = useState('')
  const [preferredGenres, setPreferredGenres] = useState([])
  const [mode, setMode] = useState('match_mood')
  const [error, setError] = useState('')
  const submit = (event) => {
    event.preventDefault()
    if (!mood) return setError('Choose a mood before requesting music.')
    navigate('/recommendations', { state: { mood, mode, activity: activity || undefined, preferredGenres } })
  }
  const toggleGenre = (genre) => setPreferredGenres((current) => current.includes(genre)
    ? current.filter((item) => item !== genre) : [...current, genre])
  return (
    <section className="max-w-4xl space-y-8 py-4 sm:py-10">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-300">Mood-based discovery</p>
      <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-6xl">Find music that meets your moment.</h1>
      <p className="max-w-xl text-lg leading-8 text-slate-300">Select a predefined mood and choose whether you want music to match it or support a different musical direction.</p>
      <form onSubmit={submit} className="surface space-y-7 p-5 sm:p-7">
        <fieldset><legend className="font-semibold">How are you feeling?</legend><div className="mt-3 flex flex-wrap gap-2">
          {USER_MOODS.map((value) => <button type="button" key={value} onClick={() => { setMood(value); setError('') }} className={`rounded-full px-3 py-2 text-sm capitalize transition ${mood === value ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/20' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'}`}>{value}</button>)}
        </div></fieldset>
        <fieldset>
          <legend className="font-semibold">What are you doing right now? <span className="font-normal text-slate-400">(optional)</span></legend>
          <select aria-label="What are you doing right now?" className="input-control mt-3 w-full sm:max-w-sm" value={activity} onChange={(event) => setActivity(event.target.value)}>
            <option value="">No activity preference</option>
            {ACTIVITIES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
        </fieldset>
        <fieldset>
          <legend className="font-semibold">Which genres do you enjoy? <span className="font-normal text-slate-400">(optional, choose any)</span></legend>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {PREFERRED_GENRES.map((item) => <label key={item.value} className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-sm hover:border-violet-400"><input type="checkbox" checked={preferredGenres.includes(item.value)} onChange={() => toggleGenre(item.value)} />{item.label}</label>)}
          </div>
        </fieldset>
        <fieldset><legend className="font-semibold">Recommendation mode</legend><div className="mt-3 grid gap-3 sm:grid-cols-2">
          {RECOMMENDATION_MODES.map((item) => <label key={item.value} className={`cursor-pointer rounded-lg border p-4 ${mode === item.value ? 'border-violet-400 bg-violet-400/10' : 'border-slate-700'}`}><input className="mr-2" type="radio" name="mode" value={item.value} checked={mode === item.value} onChange={() => setMode(item.value)} /><span className="font-medium">{item.label}</span><p className="mt-1 text-sm text-slate-300">{item.value === 'match_mood' ? 'Choose songs with a matching musical mood.' : 'Choose songs toward a configurable target musical mood.'}</p></label>)}
        </div></fieldset>
        {error && <p className="text-sm text-rose-200" role="alert">{error}</p>}
        <button className="button-primary px-5 py-3">Get recommendations</button>
      </form>
    </section>
  )
}
