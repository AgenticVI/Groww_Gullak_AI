import { useId } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import type { GoalIconKind } from '../../data/goals'

// [x, y, r] slots inside the body, bottom row first; big coins carry a ₹, small ones are plain.
const SLOTS: [number, number, number][] = [
  [42, 77, 6], [56, 77, 6.5], [70, 77, 6], [80, 78, 3.6],
  [32, 68, 3.8], [46, 68, 6.2], [60, 69, 4.6], [74, 68, 6.4], [87, 69, 3.8],
  [30, 59, 3.6], [42, 59, 4.6], [54, 59, 6.6], [67, 59, 4], [79, 59, 6.2], [91, 60, 3.4],
  [34, 50, 4], [45, 50, 6.2], [57, 50, 4], [68, 50, 6.4], [80, 50, 4.2], [90, 51, 3.6],
  [42, 41, 5], [53, 41, 6.4], [65, 41, 4.2], [76, 41, 5.6], [88, 43, 3.4],
]

const SEAM = 'L60 25 L55 36 L64 44 L56 55 L66 64 L60 84 L60 130'
const BURST: [number, number][] = [[18, 12], [30, 4], [42, 20], [52, 8], [66, 2], [78, 14], [90, 6], [102, 18], [112, 10], [24, 26], [96, 28]]

