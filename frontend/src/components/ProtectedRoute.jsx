import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import LoadingState from './LoadingState'

export default function ProtectedRoute() {
  const { user, isLoading } = useAuth()
  const location = useLocation()
  if (isLoading) return <LoadingState label="Checking your session…" />
  return user ? <Outlet /> : <Navigate to="/login" replace state={{ from: location }} />
}
