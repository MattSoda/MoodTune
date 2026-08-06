"""Configuration and reproducible pseudo-mood labeling helpers.

The labels created here are music-feature pseudo-labels, not verified measures
of listener emotion or clinical mental-health states.
"""

from __future__ import annotations

from typing import Final

import pandas as pd
from sklearn.metrics import pairwise_distances_argmin
from sklearn.preprocessing import StandardScaler

RANDOM_SEED: Final = 42

USER_MOODS: Final[tuple[str, ...]] = (
    "happy", "sad", "angry", "calm", "relaxed", "energetic", "romantic",
    "motivated", "lonely", "stressed", "bored",
)

SONG_MOODS: Final[tuple[str, ...]] = (
    "happy", "sad", "angry", "calm", "relaxed", "energetic", "romantic",
    "motivated",
)

MOOD_FEATURES: Final[tuple[str, ...]] = (
    "valence", "energy", "danceability", "acousticness", "instrumentalness",
    "loudness", "tempo",
)


def build_seed_masks(
    songs: pd.DataFrame, quantiles: pd.DataFrame
) -> dict[str, pd.Series]:
    """Return high-confidence, percentile-derived seed masks for each mood.

    The masks intentionally overlap. Their group means form data-derived
    prototypes; every track is then assigned to its nearest standardized
    prototype by :func:`assign_pseudo_moods`.
    """
    q25, q33, q50, q67, q75 = (quantiles.loc[level] for level in (.25, .33, .50, .67, .75))

    return {
        "angry": (
            (songs["valence"] <= q33["valence"])
            & (songs["energy"] >= q75["energy"])
            & (songs["loudness"] >= q67["loudness"])
        ),
        "sad": (
            (songs["valence"] <= q25["valence"])
            & (songs["energy"] <= q50["energy"])
            & (songs["acousticness"] >= q33["acousticness"])
        ),
        "relaxed": (
            (songs["energy"] <= q33["energy"])
            & (songs["acousticness"] >= q67["acousticness"])
            & songs["valence"].between(q33["valence"], q67["valence"])
        ),
        "calm": (
            (songs["energy"] <= q50["energy"])
            & (songs["acousticness"] >= q50["acousticness"])
            & (songs["valence"] >= q67["valence"])
        ),
        "romantic": (
            (songs["valence"] >= q67["valence"])
            & songs["energy"].between(q25["energy"], q67["energy"])
            & (songs["acousticness"] >= q50["acousticness"])
        ),
        "motivated": (
            (songs["valence"] >= q50["valence"])
            & (songs["energy"] >= q67["energy"])
            & (songs["tempo"] >= q50["tempo"])
        ),
        "happy": (
            (songs["valence"] >= q75["valence"])
            & (songs["energy"] >= q50["energy"])
            & (songs["danceability"] >= q50["danceability"])
        ),
        "energetic": (
            (songs["energy"] >= q75["energy"])
            & (songs["danceability"] >= q50["danceability"])
            & (songs["tempo"] >= q67["tempo"])
        ),
    }


def assign_pseudo_moods(songs: pd.DataFrame) -> tuple[pd.Series, pd.DataFrame, pd.DataFrame]:
    """Assign every song to its nearest standardized, data-derived mood profile.

    Returns labels, seed-profile means, and the percentile table used to make
    the seed masks. Input must contain every feature in ``MOOD_FEATURES``.
    """
    missing = set(MOOD_FEATURES).difference(songs.columns)
    if missing:
        raise ValueError(f"Missing mood-label features: {sorted(missing)}")
    if songs.loc[:, MOOD_FEATURES].isna().any().any():
        raise ValueError("Mood-label features must not contain missing values.")

    quantile_levels = [.25, .33, .50, .67, .75]
    quantiles = songs.loc[:, MOOD_FEATURES].quantile(quantile_levels)
    masks = build_seed_masks(songs, quantiles)
    seed_counts = {mood: int(mask.sum()) for mood, mask in masks.items()}
    empty_moods = [mood for mood, count in seed_counts.items() if count == 0]
    if empty_moods:
        raise ValueError(f"No seed tracks for moods: {empty_moods}")

    profiles = pd.DataFrame(
        {mood: songs.loc[mask, MOOD_FEATURES].mean() for mood, mask in masks.items()}
    ).T.loc[list(SONG_MOODS)]
    scaler = StandardScaler().fit(songs.loc[:, MOOD_FEATURES])
    nearest = pairwise_distances_argmin(
        scaler.transform(songs.loc[:, MOOD_FEATURES]),
        scaler.transform(profiles.loc[:, MOOD_FEATURES]),
    )
    labels = pd.Series(profiles.index.to_numpy()[nearest], index=songs.index, name="mood")
    return labels, profiles, quantiles
