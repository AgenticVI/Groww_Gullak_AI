import { useEffect, useRef, useState } from 'react'
import type { Insight, InsightResponse, InsightType, Risk } from '../../shared/types'
import { buildTemplate } from '../../shared/templates'
import { validateInsight } from '../../shared/guard'
import { jsonOnlyPrompt } from '../../shared/prompts'

export interface InsightState {
  insight: Insight | null
  loading: boolean
  source: 'ai' | 'template' | null
  error?: string
}

const USE_SAMPLE = Boolean(import.meta.env.VITE_SAMPLE)
const CLIENT_TIMEOUT = USE_SAMPLE ? 30000 : 10000 // server has its own 5 s Gemini budget
const mem = new Map<string, InsightResponse>()

const hash = (s: string) => {
  let h = 5381
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0
  return (h >>> 0).toString(36)
}
const keyOf = (type: InsightType, ctx: string, risk: Risk, data: unknown) =>
  `banyan:v1:${type}:${ctx}:${risk}:${hash(JSON.stringify(data))}`

const lsGet = (k: string): InsightResponse | null => {
  try { const v = localStorage.getItem(k); return v ? (JSON.parse(v) as InsightResponse) : null } catch { return null }
}
const lsSet = (k: string, v: InsightResponse) => { try { localStorage.setItem(k, JSON.stringify(v)) } catch { /* private mode etc. */ } }

/** Fetch (or fall back to) an insight. `ctx` is the month / horizon the facts belong to (part of the cache key). */
export function useInsight(type: InsightType, data: Record<string, any> | null, ctx: string, risk: Risk, aiOn: boolean, nonce = 0): InsightState {
  const [state, setState] = useState<InsightState>({ insight: null, loading: false, source: null })
  const seq = useRef(0)

  useEffect(() => {
    if (!data) { setState({ insight: null, loading: false, source: null }); return }
    const my = ++seq.current
    const template = (error?: string) => ({ insight: buildTemplate(type, data, risk), loading: false, source: 'template' as const, error })

    if (!aiOn) { setState(template('ai off')); return }

    const k = keyOf(type, ctx, risk, data)
    const cached = mem.get(k) ?? lsGet(k)
    if (cached) { mem.set(k, cached); setState({ insight: cached.insight, loading: false, source: cached.source }); return }

    setState({ insight: null, loading: true, source: null })
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), CLIENT_TIMEOUT)
    const request = USE_SAMPLE ? viaSample(type, data, risk, ctrl.signal) : fetch('/api/insight', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ type, data, riskAppetite: risk }),
      signal: ctrl.signal,
    })
      .then((r) => { if (!r.ok) throw new Error(String(r.status)); return r.json() as Promise<InsightResponse> })
    request
      .then((res) => {
        if (my !== seq.current) return
        // Only real AI answers are cached; template answers are cheap to rebuild and we want to retry AI later.
        if (res.source === 'ai') { mem.set(k, res); lsSet(k, res) }
        setState({ insight: res.insight, loading: false, source: res.source })
      })
      .catch((e) => { if (my === seq.current) setState(template(e?.name === 'AbortError' ? 'timed out' : (e?.message ?? 'error'))) })
      .finally(() => clearTimeout(timer))
    return () => { ctrl.abort(); clearTimeout(timer) }
  }, [type, ctx, risk, aiOn, nonce, data ? JSON.stringify(data) : '']) // eslint-disable-line react-hooks/exhaustive-deps

  return state
}

/** Preview hosts (the published artifact) have no server: ask Claude directly, then run the SAME guardrails. */
async function viaSample(type: InsightType, data: Record<string, any>, risk: Risk, signal: AbortSignal): Promise<InsightResponse> {
  const claude = (window as any).claude
  const sample = await claude?.use?.('sample')
  if (!sample) throw new Error('AI is not enabled for this page')
  const res = await sample(jsonOnlyPrompt({ type, data, riskAppetite: risk }), { modelTier: 'quick', cache: false, signal })
  const text = String(res?.text ?? '').replace(/^```(?:json)?/i, '').replace(/```$/, '').trim()
  const raw = JSON.parse(text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1))
  const v = validateInsight(raw, data, type)
  if (!v.ok) throw new Error(v.reason)
  return { insight: v.insight, source: 'ai' }
}
