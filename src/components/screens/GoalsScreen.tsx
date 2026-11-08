import { useApp } from '../../App'
import { BackBar } from '../ui/common'
import { Piggy, GoalIcon } from '../ui/Piggy'
import { PartyPopper } from '../ui/Popper'
import { goalSummary, isOneYear, moodOf, streakOf, targetLabel } from '../../lib/goals'
import type { Goal } from '../../data/goals'
import { AskGullakButton } from '../ai/AskGullak'
import { inr } from '../../../shared/format'

export const paceText = (s: ReturnType<typeof goalSummary>) => {
  const p = s.pace
  if (p.status === 'reached') return { text: 'Target reached', tone: 'text-[#0E7F4F]' }
  if (!p.label) return { text: 'No projected date yet', tone: 'text-mute' }
  const n = Math.abs(p.diffMonths)
  if (p.status === 'ahead') return { text: `Projected ${p.label} · ${n} months ahead`, tone: 'text-[#0E7F4F]' }
  if (p.status === 'onpace') return { text: `Projected ${p.label} · close to target date`, tone: 'text-[#0E7F4F]' }
  return { text: `Projected ${p.label} · ${n} months after target date`, tone: 'text-[#B4531A]' }
}

function GullakCard({ g }: { g: Goal }) {
  const { openGoal, setStatus, toast } = useApp()
  const s = goalSummary(g)
  const last6 = s.rows.slice(-6)
  const yr = s.rows.filter((r) => r.key.startsWith('2026'))
  const streak = streakOf(yr).streak
  return (
    <article className="rounded-card border border-line bg-white overflow-hidden">
      <button onClick={() => openGoal(g.id)} className="w-full text-left flex gap-3.5 items-center px-3.5 pt-3.5 pb-3" aria-label={`${g.name} Gullak, ${Math.round(s.progress)}% of ${inr(g.target)}. Open details`}>
        <span className="flex-shrink-0 w-[72px] h-[72px] rounded-2xl bg-[#FFF1EC] flex items-center justify-center"><Piggy progress={s.progress} coins={s.rows.length} size={60} mood={moodOf(g, s.rows)} /></span>
        <span className="flex-1 min-w-0">
          <span className="flex items-center gap-1.5 text-[16px] font-semibold text-ink"><GoalIcon kind={g.icon} size={16} />{g.name} Gullak{isOneYear(s.rows) && !g.broken && <span className="ml-1 inline-flex items-center gap-0.5 text-[10.5px] font-bold rounded-md px-1.5 py-0.5 bg-[#FFF4D6] text-[#8A5A00]"><PartyPopper size={13} />1 year</span>}{g.broken && <span className="ml-1 text-[10.5px] font-bold rounded-md px-1.5 py-0.5 bg-[#FDECE4] text-[#B4531A]">Broken</span>}</span>
          <span className="block text-[12px] text-mute mt-0.5 truncate">{g.fundShort}</span>
          <span className="block text-[13px] mt-1.5"><b className="font-semibold">{inr(s.value)}</b> <span className="text-mute">of {inr(g.target)}</span></span>
          <span className="block mt-2 h-1.5 rounded-full bg-[#EEF0F3]"><span className="block h-full rounded-full bg-brand" style={{ width: `${Math.max(2, s.progress)}%` }} /></span>
        </span>
      </button>
      <div className="flex items-center border-t border-[#F0F0F2] pl-3.5 pr-1.5 min-h-[48px] gap-2.5">
        <div className="flex-1 min-w-0">
          <div role="img" aria-label={`Last ${last6.length} months: ${last6.filter((r) => !r.skipped).length} paid`} className="flex gap-[5px]">
            {last6.map((r) => <i key={r.key} className={`block w-3 h-3 rounded-full ${r.skipped ? 'bg-[#F5A524]' : 'bg-[#00B386]'}`} />)}
          </div>
          <div className="text-[11px] text-mute mt-1">{streak} {streak === 1 ? 'month' : 'months'} streak this year</div>
        </div>
        <AskGullakButton goalId={g.id} />
      </div>
      {g.broken && <div className="px-3.5 pb-3"><button onClick={() => { setStatus(g.id, { broken: false }); toast('SIP restarted: your Gullak is whole again') }} className="w-full min-h-[44px] rounded-btn border border-deep text-deep text-[13.5px] font-semibold">Restart SIP</button></div>}
    </article>
  )
}

export default function GoalsScreen() {
  const { back, goals, openGoal, openNewGoal } = useApp()
  return (
    <>
      <BackBar title="Goal Gullaks" sub="One piggy bank for every goal" onBack={back} />
      <div className="scroll px-4 pb-8">
        <div className="cards flex flex-col gap-3">
          <p className="span2 text-[13px] text-mute leading-snug">Each Gullak is one SIP in one fund, for a long-term goal. Tap Ask Gullak to ask about your goal: how far you are, what you added versus the market, your streak. Progress only, never advice.</p>
          {goals.map((g) => <GullakCard key={g.id} g={g} />)}
          <button onClick={openNewGoal} className="span2 w-full min-h-[52px] rounded-btn border-[1.5px] border-dashed border-deep text-deep font-bold text-[14.5px]">+ New Gullak</button>
          <p className="span2 text-center text-[11.5px] text-mute">Goal tracking only, not investment advice.</p>
        </div>
      </div>
    </>
  )
}
