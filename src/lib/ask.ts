import type { AskRequest, AskResponse } from '../../shared/rag'
import { ASK_SYSTEM, fallbackReply, plan, validateAnswer } from '../../shared/rag'

const USE_SAMPLE = Boolean(import.meta.env.VITE_SAMPLE)

/** Safe fallback, run in the browser when the AI is off or cannot be reached. It is labelled as a fallback in the chat. */
function local(req: AskRequest, reason: string): AskResponse {
  return fallbackReply(plan(req), req.chunks, reason)
}

/** Preview hosts have no server: the model is called directly, then the SAME guard runs on its reply. */
async function viaSample(req: AskRequest, signal: AbortSignal): Promise<AskResponse> {
  const p = plan(req)
  const sample = await (window as any).claude?.use?.('sample')
  if (!sample) throw new Error('AI is not enabled for this page')
  const res = await sample(`${ASK_SYSTEM}\n\n${p.prompt}`, { modelTier: 'quick', cache: false, signal })
  const v = validateAnswer(String(res?.text ?? ''), req, p.ctx, p.kind)
  if (!v.ok) throw new Error(`reply rejected by the safety check (${v.reason})`)
  return { answer: v.answer, kind: p.kind, source: 'ai' }
}

/** Every question, including the suggested chips, is answered by the model over this goal's retrieved facts. */
export async function askGullak(req: AskRequest, aiOn: boolean): Promise<AskResponse> {
  if (!aiOn) return local(req, 'ai off')
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), USE_SAMPLE ? 30000 : 10000)
  try {
    if (USE_SAMPLE) return await viaSample(req, ctrl.signal)
    const r = await fetch('/api/ask', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(req), signal: ctrl.signal })
    if (!r.ok) throw new Error(`server ${r.status}`)
    return (await r.json()) as AskResponse
  } catch (e: any) {
    return local(req, e?.name === 'AbortError' ? 'timed out' : (e?.message ?? 'error'))
  } finally { clearTimeout(timer) }
}
