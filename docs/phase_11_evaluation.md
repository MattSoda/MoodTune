# Testing, Evaluation, and Code Quality — Phase 11

## Automated test results

| Area | Result |
| --- | --- |
| Python backend, ML, and recommendation tests | 37 passed |
| Frontend Vitest tests | 3 passed |
| Vite production build | Passed; 127 modules transformed |

Frontend tests cover the primary mood-selection handoff, protected-route
redirection, and API-driven recommendation rendering. Backend tests use an
in-memory repository to exercise profile, favorite, history, CORS, auth failure,
search, and recommendation routes without real Firebase credentials.

## Machine-learning evaluation

The selected Logistic Regression pipeline has held-out accuracy 0.992, macro F1
0.991, and weighted F1 0.992. Energetic is the weakest class (recall 0.979),
with expected overlap against other high-energy pseudo-labels. These values must
be interpreted as replication of deterministic feature-derived pseudo-labels,
not validated human emotion recognition.

## Recommendation evaluation

The following scenarios each returned five unique tracks, all with the expected
target pseudo-mood:

| Scenario | Target mood |
| --- | --- |
| Sad + Match My Mood | Sad |
| Sad + Make Me Feel Better | Happy |
| Angry + Make Me Feel Better | Calm |
| Stressed + Make Me Feel Better | Relaxed |
| Bored + Make Me Feel Better | Energetic |
| Cold-start Relaxed + Match My Mood | Relaxed |
| Relaxed user with Acoustic preference | Relaxed |

The automated recommendation tests additionally verify every supported
user-mood/mode pair, score order, duplicate prevention, artist/genre diversity,
history exclusion, invalid input handling, and preference signals.

## Performance and code-quality review

- The labelled catalogue is loaded once per recommendation-engine instance; the
  Flask app creates one engine for its process.
- The Flask catalogue service caches its CSV in-process.
- The prediction loader caches the persisted pipeline instead of reloading it
  for each song.
- Frontend production output is approximately 134 kB gzipped JavaScript. It is
  acceptable for the project scope, though route-level code splitting is a
  future optimization if the UI expands.
- Flask routes remain thin; catalogue, recommendation, authentication, and
  repositories are separated.
- No repeated API URLs exist in page components; they use the shared Axios API
  service.

## Security review

- `.gitignore` excludes `.env`, virtual environments, node modules, datasets,
  generated model artifacts, and build output.
- No secret was found in tracked application source. However, a real Firebase
  private key exists in local `.env` and was exposed during this development
  session. It must be revoked/rotated in Google Cloud/Firebase and replaced
  locally. Do not commit it.
- Firebase Admin credentials stay backend-only; the frontend contains only
  Firebase web-app configuration.
- Protected API routes require a verified Bearer token, while user IDs are not
  accepted directly from clients.
- npm reported two high-severity dependency audit findings during installation.
  A live `npm audit` could not reach the advisory endpoint in this environment;
  no automatic upgrade was applied. Review and remediate the findings before a
  production deployment.

## Remaining external verification

Live Firebase Authentication and Firestore operations still require valid,
rotated credentials and a configured Firebase project. The automated repository
tests validate the application contract but do not replace a live Firebase
integration test.
