import { useState } from 'react'
import { Mail, CheckCircle2, ArrowRight } from 'lucide-react'

export default function Newsletter() {
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)

  function handleSubmit(e) {
    e.preventDefault()
    if (!email.trim()) return
    setSubscribed(true)
    setEmail('')
  }

  return (
    <section className="section-py bg-white">
      <div className="container-app">
        <div className="border border-thread grid grid-cols-1 md:grid-cols-2">
          <div className="p-6 sm:p-12 flex flex-col justify-center bg-ink text-white">
            <Mail size={26} className="text-brand mb-4" strokeWidth={1.5} />
            <h2 className="text-2xl font-display font-semibold mb-2">Subscribe to Our Newsletter</h2>
            <p className="text-white/70 text-sm">
              Get the latest offers, new arrivals and style updates delivered to your inbox.
            </p>
          </div>
          <div className="p-6 sm:p-12 flex items-center border-t md:border-t-0 md:border-l border-thread">
            {subscribed ? (
              <p className="flex items-center gap-2 text-brand font-medium">
                <CheckCircle2 size={20} /> Thanks for subscribing!
              </p>
            ) : (
              <form onSubmit={handleSubmit} className="w-full">
                <label className="eyebrow block mb-2">Email address</label>
                <div className="flex gap-0 border border-thread focus-within:border-ink">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="flex-1 min-w-0 w-full px-3 sm:px-4 py-3 text-sm focus:outline-none"
                  />
                  <button type="submit" className="bg-brand hover:bg-brand-dark text-white px-3 sm:px-5 shrink-0 flex items-center gap-2 text-xs font-mono uppercase tracking-wider">
                    Subscribe <ArrowRight size={14} />
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
