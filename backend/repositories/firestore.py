"""Firebase Firestore persistence implementation, loaded only when configured."""

from __future__ import annotations

from datetime import datetime, timezone


class FirestoreUserRepository:
    def __init__(self, client) -> None:
        self.client = client

    def _user(self, user_id: str):
        return self.client.collection("users").document(user_id)

    def get_profile(self, user_id: str) -> dict[str, object] | None:
        snapshot = self._user(user_id).get()
        return snapshot.to_dict() if snapshot.exists else None

    def create_user(self, user_id: str, values: dict[str, object]) -> dict[str, object]:
        from google.cloud import firestore

        user = self._user(user_id)
        username = self.client.collection("usernames").document(str(values["username_normalized"]))
        now = datetime.now(timezone.utc)
        payload = {**values, "user_id": user_id, "created_at": now, "updated_at": now}
        transaction = self.client.transaction()

        @firestore.transactional
        def create(transaction):
            user_snapshot = user.get(transaction=transaction)
            username_snapshot = username.get(transaction=transaction)
            if user_snapshot.exists:
                raise ValueError("A user profile already exists for this account.")
            if username_snapshot.exists:
                raise ValueError("That username is already taken.")
            transaction.set(user, payload)
            transaction.set(username, {"user_id": user_id, "created_at": now})

        create(transaction)
        return payload

    def update_profile(self, user_id: str, values: dict[str, object]) -> dict[str, object]:
        document = self._user(user_id)
        existing = self.get_profile(user_id)
        now = datetime.now(timezone.utc)
        payload = {**values, "user_id": user_id, "updated_at": now}
        if existing is None:
            payload["created_at"] = now
        document.set(payload, merge=True)
        return {**(existing or {}), **payload}

    def list_favorites(self, user_id: str) -> list[dict[str, object]]:
        return [snapshot.to_dict() for snapshot in self._user(user_id).collection("favorites").stream()]

    def add_favorite(self, user_id: str, track: dict[str, object]) -> dict[str, object]:
        payload = {**track, "added_at": datetime.now(timezone.utc)}
        self._user(user_id).collection("favorites").document(str(track["track_id"])).set(payload, merge=True)
        return payload

    def remove_favorite(self, user_id: str, track_id: str) -> bool:
        reference = self._user(user_id).collection("favorites").document(track_id)
        exists = reference.get().exists
        if exists:
            reference.delete()
        return exists

    def record_history(self, user_id: str, record: dict[str, object]) -> None:
        self._user(user_id).collection("history").add({**record, "created_at": datetime.now(timezone.utc)})

    def list_history(self, user_id: str, limit: int) -> list[dict[str, object]]:
        query = self._user(user_id).collection("history").order_by("created_at", direction="DESCENDING").limit(limit)
        return [snapshot.to_dict() for snapshot in query.stream()]
