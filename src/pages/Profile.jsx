import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { doc, onSnapshot, updateDoc } from 'firebase/firestore'
import {
  User,
  MapPin,
  Package,
  Lock,
  Plus,
  Pencil,
  Trash2,
  Check,
  Eye,
  EyeOff,
  LogOut,
  Star,
  Sparkles,
  X,
  Truck,
} from 'lucide-react'
import { db } from '../firebase.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useOrders } from '../context/OrderContext.jsx'
import { formatPrice } from '../utils/formatPrice.js'
import { INDIAN_STATES } from '../utils/indianStates.js'
import TrackOrderModal from '../components/profile/TrackOrderModal.jsx'

const TABS = [
  { id: 'details', label: 'My Details', icon: User },
  { id: 'addresses', label: 'Addresses', icon: MapPin },
  { id: 'orders', label: 'Orders', icon: Package },
  { id: 'security', label: 'Security', icon: Lock },
]

const EMPTY_ADDRESS = {
  label: 'Home', fullName: '', phone: '', pincode: '', line1: '', area: '', city: '', state: INDIAN_STATES[0],
}

function makeId() {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `addr-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

const inputClass = 'w-full mt-1 rounded-lg border border-thread px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand'

export default function Profile() {
  const { user, logout, updateDisplayName } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const [tab, setTab] = useState('details')
  const [newSignup, setNewSignup] = useState(Boolean(location.state?.newSignup))

  // Live profile doc (name/phone/addresses) -- same subscribe-and-write
  // pattern as Cart/Wishlist context, just scoped to this one page since
  // nothing else in the app needs it.
  const [profileDoc, setProfileDoc] = useState(null)
  const [profileLoading, setProfileLoading] = useState(true)

  useEffect(() => {
    if (location.state?.newSignup) {
      // Consume it from history state so a later reload of /profile
      // doesn't keep showing the "welcome" intro.
      navigate(location.pathname, { replace: true, state: {} })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!user) return
    const ref = doc(db, 'users', user.uid)
    const unsubscribe = onSnapshot(
      ref,
      (snap) => {
        setProfileDoc(snap.exists() ? snap.data() : {})
        setProfileLoading(false)
      },
      (err) => {
        console.error('Profile sync failed:', err)
        setProfileLoading(false)
      }
    )
    return unsubscribe
  }, [user])

  const addresses = profileDoc?.addresses || []

  async function saveAddresses(next) {
    await updateDoc(doc(db, 'users', user.uid), { addresses: next })
  }

  function handleContinueToHome() {
    navigate('/', { state: newSignup ? { welcome: true } : undefined })
  }

  async function handleLogout() {
    await logout()
    window.location.href = '/'
  }

  return (
    <section className="section-py bg-cream-dark min-h-[70vh]">
      <div className="container-app max-w-4xl">
        {newSignup && (
          <div className="mb-6 rounded-xl bg-brand-light border border-brand/20 px-5 py-4 flex items-start gap-3">
            <Sparkles size={20} className="text-brand shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-ink">
                Welcome to VSS Textiles{user?.displayName ? `, ${user.displayName.split(' ')[0]}` : ''}! 🎉
              </p>
              <p className="text-xs text-ink-soft mt-0.5">
                Add your delivery address now to make checkout faster later — or skip ahead and start shopping.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setNewSignup(false)}
              aria-label="Dismiss"
              className="text-ink-soft hover:text-ink shrink-0"
            >
              <X size={16} />
            </button>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-ink">My Profile</h1>
            <p className="text-sm text-ink-soft mt-1">{user?.email}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={handleContinueToHome} className="btn-primary px-5 py-2.5 text-sm">
              Continue Shopping
            </button>
            <button onClick={handleLogout} className="btn-outline px-4 py-2.5 text-sm flex items-center gap-2">
              <LogOut size={16} /> Log Out
            </button>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto mb-6 border-b border-thread">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                tab === id ? 'border-brand text-brand' : 'border-transparent text-ink-soft hover:text-ink'
              }`}
            >
              <Icon size={16} /> {label}
            </button>
          ))}
        </div>

        {tab === 'details' && (
          <DetailsTab
            user={user}
            profileDoc={profileDoc}
            profileLoading={profileLoading}
            updateDisplayName={updateDisplayName}
            onSavePhone={(phone) => updateDoc(doc(db, 'users', user.uid), { phone })}
          />
        )}

        {tab === 'addresses' && (
          <AddressesTab addresses={addresses} loading={profileLoading} onSave={saveAddresses} />
        )}

        {tab === 'orders' && <OrdersTab />}

        {tab === 'security' && <SecurityTab />}
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------
// Details tab
// ---------------------------------------------------------------------

