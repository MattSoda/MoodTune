"""Cached, validated production prediction helpers for MoodTune."""

from __future__ import annotations

from functools import lru_cache
from pathlib import Path
from typing import Mapping, Sequence

import joblib
import numpy as np
import pandas as pd

from ml.training.train_mood_classifier import MODEL_FEATURES, MODEL_PATH


@lru_cache(maxsize=4)
def load_mood_model(model_path: str = str(MODEL_PATH)):
    """Load a saved pipeline once per model path."""
    path = Path(model_path)
    if not path.is_file():
        raise FileNotFoundError(f"Mood model was not found: {path}")
    return joblib.load(path)


def _validated_frame(records: Sequence[Mapping[str, float]]) -> pd.DataFrame:
    if not records:
        raise ValueError("At least one song feature record is required.")
    frame = pd.DataFrame(records)
    missing = set(MODEL_FEATURES).difference(frame.columns)
    if missing:
        raise ValueError(f"Missing required audio features: {sorted(missing)}")
    frame = frame.loc[:, MODEL_FEATURES].apply(pd.to_numeric, errors="raise")
    if not np.isfinite(frame.to_numpy()).all():
        raise ValueError("Audio features must be finite numeric values.")
    return frame


def predict_songs(
    records: Sequence[Mapping[str, float]], model_path: Path | str = MODEL_PATH
) -> list[dict[str, object]]:
    """Predict pseudo-moods for one or more validated song feature records."""
    frame = _validated_frame(records)
    model = load_mood_model(str(model_path))
    labels = model.predict(frame)
    probabilities = model.predict_proba(frame) if hasattr(model, "predict_proba") else None
    outcomes: list[dict[str, object]] = []
    for index, label in enumerate(labels):
        result: dict[str, object] = {"predicted_mood": str(label)}
        if probabilities is not None:
            scores = probabilities[index]
            result["confidence"] = float(scores.max())
            result["probabilities"] = {
                str(mood): float(score) for mood, score in zip(model.classes_, scores)
            }
        outcomes.append(result)
    return outcomes


def predict_song(
    record: Mapping[str, float], model_path: Path | str = MODEL_PATH
) -> dict[str, object]:
    """Predict a pseudo-mood for a single audio-feature mapping."""
    return predict_songs([record], model_path=model_path)[0]
