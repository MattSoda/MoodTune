# Machine Learning Summary

## Inputs and target

The model uses valence, energy, danceability, acousticness, instrumentalness,
speechiness, loudness, tempo, and liveness to predict the `mood` pseudo-label.
Identifiers, textual metadata, genre, and popularity are excluded from training.

## Method

The dataset contains no ground-truth song mood. Phase 4 builds percentile-based
seed profiles and assigns every track to its nearest standardized pseudo-mood
prototype. Phase 5 uses an 80/20 stratified split of unique track IDs and
compares Logistic Regression, Decision Tree, Random Forest, KNN, and Linear SVM.

Tuned Logistic Regression (`C=3.0`) was selected. The saved Joblib artifact is a
single pipeline that includes feature scaling and classification.

| Metric | Value |
| --- | ---: |
| Cross-validation macro F1 | 0.988 |
| Held-out accuracy | 0.992 |
| Held-out macro F1 | 0.991 |
| Held-out weighted F1 | 0.992 |

## Limitation

The classifier learns labels derived from the same family of Spotify features
used as its input. Its performance therefore measures pseudo-label replication,
not independently validated human emotional interpretation.
