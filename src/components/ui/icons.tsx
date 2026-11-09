import type { ReactNode } from 'react'

type P = { size?: number; color?: string; className?: string }
const base = (size: number) => ({ width: size, height: size, viewBox: '0 0 24 24', fill: 'none', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true })
const mk = (d: ReactNode) => ({ size = 20, color = 'currentColor', className }: P) => (
  <svg {...base(size)} stroke={color} className={className}>{d}</svg>
)

export const ChevronRight = mk(<path d="M9 6l6 6-6 6" />)
export const ChevronLeft = mk(<path d="M15 18l-6-6 6-6" />)
export const ChevronUp = mk(<path d="M6 15l6-6 6 6" />)
export const ArrowLeft = mk(<><path d="M19 12H5" /><path d="M12 19l-7-7 7-7" /></>)
export const Search = mk(<><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></>)
export const Gear = mk(<><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></>)
export const Pencil = mk(<><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" /></>)
export const StepUp = mk(<><path d="M5 20v-5" /><path d="M12 20V9" /><path d="M19 20V4" /></>)
export const Clock = mk(<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>)
export const Check = mk(<path d="M5 12.5l4.5 4.5L19 7.5" />)
export const Wallet = mk(<><rect x="3" y="6" width="18" height="13" rx="3" /><path d="M3 10h18" /><path d="M16 14.5h2" /></>)
export const Pie = mk(<><path d="M21 12A9 9 0 1 1 12 3v9z" /><path d="M15 3.5A9 9 0 0 1 20.5 9H15z" /></>)
export const Calendar = mk(<><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M3 10h18M8 3v4M16 3v4" /></>)
export const Layers = mk(<><path d="M12 3l9 5-9 5-9-5z" /><path d="M3 13l9 5 9-5" /></>)
export const Trend = mk(<path d="M3 17l5-6 4 4 4-7 5 6" />)
export const Upgrade = mk(<><path d="M12 15V4" /><path d="M8 8l4-4 4 4" /><path d="M5 14v5h14v-5" /></>)
export const Bars = mk(<path d="M4 7h16M7 12h10M10 17h4" />)
export const Stock = mk(<><rect x="3" y="3" width="18" height="18" rx="3" /><path d="M7 15l3-4 3 3 4-6" /></>)
export const Fno = mk(<><path d="M3 20l5-9 4 5 3-4 6 8z" /></>)
export const Loan = mk(<><rect x="3" y="6" width="18" height="12" rx="2" /><circle cx="12" cy="12" r="2.5" /></>)
export const Close = mk(<><path d="M6 6l12 12M18 6L6 18" /></>)

export const Moon = mk(<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />)
export const Sun = mk(<><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>)
export const Monitor = mk(<><rect x="3" y="4" width="18" height="12" rx="2" /><path d="M8 20h8M12 16v4" /></>)
export const Phone = mk(<><rect x="7" y="2.5" width="10" height="19" rx="2.5" /><path d="M11 18.5h2" /></>)
