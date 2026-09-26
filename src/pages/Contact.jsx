import { useState } from 'react'
import { Phone, Mail, MapPin, CheckCircle2 } from 'lucide-react'

export default function Contact() {
  const [sent, setSent] = useState(false)

  function handleSubmit(e) {
    e.preventDefault()
    setSent(true)
  }

  return (
    <section className="section-py bg-cream-dark min-h-[70vh]">
      <div className="container-app">
        <div className="text-center mb-12">
          <p className="eyebrow mb-2">We reply within 24 hours</p>
          <h1 className="text-3xl sm:text-4xl font-display font-semibold text-ink mb-3">Get In Touch</h1>
          <p className="text-ink-soft max-w-lg mx-auto text-sm">
            Have a question about an order or a product? We're here to help.
          </p>
          <span className="stitch-divider block w-16 mt-4 mx-auto" />
        </div>

        <div className="grid lg:grid-cols-[280px_1fr] gap-8">
          <div className="space-y-4">
            <div className="card-base p-5 flex items-start gap-3">
              <span className="swing-tag w-9 h-9 shrink-0 bg-brand-light text-brand flex items-center justify-center"><Phone size={17} /></span>
              <div>
                <p className="font-medium text-ink text-sm">Phone</p>
                <p className="text-ink-soft text-sm font-mono">+91 98654 89201</p>
              </div>
            </div>
            <div className="card-base p-5 flex items-start gap-3">
              <span className="swing-tag w-9 h-9 shrink-0 bg-brand-light text-brand flex items-center justify-center"><Mail size={17} /></span>
              <div>
                <p className="font-medium text-ink text-sm">Email</p>
                <p className="text-ink-soft text-sm font-mono">vsstextiles07@gmail.com</p>
              </div>
            </div>
            <div className="card-base p-5 flex items-start gap-3">
              <span className="swing-tag w-9 h-9 shrink-0 bg-brand-light text-brand flex items-center justify-center"><MapPin size={17} /></span>
              <div>
                <p className="font-medium text-ink text-sm">Store Address</p>
                <p className="text-ink-soft text-sm">57/1-2,NA,Maruthi Nagar, Suleesvaranpatti, Pollachi Taluk, Coimbatore, Tamil Nadu, India</p>
              </div>
            </div>
          </div>

          <div className="card-base p-6 sm:p-8">
            {sent ? (
              <div className="flex flex-col items-center justify-center h-full py-10 text-center">
                <CheckCircle2 size={44} className="text-brand mb-3" />
                <h3 className="font-semibold text-ink">Message Sent!</h3>
                <p className="text-sm text-ink-soft mt-1">We'll get back to you within 24 hours.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-ink-soft">Full Name</label>
                    <input required type="text" className="w-full mt-1 rounded-lg border border-thread px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand" placeholder="Your name" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-ink-soft">Email</label>
                    <input required type="email" className="w-full mt-1 rounded-lg border border-thread px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand" placeholder="you@example.com" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-ink-soft">Subject</label>
                  <input required type="text" className="w-full mt-1 rounded-lg border border-thread px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand" placeholder="Order enquiry, feedback, etc." />
                </div>
                <div>
                  <label className="text-xs font-medium text-ink-soft">Message</label>
                  <textarea required rows={5} className="w-full mt-1 rounded-lg border border-thread px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand resize-none" placeholder="Write your message here..." />
                </div>
                <button type="submit" className="btn-primary px-8 py-3 text-sm">Send Message</button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
