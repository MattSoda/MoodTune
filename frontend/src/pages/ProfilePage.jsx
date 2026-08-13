import { useEffect, useState } from 'react'
import ErrorMessage from '../components/ErrorMessage'
import LoadingState from '../components/LoadingState'
import MoodFrequencyChart from '../components/MoodFrequencyChart'
import { useAuth } from '../context/AuthContext'
import { uploadProfileImage } from '../services/profileImageService'
import { moodTuneApi } from '../services/moodTuneApi'

function commaSeparatedValues(value) {
  return value.split(',').map((item) => item.trim()).filter(Boolean)
}

export default function ProfilePage() {
  const { user } = useAuth()
  const [displayName, setDisplayName] = useState('')
  const [username, setUsername] = useState('')
  const [accountEmail, setAccountEmail] = useState(user?.email || '')
  const [genres, setGenres] = useState('')
  const [artists, setArtists] = useState('')
  const [bio, setBio] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [imagePreviewUrl, setImagePreviewUrl] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [moodFrequency, setMoodFrequency] = useState([])
  const [totalCheckIns, setTotalCheckIns] = useState(0)
  const [insightsError, setInsightsError] = useState('')
  const [areInsightsLoading, setAreInsightsLoading] = useState(true)

  useEffect(() => {
    moodTuneApi.profile()
      .then((response) => {
        const profile = response.profile || {}
        setDisplayName(profile.name || profile.display_name || user?.displayName || '')
        setUsername(profile.username || '')
        setAccountEmail(profile.email || user?.email || '')
        setGenres((profile.preferred_genres || []).join(', '))
        setArtists((profile.favorite_artists || []).join(', '))
        setBio(profile.bio || '')
        setAvatarUrl(profile.avatar_url || '')
      })
      .catch((requestError) => setError(requestError.message))
      .finally(() => setIsLoading(false))
  }, [])

  useEffect(() => {
    moodTuneApi.moodFrequency()
      .then((response) => {
        setMoodFrequency(response.mood_frequency || [])
        setTotalCheckIns(response.total_check_ins || 0)
      })
      .catch((requestError) => setInsightsError(requestError.message))
      .finally(() => setAreInsightsLoading(false))
  }, [])

  useEffect(() => {
    if (!imageFile) {
      setImagePreviewUrl('')
      return undefined
    }
    const previewUrl = URL.createObjectURL(imageFile)
    setImagePreviewUrl(previewUrl)
    return () => URL.revokeObjectURL(previewUrl)
  }, [imageFile])

  const save = async (event) => {
    event.preventDefault()
    setError('')
    setNotice('')
    if (!displayName.trim()) return setError('Display name is required.')
    setIsSaving(true)
    try {
      const uploadedAvatarUrl = imageFile ? await uploadProfileImage(user.uid, imageFile) : avatarUrl
      const response = await moodTuneApi.updateProfile({
        display_name: displayName.trim(),
        preferred_genres: commaSeparatedValues(genres),
        favorite_artists: commaSeparatedValues(artists),
        bio: bio.trim(),
        ...(uploadedAvatarUrl ? { avatar_url: uploadedAvatarUrl } : {}),
      })
      setAvatarUrl(response.profile.avatar_url || '')
      setImageFile(null)
      setNotice('Profile saved.')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) return <LoadingState label="Loading profile..." />

  const displayedAvatar = imagePreviewUrl || avatarUrl || user?.photoURL
  const initials = (displayName || username || accountEmail || '?')
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
  const genreCount = commaSeparatedValues(genres).length
  const artistCount = commaSeparatedValues(artists).length

  return (
    <section className="profile-page mx-auto max-w-6xl space-y-5 sm:space-y-7">
      <header className="profile-hero relative isolate overflow-hidden rounded-[1.75rem] border border-white/[0.09] px-5 py-7 shadow-[0_28px_90px_rgba(0,0,0,.5)] sm:px-8 sm:py-9 lg:px-10">
        <div className="relative grid items-center gap-7 md:grid-cols-[auto_minmax(0,1fr)] lg:grid-cols-[auto_minmax(0,1fr)_auto]">
          <div className="profile-avatar-orbit mx-auto md:mx-0">
            <div className="relative h-28 w-28 overflow-hidden rounded-full border border-lavender-200/30 bg-[#17131d] p-1 shadow-[0_0_45px_rgba(167,139,250,.18)] sm:h-32 sm:w-32">
              {displayedAvatar ? (
                <img src={displayedAvatar} alt="Profile avatar" className="h-full w-full rounded-full object-cover" />
              ) : (
                <div aria-hidden="true" className="grid h-full w-full place-items-center rounded-full bg-[radial-gradient(circle_at_35%_25%,rgba(255,255,255,.16),transparent_20%),linear-gradient(145deg,#2c2140,#100d16)] text-3xl font-bold tracking-[-0.06em] text-lavender-100">{initials}</div>
              )}
              <span className="absolute bottom-1.5 right-1.5 h-4 w-4 rounded-full border-[3px] border-[#0d0b11] bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,.65)]" title="Active listener" />
            </div>
          </div>

          <div className="min-w-0 text-center md:text-left">
            <h1 className="break-words text-3xl font-bold tracking-[-0.055em] text-white sm:text-5xl">{displayName || 'Make it yours'}</h1>
            <p className="mt-2 text-sm text-zinc-500">{username ? `@${username}` : accountEmail}</p>
            <div className="mt-4 flex flex-wrap justify-center gap-2 md:justify-start">
              {commaSeparatedValues(genres).slice(0, 4).map((genre) => <span key={genre} className="rounded-full border border-lavender-300/15 bg-lavender-300/[0.07] px-3 py-1.5 text-xs capitalize text-lavender-100">{genre}</span>)}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 lg:w-72">
            {[
              ['Check-ins', `${totalCheckIns}×`],
              ['Genres', `${genreCount} picks`],
              ['Artists', `${artistCount} picks`],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-white/[0.08] bg-black/25 px-2 py-4 text-center backdrop-blur-sm">
                <p className="text-xl font-bold tracking-tight text-white sm:text-2xl">{value}</p>
                <p className="mt-1 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-zinc-500">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </header>

      <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(20rem,.8fr)] lg:items-start">
        <form onSubmit={save} className="surface relative min-w-0 overflow-hidden">
          <div className="border-b border-white/[0.07] px-5 py-5 sm:flex sm:items-center sm:justify-between sm:px-7">
            <div>
              <p className="text-[0.68rem] font-bold uppercase tracking-[0.2em] text-lavender-300">Profile editor</p>
              <h2 className="mt-1 text-xl font-semibold tracking-[-0.035em] text-white">Tune your identity</h2>
            </div>
            <p className="mt-2 text-xs text-zinc-600 sm:mt-0">Changes sync across MoodTune</p>
          </div>

          <div className="space-y-7 p-5 sm:p-7">
            <ErrorMessage message={error} />
            {notice && <p className="notice-success">{notice}</p>}

            <div className="flex min-w-0 flex-col gap-4 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4 sm:flex-row sm:items-center">
              <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-2xl border border-white/10 bg-lavender-300/[0.08] text-sm font-bold text-lavender-100">
                {displayedAvatar ? <img src={displayedAvatar} alt="" className="h-full w-full object-cover" /> : initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-zinc-100">Profile artwork</p>
                <p className="mt-1 truncate text-xs text-zinc-500">{imageFile?.name || 'JPG, PNG or WebP up to 5 MB'}</p>
              </div>
              <input id="profile-image" type="file" accept="image/*" onChange={(event) => setImageFile(event.target.files?.[0] || null)} className="sr-only" />
              <label htmlFor="profile-image" className="button-secondary cursor-pointer text-center text-sm">Choose image</label>
            </div>

            <div>
              <SectionHeading number="01" title="Account details" />
              <div className="grid gap-4 sm:grid-cols-2">
                <InfoCard icon="@" label="Username" value={username || 'Not set'} />
                <InfoCard icon="✦" label="Account email" value={accountEmail} />
              </div>
            </div>

            <div>
              <SectionHeading number="02" title="Public presence" />
              <div className="space-y-4">
                <label className="block text-sm font-medium text-zinc-300">Name<input value={displayName} onChange={(event) => setDisplayName(event.target.value)} maxLength="80" className="profile-control" /></label>
                <label className="block text-sm font-medium text-zinc-300">About me <span className="float-right font-normal text-zinc-600">{bio.length}/500</span><textarea value={bio} onChange={(event) => setBio(event.target.value)} maxLength="500" rows="4" placeholder="The records, rituals and sounds that define you..." className="profile-control resize-y" /></label>
              </div>
            </div>

            <div>
              <SectionHeading number="03" title="Taste signals" />
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-medium text-zinc-300">Preferred genres<span className="mt-1 block text-xs font-normal text-zinc-600">Comma-separated, up to 20</span><input value={genres} onChange={(event) => setGenres(event.target.value)} placeholder="pop, jazz, indie" className="profile-control" /></label>
                <label className="block text-sm font-medium text-zinc-300">Favorite artists<span className="mt-1 block text-xs font-normal text-zinc-600">Comma-separated, up to 20</span><input value={artists} onChange={(event) => setArtists(event.target.value)} placeholder="Adele, Coldplay, The Weeknd" className="profile-control" /></label>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-white/[0.07] bg-black/20 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
            <p className="text-xs leading-5 text-zinc-600">Your mood remains the strongest recommendation signal.</p>
            <button disabled={isSaving} className="button-primary inline-flex items-center justify-center gap-2 px-6 py-3 disabled:opacity-60">
              {isSaving ? 'Saving...' : 'Save profile'}
              {!isSaving && <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="m5 12 4 4L19 6" strokeLinecap="round" strokeLinejoin="round" /></svg>}
            </button>
          </div>
        </form>

        <section aria-labelledby="mood-frequency-title" className="surface relative min-w-0 overflow-hidden p-5 sm:p-7 lg:sticky lg:top-24">
          <div className="absolute -right-16 -top-20 h-48 w-48 rounded-full bg-violet-500/[0.08] blur-3xl" />
          <div className="relative">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[0.68rem] font-bold uppercase tracking-[0.2em] text-lavender-300">Listening pulse</p>
                <h2 id="mood-frequency-title" className="mt-1 text-xl font-bold tracking-[-0.035em] text-white sm:text-2xl">Your Mood Check-ins</h2>
              </div>
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-lavender-300/15 bg-lavender-300/[0.07] text-lavender-200">
                <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M3 12h3l2-6 4 12 3-9 2 3h4" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </span>
            </div>
            <p className="mt-3 text-sm leading-6 text-zinc-500">A visual rhythm of the moods behind your recommendations.</p>
            {areInsightsLoading ? (
              <div className="mt-5"><LoadingState label="Loading mood check-ins..." /></div>
            ) : insightsError ? (
              <div className="mt-5"><ErrorMessage message={`We couldn't load your mood insights. ${insightsError}`} /></div>
            ) : (
              <MoodFrequencyChart moodFrequency={moodFrequency} totalCheckIns={totalCheckIns} />
            )}
            <p className="mt-5 border-t border-white/[0.08] pt-4 text-xs leading-5 text-zinc-600">These insights summarize the moods you selected in MoodTune. They do not measure or diagnose your emotional health.</p>
          </div>
        </section>
      </div>
    </section>
  )
}

function SectionHeading({ number, title }) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <span className="grid h-7 w-7 place-items-center rounded-lg bg-lavender-300/[0.08] text-xs text-lavender-200">{number}</span>
      <h3 className="text-sm font-semibold text-zinc-200">{title}</h3>
      <span className="h-px flex-1 bg-white/[0.06]" />
    </div>
  )
}

function InfoCard({ icon, label, value }) {
  return (
    <div className="profile-info-card min-w-0">
      <span aria-hidden="true" className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-lavender-300/10 bg-lavender-300/[0.07] text-sm font-bold text-lavender-200">{icon}</span>
      <div className="min-w-0">
        <p className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-zinc-600">{label}</p>
        <p className="mt-1 truncate text-sm text-zinc-200" title={value}>{value}</p>
      </div>
    </div>
  )
}
