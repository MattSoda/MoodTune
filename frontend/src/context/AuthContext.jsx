import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { loginWithEmail, logout, observeAuthState, registerWithEmail } from '../services/authService'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = observeAuthState((nextUser) => {
      setUser(nextUser)
      setIsLoading(false)
    })
    return unsubscribe
  }, [])

  const value = useMemo(() => ({
    user,
    isLoading,
    login: (email, password) => loginWithEmail(email, password),
    register: (email, password) => registerWithEmail(email, password),
    logout,
  }), [user, isLoading])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider.')
  return context
}
