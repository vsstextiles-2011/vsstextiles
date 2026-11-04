import { useEffect, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { LockKeyhole, LogOut, ShieldCheck } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'

export default function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const {
    user,
    isAdmin,
    loading,
    authError,
    setAuthError,
    adminLogin,
    logout,
  } = useAuth()

  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    return () => setAuthError('')
  }, [setAuthError])

  if (loading) {
    return (
      <section className="section-py bg-cream-dark min-h-[70vh]">
        <div className="container-app max-w-md">
          <div className="card-base p-8 text-center text-sm text-ink-soft">
            Checking admin session…
          </div>
        </div>
      </section>
    )
  }

  if (user && isAdmin) {
    return <Navigate to="/admin" replace />
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    setAuthError('')

    try {
      await adminLogin(email.trim(), password)
      const destination = location.state?.from?.pathname || '/admin'
      navigate(destination === '/admin/login' ? '/admin' : destination, { replace: true })
    } catch {
      // AuthContext already sets a friendly error message.
    } finally {
      setSubmitting(false)
    }
  }

  async function handleSwitchAccount() {
    await logout()
    setEmail('')
    setPassword('')
  }

  return (
    <section className="section-py bg-cream-dark min-h-[70vh]">
      <div className="container-app max-w-md">
        <div className="card-base p-8">
          <div className="w-14 h-14 rounded-full bg-brand-light text-brand flex items-center justify-center mx-auto mb-4">
            <ShieldCheck size={26} />
          </div>

          <div className="text-center mb-6">
            <h1 className="text-2xl font-semibold text-ink">Admin Login</h1>
            <p className="text-sm text-ink-soft mt-2">
              Sign in with an active VSS Textiles admin account.
            </p>
          </div>

          {user && !isAdmin ? (
            <div className="text-center">
              <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-3 mb-4">
                {user.email} is signed in as a regular user, not as an admin.
              </p>
              <button
                type="button"
                onClick={handleSwitchAccount}
                className="btn-primary w-full py-3 text-sm flex items-center justify-center gap-2"
              >
                <LogOut size={16} /> Log out and use admin account
              </button>
            </div>
          ) : (
            <>
              {authError && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-4">
                  {authError}
                </p>
              )}

              <form className="space-y-4" onSubmit={handleSubmit}>
                <div>
                  <label className="text-xs font-medium text-ink-soft">Admin Email</label>
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full mt-1 rounded-lg border border-thread px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                    placeholder="Enter admin email"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-ink-soft">Password</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full mt-1 rounded-lg border border-thread px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                    placeholder="Enter password"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary w-full py-3 text-sm disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  <LockKeyhole size={16} />
                  {submitting ? 'Checking admin access…' : 'Login as Admin'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </section>
  )
}
