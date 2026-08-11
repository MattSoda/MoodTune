"""Recent, personalized, and trending search discovery signals."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
import math


class SearchDiscoveryService:
    """Rank small discovery cohorts without requiring an online ML service."""

    def __init__(self, repository) -> None:
        self.repository = repository

    @staticmethod
    def _as_datetime(value: object) -> datetime:
        if isinstance(value, datetime):
            return value if value.tzinfo else value.replace(tzinfo=timezone.utc)
        return datetime.fromisoformat(str(value).replace("Z", "+00:00"))

    def trending(self, region: str | None, limit: int = 8) -> list[dict[str, object]]:
        now = datetime.now(timezone.utc)
        events = self.repository.list_search_events(now - timedelta(hours=24))
        buckets: dict[str, dict[str, object]] = {}
        for event in events:
            normalized = str(event.get("normalized_query", "")).strip()
            if not normalized:
                continue
            bucket = buckets.setdefault(normalized, {"query": event.get("query", normalized), "count": 0, "score": 0.0})
            age_hours = max(0.0, (now - self._as_datetime(event["searched_at"])).total_seconds() / 3600)
            decay = math.exp(-age_hours / 6.0)
            regional_boost = 1.35 if region and event.get("region") == region else 1.0
            velocity_boost = 1.5 if age_hours <= 1 else 1.0
            bucket["count"] = int(bucket["count"]) + 1
            bucket["score"] = float(bucket["score"]) + decay * regional_boost * velocity_boost
        ranked = sorted(buckets.values(), key=lambda item: (float(item["score"]), int(item["count"])), reverse=True)
        return [{**item, "score": round(float(item["score"]), 3), "source": "trending"} for item in ranked[:limit]]

    def personalized(self, user_id: str | None, trending: list[dict[str, object]], limit: int = 8) -> list[dict[str, object]]:
        cold_start_queries = ["pop", "acoustic", "dance", "chill", "jazz", "rock", "classical", "indie"]
        if not user_id:
            seeds = trending or [{"query": query, "score": 0.0} for query in cold_start_queries]
            return [{**item, "reason": "Popular with MoodTune listeners", "source": "cold_start"} for item in seeds[:limit]]
        profile = self.repository.get_profile(user_id) or {}
        favorites = self.repository.list_favorites(user_id)
        recent = self.repository.list_recent_searches(user_id, 20)
        candidates: dict[str, dict[str, object]] = {}

        def add(query: object, score: float, reason: str) -> None:
            label = str(query).strip()
            key = " ".join(label.lower().split())
            if not key:
                return
            candidate = candidates.setdefault(key, {"query": label, "score": 0.0, "reason": reason, "source": "personalized"})
            candidate["score"] = float(candidate["score"]) + score
            if score >= float(candidate["score"]) / 2:
                candidate["reason"] = reason

        for genre in profile.get("preferred_genres", []):
            add(genre, 3.0, "From your preferred genres")
        for artist in profile.get("favorite_artists", []):
            add(artist, 3.5, "An artist from your profile")
        for favorite in favorites:
            add(favorite.get("artists"), 4.0, "Because you saved this artist")
            for genre in str(favorite.get("genres", "")).replace(";", ",").split(",")[:3]:
                add(genre, 2.0, "Inspired by your favorites")
        now = datetime.now(timezone.utc)
        for item in recent:
            age_days = max(0.0, (now - self._as_datetime(item["searched_at"])).total_seconds() / 86400)
            add(item.get("query"), 2.5 * math.exp(-age_days / 14), "Based on your recent searches")
        for index, item in enumerate(trending):
            add(item["query"], 0.8 / (index + 1), "Trending with listeners like you")
        ranked = sorted(candidates.values(), key=lambda item: float(item["score"]), reverse=True)
        if not ranked:
            ranked = [{"query": query, "score": 0.0, "reason": "A popular place to start", "source": "cold_start"} for query in cold_start_queries]
        return [{**item, "score": round(float(item["score"]), 3)} for item in ranked[:limit]]

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
                "window_hours": 24,
                "cohort": f"region:{region}" if region else "global",
                "ranking": "6-hour exponential decay with 1-hour velocity and regional boosts",
                "blend": {"recent": 1.0, "personalized": 0.85, "trending": 0.65},
                "cold_start": not bool(user_id and has_personal_signals),
            },
        }
