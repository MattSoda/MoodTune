# Recommendation Engine — Phase 6

## Scope

The Phase 6 engine is framework-independent: it reads the labeled catalogue and
saved Phase 5 model directly, without Flask, Firebase, or user-interface code.

## Target mood logic

`match_mood` maps a user state to the closest supported song-mood profile.
Direct song moods map to themselves; the user-only states map as follows:
Lonely → Sad, Stressed → Angry, and Bored → Calm. This avoids pretending that
those user states are machine-learning song labels.

`feel_better` uses the separate, centralized `MOOD_TRANSITIONS` map:

| Current user mood | Target song mood |
| --- | --- |
| Sad | Happy |
| Angry | Calm |
| Stressed | Relaxed |
| Lonely | Happy |
| Bored | Energetic |
| All supported positive/direct states | Their corresponding song mood |

These are configurable recommendation choices, not clinical interventions.

## Ranking

Candidates must have the requested target pseudo-mood. Their score combines:

| Signal | Default weight | Purpose |
| --- | ---: | --- |
| Mood compatibility | 0.60 | Final-model probability for the target mood |
| Genre preference | 0.15 | Whether a track has any preferred genre |
| Activity context | 0.10 | Audio-feature fit for an optional current activity |
| Favorite similarity | 0.10 | Standardized audio-feature similarity to saved favorites |
| Popularity | 0.05 | Normalized Spotify popularity |

Only available preference signals are used; their active weights are normalized
to sum to one. This lets cold-start recommendations remain meaningful. Recent
tracks are excluded when sufficient alternatives exist; otherwise they incur a
0.15 score penalty rather than causing an empty result set.

## Diversity and cold start

The engine caps results at two tracks per primary artist and four per primary
genre. Cold-start users receive target-mood candidates ranked by mood
compatibility and popularity. Preferences and favorites refine ranking but never
replace target-mood filtering. Current activity is optional and supports
studying, working, driving, exercise, gaming, party, traveling, and sleeping.
Genre preferences are also optional and may contain multiple supported genres.
Both are ranking signals only: the selected mood and recommendation mode remain
the dominant decision inputs.

## Returned fields

Each recommendation includes track and artist metadata, all retained genres,
predicted song mood, popularity, total score, and transparent score components.
The Flask API in Phase 7 can return this result directly after authentication
and history handling are added.

## Limitations

The weights are initial heuristics, not scientifically optimal values.
Personalization depends on caller-provided preference/history inputs until Phase
7 integrates authenticated Firestore data. Pseudo-mood confidence remains
limited by Phase 4’s feature-derived labels.
