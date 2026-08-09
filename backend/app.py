"""Flask application factory for MoodTune's REST API."""

from __future__ import annotations

from pathlib import Path
import sys

# Support both `python -m flask` from the project root and `python app.py`
# when the current directory is `backend`.
if __package__ in {None, ""}:
    sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from flask import Flask, g, request
from flask_cors import CORS

from backend.auth import optional_user_id, require_auth
from backend.config.settings import Settings
from backend.repositories.firestore import FirestoreUserRepository
from backend.repositories.unavailable import FirebaseUnavailableRepository
from backend.services.catalogue_service import CatalogueService
from backend.services.recommendation_service import RecommendationService
from backend.utils import bounded_limit, json_body, success
from ml.config.recommendation_config import ACTIVITIES, PREFERRED_GENRES


def _firebase_dependencies(settings: Settings):
    """Create Firebase Admin services only when complete credentials are supplied."""
    if not settings.firebase_is_configured:
        raise RuntimeError("Firebase is not configured.")
    try:
        import firebase_admin
        from firebase_admin import auth, credentials, firestore
    except ImportError as exc:
        raise RuntimeError("firebase-admin is not installed. Install requirements.txt.") from exc
    if not firebase_admin._apps:
        if settings.firebase_service_account_path:
            credential = credentials.Certificate(Path(settings.firebase_service_account_path))
        else:
            credential = credentials.Certificate({
                "type": "service_account", "project_id": settings.firebase_project_id,
                "client_email": settings.firebase_client_email, "private_key": settings.firebase_private_key,
                "token_uri": "https://oauth2.googleapis.com/token",
            })
        firebase_admin.initialize_app(credential, {"projectId": settings.firebase_project_id})
    return FirestoreUserRepository(firestore.client()), auth.verify_id_token


def _profile_payload(payload: dict[str, object]) -> dict[str, object]:
    updates: dict[str, object] = {}
    if "display_name" in payload:
        name = payload["display_name"]
        if not isinstance(name, str) or not name.strip() or len(name.strip()) > 80:
            raise ValueError("display_name must be a non-empty string up to 80 characters.")
        updates["display_name"] = name.strip()
    if "preferred_genres" in payload:
        genres = payload["preferred_genres"]
        if not isinstance(genres, list) or len(genres) > 20 or not all(isinstance(item, str) and item.strip() for item in genres):
            raise ValueError("preferred_genres must be a list of up to 20 non-empty strings.")
        updates["preferred_genres"] = sorted({item.strip().lower() for item in genres})
    if "favorite_artists" in payload:
        artists = payload["favorite_artists"]
        if not isinstance(artists, list) or len(artists) > 20 or not all(isinstance(item, str) and item.strip() for item in artists):
            raise ValueError("favorite_artists must be a list of up to 20 non-empty strings.")
        updates["favorite_artists"] = sorted({item.strip() for item in artists}, key=str.lower)
    if "bio" in payload:
        bio = payload["bio"]
        if not isinstance(bio, str) or len(bio.strip()) > 500:
            raise ValueError("bio must be a string up to 500 characters.")
        updates["bio"] = bio.strip()
    if "avatar_url" in payload:
        avatar_url = payload["avatar_url"]
        if not isinstance(avatar_url, str) or len(avatar_url) > 2_000 or not avatar_url.startswith("https://"):
            raise ValueError("avatar_url must be a valid HTTPS URL.")
        updates["avatar_url"] = avatar_url
    if not updates:
        raise ValueError("Provide at least one profile field to update.")
    return updates


def _recommendation_payload(payload: dict[str, object]) -> dict[str, object]:
    """Validate optional recommendation context without changing mood behavior."""
    if "mood" not in payload or "mode" not in payload:
        raise ValueError("mood and mode are required.")
    payload["limit"] = bounded_limit(payload.get("limit"))
    if "activity" in payload and payload["activity"] is not None:
        activity = payload["activity"]
        if not isinstance(activity, str) or activity.strip().lower() not in ACTIVITIES:
            raise ValueError(f"activity must be one of: {', '.join(ACTIVITIES)}.")
        payload["activity"] = activity.strip().lower()
    if "preferred_genres" in payload:
        genres = payload["preferred_genres"]
        if not isinstance(genres, list) or not all(isinstance(item, str) and item.strip() for item in genres):
            raise ValueError("preferred_genres must be a list of non-empty strings.")
        normalized = sorted({item.strip().lower() for item in genres})
        unsupported = sorted(set(normalized).difference(PREFERRED_GENRES))
        if unsupported:
            raise ValueError(f"Unsupported preferred_genres: {', '.join(unsupported)}.")
        payload["preferred_genres"] = normalized
    return payload


