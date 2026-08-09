import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'

const { TRACK_ID } = vi.hoisted(() => ({ TRACK_ID: '4uLU6hMCjMI75M1A2tKUQC' }))

vi.mock('../services/moodTuneApi', () => ({
  moodTuneApi: {
    favorites: vi.fn().mockResolvedValue({ favorites: [{ track_id: TRACK_ID, track_name: 'Saved Track', artists: 'MoodTune Artist', genres: 'pop', predicted_mood: 'happy', popularity: 80 }] }),
    removeFavorite: vi.fn().mockResolvedValue({}),
  },
}))

import FavoritesPage from './FavoritesPage'

test('plays a saved Spotify track from favorites', async () => {
  const user = userEvent.setup()
  render(<FavoritesPage />)
  await screen.findByText('Saved Track')

  await user.click(screen.getByRole('button', { name: 'Play' }))

  expect(screen.getByTitle('Spotify player')).toHaveAttribute('src', `https://open.spotify.com/embed/track/${TRACK_ID}`)
})
