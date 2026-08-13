import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { beforeEach, vi } from 'vitest'
import PersistentSpotifyPlayer from '../components/PersistentSpotifyPlayer'
import { PlayerProvider } from '../context/PlayerContext'

const { TRACK_ID, authState } = vi.hoisted(() => ({ TRACK_ID: '4uLU6hMCjMI75M1A2tKUQC', authState: { user: { uid: 'listener-1' }, isLoading: false } }))
vi.mock('../context/AuthContext', () => ({ useAuth: () => authState }))
vi.mock('../services/moodTuneApi', () => ({
  moodTuneApi: {
    search: vi.fn().mockResolvedValue({ results: [{ track_id: TRACK_ID, track_name: 'Search Result', artists: 'MoodTune Artist', genres: 'pop', predicted_mood: 'happy', popularity: 80 }] }),
    searchDiscovery: vi.fn().mockResolvedValue({
      recent: [{ id: '0123456789abcdef0123', query: 'late night jazz' }],
      recommended: [{ query: 'Related Song', label: 'Related Song — Similar Artist', reason: 'Related to “late night jazz”', source: 'search_similarity' }],
      trending: [{ query: 'Popular Song', label: 'Popular Song — Chart Artist', popularity: 100, source: 'catalogue_popularity' }],
      meta: { cohort: 'global', cold_start: false },
    }),
    deleteRecentSearch: vi.fn().mockResolvedValue({}),
    clearRecentSearches: vi.fn().mockResolvedValue({ deleted: 1 }),
    addFavorite: vi.fn().mockResolvedValue({}),
  },
}))
import { moodTuneApi } from '../services/moodTuneApi'
import SearchPage from './SearchPage'

function renderSearchPage(element = <SearchPage />) {
  render(<MemoryRouter><PlayerProvider>{element}<PersistentSpotifyPlayer /></PlayerProvider></MemoryRouter>)
}

function CurrentLocation() {
  const location = useLocation()
  return <p>{`${location.pathname}${location.search}`}</p>
}

beforeEach(() => {
  vi.clearAllMocks()
  sessionStorage.clear()
  authState.user = { uid: 'listener-1' }
})

test('opens the Spotify player for a search result', async () => {
  const user = userEvent.setup()
  renderSearchPage()
  await user.type(screen.getByPlaceholderText('Search songs or artists'), 'Search Result')
  await user.click(screen.getByRole('button', { name: 'Search' }))
  expect(await screen.findByText('Search Result')).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: 'Play' }))
  expect(screen.getByTitle('Spotify player')).toHaveAttribute('src', `https://open.spotify.com/embed/track/${TRACK_ID}`)
  expect(screen.getAllByRole('link', { name: /Open in Spotify/i })[0]).toHaveAttribute('href', `https://open.spotify.com/track/${TRACK_ID}`)
})

test('shows related results automatically while typing', async () => {
  const user = userEvent.setup()
  renderSearchPage()
  await user.type(screen.getByPlaceholderText('Search songs or artists'), 'Search Result')
  expect(await screen.findByText('Search Result')).toBeInTheDocument()
  expect(screen.getByRole('region', { name: 'Recommended for you' })).toBeInTheDocument()
  expect(screen.getByRole('region', { name: 'Trending' })).toBeInTheDocument()
  expect(moodTuneApi.search).toHaveBeenCalledWith(expect.objectContaining({ q: 'Search Result' }))
})

test('hides discovery after Enter and restores it when the query changes', async () => {
  const user = userEvent.setup()
  renderSearchPage()
  const input = screen.getByPlaceholderText('Search songs or artists')
  await screen.findByRole('region', { name: 'Recommended for you' })

  await user.type(input, 'Search Result{Enter}')
  expect(screen.queryByRole('region', { name: 'Recommended for you' })).not.toBeInTheDocument()

  await user.type(input, ' remix')
  expect(screen.getByRole('region', { name: 'Recommended for you' })).toBeInTheDocument()
})

test('allows the search page but requires login before showing results', async () => {
  authState.user = null
  const user = userEvent.setup()
  render(<MemoryRouter initialEntries={['/search']}><PlayerProvider><Routes><Route path="/search" element={<SearchPage />} /><Route path="/login" element={<CurrentLocation />} /></Routes><PersistentSpotifyPlayer /></PlayerProvider></MemoryRouter>)
  expect(screen.getByRole('heading', { name: 'Find your next favorite' })).toBeInTheDocument()
  await user.type(screen.getByPlaceholderText('Search songs or artists'), 'Search Result')
  await user.click(screen.getByRole('button', { name: 'Search' }))
  expect(screen.getByText('/login?redirect=%2Fsearch')).toBeInTheDocument()
  expect(moodTuneApi.search).not.toHaveBeenCalled()
  expect(JSON.parse(sessionStorage.getItem('moodtune.pendingSearch'))).toMatchObject({ query: 'Search Result' })
})

test('surfaces discovery sections and explicitly deletes a recent query', async () => {
  const user = userEvent.setup()
  renderSearchPage()
  expect(await screen.findByRole('region', { name: 'Recent' })).toBeInTheDocument()
  expect(screen.getByRole('region', { name: 'Recommended for you' })).toBeInTheDocument()
  expect(screen.getByRole('region', { name: 'Trending' })).toBeInTheDocument()

  await user.click(screen.getByRole('button', { name: 'Delete recent search late night jazz' }))
  expect(moodTuneApi.deleteRecentSearch).toHaveBeenCalledWith('0123456789abcdef0123')
  expect(screen.queryByText('late night jazz')).not.toBeInTheDocument()

  await user.click(screen.getByRole('button', { name: 'Related Song — Similar Artist' }))
  expect(moodTuneApi.search).toHaveBeenCalledWith(expect.objectContaining({ q: 'Related Song', record: true }))
})
