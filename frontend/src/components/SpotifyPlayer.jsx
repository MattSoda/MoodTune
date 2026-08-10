import { useEffect, useRef } from 'react'

const SPOTIFY_TRACK_ID_PATTERN = /^[A-Za-z0-9]{22}$/
let spotifyApiPromise

export function isUsableSpotifyTrackId(trackId) {
  return typeof trackId === 'string' && SPOTIFY_TRACK_ID_PATTERN.test(trackId.trim())
}

function loadSpotifyIframeApi() {
  if (spotifyApiPromise) return spotifyApiPromise
  spotifyApiPromise = new Promise((resolve) => {
    const previousCallback = window.onSpotifyIframeApiReady
    window.onSpotifyIframeApiReady = (api) => {
      if (typeof previousCallback === 'function') previousCallback(api)
      resolve(api)
    }

    if (!document.querySelector('script[data-moodtune-spotify-api]')) {
      const script = document.createElement('script')
      script.src = 'https://open.spotify.com/embed/iframe-api/v1'
      script.async = true
      script.dataset.moodtuneSpotifyApi = 'true'
      document.body.appendChild(script)
    }
  })
  return spotifyApiPromise
}

function TestSpotifyPlayer({ trackId }) {
  return <iframe className="block max-w-full" title="Spotify player" src={`https://open.spotify.com/embed/track/${trackId}`} width="100%" height="152" frameBorder="0" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy" />
}

export default function SpotifyPlayer({ trackId }) {
  const playerRoot = useRef(null)
  const normalizedTrackId = isUsableSpotifyTrackId(trackId) ? trackId.trim() : ''

  useEffect(() => {
    if (!normalizedTrackId || import.meta.env.MODE === 'test') return undefined
    let controller
    let cancelled = false
    loadSpotifyIframeApi().then((IframeApi) => {
      if (cancelled || !playerRoot.current) return
      IframeApi.createController(playerRoot.current, {
        width: '100%', height: 152, uri: `spotify:track:${normalizedTrackId}`,
      }, (embedController) => {
        controller = embedController
        // This follows a user click, so supported browsers can begin immediately.
        embedController.play()
      })
    })
    return () => {
      cancelled = true
      controller?.destroy()
    }
  }, [normalizedTrackId])

  if (!normalizedTrackId) return null

  return (
    <div className="w-full max-w-full overflow-hidden rounded-xl border border-white/[0.08] bg-black/30 p-1">
      {import.meta.env.MODE === 'test'
        ? <TestSpotifyPlayer trackId={normalizedTrackId} />
        : <div ref={playerRoot} className="grid h-[152px] w-full place-items-center text-sm text-zinc-500" role="status">Opening Spotify player…</div>}
    </div>
  )
}
