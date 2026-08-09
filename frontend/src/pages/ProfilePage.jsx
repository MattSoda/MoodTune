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
        setDisplayName(profile.display_name || '')
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
    <section className="max-w-2xl space-y-6">
      <div>
        <h1 className="page-title">Profile and preferences</h1>
        <p className="page-copy mt-2">Your mood remains the strongest recommendation signal. These preferences help refine the results.</p>
      </div>
      <form onSubmit={save} className="surface space-y-5 p-5 sm:p-7">
        <ErrorMessage message={error} />
        {notice && <p className="text-sm text-emerald-200">{notice}</p>}

        <div className="flex flex-wrap items-center gap-4">
          {displayedAvatar ? <img src={displayedAvatar} alt="Profile avatar" className="h-20 w-20 rounded-full border border-violet-400/50 object-cover" /> : <div aria-hidden="true" className="flex h-20 w-20 items-center justify-center rounded-full bg-violet-500/20 text-2xl font-bold text-violet-200">{displayName.trim().slice(0, 1).toUpperCase() || '?'}</div>}
          <label className="text-sm font-medium">Profile image <span className="font-normal text-slate-400">(optional, 5 MB max)</span><input type="file" accept="image/*" onChange={(event) => setImageFile(event.target.files?.[0] || null)} className="mt-2 block w-full text-sm text-slate-300 file:mr-3 file:rounded file:border-0 file:bg-violet-500/20 file:px-3 file:py-2 file:text-violet-100" /></label>
        </div>

        <label className="block text-sm font-medium">Account email<input value={user?.email || ''} readOnly className="input-control mt-1 w-full cursor-not-allowed opacity-70" /></label>
        <label className="block text-sm font-medium">Display name<input value={displayName} onChange={(event) => setDisplayName(event.target.value)} maxLength="80" className="input-control mt-1 w-full" /></label>
        <label className="block text-sm font-medium">About me <span className="font-normal text-slate-400">({bio.length}/500)</span><textarea value={bio} onChange={(event) => setBio(event.target.value)} maxLength="500" rows="4" placeholder="Tell us a little about your music taste." className="input-control mt-1 w-full resize-y" /></label>
        <label className="block text-sm font-medium">Preferred genres<p className="mt-1 text-xs font-normal text-slate-400">Separate up to 20 genres with commas.</p><input value={genres} onChange={(event) => setGenres(event.target.value)} placeholder="pop, jazz, indie" className="input-control mt-1 w-full" /></label>
        <label className="block text-sm font-medium">Favorite artists<p className="mt-1 text-xs font-normal text-slate-400">Separate up to 20 artists with commas.</p><input value={artists} onChange={(event) => setArtists(event.target.value)} placeholder="Adele, Coldplay, The Weeknd" className="input-control mt-1 w-full" /></label>
        <button disabled={isSaving} className="button-primary px-4 py-2 disabled:opacity-60">{isSaving ? 'Saving…' : 'Save profile'}</button>
      </form>
    </section>
  )
}
