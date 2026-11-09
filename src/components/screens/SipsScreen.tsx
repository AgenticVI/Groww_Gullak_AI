import { useState } from 'react'
import { useApp } from '../../App'
import { useTheme, useView } from '../../lib/theme'
import { Logo } from '../ui/common'
import { Moon, Sun, Monitor, Phone, Upgrade, ChevronRight, Bars, Clock, Stock, Fno, Pie, Loan } from '../ui/icons'
import { Piggy, GoalIcon } from '../ui/Piggy'
import { AskGullakButton } from '../ai/AskGullak'
import Streak from '../ui/Streak'
import { inr } from '../../../shared/format'
import { goalSummary, moodOf, isOneYear } from '../../lib/goals'
import { MONTHS_SHORT } from '../../data/sip'

const TABS = ['Explore', 'Dashboard', 'SIPs', 'Watchlist'] as const
const TILES = [['#FDECE4', '#C2410C'], ['#E8EEFF', '#3B4FD8'], ['#E5FAF5', '#007A57'], ['#FFF3DC', '#8A5A00']]
const initials = (s: string) => s.split(' ').filter((w) => /^[A-Za-z]/.test(w)).slice(0, 2).map((w) => w[0]).join('').toUpperCase()

export default function SipsScreen() {
  const { goals, openSip, openGoal, openNewGoal, setStatus, toast } = useApp()
  const [theme, setTheme] = useTheme()
  const [view, setView] = useView()
  const live = goals.filter((g) => !g.broken)
  const cancelled = goals.filter((g) => g.broken)
  const [showCancelled, setShowCancelled] = useState(false)
  const monthly = live.reduce((a, g) => a + g.monthly, 0)
  const TODAY_DAY = 3

  return (
    <>
      <header className="px-4 pt-4 flex items-center gap-2">
        <Logo />
        <h1 className="flex-1 text-[22px] font-semibold text-ink">Mutual Funds</h1>
        <button aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'} onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="w-9 h-9 flex items-center justify-center text-ink">{theme === 'dark' ? <Sun size={21} /> : <Moon size={21} />}</button>
        <button aria-label={view === 'desktop' ? 'Switch to mobile view' : 'Switch to desktop view'} onClick={() => setView(view === 'desktop' ? 'mobile' : 'desktop')} className="w-9 h-9 flex items-center justify-center text-ink">{view === 'desktop' ? <Phone size={21} /> : <Monitor size={21} />}</button>
        <span className="w-9 h-9 rounded-full bg-[#CFE8E0] text-deep text-[14px] font-bold flex items-center justify-center" aria-label="Profile">V</span>
      </header>

      <nav className="mt-2 flex border-b border-line px-1" aria-label="Mutual funds sections">
        {TABS.map((x) => (
          <span key={x} aria-current={x === 'SIPs' ? 'page' : undefined} aria-disabled={x === 'SIPs' ? undefined : true}
            className={`inert flex-1 min-h-[46px] flex items-center justify-center text-[16px] font-medium relative ${x === 'SIPs' ? 'text-ink' : 'text-mute'}`}>
            {x}
            {x === 'SIPs' && <span className="absolute left-2 right-2 -bottom-px h-[3px] bg-ink rounded-t" />}
          </span>
        ))}
      </nav>

      <div className="scroll bg-white px-4 pt-4 pb-4">
        {(

          <div className="flex flex-col gap-4">
            <section className="rounded-card border border-line">
              <div className="px-4 pt-4 pb-3">
                <div className="text-[12px] tracking-[0.14em] font-medium text-mute">MONTHLY SIP AMOUNT</div>
                <div className="text-[30px] font-semibold text-ink mt-1">{inr(monthly)}</div>
              </div>
              <div className="inert w-full flex items-center gap-3 border-t border-line px-4 min-h-[52px] text-left">
                <Upgrade size={20} color="#5367FF" />
                <span className="flex-1 text-[15px] text-ink">Upgrade all your SIPs to demat</span>
                <ChevronRight size={18} color="#6B6E7E" />
              </div>
            </section>

            <div className="flex items-center justify-between mt-1">
              <h2 className="text-[22px] font-semibold text-ink">Active SIPs ({live.length})</h2>
              <span className="flex items-center gap-1.5 text-[14px] font-medium text-ink"><Bars size={18} /><span className="dash-link">Sort by: Due date</span></span>
            </div>

            <ul className="flex flex-col gap-3">
              {[...live].sort((a, b) => a.day - b.day).map((g, i) => {
                const s = goalSummary(g)
                const [bg, fg] = TILES[i % TILES.length]
                const due = g.day <= TODAY_DAY
                return (
                  <li key={g.id}>
                    <div className="rounded-card border border-line overflow-hidden bg-white">
                      <div className="bg-tint/70 px-3 pt-3 pb-2.5">
                        <button onClick={() => openGoal(g.id)} className="w-full flex items-center gap-3 text-left" aria-label={`${g.name} Gullak, ${Math.round(s.progress)}% of ${inr(g.target)}. Open Gullak`}>
                          <span className="flex-shrink-0 w-[62px] h-[56px] rounded-xl bg-white/80 flex items-center justify-center"><Piggy progress={s.progress} coins={s.rows.length} size={54} mood={moodOf(g, s.rows)} /></span>
                          <span className="flex-1 min-w-0">
                            <span className="flex items-center gap-1.5 text-[14.5px] font-semibold text-ink"><GoalIcon kind={g.icon} size={15} /><span className="truncate">{g.name} Gullak</span>{isOneYear(s.rows) && <span className="text-[10px] font-bold rounded-md px-1.5 py-0.5 bg-[#FFF4D6] text-[#8A5A00] whitespace-nowrap">1 year</span>}</span>
                            <span className="block text-[12.5px] mt-0.5"><b className="font-semibold text-ink">{inr(s.value)}</b> <span className="text-mute">of {inr(g.target)} · {Math.round(s.progress)}%</span></span>
                            <span className="block mt-1.5 h-1.5 rounded-full bg-white"><span className="block h-full rounded-full bg-brand" style={{ width: `${Math.max(2, s.progress)}%` }} /></span>
                          </span>
                        </button>
                        <div className="mt-2.5 flex items-center justify-between gap-2">
                          <Streak rows={s.rows} size={12} label={false} />
                          <AskGullakButton goalId={g.id} />
                        </div>
                      </div>
                      <button onClick={() => openSip(g.id)} className="w-full p-3 text-left flex items-center gap-3" aria-label={`${g.fund}, ${inr(g.monthly)}. Open SIP details`}>
                        <span style={{ background: bg, color: fg }} className="w-11 h-11 rounded-xl font-extrabold flex items-center justify-center text-[13px] flex-shrink-0" aria-hidden="true">{initials(g.fundShort)}</span>
                        <span className="flex-1 min-w-0">
                          <span className="block text-[15px] text-ink leading-snug">{g.fund}</span>
                          <span className="flex items-center gap-2 text-[14px] text-mute mt-0.5">{inr(g.monthly)} <span>•</span>
                            {due ? <span className="flex items-center gap-1 text-deep"><Clock size={15} /> In progress</span> : <span>Due {g.day} Nov</span>}</span>
                        </span>
                        <span className="w-12 rounded-card border border-line text-center py-1 flex-shrink-0">
                          <span className="block text-[18px] font-medium text-ink leading-none">{String(g.day).padStart(2, '0')}</span>
                          <span className="block text-[12px] text-mute mt-1">{MONTHS_SHORT[10]}</span>
                        </span>
                      </button>
                    </div>
                  </li>
                )
              })}
            </ul>

            <button onClick={openNewGoal} className="w-full min-h-[48px] rounded-btn border-[1.5px] border-dashed border-deep text-deep font-bold text-[14px]">+ New Gullak for a goal</button>

            <button onClick={() => setShowCancelled(!showCancelled)} aria-expanded={showCancelled} className="w-full flex items-center justify-between rounded-card border border-line px-4 min-h-[56px] text-[16px] font-medium text-ink">
              View cancelled SIPs ({cancelled.length}) <ChevronRight size={18} color="#6B6E7E" className={showCancelled ? 'rotate-90' : ''} />
            </button>
            {showCancelled && (
              <ul className="flex flex-col gap-3 -mt-2">
                {cancelled.length === 0 && <li className="text-[13px] text-mute px-1">No cancelled SIPs yet.</li>}
                {cancelled.map((g) => (
                  <li key={g.id} className="rounded-card border border-line p-3 flex items-center gap-3">
                    <Piggy progress={goalSummary(g).progress} coins={goalSummary(g).rows.length} size={54} mood="broken" />
                    <span className="flex-1 min-w-0">
                      <span className="block text-[14px] font-semibold text-ink leading-snug">{g.fund}</span>
                      <span className="block text-[12.5px] text-mute">{inr(g.monthly)} a month · {g.name} Gullak · cancelled</span>
                    </span>
                    <button onClick={() => { setStatus(g.id, { broken: false }); toast('SIP restarted: your Gullak is whole again') }} className="min-h-[44px] rounded-btn bg-deep text-white text-[13px] font-bold px-3 whitespace-nowrap">Restart SIP</button>
                  </li>
                ))}
              </ul>
            )}
            <p className="text-[11px] text-mute text-center">Prototype data for illustration. Fund names are samples.<br />Build {__BUILD_ID__}</p>
          </div>
        )}
      </div>

      <nav className="grid grid-cols-4 border-t border-line bg-white pb-2 pt-1" aria-label="Main">
        {[['Stocks', Stock], ['F&O', Fno], ['Mutual Funds', Pie], ['Loans', Loan]].map(([label, Icon]) => {
          const I = Icon as typeof Stock
          const active = label === 'Mutual Funds'
          return (
            <span key={label as string} aria-disabled={active ? undefined : true} className={`inert flex flex-col items-center gap-1 py-1.5 min-h-[56px] text-[12px] font-medium ${active ? 'text-[#5367FF]' : 'text-mute'}`} aria-current={active ? 'page' : undefined}>
              <I size={24} />{label as string}
            </span>
          )
        })}
      </nav>
    </>
  )
}
