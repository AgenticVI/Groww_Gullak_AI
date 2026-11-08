import { ASK_SYSTEM, askPrompt, classify, ruleReply, templateAnswer, validateAnswer, type AskRequest, type AskResponse } from '../shared/rag'

export const ASK_TIMEOUT_MS = Number(process.env.GEMINI_TIMEOUT_MS) || 6000

export function parseAsk(body: any): AskRequest | null {
  if (!body || typeof body !== 'object') return null
  const { question, goalName, otherGoalNames, chunks, history } = body
  if (typeof question !== 'string' || !question.trim() || question.length > 300) return null
  if (typeof goalName !== 'string' || !goalName || goalName.length > 80) return null
  if (!Array.isArray(chunks) || chunks.length === 0 || chunks.length > 60) return null
  const cs = chunks.map((c: any) => ({ id: String(c?.id ?? '').slice(0, 40), title: String(c?.title ?? '').slice(0, 120), text: String(c?.text ?? '').slice(0, 600) }))
  return {
    question: question.trim(), goalName,
    otherGoalNames: Array.isArray(otherGoalNames) ? otherGoalNames.filter((x: unknown) => typeof x === 'string').slice(0, 10) : [],
    chunks: cs,
    history: Array.isArray(history) ? history.filter((x: unknown) => typeof x === 'string').slice(-3) : [],
  }
}

type FetchLike = typeof fetch
async function callGemini(prompt: string, opts: { fetchImpl?: FetchLike; baseUrl?: string }): Promise<string> {
  const key = process.env.GEMINI_API_KEY
  if (!key) throw new Error('no GEMINI_API_KEY')
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash'
  const base = opts.baseUrl ?? process.env.GEMINI_BASE_URL ?? 'https://generativelanguage.googleapis.com'
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), ASK_TIMEOUT_MS)
  try {
    const gen: Record<string, unknown> = { temperature: 0.3, maxOutputTokens: 220 }
    if (/gemini-2\.5/.test(model)) gen.thinkingConfig = { thinkingBudget: 0 }
    const res = await (opts.fetchImpl ?? fetch)(`${base}/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
      method: 'POST', signal: ctrl.signal,
      headers: { 'content-type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({ systemInstruction: { parts: [{ text: ASK_SYSTEM }] }, contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig: gen }),
    })
    if (!res.ok) throw new Error(`gemini http ${res.status}`)
    const json: any = await res.json()
    return json?.candidates?.[0]?.content?.parts?.map((p: any) => p.text ?? '').join('') ?? ''
  } finally { clearTimeout(timer) }
}

/** Retrieve → scope/advice rules → (optional) Gemini over only the retrieved facts → guard → template fallback. */
export async function getAnswer(req: AskRequest, opts: { fetchImpl?: FetchLike; baseUrl?: string } = {}): Promise<AskResponse> {
  const { kind, hits } = classify(req)
  if (kind !== 'answer') return ruleReply(kind, req.chunks)
  const template = (reason: string): AskResponse => ({ answer: templateAnswer(hits), kind: 'answer', source: 'template', reason })
  if (!process.env.GEMINI_API_KEY) return template('ai disabled (no key)')
  try {
    const v = validateAnswer(await callGemini(askPrompt(req, hits), opts), req, hits)
    return v.ok ? { answer: v.answer, kind: 'answer', source: 'ai' } : template(`rejected: ${v.reason}`)
  } catch (e: any) {
    return template(e?.name === 'AbortError' ? 'timeout' : `error: ${e?.message ?? e}`)
  }
}
