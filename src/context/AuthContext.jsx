import { createContext, useContext, useEffect, useRef, useState } from 'react'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInAnonymously,
  signOut,
  onAuthStateChanged,
  updateProfile,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
  sendPasswordResetEmail,
  verifyPasswordResetCode,
  confirmPasswordReset,
} from 'firebase/auth'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '../firebase.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState('')
  // Guards the one-time anonymous-session bootstrap below so it only ever
  // runs once, on the very first auth check.
  const bootstrappedRef = useRef(false)

  async function checkAdmin(firebaseUser, { throwOnError = true } = {}) {
    if (!firebaseUser) {
      setIsAdmin(false)
      return false
    }

    try {
      const adminRef = doc(db, 'admins', firebaseUser.uid)
      const adminSnap = await getDoc(adminRef)

      if (!adminSnap.exists()) {
        console.warn('Admin document not found for UID:', firebaseUser.uid)
        setIsAdmin(false)
        return false
      }

      const adminData = adminSnap.data()
      const emailMatches =
        !adminData.email ||
        adminData.email.toLowerCase() === (firebaseUser.email || '').toLowerCase()

      const allowed =
        adminData.role === 'admin' &&
        adminData.active === true &&
        emailMatches

      console.log('Admin verification:', {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        role: adminData.role,
        active: adminData.active,
        emailMatches,
        allowed,
      })

      setIsAdmin(allowed)
      return allowed
    } catch (error) {
      console.error('Firestore admin verification failed:', error)
      setIsAdmin(false)

      if (!throwOnError) return false

      const wrapped = new Error(
        error?.code === 'permission-denied'
          ? `Firestore blocked the admin record for UID ${firebaseUser.uid}. Publish the included firestore.rules in Firebase Console.`
          : `Unable to verify admin access for UID ${firebaseUser.uid}. Check the Firebase project configuration.`
      )
      wrapped.code =
        error?.code === 'permission-denied'
          ? 'auth/admin-permission-denied'
          : 'auth/admin-check-failed'
      wrapped.firebaseUid = firebaseUser.uid
      wrapped.cause = error
      throw wrapped
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true)
      setUser(firebaseUser)

      try {
        if (firebaseUser) {
          // Session restoration should never break normal customer login just
          // because the admin collection is not readable yet.
          await checkAdmin(firebaseUser, { throwOnError: false })
        } else {
          setIsAdmin(false)

          // The very first time this app ever resolves to "nobody is
          // signed in" -- on initial load, before the person has had any
          // chance to touch a login form -- give them a stable Firebase
          // uid via anonymous sign-in, so their cart/wishlist can live in
          // Firestore even as a guest (see CartContext).
          //
          // This is deliberately done HERE, awaited, inside the same
          // callback that controls `loading` -- and both Account.jsx and
          // AdminLogin.jsx hold their login/signup forms behind
          // `if (loading) ...` until this resolves. That's what prevents
          // the bug this used to cause: if the anonymous sign-in was
          // fired off separately (e.g. from CartContext) and the person
          // was quick enough to submit a real login before it finished,
          // whichever one finished LAST silently became the active
          // session -- occasionally the anonymous one, which looks like
          // "logged in" but has no name or email. Gating the form on
          // `loading` means a real login can never even be attempted
          // until this is fully settled, so there's nothing left to race.
          if (!bootstrappedRef.current) {
            try {
              await signInAnonymously(auth)
            } catch (err) {
              console.error('Anonymous sign-in failed -- guest cart will stay local-only:', err)
            }
          }
        }
      } finally {
        bootstrappedRef.current = true
        setLoading(false)
      }
    })

    return unsubscribe
  }, [])

  async function signup(name, email, password) {
    setAuthError('')
    setLoading(true)

    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password)

      if (name) {
        await updateProfile(cred.user, { displayName: name })
      }

      await setDoc(doc(db, 'users', cred.user.uid), {
        name: name || '',
        email: cred.user.email,
        role: 'customer',
        createdAt: serverTimestamp(),
      })

      setUser(cred.user)
      setIsAdmin(false)
      return cred.user
    } catch (err) {
      console.error('Signup error:', err)
      setAuthError(friendlyAuthError(err.code))
      throw err
    } finally {
      setLoading(false)
    }
  }

  // Normal customer login. Do not require an admin-record read here.
  async function login(email, password) {
    setAuthError('')
    setLoading(true)

    try {
      const cred = await signInWithEmailAndPassword(auth, email, password)
      setUser(cred.user)

      // Best-effort only. A Firestore admin-rule problem must not prevent a
      // normal customer from signing in.
      const admin = await checkAdmin(cred.user, { throwOnError: false })

      return {
        user: cred.user,
        isAdmin: admin,
      }
    } catch (err) {
      console.error('Login error:', err)
      setIsAdmin(false)
      setAuthError(friendlyAuthError(err.code))
      throw err
    } finally {
      setLoading(false)
    }
  }

  // Dedicated admin login. Firebase Authentication must succeed and the exact
  // signed-in UID must have admins/{uid} with role="admin" and active=true.
  async function adminLogin(email, password) {
    setAuthError('')
    setLoading(true)

    try {
      const cred = await signInWithEmailAndPassword(auth, email, password)
      setUser(cred.user)

      const admin = await checkAdmin(cred.user, { throwOnError: true })

      if (!admin) {
        const uid = cred.user.uid
        await signOut(auth)
        setUser(null)
        setIsAdmin(false)

        const err = new Error(
          `This Firebase account is authenticated, but admins/${uid} is missing or is not active.`
        )
        err.code = 'auth/not-admin'
        err.firebaseUid = uid
        setAuthError(friendlyAuthError(err.code, uid))
        throw err
      }

      return {
        user: cred.user,
        isAdmin: true,
      }
    } catch (err) {
      if (err?.code !== 'auth/not-admin') {
        console.error('Admin login error:', err)
        setIsAdmin(false)

        if (auth.currentUser) {
          try {
            await signOut(auth)
          } catch (signOutError) {
            console.error('Sign-out after failed admin verification:', signOutError)
          }
        }

        setUser(null)
        setAuthError(friendlyAuthError(err.code, err.firebaseUid))
      }
      throw err
    } finally {
      setLoading(false)
    }
  }

  async function logout() {
    await signOut(auth)
    setUser(null)
    setIsAdmin(false)
    setAuthError('')
  }

  // Updates the display name on the Firebase Auth user record and mirrors
  // it onto users/{uid} in Firestore, so both the header/greeting (which
  // reads auth.currentUser) and any Firestore-side reads of the profile
  // stay in sync.
  async function updateDisplayName(name) {
    if (!user) throw new Error('You need to be signed in to do that.')
    await updateProfile(user, { displayName: name })
    await setDoc(doc(db, 'users', user.uid), { name }, { merge: true })
    // updateProfile mutates the underlying Firebase user object in place,
    // but React doesn't know that -- spread it into a new object so
    // anything reading `user.displayName` re-renders with the new value.
    setUser({ ...auth.currentUser })
  }

  // In-session password change. Firebase requires a "recent" sign-in
  // before letting a client change its own password, so this
  // re-authenticates with the current password first -- the same
  // password confirmation pattern most account settings pages use, and
  // it needs no email round-trip at all.
  async function changePassword(currentPassword, newPassword) {
    setAuthError('')
    if (!user || !user.email) throw new Error('You need to be signed in to do that.')

    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword)
      await reauthenticateWithCredential(user, credential)
      await updatePassword(user, newPassword)
    } catch (err) {
      console.error('Change password error:', err)
      setAuthError(friendlyAuthError(err.code))
      throw err
    }
  }

  // Emails a secure, single-use password-reset link. This is Firebase
  // Authentication's supported "verify it's really them via their inbox"
  // flow -- a typed 6-digit code would need a backend (Cloud Functions)
  // to generate, email, and verify it, which this project doesn't have.
  // The link is scoped back to this app's own /reset-password page via
  // actionCodeSettings rather than Firebase's generic hosted page.
  async function sendPasswordReset(email) {
    setAuthError('')
    try {
      await sendPasswordResetEmail(auth, email, {
        url: `${window.location.origin}/reset-password`,
        handleCodeInApp: true,
      })
    } catch (err) {
      console.error('Password reset email error:', err)
      setAuthError(friendlyAuthError(err.code))
      throw err
    }
  }

  // The rest of the reset-link flow, used by the ResetPassword page:
  // verify the code from the emailed link is still valid (and find out
  // which email it belongs to), then set the new password with it.
  async function verifyResetCode(oobCode) {
    return verifyPasswordResetCode(auth, oobCode)
  }

  async function completePasswordReset(oobCode, newPassword) {
    return confirmPasswordReset(auth, oobCode, newPassword)
  }

  const value = {
    user,
    isAdmin,
    loading,
    authError,
    setAuthError,
    signup,
    login,
    adminLogin,
    logout,
    checkAdmin,
    updateDisplayName,
    changePassword,
    sendPasswordReset,
    verifyResetCode,
    completePasswordReset,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside an AuthProvider')
  return ctx
}

