# Testing Guide — Phase 11

## Automated tests

Run Python tests from the project root:

```powershell
python -m pytest backend/tests ml/tests -q
```

This covers pseudo-mood prediction validation, mood transitions, ranking,
diversity, cold start, history exclusion, API validation, CORS, protected
routes, profile updates, favorites, and history behavior. The test suite uses an
in-memory repository rather than real Firestore.

Run frontend tests:

```powershell
cd frontend
npm.cmd test
```

The frontend suite verifies predefined mood submission/navigation, protected
route redirection, and recommendation-result rendering from an API response.

Build the frontend:

```powershell
npm.cmd run build
```

## Manual integration checks

1. Start Flask from the project root and Vite from `frontend`.
2. Check `GET /api/health`.
3. Request recommendations as a cold-start visitor.
4. Search by title, artist, and genre.
5. After configuring Firebase, register, log in, save/remove favorites, view
   history, update preferences, and request recommendations again.

## Environment requirement

The model is serialized with Scikit-learn 1.6.1. Install the pinned
requirements and retrain the model in the same environment before serving it.
