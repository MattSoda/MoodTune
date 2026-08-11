"""Read-only catalogue queries for search and favorite snapshots."""

from __future__ import annotations

from functools import lru_cache
from pathlib import Path

import numpy as np
import pandas as pd

from ml.config.mood_config import SONG_MOODS

PROJECT_ROOT = Path(__file__).resolve().parents[2]
CATALOGUE_PATH = PROJECT_ROOT / "data" / "processed" / "spotify_mood_labeled.csv"
DISCOVERY_FEATURES = [
    "danceability", "energy", "loudness", "speechiness", "acousticness",
    "instrumentalness", "liveness", "valence", "tempo",
]


class CatalogueService:
    @staticmethod
    @lru_cache(maxsize=1)
    def _catalogue() -> pd.DataFrame:
        return pd.read_csv(CATALOGUE_PATH)

    def search(self, query: str, mood: str | None, genre: str | None, minimum_popularity: int | None, limit: int) -> list[dict[str, object]]:
        catalogue = self._catalogue()
        matches = (
            catalogue["track_name"].str.contains(query, case=False, regex=False, na=False)
            | catalogue["artists"].str.contains(query, case=False, regex=False, na=False)
            | catalogue["track_genres"].str.contains(query, case=False, regex=False, na=False)
        )
        results = catalogue[matches]
        if mood:
            if mood not in SONG_MOODS:
                raise ValueError("Unsupported song mood filter.")
            results = results[results["mood"].eq(mood)]
        if genre:
            results = results[results["track_genres"].str.contains(genre, case=False, regex=False, na=False)]
        if minimum_popularity is not None:
            results = results[results["popularity"] >= minimum_popularity]
        fields = ["track_id", "track_name", "artists", "track_genres", "mood", "popularity"]
        return results.sort_values("popularity", ascending=False).head(limit)[fields].to_dict("records")

    def get_track(self, track_id: str) -> dict[str, object] | None:
        matches = self._catalogue()[lambda frame: frame["track_id"].eq(track_id)]
        if matches.empty:
            return None
        track = matches.iloc[0]
        return {
            "track_id": track["track_id"], "track_name": track["track_name"], "artists": track["artists"],
            "genres": track["track_genres"], "predicted_mood": track["mood"], "popularity": int(track["popularity"]),
        }

    @staticmethod
    def _normalize(value: object) -> str:
        return " ".join(str(value).casefold().split())

    @staticmethod
    def _primary_artist(value: object) -> str:
        return str(value).split(";")[0].strip().casefold()

    @staticmethod
    def _genre_set(value: object) -> set[str]:
        return {genre.strip().casefold() for genre in str(value).split(";") if genre.strip()}

    @classmethod
    @lru_cache(maxsize=1)
    def _normalized_discovery_features(cls) -> np.ndarray:
        catalogue = cls._catalogue()
        features = catalogue.loc[:, DISCOVERY_FEATURES].apply(pd.to_numeric, errors="coerce")
        features = features.fillna(features.mean())
        standard_deviation = features.std().replace(0, 1)
        return ((features - features.mean()) / standard_deviation).to_numpy(dtype=float)

    @staticmethod
    def _discovery_track(track: pd.Series, *, score: float, reason: str, source: str) -> dict[str, object]:
        track_name = str(track["track_name"])
        artists = str(track["artists"])
        return {
            "id": str(track["track_id"]),
            "track_id": str(track["track_id"]),
            "query": track_name,
            "label": f"{track_name} — {artists}",
            "track_name": track_name,
            "artists": artists,
            "genres": str(track["track_genres"]),
            "predicted_mood": str(track["mood"]),
            "popularity": int(track["popularity"]),
            "score": round(float(score), 4),
            "reason": reason,
            "source": source,
        }

    def popular_tracks(self, limit: int = 8) -> list[dict[str, object]]:
        """Return catalogue songs ranked by Spotify popularity, with light artist diversity."""
        catalogue = self._catalogue().sort_values(
            ["popularity", "track_name"], ascending=[False, True], kind="stable",
        )
        selected: list[dict[str, object]] = []
        artist_counts: dict[str, int] = {}
        seen_names: set[str] = set()
        for _, track in catalogue.iterrows():
            artist = self._primary_artist(track["artists"])
            name = self._normalize(track["track_name"])
            if not name or name in seen_names or artist_counts.get(artist, 0) >= 2:
                continue
            popularity = int(track["popularity"])
            selected.append(self._discovery_track(
                track,
                score=popularity / 100,
                reason=f"Spotify popularity: {popularity}/100",
                source="catalogue_popularity",
            ))
            seen_names.add(name)
            artist_counts[artist] = artist_counts.get(artist, 0) + 1
            if len(selected) == limit:
                break
        return selected

    def related_tracks(self, searches: list[dict[str, object]], limit: int = 8) -> list[dict[str, object]]:
        """Find songs similar to search-result seeds while excluding those direct results."""
        if not searches:
            return []

        catalogue = self._catalogue()
        normalized_features = self._normalized_discovery_features()
        searchable = (
            catalogue["track_name"].fillna("").astype(str).str.casefold() + " "
            + catalogue["artists"].fillna("").astype(str).str.casefold() + " "
            + catalogue["track_genres"].fillna("").astype(str).str.casefold()
        )
        combined_scores = np.full(len(catalogue), -np.inf, dtype=float)
        strongest_seed = np.full(len(catalogue), "", dtype=object)
        excluded_indices: set[int] = set()
        normalized_queries: set[str] = set()

        for position, search in enumerate(searches[:8]):
            query = str(search.get("query", "")).strip()
            normalized_query = self._normalize(query)
            if not normalized_query:
                continue
            normalized_queries.add(normalized_query)
            matches = catalogue[searchable.str.contains(normalized_query, regex=False)]
            if matches.empty:
                continue

            # Exclude the same top results that a direct search returned. A smaller
            # subset of those results anchors the related-track similarity profile.
            direct_results = matches.sort_values("popularity", ascending=False, kind="stable").head(20)
            excluded_indices.update(int(index) for index in direct_results.index)
            seed_rows = direct_results.head(5)
            seed_positions = catalogue.index.get_indexer(seed_rows.index)
            seed_profile = normalized_features[seed_positions].mean(axis=0)
            distances = np.sqrt(np.mean((normalized_features - seed_profile) ** 2, axis=1))
            audio_similarity = 1 / (1 + distances)

            seed_genres = set().union(*(self._genre_set(value) for value in seed_rows["track_genres"]))
            genre_similarity = catalogue["track_genres"].map(
                lambda value: len(self._genre_set(value).intersection(seed_genres)) / max(1, len(self._genre_set(value).union(seed_genres)))
            ).to_numpy(dtype=float)
            seed_moods = set(seed_rows["mood"].astype(str))
            mood_similarity = catalogue["mood"].astype(str).isin(seed_moods).to_numpy(dtype=float)
            seed_artists = {self._primary_artist(value) for value in seed_rows["artists"]}
            artist_similarity = catalogue["artists"].map(
                lambda value: float(self._primary_artist(value) in seed_artists)
            ).to_numpy(dtype=float)
            popularity = catalogue["popularity"].to_numpy(dtype=float) / 100
            score = (
                audio_similarity * 0.55
                + genre_similarity * 0.20
                + mood_similarity * 0.10
                + artist_similarity * 0.05
                + popularity * 0.10
            )
            recency_weight = float(np.exp(-position / 3))
            score *= 0.75 + (0.25 * recency_weight)
            is_stronger = score > combined_scores
            combined_scores = np.maximum(combined_scores, score)
            strongest_seed[is_stronger] = query

        if not np.isfinite(combined_scores).any():
            return []

        candidates = catalogue.copy()
        candidates["_related_score"] = combined_scores
        candidates["_seed_query"] = strongest_seed
        candidates = candidates[np.isfinite(candidates["_related_score"])]
        if excluded_indices:
            candidates = candidates[~candidates.index.isin(excluded_indices)]
        candidates = candidates[
            ~candidates["track_name"].map(self._normalize).isin(normalized_queries)
        ].sort_values(["_related_score", "popularity"], ascending=[False, False], kind="stable")

        selected: list[dict[str, object]] = []
        artist_counts: dict[str, int] = {}
        seen_names: set[str] = set()
        for _, track in candidates.iterrows():
            artist = self._primary_artist(track["artists"])
            name = self._normalize(track["track_name"])
            if not name or name in seen_names or artist_counts.get(artist, 0) >= 2:
                continue
            selected.append(self._discovery_track(
                track,
                score=float(track["_related_score"]),
                reason=f"Related to “{track['_seed_query']}”",
                source="search_similarity",
            ))
            seen_names.add(name)
            artist_counts[artist] = artist_counts.get(artist, 0) + 1
            if len(selected) == limit:
                break
        return selected
