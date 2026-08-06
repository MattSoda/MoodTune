import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { vi } from 'vitest'

vi.mock('../context/AuthContext', () => ({ useAuth: () => ({ user: null, isLoading: false }) }))
import ProtectedRoute from './ProtectedRoute'

test('redirects signed-out visitors to login', () => {
  render(<MemoryRouter initialEntries={['/profile']}><Routes><Route element={<ProtectedRoute />}><Route path="/profile" element={<p>Private profile</p>} /></Route><Route path="/login" element={<p>Login page</p>} /></Routes></MemoryRouter>)
  expect(screen.getByText('Login page')).toBeInTheDocument()
})
