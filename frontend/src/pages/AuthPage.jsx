import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import ErrorMessage from '../components/ErrorMessage'
import { useAuth } from '../context/AuthContext'
import { safeRedirectPath } from '../utils/authRedirect'

export default function AuthPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const redirect = safeRedirectPath(new URLSearchParams(location.search).get('redirect'))

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)
    try {
      await login(email, password)
      navigate(redirect, { replace: true })
    } catch (authError) {
      setError(authError.message || 'Authentication failed. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return <section className="mx-auto max-w-md space-y-7 py-6 sm:py-12">
    <div className="page-header text-center"><p className="page-eyebrow">MoodTune account</p><h1 className="page-title">Welcome back</h1><p className="page-copy mx-auto">Your personalized soundtrack is one step away.</p></div>
    <form onSubmit={submit} className="surface relative space-y-5 overflow-hidden p-6 sm:p-8"><span className="absolute inset-x-12 top-0 h-px bg-gradient-to-r from-transparent via-lavender-300/60 to-transparent" /><ErrorMessage message={error} /><label className="block text-sm font-medium text-zinc-200">Email<input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="input-control" placeholder="you@example.com" /></label><label className="block text-sm font-medium text-zinc-200">Password<input required type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} className="input-control" placeholder="Your password" /></label><button disabled={isSubmitting} className="button-primary w-full py-3 disabled:opacity-60">{isSubmitting ? 'Please wait…' : 'Log in'}</button></form>
    <p className="text-center text-sm text-zinc-500">Need an account? <Link className="font-medium text-lavender-300 transition hover:text-lavender-200" to={`/register?redirect=${encodeURIComponent(redirect)}`}>Register</Link></p>
  </section>
}
