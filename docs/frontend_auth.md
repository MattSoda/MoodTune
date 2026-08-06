# Frontend Foundation and Authentication — Phase 8

## Setup

```powershell
cd frontend
Copy-Item .env.example .env
npm.cmd install
npm.cmd run dev
```

Set `VITE_API_BASE_URL` to the Flask API and add the Firebase **web app**
configuration values from Firebase Console to `frontend/.env`. These `VITE_`
values identify a Firebase web client; they are not Firebase Admin credentials.
Never put a service-account private key in the frontend environment.

## Authentication flow

The React app registers and signs in users through Firebase Authentication. The
auth context observes session changes, supports logout, exposes loading state,
and protects application pages. Axios obtains the current user’s Firebase ID
token and sends it as a Bearer token to Flask, where Phase 7 verifies it.

When Firebase web configuration is missing, the authentication forms display a
clear configuration error instead of creating a local password system.

## Current routes

`/`, `/login`, and `/register` are public. `/recommendations`, `/search`,
`/favorites`, `/history`, and `/profile` require authentication. Those protected
pages are Phase 8 shells; their data features are implemented in Phase 9.
