import { useEffect, useState } from 'react'
import ErrorMessage from '../components/ErrorMessage'
import LoadingState from '../components/LoadingState'
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
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

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

  if (isLoading) return <LoadingState label="Loading profile…" />
  const displayedAvatar = avatarUrl || user?.photoURL
  return (
    <section className="content-page mx-auto max-w-3xl">
      <div className="page-header">
        <p className="page-eyebrow">Your listening identity</p>
        <h1 className="page-title">Profile and preferences</h1>
        <p className="page-copy mt-2">Your mood remains the strongest recommendation signal. These preferences help refine the results.</p>
      </div>
      <form onSubmit={save} className="surface relative space-y-6 overflow-hidden p-5 sm:p-8">
        <span className="absolute inset-x-16 top-0 h-px bg-gradient-to-r from-transparent via-lavender-300/50 to-transparent" />
        <ErrorMessage message={error} />
        {notice && <p className="notice-success">{notice}</p>}

        <div className="flex min-w-0 flex-wrap items-center gap-4">
          {displayedAvatar ? <img src={displayedAvatar} alt="Profile avatar" className="h-20 w-20 rounded-2xl border border-lavender-300/40 object-cover shadow-[0_0_24px_rgba(167,139,250,.15)]" /> : <div aria-hidden="true" className="flex h-20 w-20 items-center justify-center rounded-2xl border border-lavender-300/20 bg-lavender-300/[0.1] text-2xl font-bold text-lavender-200">{displayName.trim().slice(0, 1).toUpperCase() || '?'}</div>}
          <label className="min-w-0 flex-1 basis-52 text-sm font-medium text-zinc-200">Profile image <span className="font-normal text-zinc-500">(optional, 5 MB max)</span><input type="file" accept="image/*" onChange={(event) => setImageFile(event.target.files?.[0] || null)} className="mt-2 block w-full max-w-full text-sm text-zinc-400 file:mr-2 file:rounded-lg file:border-0 file:bg-lavender-300/[0.12] file:px-3 file:py-2 file:text-lavender-100 sm:file:mr-3" /></label>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block text-sm font-medium text-zinc-200">Username<input value={username} readOnly className="input-control cursor-not-allowed opacity-60" /></label>
          <label className="block text-sm font-medium text-zinc-200">Account email<input value={accountEmail} readOnly className="input-control cursor-not-allowed opacity-60" /></label>
        </div>
        <label className="block text-sm font-medium text-zinc-200">Name<input value={displayName} onChange={(event) => setDisplayName(event.target.value)} maxLength="80" className="input-control" /></label>
        <label className="block text-sm font-medium text-zinc-200">About me <span className="font-normal text-zinc-500">({bio.length}/500)</span><textarea value={bio} onChange={(event) => setBio(event.target.value)} maxLength="500" rows="4" placeholder="Tell us a little about your music taste." className="input-control resize-y" /></label>
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block text-sm font-medium text-zinc-200">Preferred genres<p className="mt-1 text-xs font-normal text-zinc-500">Separate up to 20 genres with commas.</p><input value={genres} onChange={(event) => setGenres(event.target.value)} placeholder="pop, jazz, indie" className="input-control" /></label>
          <label className="block text-sm font-medium text-zinc-200">Favorite artists<p className="mt-1 text-xs font-normal text-zinc-500">Separate up to 20 artists with commas.</p><input value={artists} onChange={(event) => setArtists(event.target.value)} placeholder="Adele, Coldplay, The Weeknd" className="input-control" /></label>
        </div>
        <button disabled={isSaving} className="button-primary px-5 py-3 disabled:opacity-60">{isSaving ? 'Saving…' : 'Save profile'}</button>
      </form>
    </section>
  )
}
