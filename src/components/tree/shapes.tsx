import { motion, useReducedMotion } from 'framer-motion'

export const C = {
  leaf: '#4E9A5E',
  leafDeep: '#3B8A52',
  vein: '#2F6E41',
  amber: '#F5A524',
  amberDeep: '#C27A00',
  brand: '#00D09C',
  deep: '#00875F',
  trunk: '#7B5B3A',
  root: '#8B6B47',
  gold: '#F6C445',
  goldDeep: '#D49A12',
  storm: '#C2410C',
  grey: '#B8BCC6',
}

export type LeafKind = 'grown' | 'skipped' | 'next' | 'future' | 'greyed'

export const leafPath = (L: number) => {
  const h = L * 0.42
  return `M0 0 C ${L * 0.25} ${-h}, ${L * 0.72} ${-h}, ${L} 0 C ${L * 0.72} ${h}, ${L * 0.25} ${h}, 0 0 Z`
}

/** A leaf drawn from its base at (0,0) pointing +x. Wrap in a translated/rotated <g>. */
export function LeafShape({ len, kind, preview = false, color = C.leaf, vein = C.vein }: { len: number; kind: LeafKind; preview?: boolean; color?: string; vein?: string }) {
  const d = leafPath(len)
  if (kind === 'grown') return <><path d={d} fill={color} /><path d={`M0 0 L${len * 0.82} 0`} stroke={vein} strokeWidth={Math.max(0.6, len / 22)} fill="none" opacity={0.8} /></>
  if (kind === 'greyed') return <path d={d} fill={C.grey} />
  if (kind === 'skipped') return <><path d={d} fill={C.amber} /><path d={`M0 0 L${len * 0.82} 0`} stroke={C.amberDeep} strokeWidth={Math.max(0.6, len / 22)} fill="none" /></>
  if (kind === 'next') return <path d={d} fill="#E5FAF5" stroke={C.brand} strokeWidth={Math.max(1.4, len / 20)} strokeDasharray={`${len / 7} ${len / 9}`} strokeLinejoin="round" />
  return <path d={d} fill={preview ? '#CDEBD3' : 'none'} stroke={preview ? '#8FBF9B' : '#9AA3AE'} strokeWidth={Math.max(1.2, len / 26)} strokeDasharray={`0.1 ${Math.max(3, len / 14)}`} strokeLinecap="round" strokeLinejoin="round" />
}

/** Gold ₹ coin with a small green "+" outside, top-left. Centered on (0,0). */
export function CoinShape({ r = 9, plus = true }: { r?: number; plus?: boolean }) {
  return (
    <g>
      <circle r={r} fill={C.gold} stroke={C.goldDeep} strokeWidth={Math.max(1, r / 7)} />
      <circle r={r * 0.72} fill="none" stroke={C.goldDeep} strokeWidth={0.7} opacity={0.6} />
      <text textAnchor="middle" dominantBaseline="central" y={0.5} fontSize={r * 1.15} fontWeight={800} fill="#8A5A00" fontFamily="Inter, system-ui, sans-serif">₹</text>
      {plus && (
        <g transform={`translate(${-r * 1.0} ${-r * 1.05})`} stroke="#0E9F5C" strokeWidth={Math.max(1.3, r / 5)} strokeLinecap="round">
          <path d={`M${-r * 0.32} 0H${r * 0.32}M0 ${-r * 0.32}V${r * 0.32}`} />
        </g>
      )}
    </g>
  )
}

/** Dark grey cloud + yellow lightning bolt. Centered on (0,0), size s. */
export function StormShape({ s = 18 }: { s?: number }) {
  return (
    <g transform={`translate(${-s / 2} ${-s / 2}) scale(${s / 24})`}>
      <path d="M6.5 15.5a4.6 4.6 0 0 1 .7-9.1 6 6 0 0 1 11.3 1.7 4 4 0 0 1-.4 7.4z" fill="#59606E" stroke="#3E4451" strokeWidth="1" strokeLinejoin="round" />
      <path d="M13 12.2l-3.1 5.2h2.6l-1.2 4.6 4.4-6.4h-2.8l1.3-3.4z" fill="#FACC15" stroke="#D49A12" strokeWidth="0.6" strokeLinejoin="round" />
    </g>
  )
}

/** Pops in (spring) unless the user prefers reduced motion. */
export function Pop({ children, delay = 0, x = 0, y = 0 }: { children: React.ReactNode; delay?: number; x?: number; y?: number }) {
  const reduce = useReducedMotion()
  return (
    <g transform={`translate(${x} ${y})`}>
      <motion.g
        style={{ originX: 0.5, originY: 0.5 }}
        initial={reduce ? false : { scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 380, damping: 14, delay }}
      >
        {children}
      </motion.g>
    </g>
  )
}

export function Medal({ r = 6 }: { r?: number }) {
  return (
    <g>
      <path d={`M${-r * 0.5} ${r * 0.6} L${-r * 0.8} ${r * 1.9} L0 ${r * 1.3} L${r * 0.8} ${r * 1.9} L${r * 0.5} ${r * 0.6}`} fill="#E04F5F" />
      <circle r={r} fill={C.gold} stroke={C.goldDeep} strokeWidth={1.2} />
      <circle r={r * 0.5} fill="none" stroke={C.goldDeep} strokeWidth={0.8} />
    </g>
  )
}