function friendlyAuthError(code, uid = '') {
  const uidText = uid ? ` Firebase UID: ${uid}` : ''

  switch (code) {
    case 'auth/email-already-in-use':
      return 'An account with that email already exists — try logging in instead.'
    case 'auth/invalid-email':
      return 'That email address looks invalid.'
    case 'auth/weak-password':
      return 'Password should be at least 6 characters.'
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Incorrect email or password.'
    case 'auth/not-admin':
      return `Authentication succeeded, but this account is not an active admin.${uidText} Create admins/{UID} in Firestore with role="admin" and active=true.`
    case 'auth/admin-permission-denied':
      return `Firebase Authentication succeeded, but Firestore denied access to the admin record.${uidText} Publish the included firestore.rules in Firebase Console → Firestore Database → Rules.`
    case 'auth/admin-check-failed':
      return `Unable to verify admin access.${uidText} Check that VITE_FIREBASE_PROJECT_ID points to the same Firebase project where the admins collection exists.`
    case 'auth/too-many-requests':
      return 'Too many attempts — please wait a moment and try again.'
    case 'auth/requires-recent-login':
      return 'For security, please log out and log back in, then try changing your password again.'
    case 'auth/expired-action-code':
      return 'This reset link has expired — request a new one.'
    case 'auth/invalid-action-code':
      return 'This reset link is invalid or has already been used — request a new one.'
    case 'auth/user-disabled':
      return 'This account has been disabled. Contact support for help.'
    default:
      return 'Something went wrong. Please try again.'
  }
}
