// Vercel serverless function. The static app posts { prompt, stream } here.
// The Gemini key stays on the server.
import { setDefaultResultOrder } from 'node:dns'

setDefaultResultOrder('ipv4first')

const MODEL = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite'
const MAX_PROMPT = 120_000

function key() {
  return process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || ''
}

function safeMessage(err, secret) {
  let message = err instanceof Error ? err.message : String(err || 'Gemini request failed')
  if (secret) message = message.split(secret).join('[key]')
  return message.slice(0, 240)
}

function partsText(json) {
  const parts = json?.candidates?.[0]?.content?.parts ?? []
  return parts.filter((part) => part && !part.thought).map((part) => part.text ?? '').join('')
}

async function gemini(prompt, stream) {
  const secret = key()
  const action = stream ? 'streamGenerateContent?alt=sse' : 'generateContent'
  const model = MODEL
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:${action}`, {
    method: 'POST',
    signal: AbortSignal.timeout(40000),
    headers: { 'content-type': 'application/json', 'x-goog-api-key': secret },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.4, maxOutputTokens: 1024 },
    }),
  })
  if (!res.ok) {
    let message = `Gemini error ${res.status}`
    try {
      const body = await res.json()
      if (body?.error?.message) message = body.error.message
    } catch { /* keep the status */ }
    throw new Error(safeMessage(message, secret))
  }
  return res
}

async function writeStream(res, upstream) {
  res.writeHead(200, {
    'content-type': 'text/plain; charset=utf-8',
    'cache-control': 'no-cache, no-transform',
  })
  const reader = upstream.body.getReader()
  const decode = new TextDecoder()
  let buf = ''
  let wrote = false
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buf += decode.decode(value, { stream: true })
    let nl
    while ((nl = buf.indexOf('\n')) !== -1) {
      const line = buf.slice(0, nl).trim()
      buf = buf.slice(nl + 1)
      if (!line.startsWith('data:')) continue
      const data = line.slice(5).trim()
      if (!data || data === '[DONE]') continue
      try {
        const text = partsText(JSON.parse(data))
        if (text) {
          wrote = true
          res.write(text)
        }
      } catch { /* ignore a partial SSE line */ }
    }
  }
  if (!wrote) res.write('')
  res.end()
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'POST only' })
    return
  }
  let body = req.body
  if (typeof body === 'string') {
    try { body = JSON.parse(body) } catch { body = null }
  }
  const prompt = body?.prompt
  if (typeof prompt !== 'string' || !prompt.trim() || prompt.length > MAX_PROMPT) {
    res.status(400).json({ error: 'bad request' })
    return
  }
  const secret = key()
  if (!secret) {
    res.status(500).json({ error: 'GEMINI_API_KEY is not set' })
    return
  }
  const origin = process.env.ALLOWED_ORIGIN
  if (origin) res.setHeader('Access-Control-Allow-Origin', origin)

  try {
    const upstream = await gemini(prompt, Boolean(body.stream))
    if (body.stream) {
      await writeStream(res, upstream)
      return
    }
    const json = await upstream.json()
    const text = partsText(json)
    if (!text.trim()) throw new Error('empty answer')
    res.status(200).json({ text })
  } catch (err) {
    if (res.headersSent) {
      res.end()
      return
    }
    res.status(502).json({ error: safeMessage(err, secret) })
  }
}
