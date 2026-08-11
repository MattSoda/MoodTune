"""Central configuration for MoodTune's standalone recommendation engine."""

from __future__ import annotations

from typing import Final

from ml.config.mood_config import SONG_MOODS, USER_MOODS

MATCH_MOOD = "match_mood"
FEEL_BETTER = "feel_better"
RECOMMENDATION_MODES: Final[tuple[str, ...]] = (MATCH_MOOD, FEEL_BETTER)

ACTIVITIES: Final[tuple[str, ...]] = (
    "studying", "working", "driving", "exercise", "gaming", "party", "traveling", "sleeping",
)

# Values are desired audio-feature profiles on Spotify's normalized 0–1 scale.
# They are transparent starting heuristics, not claims about productivity or health.
ACTIVITY_FEATURE_TARGETS: Final[dict[str, dict[str, float]]] = {
    "studying": {"energy": 0.35, "danceability": 0.40, "acousticness": 0.60, "instrumentalness": 0.35, "speechiness": 0.05, "liveness": 0.12},
    "working": {"energy": 0.50, "danceability": 0.50, "acousticness": 0.40, "instrumentalness": 0.15, "speechiness": 0.05, "liveness": 0.15},
    "driving": {"energy": 0.70, "danceability": 0.65, "acousticness": 0.20, "instrumentalness": 0.05, "speechiness": 0.08, "liveness": 0.20},
    "exercise": {"energy": 0.90, "danceability": 0.75, "acousticness": 0.05, "instrumentalness": 0.02, "speechiness": 0.07, "liveness": 0.20},
    "gaming": {"energy": 0.75, "danceability": 0.65, "acousticness": 0.10, "instrumentalness": 0.05, "speechiness": 0.08, "liveness": 0.20},
    "party": {"energy": 0.90, "danceability": 0.80, "acousticness": 0.05, "instrumentalness": 0.01, "speechiness": 0.10, "liveness": 0.20},
    "traveling": {"energy": 0.60, "danceability": 0.60, "acousticness": 0.30, "instrumentalness": 0.10, "speechiness": 0.07, "liveness": 0.15},
    "sleeping": {"energy": 0.15, "danceability": 0.25, "acousticness": 0.85, "instrumentalness": 0.60, "speechiness": 0.02, "liveness": 0.10},
}

PREFERRED_GENRES: Final[tuple[str, ...]] = (
    "pop", "rock", "hip-hop", "jazz", "edm", "classical", "r-n-b", "country", "indie", "metal",
    "reggae", "blues", "folk", "soul", "funk", "latin",
)

# User states without a direct song-mood class map to the nearest available
# musical profile for Match My Mood. They are intentionally separate from the
# Feel Better transitions below.
MATCH_MOOD_TARGETS: Final[dict[str, str]] = {
    "happy": "happy", "sad": "sad", "angry": "angry", "calm": "calm",
    "relaxed": "relaxed", "energetic": "energetic", "romantic": "romantic",
    "motivated": "motivated", "lonely": "sad", "stressed": "angry", "bored": "calm",
}

MOOD_TRANSITIONS: Final[dict[str, str]] = {
    "sad": "happy", "angry": "calm", "stressed": "relaxed", "lonely": "happy",
    "bored": "energetic", "happy": "happy", "calm": "calm", "relaxed": "relaxed",
    "energetic": "energetic", "romantic": "romantic", "motivated": "motivated",
}

SCORE_WEIGHTS: Final[dict[str, float]] = {
    "mood_compatibility": 0.60,
    "genre_preference": 0.15,
    "activity_context": 0.10,
    "favorite_similarity": 0.10,
    "popularity": 0.05,
}
RECENT_HISTORY_PENALTY: Final = 0.15
MAX_ARTIST_RECOMMENDATIONS: Final = 2
MAX_PRIMARY_GENRE_RECOMMENDATIONS: Final = 4
DEFAULT_LIMIT: Final = 20
MAX_LIMIT: Final = 50

assert set(MATCH_MOOD_TARGETS) == set(USER_MOODS)
assert set(MOOD_TRANSITIONS) == set(USER_MOODS)
assert set(MATCH_MOOD_TARGETS.values()).issubset(SONG_MOODS)
assert set(MOOD_TRANSITIONS.values()).issubset(SONG_MOODS)
assert set(ACTIVITY_FEATURE_TARGETS) == set(ACTIVITIES)
