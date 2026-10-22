import { useState } from 'react'
import { Plus, Pencil, Trash2, X, Tag } from 'lucide-react'
import { usePromoCodes, savePromoCodes, isPromoActive, describePromo } from '../../utils/promoCodes.js'

const EMPTY = { code: '', type: 'percent', amount: '', minCartTotal: '', firstOrderOnly: false, staffOnly: false, expiresAt: '', active: true }

function statusOf(def) {
  if (def.active === false) return { label: 'Off', cls: 'bg-gray-200 text-gray-700' }
  if (!isPromoActive(def)) return { label: 'Expired', cls: 'bg-red-100 text-red-700' }
  return { label: 'Live', cls: 'bg-green-100 text-green-800' }
}

// Admin -> Coupons: create, edit, switch off or delete promo codes. Changes go
// live on the cart immediately.
export default function PromoCodesAdminTab({ onToast }) {
  const { codes, loaded } = usePromoCodes()
  const [form, setForm] = useState(null) // null = closed
  const [editingCode, setEditingCode] = useState(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const entries = Object.entries(codes)

  function openNew() {
    setForm({ ...EMPTY })
    setEditingCode(null)
    setError('')
  }

  function openEdit(code, def) {
    setForm({
      code,
      type: def.type,
      amount: def.type === 'percent' ? String(Math.round(def.value * 1000) / 10) : String(def.value),
      minCartTotal: def.minCartTotal ? String(def.minCartTotal) : '',
      firstOrderOnly: !!def.firstOrderOnly,
      staffOnly: !!def.staffOnly,
      expiresAt: def.expiresAt || '',
      active: def.active !== false,
    })
    setEditingCode(code)
    setError('')
  }

  async function persist(next, okMessage) {
    setSaving(true)
    try {
      await savePromoCodes(next)
      onToast?.(okMessage)
      return true
    } catch (e) {
      console.error(e)
      setError('Could not save. Make sure the latest firestore.rules are published.')
      onToast?.('Could not save promo codes')
      return false
    } finally {
      setSaving(false)
    }
  }

  async function handleSave(e) {
    e.preventDefault()
    const code = form.code.trim().toUpperCase()
    const amount = parseFloat(form.amount)
    if (!/^[A-Z0-9_-]{3,20}$/.test(code)) return setError('Code must be 3-20 letters or numbers (no spaces).')
    if (!Number.isFinite(amount) || amount <= 0) return setError('Enter a discount amount above 0.')
    if (form.type === 'percent' && amount > 90) return setError('A percentage discount can be at most 90%.')
    if (code !== editingCode && codes[code]) return setError('A code with this name already exists.')
    const def = {
      type: form.type,
      value: form.type === 'percent' ? amount / 100 : amount,
      minCartTotal: parseFloat(form.minCartTotal) || 0,
      firstOrderOnly: form.firstOrderOnly,
      staffOnly: form.staffOnly,
      active: form.active,
      expiresAt: form.expiresAt,
    }
    const next = { ...codes }
    if (editingCode && editingCode !== code) delete next[editingCode]
    next[code] = def
    if (await persist(next, editingCode ? 'Promo code updated' : 'Promo code added')) setForm(null)
  }

  async function toggle(code, def) {
    await persist({ ...codes, [code]: { ...def, active: def.active === false } }, def.active === false ? 'Code switched on' : 'Code switched off')
  }

  async function remove(code) {
    if (!window.confirm(`Delete the code ${code}? Customers will no longer be able to use it.`)) return
    const next = { ...codes }
    delete next[code]
    await persist(next, 'Promo code deleted')
  }

  const input = 'w-full border border-thread rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand'

  return (
    <div className="space-y-5">
      <div className="card-base p-5 sm:p-6 flex items-start gap-3 border border-brand/20 bg-brand-light/20">
        <div className="w-10 h-10 rounded-full bg-brand text-white flex items-center justify-center shrink-0"><Tag size={17} /></div>
        <div>
          <p className="text-sm font-semibold text-ink">Promo codes</p>
          <p className="text-xs text-ink-soft mt-0.5 max-w-2xl">
            Customers type these in the cart. Changes go live immediately. A code stops working when switched off or after its
            expiry date. Until you save your own list the default code (VSS10) is used.
          </p>
        </div>
      </div>

      <div className="card-base p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3 mb-4">
          <h3 className="font-semibold text-ink">{entries.length} code{entries.length === 1 ? '' : 's'}</h3>
          {!form && (
            <button type="button" onClick={openNew} className="btn-primary px-4 py-2 text-sm inline-flex items-center gap-2">
              <Plus size={15} /> Add code
            </button>
          )}
        </div>

        {form && (
          <form onSubmit={handleSave} className="border border-brand/30 rounded-xl p-4 mb-5 bg-white space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-ink">{editingCode ? `Edit ${editingCode}` : 'New promo code'}</p>
              <button type="button" onClick={() => setForm(null)} aria-label="Close" className="text-ink-soft hover:text-brand"><X size={16} /></button>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <label className="text-xs font-medium text-ink-soft">Code
                <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase().replace(/\s/g, '') })} placeholder="e.g. FESTIVE20" className={`${input} mt-1 font-mono uppercase`} maxLength={20} />
              </label>
              <label className="text-xs font-medium text-ink-soft">Discount type
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className={`${input} mt-1`}>
                  <option value="percent">Percentage (%)</option>
                  <option value="flat">Flat amount (₹)</option>
                </select>
              </label>
              <label className="text-xs font-medium text-ink-soft">{form.type === 'percent' ? 'Percent off' : 'Rupees off'}
                <input value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value.replace(/[^0-9.]/g, '') })} inputMode="decimal" placeholder={form.type === 'percent' ? '10' : '100'} className={`${input} mt-1`} />
              </label>
              <label className="text-xs font-medium text-ink-soft">Minimum cart total (₹, optional)
                <input value={form.minCartTotal} onChange={(e) => setForm({ ...form, minCartTotal: e.target.value.replace(/[^0-9]/g, '') })} inputMode="numeric" placeholder="e.g. 999" className={`${input} mt-1`} />
              </label>
              <label className="text-xs font-medium text-ink-soft">Last valid day (optional)
                <input type="date" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} className={`${input} mt-1`} />
              </label>
              <div className="flex flex-col gap-2 justify-end text-sm text-ink">
                <label className="inline-flex items-center gap-2">
                  <input type="checkbox" checked={form.firstOrderOnly} onChange={(e) => setForm({ ...form, firstOrderOnly: e.target.checked })} />
                  First order only
                </label>
                <label className="inline-flex items-center gap-2">
                  <input type="checkbox" checked={form.staffOnly} onChange={(e) => setForm({ ...form, staffOnly: e.target.checked })} />
                  Staff only <span className="text-[11px] text-ink-soft">(only people in Admin → Catalogue staff can use it)</span>
                </label>
                <label className="inline-flex items-center gap-2">
                  <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
                  Switched on
                </label>
              </div>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex gap-3">
              <button type="submit" disabled={saving} className="btn-primary px-5 py-2 text-sm disabled:opacity-60">{saving ? 'Saving…' : 'Save code'}</button>
              <button type="button" onClick={() => setForm(null)} className="btn-outline px-5 py-2 text-sm">Cancel</button>
            </div>
          </form>
        )}

        {!loaded ? (
          <p className="text-sm text-ink-soft">Loading…</p>
        ) : entries.length === 0 ? (
          <p className="text-sm text-ink-soft py-6 text-center">No codes yet. Add one above.</p>
        ) : (
          <ul className="space-y-2">
            {entries.map(([code, def]) => {
              const st = statusOf(def)
              return (
                <li key={code} className="flex flex-wrap items-center gap-3 border border-thread rounded-xl p-3 bg-white">
                  <span className="font-mono font-semibold text-ink text-sm bg-cream-dark px-2.5 py-1 rounded">{code}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${st.cls}`}>{st.label}</span>
                  {def.staffOnly && <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-brand-light text-brand">Staff only</span>}
                  <div className="flex-1 min-w-[180px] text-xs text-ink-soft">
                    <p className="text-sm text-ink">{describePromo(def)}</p>
                    <p>
                      {def.minCartTotal ? `Cart above ₹${def.minCartTotal}` : 'No minimum'}
                      {def.firstOrderOnly ? ' · First order only' : ''}
                      {def.expiresAt ? ` · Valid until ${def.expiresAt}` : ' · No expiry'}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button type="button" disabled={saving} onClick={() => toggle(code, def)} className="px-3 py-1.5 rounded-lg border border-thread text-xs font-medium text-ink-soft hover:border-brand hover:text-brand disabled:opacity-60">
                      {def.active === false ? 'Switch on' : 'Switch off'}
                    </button>
                    <button type="button" onClick={() => openEdit(code, def)} aria-label="Edit code" className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-soft hover:text-brand hover:bg-cream-dark"><Pencil size={15} /></button>
                    <button type="button" onClick={() => remove(code)} aria-label="Delete code" className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-soft hover:text-red-600 hover:bg-cream-dark"><Trash2 size={15} /></button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
