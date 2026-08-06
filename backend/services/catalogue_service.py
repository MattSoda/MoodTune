"""Read-only catalogue queries for search and favorite snapshots."""

from __future__ import annotations

from functools import lru_cache
from pathlib import Path

import pandas as pd

from ml.config.mood_config import SONG_MOODS

PROJECT_ROOT = Path(__file__).resolve().parents[2]
CATALOGUE_PATH = PROJECT_ROOT / "data" / "processed" / "spotify_mood_labeled.csv"


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
