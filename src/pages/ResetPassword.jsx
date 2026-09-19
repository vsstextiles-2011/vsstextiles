import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Eye, EyeOff, Check, KeyRound } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'

const isEasyPassword = (value) => value.length >= 8 && /[A-Za-z]/.test(value) && /\d/.test(value)

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const oobCode = searchParams.get('oobCode')
  const { verifyResetCode, completePasswordReset } = useAuth()
  const navigate = useNavigate()

  // 'checking' | 'valid' | 'invalid' | 'done'
  const [status, setStatus] = useState('checking')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!oobCode) {
      setStatus('invalid')
      return
    }
    verifyResetCode(oobCode)
      .then((verifiedEmail) => {
        setEmail(verifiedEmail)
        setStatus('valid')
      })
      .catch((err) => {
        console.error('Reset link verification failed:', err)
        setStatus('invalid')
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [oobCode])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!isEasyPassword(password)) {
      return setError('Use at least 8 characters with a letter and a number.')
    }
    if (password !== confirmPassword) {
      return setError('Passwords do not match.')
    }

    setSubmitting(true)
    try {
      await completePasswordReset(oobCode, password)
      setStatus('done')
    } catch (err) {
      console.error('Password reset failed:', err)
      setError('This link may have expired or already been used. Request a new one from My Profile → Security.')
    } finally {
      setSubmitting(false)
    }
  }

  const inputClass = 'w-full mt-1 rounded-lg border border-thread px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand'

  return (
    <section className="section-py bg-cream-dark min-h-[70vh]">
      <div className="container-app max-w-md">
        <div className="card-base p-6 sm:p-8">
          <div className="w-14 h-14 rounded-full bg-brand-light text-brand flex items-center justify-center mx-auto mb-4">
            <KeyRound size={26} />
          </div>

          {status === 'checking' && (
            <p className="text-center text-sm text-ink-soft">Checking your reset link…</p>
          )}

          {status === 'invalid' && (
            <div className="text-center">
              <p className="text-sm text-ink font-medium mb-1">This link isn't valid</p>
              <p className="text-xs text-ink-soft mb-6">It may have expired or already been used. Sign in and request a new one from My Profile → Security.</p>
              <Link to="/account" className="btn-primary px-5 py-2.5 text-sm inline-block">Go to Login</Link>
            </div>
          )}

          {status === 'valid' && (
            <>
              <p className="text-center text-sm text-ink-soft mb-6">
                Set a new password for <span className="font-medium text-ink">{email}</span>
              </p>

              {error && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-4">{error}</p>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-ink-soft">New Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={8}
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`${inputClass} pr-12`}
                    />
                    <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 translate-y-[-42%] p-1 text-ink-soft hover:text-brand" aria-label={showPassword ? 'Hide password' : 'Show password'}>
                      {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                    </button>
                  </div>
                  <p className="text-xs text-ink-soft mt-1">At least 8 characters with a letter and a number.</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-ink-soft">Confirm New Password</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <button type="submit" disabled={submitting} className="btn-primary w-full py-3 text-sm disabled:opacity-50">
                  {submitting ? 'Updating…' : 'Set New Password'}
                </button>
              </form>
            </>
          )}

          {status === 'done' && (
            <div className="text-center">
              <div className="w-10 h-10 rounded-full bg-green-50 text-green-600 flex items-center justify-center mx-auto mb-3">
                <Check size={20} />
              </div>
              <p className="text-sm text-ink font-medium mb-1">Password updated</p>
              <p className="text-xs text-ink-soft mb-6">You can now log in with your new password.</p>
              <button onClick={() => navigate('/account')} className="btn-primary px-5 py-2.5 text-sm">Go to Login</button>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
