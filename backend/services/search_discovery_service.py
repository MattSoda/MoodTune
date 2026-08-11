"""Recent searches plus catalogue-based related and popular song discovery."""

from __future__ import annotations

from backend.services.catalogue_service import CatalogueService


class SearchDiscoveryService:
    """Rank small discovery cohorts without requiring an online ML service."""

    def __init__(self, repository, catalogue: CatalogueService | None = None) -> None:
        self.repository = repository
        self.catalogue = catalogue or CatalogueService()

    def trending(self, _region: str | None, limit: int = 8) -> list[dict[str, object]]:
        return self.catalogue.popular_tracks(limit)

    def personalized(self, user_id: str | None, trending: list[dict[str, object]], limit: int = 8) -> list[dict[str, object]]:
        if not user_id:
            return [{**item, "reason": "Popular across the Spotify catalogue", "source": "cold_start"} for item in trending[:limit]]
        profile = self.repository.get_profile(user_id) or {}
        favorites = self.repository.list_favorites(user_id)
        recent = self.repository.list_recent_searches(user_id, 20)
        related = self.catalogue.related_tracks(recent, limit)
        if related:
            return related

        # Favorites and profile preferences provide seeds before the first useful
        # search, but every returned item is still a different catalogue song.
        preference_seeds = [
            *({"query": favorite.get("track_name", "")} for favorite in favorites),
            *({"query": artist} for artist in profile.get("favorite_artists", [])),
            *({"query": genre} for genre in profile.get("preferred_genres", [])),
        ]
        related = self.catalogue.related_tracks(preference_seeds, limit)
        if related:
            return related
        return [{**item, "reason": "Popular across the Spotify catalogue", "source": "cold_start"} for item in trending[:limit]]

    def discovery(self, user_id: str | None, region: str | None, limit: int = 8) -> dict[str, object]:
        trends = self.trending(region, limit)
        recent = self.repository.list_recent_searches(user_id, limit) if user_id else []
        profile = self.repository.get_profile(user_id) if user_id else None
        favorites = self.repository.list_favorites(user_id) if user_id else []
        has_personal_signals = bool(recent or favorites or (profile or {}).get("preferred_genres") or (profile or {}).get("favorite_artists"))
        return {
            "recent": recent,
            "recommended": self.personalized(user_id, trends, limit),
            "trending": trends,
            "meta": {
                "cohort": "global",
                "ranking": "Spotify catalogue popularity with artist diversity",
                "recommended_ranking": "audio-feature, genre, mood, artist, recency, and popularity similarity",
                "trending_source": "spotify_catalogue_popularity",
                "cold_start": not bool(user_id and has_personal_signals),
            },
        }
