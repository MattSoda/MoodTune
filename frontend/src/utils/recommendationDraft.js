const STORAGE_KEY = 'moodtune.pendingRecommendation'

export function saveRecommendationDraft(selection) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(selection))
}

export function readRecommendationDraft() {
  try {
    return JSON.parse(sessionStorage.getItem(STORAGE_KEY) || 'null')
  } catch {
    return null
  }
}

export function clearRecommendationDraft() {
  sessionStorage.removeItem(STORAGE_KEY)
}
