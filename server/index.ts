import 'dotenv/config'
import express from 'express'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { getInsight, parseRequest } from './insight'
import { getAnswer, parseAsk } from './ask'

const app = express()
app.use(express.json({ limit: '64kb' }))

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, ai: Boolean(process.env.GEMINI_API_KEY), model: process.env.GEMINI_MODEL || 'gemini-2.5-flash' })
})

app.post('/api/insight', async (req, res) => {
  const parsed = parseRequest(req.body)
  if (!parsed) return res.status(400).json({ error: 'bad request' })
  res.json(await getInsight(parsed))
})

app.post('/api/ask', async (req, res) => {
  const parsed = parseAsk(req.body)
  if (!parsed) return res.status(400).json({ error: 'bad request' })
  res.json(await getAnswer(parsed))
})

// Serve the built client when it exists (npm run build && npm start).
const dist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../dist')
if (fs.existsSync(dist)) {
  app.use(express.static(dist))
  // SPA fallback (Express 5 has no bare '*' route pattern)
  app.use((req, res, next) => (req.method === 'GET' && !req.path.startsWith('/api') ? res.sendFile(path.join(dist, 'index.html')) : next()))
}

const port = Number(process.env.PORT) || 8787
app.listen(port, () => console.log(`Banyan server on http://localhost:${port}  (AI ${process.env.GEMINI_API_KEY ? 'on' : 'off → templates'})`))
