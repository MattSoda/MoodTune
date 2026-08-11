import apiClient from './apiClient'

function messageFrom(error) {
  return error.response?.data?.error?.message || error.message || 'Something went wrong. Please try again.'
}

async function request(call) {
  try {
    return (await call()).data
  } catch (error) {
    throw new Error(messageFrom(error))
  }
}

export const moodTuneApi = {
  recommend: (payload) => request(() => apiClient.post('/recommend', payload)),
  search: (parameters) => request(() => apiClient.get('/search', { params: parameters })),
  searchDiscovery: (parameters = {}) => request(() => apiClient.get('/search/discovery', { params: parameters })),
  deleteRecentSearch: (searchId) => request(() => apiClient.delete(`/search/recent/${encodeURIComponent(searchId)}`)),
  clearRecentSearches: () => request(() => apiClient.delete('/search/recent')),
  profile: () => request(() => apiClient.get('/profile')),
  updateProfile: (payload) => request(() => apiClient.put('/profile', payload)),
  favorites: () => request(() => apiClient.get('/favorites')),
  addFavorite: (trackId) => request(() => apiClient.post('/favorites', { track_id: trackId })),
  removeFavorite: (trackId) => request(() => apiClient.delete(`/favorites/${encodeURIComponent(trackId)}`)),
  history: () => request(() => apiClient.get('/history')),
}
