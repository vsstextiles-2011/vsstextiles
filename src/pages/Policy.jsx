import { Link } from 'react-router-dom'
import { BUSINESS as B, POLICY_UPDATED } from '../data/business.js'

const addr = [...B.addressLines, B.pincode].filter(Boolean).join(', ')
const Mail = () => <a href={`mailto:${B.email}`} className="text-brand hover:underline">{B.email}</a>

export const POLICIES = {
  privacy: {
    title: 'Privacy Policy',
    body: () => (
      <>
        <p>{B.name} ("we", "us") operates {B.domain}. This policy explains what personal information we collect when you use the site and how we use it.</p>
        <h2>Information we collect</h2>
        <ul>
          <li>Account details: name, email address and password (handled by Firebase Authentication; we never see your password).</li>
          <li>Order details: delivery name, phone number, address, pincode and the items you order.</li>
          <li>Messages you send us through the Contact page.</li>
          <li>Basic usage data such as which product pages are viewed, to understand what customers like.</li>
        </ul>
        <h2>Payments</h2>
        <p>Online payments are processed by our payment gateway partner on their secure page. We do not collect or store your card number, CVV, UPI PIN or net-banking credentials. We only receive confirmation of whether a payment succeeded, along with a payment reference.</p>
        <h2>How we use your information</h2>
        <ul>
          <li>To process, deliver and track your orders, and handle returns and refunds.</li>
          <li>To contact you about your order or reply to your enquiries.</li>
          <li>To keep the site secure and prevent fraud.</li>
        </ul>
        <h2>Sharing</h2>
        <p>We share information only with the services needed to run your order: our payment gateway, courier/delivery partners, and our hosting and database providers (Google Firebase and MongoDB). We do not sell your personal information.</p>
        <h2>Cookies and local storage</h2>
        <p>We use browser storage to keep your cart, wishlist and sign-in session working. You can clear it any time from your browser settings.</p>
        <h2>Your choices</h2>
        <p>You can view your orders in My Account. To correct or delete your personal data, email us at <Mail /> and we will respond within a reasonable time, subject to records we must keep by law (such as invoices).</p>
        <h2>Contact</h2>
        <p>{B.legalName}, {addr}. Email: <Mail />. Phone: {B.phone}.</p>
      </>
    ),
  },
  terms: {
    title: 'Terms & Conditions',
    body: () => (
      <>
        <p>By using {B.domain} and placing an order you agree to these terms. The website is operated by {B.legalName}, {addr}.</p>
        <h2>Products and pricing</h2>
        <p>All prices are in Indian Rupees (INR) and include applicable taxes unless stated otherwise. Product photos are for illustration; slight colour variation can occur between screens and actual fabric. We may correct pricing or listing errors and cancel affected orders, with a full refund of any amount paid.</p>
        <h2>Orders</h2>
        <p>An order is accepted when you receive an order confirmation. We may cancel an order if stock is unavailable or the delivery address cannot be served; any payment made will be refunded in full.</p>
        <h2>Payment</h2>
        <p>We accept Cash on Delivery and online payments (UPI, cards, net banking and wallets) through our payment gateway partner. Online payments are completed on the gateway's secure page.</p>
        <h2>Shipping, returns and refunds</h2>
        <p>See our <Link to="/shipping-policy" className="text-brand hover:underline">Shipping &amp; Delivery Policy</Link> and <Link to="/refund-policy" className="text-brand hover:underline">Refund &amp; Cancellation Policy</Link>.</p>
        <h2>Your account</h2>
        <p>You are responsible for keeping your login details safe and for activity under your account. Provide accurate information when ordering.</p>
        <h2>Acceptable use</h2>
        <p>Do not misuse the site: no fraudulent orders, attempts to break or overload the service, or unauthorised access to other users' data.</p>
        <h2>Liability</h2>
        <p>To the extent permitted by law, our liability for any order is limited to the amount you paid for it.</p>
        <h2>Governing law</h2>
        <p>These terms are governed by the laws of India. Disputes are subject to the courts at Coimbatore, Tamil Nadu.</p>
        <h2>Contact</h2>
        <p>Questions about these terms: <Mail /> or {B.phone}.</p>
      </>
    ),
  },
  refund: {
    title: 'Refund & Cancellation Policy',
    body: () => (
      <>
        <h2>Cancellation</h2>
        <ul>
          <li>You can cancel an order from My Account &rarr; Orders any time before it is shipped.</li>
          <li>Once an order is shipped or out for delivery, it can no longer be cancelled, but you may return it after delivery as described below.</li>
          <li>If you paid online and cancel before shipping, the full amount is refunded to the original payment method.</li>
        </ul>
        <h2>Returns</h2>
        <ul>
          <li>You may request a return within {B.returnWindowDays} days of delivery.</li>
          <li>Items must be unused, unwashed, with tags and original packaging intact.</li>
          <li>For hygiene reasons, innerwear (briefs/panties, bras, slips and similar) can be returned only if unopened and sealed, unless the product is defective or wrong.</li>
          <li>If you received a damaged, defective or wrong item, tell us within {B.returnWindowDays} days with a photo and we will arrange a free pickup and replacement or refund.</li>
        </ul>
        <h2>How to request a return</h2>
        <p>Email <Mail /> or call {B.phone} with your order ID and reason, or use the return option on your order in My Account. We will confirm the pickup or tell you where to send the item.</p>
        <h2>Refunds</h2>
        <ul>
          <li>Approved refunds for online payments go back to the original payment method within {B.refundDays} after we receive and check the returned item.</li>
          <li>For Cash on Delivery orders, we refund by bank transfer or UPI to the details you share with us, within the same period.</li>
          {B.shippingFee > 0 && <li>Original shipping charges are non-refundable unless the return is due to our error.</li>}
        </ul>
        <p>Your bank may take a few additional days to show the credit.</p>
        <h2>If we cancel your order</h2>
        <ul>
          <li>We may cancel an order if an item is out of stock, the delivery address or pincode cannot be served, there is a pricing or listing error, or we cannot verify the order details.</li>
          <li>You will see the order marked as &quot;Cancelled by our team&quot; in My Account &rarr; Orders, and we will contact you using the phone number or email on the order.</li>
          <li>If you paid online, the full amount (including shipping) is refunded to the original payment method within {B.refundDays} of the cancellation.</li>
          <li>For Cash on Delivery orders nothing has been paid, so no refund is needed. If you had paid any advance, we refund it by bank transfer or UPI to the details you share with us, within the same period.</li>
          <li>A cancelled order cannot be reopened. You are welcome to place a new order for any item that is back in stock.</li>
        </ul>
        <h2>If we cannot accept your return</h2>
        <ul>
          <li>A return may be rejected if it is requested after {B.returnWindowDays} days of delivery, the item is used, washed or without tags or original packaging, or sealed innerwear has been opened (unless the product is defective or wrong).</li>
          <li>When a return is rejected, you will see the reason in My Account &rarr; Orders, and no refund is issued for that return.</li>
          <li>If you believe the rejection is a mistake, email <Mail /> or call {B.phone} with your order ID and photos of the item within 3 days, and we will review it again.</li>
          <li>If a returned item reaches us and fails our quality check, we may send it back to you or refuse the refund, and we will tell you the reason.</li>
        </ul>
      </>
    ),
  },
  shipping: {
    title: 'Shipping & Delivery Policy',
    body: () => (
      <>
        <h2>Where we deliver</h2>
        <p>We ship across India to serviceable pincodes. If your pincode cannot be served, we will contact you and refund any amount paid.</p>
        <h2>Delivery time</h2>
        <p>Orders are dispatched from Pollachi, Tamil Nadu and typically arrive within {B.deliveryDays} of order confirmation, depending on your location. Delays can occur during festivals, weather disruptions or courier issues.</p>
        <h2>Shipping charges</h2>
        {B.shippingFee === 0 ? (
          <p>Shipping is free on all orders.</p>
        ) : (
          <ul>
            <li>Free shipping on orders above &#8377;{B.freeShippingAbove}.</li>
            <li>A flat shipping fee of &#8377;{B.shippingFee} applies to orders of &#8377;{B.freeShippingAbove} or less.</li>
          </ul>
        )}
        <h2>Order tracking</h2>
        <p>Track your order any time from My Account. Status updates move from Confirmed &rarr; Processing &rarr; Packed &rarr; Shipped &rarr; Out for Delivery &rarr; Delivered.</p>
        <h2>Cash on Delivery</h2>
        <p>Pay the delivery partner in cash or UPI when the parcel arrives. Please keep the exact amount ready. Repeated refusal of COD parcels may lead to COD being disabled for your account.</p>
        <h2>Delivery issues</h2>
        <p>If your parcel is damaged or has not arrived within the stated time, email <Mail /> or call {B.phone} with your order ID.</p>
      </>
    ),
  },
}

export default function Policy({ type }) {
  const p = POLICIES[type]
  return (
    <section className="section-py bg-cream min-h-[70vh]">
      <div className="container-app max-w-3xl">
        <h1 className="font-display text-3xl font-semibold text-ink mb-1">{p.title}</h1>
        <p className="text-xs text-ink-soft mb-8">Last updated: {POLICY_UPDATED}</p>
        <div className="bg-white rounded-2xl shadow-md p-6 sm:p-8 text-sm text-ink-soft leading-relaxed space-y-4 [&_h2]:font-display [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-ink [&_h2]:pt-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5">
          {p.body()}
          <div className="border-t border-thread pt-4 mt-6 text-xs">
            <p className="font-medium text-ink">{B.legalName}</p>
            <p>{addr}</p>
            {B.gstin && <p>GSTIN: {B.gstin}</p>}
            <p>Email: <Mail /> · Phone: {B.phone}</p>
          </div>
        </div>
      </div>
    </section>
  )
}
