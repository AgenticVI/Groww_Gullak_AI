import { useEffect, useMemo, useRef, useState } from 'react'
import { useApp } from '../../App'
import { PigHead } from './PigHead'
import { GoalIcon } from '../ui/Piggy'
import { askGullak } from '../../lib/ask'
import { buildCorpus } from '../../lib/askCorpus'
import { goalSummary, moodOf } from '../../lib/goals'
import { REPLIES, SUGGESTED, type AskKind } from '../../../shared/rag'

interface Msg { role: 'user' | 'bot'; text: string; kind?: AskKind; source?: string }

/** Pill that opens the chatbot. Same bot wherever it is tapped. */
export function AskGullakButton({ goalId, variant = 'pill', label = 'Ask Gullak' }: { goalId: string; variant?: 'pill' | 'full'; label?: string }) {
  const { openAsk } = useApp()
  return (
    <button onClick={(e) => { e.stopPropagation(); openAsk(goalId) }} aria-label={`${label}: chat about this Gullak`}
      className={variant === 'pill'
        ? 'flex items-center gap-1.5 rounded-full border border-[#CCF3E8] bg-white pl-1.5 pr-3 min-h-[40px] text-[13px] font-bold text-deep shadow-sm'
        : 'w-full flex items-center justify-center gap-2 rounded-btn border-[1.5px] border-deep bg-white text-deep min-h-[48px] text-[14px] font-bold'}>
      <span className="w-7 h-7 rounded-full bg-tint flex items-center justify-center"><PigHead size={24} sparkle /></span>{label}
    </button>
  )
}

export default function AskGullak() {
  const { askGoal, closeAsk, goals, aiOn } = useApp()
  const g = goals.find((x) => x.id === askGoal)
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [q, setQ] = useState('')
  const [busy, setBusy] = useState(false)
  const end = useRef<HTMLDivElement>(null)
  const input = useRef<HTMLInputElement>(null)

  const corpus = useMemo(() => (g ? buildCorpus(g) : []), [g])
  const chips = useMemo(() => {
    if (!g) return []
    const s = goalSummary(g)
    return SUGGESTED(g.name, { skipped: moodOf(g, s.rows) === 'sad', dip: s.marketEffect < 0 })
  }, [g])

  useEffect(() => { setMsgs(g ? [{ role: 'bot', text: REPLIES.hello, kind: 'hello' }] : []); setQ(''); setBusy(false) }, [askGoal]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { end.current?.scrollIntoView({ block: 'end' }) }, [msgs, busy])
  useEffect(() => {
    if (!g) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closeAsk()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [g, closeAsk])
  if (!g) return null

  const send = async (text: string) => {
    const question = text.trim()
    if (!question || busy) return
    const history = msgs.filter((m) => m.role === 'user').map((m) => m.text)
    setMsgs((m) => [...m, { role: 'user', text: question }])
    setQ(''); setBusy(true)
    const res = await askGullak({ question, goalName: g.name, otherGoalNames: goals.filter((x) => x.id !== g.id).map((x) => x.name), chunks: corpus, history }, aiOn)
    setMsgs((m) => [...m, { role: 'bot', text: res.answer, kind: res.kind, source: res.source }])
    setBusy(false)
    input.current?.focus()
  }

  return (
    <div className="dsk-c absolute inset-0 z-40 flex flex-col justify-end" role="dialog" aria-modal="true" aria-label={`Ask Gullak about ${g.name}`}>
      <button className="absolute inset-0 bg-black/40" aria-label="Close" onClick={closeAsk} />
      <div className="relative bg-white rounded-t-[20px] dsk-p h-[88%] flex flex-col shadow-2xl">
        <div className="flex items-center gap-2.5 px-4 pt-3 pb-2.5 border-b border-line">
          <span className="w-10 h-10 rounded-full bg-tint flex items-center justify-center flex-shrink-0"><PigHead size={34} sparkle /></span>
          <div className="min-w-0 flex-1">
            <div className="text-[15.5px] font-extrabold text-ink leading-tight">Ask Gullak</div>
            <div className="text-[11.5px] text-mute flex items-center gap-1 truncate"><GoalIcon kind={g.icon} size={13} />{g.name} only · goal Q&amp;A</div>
          </div>
          <button onClick={closeAsk} aria-label="Close chat" className="w-10 h-10 rounded-full text-mute text-[22px] leading-none">×</button>
        </div>

        <div className="flex-1 overflow-y-auto px-3.5 py-3 flex flex-col gap-3" aria-live="polite">
          {msgs.map((m, i) => m.role === 'user' ? (
            <div key={i} className="self-end max-w-[82%] rounded-2xl rounded-br-md bg-deep text-white px-3.5 py-2 text-[13.5px] leading-snug">{m.text}</div>
          ) : (
            <div key={i} className="flex gap-2 items-start max-w-[92%]">
              <span className="w-8 h-8 rounded-full bg-tint flex items-center justify-center flex-shrink-0 mt-0.5"><PigHead size={26} /></span>
              <div className={`rounded-2xl rounded-tl-md px-3.5 py-2 text-[13.5px] leading-[1.5] ${m.kind === 'advice' || m.kind === 'other_goal' || m.kind === 'off_topic' ? 'bg-[#FFF8F4] border border-[#F3C9B0] text-ink' : 'bg-[#F4F6F8] text-ink'}`}>
                {m.text}
                {(m.kind === 'answer' || m.kind === 'decision' || m.kind === 'worry') && <div className="text-[10.5px] text-mute mt-1">{m.source === 'ai' ? 'AI, from your Gullak data' : 'From your Gullak data'}</div>}
              </div>
            </div>
          ))}
          {busy && (
            <div className="flex gap-2 items-center" aria-busy="true">
              <span className="w-8 h-8 rounded-full bg-tint flex items-center justify-center"><PigHead size={26} /></span>
              <div className="rounded-2xl bg-[#F4F6F8] px-3.5 py-2.5 text-[12.5px] text-mute">Checking your Gullak…</div>
            </div>
          )}
          <div ref={end} />
        </div>

        <div className="border-t border-line pt-2">
          <div className="px-3.5 text-[10.5px] font-bold text-mute uppercase tracking-wide mb-1.5">Try asking</div>
          <div className="flex gap-2 overflow-x-auto px-3.5 pb-2" role="group" aria-label="Suggested questions">
            {chips.map((c) => (
              <button key={c} disabled={busy} onClick={() => send(c)}
                className="flex-shrink-0 rounded-full border border-[#CCF3E8] bg-tint/60 text-deep text-[12.5px] font-semibold px-3 min-h-[36px] whitespace-nowrap disabled:opacity-50">{c}</button>
            ))}
          </div>
          <form className="flex items-center gap-2 px-3.5 pb-2" onSubmit={(e) => { e.preventDefault(); send(q) }}>
            <input ref={input} value={q} onChange={(e) => setQ(e.target.value)} maxLength={200} placeholder="Ask about this goal…" aria-label="Your question"
              className="flex-1 min-h-[46px] rounded-full border border-line bg-white px-4 text-[14px] text-ink outline-none focus:border-deep" />
            <button type="submit" disabled={busy || !q.trim()} aria-label="Send" className="w-11 h-11 rounded-full bg-deep text-white flex items-center justify-center disabled:opacity-40">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
            </button>
          </form>
          <p className="text-center text-[10.5px] text-mute px-4 pb-3">Answers only about this goal's progress and streak. Not investment advice.</p>
        </div>
      </div>
    </div>
  )
}
