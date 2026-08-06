"""Transparent, database-independent music recommendation engine."""

from __future__ import annotations

from collections import Counter
from pathlib import Path
from typing import Iterable, Sequence

import numpy as np
import pandas as pd

from ml.config.mood_config import SONG_MOODS, USER_MOODS
from ml.config.recommendation_config import (
    ACTIVITIES,
    ACTIVITY_FEATURE_TARGETS,
    DEFAULT_LIMIT,
    FEEL_BETTER,
    MATCH_MOOD,
    MATCH_MOOD_TARGETS,
    MAX_ARTIST_RECOMMENDATIONS,
    MAX_LIMIT,
    MAX_PRIMARY_GENRE_RECOMMENDATIONS,
    MOOD_TRANSITIONS,
    RECENT_HISTORY_PENALTY,
    RECOMMENDATION_MODES,
    SCORE_WEIGHTS,
)
from ml.prediction import load_mood_model
from ml.training.train_mood_classifier import MODEL_FEATURES

PROJECT_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_CATALOGUE_PATH = PROJECT_ROOT / "data" / "processed" / "spotify_mood_labeled.csv"


class MoodRecommendationEngine:
    """Rank catalogued tracks for a mood and optional lightweight preferences."""

    def __init__(self, catalogue_path: Path | str = DEFAULT_CATALOGUE_PATH) -> None:
        self.catalogue_path = Path(catalogue_path)
        self._catalogue = self._load_catalogue()
        self._feature_mean = self._catalogue.loc[:, MODEL_FEATURES].mean()
        self._feature_std = self._catalogue.loc[:, MODEL_FEATURES].std().replace(0, 1)

    def _load_catalogue(self) -> pd.DataFrame:
        if not self.catalogue_path.is_file():
            raise FileNotFoundError(f"Labeled catalogue was not found: {self.catalogue_path}")
        catalogue = pd.read_csv(self.catalogue_path)
        required = {"track_id", "track_name", "artists", "track_genres", "popularity", "mood"} | set(MODEL_FEATURES)
        missing = required.difference(catalogue.columns)
        if missing:
            raise ValueError(f"Catalogue is missing columns: {sorted(missing)}")
        if catalogue["track_id"].duplicated().any():
            raise ValueError("Catalogue must contain exactly one row per track ID.")
        if set(catalogue["mood"]).difference(SONG_MOODS):
            raise ValueError("Catalogue contains unsupported song moods.")
        return catalogue

    @staticmethod
    def _normalize_mood(mood: str) -> str:
        normalized = mood.strip().lower() if isinstance(mood, str) else ""
        if normalized not in USER_MOODS:
            raise ValueError(f"Unsupported mood: {mood!r}")
        return normalized

    @staticmethod
    def _normalize_mode(mode: str) -> str:
        normalized = mode.strip().lower() if isinstance(mode, str) else ""
        if normalized not in RECOMMENDATION_MODES:
            raise ValueError(f"Unsupported recommendation mode: {mode!r}")
        return normalized

    def target_mood_for(self, mood: str, mode: str) -> str:
        """Resolve a user state to a supported target song mood."""
        normalized_mood = self._normalize_mood(mood)
        normalized_mode = self._normalize_mode(mode)
        if normalized_mode == MATCH_MOOD:
            return MATCH_MOOD_TARGETS[normalized_mood]
        return MOOD_TRANSITIONS[normalized_mood]

    @staticmethod
    def _normalize_activity(activity: str | None) -> str | None:
        if activity is None:
            return None
        normalized = activity.strip().lower() if isinstance(activity, str) else ""
        if normalized not in ACTIVITIES:
            raise ValueError(f"Unsupported activity: {activity!r}")
        return normalized

    @staticmethod
    def _genre_set(value: str) -> set[str]:
        return {genre.strip().lower() for genre in value.split(";") if genre.strip()}

    def _favorite_similarity(self, candidates: pd.DataFrame, favorite_track_ids: set[str]) -> pd.Series | None:
        favorites = self._catalogue[self._catalogue["track_id"].isin(favorite_track_ids)]
        if favorites.empty:
            return None
        profile = favorites.loc[:, MODEL_FEATURES].mean()
        normalized = (candidates.loc[:, MODEL_FEATURES] - profile) / self._feature_std
        distances = np.sqrt((normalized**2).sum(axis=1))
        return 1 / (1 + distances)

    def _mood_probabilities(self, candidates: pd.DataFrame, target_mood: str) -> pd.Series:
        model = load_mood_model()
        class_index = list(model.classes_).index(target_mood)
        probabilities = model.predict_proba(candidates.loc[:, MODEL_FEATURES])[:, class_index]
        return pd.Series(probabilities, index=candidates.index)

    @staticmethod
    def _activity_similarity(candidates: pd.DataFrame, activity: str) -> pd.Series:
        target = pd.Series(ACTIVITY_FEATURE_TARGETS[activity])
        differences = candidates.loc[:, target.index].sub(target, axis="columns").abs()
        return 1 - differences.mean(axis=1)

    @staticmethod
    def _primary_artist(value: str) -> str:
        return value.split(";")[0].strip().lower()

    @staticmethod
    def _primary_genre(value: str) -> str:
        return value.split(";")[0].strip().lower()

    def recommend(
        self,
        mood: str,
        mode: str,
        limit: int = DEFAULT_LIMIT,
        activity: str | None = None,
        preferred_genres: Iterable[str] | None = None,
        favorite_track_ids: Iterable[str] | None = None,
        recent_track_ids: Iterable[str] | None = None,
    ) -> dict[str, object]:
        """Return ranked, diverse recommendations and their transparent context."""
        if isinstance(limit, bool) or not isinstance(limit, int) or not 1 <= limit <= MAX_LIMIT:
            raise ValueError(f"limit must be an integer between 1 and {MAX_LIMIT}.")
        current_mood = self._normalize_mood(mood)
        normalized_mode = self._normalize_mode(mode)
        target_mood = self.target_mood_for(current_mood, normalized_mode)
        normalized_activity = self._normalize_activity(activity)
        preferred = {value.strip().lower() for value in (preferred_genres or []) if value and value.strip()}
        favorites = {str(value) for value in (favorite_track_ids or [])}
        recent = {str(value) for value in (recent_track_ids or [])}

        candidates = self._catalogue[self._catalogue["mood"].eq(target_mood)].copy()
        without_recent = candidates[~candidates["track_id"].isin(recent)]
        use_recent_fallback = len(without_recent) < limit * 3
        if not use_recent_fallback:
            candidates = without_recent

        candidates["mood_compatibility"] = self._mood_probabilities(candidates, target_mood)
        candidates["popularity_score"] = candidates["popularity"] / 100
        active_scores: dict[str, pd.Series] = {
            "mood_compatibility": candidates["mood_compatibility"],
            "popularity": candidates["popularity_score"],
        }
        if preferred:
            candidates["genre_preference"] = candidates["track_genres"].map(
                lambda genres: float(bool(self._genre_set(genres).intersection(preferred)))
            )
            active_scores["genre_preference"] = candidates["genre_preference"]
        if normalized_activity:
            candidates["activity_context"] = self._activity_similarity(candidates, normalized_activity)
            active_scores["activity_context"] = candidates["activity_context"]
        favorite_similarity = self._favorite_similarity(candidates, favorites)
        if favorite_similarity is not None:
            candidates["favorite_similarity"] = favorite_similarity
            active_scores["favorite_similarity"] = favorite_similarity

        active_weight_total = sum(SCORE_WEIGHTS[name] for name in active_scores)
        candidates["recommendation_score"] = sum(
            active_scores[name] * (SCORE_WEIGHTS[name] / active_weight_total)
            for name in active_scores
        )
        candidates["history_penalty"] = 0.0
        if use_recent_fallback and recent:
            candidates.loc[candidates["track_id"].isin(recent), "history_penalty"] = RECENT_HISTORY_PENALTY
            candidates["recommendation_score"] -= candidates["history_penalty"]
        candidates = candidates.sort_values("recommendation_score", ascending=False)

        selected: list[dict[str, object]] = []
        artist_counts: Counter[str] = Counter()
        genre_counts: Counter[str] = Counter()
        for _, song in candidates.iterrows():
            artist = self._primary_artist(song["artists"])
            genre = self._primary_genre(song["track_genres"])
            if artist_counts[artist] >= MAX_ARTIST_RECOMMENDATIONS:
                continue
            if genre_counts[genre] >= MAX_PRIMARY_GENRE_RECOMMENDATIONS:
                continue
            selected.append({
                "track_id": song["track_id"], "track_name": song["track_name"],
                "artists": song["artists"], "genres": song["track_genres"],
                "predicted_mood": song["mood"], "popularity": int(song["popularity"]),
                "recommendation_score": round(float(song["recommendation_score"]), 4),
                "score_components": {
                    "mood_compatibility": round(float(song["mood_compatibility"]), 4),
                    "popularity": round(float(song["popularity_score"]), 4),
                    "genre_preference": round(float(song.get("genre_preference", 0.0)), 4),
                    "activity_context": round(float(song.get("activity_context", 0.0)), 4),
                    "favorite_similarity": round(float(song.get("favorite_similarity", 0.0)), 4),
                    "history_penalty": round(float(song["history_penalty"]), 4),
                },
            })
            artist_counts[artist] += 1
            genre_counts[genre] += 1
            if len(selected) == limit:
                break
        if not selected:
            raise RuntimeError(f"No candidates available for target mood: {target_mood}")
        return {
            "current_mood": current_mood,
            "mode": normalized_mode,
            "target_mood": target_mood,
            "activity": normalized_activity,
            "recommendations": selected,
        }
