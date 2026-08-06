"""Behavior tests for the framework-independent recommendation engine."""

import pytest

from ml.config.mood_config import USER_MOODS
from ml.config.recommendation_config import (
    MATCH_MOOD_TARGETS,
    MAX_ARTIST_RECOMMENDATIONS,
    MAX_PRIMARY_GENRE_RECOMMENDATIONS,
    MOOD_TRANSITIONS,
)
from ml.recommendation.engine import MoodRecommendationEngine


@pytest.fixture(scope="module")
def engine() -> MoodRecommendationEngine:
    return MoodRecommendationEngine()


def test_match_mood_returns_ranked_target_tracks(engine: MoodRecommendationEngine) -> None:
    result = engine.recommend("happy", "match_mood", limit=10)
    recommendations = result["recommendations"]
    assert result["target_mood"] == "happy"
    assert len(recommendations) == 10
    assert {track["predicted_mood"] for track in recommendations} == {"happy"}
    scores = [track["recommendation_score"] for track in recommendations]
    assert scores == sorted(scores, reverse=True)
    assert len({track["track_id"] for track in recommendations}) == len(recommendations)


@pytest.mark.parametrize(
    ("mood", "expected_target"),
    [("sad", "happy"), ("angry", "calm"), ("stressed", "relaxed"), ("bored", "energetic")],
)
def test_feel_better_transitions(engine: MoodRecommendationEngine, mood: str, expected_target: str) -> None:
    result = engine.recommend(mood, "feel_better", limit=3)
    assert result["target_mood"] == expected_target
    assert all(track["predicted_mood"] == expected_target for track in result["recommendations"])


def test_cold_start_and_preference_signals(engine: MoodRecommendationEngine) -> None:
    cold_start = engine.recommend("relaxed", "match_mood", limit=5)
    assert len(cold_start["recommendations"]) == 5
    favorite_id = cold_start["recommendations"][0]["track_id"]
    personalized = engine.recommend(
        "relaxed", "match_mood", limit=5, preferred_genres=["acoustic"], favorite_track_ids=[favorite_id]
    )
    assert any(track["score_components"]["genre_preference"] > 0 for track in personalized["recommendations"])
    assert any(track["score_components"]["favorite_similarity"] > 0 for track in personalized["recommendations"])


def test_activity_context_is_optional_and_returned(engine: MoodRecommendationEngine) -> None:
    result = engine.recommend("calm", "match_mood", limit=5, activity="studying", preferred_genres=["jazz"])
    assert result["activity"] == "studying"
    assert all("activity_context" in track["score_components"] for track in result["recommendations"])


def test_invalid_inputs_are_rejected(engine: MoodRecommendationEngine) -> None:
    with pytest.raises(ValueError, match="Unsupported mood"):
        engine.recommend("worried", "match_mood")
    with pytest.raises(ValueError, match="Unsupported recommendation mode"):
        engine.recommend("happy", "improve")
    with pytest.raises(ValueError, match="limit must be"):
        engine.recommend("happy", "match_mood", limit=0)
    with pytest.raises(ValueError, match="Unsupported activity"):
        engine.recommend("happy", "match_mood", activity="commuting")


@pytest.mark.parametrize("mood", USER_MOODS)
@pytest.mark.parametrize("mode", ["match_mood", "feel_better"])
def test_every_user_mood_and_mode_returns_candidates(
    engine: MoodRecommendationEngine, mood: str, mode: str
) -> None:
    result = engine.recommend(mood, mode, limit=1)
    expected_target = MATCH_MOOD_TARGETS[mood] if mode == "match_mood" else MOOD_TRANSITIONS[mood]
    assert result["target_mood"] == expected_target
    assert result["recommendations"][0]["predicted_mood"] == expected_target


def test_diversity_and_recent_history_exclusion(engine: MoodRecommendationEngine) -> None:
    initial = engine.recommend("happy", "match_mood", limit=20)["recommendations"]
    artist_counts: dict[str, int] = {}
    genre_counts: dict[str, int] = {}
    for track in initial:
        artist = track["artists"].split(";")[0].strip().lower()
        genre = track["genres"].split(";")[0].strip().lower()
        artist_counts[artist] = artist_counts.get(artist, 0) + 1
        genre_counts[genre] = genre_counts.get(genre, 0) + 1
    assert max(artist_counts.values()) <= MAX_ARTIST_RECOMMENDATIONS
    assert max(genre_counts.values()) <= MAX_PRIMARY_GENRE_RECOMMENDATIONS

    recent_ids = [track["track_id"] for track in initial]
    follow_up = engine.recommend("happy", "match_mood", limit=10, recent_track_ids=recent_ids)
    assert not {track["track_id"] for track in follow_up["recommendations"]}.intersection(recent_ids)
