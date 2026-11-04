import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowDown, ArrowUp, BookOpen, ExternalLink, FileText, Loader2, Plus, Save, Trash2, Upload } from 'lucide-react'
import { useProducts } from '../../context/ProductContext.jsx'
import { aboutProductTypes } from '../../utils/aboutTypes.js'
import {
  useCatalogueSettings,
  saveCatalogueSettings,
  describeCatalogueChange,
  newCatalogueItem,
  uploadCataloguePdf,
  uploadCatalogueCover,
  formatUpdated,
  useCatalogueStaff,
  addCatalogueStaff,
  removeCatalogueStaff,
  staffKey,
  staffPhone,
} from '../../utils/catalogue.js'
import { phoneError } from '../../utils/phone.js'
import { mongoEnabled, saveStaffToMongo, removeStaffFromMongo } from '../../utils/mongoSync.js'
import { logActivity } from '../../utils/activityLog.js'

const inputClass = 'w-full mt-1 rounded-lg border border-thread px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand'
const UPLOAD_HELP = 'Upload only works while "npm run dev" is running on this computer. You can also paste a link to the PDF instead.'

function fileLabel(pdf) {
  if (!pdf) return 'No PDF yet'
  try {
    const last = decodeURIComponent(pdf.split('?')[0].split('/').filter(Boolean).pop() || pdf)
    return /^https?:/i.test(pdf) && !/\.pdf$/i.test(last) ? 'PDF link' : last
  } catch {
    return pdf
  }
}

// Admin -> Catalogue -> who may open the catalogue page. Only these people (plus
// admins) can see it; they must sign in with this email and have the same mobile
// number saved in their profile.
function StaffAccessCard() {
  const { staff, error: listError } = useCatalogueStaff()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [note, setNote] = useState('')

  async function resync() {
    setNote('')
    let ok = 0
    for (const s of staff) if (await saveStaffToMongo(s)) ok += 1
    setNote(`Re-synced ${ok} of ${staff.length} to MongoDB.`)
  }

  async function add(e) {
    e.preventDefault()
    setError('')
    setNote('')
    const em = staffKey(email)
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) return setError('Enter a valid email address.')
    const ph = staffPhone(phone)
    const pe = phoneError(ph)
    if (pe) return setError(pe)
    setBusy(true)
    try {
      await addCatalogueStaff({ name, email: em, phone: ph })
      // Also flag them as staff in MongoDB (only when the MongoDB backend is on).
      if (mongoEnabled) {
        const ok = await saveStaffToMongo({ email: em, name, phone: ph })
        setNote(ok ? 'Saved in Firebase and MongoDB.' : 'Saved in Firebase. MongoDB could not be reached - it will keep retrying; use "Re-sync to MongoDB" later if needed.')
      }
      logActivity({ action: 'catalogue_change', targetType: 'catalogue', targetId: em, targetName: name || em, summary: `Catalogue: gave ${name || em} access` })
      setName(''); setEmail(''); setPhone('')
    } catch (err) {
      setError(err?.code === 'permission-denied' ? 'Publish the updated firestore.rules in Firebase Console first.' : err?.message || 'Could not add this person.')
    } finally {
      setBusy(false)
    }
  }

  async function remove(s) {
    if (!window.confirm(`Remove catalogue access for ${s.name || s.email}?`)) return
    try {
      await removeCatalogueStaff(s.email)
      if (mongoEnabled) await removeStaffFromMongo(s.email)
      logActivity({ action: 'catalogue_change', targetType: 'catalogue', targetId: s.email, targetName: s.name || s.email, summary: `Catalogue: removed access of ${s.name || s.email}` })
    } catch (err) {
      setError(err?.message || 'Could not remove.')
    }
  }

  return (
    <div className="card-base p-5 sm:p-6">
      <h3 className="text-sm font-semibold text-ink mb-1">Who can see the catalogue</h3>
      <p className="text-xs text-ink-soft mb-4">
        Only the people listed here (and admins) can open the Catalogue page. They must sign in with this email and have the same
        mobile number saved in My Profile. Everyone else sees "Staff only".
      </p>
      {listError && <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg p-3 mb-3">{listError}</p>}
      {staff.length === 0 ? (
        <p className="text-sm text-ink-soft mb-4">No staff added yet - only admins can see the catalogue.</p>
      ) : (
        <ul className="divide-y divide-thread border border-thread rounded-xl mb-4">
          {staff.map((s) => (
            <li key={s.id} className="flex items-center gap-3 p-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-ink truncate">{s.name || 'Staff member'} <span className="ml-1 align-middle text-[10px] font-mono uppercase bg-brand-light text-brand px-1.5 py-0.5 rounded">Staff</span></p>
                <p className="text-xs text-ink-soft truncate">{s.email} · {s.phone || 'no phone'}</p>
                <p className="text-[11px] text-ink-soft/80">{s.uid ? 'Staff account signed in' : 'Not signed in yet'}</p>
              </div>
              <button type="button" onClick={() => remove(s)} className="text-ink-soft hover:text-red-600" aria-label={`Remove ${s.email}`}><Trash2 size={16} /></button>
            </li>
          ))}
        </ul>
      )}
      <form onSubmit={add} className="grid sm:grid-cols-[1fr_1.3fr_1fr_auto] gap-2 items-end">
        <label className="block"><span className="text-xs font-medium text-ink-soft">Name</span>
          <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} maxLength={80} placeholder="e.g. Ravi" /></label>
        <label className="block"><span className="text-xs font-medium text-ink-soft">Email</span>
          <input className={inputClass} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="staff@example.com" /></label>
        <label className="block"><span className="text-xs font-medium text-ink-soft">Mobile number</span>
          <input className={inputClass} value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} inputMode="numeric" placeholder="10 digits" /></label>
        <button type="submit" disabled={busy} className="btn-primary px-4 py-2 text-sm disabled:opacity-60 inline-flex items-center justify-center gap-1.5"><Plus size={15} /> Add</button>
      </form>
      {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
      {note && <p className="text-xs text-green-700 mt-2">{note}</p>}
      {mongoEnabled && staff.length > 0 && (
        <button type="button" onClick={resync} className="text-xs text-brand underline mt-2">Re-sync staff to MongoDB</button>
      )}
    </div>
  )
}