function DetailsTab({ user, profileDoc, profileLoading, updateDisplayName, onSavePhone }) {
  const [editingName, setEditingName] = useState(false)
  const [name, setName] = useState(user?.displayName || '')
  const [editingPhone, setEditingPhone] = useState(false)
  const [phone, setPhone] = useState('')
  const [saving, setSaving] = useState(false)
  const [savedMsg, setSavedMsg] = useState('')

  useEffect(() => {
    if (profileDoc) setPhone(profileDoc.phone || '')
  }, [profileDoc])

  async function saveName() {
    if (!name.trim()) return
    setSaving(true)
    try {
      await updateDisplayName(name.trim())
      setEditingName(false)
      setSavedMsg('Name updated.')
    } catch (err) {
      console.error('Could not update name:', err)
    } finally {
      setSaving(false)
    }
  }

  async function savePhone() {
    setSaving(true)
    try {
      await onSavePhone(phone.trim())
      setEditingPhone(false)
      setSavedMsg('Phone number updated.')
    } catch (err) {
      console.error('Could not update phone:', err)
    } finally {
      setSaving(false)
    }
  }

  useEffect(() => {
    if (!savedMsg) return
    const t = setTimeout(() => setSavedMsg(''), 2500)
    return () => clearTimeout(t)
  }, [savedMsg])

  return (
    <div className="card-base p-6 space-y-6 max-w-xl">
      {savedMsg && (
        <p className="text-xs text-green-600 bg-green-50 border border-green-100 rounded-lg px-3 py-2 flex items-center gap-1.5">
          <Check size={14} /> {savedMsg}
        </p>
      )}

      <div>
        <label className="text-xs font-medium text-ink-soft">Full Name</label>
        {editingName ? (
          <div className="flex gap-2 mt-1">
            <input value={name} onChange={(e) => setName(e.target.value)} className={`${inputClass} mt-0`} />
            <button onClick={saveName} disabled={saving} className="btn-primary px-4 text-sm shrink-0">Save</button>
            <button onClick={() => { setEditingName(false); setName(user?.displayName || '') }} className="btn-outline px-4 text-sm shrink-0">Cancel</button>
          </div>
        ) : (
          <div className="flex items-center justify-between mt-1">
            <p className="text-sm text-ink">{user?.displayName || '—'}</p>
            <button onClick={() => setEditingName(true)} className="text-brand text-xs font-medium flex items-center gap-1 hover:underline">
              <Pencil size={13} /> Edit
            </button>
          </div>
        )}
      </div>

      <div>
        <label className="text-xs font-medium text-ink-soft">Email</label>
        <p className="text-sm text-ink mt-1">{user?.email}</p>
        <p className="text-xs text-ink-soft mt-0.5">This is your login email and can't be changed here.</p>
      </div>

      <div>
        <label className="text-xs font-medium text-ink-soft">Phone Number</label>
        {editingPhone ? (
          <div className="flex gap-2 mt-1">
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className={`${inputClass} mt-0`} placeholder="10-digit mobile number" />
            <button onClick={savePhone} disabled={saving} className="btn-primary px-4 text-sm shrink-0">Save</button>
            <button onClick={() => { setEditingPhone(false); setPhone(profileDoc?.phone || '') }} className="btn-outline px-4 text-sm shrink-0">Cancel</button>
          </div>
        ) : (
          <div className="flex items-center justify-between mt-1">
            <p className="text-sm text-ink">{profileLoading ? 'Loading…' : phone || '—'}</p>
            <button onClick={() => setEditingPhone(true)} className="text-brand text-xs font-medium flex items-center gap-1 hover:underline">
              <Pencil size={13} /> {phone ? 'Edit' : 'Add'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------
// Addresses tab
// ---------------------------------------------------------------------

function AddressesTab({ addresses, loading, onSave }) {
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(EMPTY_ADDRESS)
  const [saving, setSaving] = useState(false)

  function openNew() {
    setForm(EMPTY_ADDRESS)
    setEditingId(null)
    setFormOpen(true)
  }

  function openEdit(addr) {
    setForm(addr)
    setEditingId(addr.id)
    setFormOpen(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    try {
      let next
      if (editingId) {
        next = addresses.map((a) => (a.id === editingId ? { ...form, id: editingId } : a))
      } else {
        const isFirst = addresses.length === 0
        next = [...addresses, { ...form, id: makeId(), isDefault: isFirst || form.isDefault }]
      }
      // Only one default at a time.
      if (next.some((a) => a.isDefault)) {
        const defaultId = editingId && form.isDefault ? editingId : next.find((a) => a.isDefault)?.id
        next = next.map((a) => ({ ...a, isDefault: a.id === defaultId }))
      }
      await onSave(next)
      setFormOpen(false)
    } catch (err) {
      console.error('Could not save address:', err)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    const next = addresses.filter((a) => a.id !== id)
    if (next.length && !next.some((a) => a.isDefault)) next[0].isDefault = true
    await onSave(next)
  }

  async function handleSetDefault(id) {
    await onSave(addresses.map((a) => ({ ...a, isDefault: a.id === id })))
  }

  if (loading) {
    return <div className="card-base p-8 text-center text-sm text-ink-soft">Loading your addresses…</div>
  }

  return (
    <div className="space-y-4">
      {!formOpen && (
        <button onClick={openNew} className="btn-outline px-4 py-2.5 text-sm flex items-center gap-2">
          <Plus size={16} /> Add New Address
        </button>
      )}

      {formOpen && (
        <form onSubmit={handleSubmit} className="card-base p-6 space-y-4 max-w-xl">
          <p className="text-sm font-medium text-ink">{editingId ? 'Edit Address' : 'New Address'}</p>

          <div>
            <label className="text-xs font-medium text-ink-soft">Label</label>
            <div className="flex gap-2 mt-1">
              {['Home', 'Work', 'Other'].map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, label: l }))}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border ${
                    form.label === l ? 'bg-brand text-white border-brand' : 'border-thread text-ink-soft'
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-ink-soft">Full Name</label>
              <input required value={form.fullName} onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))} className={inputClass} />
            </div>
            <div>
              <label className="text-xs font-medium text-ink-soft">Phone</label>
              <input required value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} className={inputClass} />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-ink-soft">Address Line</label>
            <input required value={form.line1} onChange={(e) => setForm((f) => ({ ...f, line1: e.target.value }))} className={inputClass} placeholder="House no., street" />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-ink-soft">Area / Locality</label>
              <input value={form.area} onChange={(e) => setForm((f) => ({ ...f, area: e.target.value }))} className={inputClass} />
            </div>
            <div>
              <label className="text-xs font-medium text-ink-soft">Pincode</label>
              <input required value={form.pincode} onChange={(e) => setForm((f) => ({ ...f, pincode: e.target.value }))} className={inputClass} />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-ink-soft">City</label>
              <input required value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} className={inputClass} />
            </div>
            <div>
              <label className="text-xs font-medium text-ink-soft">State</label>
              <select value={form.state} onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))} className={inputClass}>
                {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <label className="flex items-center gap-2 text-xs text-ink-soft">
            <input type="checkbox" checked={Boolean(form.isDefault)} onChange={(e) => setForm((f) => ({ ...f, isDefault: e.target.checked }))} />
            Set as default address
          </label>

          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="btn-primary px-5 py-2.5 text-sm">
              {saving ? 'Saving…' : 'Save Address'}
            </button>
            <button type="button" onClick={() => setFormOpen(false)} className="btn-outline px-5 py-2.5 text-sm">Cancel</button>
          </div>
        </form>
      )}

      {!formOpen && addresses.length === 0 && (
        <div className="card-base p-8 text-center text-sm text-ink-soft">
          No saved addresses yet. Add one to speed up checkout.
        </div>
      )}

      {!formOpen && addresses.map((addr) => (
        <div key={addr.id} className="card-base p-5 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-brand-light text-brand">{addr.label}</span>
              {addr.isDefault && (
                <span className="text-xs font-medium text-ink-soft flex items-center gap-1"><Star size={12} className="fill-gold text-gold" /> Default</span>
              )}
            </div>
            <p className="text-sm font-medium text-ink mt-2">{addr.fullName} · {addr.phone}</p>
            <p className="text-sm text-ink-soft mt-0.5">
              {addr.line1}{addr.area ? `, ${addr.area}` : ''}, {addr.city}, {addr.state} - {addr.pincode}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            <div className="flex gap-3">
              <button onClick={() => openEdit(addr)} aria-label="Edit address" className="text-ink-soft hover:text-brand"><Pencil size={16} /></button>
              <button onClick={() => handleDelete(addr.id)} aria-label="Delete address" className="text-ink-soft hover:text-red-600"><Trash2 size={16} /></button>
            </div>
            {!addr.isDefault && (
              <button onClick={() => handleSetDefault(addr.id)} className="text-xs text-brand hover:underline">Set as default</button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------
// Orders tab
// ---------------------------------------------------------------------

function OrdersTab() {
  const { orders, isLoading } = useOrders()
  const [trackingOrder, setTrackingOrder] = useState(null)

  if (isLoading) {
    return <div className="card-base p-8 text-center text-sm text-ink-soft">Loading your orders…</div>
  }

  if (orders.length === 0) {
    return (
      <div className="card-base p-8 text-center">
        <p className="text-sm text-ink-soft mb-4">You haven't placed any orders yet.</p>
        <Link to="/shop" className="btn-primary px-5 py-2.5 text-sm inline-block">Start Shopping</Link>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {orders.map((order) => (
        <div
          key={order.id}
          className="card-base p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-brand/40 transition-colors"
        >
          <Link to={`/order-confirmation/${order.id}`} className="flex-1 min-w-0">
            <p className="text-sm font-medium text-ink">Order #{order.id}</p>
            <p className="text-xs text-ink-soft mt-1">
              Placed {new Date(order.placedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              {' · '}{order.items?.length || 0} item{order.items?.length === 1 ? '' : 's'}
            </p>
          </Link>
          <div className="flex items-center gap-4 shrink-0">
            <Link to={`/order-confirmation/${order.id}`} className="text-right">
              <p className="text-sm font-semibold text-ink">{formatPrice(order.totals?.total || 0)}</p>
              <span className="inline-block mt-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-green-50 text-green-700 capitalize">
                {order.status}
              </span>
            </Link>
            <button
              type="button"
              onClick={() => setTrackingOrder(order)}
              className="btn-outline px-4 py-2 text-xs flex items-center gap-1.5 whitespace-nowrap"
            >
              <Truck size={14} /> Track Order
            </button>
          </div>
        </div>
      ))}

      {trackingOrder && <TrackOrderModal order={trackingOrder} onClose={() => setTrackingOrder(null)} />}
    </div>
  )
}

// ---------------------------------------------------------------------
// Security tab
// ---------------------------------------------------------------------

function SecurityTab() {
  const { user, changePassword, sendPasswordReset, authError, setAuthError } = useAuth()

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [saving, setSaving] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [localError, setLocalError] = useState('')

  const [resetSending, setResetSending] = useState(false)
  const [resetSent, setResetSent] = useState(false)

  async function handleChangePassword(e) {
    e.preventDefault()
    setLocalError('')
    setAuthError('')
    setSuccessMsg('')

    if (newPassword.length < 8 || !/[A-Za-z]/.test(newPassword) || !/\d/.test(newPassword)) {
      return setLocalError('New password needs at least 8 characters with a letter and a number.')
    }
    if (newPassword !== confirmPassword) {
      return setLocalError('New passwords do not match.')
    }

    setSaving(true)
    try {
      await changePassword(currentPassword, newPassword)
      setSuccessMsg('Password updated.')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch {
      // AuthContext already set a user-facing authError.
    } finally {
      setSaving(false)
    }
  }

  async function handleSendReset() {
    setResetSending(true)
    setAuthError('')
    try {
      await sendPasswordReset(user.email)
      setResetSent(true)
    } catch {
      // authError set by AuthContext
    } finally {
      setResetSending(false)
    }
  }

  return (
    <div className="space-y-6 max-w-xl">
      <div className="card-base p-6">
        <p className="text-sm font-medium text-ink mb-1">Change Password</p>
        <p className="text-xs text-ink-soft mb-4">Confirm your current password to set a new one.</p>

        {(localError || authError) && (
          <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-4">
            {localError || authError}
          </p>
        )}
        {successMsg && (
          <p className="text-xs text-green-600 bg-green-50 border border-green-100 rounded-lg px-3 py-2 mb-4 flex items-center gap-1.5">
            <Check size={14} /> {successMsg}
          </p>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-ink-soft">Current Password</label>
            <input type={showPw ? 'text' : 'password'} required value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className={inputClass} autoComplete="current-password" />
          </div>
          <div>
            <label className="text-xs font-medium text-ink-soft">New Password</label>
            <div className="relative">
              <input type={showPw ? 'text' : 'password'} required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={`${inputClass} pr-12`} autoComplete="new-password" />
              <button type="button" onClick={() => setShowPw((v) => !v)} className="absolute right-3 top-1/2 translate-y-[-42%] p-1 text-ink-soft hover:text-brand" aria-label={showPw ? 'Hide password' : 'Show password'}>
                {showPw ? <EyeOff size={19} /> : <Eye size={19} />}
              </button>
            </div>
            <p className="text-xs text-ink-soft mt-1">At least 8 characters with a letter and a number.</p>
          </div>
          <div>
            <label className="text-xs font-medium text-ink-soft">Confirm New Password</label>
            <input type={showPw ? 'text' : 'password'} required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={inputClass} autoComplete="new-password" />
          </div>
          <button type="submit" disabled={saving} className="btn-primary px-5 py-2.5 text-sm disabled:opacity-50">
            {saving ? 'Updating…' : 'Update Password'}
          </button>
        </form>
      </div>

      <div className="card-base p-6">
        <p className="text-sm font-medium text-ink mb-1">Forgot Your Password?</p>
        <p className="text-xs text-ink-soft mb-4">
          We'll email a secure, one-time link to <span className="font-medium text-ink">{user?.email}</span> so you can set a new password — it's Firebase's supported way to verify it's really you by email, without needing a separate backend to text or email a typed-in code.
        </p>
        {resetSent ? (
          <p className="text-xs text-green-600 bg-green-50 border border-green-100 rounded-lg px-3 py-2 flex items-center gap-1.5">
            <Check size={14} /> Link sent — check your inbox (and spam folder).
          </p>
        ) : (
          <button onClick={handleSendReset} disabled={resetSending} className="btn-outline px-5 py-2.5 text-sm disabled:opacity-50">
            {resetSending ? 'Sending…' : 'Send Reset Link'}
          </button>
        )}
      </div>
    </div>
  )
}
