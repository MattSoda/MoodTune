# Data Cleaning — Phase 2

## Objective and output

`data/processed/spotify_cleaned.csv` is a track-level dataset for subsequent
EDA, mood labeling, and recommendation work. The original `data/raw/dataset.csv`
was not modified.

## Cleaning summary

| Measure | Result |
| --- | ---: |
| Raw rows | 114,000 |
| Rows after cleaning | 89,740 |
| Rows removed through missing-metadata exclusion | 1 |
| Rows consolidated through track-ID duplication | 24,259 |
| Final unique `track_id` values | 89,740 |

## Decisions

1. Dropped `Unnamed: 0`, an export-index artifact with no analytical value.
2. Dropped one record with missing artist, album, and track name. It also had a
   zero duration, so it is not reliable catalogue data for recommendations.
3. Built one row per `track_id`. For duplicate tracks, audio features and core
   metadata were identical. The maximum observed popularity was retained.
4. Preserved every associated genre by replacing `track_genre` with the
   semicolon-separated `track_genres` field.
5. Retained legitimate statistical outliers, including long continuous mixes,
   low loudness recordings, and unusual tempos. IQR outliers are not automatic errors.
6. Retained zero tempo and related values on non-beat-oriented music.
7. Did not impute values: the only missing record was removed.
8. Did not normalize the CSV. Scaling, if necessary, belongs inside later ML pipelines.

## Validation

The cleaning notebook checks the source schema, duplicate-record consistency,
complete core metadata, one final row per `track_id`, positive duration, and
bounded audio features.

## Limitations

The source has no playlist column. `track_genres` reflects dataset labels, not
necessarily a complete Spotify genre taxonomy. Loudness values above 0 dB are
unusual and remain visible for later EDA rather than being altered.
