import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, vi } from 'vitest'

const { logout } = vi.hoisted(() => ({ logout: vi.fn().mockResolvedValue(undefined) }))
vi.mock('../context/AuthContext', () => ({ useAuth: () => ({ user: { uid: 'listener-1' }, logout }) }))
import AppLayout from './AppLayout'

beforeEach(() => vi.clearAllMocks())

test('asks for confirmation before logging out', async () => {
  const user = userEvent.setup()
  render(<MemoryRouter><Routes><Route element={<AppLayout />}><Route index element={<p>Home</p>} /></Route></Routes></MemoryRouter>)
  await user.click(screen.getByRole('button', { name: 'Log out' }))
  expect(screen.getByRole('alertdialog')).toBeInTheDocument()
  expect(logout).not.toHaveBeenCalled()
  await user.click(screen.getByRole('button', { name: 'Cancel' }))
  expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
  expect(logout).not.toHaveBeenCalled()
})

test('logs out only after confirmation', async () => {
  const user = userEvent.setup()
  render(<MemoryRouter><Routes><Route element={<AppLayout />}><Route index element={<p>Home</p>} /></Route></Routes></MemoryRouter>)
  await user.click(screen.getByRole('button', { name: 'Log out' }))
  await user.click(screen.getAllByRole('button', { name: 'Log out' }).at(-1))
  expect(logout).toHaveBeenCalledOnce()
})
