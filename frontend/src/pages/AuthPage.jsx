import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import ErrorMessage from '../components/ErrorMessage'
import { useAuth } from '../context/AuthContext'

export default function AuthPage({ isRegistration = false }) {
  const { login, register } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const title = isRegistration ? 'Create your account' : 'Welcome back'

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)
    try {
      await (isRegistration ? register(email, password) : login(email, password))
      navigate(location.state?.from?.pathname || '/')
    } catch (authError) {
      setError(authError.message || 'Authentication failed. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="mx-auto max-w-md space-y-6 py-8 sm:py-14">
      <div><p className="text-sm font-semibold uppercase tracking-[0.18em] text-violet-300">MoodTune account</p><h1 className="page-title mt-2">{title}</h1><p className="page-copy">Use your Firebase Authentication email and password.</p></div>
      <form onSubmit={submit} className="surface space-y-4 p-6">
        <ErrorMessage message={error} />
        <label className="block text-sm font-medium">Email<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="input-control" /></label>
        <label className="block text-sm font-medium">Password<input required minLength="6" type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="input-control" /></label>
        <button disabled={isSubmitting} className="button-primary w-full">{isSubmitting ? 'Please wait…' : isRegistration ? 'Register' : 'Log in'}</button>
      </form>
      <p className="text-sm text-slate-300">{isRegistration ? 'Already have an account?' : 'Need an account?'} <Link className="text-violet-300 underline" to={isRegistration ? '/login' : '/register'}>{isRegistration ? 'Log in' : 'Register'}</Link></p>
    </section>
  )
}
