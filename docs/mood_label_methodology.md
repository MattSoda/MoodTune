# Mood Labeling and Methodology — Phase 4

## Why pseudo-labels are necessary

The Spotify dataset contains audio features and genres, but no verified song
mood labels. MoodTune therefore creates **pseudo-labels** for musical
characteristics; they are not claims about an individual listener’s emotion.

The method is motivated by the affective valence–arousal view, in which affect
can be described along pleasantness and activation dimensions. Here, Spotify
valence is treated as a positivity proxy and energy as an intensity proxy, with
other features only refining those two primary dimensions. See Russell’s
foundational affect model and Spotify’s audio-feature documentation in the
references below.

## Compared approaches

### Rule-only labeling

Fixed feature thresholds are transparent but can be arbitrary and leave many
tracks on a boundary. A pure rule system would also create brittle categories
when applied to another catalogue.

### K-Means clustering

K-Means was tested on standardized valence, energy, danceability, acousticness,
instrumentalness, loudness, tempo, and liveness. It finds structure but does not
recover eight clearly interpretable natural mood groups.

| k | Inertia (10,000-track sample) | Silhouette score |
| ---: | ---: | ---: |
| 2 | 70,482.76 | 0.258 |
| 3 | 62,426.71 | 0.169 |
| 4 | 56,211.52 | 0.177 |
| 5 | 50,742.96 | 0.177 |
| 6 | 46,203.29 | 0.191 |
| 7 | 42,058.50 | 0.196 |
| 8 | 39,841.92 | 0.173 |

Inertia falls as expected, but the weak silhouette values after k=2 indicate
overlap rather than clean mood partitions. K-Means is retained as a diagnostic,
not used directly as the mood truth. A Gaussian mixture model was not added
because it would add complexity without resolving this interpretability issue.

### Selected hybrid method

1. Compute the 25th, 33rd, 50th, 67th, and 75th percentiles from the cleaned
   dataset. These values are data-derived rather than hand-picked constants.
2. Create high-confidence but intentionally overlapping seed groups. For
   example, Angry combines low valence with high energy and loudness; Sad
   combines low valence, lower energy, and higher acousticness.
3. Calculate each seed group’s mean profile using valence, energy,
   danceability, acousticness, instrumentalness, loudness, and tempo.
4. Standardize those features and assign each track to its nearest seed-profile
   prototype. This labels all songs without an arbitrary neutral discard rule.

The reusable implementation is in `ml/config/mood_config.py`; all choices are
reproducible with the fixed random seed 42.

## Song mood classes

The eight selected musical labels are Happy, Sad, Angry, Calm, Relaxed,
Energetic, Romantic, and Motivated. User states Lonely, Stressed, and Bored
remain separate application inputs; they are not ML labels.

| Mood | Tracks | Share | Mean valence | Mean energy | Mean danceability | Mean acousticness | Mean tempo |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Happy | 14,308 | 15.94% | 0.730 | 0.775 | 0.727 | 0.121 | 112.080 |
| Sad | 11,047 | 12.31% | 0.161 | 0.261 | 0.368 | 0.713 | 104.764 |
| Angry | 18,090 | 20.16% | 0.236 | 0.828 | 0.453 | 0.054 | 129.316 |
| Calm | 6,285 | 7.00% | 0.698 | 0.452 | 0.675 | 0.563 | 117.983 |
| Relaxed | 12,978 | 14.46% | 0.376 | 0.372 | 0.544 | 0.708 | 114.129 |
| Energetic | 6,763 | 7.54% | 0.463 | 0.786 | 0.693 | 0.090 | 143.926 |
| Romantic | 10,328 | 11.51% | 0.648 | 0.650 | 0.648 | 0.435 | 112.827 |
| Motivated | 9,941 | 11.08% | 0.658 | 0.833 | 0.516 | 0.106 | 150.071 |

The largest/smallest class ratio is 2.88:1, so Phase 5 must use stratified
splits and macro as well as weighted metrics.

## Quality checks and questionable cases

Class profiles follow the intended broad patterns: Sad is low-valence and
low-energy; Angry is low-valence and high-energy; Relaxed is low-energy and
acoustic; Energetic and Motivated have the highest tempos. However, nearest
feature profiles can produce semantically surprising tracks. For example, the
representative Romantic track is a comedy-labelled recording and the Angry
representative track is a Glee Cast recording. These are useful reminders that
audio-feature pseudo-labels do not understand lyrics, culture, intent, or a
listener’s personal associations.

## Academic limitation

If a supervised classifier is trained on these deterministic feature-derived
labels using the same Spotify features, its performance primarily measures how
well it reproduces this pseudo-labeling procedure. It is **not** validation that
the system can infer true psychological mood. Results must never be presented
as clinical, diagnostic, or universally valid emotional classification.

## References

- Russell, J. A. (1980). *A circumplex model of affect*. Journal of Personality
  and Social Psychology, 39(6), 1161–1178. https://doi.org/10.1037/h0077714
- Spotify for Developers. *Web API documentation and audio features*.
  https://developer.spotify.com/documentation/web-api
