"""Bridge authenticated preferences to the standalone recommendation engine."""

from __future__ import annotations

from ml.recommendation.engine import MoodRecommendationEngine


class RecommendationService:
    def __init__(self, repository, engine: MoodRecommendationEngine | None = None) -> None:
        self.repository = repository
        self.engine = engine or MoodRecommendationEngine()

    def recommend(self, payload: dict[str, object], user_id: str | None = None) -> dict[str, object]:
        profile = self.repository.get_profile(user_id) if user_id else None
        favorites = self.repository.list_favorites(user_id) if user_id else []
        history = self.repository.list_history(user_id, limit=100) if user_id else []
        request_genres = payload.get("preferred_genres")
        preferred_genres = request_genres or (profile or {}).get("preferred_genres", [])
        result = self.engine.recommend(
            mood=str(payload["mood"]), mode=str(payload["mode"]), limit=int(payload.get("limit", 20)),
            activity=payload.get("activity"), preferred_genres=preferred_genres,
            favorite_track_ids=[str(item["track_id"]) for item in favorites],
            recent_track_ids=[track_id for record in history for track_id in record.get("track_ids", [])],
        )
        if user_id:
            self.repository.record_history(user_id, {
                "current_mood": result["current_mood"], "mode": result["mode"], "target_mood": result["target_mood"], "activity": result["activity"],
                "track_ids": [track["track_id"] for track in result["recommendations"]],
            })
        return result
