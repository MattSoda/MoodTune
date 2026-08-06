# Firebase Setup — Phase 7

1. Create a Firebase project and enable **Authentication** with the required
   sign-in providers.
2. Create a Firestore database and apply security rules appropriate to your
   deployment.
3. Create a Firebase service account for the backend only. Never expose it to
   the React frontend.
4. Copy `.env.example` to `.env`, then use either:
   - `FIREBASE_SERVICE_ACCOUNT_PATH` pointing to the service-account JSON file;
     or
   - `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, and
     `FIREBASE_PRIVATE_KEY`.
5. Install dependencies and start Flask. Firebase Admin initializes only when
   complete credentials exist.

Placeholder values from `.env.example` are not credentials. In particular,
`FIREBASE_PRIVATE_KEY` must contain the complete service-account PEM value,
including its `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`
markers. Use a real service-account JSON file through
`FIREBASE_SERVICE_ACCOUNT_PATH` when possible; it avoids manual PEM formatting.

The client must obtain a Firebase ID token and send it as
`Authorization: Bearer <token>`. The Flask backend verifies it before allowing
profile, favorite, and history access.

Do not commit `.env`, service-account JSON files, or any Firebase secret.
