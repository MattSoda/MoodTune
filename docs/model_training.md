# Machine Learning Training and Model Selection — Phase 5

## Training design

The model predicts the Phase 4 pseudo-label `mood` from nine audio features:
valence, energy, danceability, acousticness, instrumentalness, speechiness,
loudness, tempo, and liveness. Track ID, track name, artist, genre, and
popularity were excluded. Popularity remains a later recommendation-ranking
signal, not a musical-mood input.

The dataset has 89,740 unique `track_id` values. The workflow checks this before
splitting, then performs a fixed (`random_state=42`) stratified 80/20 split:
71,792 training tracks and 17,948 held-out test tracks. This prevents duplicate
song leakage and preserves the eight-class distribution.

Each candidate is a Scikit-learn Pipeline with `StandardScaler` and its
classifier. Keeping transformation inside the pipeline prevents test-set
statistics leaking into training.

## Baseline comparison

| Model | Accuracy | Macro F1 | Weighted F1 | Fit/evaluation time (s) |
| --- | ---: | ---: | ---: | ---: |
| Logistic Regression | 0.988 | 0.986 | 0.988 | 1.25 |
| Random Forest | 0.936 | 0.929 | 0.936 | 6.05 |
| K-Nearest Neighbors | 0.917 | 0.906 | 0.916 | 1.75 |
| Decision Tree | 0.881 | 0.868 | 0.881 | 1.00 |
| Linear Support Vector Machine | 0.768 | 0.717 | 0.754 | 1.83 |

Logistic Regression had the best macro F1, weighted F1, accuracy, inference
suitability, and simplicity. It was therefore selected for modest tuning rather
than choosing a more complex model with poorer minority-class performance.

## Tuning and final model

Three-fold stratified `GridSearchCV` optimized macro F1 on the training set over
`C ∈ {0.3, 1.0, 3.0}`. The best pipeline uses `C=3.0`.

| Measure | Final value |
| --- | ---: |
| Cross-validation macro F1 | 0.988 |
| Held-out accuracy | 0.992 |
| Held-out macro precision | 0.992 |
| Held-out macro recall | 0.991 |
| Held-out macro F1 | 0.991 |
| Held-out weighted F1 | 0.992 |

### Class-level held-out F1

| Mood | F1 |
| --- | ---: |
| Happy | 0.995 |
| Sad | 0.998 |
| Angry | 0.993 |
| Calm | 0.987 |
| Relaxed | 0.994 |
| Energetic | 0.984 |
| Romantic | 0.990 |
| Motivated | 0.989 |

Energetic has the lowest recall (0.979), indicating some boundary overlap with
other high-energy labels such as Motivated and Happy. The notebook contains the
full report and confusion matrix.

## Saved assets and prediction interface

`ml/models/mood_classifier.joblib` stores the fitted scaler and final Logistic
Regression classifier as one pipeline. `ml/prediction.py` caches this asset,
validates one or many audio-feature mappings, predicts pseudo-moods, and returns
probabilities plus confidence when supported.

The persisted artifact must be loaded with the same pinned Scikit-learn version
(`1.6.1`) used for training. Re-run training after changing environments rather
than attempting to load a model serialized by a different Scikit-learn version.

## Critical limitation

The target labels are deterministic pseudo-labels built from overlapping Spotify
audio features. Because the classifier uses those same features, these excellent
scores chiefly measure how accurately the pipeline reproduces the Phase 4
labeling method. They do **not** demonstrate validated emotion recognition,
psychological truth, or an ability to improve a listener’s mood.
