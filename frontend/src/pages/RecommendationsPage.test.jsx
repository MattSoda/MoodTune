import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { vi } from 'vitest'

const { FIRST_TRACK_ID, SECOND_TRACK_ID } = vi.hoisted(() => ({
  FIRST_TRACK_ID: '4uLU6hMCjMI75M1A2tKUQC',
  SECOND_TRACK_ID: '7qiZfU4dY1lWllzX7mPBI3',
}))

vi.mock('../context/AuthContext', () => ({ useAuth: () => ({ user: { uid: 'listener-1' }, logout: vi.fn() }) }))
vi.mock('../services/moodTuneApi', () => ({
  moodTuneApi: {
    recommend: vi.fn().mockResolvedValue({
      current_mood: 'sad', mode: 'feel_better', target_mood: 'happy',
      recommendations: [
        { track_id: FIRST_TRACK_ID, track_name: 'Brighter Day', artists: 'MoodTune Artist', genres: 'pop', predicted_mood: 'happy', popularity: 80, recommendation_score: 0.95 },
        { track_id: SECOND_TRACK_ID, track_name: 'Second Song', artists: 'Another Artist', genres: 'dance', predicted_mood: 'happy', popularity: 75, recommendation_score: 0.9 },
        { track_id: '', track_name: 'Catalogue Song Without ID', artists: 'Unknown Artist', genres: 'ambient', predicted_mood: 'calm', popularity: 40, recommendation_score: 0.7 },
      ],
    }),
    addFavorite: vi.fn().mockResolvedValue({}),
  },
}))
import { moodTuneApi } from '../services/moodTuneApi'
import AppLayout from '../layouts/AppLayout'
import RecommendationsPage from './RecommendationsPage'

