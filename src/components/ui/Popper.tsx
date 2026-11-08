import { motion, useReducedMotion } from 'framer-motion'

/** Party popper icon. */
export function PartyPopper({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <path d="M4 28 L11 8 L24 21 Z" fill="#F6C445" stroke="#C98A00" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M8 20 L13 24.5 M10.5 13.5 L18 20.5" stroke="#C98A00" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M17 8 q3 -4 6 0 M22 14 q4 -2 6 2" stroke="#00B386" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <circle cx="19" cy="4" r="1.6" fill="#FF6B8A" /><circle cx="27" cy="9" r="1.6" fill="#5367FF" /><circle cx="26" cy="3" r="1.3" fill="#00B386" />
      <rect x="14" y="2" width="2.6" height="5" rx="1.2" fill="#F5A524" transform="rotate(25 15 4)" />
    </svg>
  )
}

const COLORS = ['#F6C445', '#00B386', '#FF6B8A', '#5367FF', '#F5A524', '#7DE0C0']

/** One-shot confetti burst that fills its (relative, overflow-hidden) parent. */
export function Confetti({ count = 34 }: { count?: number }) {
  const reduce = useReducedMotion()
  if (reduce) return null
  const pieces = Array.from({ length: count }, (_, i) => {
    const r = (n: number) => { const x = Math.sin((i + 1) * 12.9898 * n) * 43758.5453; return x - Math.floor(x) }
    return { left: 8 + r(1) * 84, dx: (r(2) - 0.5) * 120, rot: (r(3) - 0.5) * 900, delay: r(4) * 0.5, color: COLORS[i % COLORS.length], w: 5 + r(5) * 5, h: 7 + r(6) * 6 }
  })
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {pieces.map((p, i) => (
        <motion.span key={i} className="absolute top-0 rounded-[2px]"
          style={{ left: `${p.left}%`, width: p.w, height: p.h, background: p.color }}
          initial={{ y: -20, x: 0, opacity: 1, rotate: 0 }}
          animate={{ y: [-20, 120, 230], x: [0, p.dx * 0.6, p.dx], opacity: [1, 1, 0], rotate: p.rot }}
          transition={{ duration: 2.4, delay: p.delay, ease: 'easeIn' }} />
      ))}
    </div>
  )
}