/** Piggy bank (gullak): the fill shows goal progress, the coin pile shows months saved (big and small coins). */
export function Piggy({ progress, size = 120, coin = false, coins, mood }: { progress: number; size?: number; coin?: boolean; coins?: number; mood?: 'happy' | 'sad' | 'broken' }) {
  const reduce = useReducedMotion()
  const id = useId().replace(/:/g, '')
  const p = Math.max(0, Math.min(100, progress))
  const top = 83 - (p / 100) * 56 // body spans y 27..83
  const art = (
    <>
      <ellipse cx="62" cy="100" rx="42" ry="4" fill="#EEF3EC" />
      {/* legs, ears, tail */}
      <rect x="34" y="76" width="12" height="18" rx="5" fill="#F3C6B0" />
      <rect x="72" y="76" width="12" height="18" rx="5" fill="#F3C6B0" />
      <path d="M38 33 L44 16 L56 29 Z" fill="#F3C6B0" />
      <path d="M20 52 C 8 50, 8 38, 15 38" stroke="#E0A68C" strokeWidth="3" fill="none" strokeLinecap="round" />
      {/* body */}
      <ellipse cx="60" cy="55" rx="40" ry="28" fill="#FFF1EA" stroke="#E0A68C" strokeWidth="2.5" />
      <g clipPath={`url(#b${id})`}>
        <motion.rect x="15" width="90" fill="#00D09C" opacity="0.9"
          initial={reduce ? false : { y: 90, height: 0 }} animate={{ y: top, height: 90 - top }} transition={{ duration: reduce ? 0 : 1, ease: 'easeOut' }} />
        <motion.rect x="15" width="90" height="3" fill="#7CE8CC"
          initial={reduce ? false : { y: 90 }} animate={{ y: top }} transition={{ duration: reduce ? 0 : 1, ease: 'easeOut' }} />
 {SLOTS.slice(0, Math.min(SLOTS.length, coins ?? Math.max(p > 0 ? 1 : 0, Math.round((p / 100) * SLOTS.length)))).map(([x, y, r], i) => (
          <motion.g key={i} style={{ originX: 0.5, originY: 0.5 }} initial={reduce ? false : { scale: 0 }} animate={{ scale: 1 }}
            transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 300, damping: 14, delay: 0.25 + i * 0.05 }}>
            <circle cx={x} cy={y} r={r} fill="#F6C445" stroke="#D49A12" strokeWidth={Math.max(0.7, r / 7)} />
            {r >= 5.5 && <text x={x} y={y + 0.4} textAnchor="middle" dominantBaseline="central" fontSize={r * 1.15} fontWeight={800} fill="#8A5A00" fontFamily="Inter, system-ui, sans-serif">₹</text>}
            {r < 5.5 && <circle cx={x} cy={y} r={r * 0.55} fill="none" stroke="#D49A12" strokeWidth="0.6" opacity="0.7" />}
          </motion.g>
        ))}
      </g>
      <ellipse cx="60" cy="55" rx="40" ry="28" fill="none" stroke="#E0A68C" strokeWidth="2.5" />
      {/* snout, eye, coin slot */}
      <rect x="92" y="46" width="20" height="18" rx="8" fill="#F3C6B0" stroke="#E0A68C" strokeWidth="2" />
      <circle cx="99" cy="55" r="1.7" fill="#B07A62" /><circle cx="106" cy="55" r="1.7" fill="#B07A62" />
      {mood === 'broken' ? (
        <path d="M78.5 41.5l7 7M85.5 41.5l-7 7" stroke="#44475B" strokeWidth="2.2" strokeLinecap="round" />
      ) : (
        <circle cx="82" cy="45" r="2.6" fill="#44475B" />
      )}
      <rect x="48" y="26" width="24" height="4.5" rx="2.2" fill="#B07A62" />
      {mood === 'happy' && (
        <g>
          <path d="M92 66 Q101 74 110 66" stroke="#B07A62" strokeWidth="2.4" fill="none" strokeLinecap="round" />
          <circle cx="76" cy="58" r="5" fill="#FF9FA8" opacity=".55" />
          <path d="M80 37 Q82 34.5 84.5 37" stroke="#44475B" strokeWidth="1.6" fill="none" strokeLinecap="round" />
        </g>
      )}
      {mood === 'sad' && (
        <g>
          <path d="M92 71 Q101 63 110 71" stroke="#B07A62" strokeWidth="2.4" fill="none" strokeLinecap="round" />
          <path d="M77 39 L86 36" stroke="#44475B" strokeWidth="1.8" strokeLinecap="round" />
          <motion.path d="M83 50 q-3 5 0 7 q3 -2 0 -7Z" fill="#6EB6FF" initial={false}
            animate={reduce ? undefined : { y: [0, 9], opacity: [1, 0] }} transition={{ duration: 1.4, repeat: Infinity, ease: 'easeIn' }} />
        </g>
      )}
      {mood === 'broken' && <path d="M92 71 Q101 63 110 71" stroke="#B07A62" strokeWidth="2.4" fill="none" strokeLinecap="round" />}
      {mood === 'sad' && (
        <motion.path d="M60 26 L56 34 L62 41 L57 49" stroke="#8C5A44" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round"
          initial={reduce ? false : { pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.6, ease: 'easeOut' }} />
      )}
    </>
  )
  return (
    <motion.svg width={size} height={size * 0.85} viewBox="0 0 130 108" role="img" aria-label={`Piggy bank ${Math.round(p)}% full${mood ? `, ${mood}` : ''}`}
      animate={reduce ? undefined : mood === 'happy' ? { y: [0, -3, 0] } : undefined}
      transition={mood === 'happy' ? { duration: 1.2, repeat: Infinity, repeatDelay: 1.6 } : { duration: 0.6 }}>
      <defs>
        <clipPath id={`b${id}`}><ellipse cx="60" cy="55" rx="40" ry="28" /></clipPath>
        <clipPath id={`l${id}`}><path d={`M-20 -20 L60 -20 ${SEAM} L-20 130Z`} /></clipPath>
        <clipPath id={`r${id}`}><path d={`M150 -20 L60 -20 ${SEAM} L150 130Z`} /></clipPath>
      </defs>
      {mood === 'broken' ? (
        <>
          {([['l', -13, -15, '62px 92px'], ['r', 13, 15, '58px 92px']] as const).map(([side, dx, rot, origin]) => (
            <motion.g key={side} style={{ transformOrigin: origin }} initial={reduce ? false : { x: 0, y: 0, rotate: 0 }}
              animate={reduce ? { x: dx / 2, y: 5, rotate: rot / 2 } : { x: [0, -2, 2, -3, 3, -3, 3, 0, dx], y: [0, 0, 0, 0, 0, 0, 0, 0, 9], rotate: [0, -1.5, 1.5, -2.5, 2.5, -2.5, 2.5, 0, rot] }}
              transition={reduce ? { duration: 0 } : { duration: 2.4, times: [0, 0.08, 0.16, 0.24, 0.32, 0.4, 0.48, 0.55, 1], ease: 'easeOut' }}>
              <g clipPath={`url(#${side}${id})`}>{art}</g>
            </motion.g>
          ))}
          {!reduce && (
            <motion.path d="M60 25 L55 36 L64 44 L56 55 L66 64 L60 84" stroke="#8C5A44" strokeWidth="2.8" fill="none" strokeLinecap="round" strokeLinejoin="round"
              initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: [0, 0.15, 1, 1], opacity: [0, 1, 1, 0] }} transition={{ duration: 2.4, times: [0, 0.15, 0.55, 0.6] }} />
          )}
          {BURST.map(([xe, peak], i) => (
            <motion.g key={i} initial={reduce ? false : { x: 60, y: 52, opacity: 0 }}
              animate={reduce ? { x: xe, y: 96 } : { x: [60, xe], y: [52, peak, 96], opacity: [0, 1, 1] }}
              transition={reduce ? { duration: 0 } : { duration: 1.1, delay: 1.4 + i * 0.03, times: [0, 0.45, 1], ease: 'easeIn', x: { duration: 1.1, delay: 1.4 + i * 0.03, ease: 'easeOut' } }}>
              <circle r={i % 3 === 0 ? 6 : 4} fill="#F6C445" stroke="#D49A12" strokeWidth="1.2" />
              {i % 3 === 0 && <text textAnchor="middle" dominantBaseline="central" fontSize="7" fontWeight="800" fill="#8A5A00" fontFamily="Inter, system-ui, sans-serif" y="0.4">₹</text>}
            </motion.g>
          ))}
        </>
      ) : (
        <>
          {art}
        </>
      )}
      {coin && !reduce && (
        <motion.g initial={{ y: -18, opacity: 0 }} animate={{ y: [-18, 0], opacity: [0, 1, 1, 0] }} transition={{ duration: 1.6, repeat: Infinity, repeatDelay: 1.4 }}>
          <circle cx="60" cy="14" r="7" fill="#F6C445" stroke="#D49A12" strokeWidth="1.4" />
          <text x="60" y="14.5" textAnchor="middle" dominantBaseline="central" fontSize="8" fontWeight="800" fill="#8A5A00" fontFamily="Inter, system-ui, sans-serif">₹</text>
        </motion.g>
      )}
    </motion.svg>
  )
}

