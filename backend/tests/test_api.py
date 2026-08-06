"""API integration tests using injected Firebase-like dependencies."""

import pytest

from backend.app import create_app
from backend.config.settings import Settings
from backend.repositories.in_memory import InMemoryUserRepository


@pytest.fixture()
def client():
    repository = InMemoryUserRepository()
    app = create_app(
        settings=Settings("test-secret", ["http://localhost:5173"], None, None, None, None),
        repository=repository,
        token_verifier=lambda token: {"uid": "test-user"} if token == "valid-token" else (_ for _ in ()).throw(ValueError()),
    )
    app.config["TESTING"] = True
    return app.test_client()


AUTH = {"Authorization": "Bearer valid-token"}


def test_health_and_public_recommendation(client) -> None:
    assert client.get("/api/health").get_json()["status"] == "ok"
    response = client.post("/api/recommend", json={"mood": "sad", "mode": "feel_better", "activity": "studying", "preferred_genres": ["jazz", "classical"], "limit": 3})
    body = response.get_json()
    assert response.status_code == 200
    assert body["target_mood"] == "happy"
    assert body["activity"] == "studying"
    assert all("activity_context" in track["score_components"] for track in body["recommendations"])
    assert len(body["recommendations"]) == 3
    cors = client.options("/api/health", headers={"Origin": "http://localhost:5173", "Access-Control-Request-Method": "GET"})
    assert cors.headers["Access-Control-Allow-Origin"] == "http://localhost:5173"


def test_recommendation_validation_and_search(client) -> None:
    assert client.post("/api/recommend", json={"mood": "sad"}).status_code == 400
    assert client.post("/api/recommend", json={"mood": "sad", "mode": "match_mood", "activity": "commuting"}).status_code == 400
    assert client.post("/api/recommend", json={"mood": "sad", "mode": "match_mood", "preferred_genres": ["ambient"]}).status_code == 400
    assert client.get("/api/search?q=").status_code == 400
    response = client.get("/api/search?q=love&limit=3")
    assert response.status_code == 200
    assert len(response.get_json()["results"]) <= 3


def test_auth_profile_favorites_and_history(client) -> None:
    assert client.get("/api/profile").status_code == 401
    profile = client.put("/api/profile", headers=AUTH, json={"display_name": "Mood User", "preferred_genres": ["acoustic"]})
    assert profile.status_code == 200
    assert profile.get_json()["profile"]["display_name"] == "Mood User"

    recommendation = client.post("/api/recommend", headers=AUTH, json={"mood": "stressed", "mode": "feel_better", "activity": "working", "limit": 1})
    track_id = recommendation.get_json()["recommendations"][0]["track_id"]
    assert client.post("/api/favorites", headers=AUTH, json={"track_id": track_id}).status_code == 201
    assert len(client.get("/api/favorites", headers=AUTH).get_json()["favorites"]) == 1
    history = client.get("/api/history", headers=AUTH).get_json()["history"]
    assert len(history) == 1
    assert history[0]["activity"] == "working"
    assert client.delete(f"/api/favorites/{track_id}", headers=AUTH).status_code == 200


def test_rejects_invalid_bearer_token(client) -> None:
    response = client.get("/api/favorites", headers={"Authorization": "Bearer bad-token"})
    assert response.status_code == 401
    response = client.post(
        "/api/recommend", headers={"Authorization": "Bearer bad-token"},
        json={"mood": "happy", "mode": "match_mood"},
    )
    assert response.status_code == 401
