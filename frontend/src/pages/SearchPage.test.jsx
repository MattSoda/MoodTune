import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { beforeEach, vi } from 'vitest'

const { TRACK_ID, authState } = vi.hoisted(() => ({ TRACK_ID: '4uLU6hMCjMI75M1A2tKUQC', authState: { user: { uid: 'listener-1' }, isLoading: false } }))
vi.mock('../context/AuthContext', () => ({ useAuth: () => authState }))
vi.mock('../services/moodTuneApi', () => ({
  moodTuneApi: {
    search: vi.fn().mockResolvedValue({ results: [{ track_id: TRACK_ID, track_name: 'Search Result', artists: 'MoodTune Artist', genres: 'pop', predicted_mood: 'happy', popularity: 80 }] }),
    addFavorite: vi.fn().mockResolvedValue({}),
  },
}))
import { moodTuneApi } from '../services/moodTuneApi'
import SearchPage from './SearchPage'

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
  render(<MemoryRouter><SearchPage /></MemoryRouter>)
  await user.type(screen.getByPlaceholderText('Search songs or artists'), 'Search Result')
  await user.click(screen.getByRole('button', { name: 'Search' }))
  expect(await screen.findByText('Search Result')).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: 'Play' }))
  expect(screen.getByTitle('Spotify player')).toHaveAttribute('src', `https://open.spotify.com/embed/track/${TRACK_ID}`)
  expect(screen.getByRole('link', { name: /Open in Spotify/i })).toHaveAttribute('href', `https://open.spotify.com/track/${TRACK_ID}`)
})

test('shows related results automatically while typing', async () => {
  const user = userEvent.setup()
  render(<MemoryRouter><SearchPage /></MemoryRouter>)
  await user.type(screen.getByPlaceholderText('Search songs or artists'), 'Search Result')
  expect(await screen.findByText('Search Result')).toBeInTheDocument()
  expect(moodTuneApi.search).toHaveBeenCalledWith(expect.objectContaining({ q: 'Search Result' }))
})

test('allows the search page but requires login before showing results', async () => {
  authState.user = null
  const user = userEvent.setup()
  render(<MemoryRouter initialEntries={['/search']}><Routes><Route path="/search" element={<SearchPage />} /><Route path="/login" element={<CurrentLocation />} /></Routes></MemoryRouter>)
  expect(screen.getByRole('heading', { name: 'Find your next favorite' })).toBeInTheDocument()
  await user.type(screen.getByPlaceholderText('Search songs or artists'), 'Search Result')
  await user.click(screen.getByRole('button', { name: 'Search' }))
  expect(screen.getByText('/login?redirect=%2Fsearch')).toBeInTheDocument()
  expect(moodTuneApi.search).not.toHaveBeenCalled()
  expect(JSON.parse(sessionStorage.getItem('moodtune.pendingSearch'))).toMatchObject({ query: 'Search Result' })
})
