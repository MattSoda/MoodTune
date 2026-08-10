import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { loginPathFor } from '../utils/authRedirect'
import LoadingState from './LoadingState'

export default function ProtectedRoute() {
  const { user, isLoading } = useAuth()
  const location = useLocation()
  if (isLoading) return <LoadingState label="Checking your session…" />
  const targetRoute = `${location.pathname}${location.search}${location.hash}`
  return user ? <Outlet /> : <Navigate to={loginPathFor(targetRoute)} replace />
}
