import { useEffect, useState } from 'react'
import type { InsightIcon, InsightType } from '../../../shared/types'
import { useInsight } from '../../lib/insights'
import { useApp } from '../../App'
import { ChevronRight } from '../ui/icons'
import { CoinShape, StormShape } from '../tree/shapes'

export interface PageSpec {
  type: InsightType
  data: Record<string, any>
  ctx: string
  /** true = never call the model (e.g. a leaf with no market result yet); use the template */
  local?: boolean
}

export function InsightGlyph({ icon, size = 36 }: { icon: InsightIcon; size?: number }) {
  const bg = icon === 'storm' ? '#EEF1F5' : icon === 'coin' ? '#FFF6DA' : '#E5FAF5'
  return (
    <span style={{ width: size, height: size, background: bg }} className="rounded-xl flex items-center justify-center flex-shrink-0">
      <svg width={size * 0.7} height={size * 0.7} viewBox="-12 -12 24 24" aria-hidden="true">
        {icon === 'storm' && <StormShape s={22} />}
        {icon === 'coin' && <CoinShape r={8} plus />}
        {icon === 'leaf' && (
          <g>
            <path d="M-8 -6 L-6 -11 L-2 -7Z" fill="#F3C6B0" />
            <path d="M8 -6 L6 -11 L2 -7Z" fill="#F3C6B0" />
            <circle cx="0" cy="1" r="9" fill="#FFF1EA" stroke="#E0A68C" strokeWidth="1.4" />
            <ellipse cx="0" cy="4" rx="4.6" ry="3.4" fill="#F3C6B0" stroke="#E0A68C" strokeWidth="1" />
            <circle cx="-1.7" cy="4" r="0.8" fill="#B07A62" /><circle cx="1.7" cy="4" r="0.8" fill="#B07A62" />
            <circle cx="-3.6" cy="-2" r="1.1" fill="#44475B" /><circle cx="3.6" cy="-2" r="1.1" fill="#44475B" />
            <path d="M9 -9 L10 -6.4 L12.6 -5.4 L10 -4.4 L9 -1.8 L8 -4.4 L5.4 -5.4 L8 -6.4Z" fill="#00B386" />
          </g>
        )}
      </svg>
    </span>
  )
}

function Skeleton() {
  return (
    <div className="flex flex-col gap-2 py-1" aria-busy="true" aria-label="Loading insight">
      <div className="sk h-3.5 w-11/12" />
      <div className="sk h-3.5 w-8/12" />
    </div>
  )
}

interface Props {
  heading: string
  sub?: string
  pages: PageSpec[]
  startIndex?: number
}

/** "Banyan Whispers" / "Before you decide" card. Only the visible page is requested. */
export default function InsightCard({ heading, sub, pages, startIndex = 0 }: Props) {
  const { risk, aiOn } = useApp()
  const [idx, setIdx] = useState(startIndex)
  useEffect(() => setIdx(startIndex), [startIndex, pages[0]?.ctx]) // eslint-disable-line react-hooks/exhaustive-deps
  const page = pages[Math.min(idx, pages.length - 1)]
  const { insight, loading, source } = useInsight(page.type, page.data, page.ctx, risk, aiOn && !page.local)

  return (
    <section className="rounded-card border border-line bg-white p-4 flex flex-col gap-3" aria-label={heading}>
      <header className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="text-[15px] font-bold leading-tight text-ink">{heading}</h3>
          {sub && <p className="text-[12px] text-mute mt-0.5">{sub}</p>}
        </div>
        {pages.length > 1 && (
          <button
            className="flex items-center gap-1 text-[12px] font-semibold text-mute min-h-[44px] min-w-[44px] -mt-2 -mr-2 justify-center"
            onClick={() => setIdx((idx + 1) % pages.length)}
            aria-label={`Next insight, ${idx + 1} of ${pages.length}`}
          >
            {idx + 1}/{pages.length}
            <ChevronRight size={16} />
          </button>
        )}
      </header>

      <div className="min-h-[92px]" aria-live="polite">
        {loading && <Skeleton />}
        {!loading && insight && (
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center gap-2.5">
              <InsightGlyph icon={insight.icon} />
              <span className="text-[14.5px] font-bold text-ink">{insight.title}</span>
            </div>
            <ul className="flex flex-col gap-2 pl-1">
              {insight.bullets.map((b, i) => (
                <li key={i} className="flex gap-2 text-[13px] leading-[1.5] text-ink">
                  <span className="mt-[7px] w-1.5 h-1.5 rounded-full bg-brand flex-shrink-0" aria-hidden="true" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <p className="text-[11px] text-mute border-t border-line pt-2">
        {source === 'template' ? 'Generated from your numbers' : 'AI-generated'} · educational, not investment advice
      </p>
    </section>
  )
}
