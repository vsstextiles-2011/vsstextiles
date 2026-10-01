import { Link } from 'react-router-dom'
import { Sparkles, X } from 'lucide-react'

export default function WelcomeBanner({ name, onDismiss }) {
  return (
    <div className="bg-brand text-white">
      <div className="container-app py-3 flex items-center justify-center gap-3 text-center relative">
        <Sparkles size={18} className="shrink-0 hidden sm:block" />
        <p className="text-sm font-medium">
          Welcome{name ? `, ${name}` : ''}! Your profile is all set —{' '}
          <Link to="/shop" className="underline underline-offset-2 font-semibold hover:opacity-90">
            Shop Now
          </Link>{' '}
          and start exploring.
        </p>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss welcome message"
          className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 p-1 text-white/80 hover:text-white"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  )
}
