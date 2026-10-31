import admin from 'firebase-admin'

// Only the project id is needed to VERIFY Firebase login tokens (Google's
// public keys are used) - no service account file required.
admin.initializeApp({ projectId: process.env.FIREBASE_PROJECT_ID || 'vsstexiles' })

export class HttpError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

export const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)

const adminCache = new Map() // uid -> { ok, reason, until }

// Same rule as firestore.rules: admins/{uid} must have role "admin" and active true.
// We read that document through the Firestore REST API using the USER'S OWN token,
// so Firestore's own rules decide (a user can only read their own admins/{uid}).
// Returns { ok, reason } - the reason is shown in the 403 message and the server
// console so you can see exactly WHY admin access was refused.
async function checkAdmin(uid, idToken) {
  const hit = adminCache.get(uid)
  if (hit && hit.until > Date.now()) return hit
  const project = process.env.FIREBASE_PROJECT_ID || 'vsstexiles'
  const url = `https://firestore.googleapis.com/v1/projects/${project}/databases/(default)/documents/admins/${uid}`
  let result
  try {
    const r = await fetch(url, { headers: { Authorization: `Bearer ${idToken}` } })
    if (r.ok) {
      const f = (await r.json()).fields || {}
      const ok = f.role?.stringValue === 'admin' && f.active?.booleanValue === true
      result = ok
        ? { ok: true, reason: '' }
        : { ok: false, reason: `admins/${uid} exists but role is not "admin" or active is not true` }
    } else if (r.status === 404) {
      result = { ok: false, reason: `Firestore has no document admins/${uid} (project "${project}")` }
    } else if (r.status === 403) {
      result = { ok: false, reason: `Firestore refused the read of admins/${uid} - publish firestore.rules` }
    } else {
      result = { ok: false, reason: `Firestore check failed with HTTP ${r.status}` }
    }
  } catch (err) {
    result = { ok: false, reason: `Server could not reach Firestore (${err.cause?.code || err.message}) - check internet/firewall/VPN` }
  }
  if (!result.ok) console.warn(`[admin check] uid=${uid}: ${result.reason}`)
  // Cache a success for 5 minutes, but a failure for only 5 seconds so a fix applies right away.
  result.until = Date.now() + (result.ok ? 5 * 60 * 1000 : 5000)
  adminCache.set(uid, result)
  return result
}

// LOCAL MODE (default): the server only listens on this computer (127.0.0.1), so it
// skips the online Firestore admin check and treats every request as the admin.
// Set LOCAL_MODE=false in server/.env to bring the full Firebase admin check back.
export const LOCAL_MODE = String(process.env.LOCAL_MODE ?? 'true').toLowerCase() !== 'false'

export const requireAuth = wrap(async (req, _res, next) => {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : ''
  if (LOCAL_MODE) {
    // Keep the real user id when a valid login token is sent, but never block on it.
    try { req.user = token ? await admin.auth().verifyIdToken(token) : { uid: 'local-admin' } } catch { req.user = { uid: 'local-admin' } }
    req.idToken = token
    req.isAdmin = true
    return next()
  }
  if (!token) throw new HttpError(401, 'Missing Authorization: Bearer <Firebase ID token>')
  try {
    req.user = await admin.auth().verifyIdToken(token)
    req.idToken = token
  } catch {
    throw new HttpError(401, 'Invalid or expired login token')
  }
  const check = await checkAdmin(req.user.uid, token)
  req.isAdmin = check.ok
  req.adminReason = check.reason
  next()
})

export const requireAdmin = [
  requireAuth,
  (req, _res, next) =>
    req.isAdmin ? next() : next(new HttpError(403, `Admin access required - ${req.adminReason}`)),
]

export function notFound(_req, res) {
  res.status(404).json({ error: 'Route not found' })
}

export function errorHandler(err, _req, res, _next) {
  const status = err.status || 500
  if (status >= 500) console.error(err)
  res.status(status).json({ error: status >= 500 ? 'Internal server error' : err.message })
}
