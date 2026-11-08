import { motion, useReducedMotion } from 'framer-motion'
import { useApp } from '../../App'
import { useInsight } from '../../lib/insights'
import { goalSummary, goalSummaryData, gullakBrokenData, isOneYear, moodOf } from '../../lib/goals'
import type { Goal } from '../../data/goals'
import { Piggy } from '../ui/Piggy'
import { Confetti, PartyPopper } from '../ui/Popper'
import Streak from '../ui/Streak'
import { InsightGlyph } from './InsightCard'
import { SparklePig } from './Analyse'
import { AskGullakButton } from './AskGullak'
import { inr } from '../../../shared/format'

const YOU = { fill: '#F6C445', stroke: '#C98A00', text: '#8A5A00', pill: '#F4DFA4' } // your money: gold
const MKT_UP = { fill: '#7DE0C0', stroke: '#00B386', text: '#007A57', pill: '#CCF3E8' } // market gain: green
const MKT_DIP = { fill: '#BFD6FF', stroke: '#6E9BEF', text: '#3B5BB5', pill: '#D6E4FF' } // market dip: calm blue

/** Animated picture: your coins (gold) and the market's coins (green when up) dropping into the Gullak. A dip is shown calmly. */
function Flow({ g }: { g: Goal }) {
  const reduce = useReducedMotion()
  const s = goalSummary(g)
  const gain = s.marketEffect >= 0
  const M = gain ? MKT_UP : MKT_DIP
  const total = Math.max(1, s.invested + Math.abs(s.marketEffect))
  const mktCoins = Math.max(1, Math.min(3, Math.round((Math.abs(s.marketEffect) / total) * 6)))
  const lane = (n: number, y0: number, y1: number, c: typeof YOU) =>
    Array.from({ length: n }, (_, i) => (
      <motion.g key={`${y0}-${i}`} initial={false}
        animate={reduce ? { x: 166, y: (y0 + y1) / 2, opacity: 1 } : { x: [118, 214], y: [y0, y1], opacity: [0, 1, 1, 0] }}
        transition={reduce ? { duration: 0 } : { duration: 1.9, repeat: Infinity, delay: i * 0.62, ease: 'easeIn' }}>
        <circle r="7" fill={c.fill} stroke={c.stroke} strokeWidth="1.4" />
        <text textAnchor="middle" dominantBaseline="central" fontSize="8" fontWeight="800" fill={c.text} fontFamily="Inter, system-ui, sans-serif" y="0.5">₹</text>
      </motion.g>
    ))
  return (
    <div className="relative h-[128px]" role="img" aria-label={`${inr(s.invested)} added by you and ${gain ? '+' : '−'}${inr(Math.abs(s.marketEffect))} from the market`}>
      <div className="absolute left-0 top-[6px] w-[112px] rounded-xl border bg-white px-2.5 py-1.5" style={{ borderColor: YOU.pill }}>
        <div className="text-[10.5px] font-semibold text-mute leading-none">You added</div>
        <div className="text-[15px] font-extrabold mt-1 leading-none" style={{ color: YOU.text }}>{inr(s.invested)}</div>
      </div>
      <div className="absolute left-0 bottom-[6px] w-[112px] rounded-xl border bg-white px-2.5 py-1.5" style={{ borderColor: M.pill }}>
        <div className="text-[10.5px] font-semibold text-mute leading-none">{gain ? 'Market added' : 'Market is resting'}</div>
        <div className="text-[15px] font-extrabold mt-1 leading-none" style={{ color: M.text }}>{gain ? '+' : '−'}{inr(Math.abs(s.marketEffect))}</div>
      </div>
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 320 128" preserveAspectRatio="xMinYMid meet" aria-hidden="true">
        <path d="M112 28 Q170 28 222 50" stroke={YOU.stroke} strokeWidth="1.5" strokeDasharray="3 4" fill="none" opacity=".55" />
        <path d="M112 100 Q170 100 222 62" stroke={M.stroke} strokeWidth="1.5" strokeDasharray="3 4" fill="none" opacity=".6" />
        {lane(3, 28, 50, YOU)}
        {gain ? lane(mktCoins, 100, 62, MKT_UP) : (
          <motion.text x="150" y="92" fontSize="13" fontWeight="800" fill={MKT_DIP.stroke} fontFamily="Inter, system-ui, sans-serif"
            animate={reduce ? undefined : { opacity: [0.2, 1, 0.2], y: [92, 86, 92] }} transition={{ duration: 3, repeat: Infinity }}>z z</motion.text>
        )}
      </svg>
      <div className="absolute right-0 top-[10px]"><Piggy progress={s.progress} coins={s.rows.length} size={96} mood={moodOf(g, s.rows)} /></div>
    </div>
  )
}

