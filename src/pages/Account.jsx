import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { User, LogOut, Eye, EyeOff, Check, UserCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'

const isEasyPassword = (value) => value.length >= 8 && /[A-Za-z]/.test(value) && /\d/.test(value)

export default function Account() {
  const [tab, setTab] = useState('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [localError, setLocalError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { user, isAdmin, logout, login, signup, authError, setAuthError, loading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const passwordIsStrong = isEasyPassword(password)
  const passwordsMatch = password.length > 0 && password === confirmPassword

  // A full reload back to Home (not just a route change) is deliberate here:
  // it drops every in-memory context — cart, wishlist, header state — so
  // nothing from the old account can linger on screen, and it forces
  // AuthContext to re-run its guest bootstrap so a fresh anonymous session
  // is ready immediately for whatever the next visitor does (browse, or log
  // back in).
  async function handleLogout() {
    await logout()
    window.location.href = '/'
  }

  if (loading) {
    return (
      <section className="section-py bg-cream-dark min-h-[70vh]">
        <div className="container-app max-w-md">
          <div className="card-base p-8 text-center text-sm text-ink-soft">Loading…</div>
        </div>
      </section>
    )
  }

  // Every guest is quietly signed in anonymously so their cart/wishlist can
  // live in Firestore (see AuthContext) -- that's a real Firebase user, but
  // not an account, so it must not be mistaken for "already logged in"
  // here. Only a real signed-up/signed-in customer sees this card.
  if (user && !user.isAnonymous) {
    return (
      <section className="section-py bg-cream-dark min-h-[70vh]">
        <div className="container-app max-w-md">
          <div className="card-base p-8 text-center">
            <div className="w-14 h-14 rounded-full bg-brand-light text-brand flex items-center justify-center mx-auto mb-4">
              <User size={26} />
            </div>
            <p className="font-medium">{user.displayName || user.email}</p>
            <p className="text-xs text-ink-soft mt-1">{user.email}</p>
            {isAdmin && <p className="text-xs text-brand font-medium mt-2">Admin account</p>}
            <button onClick={() => navigate('/profile')} className="btn-outline w-full py-3 text-sm mt-6 flex items-center justify-center gap-2">
              <UserCircle size={16} /> Go to My Profile
            </button>
            <button onClick={handleLogout} className="btn-primary w-full py-3 text-sm mt-3 flex items-center justify-center gap-2">
              <LogOut size={16} /> Log Out
            </button>
          </div>
        </div>
      </section>
    )
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLocalError('')
    setAuthError('')

    if (tab === 'signup') {
      if (!name.trim()) return setLocalError('Please enter your full name.')
      if (!passwordIsStrong) return setLocalError('Use at least 8 characters with a letter and a number.')
      if (!passwordsMatch) return setLocalError('Passwords do not match.')
    }

    setSubmitting(true)
    try {
      if (tab === 'signup') {
        await signup(name.trim(), email.trim(), password)
        // Brand-new accounts land on their profile first (to add an
        // address, etc.) rather than straight on the homepage -- the
        // `newSignup` flag lets Profile show a welcome note, and it also
        // hands along a "continue to Home" step that shows the welcome
        // banner there once they're done.
        navigate('/profile', { replace: true, state: { newSignup: true } })
      } else {
        await login(email.trim(), password)
        const requested = location.state?.from?.pathname
        const dest = requested && !requested.startsWith('/admin') ? requested : '/'
        navigate(dest, { replace: true })
      }
    } catch {
      // AuthContext provides the user-facing Firebase error.
    } finally {
      setSubmitting(false)
    }
  }

  function switchTab(next) {
    setTab(next)
    setPassword('')
    setConfirmPassword('')
    setShowPassword(false)
    setShowConfirmPassword(false)
    setLocalError('')
    setAuthError('')
  }

  const inputClass = 'w-full mt-1 rounded-lg border border-thread px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand'

  return (
    <section className="section-py bg-cream-dark min-h-[70vh]">
      <div className="container-app max-w-md">
        <div className="card-base p-6 sm:p-8">
          <div className="w-14 h-14 rounded-full bg-brand-light text-brand flex items-center justify-center mx-auto mb-4">
            <User size={26} />
          </div>

          <div className="flex border-b border-thread mb-6">
            {['login', 'signup'].map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => switchTab(item)}
                className={`flex-1 pb-3 text-sm font-medium border-b-2 transition-colors ${
                  tab === item ? 'border-brand text-brand' : 'border-transparent text-ink-soft'
                }`}
              >
                {item === 'login' ? 'Login' : 'Sign Up'}
              </button>
            ))}
          </div>

          {(authError || localError) && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-4">
              {localError || authError}
            </p>
          )}

          <div>
            <form className="space-y-4" onSubmit={handleSubmit}>
              {tab === 'signup' && (
                <div>
                  <label className="text-xs font-medium text-ink-soft">Full Name</label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} placeholder="Enter your name" autoComplete="name" required />
                </div>
              )}

              <div>
                <label className="text-xs font-medium text-ink-soft">Email</label>
                <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} placeholder="Enter your email" />
              </div>

              <div>
                <label className="text-xs font-medium text-ink-soft">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={tab === 'signup' ? 8 : 6}
                    autoComplete={tab === 'signup' ? 'new-password' : 'current-password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`${inputClass} pr-12`}
                    placeholder="Enter password"
                  />
                  <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 translate-y-[-42%] p-1 text-ink-soft hover:text-brand" aria-label={showPassword ? 'Hide password' : 'Show password'}>
                    {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                  </button>
                </div>
                {tab === 'signup' && (
                  <div className="mt-1.5 text-xs">
                    {!password ? (
                      <p className="text-ink-soft">Use at least 8 characters with a letter and a number.</p>
                    ) : passwordIsStrong ? (
                      <p className="text-green-600 flex items-center gap-1"><Check size={14} /> Password looks good</p>
                    ) : (
                      <p className="text-red-600">Use at least 8 characters with a letter and a number.</p>
                    )}
                  </div>
                )}
              </div>

              {tab === 'signup' && (
                <div>
                  <label className="text-xs font-medium text-ink-soft">Confirm Password</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      minLength={8}
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={`${inputClass} pr-12 ${confirmPassword && !passwordsMatch ? 'border-red-400' : ''}`}
                      placeholder="Re-enter your password"
                    />
                    <button type="button" onClick={() => setShowConfirmPassword((v) => !v)} className="absolute right-3 top-1/2 translate-y-[-42%] p-1 text-ink-soft hover:text-brand" aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}>
                      {showConfirmPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                    </button>
                  </div>
                  {confirmPassword && (
                    <p className={`text-xs mt-1 ${passwordsMatch ? 'text-green-600' : 'text-red-600'}`}>
                      {passwordsMatch ? 'Passwords match.' : 'Passwords do not match.'}
                    </p>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting || (tab === 'signup' && (!passwordIsStrong || !passwordsMatch))}
                className="btn-primary w-full py-3 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Please wait…' : tab === 'login' ? 'Login' : 'Create Account'}
              </button>
            </form>

          </div>

          <p className="text-center text-xs text-ink-soft mt-6">
            {tab === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button type="button" onClick={() => switchTab(tab === 'login' ? 'signup' : 'login')} className="text-brand font-medium hover:underline">
              {tab === 'login' ? 'Sign Up' : 'Login'}
            </button>
          </p>
        </div>
      </div>
    </section>
  )
}
