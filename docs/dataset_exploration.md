# Dataset Exploration — Phase 1

## Dataset summary

The original file is `data/raw/dataset.csv`, a CSV containing 114,000 rows and
21 columns. It is the Spotify multi-genre dataset: each of 114 genre labels
contains 1,000 source rows. The raw file was inspected only; it was not changed.

| Item | Finding |
| --- | --- |
| Filename and format | `dataset.csv` (CSV) |
| Row and column count | 114,000 rows; 21 columns |
| Missing values | One row (0.0009%) lacks `artists`, `album_name`, and `track_name`; all other columns have no missing values |
| Exact duplicate rows | 0 |
| Duplicate track identifiers | 89,741 unique IDs; 24,259 repeated-ID rows across 16,641 repeated-ID groups |
| Genres | 114 genres, each with 1,000 rows |
| Playlist field | No playlist column is present |
| Suspicious values | One record has zero duration and missing metadata; 157 mostly ambient/classical tracks report zero tempo, danceability, speechiness, valence, and time signature |

## Duplicate and quality findings

For a repeated `track_id`, all audio features and descriptive metadata are
identical. Only `popularity` varies for 720 track IDs, and 16,299 repeated IDs
have more than one genre label. This indicates legitimate catalogue overlap
rather than exact duplicate source rows.

All bounded audio features are within their expected 0–1 range. `key` is 0–11,
`mode` is binary, popularity is 0–100, and no negative durations occur. Tempo
ranges from 0 to 243.372 BPM, loudness from -49.531 to 4.532 dB, duration from
0 to 5,237,295 ms, and time signature from 0 to 5. These extreme values are
investigated in Phase 2 but not automatically removed.

## Column documentation

| Column name | Data type | Meaning | ML usefulness | Recommendation usefulness | Preprocessing needed |
| --- | --- | --- | --- | --- | --- |
| `Unnamed: 0` | integer | Export row index | None | None | Drop |
| `track_id` | string | Spotify track identifier | Identifier only | Essential identifier | Deduplicate at track level |
| `artists` | string | Artist credits | Not a base mood feature | Search/display | Require non-missing |
| `album_name` | string | Album title | None | Search/display | Require non-missing |
| `track_name` | string | Track title | None | Search/display | Require non-missing |
| `popularity` | integer | Spotify popularity score | Exclude from mood labeling | Ranking signal | Retain; no scaling in master CSV |
| `duration_ms` | integer | Duration in milliseconds | Possible quality/context feature | Display/filtering | Retain positive values |
| `explicit` | boolean | Explicit-content flag | Not a base mood feature | Optional filtering | Retain |
| `danceability` | float | Dance suitability | High | Useful ranking context | Scale only in ML pipeline if needed |
| `energy` | float | Perceived intensity | High | Useful ranking context | Scale only in ML pipeline if needed |
| `key` | integer | Musical key | Investigate | Low | Retain |
| `loudness` | float | Average loudness (dB) | Medium | Possible ranking context | Retain; inspect extremes |
| `mode` | integer | Major/minor mode | Investigate | Low | Retain |
| `speechiness` | float | Spoken-word proportion | Medium | Possible context | Scale only in ML pipeline if needed |
| `acousticness` | float | Acoustic confidence | High | Useful ranking context | Scale only in ML pipeline if needed |
| `instrumentalness` | float | Instrumental confidence | Medium | Useful ranking context | Scale only in ML pipeline if needed |
| `liveness` | float | Live-performance likelihood | Low | Possible context | Retain |
| `valence` | float | Musical positivity | High | Useful ranking context | Scale only in ML pipeline if needed |
| `tempo` | float | Beats per minute | Medium | Useful ranking context | Retain zero values pending musical interpretation |
| `time_signature` | integer | Meter estimate | Low | Low | Retain zero/unknown values |
| `track_genre` | string | Dataset genre label | Do not use as target without justification | Useful metadata | Consolidate across repeated tracks |
