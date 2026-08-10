import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ACTIVITIES, PREFERRED_GENRES, RECOMMENDATION_MODES, USER_MOODS } from '../constants/moods'

const MOOD_ICONS = {
  happy: '☻', sad: '☂', angry: '♨', calm: '≋', relaxed: '♨', energetic: 'ϟ',
  romantic: '♥', motivated: '♛', lonely: '★', stressed: '☁', bored: '◉',
}

const ACTIVITY_ICONS = {
  studying: '◇', working: '▥', driving: '◉', exercise: '↗',
  gaming: '✦', party: '✺', traveling: '✈', sleeping: '☾',
}

const MODE_COPY = {
  match_mood: 'Choose songs with a matching musical mood.',
  feel_better: 'Choose songs that gently lift your current mood.',
}

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
    <section className="home-shell -my-8 py-5 sm:-my-12 sm:flex sm:h-[calc(100dvh-65px)] sm:min-h-0 sm:items-center sm:py-4">
      <form onSubmit={submit} className="mood-stage mx-auto grid w-full lg:w-[76vw] lg:max-w-[86rem] lg:grid-cols-[0.86fr_1.14fr]">
        <div className="mood-stage-left flex flex-col p-7 sm:p-8 lg:p-9">
          <div>
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.28em] text-lavender-300">Tune into the moment</p>
            <h1 className="mt-5 max-w-md text-5xl font-bold leading-[1.02] tracking-[-0.055em] text-white sm:text-6xl">
              How are <span className="lavender-text">you feeling?</span>
            </h1>
          </div>

          <fieldset className="mt-8 lg:mt-10">
            <legend className="text-lg font-semibold text-zinc-100">Mood selection</legend>
            <div className="mt-4 flex max-w-lg flex-wrap gap-2.5">
              {USER_MOODS.map((value) => (
                <button type="button" key={value} aria-pressed={mood === value} onClick={() => { setMood(value); setError('') }} className={`stage-mood-pill ${mood === value ? 'stage-mood-pill-selected' : ''}`}>
                  <span className="text-lavender-200" aria-hidden="true">{MOOD_ICONS[value]}</span>
                  <span className="capitalize">{value}</span>
                </button>
              ))}
            </div>
          </fieldset>

          <div className="stage-footer mt-auto hidden items-center gap-4 pt-10 text-xs text-zinc-600 lg:flex"><span className="h-px w-10 bg-lavender-300/50" />Lavender &amp; obsidian, tuned to you</div>
        </div>

        <div className="mood-stage-right flex flex-col gap-3 border-t border-white/[0.08] p-5 lg:border-l lg:border-t-0 lg:pb-4 lg:pt-12">
          <fieldset>
            <legend className="stage-heading">What are you doing?</legend>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {ACTIVITIES.map((item) => (
                <button type="button" key={item.value} aria-pressed={activity === item.value} onClick={() => setActivity((current) => current === item.value ? '' : item.value)} className={`stage-activity ${activity === item.value ? 'stage-activity-selected' : ''}`}>
                  <span className="text-xl text-zinc-500" aria-hidden="true">{ACTIVITY_ICONS[item.value]}</span>
                  <span>{item.value === 'exercise' ? 'Working Out' : item.label}</span>
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="stage-heading">Which genres do you enjoy?</legend>
            <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-5">
              {PREFERRED_GENRES.map((item) => (
                <label key={item.value} className={`stage-genre ${preferredGenres.includes(item.value) ? 'stage-genre-selected' : ''}`}>
                  <input className="sr-only" type="checkbox" checked={preferredGenres.includes(item.value)} onChange={() => toggleGenre(item.value)} />
                  <span className="stage-check" aria-hidden="true">{preferredGenres.includes(item.value) && '✓'}</span>
                  <span>{item.label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="stage-heading">Recommendation mode</legend>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {RECOMMENDATION_MODES.map((item) => {
                const selected = mode === item.value
                return (
                  <label key={item.value} className={`stage-mode ${selected ? 'stage-mode-selected' : ''}`}>
                    <input className="sr-only" type="radio" name="mode" value={item.value} checked={selected} onChange={() => setMode(item.value)} />
                    <span className={`stage-radio ${selected ? 'stage-radio-selected' : ''}`} aria-hidden="true" />
                    <span><span className="block text-sm font-semibold text-white">{item.label}</span><span className="mt-1 block max-w-xs text-xs leading-4 text-zinc-400">{MODE_COPY[item.value]}</span></span>
                  </label>
                )
              })}
            </div>
          </fieldset>

          {error && <p className="rounded-lg border border-rose-400/25 bg-rose-400/[0.07] px-4 py-2 text-sm text-rose-200" role="alert">{error}</p>}
          <button className="stage-cta mt-auto w-full">Get recommendations <span aria-hidden="true">→</span></button>
        </div>
      </form>
    </section>
  )
}
