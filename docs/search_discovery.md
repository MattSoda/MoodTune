# Search discovery signals

MoodTune exposes `GET /api/search/discovery` and renders three independent sections in this order: Recent, Recommended for you, and Trending. Keeping sections separate makes each suggestion understandable and prevents a global trend from displacing a user's latest intent. The response also exposes the active cohort, cold-start state, scoring description, and blend weights for observability and future experiments.

## Recent searches

Only submitted searches and clicked suggestions are recorded; debounced result previews are not. Queries are normalized for case and whitespace, hashed to a stable per-user document ID, and overwritten on repeat. This produces deduplication while moving the repeated query to the front. The UI shows at most eight entries and supports deleting one entry or clearing all entries.

The current server-side Firestore strategy works across devices and browsers. A privacy-first anonymous alternative is `localStorage`, using a small versioned JSON array with the same normalization, a 30-day TTL, and a storage-event listener for tab synchronization. It is simpler but is device-local, can be cleared by the browser, and should never contain sensitive derived attributes. At larger scale, Redis sorted sets (`recent:{userId}`) can provide TTLs and fast ranking; the durable deletion/audit record should remain in the primary database when policy requires it.

## Trending searches

Each intentional search appends a global event containing the normalized query, timestamp, and optional coarse region. Discovery reads the rolling 24-hour cohort and applies:

`score = Σ exp(-ageHours / 6) × (1.5 when age ≤ 1 hour) × (1.35 for matching region)`

This emphasizes velocity and freshness while retaining enough volume signal to resist single-event spikes. Production deployments with high traffic should aggregate events into hourly Redis sorted sets, merge the last 24 buckets, and expire buckets after 48 hours. Count-Min Sketch is appropriate when query cardinality makes exact counters expensive; keep a small exact top-K heap to recover labels. An exponential moving average of current versus baseline traffic can replace the one-hour multiplier when several weeks of baseline data are available. Abuse filtering, minimum distinct-user thresholds, and coarse regions should be applied before public display.

## Personalized recommendations

The lightweight ranker builds query candidates from profile genres, profile artists, saved-track artists and genres, recent searches with a 14-day decay, and a small trending prior. These act as transparent category-affinity and item-to-item signals and include a human-readable reason. A later version can replace candidate generation with track/artist embeddings in a vector index or collaborative-filtering factors while preserving this response contract.

For signed-out users or accounts with no history, popular trends seed recommendations. If the system itself has no events, a curated set of broad music genres provides a deterministic cold start.

## Blending and privacy

The UI does not interleave sources, but the API reports default experimental weights of 1.0 recent, 0.85 personalized, and 0.65 trending. A unified carousel can use those weights with reciprocal-rank fusion and cross-source deduplication. Never infer or expose precise location, protected demographics, or another user's activity. Retention jobs should delete raw global events after their aggregation window, and account deletion must clear per-user recent-search documents.
