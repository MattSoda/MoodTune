import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, vi } from 'vitest'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import HomePage from './HomePage'

const { authState } = vi.hoisted(() => ({ authState: { user: { uid: 'listener-1' }, isLoading: false } }))
vi.mock('../context/AuthContext', () => ({ useAuth: () => authState }))

afterEach(() => { authState.user = { uid: 'listener-1' }; authState.isLoading = false })

function Destination() {
  const { state } = useLocation()
  return <p>{`${state.mood}:${state.mode}:${state.activity}:${state.preferredGenres.join(',')}`}</p>
}

function CurrentLocation() {
  const location = useLocation()
  return <p>{`${location.pathname}${location.search}`}</p>
}

test('submits a predefined mood and recommendation mode', async () => {
  const user = userEvent.setup()
  render(<MemoryRouter initialEntries={['/']}><Routes><Route path="/" element={<HomePage />} /><Route path="/recommendations" element={<Destination />} /></Routes></MemoryRouter>)
  await user.click(screen.getByRole('button', { name: /sad/i }))
  await user.click(screen.getByRole('button', { name: /Studying/i }))
  await user.click(screen.getByLabelText('Jazz'))
  await user.click(screen.getByLabelText('Reggae'))
  await user.click(screen.getByLabelText(/Make Me Feel Better/i))
  await user.click(screen.getByRole('button', { name: /Get recommendations/i }))
  expect(screen.getByText('sad:feel_better:studying:jazz,reggae')).toBeInTheDocument()
})

test('lets a signed-out user select options and checks auth on recommendation', async () => {
  authState.user = null
  const user = userEvent.setup()
  render(<MemoryRouter initialEntries={['/']}><Routes><Route path="/" element={<HomePage />} /><Route path="/login" element={<CurrentLocation />} /></Routes></MemoryRouter>)
  await user.click(screen.getByRole('button', { name: /sad/i }))
  await user.click(screen.getByRole('button', { name: /Studying/i }))
  await user.click(screen.getByLabelText('Jazz'))
  expect(screen.getByRole('button', { name: /sad/i })).toHaveAttribute('aria-pressed', 'true')
  await user.click(screen.getByRole('button', { name: /Get recommendations/i }))
  expect(screen.getByText('/login?redirect=%2Frecommendations')).toBeInTheDocument()
  expect(JSON.parse(sessionStorage.getItem('moodtune.pendingRecommendation'))).toMatchObject({ mood: 'sad', activity: 'studying', preferredGenres: ['jazz'] })
})
