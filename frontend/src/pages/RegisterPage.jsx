import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import RegistrationForm from '../components/RegistrationForm'
import { useAuth } from '../context/AuthContext'
import { safeRedirectPath } from '../utils/authRedirect'

export default function RegisterPage() {
  const { register } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const redirect = safeRedirectPath(new URLSearchParams(location.search).get('redirect'))
  const submit = async (values) => {
    setError('')
    setIsSubmitting(true)
    try {
      await register(values)
      navigate(redirect, { replace: true })
    } catch (authError) {
      setError(authError.message || 'Registration failed. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return <section className="mx-auto max-w-md space-y-7 py-6 sm:py-12">
    <div className="page-header text-center"><p className="page-eyebrow">MoodTune account</p><h1 className="page-title">Create your account</h1><p className="page-copy mx-auto">Build a listening identity tuned to you.</p></div>
    <RegistrationForm onSubmit={submit} isSubmitting={isSubmitting} submitError={error} />
    <p className="text-center text-sm text-zinc-500">Already have an account? <Link className="font-medium text-lavender-300 transition hover:text-lavender-200" to={`/login?redirect=${encodeURIComponent(redirect)}`}>Log in</Link></p>
  </section>
}
