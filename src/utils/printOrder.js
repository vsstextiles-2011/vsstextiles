import { BUSINESS } from '../data/business.js'
// Print helpers for the Admin -> Orders tab.
//
//   printInvoice(order)   -> a bill / invoice for ONE order (A4)
//   printLabels(orders)   -> shipping address labels, 4 per A4 sheet
//                            (works for one order or many; cut them out and
//                            stick them on the parcel)
//
// Nothing is uploaded anywhere: the page is built in the browser, shown in
// the normal print dialog, and you can pick "Save as PDF" there if you want
// a file instead of paper.

const SHOP = {
  name: BUSINESS.name,
  addressLines: [...BUSINESS.addressLines, BUSINESS.pincode].filter(Boolean),
  phone: BUSINESS.phone,
  email: BUSINESS.email,
  gstin: BUSINESS.gstin,
}

const esc = (v) =>
  String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))

const money = (n) => `\u20B9${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(Number(n) || 0)}`

const fmtDate = (iso) => {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

const PAYMENT_NAME = { card: 'Card (paid)', upi: 'UPI (paid)', cod: 'Cash on Delivery' }

function addressLines(order) {
  const a = order.address || {}
  const l1 = [a.line1, a.area].filter(Boolean).join(', ')
  const l2 = [a.city, a.state].filter(Boolean).join(', ')
  return { name: a.fullName || '', l1, l2, pincode: a.pincode || '', phone: a.phone || '' }
}

// Prints through a hidden iframe so nothing gets blocked as a pop-up.
function printHtml(html) {
  const iframe = document.createElement('iframe')
  iframe.setAttribute('aria-hidden', 'true')
  iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;'
  document.body.appendChild(iframe)
  const doc = iframe.contentWindow.document
  doc.open()
  doc.write(html)
  doc.close()
  setTimeout(() => {
    try {
      iframe.contentWindow.focus()
      iframe.contentWindow.print()
    } finally {
      setTimeout(() => iframe.remove(), 60000)
    }
  }, 300)
}

// ---------------------------------------------------------------- invoice
function invoiceBody(order) {
  const t = order.totals || {}
  const bulk = t.bigOrderDiscount || 0
  const promo = Math.max(0, (t.discount || 0) - bulk)
  const a = addressLines(order)
  const rows = (order.items || [])
    .map((it, i) => {
      const detail = [it.size && `Size ${it.size}`, it.color].filter(Boolean).join(' \u00B7 ')
      return `<tr>
        <td class="c">${i + 1}</td>
        <td>${esc(it.name)}${detail ? `<div class="sub">${esc(detail)}</div>` : ''}</td>
        <td class="r">${esc(it.qty)}</td>
        <td class="r">${money(it.price)}</td>
        <td class="r">${money((it.price || 0) * (it.qty || 0))}</td>
      </tr>`
    })
    .join('')

  const line = (label, value, cls = '') => `<tr class="${cls}"><td>${label}</td><td class="r">${value}</td></tr>`
  const totals = [
    t.subtotal != null ? line('Subtotal', money(t.subtotal)) : '',
    promo > 0 ? line(`Offer${t.promoCode ? ` (${esc(t.promoCode)})` : ''}`, `\u2212${money(promo)}`) : '',
    bulk > 0 ? line('Bulk order offer', `\u2212${money(bulk)}`) : '',
    t.shipping != null ? line('Shipping', t.shipping > 0 ? money(t.shipping) : 'Free') : '',
    line('Total', money(t.total), 'grand'),
  ].join('')

  return `<section class="inv">
  <div class="top">
    <div class="shop">
      <h1>${esc(SHOP.name)}</h1>
      ${SHOP.addressLines.map((l) => `<p>${esc(l)}</p>`).join('')}
      <p>Phone: ${esc(SHOP.phone)} &nbsp;|&nbsp; ${esc(SHOP.email)}</p>
      ${SHOP.gstin ? `<p>GSTIN: ${esc(SHOP.gstin)}</p>` : ''}
    </div>
    <div class="doc">
      <h2>INVOICE</h2>
      <p><b>Order #:</b> ${esc(order.id)}</p>
      <p><b>Date:</b> ${esc(fmtDate(order.placedAt))}</p>
      <p><b>Payment:</b> ${esc(PAYMENT_NAME[order.payment?.method] || 'Cash on Delivery')}</p>
    </div>
  </div>

  <div class="cols">
    <div>
      <h3>Bill to / Ship to</h3>
      <p><b>${esc(a.name)}</b></p>
      <p>${esc(a.l1)}</p>
      <p>${esc(a.l2)}${a.pincode ? ` - ${esc(a.pincode)}` : ''}</p>
      <p>Phone: ${esc(a.phone)}</p>
    </div>
  </div>

  <table class="items">
    <thead><tr><th class="c">#</th><th>Item</th><th class="r">Qty</th><th class="r">Rate</th><th class="r">Amount</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>

  <table class="sum"><tbody>${totals}</tbody></table>

  <p class="foot">Thank you for shopping with ${esc(SHOP.name)}. This is a computer-generated invoice.</p>
</section>`
}

const INVOICE_STYLE = `<style>
  @page { size: A4; margin: 14mm; }
  * { box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; color: #111; font-size: 12px; margin: 0; }
  .top { display: flex; justify-content: space-between; gap: 20px; border-bottom: 2px solid #111; padding-bottom: 10px; }
  .shop h1 { margin: 0 0 4px; font-size: 22px; }
  .shop p { margin: 1px 0; color: #333; }
  .doc { text-align: right; }
  .doc h2 { margin: 0 0 6px; font-size: 18px; letter-spacing: 2px; }
  .doc p { margin: 2px 0; }
  .cols { display: flex; gap: 30px; margin: 14px 0; }
  .cols > div { flex: 1; }
  .cols h3 { margin: 0 0 4px; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #555; }
  .cols p { margin: 1px 0; }
  table.items { width: 100%; border-collapse: collapse; margin-top: 6px; }
  table.items th { text-align: left; background: #f1f1f1; padding: 7px 8px; border-bottom: 1px solid #999; font-size: 11px; text-transform: uppercase; }
  table.items td { padding: 7px 8px; border-bottom: 1px solid #ddd; vertical-align: top; }
  .r { text-align: right; } .c { text-align: center; width: 28px; }
  .sub { color: #666; font-size: 11px; margin-top: 2px; }
  .sum { width: 55%; margin: 12px 0 0 auto; border-collapse: collapse; }
  .sum td { padding: 5px 8px; }
  .sum tr.grand td { border-top: 2px solid #111; font-weight: bold; font-size: 14px; padding-top: 8px; }
  .foot { margin-top: 36px; text-align: center; color: #555; font-size: 11px; }
  tr { page-break-inside: avoid; }
  .inv { page-break-after: always; break-after: page; }
  .inv:last-child { page-break-after: auto; break-after: auto; }
</style>`

export function printInvoices(orders) {
  const list = (Array.isArray(orders) ? orders : [orders]).filter(Boolean)
  if (!list.length) return
  const title = list.length === 1 ? `Invoice ${esc(list[0].id)}` : `Invoices (${list.length})`
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${title}</title>
${INVOICE_STYLE}</head><body>${list.map(invoiceBody).join('')}</body></html>`
  printHtml(html)
}

export function printInvoice(order) {
  if (!order) return
  printInvoices([order])
}

// ----------------------------------------------------------------- labels
export function printLabels(orders) {
  const list = (Array.isArray(orders) ? orders : [orders]).filter(Boolean)
  if (!list.length) return

  const labels = list
    .map((order) => {
      const a = addressLines(order)
      const cod = (order.payment?.method || 'cod') === 'cod'
      const itemCount = (order.items || []).reduce((n, it) => n + (Number(it.qty) || 0), 0)
      return `<div class="label">
        <div class="to">TO</div>
        <div class="name">${esc(a.name)}</div>
        <div class="addr">${esc(a.l1)}</div>
        <div class="addr">${esc(a.l2)}</div>
        <div class="pin">PIN: ${esc(a.pincode)}</div>
        <div class="phone">Phone: ${esc(a.phone)}</div>
        ${cod ? `<div class="cod">COD &ndash; collect ${money(order.totals?.total)}</div>` : '<div class="prepaid">PREPAID</div>'}
        <div class="meta"><span>Order ${esc(order.id)} &middot; ${itemCount} pc${itemCount === 1 ? '' : 's'}</span></div>
        <div class="from"><b>From:</b> ${esc(SHOP.name)}, ${esc(SHOP.addressLines.join(', '))} &middot; ${esc(SHOP.phone)}</div>
      </div>`
    })
    .join('')

  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Address labels</title>
<style>
  @page { size: A4; margin: 8mm; }
  * { box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; color: #000; margin: 0; }
  .sheet { display: grid; grid-template-columns: 1fr 1fr; gap: 5mm; }
  .label { border: 1.5px dashed #444; padding: 5mm; height: 90mm; overflow: hidden; page-break-inside: avoid; break-inside: avoid; display: flex; flex-direction: column; }
  .to { font-size: 11px; letter-spacing: 2px; color: #555; }
  .name { font-size: 20px; font-weight: bold; margin: 2px 0 4px; }
  .addr { font-size: 15px; line-height: 1.3; }
  .pin { font-size: 18px; font-weight: bold; margin-top: 4px; letter-spacing: 1px; }
  .phone { font-size: 15px; margin-top: 2px; }
  .cod, .prepaid { margin-top: 8px; padding: 4px 8px; border: 2px solid #000; font-weight: bold; font-size: 14px; width: fit-content; }
  .meta { font-size: 11px; color: #333; margin-top: auto; padding-top: 6px; }
  .from { font-size: 10px; color: #333; border-top: 1px solid #999; padding-top: 4px; margin-top: 4px; }
</style></head><body><div class="sheet">${labels}</div></body></html>`
  printHtml(html)
}