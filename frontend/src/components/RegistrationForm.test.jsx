import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, test, vi } from 'vitest'
import RegistrationForm from './RegistrationForm'

describe('RegistrationForm', () => {
  test('shows field errors and blocks invalid registration', () => {
    const submit = vi.fn()
    render(<RegistrationForm onSubmit={submit} isSubmitting={false} submitError="" />)
    fireEvent.click(screen.getByRole('button', { name: 'Create account' }))
    expect(screen.getByText('Name must be between 2 and 80 characters.')).toBeInTheDocument()
    expect(screen.getByText(/starting with a letter/)).toBeInTheDocument()
    expect(screen.getByText('Enter a valid email address.')).toBeInTheDocument()
    expect(submit).not.toHaveBeenCalled()
  })

  test('submits normalized valid values', () => {
    const submit = vi.fn()
    render(<RegistrationForm onSubmit={submit} isSubmitting={false} submitError="" />)
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: '  Mood User  ' } })
    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'Mood_User' } })
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'MOOD@example.com' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'StrongPass1' } })
    fireEvent.click(screen.getByRole('button', { name: 'Create account' }))
    expect(submit).toHaveBeenCalledWith({ name: 'Mood User', username: 'Mood_User', email: 'mood@example.com', password: 'StrongPass1' })
  })
})
