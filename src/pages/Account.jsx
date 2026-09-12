import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { User, LogOut } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'

export default function Account() {
  const [tab, setTab] = useState('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { user, isAdmin, logout, login, signup, authError, setAuthError } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // Already signed in — show a simple account panel instead of the form.
  if (user) {
    return (
      <section className="section-py bg-cream-dark min-h-[70vh]">
        <div className="container-app max-w-md">
          <div className="card-base p-8 text-center">
            <div className="w-14 h-14 rounded-full bg-brand-light text-brand flex items-center justify-center mx-auto mb-4">
              <User size={26} />
            </div>
            <p className="font-medium">{user.displayName || user.email}</p>
            <p className="text-xs text-ink-soft mt-1">{user.email}</p>
            {isAdmin && (
              <p className="text-xs text-brand font-medium mt-2">Admin account</p>
            )}
            <button
              onClick={() => logout()}
              className="btn-primary w-full py-3 text-sm mt-6 flex items-center justify-center gap-2"
            >
              <LogOut size={16} /> Log Out
            </button>
          </div>
        </div>
      </section>
    )
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    try {
      if (tab === 'signup') {
        await signup(name.trim(), email.trim(), password)
      } else {
        await login(email.trim(), password)
      }

      // User login returns to the page they originally requested. Admin login
      // has its own dedicated /admin/login page.
      const requested = location.state?.from?.pathname
      const dest = requested && !requested.startsWith('/admin') ? requested : '/'
      navigate(dest, { replace: true })
    } catch {
      // authError is already set by the context; nothing else to do here.
    } finally {
      setSubmitting(false)
    }
  }

  function switchTab(next) {
    setTab(next)
    setAuthError('')
  }

  return (
    <section className="section-py bg-cream-dark min-h-[70vh]">
      <div className="container-app max-w-md">
        <div className="card-base p-8">
          <div className="w-14 h-14 rounded-full bg-brand-light text-brand flex items-center justify-center mx-auto mb-4">
            <User size={26} />
          </div>
          <div className="flex border-b border-thread mb-6">
            <button
              onClick={() => switchTab('login')}
              className={`flex-1 pb-3 text-sm font-medium border-b-2 transition-colors ${
                tab === 'login' ? 'border-brand text-brand' : 'border-transparent text-ink-soft'
              }`}
            >
              Login
            </button>
            <button
              onClick={() => switchTab('signup')}
              className={`flex-1 pb-3 text-sm font-medium border-b-2 transition-colors ${
                tab === 'signup' ? 'border-brand text-brand' : 'border-transparent text-ink-soft'
              }`}
            >
              Sign Up
            </button>
          </div>

          {authError && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-4">
              {authError}
            </p>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            {tab === 'signup' && (
              <div>
                <label className="text-xs font-medium text-ink-soft">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full mt-1 rounded-lg border border-thread px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                  placeholder="Enter your name"
                  required
                />
              </div>
            )}
            <div>
              <label className="text-xs font-medium text-ink-soft">Email</label>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full mt-1 rounded-lg border border-thread px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                placeholder="Enter your email"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-ink-soft">Password</label>
              <input
                type="password"
                required
                minLength={6}
                autoComplete={tab === 'signup' ? 'new-password' : 'current-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full mt-1 rounded-lg border border-thread px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                placeholder="Enter password"
              />
            </div>
            <button type="submit" disabled={submitting} className="btn-primary w-full py-3 text-sm disabled:opacity-60">
              {submitting ? 'Please wait…' : tab === 'login' ? 'Login' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-xs text-ink-soft mt-6">
            {tab === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button
              onClick={() => switchTab(tab === 'login' ? 'signup' : 'login')}
              className="text-brand font-medium hover:underline"
            >
              {tab === 'login' ? 'Sign Up' : 'Login'}
            </button>
          </p>
        </div>
      </div>
    </section>
  )
}
