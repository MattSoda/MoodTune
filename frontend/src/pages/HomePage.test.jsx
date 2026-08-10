import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import HomePage from './HomePage'

function Destination() {
  const { state } = useLocation()
  return <p>{`${state.mood}:${state.mode}:${state.activity}:${state.preferredGenres.join(',')}`}</p>
}

test('submits a predefined mood and recommendation mode', async () => {
  const user = userEvent.setup()
  render(<MemoryRouter initialEntries={['/']}><Routes><Route path="/" element={<HomePage />} /><Route path="/recommendations" element={<Destination />} /></Routes></MemoryRouter>)
  await user.click(screen.getByRole('button', { name: /sad/i }))
  await user.click(screen.getByRole('button', { name: /Studying/i }))
  await user.click(screen.getByLabelText('Jazz'))
  await user.click(screen.getByLabelText(/Make Me Feel Better/i))
  await user.click(screen.getByRole('button', { name: /Get recommendations/i }))
  expect(screen.getByText('sad:feel_better:studying:jazz')).toBeInTheDocument()
})
