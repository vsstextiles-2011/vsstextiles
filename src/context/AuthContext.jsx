import { createContext, useContext, useEffect, useState } from 'react'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '../firebase.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState('')

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
        }
      } finally {
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
    default:
      return 'Something went wrong. Please try again.'
  }
}
