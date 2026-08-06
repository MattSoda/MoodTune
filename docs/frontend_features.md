# Core MoodTune Frontend Features — Phase 9

## Mood and recommendation flow

The Home page uses the centralized predefined mood list and does not accept free
text. The required mood selection remains the strongest recommendation signal.
Users can optionally select their current activity and choose one or more genre
preferences before selecting **Match My Mood** or **Make Me Feel Better**. The
app sends this context to `POST /api/recommend` and renders the returned current
mood, mode, target mood, scores, and songs. Explanatory text avoids medical
claims.

Recommendations and search support cold-start visitors. Signing in enables
saving favorites and causes the Firebase token interceptor to authorize backend
profile, history, and favorite requests.

## Account features

- Search calls `GET /api/search` with mood and genre filters.
- Favorites load, save, and remove using the protected favorites endpoints.
- History displays prior recommendation sessions newest first.
- Profile edits display name and comma-separated genre preferences.

All data fetches include loading, error, and empty states. Firebase and Flask
must both be configured for authenticated account features to succeed.
