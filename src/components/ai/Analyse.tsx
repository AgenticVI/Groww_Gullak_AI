import { useEffect, useState } from 'react'
import type { InsightType } from '../../../shared/types'
import { useInsight } from '../../lib/insights'
import { useApp } from '../../App'
import { InsightGlyph } from './InsightCard'

/** Small pig with an AI sparkle. */
export function SparklePig({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 26" aria-hidden="true">
      <rect x="6" y="19" width="3.2" height="5" rx="1.4" fill="#F3C6B0" />
      <rect x="15" y="19" width="3.2" height="5" rx="1.4" fill="#F3C6B0" />
      <path d="M7 9 L9 4 L13 8Z" fill="#F3C6B0" />
      <ellipse cx="13" cy="15" rx="10" ry="7.5" fill="#FFF1EA" stroke="#E0A68C" strokeWidth="1.4" />
      <rect x="21" y="12.5" width="5" height="5" rx="2.2" fill="#F3C6B0" stroke="#E0A68C" strokeWidth="1" />
      <circle cx="19" cy="12" r="0.9" fill="#44475B" />
      <rect x="10" y="7" width="6" height="1.6" rx="0.8" fill="#B07A62" />
      <path d="M22 1 L23.2 4 L26.2 5.2 L23.2 6.4 L22 9.4 L20.8 6.4 L17.8 5.2 L20.8 4Z" fill="#00B386" />
    </svg>
  )
}

function Body({ type, data, ctx, loadingText }: { type: InsightType; data: Record<string, any>; ctx: string; loadingText: string }) {
  const { risk, aiOn } = useApp()
  const { insight, loading, source } = useInsight(type, data, ctx, risk, aiOn)
  return (
    <div aria-live="polite">
      {loading && (
        <div className="flex flex-col gap-2 py-1" aria-busy="true">
          <div className="flex items-center gap-2 text-[12.5px] font-semibold text-deep"><SparklePig size={18} />{loadingText}</div>
          <div className="sk h-3.5 w-11/12" /><div className="sk h-3.5 w-9/12" /><div className="sk h-3.5 w-7/12" />
        </div>
      )}
      {!loading && insight && (
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center gap-2.5">
            <InsightGlyph icon={insight.icon} />
            <span className="text-[14.5px] font-bold text-ink">{insight.title}</span>
            <span className="ml-auto text-[10.5px] font-bold rounded-md px-1.5 py-0.5 bg-tint text-[#007A57]">{source === 'ai' ? 'AI' : 'Auto'}</span>
          </div>
          <ul className="flex flex-col gap-2 pl-1">
            {insight.bullets.map((b, i) => (
              <li key={i} className="flex gap-2 text-[13px] leading-[1.5] text-ink">
                <span className="mt-[7px] w-1.5 h-1.5 rounded-full bg-brand flex-shrink-0" aria-hidden="true" />
                <span>{b}</span>
              </li>
            ))}
          </ul>
          <p className="text-[11px] text-mute border-t border-line pt-2">
            {source === 'ai' ? 'AI-generated' : 'Generated from your numbers'} · goal tracking, not investment advice
          </p>
        </div>
      )}
    </div>
  )
}

/**
 * The AI only runs when the user taps the button, so nothing is generated until then.
 * Changing `ctx` (e.g. another month) puts the button back.
 */
export default function AnalyseButton({ label, type, data, ctx, loadingText = 'Analysing your Gullak…', compact = false }: {
  label: string; type: InsightType; data: Record<string, any>; ctx: string; loadingText?: string; compact?: boolean
}) {
  const [run, setRun] = useState(false)
  useEffect(() => setRun(false), [ctx])
  if (!run)
    return (
      <button onClick={(e) => { e.stopPropagation(); setRun(true) }}
        className={`w-full flex items-center justify-center gap-2 rounded-btn border-[1.5px] border-deep bg-tint/60 text-deep font-bold ${compact ? 'min-h-[44px] text-[13.5px]' : 'min-h-[50px] text-[14.5px]'}`}>
        <SparklePig size={compact ? 22 : 26} />{label}
      </button>
    )
  return (
    <div className="rounded-card border border-[#CCF3E8] bg-tint/40 p-3" onClick={(e) => e.stopPropagation()}>
      <Body type={type} data={data} ctx={ctx} loadingText={loadingText} />
    </div>
  )
}
