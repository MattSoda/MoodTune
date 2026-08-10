const STORAGE_KEY = 'moodtune.pendingSearch'

export function saveSearchDraft(search) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(search))
}

export function takeSearchDraft() {
  try {
    const draft = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || 'null')
    sessionStorage.removeItem(STORAGE_KEY)
    return draft
  } catch {
    sessionStorage.removeItem(STORAGE_KEY)
    return null
  }
}
