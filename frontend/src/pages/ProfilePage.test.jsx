import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, vi } from 'vitest'

const { apiMocks } = vi.hoisted(() => ({
  apiMocks: {
    profile: vi.fn(),
    moodFrequency: vi.fn(),
    updateProfile: vi.fn(),
  },
}))

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: { uid: 'listener-1', email: 'listener@example.com' } }),
}))
vi.mock('../services/profileImageService', () => ({ uploadProfileImage: vi.fn() }))
vi.mock('../services/moodTuneApi', () => ({ moodTuneApi: apiMocks }))

import ProfilePage from './ProfilePage'

beforeEach(() => {
  vi.clearAllMocks()
  apiMocks.profile.mockResolvedValue({
    profile: {
      display_name: 'Mood User',
      username: 'mood_user',
      email: 'listener@example.com',
      preferred_genres: ['pop'],
      favorite_artists: [],
      bio: '',
    },
  })
  apiMocks.moodFrequency.mockResolvedValue({ mood_frequency: [], total_check_ins: 0 })
  apiMocks.updateProfile.mockResolvedValue({ profile: { avatar_url: '' } })
})

test('renders the total, mood names, and exact counts in the frequency chart', async () => {
  apiMocks.moodFrequency.mockResolvedValue({
    mood_frequency: [
      { mood: 'stressed', count: 8 },
      { mood: 'happy', count: 5 },
    ],
    total_check_ins: 13,
  })

  render(<ProfilePage />)

  expect(await screen.findByRole('heading', { name: 'Your Mood Check-ins' })).toBeInTheDocument()
  expect(screen.getByText('13')).toBeInTheDocument()
  const chart = screen.getByTestId('mood-frequency-chart')
  expect(chart).toHaveAccessibleName('Mood frequency chart with 13 total check-ins')
  expect(chart.querySelector('svg')).toBeInTheDocument()
  expect(screen.getByText('Stressed: 8 check-ins')).toBeInTheDocument()
  expect(screen.getByText('Happy: 5 check-ins')).toBeInTheDocument()
  expect(screen.getByText(/do not measure or diagnose your emotional health/i)).toBeInTheDocument()
})

test('renders the empty-history guidance', async () => {
  render(<ProfilePage />)

  expect(await screen.findByText('No mood check-ins yet. Request recommendations to start building your insights.')).toBeInTheDocument()
  expect(screen.getByText('0')).toBeInTheDocument()
})

test('keeps the profile form usable when the chart request fails', async () => {
  apiMocks.moodFrequency.mockRejectedValue(new Error('Insights unavailable.'))
  const user = userEvent.setup()

  render(<ProfilePage />)

  expect(await screen.findByRole('alert')).toHaveTextContent("We couldn't load your mood insights. Insights unavailable.")
  const name = screen.getByRole('textbox', { name: 'Name' })
  await user.clear(name)
  await user.type(name, 'Updated Listener')
  await user.click(screen.getByRole('button', { name: 'Save profile' }))

  expect(apiMocks.updateProfile).toHaveBeenCalledWith(expect.objectContaining({ display_name: 'Updated Listener' }))
  expect(await screen.findByText('Profile saved.')).toBeInTheDocument()
})
