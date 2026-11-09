import { createHash } from 'node:crypto'
import { INSIGHT_TYPES, type Insight, type InsightRequest, type InsightResponse, type InsightType, type Risk } from '../shared/types'
import { buildTemplate } from '../shared/templates'
import { validateInsight } from '../shared/guard'
import { SYSTEM_PROMPT, userPrompt } from '../shared/prompts'

export { SYSTEM_PROMPT }

const RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    title: { type: 'STRING', description: 'Short title, at most 6 words' },
    icon: { type: 'STRING', enum: ['storm', 'coin', 'leaf'] },
    bullets: { type: 'ARRAY', items: { type: 'STRING' }, minItems: 2, maxItems: 3 },
  },
  required: ['title', 'icon', 'bullets'],
}

export const TIMEOUT_MS = Number(process.env.GEMINI_TIMEOUT_MS) || 5000
const cache = new Map<string, Insight>()
const keyOf = (r: InsightRequest) =>
  `${r.type}|${r.riskAppetite}|${createHash('sha1').update(JSON.stringify(r.data)).digest('hex').slice(0, 12)}`

export function parseRequest(body: any): InsightRequest | null {
  if (!body || typeof body !== 'object') return null
  const { type, data, riskAppetite } = body
  if (!INSIGHT_TYPES.includes(type)) return null
  if (!data || typeof data !== 'object' || Array.isArray(data)) return null
  if (JSON.stringify(data).length > 8000) return null
  return { type, data, riskAppetite: riskAppetite === 'medium' ? 'medium' : 'low' }
}

type FetchLike = typeof fetch

export async function callGemini(req: InsightRequest, opts: { fetchImpl?: FetchLike; baseUrl?: string } = {}): Promise<unknown> {
  const key = process.env.GEMINI_API_KEY
  if (!key) throw new Error('no GEMINI_API_KEY')
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash'
  const base = opts.baseUrl ?? process.env.GEMINI_BASE_URL ?? 'https://generativelanguage.googleapis.com'
  const f = opts.fetchImpl ?? fetch
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS)
  try {
    const gen: Record<string, unknown> = {
      responseMimeType: 'application/json',
      responseSchema: RESPONSE_SCHEMA,
      temperature: 0.4,
      maxOutputTokens: 600,
    }
    if (/gemini-2\.5/.test(model)) gen.thinkingConfig = { thinkingBudget: 0 } // keep latency inside the 5 s budget
    const res = await f(`${base}/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
      method: 'POST',
      signal: ctrl.signal,
      headers: { 'content-type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: userPrompt(req),
              },
            ],
          },
        ],
        generationConfig: gen,
      }),
    })
    if (!res.ok) throw new Error(`gemini http ${res.status}`)
    const json: any = await res.json()
    const text = json?.candidates?.[0]?.content?.parts?.map((p: any) => p.text ?? '').join('') ?? ''
    return JSON.parse(text)
  } finally {
    clearTimeout(timer)
  }
}

export async function getInsight(
  req: InsightRequest,
  opts: { fetchImpl?: FetchLike; baseUrl?: string } = {},
): Promise<InsightResponse> {
  const k = keyOf(req)
  const hit = cache.get(k)
  if (hit) return { insight: hit, source: 'ai' }
  const template = (reason: string): InsightResponse => ({
    insight: buildTemplate(req.type, req.data, req.riskAppetite),
    source: 'template',
    reason,
  })
  if (!process.env.GEMINI_API_KEY) return template('ai disabled (no key)')
  try {
    const raw = await callGemini(req, opts)
    const v = validateInsight(raw, req.data, req.type)
    if (!v.ok) return template(`rejected: ${v.reason}`)
    cache.set(k, v.insight)
    return { insight: v.insight, source: 'ai' }
  } catch (e: any) {
    return template(e?.name === 'AbortError' ? 'timeout' : `error: ${e?.message ?? e}`)
  }
}
