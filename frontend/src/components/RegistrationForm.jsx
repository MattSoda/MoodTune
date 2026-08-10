import { useState } from 'react'
import ErrorMessage from './ErrorMessage'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const USERNAME_PATTERN = /^[A-Za-z][A-Za-z0-9_]{2,29}$/

export function validateRegistration(values) {
  const errors = {}
  if (values.name.trim().length < 2 || values.name.trim().length > 80) errors.name = 'Name must be between 2 and 80 characters.'
  if (!USERNAME_PATTERN.test(values.username.trim())) errors.username = 'Use 3–30 characters, starting with a letter; letters, numbers, and underscores only.'
  if (!EMAIL_PATTERN.test(values.email.trim())) errors.email = 'Enter a valid email address.'
  if (values.password.length < 8 || !/[a-z]/.test(values.password) || !/[A-Z]/.test(values.password) || !/\d/.test(values.password)) errors.password = 'Use at least 8 characters with uppercase, lowercase, and a number.'
  return errors
}

function FieldError({ id, message }) {
  return message ? <p id={id} className="mt-1.5 text-xs text-rose-300" role="alert">{message}</p> : null
}

export default function RegistrationForm({ onSubmit, isSubmitting, submitError }) {
  const [values, setValues] = useState({ name: '', username: '', email: '', password: '' })
  const [errors, setErrors] = useState({})
  const update = (field) => (event) => {
    setValues((current) => ({ ...current, [field]: event.target.value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
  }
  const submit = (event) => {
    event.preventDefault()
    const nextErrors = validateRegistration(values)
    setErrors(nextErrors)
    if (!Object.keys(nextErrors).length) onSubmit({ ...values, name: values.name.trim(), username: values.username.trim(), email: values.email.trim().toLowerCase() })
  }

  return <form onSubmit={submit} noValidate className="surface relative space-y-5 overflow-hidden p-6 sm:p-8">
    <span className="absolute inset-x-12 top-0 h-px bg-gradient-to-r from-transparent via-lavender-300/60 to-transparent" />
    <ErrorMessage message={submitError} />
    <label className="block text-sm font-medium text-zinc-200">Name<input autoComplete="name" value={values.name} onChange={update('name')} aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? 'name-error' : undefined} className="input-control" placeholder="Your name" /><FieldError id="name-error" message={errors.name} /></label>
    <label className="block text-sm font-medium text-zinc-200">Username<input autoComplete="username" value={values.username} onChange={update('username')} aria-invalid={Boolean(errors.username)} aria-describedby={errors.username ? 'username-error' : undefined} className="input-control" placeholder="music_listener" /><FieldError id="username-error" message={errors.username} /></label>
    <label className="block text-sm font-medium text-zinc-200">Email<input type="email" autoComplete="email" value={values.email} onChange={update('email')} aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? 'email-error' : undefined} className="input-control" placeholder="you@example.com" /><FieldError id="email-error" message={errors.email} /></label>
    <label className="block text-sm font-medium text-zinc-200">Password<input type="password" autoComplete="new-password" value={values.password} onChange={update('password')} aria-invalid={Boolean(errors.password)} aria-describedby={errors.password ? 'password-error' : undefined} className="input-control" placeholder="8+ characters" /><FieldError id="password-error" message={errors.password} /></label>
    <button disabled={isSubmitting} className="button-primary w-full py-3 disabled:opacity-60">{isSubmitting ? 'Creating account…' : 'Create account'}</button>
  </form>
}
