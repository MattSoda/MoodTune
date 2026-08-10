import {
  createUserWithEmailAndPassword,
  deleteUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth'
import apiClient from './apiClient'
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

export async function registerWithEmail({ name, username, email, password }) {
  const credential = await createUserWithEmailAndPassword(configuredAuth(), email, password)
  try {
    await updateProfile(credential.user, { displayName: name })
    await apiClient.post('/auth/register', { name, username, email })
    return credential
  } catch (error) {
    await deleteUser(credential.user).catch(() => undefined)
    throw new Error(error.response?.data?.error?.message || error.message || 'Unable to create your account.')
  }
}

export function loginWithEmail(email, password) {
  return signInWithEmailAndPassword(configuredAuth(), email, password)
}

export function logout() {
  return signOut(configuredAuth())
}
