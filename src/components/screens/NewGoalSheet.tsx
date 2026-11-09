import { useState } from 'react'
import { useApp } from '../../App'
import { Sheet } from '../ui/common'
import { GoalIcon, GOAL_ICON_KINDS, goalIconLabel } from '../ui/Piggy'
import { SAMPLE_FUNDS, type GoalIconKind } from '../../data/goals'
import { NOW_IDX } from '../../lib/goals'

/** Keep only digits, and show them with Indian-style commas (10,00,000). */
const digits = (v: string) => v.replace(/\D/g, '').slice(0, 9)
const commas = (v: string) => (v ? Number(v).toLocaleString('en-IN') : '')

export default function NewGoalSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { addGoal } = useApp()
  const [name, setName] = useState('')
  const [icon, setIcon] = useState<GoalIconKind>('home')
  const [target, setTarget] = useState('')
  const [month, setMonth] = useState('2036-12')
  const [monthly, setMonthly] = useState('')
  const [fundIdx, setFundIdx] = useState(0)
  const [err, setErr] = useState('')

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const t = Number(target), m = Number(monthly)
    const [y, mo] = month.split('-').map(Number)
    if (!name.trim()) return setErr('Give your Gullak a name.')
    if (!(t >= 1000)) return setErr('Enter a target of at least ₹1,000.')
    if (!(m >= 100)) return setErr('Enter a monthly amount of at least ₹100.')
    if (!y || y * 12 + (mo - 1) < NOW_IDX + 60) return setErr('Gullaks are for long-term goals: pick a target at least 5 years away.')
    addGoal({ name: name.trim().slice(0, 24), icon, target: t, targetY: y, targetM: mo - 1, monthly: m, fund: SAMPLE_FUNDS[fundIdx].fund, fundShort: SAMPLE_FUNDS[fundIdx].short })
    setName(''); setTarget(''); setMonthly(''); setErr('')
    onClose()
  }
  const field = 'w-full min-h-[48px] rounded-btn border border-line px-3 text-[15px] text-ink bg-white'
  return (
    <Sheet open={open} onClose={onClose} label="New Gullak">
      <form onSubmit={submit} className="flex flex-col gap-3">
        <h2 className="text-[18px] font-bold text-ink">New Goal Gullak</h2>
        <label className="text-[13px] font-semibold text-ink" htmlFor="g-name">Goal name
          <input id="g-name" className={`${field} mt-1 font-normal`} value={name} maxLength={24} placeholder="e.g. Laptop" onChange={(e) => setName(e.target.value)} />
        </label>
        <fieldset>
          <legend className="text-[13px] font-semibold text-ink">Icon</legend>
          <div className="grid grid-cols-6 gap-1.5 mt-1" role="radiogroup">
            {GOAL_ICON_KINDS.map((k) => (
              <button type="button" key={k} role="radio" aria-checked={icon === k} aria-label={goalIconLabel[k]} onClick={() => setIcon(k)}
                className={`min-h-[48px] rounded-btn border-[1.5px] flex items-center justify-center ${icon === k ? 'border-brand bg-tint' : 'border-line'}`}>
                <GoalIcon kind={k} />
              </button>
            ))}
          </div>
        </fieldset>
        <div className="grid grid-cols-2 gap-2">
          <label className="text-[13px] font-semibold text-ink" htmlFor="g-target">Target (₹)
            <input id="g-target" inputMode="numeric" type="text" autoComplete="off" className={`${field} mt-1 font-normal`} value={commas(target)} placeholder="50,000" onChange={(e) => setTarget(digits(e.target.value))} />
          </label>
          <label className="text-[13px] font-semibold text-ink" htmlFor="g-monthly">Monthly (₹)
            <input id="g-monthly" inputMode="numeric" type="text" autoComplete="off" className={`${field} mt-1 font-normal`} value={commas(monthly)} placeholder="2,000" onChange={(e) => setMonthly(digits(e.target.value))} />
          </label>
        </div>
        <label className="text-[13px] font-semibold text-ink" htmlFor="g-month">Target month
          <input id="g-month" type="month" className={`${field} mt-1 font-normal`} value={month} onChange={(e) => setMonth(e.target.value)} />
        </label>
        <label className="text-[13px] font-semibold text-ink" htmlFor="g-fund">Fund for this SIP (sample list)
          <select id="g-fund" className={`${field} mt-1 font-normal`} value={fundIdx} onChange={(e) => setFundIdx(Number(e.target.value))}>
            {SAMPLE_FUNDS.map((f, i) => <option key={f.fund} value={i}>{f.fund}</option>)}
          </select>
        </label>
        {err && <p role="alert" className="text-[13px] text-storm font-medium">{err}</p>}
        <button type="submit" className="min-h-[50px] rounded-btn bg-deep text-white font-bold text-[15px]">Create Gullak</button>
        <p className="text-center text-[11.5px] text-mute">You set the numbers. Gullak only tracks progress toward them.</p>
      </form>
    </Sheet>
  )
}
