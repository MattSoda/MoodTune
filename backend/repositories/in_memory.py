"""Test-only repository with the same behavior expected from Firestore."""

from __future__ import annotations

from copy import deepcopy
from datetime import datetime, timezone
import hashlib


class InMemoryUserRepository:
    def __init__(self) -> None:
        self.profiles: dict[str, dict[str, object]] = {}
        self.favorites: dict[str, dict[str, dict[str, object]]] = {}
        self.history: dict[str, list[dict[str, object]]] = {}
        self.recent_searches: dict[str, dict[str, dict[str, object]]] = {}
        self.search_events: list[dict[str, object]] = []

    @staticmethod
    def _now() -> str:
        return datetime.now(timezone.utc).isoformat()

    def get_profile(self, user_id: str) -> dict[str, object] | None:
        profile = self.profiles.get(user_id)
        return deepcopy(profile) if profile else None

    def create_user(self, user_id: str, values: dict[str, object]) -> dict[str, object]:
        if user_id in self.profiles:
            raise ValueError("A user profile already exists for this account.")
        username = values["username_normalized"]
        if any(profile.get("username_normalized") == username for profile in self.profiles.values()):
            raise ValueError("That username is already taken.")
        now = self._now()
        profile = {**values, "user_id": user_id, "created_at": now, "updated_at": now}
        self.profiles[user_id] = profile
        return deepcopy(profile)

    def update_profile(self, user_id: str, values: dict[str, object]) -> dict[str, object]:
        existing = self.profiles.get(user_id, {"user_id": user_id, "created_at": self._now()})
        existing.update(values)
        existing["updated_at"] = self._now()
        self.profiles[user_id] = existing
        return deepcopy(existing)

    def list_favorites(self, user_id: str) -> list[dict[str, object]]:
        return [deepcopy(item) for item in self.favorites.get(user_id, {}).values()]

    def add_favorite(self, user_id: str, track: dict[str, object]) -> dict[str, object]:
        bucket = self.favorites.setdefault(user_id, {})
        stored = {**track, "added_at": bucket.get(track["track_id"], {}).get("added_at", self._now())}
        bucket[str(track["track_id"])] = stored
        return deepcopy(stored)

    def remove_favorite(self, user_id: str, track_id: str) -> bool:
        return self.favorites.get(user_id, {}).pop(track_id, None) is not None

    def record_history(self, user_id: str, record: dict[str, object]) -> None:
        self.history.setdefault(user_id, []).append({**record, "created_at": self._now()})

    def list_history(self, user_id: str, limit: int) -> list[dict[str, object]]:
        records = self.history.get(user_id, [])
        return [deepcopy(record) for record in reversed(records[-limit:])]

    def record_search(self, user_id: str | None, query: str, region: str | None) -> None:
        now = self._now()
        normalized = " ".join(query.lower().split())
        search_id = hashlib.sha256(normalized.encode("utf-8")).hexdigest()[:20]
        event = {"query": query, "normalized_query": normalized, "region": region, "searched_at": now}
        self.search_events.append(event)
        if user_id:
            self.recent_searches.setdefault(user_id, {})[search_id] = {
                **event, "id": search_id,
            }

    def list_recent_searches(self, user_id: str, limit: int) -> list[dict[str, object]]:
        records = self.recent_searches.get(user_id, {}).values()
        ordered = sorted(records, key=lambda item: str(item["searched_at"]), reverse=True)
        return [deepcopy(record) for record in ordered[:limit]]

    def delete_recent_search(self, user_id: str, search_id: str) -> bool:
        return self.recent_searches.get(user_id, {}).pop(search_id, None) is not None

    def clear_recent_searches(self, user_id: str) -> int:
        count = len(self.recent_searches.get(user_id, {}))
        self.recent_searches[user_id] = {}
        return count

    def list_search_events(self, since: object) -> list[dict[str, object]]:
        cutoff = since.isoformat() if hasattr(since, "isoformat") else str(since)
        return [deepcopy(event) for event in self.search_events if str(event["searched_at"]) >= cutoff]