function renderRecommendations() {
  render(
    <MemoryRouter initialEntries={[{ pathname: '/recommendations', state: { mood: 'sad', mode: 'feel_better' } }]}>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/recommendations" element={<RecommendationsPage />} />
          <Route path="/profile" element={<h1>Profile destination</h1>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
})

test('renders recommendations with no Spotify iframe initially', async () => {
  renderRecommendations()
  expect(await screen.findByText('Brighter Day')).toBeInTheDocument()
  expect(screen.getByText('Second Song')).toBeInTheDocument()
  expect(screen.getByText('Catalogue Song Without ID')).toBeInTheDocument()
  expect(screen.getByText(/Target:/i)).toHaveTextContent('happy')
  expect(screen.getByText(/Match score 0.95/i)).toBeInTheDocument()
  expect(screen.queryByTitle('Spotify player')).not.toBeInTheDocument()
})

test('clicking Play mounts the correct Spotify embed', async () => {
  const user = userEvent.setup()
  renderRecommendations()
  await screen.findByText('Brighter Day')

  await user.click(screen.getAllByRole('button', { name: 'Play' })[0])

  expect(screen.getByTitle('Spotify player')).toHaveAttribute('src', `https://open.spotify.com/embed/track/${FIRST_TRACK_ID}`)
})

test('clicking the song card opens its Spotify player', async () => {
  const user = userEvent.setup()
  renderRecommendations()
  const songTitle = await screen.findByText('Brighter Day')

  await user.click(songTitle)

  expect(screen.getByTitle('Spotify player')).toHaveAttribute('src', `https://open.spotify.com/embed/track/${FIRST_TRACK_ID}`)
})

test('playing another song replaces the mounted iframe', async () => {
  const user = userEvent.setup()
  renderRecommendations()
  await screen.findByText('Brighter Day')

  await user.click(screen.getAllByRole('button', { name: 'Play' })[0])
  await user.click(screen.getAllByRole('button', { name: 'Play' })[0])

  const players = screen.getAllByTitle('Spotify player')
  expect(players).toHaveLength(1)
  expect(players[0]).toHaveAttribute('src', `https://open.spotify.com/embed/track/${SECOND_TRACK_ID}`)
})

test('hiding the active player removes its iframe', async () => {
  const user = userEvent.setup()
  renderRecommendations()
  await screen.findByText('Brighter Day')

  await user.click(screen.getAllByRole('button', { name: 'Play' })[0])
  await user.click(screen.getByRole('button', { name: 'Hide player' }))

  expect(screen.queryByTitle('Spotify player')).not.toBeInTheDocument()
})

test('keeps the same player mounted while navigating to another route', async () => {
  const user = userEvent.setup()
  renderRecommendations()
  await screen.findByText('Brighter Day')
  await user.click(screen.getAllByRole('button', { name: 'Play' })[0])
  const player = screen.getByTitle('Spotify player')

  await user.click(screen.getByRole('link', { name: 'Profile' }))

  expect(screen.getByRole('heading', { name: 'Profile destination' })).toBeInTheDocument()
  expect(screen.getByTitle('Spotify player')).toBe(player)
  expect(screen.getByText('Brighter Day')).toBeInTheDocument()
})

test('navigates the recommendation queue and disables first and last boundaries', async () => {
  const user = userEvent.setup()
  renderRecommendations()
  await screen.findByText('Brighter Day')
  await user.click(screen.getAllByRole('button', { name: 'Play' })[0])
  let playerBar = screen.getByTestId('persistent-spotify-player')

  expect(within(playerBar).getByRole('button', { name: 'Previous track' })).toBeDisabled()
  expect(within(playerBar).getByRole('button', { name: 'Next track' })).toBeEnabled()
  await user.click(within(playerBar).getByRole('button', { name: 'Next track' }))

  playerBar = screen.getByTestId('persistent-spotify-player')
  expect(screen.getByTitle('Spotify player')).toHaveAttribute('src', `https://open.spotify.com/embed/track/${SECOND_TRACK_ID}`)
  expect(within(playerBar).getByText('Second Song')).toBeInTheDocument()
  expect(within(playerBar).getByRole('button', { name: 'Previous track' })).toBeEnabled()
  expect(within(playerBar).getByRole('button', { name: 'Next track' })).toBeDisabled()
  expect(within(playerBar).getByRole('button', { name: 'Play' })).toBeInTheDocument()

  await user.click(within(playerBar).getByRole('button', { name: 'Previous track' }))
  expect(screen.getByTitle('Spotify player')).toHaveAttribute('src', `https://open.spotify.com/embed/track/${FIRST_TRACK_ID}`)
})

test('uses the embed controller state for Play and Pause controls', async () => {
  const user = userEvent.setup()
  renderRecommendations()
  await screen.findByText('Brighter Day')
  await user.click(screen.getAllByRole('button', { name: 'Play' })[0])
  const playerBar = screen.getByTestId('persistent-spotify-player')

  await user.click(within(playerBar).getByRole('button', { name: 'Pause' }))
  expect(within(playerBar).getByRole('button', { name: 'Play' })).toBeInTheDocument()
  await user.click(within(playerBar).getByRole('button', { name: 'Play' }))
  expect(within(playerBar).getByRole('button', { name: 'Pause' })).toBeInTheDocument()
})

test('closing stops playback, removes the embed, and restores page spacing', async () => {
  const user = userEvent.setup()
  renderRecommendations()
  await screen.findByText('Brighter Day')
  await user.click(screen.getAllByRole('button', { name: 'Play' })[0])

  expect(screen.getByTestId('app-content')).toHaveClass('pb-64', 'sm:pb-52')
  await user.click(within(screen.getByTestId('persistent-spotify-player')).getByRole('button', { name: 'Close player' }))

  expect(screen.queryByTestId('persistent-spotify-player')).not.toBeInTheDocument()
  expect(screen.queryByTitle('Spotify player')).not.toBeInTheDocument()
  expect(screen.getByTestId('app-content')).not.toHaveClass('pb-64', 'sm:pb-52')
})

test('uses a mobile-safe fixed layout and reserves content space', async () => {
  const user = userEvent.setup()
  renderRecommendations()
  await screen.findByText('Brighter Day')
  await user.click(screen.getAllByRole('button', { name: 'Play' })[0])

  expect(screen.getByTestId('persistent-spotify-player')).toHaveClass('fixed', 'inset-x-2', 'bottom-2', 'sm:inset-x-auto', 'sm:right-4')
  expect(screen.getByTestId('app-content')).toHaveClass('pb-64', 'sm:pb-52')
})

test('a missing track ID keeps the song visible without Spotify controls', async () => {
  renderRecommendations()
  const songTitle = await screen.findByText('Catalogue Song Without ID')
  const songCard = songTitle.closest('article')

  expect(songCard).not.toBeNull()
  expect(within(songCard).queryByRole('button', { name: 'Play' })).not.toBeInTheDocument()
  expect(within(songCard).queryByRole('link', { name: /Open in Spotify/i })).not.toBeInTheDocument()
})

test('Spotify links open the exact recommended track in a new tab', async () => {
  renderRecommendations()
  await screen.findByText('Brighter Day')

  const links = screen.getAllByRole('link', { name: /Open in Spotify/i })
  expect(links[0]).toHaveAttribute('href', `https://open.spotify.com/track/${FIRST_TRACK_ID}`)
  expect(links[0]).toHaveAttribute('target', '_blank')
  expect(links[0]).toHaveAttribute('rel', 'noopener noreferrer')
})

test('existing favorite behavior still saves the selected track', async () => {
  const user = userEvent.setup()
  renderRecommendations()
  await screen.findByText('Brighter Day')

  await user.click(screen.getAllByRole('button', { name: 'Save favorite' })[0])

  expect(moodTuneApi.addFavorite).toHaveBeenCalledWith(FIRST_TRACK_ID)
  expect(await screen.findByText('Saved to favorites.')).toBeInTheDocument()
})
