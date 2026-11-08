import type { AskRequest, AskResponse } from '../../shared/rag'
import { ASK_SYSTEM, askPrompt, classify, ruleReply, templateAnswer, validateAnswer } from '../../shared/rag'

const USE_SAMPLE = Boolean(import.meta.env.VITE_SAMPLE)

/** Same pipeline as the server, run in the browser: used offline, when AI is off, and in preview hosts with no server. */
function local(req: AskRequest, reason: string): AskResponse {
  const { kind, hits } = classify(req)
  if (kind !== 'answer') return ruleReply(kind, req.chunks)
  return { answer: templateAnswer(hits), kind, source: 'template', reason }
}

async function viaSample(req: AskRequest, signal: AbortSignal): Promise<AskResponse> {
  const { kind, hits } = classify(req)
  if (kind !== 'answer') return ruleReply(kind, req.chunks)
  const sample = await (window as any).claude?.use?.('sample')
  if (!sample) throw new Error('no sample capability')
  const res = await sample(`${ASK_SYSTEM}\n\n${askPrompt(req, hits)}`, { modelTier: 'quick', cache: false, signal })
  const v = validateAnswer(String(res?.text ?? ''), req, hits)
  if (!v.ok) throw new Error(v.reason)
  return { answer: v.answer, kind: 'answer', source: 'ai' }
}

export async function askGullak(req: AskRequest, aiOn: boolean): Promise<AskResponse> {
  if (!aiOn) return local(req, 'ai off')
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), USE_SAMPLE ? 25000 : 8000)
  try {
    if (USE_SAMPLE) return await viaSample(req, ctrl.signal)
    const r = await fetch('/api/ask', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(req), signal: ctrl.signal })
    if (!r.ok) throw new Error(String(r.status))
    return (await r.json()) as AskResponse
  } catch (e: any) {
    return local(req, e?.message ?? 'error')
  } finally { clearTimeout(timer) }
}
