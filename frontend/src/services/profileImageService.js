import { getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { firebaseStorage } from './firebase'

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024

export async function uploadProfileImage(userId, file) {
  if (!firebaseStorage) {
    throw new Error('Firebase Storage is not configured. Add VITE_FIREBASE_STORAGE_BUCKET to frontend/.env.')
  }
  if (!file?.type.startsWith('image/')) throw new Error('Choose an image file for your avatar.')
  if (file.size > MAX_IMAGE_SIZE_BYTES) throw new Error('Profile images must be 5 MB or smaller.')
  const extension = file.name.split('.').pop()?.replace(/[^a-zA-Z0-9]/g, '') || 'image'
  const location = ref(firebaseStorage, `profile-images/${userId}/avatar.${extension}`)
  await uploadBytes(location, file, { contentType: file.type })
  return getDownloadURL(location)
}