function ItemCard({ item, index, count, typeOptions, onChange, onMove, onRemove }) {
  const pdfRef = useRef(null)
  const coverRef = useRef(null)
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')

  async function pickPdf(file) {
    if (!file) return
    setError('')
    setBusy('pdf')
    try {
      const { path } = await uploadCataloguePdf(file)
      onChange({ pdf: path, updatedAt: new Date().toISOString(), title: item.title || file.name.replace(/\.pdf$/i, '') })
    } catch (err) {
      setError(`${err.message === 'Upload failed' ? 'Could not save the PDF.' : err.message} ${UPLOAD_HELP}`)
    } finally {
      setBusy('')
      if (pdfRef.current) pdfRef.current.value = ''
    }
  }

  async function pickCover(file) {
    if (!file) return
    setError('')
    setBusy('cover')
    try {
      onChange({ cover: await uploadCatalogueCover(file) })
    } catch (err) {
      setError(`${err.message === 'Upload failed' ? 'Could not save the photo.' : err.message} ${UPLOAD_HELP}`)
    } finally {
      setBusy('')
      if (coverRef.current) coverRef.current.value = ''
    }
  }

  const typeImage = typeOptions.find((t) => t.label === item.productType)?.image
  const cover = item.cover || typeImage

  return (
    <div className={`card-base p-4 sm:p-5 border ${item.active ? 'border-thread' : 'border-dashed border-gray-300 bg-gray-50'}`}>
      <div className="flex gap-4">
        <button
          type="button"
          onClick={() => coverRef.current?.click()}
          title="Click to change the cover photo"
          className="relative w-20 sm:w-24 aspect-[4/5] rounded-lg overflow-hidden bg-cream-dark border border-thread shrink-0 group"
        >
          {cover ? <img src={cover} alt="" className="w-full h-full object-cover object-top" /> : <FileText size={26} className="m-auto text-brand/40 absolute inset-0" />}
          <span className="absolute inset-0 bg-black/45 text-white text-[11px] font-medium flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            {busy === 'cover' ? <Loader2 size={16} className="animate-spin" /> : 'Change photo'}
          </span>
          <input ref={coverRef} type="file" accept="image/*" className="hidden" onChange={(e) => pickCover(e.target.files?.[0])} />
        </button>

        <div className="flex-1 min-w-0">
          <div className="grid sm:grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs font-medium text-ink-soft">Product name</span>
              <input className={inputClass} value={item.title} onChange={(e) => onChange({ title: e.target.value })} placeholder="e.g. Side Open Top" maxLength={80} />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-ink-soft">Short details (optional)</span>
              <input className={inputClass} value={item.subtitle} onChange={(e) => onChange({ subtitle: e.target.value })} placeholder="e.g. Rayon | XS - 5XL | 20 colours" maxLength={140} />
            </label>
          </div>

          <div className="mt-3 rounded-lg bg-cream-dark border border-thread p-3">
            <div className="flex flex-wrap items-center gap-3">
              <FileText size={18} className={item.pdf ? 'text-brand' : 'text-gray-400'} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-ink truncate">{fileLabel(item.pdf)}</p>
                {item.updatedAt && <p className="text-[11px] text-ink-soft">Updated {formatUpdated(item.updatedAt)}</p>}
              </div>
              {item.pdf && (
                <a href={item.pdf} target="_blank" rel="noopener noreferrer" className="text-xs text-brand hover:underline inline-flex items-center gap-1">
                  <ExternalLink size={12} /> Open
                </a>
              )}
              <button
                type="button"
                onClick={() => pdfRef.current?.click()}
                disabled={busy === 'pdf'}
                className="btn-primary px-4 py-2 text-xs inline-flex items-center gap-1.5 disabled:opacity-60"
              >
                {busy === 'pdf' ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
                {item.pdf ? 'Replace PDF' : 'Upload PDF'}
              </button>
              <input ref={pdfRef} type="file" accept="application/pdf,.pdf" className="hidden" onChange={(e) => pickPdf(e.target.files?.[0])} />
            </div>
            <input
              className={`${inputClass} text-xs`}
              value={item.pdf}
              onChange={(e) => onChange({ pdf: e.target.value, updatedAt: new Date().toISOString() })}
              placeholder="...or paste a link to the PDF (https://...)"
            />
          </div>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-3">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={item.active} onChange={(e) => onChange({ active: e.target.checked })} className="w-4 h-4 accent-brand" />
              Show on the website
            </label>
            <label className="flex items-center gap-2 text-xs text-ink-soft">
              Photo from product type
              <select className="border border-thread rounded-md px-2 py-1 text-xs bg-white text-ink" value={item.productType} onChange={(e) => onChange({ productType: e.target.value })}>
                <option value="">(use uploaded photo)</option>
                {typeOptions.map((t) => (
                  <option key={t.label} value={t.label}>{t.label}</option>
                ))}
              </select>
            </label>
            <div className="ml-auto flex items-center gap-1">
              <button type="button" onClick={() => onMove(-1)} disabled={index === 0} title="Move up" className="p-2 rounded-md hover:bg-gray-100 disabled:opacity-30"><ArrowUp size={15} /></button>
              <button type="button" onClick={() => onMove(1)} disabled={index === count - 1} title="Move down" className="p-2 rounded-md hover:bg-gray-100 disabled:opacity-30"><ArrowDown size={15} /></button>
              <button type="button" onClick={onRemove} title="Remove this catalogue" className="p-2 rounded-md text-red-600 hover:bg-red-50"><Trash2 size={15} /></button>
            </div>
          </div>
          {error && <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg p-2.5 mt-3">{error}</p>}
        </div>
      </div>
    </div>
  )
}

// Admin -> Catalogue: one ready-made PDF per product. Upload a new PDF to replace
// the old one - the website and the marketing team's downloads update on Save.
export default function CatalogueAdminTab({ onToast }) {
  const { products } = useProducts()
  const { settings: saved, loaded } = useCatalogueSettings()
  const [form, setForm] = useState(saved)
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)

  // Follow the saved value until the admin starts editing.
  useEffect(() => {
    if (loaded && !dirty) setForm(saved)
  }, [saved, loaded, dirty])

  const typeOptions = useMemo(() => aboutProductTypes(products.filter((p) => p.isVisible !== false)).sort((a, b) => a.label.localeCompare(b.label)), [products])

  const set = (patch) => {
    setForm((f) => ({ ...f, ...patch }))
    setDirty(true)
  }
  const setItem = (id, patch) => set({ items: form.items.map((i) => (i.id === id ? { ...i, ...patch } : i)) })
  const move = (index, dir) => {
    const items = [...form.items]
    const j = index + dir
    if (j < 0 || j >= items.length) return
    ;[items[index], items[j]] = [items[j], items[index]]
    set({ items })
  }
  const remove = (item) => {
    if (!window.confirm(`Remove the "${item.title || 'Untitled'}" catalogue from the website? The PDF file itself is not deleted.`)) return
    set({ items: form.items.filter((i) => i.id !== item.id) })
  }

  const incomplete = form.items.some((i) => !i.title.trim() || !i.pdf.trim())
  const badLink = form.items.some((i) => i.pdf && !i.pdf.startsWith('/') && !/^https?:\/\//i.test(i.pdf.trim()))

  async function save() {
    setSaving(true)
    try {
      await saveCatalogueSettings(form)
      logActivity({ action: 'catalogue_change', targetType: 'catalogue', summary: describeCatalogueChange(saved, form) })
      setDirty(false)
      onToast?.('Catalogue saved')
    } catch (err) {
      console.error(err)
      onToast?.('Could not save - check your connection and admin access')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="card-base p-5 sm:p-6 flex items-start gap-3 border border-brand/20 bg-brand-light/20">
        <div className="w-10 h-10 rounded-full bg-brand text-white flex items-center justify-center shrink-0"><BookOpen size={17} /></div>
        <div>
          <p className="text-sm font-semibold text-ink">Product catalogues</p>
          <p className="text-xs text-ink-soft mt-0.5 max-w-2xl">
            Add one PDF per product (for example Side Open Top, with a page for each colour). To update a catalogue, press <strong>Replace PDF</strong> on
            that product and then <strong>Save</strong>. Your team and customers get it from the <span className="font-mono">Catalogue</span> link
            in the footer and My Account (<span className="font-mono">/catalogue</span>).
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {form.items.length === 0 && (
          <p className="text-sm text-ink-soft text-center py-8 card-base">No catalogues yet. Press "Add catalogue" to upload the first PDF.</p>
        )}
        {form.items.map((item, index) => (
          <ItemCard
            key={item.id}
            item={item}
            index={index}
            count={form.items.length}
            typeOptions={typeOptions}
            onChange={(patch) => setItem(item.id, patch)}
            onMove={(dir) => move(index, dir)}
            onRemove={() => remove(item)}
          />
        ))}
        <button
          type="button"
          onClick={() => set({ items: [...form.items, newCatalogueItem()] })}
          className="w-full border-2 border-dashed border-thread rounded-xl py-4 text-sm font-medium text-brand hover:border-brand hover:bg-brand-light/30 transition-colors inline-flex items-center justify-center gap-2"
        >
          <Plus size={16} /> Add catalogue
        </button>
      </div>

      <StaffAccessCard />

      <div className="card-base p-5 sm:p-6">
        <h3 className="text-sm font-semibold text-ink mb-2">Page settings</h3>
        <label className="flex items-start gap-3 cursor-pointer py-2">
          <input type="checkbox" checked={form.enabled} onChange={(e) => set({ enabled: e.target.checked })} className="mt-1 w-4 h-4 accent-brand" />
          <span>
            <span className="text-sm font-medium text-ink block">Show the catalogue page</span>
            <span className="text-xs text-ink-soft block mt-0.5">Off hides the footer and My Profile links and the page says it is unavailable. Even when on, only admins and the staff listed above can open it.</span>
          </span>
        </label>
        <label className="block mt-3">
          <span className="text-xs font-medium text-ink-soft">Page title</span>
          <input className={inputClass} value={form.title} onChange={(e) => set({ title: e.target.value })} maxLength={90} />
        </label>
        <label className="block mt-3">
          <span className="text-xs font-medium text-ink-soft">Short introduction</span>
          <textarea className={inputClass} rows={2} value={form.intro} onChange={(e) => set({ intro: e.target.value })} maxLength={300} />
        </label>
      </div>

      {(incomplete || badLink) && dirty && (
        <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
          {badLink ? 'A PDF link must start with https:// (or be an uploaded file).' : 'Every catalogue needs a product name and a PDF before you can save.'}
        </p>
      )}

      <div className="sticky bottom-3 flex gap-3">
        <button
          type="button"
          onClick={save}
          disabled={saving || !dirty || incomplete || badLink}
          className="btn-primary px-6 py-2.5 text-sm inline-flex items-center gap-2 disabled:opacity-50 shadow-lg"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} {dirty ? 'Save changes' : 'Saved'}
        </button>
      </div>
    </div>
  )
}
