# Backend and Firebase API — Phase 7

## Architecture

The Flask app uses thin route handlers, services for catalogue/recommendation
logic, and a repository abstraction for user data. In production,
`FirestoreUserRepository` persists profiles, favorites, and history in Firebase
Firestore. Tests inject `InMemoryUserRepository`; it is not a production store.

Firebase Authentication is handled by the client SDK. The backend verifies its
Firebase ID token from the `Authorization: Bearer <token>` header and never
accepts a client-supplied UID by itself.

## Endpoints

| Method | Route | Authentication | Purpose |
| --- | --- | --- | --- |
| GET | `/api/health` | No | Service status |
| POST | `/api/auth/verify` | Required | Verify Firebase token |
| POST | `/api/recommend` | Optional | Request recommendations; authenticated calls record history and use preferences |
| GET | `/api/search?q=...` | No | Search title, artist, or genre |
| GET/PUT | `/api/profile` | Required | Retrieve or update profile |
| GET/POST | `/api/favorites` | Required | List or add a favorite |
| DELETE | `/api/favorites/<track_id>` | Required | Remove a favorite |
| GET | `/api/history` | Required | List recommendation history |
| GET | `/api/insights/mood-frequency` | Required | Count current moods across the authenticated user's complete history |

## Validation and errors

Requests validate mood, mode, result limits (1–50), search text, popularity
filters, profile fields, and track IDs. Errors have the form:

```json
{"error": {"message": "Explanation", "status": 400}}
```

## Example recommendation request

```json
POST /api/recommend
{"mood": "stressed", "mode": "feel_better", "limit": 20}
```

The response includes `current_mood`, `mode`, `target_mood`, and scored track
recommendations. It does not claim medical mood improvement.
