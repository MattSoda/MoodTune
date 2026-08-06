import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const protectedLinks = [
  ['Favorites', '/favorites'],
  ['History', '/history'], ['Profile', '/profile'],
]

const navClass = ({ isActive }) => `rounded-md px-2 py-1.5 text-sm transition ${isActive ? 'bg-violet-400/15 text-violet-200' : 'text-slate-300 hover:text-white'}`

export default function AppLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const signOut = async () => { await logout(); navigate('/') }
  return (
    <div className="min-h-screen bg-slate-950/75 text-slate-100">
      <header className="sticky top-0 z-10 border-b border-slate-800/80 bg-slate-950/85 backdrop-blur">
        <nav aria-label="Main navigation" className="mx-auto flex max-w-6xl flex-wrap items-center gap-2 px-5 py-3">
          <NavLink to="/" className="mr-auto rounded-md px-1 text-xl font-bold tracking-tight text-violet-300">MoodTune</NavLink>
          <NavLink to="/search" className={navClass}>Search</NavLink>
          {user ? <>
            {protectedLinks.map(([label, to]) => <NavLink key={to} to={to} className={navClass}>{label}</NavLink>)}
            <button onClick={signOut} className="button-primary px-3 py-1.5 text-sm">Log out</button>
          </> : <>
            <NavLink to="/login" className={navClass}>Log in</NavLink>
            <NavLink to="/register" className="button-primary px-3 py-1.5 text-sm">Create account</NavLink>
          </>}
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-5 py-8 sm:py-12"><Outlet /></main>
    </div>
  )
}
