import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const protectedLinks = [
  ['Favorites', '/favorites'],
  ['History', '/history'], ['Profile', '/profile'],
]

const navClass = ({ isActive }) => `rounded-full px-3 py-1.5 text-sm transition ${isActive ? 'bg-lavender-300/10 text-lavender-200' : 'text-zinc-500 hover:text-white'}`

export default function AppLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const signOut = async () => { await logout(); navigate('/') }
  return (
    <div className="min-h-screen bg-[#050505] text-zinc-100">
      <header className="sticky top-0 z-10 border-b border-white/[0.06] bg-[#050505]/85 backdrop-blur-xl">
        <nav aria-label="Main navigation" className="mx-auto flex max-w-[86rem] flex-wrap items-center gap-1 px-5 py-3.5">
          <NavLink to="/" className="logo-link mr-auto" aria-label="MoodTune home">
            <span className="logo-mark" aria-hidden="true">
              <svg viewBox="0 0 36 36" role="presentation">
                <defs>
                  <linearGradient id="logo-lavender" x1="4" y1="3" x2="31" y2="34" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#ede9fe" />
                    <stop offset="0.55" stopColor="#c4b5fd" />
                    <stop offset="1" stopColor="#8b5cf6" />
                  </linearGradient>
                </defs>
                <rect x="1" y="1" width="34" height="34" rx="11" fill="url(#logo-lavender)" />
                <path className="logo-wave logo-wave-one" d="M9 20v-4" />
                <path className="logo-wave logo-wave-two" d="M15 24V11" />
                <path className="logo-wave logo-wave-three" d="M21 22v-8" />
                <path className="logo-wave logo-wave-four" d="M27 19v-2" />
              </svg>
              <span className="logo-glint" />
            </span>
            <span className="logo-wordmark">Mood<span>Tune</span></span>
          </NavLink>
          <NavLink to="/" end className={navClass}>Discover</NavLink>
          <NavLink to="/search" className={({ isActive }) => `${navClass({ isActive })} inline-flex items-center gap-2`}>
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="11" cy="11" r="6.5" />
              <path d="m16 16 4 4" strokeLinecap="round" />
            </svg>
            <span>Search</span>
          </NavLink>
          {user ? <>
            {protectedLinks.map(([label, to]) => <NavLink key={to} to={to} className={navClass}>{label}</NavLink>)}
            <button onClick={signOut} className="button-primary px-3 py-1.5 text-sm">Log out</button>
          </> : <>
            <NavLink to="/login" className={navClass}>Log in</NavLink>
            <NavLink to="/register" className="button-primary px-3 py-1.5 text-sm">Create account</NavLink>
          </>}
        </nav>
      </header>
      <main className="mx-auto max-w-[86rem] px-5 py-8 sm:py-12"><Outlet /></main>
    </div>
  )
}
