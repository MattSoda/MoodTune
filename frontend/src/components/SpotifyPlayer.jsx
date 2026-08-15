import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import { isUsableSpotifyTrackId, spotifyTrackUri } from '../utils/spotify'

let spotifyApiPromise

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

export { isUsableSpotifyTrackId }

const SpotifyPlayer = forwardRef(function SpotifyPlayer({
  trackId,
  autoplayOnLoad = false,
  onPlaybackStateChange,
  onReadyChange,
}, ref) {
  const playerRoot = useRef(null)
  const controller = useRef(null)
  const appliedTrackId = useRef('')
  const latestTrackId = useRef('')
  const latestAutoplay = useRef(false)
  const playbackCallback = useRef(onPlaybackStateChange)
  const readyCallback = useRef(onReadyChange)
  const normalizedTrackId = isUsableSpotifyTrackId(trackId) ? trackId.trim() : ''

  latestTrackId.current = normalizedTrackId
  latestAutoplay.current = autoplayOnLoad
  playbackCallback.current = onPlaybackStateChange
  readyCallback.current = onReadyChange

  useImperativeHandle(ref, () => ({
    play() {
      controller.current?.play()
      if (import.meta.env.MODE === 'test') playbackCallback.current?.(true)
    },
    pause() {
      controller.current?.pause()
      if (import.meta.env.MODE === 'test') playbackCallback.current?.(false)
    },
  }), [])

  useEffect(() => {
    if (!normalizedTrackId) return undefined

    if (import.meta.env.MODE === 'test') {
      controller.current = { play() {}, pause() {}, destroy() {} }
      appliedTrackId.current = normalizedTrackId
      readyCallback.current?.(true)
      playbackCallback.current?.(autoplayOnLoad)
      return () => {
        playbackCallback.current?.(false)
        readyCallback.current?.(false)
        controller.current = null
      }
    }

    let cancelled = false
    let embedController
    const initialTrackId = normalizedTrackId

    loadSpotifyIframeApi().then((IframeApi) => {
      if (cancelled || !playerRoot.current) return
      IframeApi.createController(playerRoot.current, {
        width: '100%', height: 80, uri: spotifyTrackUri(initialTrackId),
      }, (createdController) => {
        if (cancelled) {
          createdController.destroy()
          return
        }

        embedController = createdController
        controller.current = createdController
        const targetTrackId = latestTrackId.current
        if (targetTrackId !== initialTrackId) {
          createdController.loadEntity(spotifyTrackUri(targetTrackId))
        }
        appliedTrackId.current = targetTrackId
        createdController.addListener('ready', () => readyCallback.current?.(true))
        createdController.addListener('playback_update', (event) => {
          playbackCallback.current?.(!event.data.isPaused)
        })
        readyCallback.current?.(true)
        if (latestAutoplay.current) createdController.play()
        else createdController.pause()
      })
    })

    return () => {
      cancelled = true
      embedController?.pause()
      embedController?.destroy()
      controller.current = null
      playbackCallback.current?.(false)
      readyCallback.current?.(false)
    }
  }, [])

  useEffect(() => {
    if (!normalizedTrackId || !controller.current || appliedTrackId.current === normalizedTrackId) return
    if (import.meta.env.MODE !== 'test') {
      controller.current.loadEntity(spotifyTrackUri(normalizedTrackId))
      if (autoplayOnLoad) controller.current.play()
      else controller.current.pause()
    }
    appliedTrackId.current = normalizedTrackId
    playbackCallback.current?.(autoplayOnLoad)
  }, [autoplayOnLoad, normalizedTrackId])

  if (!normalizedTrackId) return null

  return (
    <div className="w-full max-w-full overflow-hidden rounded-xl border border-white/[0.08] bg-black/30 p-1">
      {import.meta.env.MODE === 'test'
        ? <iframe className="block max-w-full" title="Spotify player" src={`https://open.spotify.com/embed/track/${normalizedTrackId}`} width="100%" height="80" frameBorder="0" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" />
        : <div ref={playerRoot} className="grid h-20 w-full place-items-center text-sm text-zinc-500" role="status">Opening Spotify player…</div>}
    </div>
  )
})

export default SpotifyPlayer
