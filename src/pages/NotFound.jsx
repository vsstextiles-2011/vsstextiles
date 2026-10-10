import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="container-app min-h-[60vh] flex flex-col items-center justify-center text-center py-20">
      <span className="swing-tag w-20 h-20 bg-brand-light text-brand flex items-center justify-center font-mono text-xl font-semibold mb-6">
        404
      </span>
      <h1 className="text-2xl font-display font-semibold text-ink mb-2">Off the rack</h1>
      <p className="text-ink-soft mb-6">Sorry, the page you're looking for doesn't exist.</p>
      <Link to="/" className="btn-primary px-6 py-3 text-sm">Back to Home</Link>
    </div>
  )
}
