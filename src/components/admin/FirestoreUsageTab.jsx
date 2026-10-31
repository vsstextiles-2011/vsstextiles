import { Activity, RotateCcw } from 'lucide-react'
import { setInteractionLogging, useInteractionLogStatus } from '../../utils/interactionLog.js'
import { DAILY_LIMITS, resetUsage, useFirestoreUsage } from '../../utils/firestoreUsage.js'

const KINDS = [
  { id: 'read', label: 'Reads', bar: 'bg-blue-500' },
  { id: 'write', label: 'Writes', bar: 'bg-amber-500' },
  { id: 'delete', label: 'Deletes', bar: 'bg-red-500' },
]

export default function FirestoreUsageTab() {
  const { day, session, log } = useFirestoreUsage()
  const il = useInteractionLogStatus()
  const rows = Object.entries(day.byCollection).sort((a, b) => b[1].read + b[1].write + b[1].delete - (a[1].read + a[1].write + a[1].delete))
  return (
    <div className="space-y-5">
      <div className="card-base p-5">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-brand-light text-brand flex items-center justify-center"><Activity size={18} /></div>
            <div>
              <h3 className="font-semibold text-ink">Firestore usage — live</h3>
              <p className="text-xs text-ink-soft">Every read, write and delete made from this browser, counted the moment it happens.</p>
            </div>
          </div>
          <button type="button" onClick={resetUsage} className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-thread text-ink-soft hover:bg-gray-50">
            <RotateCcw size={12} /> Reset counters
          </button>
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          {KINDS.map((k) => {
            const pct = Math.min(100, (day[k.id] / DAILY_LIMITS[k.id]) * 100)
            return (
              <div key={k.id} className="rounded-xl border border-thread p-4">
                <p className="text-xs font-medium text-ink-soft">{k.label} today</p>
                <p className="text-3xl font-semibold text-ink mt-1">{day[k.id].toLocaleString('en-IN')}</p>
                <div className="h-1.5 rounded-full bg-gray-100 mt-3 overflow-hidden">
                  <div className={`h-full ${k.bar}`} style={{ width: `${Math.max(pct, day[k.id] ? 2 : 0)}%` }} />
                </div>
                <p className="text-[11px] text-ink-soft mt-1.5">
                  {pct.toFixed(1)}% of the free {DAILY_LIMITS[k.id].toLocaleString('en-IN')}/day · this session: {session[k.id].toLocaleString('en-IN')}
                </p>
              </div>
            )
          })}
        </div>
        <p className="text-[11px] text-ink-soft/80 mt-3">
          Free (not billed): {day.free.toLocaleString('en-IN')} document reads served from the device cache or from your own unsaved changes today. Counts only this browser (other visitors count on their own devices) and skips free cache hits. The Firebase console shows the account-wide total, a few minutes later.
        </p>
      </div>

      <div className="card-base p-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 className="font-semibold text-ink text-sm">Click &amp; key log (admin only)</h3>
            <p className="text-xs text-ink-soft mt-0.5 max-w-xl">
              When on, every click and key press you make while signed in as admin is saved as its own entry in Firestore
              ("interactionLog"). Letters and numbers you type are never saved — only "character", or the name of keys like Enter or Tab.
              Customers are never recorded.
            </p>
          </div>
          <label className="inline-flex items-center gap-2 text-sm font-medium text-ink cursor-pointer">
            <input type="checkbox" checked={il.enabled} onChange={(e) => setInteractionLogging({ enabled: e.target.checked })} />
            {il.enabled ? 'Recording' : 'Off'}
          </label>
        </div>
        <div className="flex items-center gap-4 flex-wrap mt-3 text-xs text-ink-soft">
          <span>Saved today: <b className="text-ink">{il.sent.toLocaleString('en-IN')}</b> / {il.cap.toLocaleString('en-IN')}</span>
          <span>Waiting to send: <b className="text-ink">{il.queued}</b></span>
          <label className="inline-flex items-center gap-1.5">
            Daily cap
            <input
              type="number" min="100" step="100" value={il.cap}
              onChange={(e) => setInteractionLogging({ cap: Math.max(100, Number(e.target.value) || 2000) })}
              className="input-base !py-1 !px-2 w-24"
            />
          </label>
        </div>
        {il.error && <p className="text-xs text-red-600 mt-2">{il.error}</p>}
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <div className="card-base p-5">
          <h4 className="font-semibold text-ink mb-3 text-sm">By collection (today)</h4>
          {rows.length === 0 ? <p className="text-sm text-ink-soft">Nothing yet.</p> : (
            <table className="w-full text-sm">
              <thead><tr className="text-left text-xs text-ink-soft"><th className="pb-2">Collection</th><th className="pb-2 text-right">Reads</th><th className="pb-2 text-right">Writes</th><th className="pb-2 text-right">Deletes</th></tr></thead>
              <tbody>
                {rows.map(([name, c]) => (
                  <tr key={name} className="border-t border-thread/60">
                    <td className="py-1.5 text-ink break-all">{name}</td>
                    <td className="py-1.5 text-right">{c.read}</td>
                    <td className="py-1.5 text-right">{c.write}</td>
                    <td className="py-1.5 text-right">{c.delete}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div className="card-base p-5">
          <h4 className="font-semibold text-ink mb-3 text-sm">Latest operations</h4>
          {log.length === 0 ? <p className="text-sm text-ink-soft">Nothing yet this session.</p> : (
            <ul className="text-sm divide-y divide-thread/60 max-h-80 overflow-y-auto">
              {log.map((e, i) => (
                <li key={i} className="py-1.5 flex items-center gap-2">
                  <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${e.kind === 'read' ? 'bg-blue-50 text-blue-700' : e.kind === 'write' ? 'bg-amber-50 text-amber-700' : e.kind === 'free' ? 'bg-gray-100 text-gray-500' : 'bg-red-50 text-red-600'}`}>{e.kind === 'free' ? 'cache (free)' : e.kind}{e.n > 1 ? ` ×${e.n}` : ''}</span>
                  <span className="text-ink break-all flex-1">{e.collection}</span>
                  <span className="text-xs text-ink-soft">{new Date(e.t).toLocaleTimeString('en-IN')}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
