import type { Insight, InsightType } from './types'

/** Phrases that read as advice or a promise. Any hit => reject AI output, use template. */
const ADVICE_PATTERNS: RegExp[] = [
  /\byou\s+(should|must|need to|ought to|have to|could consider|might want to|may want to|had better)\b/i,
  /\b(i|we)\s+(recommend|suggest|advise)\b/i,
  /\b(consider|try)\s+(pausing|stopping|cancel|cancelling|canceling|selling|buying|investing|increasing|switching|redeeming)\b/i,
  /(^|[.!?;:]\s+|\n)(buy|sell|invest|redeem|stop|cancel|pause|continue|keep|switch|hold|stay|increase|decrease|top up|add)\b/i,
  /\b(buy|sell|invest|redeem|switch)\s+(now|more|again|the dip|this|it|that|units|shares|funds?)\b/i,
  /\b(stop|cancel|pause|skip|continue)\s+(your|the|this)\s+(sip|investment|instalment|installment)\b/i,
  /\b(better|best|ideal|right)\s+(time|moment)\s+to\b/i,
  /\bguarantee(d|s)?\b/i,
  /\b(assured|sure[- ]?shot|risk[- ]?free|no risk|can'?t lose|cannot lose)\b/i,
  /\bwill\s+(definitely|certainly|surely|always)\b/i,
  /\bwill\s+(grow|double|triple|reach|become|make you|earn)\b/i,
  /\b(lakh|lakhs|crore|crores)\b/i,
]

export function findAdvice(text: string): string | null {
  for (const re of ADVICE_PATTERNS) if (re.test(text)) return re.source
  return null
}

/** Every number found in the request data (numbers + digits inside strings). */
export function collectNumbers(data: unknown): number[] {
  const out: number[] = []
  const walk = (v: unknown) => {
    if (typeof v === 'number' && Number.isFinite(v)) {
      out.push(Math.abs(v))
    } else if (typeof v === 'string') {
      for (const m of v.matchAll(/\d[\d,]*(?:\.\d+)?/g)) {
        const n = Number(m[0].replace(/,/g, ''))
        if (Number.isFinite(n)) out.push(n)
      }
    } else if (Array.isArray(v)) v.forEach(walk)
    else if (v && typeof v === 'object') Object.values(v).forEach(walk)
  }
  walk(data)
  return out
}

const near = (allowed: number[], x: number, tol: number) => allowed.some((a) => Math.abs(a - x) <= tol)

/**
 * Checks that every ₹ amount, every % and every other "specific" number
 * (decimals or >= 100, e.g. units / NAV / years) in the text appears in the input data.
 * Returns the first offending token or null.
 */
export function findInventedNumber(text: string, data: unknown): string | null {
  const allowed = collectNumbers(data)
  for (const m of text.matchAll(/(₹\s?)?(\d[\d,]*(?:\.\d+)?)(\s?%)?/g)) {
    const raw = m[2]
    const x = Number(raw.replace(/,/g, ''))
    if (!Number.isFinite(x)) continue
    const isRupee = !!m[1]
    const isPct = !!m[3]
    const hasDec = raw.includes('.')
    if (isRupee) {
      if (!near(allowed, x, hasDec ? 0.0051 : 1)) return m[0]
    } else if (isPct) {
      if (!near(allowed, x, 0.051)) return m[0]
    } else if (hasDec || x >= 100) {
      if (!near(allowed, x, hasDec ? 0.0051 : 0.5)) return m[0]
    }
  }
  return null
}

const wordCount = (s: string) => s.trim().split(/\s+/).filter(Boolean).length

export type Validation = { ok: true; insight: Insight } | { ok: false; reason: string }

export function validateInsight(raw: unknown, data: unknown, _type?: InsightType): Validation {
  if (!raw || typeof raw !== 'object') return { ok: false, reason: 'not an object' }
  const r = raw as Record<string, unknown>
  if (typeof r.title !== 'string' || !r.title.trim()) return { ok: false, reason: 'bad title' }
  if (r.icon !== 'storm' && r.icon !== 'coin' && r.icon !== 'leaf') return { ok: false, reason: 'bad icon' }
  if (!Array.isArray(r.bullets) || r.bullets.length < 2 || r.bullets.length > 3)
    return { ok: false, reason: 'bullets must be 2-3 items' }
  const bullets: string[] = []
  for (const b of r.bullets) {
    if (typeof b !== 'string' || !b.trim()) return { ok: false, reason: 'bad bullet' }
    if (wordCount(b) > 22) return { ok: false, reason: 'bullet longer than 22 words' }
    bullets.push(b.trim())
  }
  const title = r.title.trim()
  if (wordCount(title) > 8) return { ok: false, reason: 'title too long' }
  const all = [title, ...bullets].join('\n')
  const advice = findAdvice(all)
  if (advice) return { ok: false, reason: `advice phrase: ${advice}` }
  const invented = findInventedNumber(all, data)
  if (invented) return { ok: false, reason: `number not in input: ${invented}` }
  return { ok: true, insight: { title, icon: r.icon, bullets } }
}