/** Everything inside is produced when the user taps the Gullak: AI text + numbers/visuals from the same facts. */
export default function GullakPanel({ g }: { g: Goal }) {
  const { risk, aiOn } = useApp()
  const broken = !!g.broken
  const data = broken ? gullakBrokenData(g) : goalSummaryData(g)
  const { insight, loading, source } = useInsight(broken ? 'gullak_broken' : 'goal_summary', data, `${g.id}-${broken ? 'broken' : 'sum'}`, risk, aiOn)
  const s = goalSummary(g)
  const gain = s.marketEffect >= 0
  const youPct = Math.max(0, Math.min(100, (s.invested / g.target) * 100))
  const mktPct = Math.max(0, Math.min(100 - youPct, (Math.max(0, s.marketEffect) / g.target) * 100))
  const toBreak = (data as any).monthsToBreak as number | null | undefined

  if (loading || !insight)
    return (
      <div className="flex flex-col gap-2.5 py-1" aria-busy="true" aria-live="polite">
        <div className="flex items-center gap-2 text-[13px] font-semibold text-deep"><SparklePig size={20} />Counting your coins…</div>
        <div className="sk h-24 w-full" /><div className="sk h-3.5 w-10/12" /><div className="sk h-3.5 w-8/12" />
      </div>
    )
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="flex flex-col gap-3" aria-live="polite">
      <div className="flex items-center gap-2.5">
        <InsightGlyph icon={insight.icon} />
        <span className="text-[14.5px] font-bold text-ink">{insight.title}</span>
        <span className="ml-auto text-[10.5px] font-bold rounded-md px-1.5 py-0.5 bg-tint text-[#007A57]">{source === 'ai' ? 'AI' : 'Auto'}</span>
      </div>
      {!broken && isOneYear(s.rows) && (
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[#FFF4D6] to-[#E5FAF5] border border-[#F4DFA4] px-3 py-2.5 flex items-center gap-2.5">
          <PartyPopper size={34} />
          <div className="text-[12.5px] font-bold text-ink leading-snug">One year of saving!<span className="block font-medium text-mute">{s.rows.length} months in this Gullak.</span></div>
          <Confetti />
        </div>
      )}
      <div className={`flex items-center gap-2 rounded-xl px-3 py-2 text-[12.5px] font-semibold ${broken ? 'bg-[#FDECE4] text-[#B4531A]' : moodOf(g, s.rows) === 'sad' ? 'bg-[#EEF3FF] text-[#3B4FD8]' : 'bg-tint text-deep'}`}>
        {broken ? 'Gullak broken: the SIP was cancelled.' : moodOf(g, s.rows) === 'sad' ? `Sad Gullak: ${s.rows[s.rows.length - 1].monthName} was skipped.` : `Happy Gullak: ${s.rows[s.rows.length - 1].monthName} is paid.`}
      </div>
      <Flow g={g} />
      <div>
        <div className="flex justify-between text-[11.5px] text-mute mb-1"><span>{Math.round(s.progress)}% of {inr(g.target)}</span><span>{s.rows.length} months in</span></div>
        <div className="flex h-2.5 rounded-full bg-[#EEF0F3] overflow-hidden" role="img" aria-label={`You ${Math.round(youPct)}%, market ${Math.round(mktPct)}% of target`}>
          <span className="h-full" style={{ width: `${youPct}%`, background: YOU.fill }} />
          <span className="h-full" style={{ width: `${mktPct}%`, background: gain ? MKT_UP.stroke : MKT_DIP.stroke }} />
        </div>
        <div className="flex gap-3 mt-1.5 text-[11px] text-mute">
          <span className="flex items-center gap-1"><i className="w-2 h-2 rounded-full" style={{ background: YOU.fill }} />You</span>
          <span className="flex items-center gap-1"><i className="w-2 h-2 rounded-full" style={{ background: gain ? MKT_UP.stroke : MKT_DIP.stroke }} />Market</span>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[['Value now', inr(s.value)], [gain ? 'Market added' : 'Market dip', `${gain ? '+' : '−'}${inr(Math.abs(s.marketEffect))}`], ['Break in', toBreak != null ? `${toBreak} months` : '—']].map(([k, v]) => (
          <div key={k} className="rounded-xl bg-white border border-line p-2"><div className="text-[10.5px] text-mute leading-tight">{k}</div><div className="text-[13.5px] font-bold text-ink mt-0.5 whitespace-nowrap">{v}</div></div>
        ))}
      </div>
      <div className="rounded-xl bg-white border border-line px-3 py-2">
        <div className="text-[11.5px] font-semibold text-ink mb-1.5">Month-wise streak</div>
        <Streak rows={s.rows} size={20} months />
      </div>
      <ul className="flex flex-col gap-2 pl-1">
        {insight.bullets.map((b, i) => (
          <li key={i} className="flex gap-2 text-[13px] leading-[1.5] text-ink"><span className="mt-[7px] w-1.5 h-1.5 rounded-full bg-brand flex-shrink-0" aria-hidden="true" /><span>{b}</span></li>
        ))}
      </ul>
      <AskGullakButton goalId={g.id} variant="full" label="Ask Gullak about this goal" />
      <p className="text-[11px] text-mute border-t border-line pt-2">{source === 'ai' ? 'AI-generated' : 'Generated from your numbers'} · goal tracking, not investment advice</p>
    </motion.div>
  )
}
