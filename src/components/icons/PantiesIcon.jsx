// Custom outline icon for "Panties" — lucide-react has no built-in icon for
// this category, so this hand-drawn SVG follows the exact same visual
// language as lucide icons (24x24 viewbox, currentColor stroke, width 2,
// round caps/joins) so it drops in anywhere a lucide icon is used, e.g.
// <PantiesIcon className="text-brand" size={26} />.
export default function PantiesIcon({ size = 24, className = '', ...props }) {
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
      {/* Waistband + hips + leg holes meeting at the crotch — classic brief silhouette */}
      <path d="M5 4.5h14" />
      <path d="M5 4.5c-1 0-1.5.5-1.5 1.5v6c0 3 2 5.3 4.7 6.4.9.4 1.6-.4 1.9-1.3.3-.9.9-1.6 1.9-1.6s1.6.7 1.9 1.6c.3.9 1 1.7 1.9 1.3 2.7-1.1 4.7-3.4 4.7-6.4v-6c0-1-.5-1.5-1.5-1.5" />
    </svg>
  )
}
