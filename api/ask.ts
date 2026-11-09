// Vercel / Netlify-style serverless entry. Same logic as server/index.ts.
import { getAnswer, parseAsk } from '../server/ask'

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' })
  const parsed = parseAsk(typeof req.body === 'string' ? JSON.parse(req.body) : req.body)
  if (!parsed) return res.status(400).json({ error: 'bad request' })
  res.status(200).json(await getAnswer(parsed))
}
