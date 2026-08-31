import { useState } from 'react'
import { User } from 'lucide-react'

export default function Account() {
  const [tab, setTab] = useState('login')

  return (
    <section className="section-py bg-cream-dark min-h-[70vh]">
      <div className="container-app max-w-md">
        <div className="card-base p-8">
          <div className="w-14 h-14 rounded-full bg-brand-light text-brand flex items-center justify-center mx-auto mb-4">
            <User size={26} />
          </div>
          <div className="flex border-b border-thread mb-6">
            <button
              onClick={() => setTab('login')}
              className={`flex-1 pb-3 text-sm font-medium border-b-2 transition-colors ${
                tab === 'login' ? 'border-brand text-brand' : 'border-transparent text-ink-soft'
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setTab('signup')}
              className={`flex-1 pb-3 text-sm font-medium border-b-2 transition-colors ${
                tab === 'signup' ? 'border-brand text-brand' : 'border-transparent text-ink-soft'
              }`}
            >
              Sign Up
            </button>
          </div>

          <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            {tab === 'signup' && (
              <div>
                <label className="text-xs font-medium text-ink-soft">Full Name</label>
                <input type="text" className="w-full mt-1 rounded-lg border border-thread px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand" placeholder="Enter your name" />
              </div>
            )}
            <div>
              <label className="text-xs font-medium text-ink-soft">Email or Mobile Number</label>
              <input type="text" className="w-full mt-1 rounded-lg border border-thread px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand" placeholder="Enter email or mobile" />
            </div>
            <div>
              <label className="text-xs font-medium text-ink-soft">Password</label>
              <input type="password" className="w-full mt-1 rounded-lg border border-thread px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand" placeholder="Enter password" />
            </div>
            <button type="submit" className="btn-primary w-full py-3 text-sm">
              {tab === 'login' ? 'Login' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-xs text-ink-soft mt-6">
            {tab === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button
              onClick={() => setTab(tab === 'login' ? 'signup' : 'login')}
              className="text-brand font-medium hover:underline"
            >
              {tab === 'login' ? 'Sign Up' : 'Login'}
            </button>
          </p>
        </div>
      </div>
    </section>
  )
}
