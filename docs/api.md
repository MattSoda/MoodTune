# MoodTune API Reference

Base URL: `http://localhost:5000/api`

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| GET | `/health` | No | API and Firebase availability |
| POST | `/auth/verify` | Firebase token | Verify current identity |
| POST | `/recommend` | Optional | Request mood-based recommendations |
| GET | `/search?q=...` | No | Search track, artist, or genre |
| GET / PUT | `/profile` | Firebase token | Retrieve or update profile |
| GET / POST | `/favorites` | Firebase token | List or add favorites |
| DELETE | `/favorites/<track_id>` | Firebase token | Delete a favorite |
| GET | `/history` | Firebase token | Retrieve recommendation history |
| GET | `/insights/mood-frequency` | Firebase token | Count current moods across the user's complete recommendation history |

## Mood-frequency response

The authenticated Firebase identity selects the history to aggregate; user IDs
sent in query parameters or request bodies are not used. Results are sorted by
count descending.

```json
{
  "mood_frequency": [
    { "mood": "stressed", "count": 8 },
    { "mood": "happy", "count": 5 }
  ],
  "total_check_ins": 13
}
```

## Recommendation request

```json
{
  "mood": "stressed",
  "mode": "feel_better",
  "activity": "working",
  "preferred_genres": ["jazz", "classical"],
  "limit": 20
}
```

`mood` must be one of the supported predefined user moods. `mode` is
`match_mood` or `feel_better`; `limit` is 1–50.

`activity` is optional and may be `studying`, `working`, `driving`, `exercise`,
`gaming`, `party`, `traveling`, or `sleeping`. `preferred_genres` is an optional
multi-select list of Pop, Rock, Hip-Hop, Jazz, EDM, Classical, R&B, Country,
Indie, and Metal (sent as their lowercase API values). These inputs only refine
the ranking after mood and mode choose the target song mood.

## Recommendation response

```json
{
  "current_mood": "stressed",
  "mode": "feel_better",
  "target_mood": "relaxed",
  "recommendations": [
    {
      "track_id": "...",
      "track_name": "...",
      "artists": "...",
      "genres": "...",
      "predicted_mood": "relaxed",
      "popularity": 0,
      "recommendation_score": 0.0
    }
  ]
}
```

Errors use `{"error": {"message": "...", "status": 400}}`. Send Firebase
tokens as `Authorization: Bearer <ID_TOKEN>` for protected endpoints.
