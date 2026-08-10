import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { loginPathFor } from '../utils/authRedirect'

export default function useRequireAuth() {
  const { user, isLoading } = useAuth()
  const navigate = useNavigate()

  return (targetRoute = '/', action) => {
    if (isLoading) return false
    if (!user) {
      navigate(loginPathFor(targetRoute))
      return false
    }
    action?.()
    return true
  }
}
