"""Aggregate authenticated recommendation history into user insights."""

from __future__ import annotations

from collections import Counter


class InsightsService:
    def __init__(self, repository) -> None:
        self.repository = repository

    def mood_frequency(self, user_id: str) -> dict[str, object]:
        """Count every recorded current mood for one authenticated user."""
        history = self.repository.list_history(user_id, limit=None)
        counts = Counter(
            mood.strip().lower()
            for record in history
            if isinstance((mood := record.get("current_mood")), str) and mood.strip()
        )
        mood_frequency = [
            {"mood": mood, "count": count}
            for mood, count in sorted(counts.items(), key=lambda item: (-item[1], item[0]))
        ]
        return {
            "mood_frequency": mood_frequency,
            "total_check_ins": sum(counts.values()),
        }
