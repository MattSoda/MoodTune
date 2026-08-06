import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'

vi.mock('../context/AuthContext', () => ({ useAuth: () => ({ user: null }) }))
vi.mock('../services/moodTuneApi', () => ({
  moodTuneApi: {
    recommend: vi.fn().mockResolvedValue({
      current_mood: 'sad', mode: 'feel_better', target_mood: 'happy',
      recommendations: [{ track_id: 'track-1', track_name: 'Brighter Day', artists: 'MoodTune Artist', genres: 'pop', predicted_mood: 'happy', popularity: 80, recommendation_score: 0.95 }],
    }),
  },
}))
import RecommendationsPage from './RecommendationsPage'

test('renders target mood and recommendation returned by the API', async () => {
  render(<MemoryRouter initialEntries={[{ pathname: '/recommendations', state: { mood: 'sad', mode: 'feel_better' } }]}><RecommendationsPage /></MemoryRouter>)
  expect(await screen.findByText('Brighter Day')).toBeInTheDocument()
  expect(screen.getByText(/Target:/i)).toHaveTextContent('happy')
  expect(screen.getByText(/Match score 0.95/i)).toBeInTheDocument()
})
