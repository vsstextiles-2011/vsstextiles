import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'

export function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <AuthLoading />
  // Every guest browsing the store is quietly signed in anonymously (see
  // AuthContext) so their cart/wishlist can live in Firestore -- that's a
  // real Firebase user, but not an account. Pages gated behind this
  // (like the profile page) need an actual signed-up/signed-in customer.
  if (!user || user.isAnonymous) return <Navigate to="/account" state={{ from: location }} replace />
  return children
}

export function AdminRoute({ children }) {
  const { user, isAdmin, loading } = useAuth()
  const location = useLocation()

  if (loading) return <AuthLoading />

  if (!user) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />
  }

  if (!isAdmin) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />
  }

  return children
}

function AuthLoading() {
  return (
    <div className="min-h-[50vh] flex items-center justify-center text-ink-soft text-sm">
      Checking your session…
    </div>
  )
}
