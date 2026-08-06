# MoodTune

MoodTune is a university data-analysis project that recommends songs from a
predefined mood selection. It supports **Match My Mood** and **Make Me Feel
Better** modes while keeping a user’s current state, target song mood, and each
song’s predicted pseudo-mood separate.

> MoodTune recommends music by audio-feature profile. It is not a medical,
> diagnostic, or clinically validated mood-improvement system.

## Features

- Spotify dataset exploration, cleaning, EDA, and reproducible pseudo-labeling.
- Eight song-mood classes: Happy, Sad, Angry, Calm, Relaxed, Energetic,
  Romantic, and Motivated.
- Logistic Regression mood classifier with a saved Scikit-learn pipeline.
- Transparent recommendations with cold start, genre preferences, favorite
  similarity, activity context, popularity, history avoidance, and diversity
  limits.
- Flask REST API for recommendations, search, profile, favorites, and history.
- Firebase Authentication token verification and Firestore-ready repositories.
- Vite React frontend with Firebase Authentication, protected account routes,
  required mood selection, optional activity and multi-genre preferences,
  results, search, favorites, history, and profile preferences.

## Recommendation inputs

MoodTune keeps **How are you feeling?** as the required and strongest
recommendation signal. Users then choose a required recommendation mode:

- **Match My Mood** finds music with a matching target song mood.
- **Make Me Feel Better** uses the configured non-clinical mood transition.

Two optional inputs refine the order of eligible songs without changing that
target-mood decision:

- **Current activity:** Studying, Working, Driving, Exercise, Gaming, Party,
  Traveling, or Sleeping.
- **Preferred genres:** a multi-select of Pop, Rock, Hip-Hop, Jazz, EDM,
  Classical, R&B, Country, Indie, and Metal.

## Architecture

```text
React + Firebase Auth
        │ Firebase ID token
        ▼
Flask REST API ──► Recommendation Engine ──► Saved ML Pipeline
        │                     │
        ▼                     ▼
Firestore                 Labeled Spotify catalogue
```

Read [architecture.md](docs/architecture.md) for component responsibilities and
[api.md](docs/api.md) for endpoint details.

## Dataset

The original Spotify Multi-Genre Playlist CSV is placed at:

```text
data/raw/dataset.csv
```

Raw and processed datasets are intentionally ignored by Git. The project creates
these local derived files:

```text
data/processed/spotify_cleaned.csv
data/processed/spotify_mood_labeled.csv
```

See [dataset_exploration.md](docs/dataset_exploration.md) and
[data_cleaning.md](docs/data_cleaning.md) for dataset-specific findings.

## Backend setup

Use Python 3.13 or another compatible Python version. The model artifact is
serialized with Scikit-learn 1.6.1, so install the pinned requirements and train
the model again if you change Python environments.

```powershell
python -m venv myEnv
.\myEnv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python -m ml.training.train_mood_classifier
```

Copy and configure environment variables:

```powershell
Copy-Item .env.example .env
```

Start Flask from the project root:

```powershell
$env:FLASK_APP = "backend.app:app"
python -m flask run --debug
```

Health check: `http://127.0.0.1:5000/api/health`

## Firebase setup

Enable Firebase Authentication and Firestore, then configure Firebase Admin
credentials in the backend `.env`. Prefer `FIREBASE_SERVICE_ACCOUNT_PATH` to a
real service-account JSON file. Configure the Firebase web app values separately
in `frontend/.env`.

Never commit `.env`, service-account JSON files, or real private keys. Rotate
any Firebase key that has been exposed outside its intended environment. See
[firebase_setup.md](docs/firebase_setup.md).

## Frontend setup

```powershell
cd frontend
Copy-Item .env.example .env
npm.cmd install
npm.cmd run dev
```

Set `VITE_API_BASE_URL=http://localhost:5000/api` and add Firebase **web app**
configuration values to `frontend/.env`. Do not place Firebase Admin secrets in
the frontend.

## Tests

```powershell
# From the project root
python -m pytest backend/tests ml/tests -q

# From frontend
npm.cmd test
npm.cmd run build
```

Detailed commands and manual scenarios are in [testing.md](docs/testing.md).

## Publishing to GitHub

The repository is ready to publish without local dependencies, build files,
datasets, trained artifacts, or environment files. Keep the existing
`.gitignore` file committed along with `.env.example` files, which show the
required variable names without containing real values.

Before your first push, review what Git will include:

```powershell
git init
git add .
git status
```

Do **not** stage real `.env` files, Firebase service-account JSON files, PEM or
private-key files, or any copied dataset you are not licensed to redistribute.
If `git status` lists any of them, remove it from Git's staging area before
committing:

```powershell
git restore --staged path\to\file
```

If a sensitive file was already committed, ignoring it afterward is not enough:
remove it from tracking, rotate the exposed credential, and rewrite history if
it was pushed. For a file not yet pushed:

```powershell
git rm --cached path\to\file
```

Then create an empty repository on GitHub and run:

```powershell
git commit -m "Initial MoodTune project"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/MoodTune.git
git push -u origin main
```

## Documentation

- [Architecture](docs/architecture.md)
- [API reference](docs/api.md)
- [Machine learning](docs/machine_learning.md)
- [Mood-label methodology](docs/mood_label_methodology.md)
- [Recommendation engine](docs/recommendation_engine.md)
- [Final project review](docs/final_project_review.md)

## Known limitations

- Song mood labels are pseudo-labels, not expert annotations.
- Emotional responses to music are subjective and context-dependent.
- Model metrics primarily measure pseudo-label reproduction.
- Recommendation weights are initial heuristics.
- Live Firebase testing requires valid Firebase credentials and configuration.
- The dataset limits catalogue coverage and personalization improves only after
  users create favorites, history, and genre preferences.
