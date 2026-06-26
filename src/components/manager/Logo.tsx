/**
 * Agent Resources mark — a manager node (cobalt) managing two agent nodes.
 * "An agent that manages agents", in a tile. Scales from favicon to hero.
 */
export function Logo({ size = 32, rounded = 10 }: { size?: number; rounded?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Agent Resources"
      role="img"
    >
      <rect width="48" height="48" rx={rounded} fill="#0c0e12" />
      {/* connectors: manager -> agents */}
      <path d="M24 18 L15 31 M24 18 L33 31" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" opacity="0.55" />
      {/* managed agents */}
      <circle cx="15" cy="32" r="3.4" fill="#0c0e12" stroke="#ffffff" strokeWidth="2" />
      <circle cx="33" cy="32" r="3.4" fill="#0c0e12" stroke="#ffffff" strokeWidth="2" />
      {/* the manager (Agent Resources) */}
      <circle cx="24" cy="16" r="5" fill="#1f3cff" />
    </svg>
  )
}
