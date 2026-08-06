# MoodTune Architecture

## Components

```text
Browser
  React + Vite + Tailwind
  Firebase web Authentication
        │ Axios + Bearer ID token
        ▼
Flask API
  Routes → Services → Repositories
        │        │          └── Firestore (profiles, favorites, history)
        │        └── Recommendation Engine → Labeled catalogue + ML pipeline
        ▼
Consistent JSON responses
```

## Responsibilities

| Layer | Responsibility |
| --- | --- |
| React | User interface, Firebase sign-in, route protection, API requests, feedback states |
| Flask routes | HTTP validation, status codes, JSON response boundaries |
| Services | Search and recommendation orchestration |
| Recommendation engine | Target mood, candidate selection, ranking, cold start, diversity |
| ML pipeline | Audio-feature pseudo-mood probability prediction |
| Firestore repository | User profile, favorites, and recommendation history persistence |

The ML classifier and recommendation ranker are deliberately separate. The
classifier estimates a song’s pseudo-mood, while the recommendation engine uses
target compatibility and other configurable signals to order candidates.
