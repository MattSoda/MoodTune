const SPOTIFY_TRACK_ID_PATTERN = /^[A-Za-z0-9]{22}$/

export function isUsableSpotifyTrackId(trackId) {
  return typeof trackId === 'string' && SPOTIFY_TRACK_ID_PATTERN.test(trackId.trim())
}

export function spotifyTrackUri(trackId) {
  return isUsableSpotifyTrackId(trackId) ? `spotify:track:${trackId.trim()}` : null
}
