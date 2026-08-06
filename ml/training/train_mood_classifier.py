"""Reproducible Phase 5 training workflow for MoodTune's pseudo-mood model."""

from __future__ import annotations

import json
from pathlib import Path
from time import perf_counter
from typing import Any

import joblib
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report, precision_recall_fscore_support
from sklearn.model_selection import GridSearchCV, StratifiedKFold, train_test_split
from sklearn.neighbors import KNeighborsClassifier
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.svm import LinearSVC
from sklearn.tree import DecisionTreeClassifier

from ml.config.mood_config import RANDOM_SEED, SONG_MOODS

MODEL_FEATURES = (
    "valence", "energy", "danceability", "acousticness", "instrumentalness",
    "speechiness", "loudness", "tempo", "liveness",
)
TARGET_COLUMN = "mood"
PROJECT_ROOT = Path(__file__).resolve().parents[2]
LABELED_DATA_PATH = PROJECT_ROOT / "data" / "processed" / "spotify_mood_labeled.csv"
MODEL_PATH = PROJECT_ROOT / "ml" / "models" / "mood_classifier.joblib"
METRICS_PATH = PROJECT_ROOT / "ml" / "models" / "model_metrics.json"


def load_training_data(path: Path = LABELED_DATA_PATH) -> tuple[pd.DataFrame, pd.Series]:
    """Load and validate the unique-track pseudo-mood training data."""
    data = pd.read_csv(path)
    required = set(MODEL_FEATURES) | {TARGET_COLUMN, "track_id"}
    missing = required.difference(data.columns)
    if missing:
        raise ValueError(f"Training data is missing columns: {sorted(missing)}")
    if data["track_id"].duplicated().any():
        raise ValueError("Duplicate track IDs would risk train/test leakage.")
    if data.loc[:, MODEL_FEATURES].isna().any().any() or data[TARGET_COLUMN].isna().any():
        raise ValueError("Training data contains missing feature or target values.")
    unknown_moods = set(data[TARGET_COLUMN]).difference(SONG_MOODS)
    if unknown_moods:
        raise ValueError(f"Training data contains unsupported moods: {sorted(unknown_moods)}")
    return data.loc[:, MODEL_FEATURES], data[TARGET_COLUMN]


def build_model_candidates() -> dict[str, Pipeline]:
    """Build the required baseline classifiers in self-contained pipelines."""
    return {
        "logistic_regression": Pipeline([
            ("scaler", StandardScaler()),
            ("model", LogisticRegression(max_iter=1000, random_state=RANDOM_SEED)),
        ]),
        "decision_tree": Pipeline([
            ("scaler", StandardScaler()),
            ("model", DecisionTreeClassifier(random_state=RANDOM_SEED, min_samples_leaf=2)),
        ]),
        "random_forest": Pipeline([
            ("scaler", StandardScaler()),
            ("model", RandomForestClassifier(
                n_estimators=150, random_state=RANDOM_SEED, n_jobs=-1, min_samples_leaf=2
            )),
        ]),
        "knn": Pipeline([
            ("scaler", StandardScaler()),
            ("model", KNeighborsClassifier(n_neighbors=15, weights="distance", n_jobs=-1)),
        ]),
        "linear_svm": Pipeline([
            ("scaler", StandardScaler()),
            ("model", LinearSVC(random_state=RANDOM_SEED, dual="auto", max_iter=10000)),
        ]),
    }


def evaluate_model(model: Pipeline, X_test: pd.DataFrame, y_test: pd.Series) -> dict[str, Any]:
    """Return consistent multiclass metrics and a serializable class report."""
    predictions = model.predict(X_test)
    macro = precision_recall_fscore_support(y_test, predictions, average="macro", zero_division=0)
    weighted = precision_recall_fscore_support(y_test, predictions, average="weighted", zero_division=0)
    return {
        "accuracy": float((predictions == y_test).mean()),
        "macro_precision": float(macro[0]),
        "macro_recall": float(macro[1]),
        "macro_f1": float(macro[2]),
        "weighted_precision": float(weighted[0]),
        "weighted_recall": float(weighted[1]),
        "weighted_f1": float(weighted[2]),
        "classification_report": classification_report(y_test, predictions, output_dict=True, zero_division=0),
    }


def train_and_select_model() -> tuple[Pipeline, dict[str, Any]]:
    """Compare baselines, tune the strongest model, and persist its pipeline."""
    X, y = load_training_data()
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=RANDOM_SEED, stratify=y
    )

    results: dict[str, Any] = {
        "dataset": {
            "rows": len(X), "features": list(MODEL_FEATURES), "target": TARGET_COLUMN,
            "train_rows": len(X_train), "test_rows": len(X_test),
            "class_counts": y.value_counts().reindex(list(SONG_MOODS)).to_dict(),
        },
        "baselines": {},
    }
    candidates = build_model_candidates()
    for name, model in candidates.items():
        started = perf_counter()
        model.fit(X_train, y_train)
        metrics = evaluate_model(model, X_test, y_test)
        metrics["fit_seconds"] = perf_counter() - started
        results["baselines"][name] = metrics

    tuning = GridSearchCV(
        estimator=Pipeline([
            ("scaler", StandardScaler()),
            ("model", LogisticRegression(max_iter=2000, random_state=RANDOM_SEED)),
        ]),
        param_grid={
            "model__C": [0.3, 1.0, 3.0],
        },
        scoring="f1_macro",
        cv=StratifiedKFold(n_splits=3, shuffle=True, random_state=RANDOM_SEED),
        n_jobs=-1,
        refit=True,
    )
    started = perf_counter()
    tuning.fit(X_train, y_train)
    final_model = tuning.best_estimator_
    final_metrics = evaluate_model(final_model, X_test, y_test)
    final_metrics["fit_and_tuning_seconds"] = perf_counter() - started
    results["final_model"] = {
        "name": "logistic_regression",
        "best_parameters": tuning.best_params_,
        "cross_validation_macro_f1": float(tuning.best_score_),
        "test_metrics": final_metrics,
    }

    MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(final_model, MODEL_PATH)
    METRICS_PATH.write_text(json.dumps(results, indent=2), encoding="utf-8")
    return final_model, results


if __name__ == "__main__":
    _, training_results = train_and_select_model()
    print(json.dumps(training_results["final_model"], indent=2))
