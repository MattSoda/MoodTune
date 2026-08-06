import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth'
import { firebaseAuth, isFirebaseConfigured } from './firebase'

function configuredAuth() {
  if (!firebaseAuth || !isFirebaseConfigured) {
    throw new Error('Firebase web configuration is missing. Add VITE_FIREBASE_* values to frontend/.env.')
  }
  return firebaseAuth
}

export function observeAuthState(callback) {
  if (!firebaseAuth) {
    callback(null)
    return () => undefined
  }
  return onAuthStateChanged(firebaseAuth, callback)
}

export function registerWithEmail(email, password) {
  return createUserWithEmailAndPassword(configuredAuth(), email, password)
}

export function loginWithEmail(email, password) {
  return signInWithEmailAndPassword(configuredAuth(), email, password)
}

export function logout() {
  return signOut(configuredAuth())
}
