"""Environment-based Flask and Firebase settings."""

from __future__ import annotations

import os
from dataclasses import dataclass


@dataclass(frozen=True)
class Settings:
    secret_key: str
    cors_origins: list[str]
    firebase_project_id: str | None
    firebase_client_email: str | None
    firebase_private_key: str | None
    firebase_service_account_path: str | None

    @classmethod
    def from_environment(cls) -> "Settings":
        origins = [origin.strip() for origin in os.getenv("FLASK_CORS_ORIGINS", "http://localhost:5173").split(",") if origin.strip()]
        return cls(
            secret_key=os.getenv("FLASK_SECRET_KEY", "development-only-change-me"),
            cors_origins=origins,
            firebase_project_id=os.getenv("FIREBASE_PROJECT_ID") or None,
            firebase_client_email=os.getenv("FIREBASE_CLIENT_EMAIL") or None,
            firebase_private_key=os.getenv("FIREBASE_PRIVATE_KEY", "").replace("\\n", "\n") or None,
            firebase_service_account_path=os.getenv("FIREBASE_SERVICE_ACCOUNT_PATH") or None,
        )

    @property
    def firebase_is_configured(self) -> bool:
        return bool(
            self.firebase_service_account_path
            or (self.firebase_project_id and self.firebase_client_email and self.firebase_private_key)
        )
