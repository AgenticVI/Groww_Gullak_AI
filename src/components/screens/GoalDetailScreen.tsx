import { ChevronRight } from '../ui/icons'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useApp } from '../../App'
import { BackBar } from '../ui/common'
import { Piggy, GoalIcon } from '../ui/Piggy'
import { goalSummary, goalMonthData, moodOf, targetLabel, futureValues } from '../../lib/goals'
import AnalyseButton from '../ai/Analyse'
import { AskGullakButton } from '../ai/AskGullak'
import Streak from '../ui/Streak'
import { inr, inrShort, pctSigned } from '../../../shared/format'

export default function GoalDetailScreen() {
  const { back, goals, activeGoal, openSip, openCancelFor } = useApp()
  const g = goals.find((x) => x.id === activeGoal) ?? goals[0]
  const s = useMemo(() => goalSummary(g), [g])
  const [sel, setSel] = useState(s.rows.length ? s.rows[s.rows.length - 1].key : '')
  const strip = useRef<HTMLDivElement>(null)
  useEffect(() => { strip.current?.scrollTo({ left: strip.current.scrollWidth }) }, [g.id])
  const row = s.rows.find((r) => r.key === sel) ?? null
  const fv = useMemo(() => futureValues(g, s.value), [g, s.value])

  const monthData = useMemo(() => goalMonthData(g, row), [g, row])

  return (
    <>
      <BackBar title={<><GoalIcon kind={g.icon} size={20} /> {g.name} Gullak</>} sub={`${g.fundShort} · ${inr(g.target)} by ${targetLabel(g)}`} onBack={back} right={g.broken ? undefined : <button onClick={() => openCancelFor(g.id)} className="min-h-[44px] px-1 text-[16px] font-medium text-ink"><span className="dash-link">Cancel SIP</span></button>} />
      <div className="scroll px-4 pb-8">
        <div className="flex flex-col gap-4">
          <section className="rounded-card border border-line bg-gradient-to-b from-white to-[#F6FBF7] p-4" aria-label="Goal progress">
            <div className="flex items-center gap-3">
              <Piggy progress={s.progress} coins={s.rows.length} size={118} mood={moodOf(g, s.rows)} />
              <div className="min-w-0">
                <div className="text-[28px] font-extrabold text-ink leading-none tracking-tight">{inr(s.value)}</div>
                <div className="text-[13px] text-mute mt-1">of {inr(g.target)} · <b className="text-ink">{Math.round(s.progress)}%</b></div>
              </div>
            </div>
            <div className="mt-3 h-1.5 rounded-full bg-[#EEF0F3]" role="progressbar" aria-valuenow={Math.round(s.progress)} aria-valuemin={0} aria-valuemax={100}>
              <div className="h-full rounded-full bg-brand transition-all duration-700" style={{ width: `${s.progress}%` }} />
            </div>
            <div className="mt-3 flex items-center justify-between rounded-xl bg-white border border-line px-3 py-2">
              <span className="text-[12px] font-semibold text-ink">SIP streak</span>
              <Streak rows={s.rows} size={18} months />
            </div>
            {fv.length > 0 && (
              <div className="mt-3 rounded-xl bg-white border border-line p-3" aria-label="Gullak in the coming years">
                <div className="text-[12px] font-semibold text-ink">Your Gullak in the coming years</div>
                <ul className="grid grid-cols-4 gap-2 mt-2">
                  {fv.map((f) => (
                    <li key={f.years} className="rounded-lg bg-tint/60 px-2 py-2 text-center">
                      <div className="text-[10.5px] text-mute">{f.years} {f.years === 1 ? 'year' : 'years'}</div>
                      <div className="text-[13px] font-bold text-ink mt-0.5 whitespace-nowrap">{inrShort(f.value)}</div>
                    </li>
                  ))}
                </ul>
                <p className="text-[10.5px] text-mute mt-2 leading-snug">Illustration if your instalments continue. Not a promise: the real value will differ.</p>
              </div>
            )}
            <dl className="grid grid-cols-3 gap-2 mt-3">
              {[['Added by you', inr(s.invested)], ['Market effect', `${s.marketEffect >= 0 ? '+' : '−'}${inr(Math.abs(s.marketEffect))}`], ['Months to target date', String(s.monthsLeft)]].map(([k, v]) => (
                <div key={k} className="rounded-xl bg-white border border-line p-2.5">
                  <dt className="text-[11px] text-mute leading-tight">{k}</dt>
                  <dd className="text-[14.5px] font-bold text-ink mt-1 whitespace-nowrap">{v}</dd>
                </div>
              ))}
            </dl>
            {g.example && <p className="text-[11px] text-mute mt-2">Example contributions, shown for illustration.</p>}
            <button onClick={() => openSip(g.id)} className="mt-3 w-full flex items-center gap-3 rounded-xl bg-white border border-line px-3 min-h-[52px] text-left"><span className="flex-1 text-[14px] font-semibold text-ink">SIP details<span className="block text-[12px] font-normal text-mute">Instalments, skip or cancel this SIP</span></span><ChevronRight size={18} color="#6B6E7E" /></button>
            <div className="mt-3"><AskGullakButton goalId={g.id} variant="full" label="Ask Gullak about this goal" /></div>
          </section>

          {s.rows.length > 0 ? (
            <section aria-label="Month by month">
              <h2 className="text-[15px] font-bold text-ink mb-2">Month by month</h2>
              <div ref={strip} className="flex gap-2 overflow-x-auto pb-1" role="listbox" aria-label="Choose a month">
                {s.rows.map((r) => {
                  const on = r.key === sel
                  return (
                    <button key={r.key} role="option" aria-selected={on} onClick={() => setSel(r.key)}
                      className={`flex-shrink-0 min-w-[84px] min-h-[72px] rounded-card border-[1.5px] px-2.5 py-2 text-left ${on ? 'border-brand bg-tint' : 'border-line bg-white'}`}>
                      <span className="block text-[12px] font-semibold text-mute">{r.monthShort} {r.key.slice(2, 4)}</span>
                      <span className="block text-[14px] font-bold text-ink">{r.skipped ? '₹0' : `+${inr(r.added)}`}</span>
                      <span className="block text-[11px] font-semibold" style={{ color: r.pct >= 0 ? '#0E7F4F' : '#B4531A' }}>{pctSigned(r.pct)}</span>
                    </button>
                  )
                })}
              </div>
            </section>
          ) : (
            <section className="rounded-card border border-dashed border-line p-4 text-[13px] text-mute">
              Your first contribution lands next month. Month-by-month notes start after it.
            </section>
          )}

          <section className="rounded-card border border-line bg-white p-4 flex flex-col gap-3" aria-label="Gullak Notes">
            <div>
              <h3 className="text-[15px] font-bold text-ink">Gullak Notes</h3>
              <p className="text-[12px] text-mute mt-0.5">AI note for the month you pick</p>
            </div>
            <AnalyseButton label={row ? `Analyse ${row.monthName}` : 'Analyse this Gullak'} type="goal_month" data={monthData} ctx={`${g.id}-${row?.key ?? 'new'}`} />
          </section>

          {row && (
            <section className="rounded-card border border-line bg-white p-4" aria-live="polite" aria-label={`${row.label} details`}>
              <h3 className="text-[15px] font-bold text-ink mb-2">{row.label}</h3>
              {[
                ['Added this month', row.skipped ? '₹0 (skipped)' : inr(row.added)],
                ['Market move', `${pctSigned(row.pct)} · ${row.marketEffect >= 0 ? '+' : '−'}${inr(Math.abs(row.marketEffect))}`],
                ['Gullak value', inr(row.value)],
                ['Progress', `${row.prevProgress.toFixed(0)}% → ${row.progress.toFixed(0)}%`],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between min-h-[36px] items-center text-[13px]"><span className="text-mute">{k}</span><span className="font-bold text-ink">{v}</span></div>
              ))}
            </section>
          )}
          <p className="text-center text-[11.5px] text-mute">Goal tracking only. It doesn’t recommend funds, amounts or actions.</p>
        </div>
      </div>
    </>
  )
}
