"""Tests for the Phase 5 production prediction interface."""

from pathlib import Path

import pandas as pd
import pytest

from ml.config.mood_config import SONG_MOODS
from ml.prediction import predict_song, predict_songs
from ml.training.train_mood_classifier import MODEL_FEATURES, MODEL_PATH


@pytest.fixture(scope="module")
def example_record() -> dict[str, float]:
    data = pd.read_csv(Path("data/processed/spotify_mood_labeled.csv"))
    return data.loc[0, list(MODEL_FEATURES)].to_dict()


def test_predict_song_returns_a_supported_mood(example_record: dict[str, float]) -> None:
    assert MODEL_PATH.is_file(), "Run Phase 5 training before executing this test."
    result = predict_song(example_record)
    assert result["predicted_mood"] in SONG_MOODS
    assert 0.0 <= result["confidence"] <= 1.0
    assert set(result["probabilities"]) == set(SONG_MOODS)


def test_predict_songs_supports_a_batch(example_record: dict[str, float]) -> None:
    results = predict_songs([example_record, example_record])
    assert len(results) == 2


def test_prediction_rejects_missing_features(example_record: dict[str, float]) -> None:
    incomplete = dict(example_record)
    incomplete.pop("tempo")
    with pytest.raises(ValueError, match="Missing required audio features"):
        predict_song(incomplete)
