"""Explicit failure behavior when Firebase is not configured."""

from __future__ import annotations


class FirebaseUnavailableRepository:
    def __init__(self, message: str = "Firebase is not configured. Set Firebase Admin environment variables before using user data endpoints.") -> None:
        self.message = message

    def _raise(self):
        raise RuntimeError(self.message)

    def create_user(self, user_id: str, values: dict[str, object]): self._raise()
    def get_profile(self, user_id: str): self._raise()
    def update_profile(self, user_id: str, values: dict[str, object]): self._raise()
    def list_favorites(self, user_id: str): self._raise()
    def add_favorite(self, user_id: str, track: dict[str, object]): self._raise()
    def remove_favorite(self, user_id: str, track_id: str): self._raise()
    def record_history(self, user_id: str, record: dict[str, object]): self._raise()
    def list_history(self, user_id: str, limit: int): self._raise()
