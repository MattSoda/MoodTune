# Search discovery signals

MoodTune exposes `GET /api/search/discovery` and renders three independent sections in this order: Recent, Recommended for you, and Trending. Recent contains search text, while Recommended and Trending contain catalogue songs. The response exposes the cold-start state and ranking sources for observability.

## Recent searches

Only submitted searches and clicked suggestions are recorded; debounced result previews are not. Queries are normalized for case and whitespace, hashed to a stable per-user document ID, and overwritten on repeat. This produces deduplication while moving the repeated query to the front. The UI shows at most eight entries and supports deleting one entry or clearing all entries.

The current server-side Firestore strategy works across devices and browsers. A privacy-first anonymous alternative is `localStorage`, using a small versioned JSON array with the same normalization, a 30-day TTL, and a storage-event listener for tab synchronization. It is simpler but is device-local, can be cleared by the browser, and should never contain sensitive derived attributes.

## Trending songs

Trending does not use MoodTune search events. It ranks songs by the Spotify popularity value supplied in the catalogue snapshot, deduplicates song names, and limits each primary artist to two entries so one artist cannot fill the column. Search events may still be retained for analytics, but they have no effect on this ranking.

This popularity value reflects the date of the local Spotify dataset rather than a live chart. A production deployment can replace the catalogue adapter with a licensed, regularly refreshed chart feed while preserving the response shape.

## Personalized recommendations

For each recent query, the ranker uses its highest-popularity catalogue results as seed songs. It excludes the top 20 direct results and then ranks other tracks using audio-feature distance (55%), genre overlap (20%), mood (10%), artist (5%), and popularity (10%), with newer searches weighted more heavily. Returned items are therefore related songs, never the recent query itself. Favorite songs and profile artists or genres are used only as fallback seeds when there is no usable recent search.

For signed-out users or accounts without usable history, the popular catalogue songs provide a deterministic cold start.

## Privacy

The UI does not interleave sources. Never infer or expose precise location, protected demographics, or another user's activity. Account deletion must clear per-user recent-search documents.
