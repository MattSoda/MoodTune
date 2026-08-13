"""API integration tests using injected Firebase-like dependencies."""

import pytest

from backend.app import create_app
from backend.config.settings import Settings
from backend.repositories.in_memory import InMemoryUserRepository


@pytest.fixture()
def client():
    repository = InMemoryUserRepository()

    def verify_token(token):
        users = {"valid-token": "test-user", "other-token": "other-user"}
        if token not in users:
            raise ValueError()
        return {"uid": users[token]}

    app = create_app(
        settings=Settings("test-secret", ["http://localhost:5173"], None, None, None, None),
        repository=repository,
        token_verifier=verify_token,
    )
    app.config["TESTING"] = True
    return app.test_client()


AUTH = {"Authorization": "Bearer valid-token"}


def test_health_and_public_recommendation(client) -> None:
    assert client.get("/api/health").get_json()["status"] == "ok"
    response = client.post("/api/recommend", json={"mood": "sad", "mode": "feel_better", "activity": "studying", "preferred_genres": ["jazz", "classical", "reggae"], "limit": 3})
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


def test_search_discovery_separates_recent_related_and_popular_tracks(client) -> None:
    for query in ["jazz", "pop", "jazz"]:
        response = client.get(f"/api/search?q={query}&record=true", headers={**AUTH, "X-MoodTune-Region": "mm"})
        assert response.status_code == 200

    discovery = client.get("/api/search/discovery?region=mm&limit=5", headers=AUTH)
    assert discovery.status_code == 200
    body = discovery.get_json()
    assert [item["query"] for item in body["recent"]] == ["jazz", "pop"]
    assert all(item["source"] == "catalogue_popularity" for item in body["trending"])
    assert body["trending"] == sorted(body["trending"], key=lambda item: item["popularity"], reverse=True)
    assert all(item["source"] == "search_similarity" for item in body["recommended"])
    assert {item["query"].casefold() for item in body["recommended"]}.isdisjoint({"jazz", "pop"})
    assert all(item.get("track_id") and item.get("artists") for item in body["recommended"])
    assert body["meta"]["cohort"] == "global"
    assert body["meta"]["trending_source"] == "spotify_catalogue_popularity"
    assert body["recommended"]

    recent_id = body["recent"][0]["id"]
    assert client.delete(f"/api/search/recent/{recent_id}", headers=AUTH).status_code == 200
    assert len(client.get("/api/search/discovery", headers=AUTH).get_json()["recent"]) == 1
    cleared = client.delete("/api/search/recent", headers=AUTH)
    assert cleared.get_json()["deleted"] == 1
    assert client.delete(f"/api/search/recent/{recent_id}", headers=AUTH).status_code == 404


def test_auth_profile_favorites_and_history(client) -> None:
    assert client.get("/api/profile").status_code == 401
    profile = client.put("/api/profile", headers=AUTH, json={
        "display_name": "Mood User", "preferred_genres": ["acoustic"],
        "favorite_artists": ["Artist One", "Artist Two"], "bio": "Music helps me focus.",
        "avatar_url": "https://example.test/profile.jpg",
    })
    assert profile.status_code == 200
    assert profile.get_json()["profile"]["display_name"] == "Mood User"
    assert profile.get_json()["profile"]["name"] == "Mood User"
    assert profile.get_json()["profile"]["favorite_artists"] == ["Artist One", "Artist Two"]

    recommendation = client.post("/api/recommend", headers=AUTH, json={"mood": "stressed", "mode": "feel_better", "activity": "working", "limit": 1})
    track_id = recommendation.get_json()["recommendations"][0]["track_id"]
    assert client.post("/api/favorites", headers=AUTH, json={"track_id": track_id}).status_code == 201
    assert len(client.get("/api/favorites", headers=AUTH).get_json()["favorites"]) == 1
    history = client.get("/api/history", headers=AUTH).get_json()["history"]
    assert len(history) == 1
    assert history[0]["activity"] == "working"
    assert client.delete(f"/api/favorites/{track_id}", headers=AUTH).status_code == 200


def test_registers_application_user_and_validates_fields(client) -> None:
    response = client.post("/api/auth/register", headers=AUTH, json={
        "name": "Mood User", "username": "mood_user", "email": "mood@example.com",
    })
    assert response.status_code == 201
    user = response.get_json()["user"]
    assert user["display_name"] == "Mood User"
    assert user["username_normalized"] == "mood_user"

    assert client.post("/api/auth/register", json={}).status_code == 401
    assert client.post("/api/auth/register", headers=AUTH, json={
        "name": "M", "username": "not valid", "email": "invalid",
    }).status_code == 400
    assert client.post("/api/auth/register", headers=AUTH, json={
        "name": "Another User", "username": "another", "email": "another@example.com",
    }).status_code == 400


def test_rejects_invalid_bearer_token(client) -> None:
    response = client.get("/api/favorites", headers={"Authorization": "Bearer bad-token"})
    assert response.status_code == 401
    response = client.post(
        "/api/recommend", headers={"Authorization": "Bearer bad-token"},
        json={"mood": "happy", "mode": "match_mood"},
    )
    assert response.status_code == 401


def test_mood_frequency_requires_authentication(client) -> None:
    assert client.get("/api/insights/mood-frequency").status_code == 401
    assert client.get(
        "/api/insights/mood-frequency",
        headers={"Authorization": "Bearer bad-token"},
    ).status_code == 401


def test_mood_frequency_aggregates_complete_current_mood_history(client) -> None:
    repository = client.application.extensions["user_repository"]
    for _ in range(55):
        repository.record_history("test-user", {"current_mood": "stressed", "target_mood": "happy"})
    for _ in range(5):
        repository.record_history("test-user", {"current_mood": "happy", "target_mood": "stressed"})

    response = client.get("/api/insights/mood-frequency", headers=AUTH)

    assert response.status_code == 200
    assert response.get_json() == {
        "mood_frequency": [
            {"mood": "stressed", "count": 55},
            {"mood": "happy", "count": 5},
        ],
        "total_check_ins": 60,
    }


def test_mood_frequency_returns_empty_insight_without_history(client) -> None:
    response = client.get("/api/insights/mood-frequency", headers=AUTH)

    assert response.status_code == 200
    assert response.get_json() == {"mood_frequency": [], "total_check_ins": 0}


def test_mood_frequency_keeps_authenticated_users_isolated(client) -> None:
    repository = client.application.extensions["user_repository"]
    repository.record_history("test-user", {"current_mood": "calm", "target_mood": "calm"})
    for _ in range(3):
        repository.record_history("other-user", {"current_mood": "sad", "target_mood": "happy"})

    first_user = client.get("/api/insights/mood-frequency?user_id=other-user", headers=AUTH)
    other_user = client.get(
        "/api/insights/mood-frequency?user_id=test-user",
        headers={"Authorization": "Bearer other-token"},
    )

    assert first_user.get_json() == {
        "mood_frequency": [{"mood": "calm", "count": 1}],
        "total_check_ins": 1,
    }
    assert other_user.get_json() == {
        "mood_frequency": [{"mood": "sad", "count": 3}],
        "total_check_ins": 3,
    }
