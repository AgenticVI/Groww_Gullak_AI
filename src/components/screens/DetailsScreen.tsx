import { useMemo, useState } from 'react'
import { useApp } from '../../App'
import { BackBar } from '../ui/common'
import { ChevronRight, ChevronUp, StepUp, Pencil, Clock, Check } from '../ui/icons'
import { AskGullakButton } from '../ai/AskGullak'
import { Piggy } from '../ui/Piggy'
import Streak from '../ui/Streak'
import { Confetti, PartyPopper } from '../ui/Popper'
import { goalSummary, isOneYear, moodOf } from '../../lib/goals'
import { MONTHS_SHORT } from '../../data/sip'
import { inr } from '../../../shared/format'

const ord = (n: number) => `${n}${['th', 'st', 'nd', 'rd'][(n % 100 >> 3) ^ 1 && n % 10 < 4 ? n % 10 : 0]}`
const dd = (n: number) => String(n).padStart(2, '0')

export default function DetailsScreen() {
  const { back, openCancel, toast, goals, activeGoal, setStatus, openGoal } = useApp()
  const g = goals.find((x) => x.id === activeGoal) ?? goals[0]
  const s = useMemo(() => goalSummary(g), [g])
  const [open, setOpen] = useState(true)
  const nextN = g.nov ? s.rows.length : s.rows.length + 1
  const prev = s.rows.slice(-2).reverse()
  const due = g.day <= 3

  return (
    <>
      <BackBar title="SIP details" onBack={back}
        right={<button onClick={openCancel} className="min-h-[44px] px-1 text-[16px] font-medium text-ink"><span className="dash-link">Cancel SIP</span></button>} />
      <div className="scroll px-4 pb-6">
        <div className="mt-2">
          <div className="text-[34px] font-semibold text-ink leading-none">{inr(g.monthly)}</div>
          <div className="text-[15px] font-medium text-ink mt-2">{ord(g.day)} of every month</div>
          <div className="mt-3 flex items-center gap-1 text-[16px] text-mute">{g.fund}<ChevronRight size={16} /></div>
        </div>

        <div className="flex gap-2.5 mt-4">
          <button onClick={() => toast('Step-up is not part of this prototype')} className="flex items-center gap-2 rounded-card bg-tint text-deep font-medium text-[15px] px-3.5 min-h-[48px] whitespace-nowrap"><StepUp size={18} />Add step-up</button>
          <button onClick={() => toast('Editing is not part of this prototype')} className="flex items-center gap-2 rounded-card border border-line text-ink font-medium text-[15px] px-3.5 min-h-[48px] whitespace-nowrap"><Pencil size={18} />Change amount/date</button>
        </div>

        <section aria-label="Your Gullak" className="mt-5 rounded-card border border-[#CCF3E8] bg-gradient-to-b from-tint to-white p-3.5">
          <button onClick={() => openGoal(g.id)} className="w-full flex items-center gap-3 text-left" aria-label={`${g.name} Gullak, ${Math.round(s.progress)}% of ${inr(g.target)}. Open Gullak`}>
            <Piggy progress={s.progress} coins={s.rows.length} size={118} mood={moodOf(g, s.rows)} />
            <span className="min-w-0 flex-1">
              <span className="block text-[12px] font-semibold text-deep">{g.name} Gullak</span>
              <span className="block text-[26px] font-extrabold text-ink leading-none tracking-tight mt-1">{inr(s.value)}</span>
              <span className="block text-[12.5px] text-mute mt-1">of {inr(g.target)} · <b className="text-ink">{Math.round(s.progress)}%</b></span>
            </span>
            <ChevronRight size={18} color="#6B6E7E" />
          </button>
          <div className="mt-3 h-1.5 rounded-full bg-white" role="progressbar" aria-valuenow={Math.round(s.progress)} aria-valuemin={0} aria-valuemax={100}>
            <div className="h-full rounded-full bg-brand" style={{ width: `${Math.max(2, s.progress)}%` }} />
          </div>
          <div className="mt-3 flex items-center justify-between rounded-xl bg-white border border-line px-3 py-2">
            <span className="text-[12px] font-semibold text-ink">SIP streak</span>
            <Streak rows={s.rows} size={16} months />
          </div>
          <div className="mt-3"><AskGullakButton goalId={g.id} variant="full" label="Ask Gullak about this goal" /></div>
        </section>

        <hr className="border-line my-5 -mx-4" />

        {/* Fund performance, with Ask Gullak */}
        <section aria-label="Fund performance">
          <div className="flex items-center gap-2">
            <h2 className="flex-1 text-[22px] font-semibold text-ink">Fund performance</h2>
          </div>
          <dl className="grid grid-cols-3 gap-2 mt-3">
            {[['Invested', inr(s.invested)], ['Current value', inr(s.value)], ['Returns', `${s.marketEffect >= 0 ? '+' : '−'}${inr(Math.abs(s.marketEffect))}`]].map(([k, v]) => (
              <div key={k} className="rounded-xl border border-line p-2.5"><dt className="text-[11px] text-mute leading-tight">{k}</dt><dd className="text-[14px] font-bold text-ink mt-1 whitespace-nowrap">{v}</dd></div>
            ))}
          </dl>
        </section>

        <h2 className="text-[22px] font-semibold text-ink mt-6">In progress</h2>
        <div className="mt-3 flex items-start gap-3">
          <span className="w-8 h-8 rounded-full bg-[#00B386] flex items-center justify-center text-white mt-0.5"><Clock size={18} /></span>
          <div className="flex-1">
            <div className="flex items-center gap-1 text-[16px] font-medium text-ink">{ord(nextN)} instalment <ChevronRight size={16} color="#6B6E7E" /></div>
            <div className="text-[14px] text-mute">{dd(g.day)} Nov '26</div>
            <div className="mt-3 rounded-card bg-[#F3F4F6] px-4 py-3 text-[15px] text-ink leading-snug">
              {due ? 'Your autopay deduction is in-progress. Once confirmed, your order will be processed accordingly.' : `Your next autopay is scheduled for ${g.day} Nov.`}
            </div>
            {!g.nov ? (
              <div className="mt-3 flex gap-2" role="group" aria-label="Demo: this month's instalment">
                <button onClick={() => setStatus(g.id, { nov: 'paid' })} className="flex-1 min-h-[46px] rounded-btn bg-deep text-white text-[13.5px] font-bold">Pay instalment (demo)</button>
                <button onClick={() => setStatus(g.id, { nov: 'skipped' })} className="flex-1 min-h-[46px] rounded-btn border-[1.5px] border-line text-ink text-[13.5px] font-bold">Skip this month (demo)</button>
              </div>
            ) : (
              <div className={`relative overflow-hidden mt-3 flex items-center gap-3 rounded-card px-3 py-2 ${g.nov === 'paid' ? 'bg-tint' : 'bg-[#EEF3FF]'}`} aria-live="polite">
                {g.nov === 'paid' && isOneYear(s.rows) && <Confetti />}
                <Piggy progress={s.progress} coins={s.rows.length} size={64} mood={moodOf(g, s.rows)} />
                {g.nov === 'paid' && isOneYear(s.rows) && <PartyPopper size={34} />}
                <div className="flex-1 text-[13px] font-semibold text-ink">{g.nov === 'paid' ? (isOneYear(s.rows) ? 'One year of SIPs done! Your Gullak is celebrating.' : 'Instalment paid. Your Gullak is happy.') : 'Instalment skipped. Your Gullak is sad.'}
                  <button onClick={() => setStatus(g.id, null)} className="block text-[11.5px] font-medium text-mute dash-link mt-0.5">Reset demo</button></div>
              </div>
            )}
          </div>
        </div>

        <hr className="border-line my-5 -mx-4" />
        <h2 className="text-[22px] font-semibold text-ink">Previous instalments</h2>
        <ol className="mt-4 flex flex-col gap-5">
          {prev.map((r, i) => (
            <li key={r.key} className="flex items-start gap-3">
              <span className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${r.skipped ? 'bg-amber' : 'bg-[#00B386]'}`}><Check size={18} /></span>
              <div>
                <div className="flex items-center gap-1 text-[16px] font-medium text-ink">{ord(s.rows.length - i)} instalment <ChevronRight size={16} color="#6B6E7E" /></div>
                <div className="text-[14px] text-mute">{dd(g.day)} {MONTHS_SHORT[r.idx % 12]} '{r.key.slice(2, 4)}{r.skipped ? ' · skipped' : ''}</div>
              </div>
            </li>
          ))}
        </ol>

        <hr className="border-line my-4 -mx-4" />
        <button className="w-full flex items-center justify-between min-h-[48px]" onClick={() => setOpen(!open)} aria-expanded={open}>
          <h2 className="text-[22px] font-semibold text-ink">Details</h2>
          <ChevronUp size={22} color="#44475B" className={open ? '' : 'rotate-180'} />
        </button>
        {open && (
          <dl className="mt-2 flex flex-col gap-3 text-[14px]">
            {[['SIP start date', `${dd(g.day)} ${MONTHS_SHORT[g.startM]} ${g.startY}`], ['Payment mode', 'Autopay (UPI mandate)'], ['Next due date', `${dd(g.day)} Dec 2026`], ['Plan', 'Direct · Growth']].map(([k, v]) => (
              <div key={k} className="flex justify-between"><dt className="text-mute">{k}</dt><dd className="font-semibold text-ink">{v}</dd></div>
            ))}
          </dl>
        )}
        {g.example && <p className="text-[11px] text-mute mt-4">Example SIP with made-up instalments.</p>}
      </div>
    </>
  )
}