const ICONS: Record<GoalIconKind, React.ReactNode> = {
  bike: <><circle cx="6" cy="16" r="3.5" /><circle cx="18" cy="16" r="3.5" /><path d="M6 16l4-8h5l3 8M10 8l3 8M14 5h3" /></>,
  trip: <><path d="M3 14l18-8-4 14-5-5-4 3 0-5z" /></>,
  shield: <><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" /><path d="M9 12l2 2 4-4" /></>,
  home: <><path d="M4 11l8-7 8 7" /><path d="M6 10v10h12V10" /><path d="M10 20v-5h4v5" /></>,
  phone: <><rect x="7" y="3" width="10" height="18" rx="2.5" /><path d="M11 18h2" /></>,
  edu: <><path d="M2 9l10-5 10 5-10 5z" /><path d="M6 11v5c3 2.5 9 2.5 12 0v-5" /></>,
}
export const GOAL_ICON_KINDS = Object.keys(ICONS) as GoalIconKind[]
export const goalIconLabel: Record<GoalIconKind, string> = { bike: 'Vehicle', trip: 'Trip', shield: 'Safety net', home: 'Home', phone: 'Gadget', edu: 'Education' }

export function GoalIcon({ kind, size = 22, color = '#00875F' }: { kind: GoalIconKind; size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{ICONS[kind]}</svg>
  )
}