def create_app(settings: Settings | None = None, repository=None, token_verifier=None) -> Flask:
    """Create a configured application; tests can inject repository and verifier."""
    settings = settings or Settings.from_environment()
    app = Flask(__name__)
    app.config.update(SECRET_KEY=settings.secret_key)
    CORS(app, resources={r"/api/*": {"origins": settings.cors_origins}})

    firebase_available = False
    firebase_error: str | None = None
    if repository is None:
        if settings.firebase_is_configured:
            try:
                repository, firebase_verifier = _firebase_dependencies(settings)
                token_verifier = token_verifier or firebase_verifier
                firebase_available = True
            except (RuntimeError, ValueError) as exc:
                firebase_error = str(exc)
                repository = FirebaseUnavailableRepository(
                    "Firebase credentials are unavailable or invalid. Check the Firebase environment configuration."
                )
        else:
            repository = FirebaseUnavailableRepository()
    else:
        firebase_available = settings.firebase_is_configured
    if token_verifier is None:
        token_verifier = lambda token: (_ for _ in ()).throw(PermissionError("Firebase authentication is unavailable."))
    app.extensions["user_repository"] = repository
    app.extensions["token_verifier"] = token_verifier
    app.extensions["firebase_error"] = firebase_error
    catalogue = CatalogueService()
    recommendation_service = RecommendationService(repository)

    @app.errorhandler(ValueError)
    def handle_validation_error(error):
        return {"error": {"message": str(error), "status": 400}}, 400

    @app.errorhandler(RuntimeError)
    def handle_runtime_error(error):
        return {"error": {"message": str(error), "status": 503}}, 503

    @app.errorhandler(PermissionError)
    def handle_authentication_error(error):
        return {"error": {"message": str(error), "status": 401}}, 401

    @app.get("/api/health")
    def health():
        return success({"status": "ok", "firebase_configured": firebase_available})

    @app.post("/api/auth/verify")
    @require_auth
    def verify_authentication():
        return success({"user_id": g.user_id})

    @app.post("/api/recommend")
    def recommend():
        payload = _recommendation_payload(json_body())
        user_id = optional_user_id()
        return success(recommendation_service.recommend(payload, user_id=user_id))

    @app.get("/api/search")
    def search():
        query = request.args.get("q", "").strip()
        if not 1 <= len(query) <= 100:
            raise ValueError("q must contain between 1 and 100 characters.")
        minimum_popularity = request.args.get("min_popularity")
        minimum_value = None
        if minimum_popularity is not None:
            try:
                minimum_value = int(minimum_popularity)
            except ValueError as exc:
                raise ValueError("min_popularity must be an integer.") from exc
            if not 0 <= minimum_value <= 100:
                raise ValueError("min_popularity must be between 0 and 100.")
        records = catalogue.search(
            query, request.args.get("mood"), request.args.get("genre"), minimum_value,
            bounded_limit(request.args.get("limit")),
        )
        return success({"query": query, "results": records})

    @app.get("/api/profile")
    @require_auth
    def get_profile():
        return success({"profile": repository.get_profile(g.user_id)})

    @app.put("/api/profile")
    @require_auth
    def update_profile():
        return success({"profile": repository.update_profile(g.user_id, _profile_payload(json_body()))})

    @app.get("/api/favorites")
    @require_auth
    def list_favorites():
        return success({"favorites": repository.list_favorites(g.user_id)})

    @app.post("/api/favorites")
    @require_auth
    def add_favorite():
        track_id = json_body().get("track_id")
        if not isinstance(track_id, str) or not track_id.strip():
            raise ValueError("track_id is required.")
        track = catalogue.get_track(track_id.strip())
        if track is None:
            return {"error": {"message": "Track was not found.", "status": 404}}, 404
        return success({"favorite": repository.add_favorite(g.user_id, track)}, 201)

    @app.delete("/api/favorites/<track_id>")
    @require_auth
    def remove_favorite(track_id: str):
        if not repository.remove_favorite(g.user_id, track_id):
            return {"error": {"message": "Favorite was not found.", "status": 404}}, 404
        return success({"message": "Favorite removed."})

    @app.get("/api/history")
    @require_auth
    def history():
        return success({"history": repository.list_history(g.user_id, bounded_limit(request.args.get("limit")))})

    return app


app = create_app()

if __name__ == "__main__":
    app.run(debug=True)
