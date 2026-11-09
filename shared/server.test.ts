import test from 'node:test'
import assert from 'node:assert/strict'
import http from 'node:http'
import type { AddressInfo } from 'node:net'

process.env.GEMINI_API_KEY = 'test-key'
process.env.GEMINI_TIMEOUT_MS = '400'
const { getInsight, parseRequest } = await import('../server/insight')
const { stormData } = await import('../src/lib/insightData')
const { INSTALMENTS } = await import('../src/data/sip')

const data = stormData(INSTALMENTS[21])
const req = () => ({ type: 'storm_perspective' as const, data: { ...data, nonce: Math.random() }, riskAppetite: 'low' as const })

let reply: (res: http.ServerResponse) => void = () => {}
let hits = 0
const server = http.createServer((rq, res) => {
  hits++
  let body = ''
  rq.on('data', (c) => (body += c))
  rq.on('end', () => {
    const j = JSON.parse(body)
    assert.equal(rq.headers['x-goog-api-key'], 'test-key')
    assert.equal(j.generationConfig.responseMimeType, 'application/json')
    assert.ok(j.generationConfig.responseSchema)
    assert.match(j.systemInstruction.parts[0].text, /You are Banyan/)
    reply(res)
  })
})
await new Promise<void>((r) => server.listen(0, r))
const baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
const send = (obj: unknown) => (res: http.ServerResponse) => {
  res.setHeader('content-type', 'application/json')
  res.end(JSON.stringify({ candidates: [{ content: { parts: [{ text: typeof obj === 'string' ? obj : JSON.stringify(obj) }] } }] }))
}

test('valid grounded AI output is returned and cached', async () => {
  reply = send({ title: 'Weathering October', icon: 'storm', bullets: [`October fell 1.8%, about ₹${data.dipAmount} on paper.`, 'Your ₹2,000 SIP still joined the tree this month.'] })
  const r = req()
  const a = await getInsight(r, { baseUrl })
  assert.equal(a.source, 'ai', a.reason ?? '')
  const before = hits
  const b = await getInsight(r, { baseUrl })
  assert.equal(b.source, 'ai')
  assert.equal(hits, before, 'second call served from cache')
})
test('invented number → template', async () => {
  reply = send({ title: 'Storm', icon: 'storm', bullets: ['October fell 7.7% overall.', 'Your ₹2,000 SIP continues.'] })
  const r = await getInsight(req(), { baseUrl })
  assert.equal(r.source, 'template'); assert.match(r.reason!, /number not in input/)
})
test('advice phrase → template', async () => {
  reply = send({ title: 'Storm', icon: 'storm', bullets: ['You should keep investing now.', 'Your ₹2,000 SIP is fine.'] })
  const r = await getInsight(req(), { baseUrl })
  assert.equal(r.source, 'template'); assert.match(r.reason!, /advice/)
})
test('invalid JSON → template', async () => {
  reply = send('this is not json')
  assert.equal((await getInsight(req(), { baseUrl })).source, 'template')
})
test('HTTP 500 → template', async () => {
  reply = (res) => { res.statusCode = 500; res.end('boom') }
  assert.equal((await getInsight(req(), { baseUrl })).source, 'template')
})
test('timeout → template', async () => {
  reply = () => { /* never answers */ }
  const r = await getInsight(req(), { baseUrl })
  assert.equal(r.source, 'template'); assert.equal(r.reason, 'timeout')
})
test('no key → template; bad request rejected', async () => {
  const k = process.env.GEMINI_API_KEY; delete process.env.GEMINI_API_KEY
  assert.equal((await getInsight(req(), { baseUrl })).source, 'template')
  process.env.GEMINI_API_KEY = k!
  assert.equal(parseRequest({ type: 'nope', data: {} }), null)
  assert.equal(parseRequest({ type: 'cancel_check', data: [] }), null)
})
test.after(() => server.close())
