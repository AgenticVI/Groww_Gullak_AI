import { useEffect, useMemo, useState } from 'react'
import { useApp } from '../../App'
import { Sheet } from '../ui/common'
import InsightCard, { type PageSpec } from '../ai/InsightCard'
import GullakPanel from '../ai/GullakPanel'
import { Piggy } from '../ui/Piggy'
import { cancelDataFor, goalSummary } from '../../lib/goals'

export default function CancelSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { toast, goals, activeGoal, setStatus, back, route } = useApp()
  const g = goals.find((x) => x.id === activeGoal) ?? goals[0]
  const pages: PageSpec[] = useMemo(() => [{ type: 'cancel_check', data: cancelDataFor(g), ctx: `cancel-${g.id}` }], [g])
  const act = (msg: string) => { onClose(); toast(msg) }
  const btn = 'flex-1 min-h-[52px] rounded-btn border-[1.5px] text-[13.5px] font-bold px-1.5 bg-white whitespace-nowrap'

  const [done, setDone] = useState(false)
  // looping preview of what cancelling does to the Gullak
  const [tick, setTick] = useState(0)
  useEffect(() => {
    if (!open || g.broken) return
    const t = setInterval(() => setTick((n) => n + 1), 4600)
    return () => clearInterval(t)
  }, [open, g.broken])
  useEffect(() => {
    if (!g.broken) { setDone(false); return }
    const t = setTimeout(() => setDone(true), 2300)
    return () => clearTimeout(t)
  }, [g.broken])

  if (g.broken) {
    const s = goalSummary(g)
    return (
      <Sheet open={open} onClose={() => { onClose(); if (route === 'details') back() }} label="Gullak broken">
        <div className="flex flex-col items-center text-center">
          <Piggy progress={s.progress} coins={s.rows.length} size={130} mood="broken" />
          <h2 className="text-[19px] font-bold text-ink mt-1" aria-live="polite">{done ? `${g.name} Gullak is broken` : 'Breaking your Gullak…'}</h2>
          <p className="text-[12.5px] text-mute mt-0.5 mb-3">{done ? 'The SIP is cancelled (demo). Here is what the AI sees.' : 'Cancelling the SIP'}</p>
        </div>
        {done && <div className="rounded-card border border-[#F3C9B0] bg-[#FFF8F4] p-3"><GullakPanel g={g} /></div>}
        {done && (
          <div className="mt-4 flex gap-2.5">
            <button className={`${btn} border-deep bg-deep text-white`} onClick={() => { setStatus(g.id, { broken: false }); onClose(); toast('SIP restarted: your Gullak is whole again') }}>Restart SIP</button>
            <button className={`${btn} border-line text-ink`} onClick={() => { onClose(); if (route === 'details') back() }}>Close</button>
          </div>
        )}
      </Sheet>
    )
  }
  return (
    <Sheet open={open} onClose={onClose} label="Before you decide">
      <div className="flex items-center gap-3 mb-3">
        <span className="flex-shrink-0 w-[104px] flex justify-center" aria-hidden="true"><Piggy key={tick} progress={goalSummary(g).progress} coins={goalSummary(g).rows.length} size={100} mood="broken" /></span>
        <div className="min-w-0">
          <h2 className="text-[18px] font-bold text-ink leading-tight">Cancel this SIP?</h2>
          <p className="text-[12.5px] text-mute mt-1">{g.fundShort} · for {g.name}.</p>
          <p className="text-[12.5px] font-semibold text-[#B4531A] mt-1">If you cancel, this Gullak breaks.</p>
        </div>
      </div>
      <InsightCard heading="Before you decide" sub="Plain facts about what changes" pages={pages} />
      <div className="mt-4 flex gap-2.5" role="group" aria-label="Your options">
        <button className={`${btn} border-deep text-deep`} onClick={() => act('SIP kept — nothing changed')}>Keep SIP</button>
        <button className={`${btn} border-line text-ink`} onClick={() => act('Demo only: pausing isn’t wired up in this prototype')}>Pause instead</button>
        <button className={`${btn} border-storm text-storm`} onClick={() => setStatus(g.id, { broken: true })}>Cancel SIP</button>
      </div>
      <p className="mt-3 text-center text-[11.5px] text-mute">All three choices are yours; none is pre-selected.</p>
    </Sheet>
  )
}
