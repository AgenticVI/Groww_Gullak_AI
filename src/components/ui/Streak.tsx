import type { GoalRow } from '../../lib/goals'
import { streakOf } from '../../lib/goals'

/** Month-wise streak: one tick per month (green = paid, amber dash = skipped) with the month initial under it. */
export default function Streak({ rows, size = 16, label = true, months = false }: { rows: GoalRow[]; size?: number; label?: boolean; months?: boolean }) {
  const { streak } = streakOf(rows)
  if (!rows.length) return null
  const last = rows.slice(-6)
  return (
    <div className="flex items-center gap-2" role="img" aria-label={`${streak} month streak. ${last.map((r) => `${r.monthName} ${r.skipped ? 'skipped' : 'paid'}`).join(', ')}`}>
      <div className="flex items-start gap-[5px]">
        {last.map((r) => (
          <span key={r.key} className="flex flex-col items-center gap-[2px]" title={`${r.label}: ${r.skipped ? 'skipped' : 'paid'}`}>
            <span style={{ width: size, height: size }} className={`rounded-full flex items-center justify-center ${r.skipped ? 'bg-[#F5A524]' : 'bg-[#00B386]'}`}>
              {r.skipped
                ? <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 12 12" aria-hidden="true"><path d="M2.5 6h7" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" /></svg>
                : <svg width={size * 0.62} height={size * 0.62} viewBox="0 0 12 12" aria-hidden="true"><path d="M2.4 6.3l2.4 2.4 4.8-5" stroke="#fff" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>}
            </span>
            {months && <span className="text-[9.5px] font-semibold text-mute leading-none">{r.monthShort}</span>}
          </span>
        ))}
      </div>
      {label && <span className="text-[11.5px] font-semibold text-mute whitespace-nowrap">{streak}-month streak</span>}
    </div>
  )
}
