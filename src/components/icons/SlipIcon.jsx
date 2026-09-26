// Custom outline icon for "Slips" — lucide-react has no built-in icon for
// this category, so this hand-drawn SVG follows the exact same visual
// language as lucide icons (24x24 viewbox, currentColor stroke, width 2,
// round caps/joins) so it drops in anywhere a lucide icon is used, e.g.
// <SlipIcon className="text-brand" size={26} />.
export default function SlipIcon({ size = 24, className = '', ...props }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* Thin camisole straps */}
      <path d="M9 2 8 7" />
      <path d="M15 2 16 7" />
      {/* Scoop neck + fitted body, tapering to a straight hem */}
      <path d="M8 7c-1.5.3-2.5 1.8-2.5 3.5L6.3 20c.1 1 .9 1.7 1.9 1.7h7.6c1 0 1.8-.7 1.9-1.7l.8-9.5c0-1.7-1-3.2-2.5-3.5-1.5 2-6.5 2-8 0Z" />
    </svg>
  )
}
