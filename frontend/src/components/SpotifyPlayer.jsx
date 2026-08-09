const SPOTIFY_TRACK_ID_PATTERN = /^[A-Za-z0-9]{22}$/

export function isUsableSpotifyTrackId(trackId) {
  return typeof trackId === 'string' && SPOTIFY_TRACK_ID_PATTERN.test(trackId.trim())
}

export default function SpotifyPlayer({ trackId }) {
  if (!isUsableSpotifyTrackId(trackId)) return null

  const normalizedTrackId = trackId.trim()

  return (
    <div className="w-full max-w-full overflow-hidden rounded-xl">
      <iframe
        className="block max-w-full"
        title="Spotify player"
        src={`https://open.spotify.com/embed/track/${normalizedTrackId}`}
        width="100%"
        height="152"
        frameBorder="0"
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="lazy"
      />
    </div>
  )
}
