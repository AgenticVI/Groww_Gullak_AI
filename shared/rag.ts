import { findAdvice, findInventedNumber } from './guard'

/** One retrievable fact about ONE goal Gullak. Text is already formatted in plain Indian-style sentences. */
export interface Chunk {
  id: string
  title: string
  text: string
}
export interface AskRequest {
  question: string
  goalName: string
  otherGoalNames: string[]
  chunks: Chunk[]
  history?: string[] // previous user questions (for follow-ups like "and March?")
}
export type AskKind = 'answer' | 'advice' | 'decision' | 'worry' | 'other_goal' | 'off_topic' | 'hello'
export interface AskResponse {
  answer: string
  kind: AskKind
  source: 'ai' | 'template' | 'rule'
  reason?: string
}

// ---------------------------------------------------------------- text helpers
const STOP = new Set(('a an the is are was were be been am do does did to of in on at for and or but if so it its this that these those my me i we you your our their he she they them what which who whom how why when where about with from as by can could would will shall should may might any some all just than then there here also very much many more most still so far till until tell please give show explain say know want like get got has have had not no yes ok okay').split(' '))
const SYN: Record<string, string[]> = {
  dip: ['fall', 'loss', 'down', 'dropped', 'drop', 'negative'],
  fall: ['dip', 'loss', 'down'],
  down: ['dip', 'fall', 'loss'],
  loss: ['dip', 'fall', 'down'],
  gain: ['up', 'rose', 'growth', 'positive', 'extra'],
  up: ['gain', 'rose'],
  skip: ['skipped', 'missed', 'miss'],
  miss: ['skipped', 'missed'],
  missed: ['skipped'],
  paid: ['added', 'instalment', 'contribution'],
  pay: ['added', 'instalment'],
  return: ['market', 'gain', 'added'],
  returns: ['market', 'gain', 'added'],
  profit: ['market', 'gain'],
  growth: ['market', 'gain'],
  money: ['value', 'added', 'amount'],
  worth: ['value'],
  balance: ['value'],
  done: ['progress'],
  far: ['progress', 'value'],
  target: ['goal'],
  finish: ['reach', 'break', 'target'],
  complete: ['reach', 'break', 'target'],
  break: ['reach', 'target', 'projected'],
  when: ['projected', 'date', 'months'],
  late: ['behind', 'after'],
  early: ['ahead'],
  consistent: ['streak', 'discipline'],
  consistency: ['streak', 'discipline'],
  discipline: ['streak', 'consistent', 'paid'],
  habit: ['streak', 'discipline'],
  streak: ['consecutive', 'paid', 'discipline'],
  happy: ['mood', 'smile'],
  sad: ['mood', 'skipped'],
  mood: ['happy', 'sad'],
  pig: ['gullak', 'mood'],
  nav: ['price', 'units'],
  price: ['nav', 'units'],
  unit: ['units', 'nav'],
  market: ['gain', 'dip', 'effect'],
  you: ['added'],
  own: ['added'],
  contributed: ['added'],
  invested: ['added'],
  total: ['value', 'added'],
  month: ['months', 'monthly'],
  recent: ['latest', 'last'],
  latest: ['last', 'recent'],
  last: ['latest', 'recent'],
  current: ['now', 'latest'],
  best: ['highest', 'biggest'],
  worst: ['lowest', 'biggest', 'dip'],
}
const stem = (w: string) => w.replace(/(ing|ed|es|s)$/i, (m, _s, off) => (w.length - m.length >= 3 ? '' : m))
export function tokens(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/₹/g, ' rupee ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w && !STOP.has(w))
    .map(stem)
}
const expand = (toks: string[]) => {
  const out = new Set(toks)
  for (const t of toks) for (const s of SYN[t] ?? SYN[t + 's'] ?? []) out.add(stem(s))
  return [...out]
}

// ---------------------------------------------------------------- retrieval (small BM25)
export interface Hit { chunk: Chunk; score: number }
export function retrieve(question: string, chunks: Chunk[], k = 3, history: string[] = []): Hit[] {
  let q = tokens(question)
  if (q.length < 3 && history.length) q = [...q, ...tokens(history[history.length - 1])] // follow-up: "and March?"
  const terms = expand(q)
  if (!terms.length || !chunks.length) return []
  const docs = chunks.map((c) => tokens(`${c.title} ${c.title} ${c.text}`))
  const avg = docs.reduce((a, d) => a + d.length, 0) / docs.length || 1
  const df = new Map<string, number>()
  for (const d of docs) for (const t of new Set(d)) df.set(t, (df.get(t) ?? 0) + 1)
  const N = docs.length
  const hits: Hit[] = chunks.map((chunk, i) => {
    const d = docs[i]
    const tf = new Map<string, number>()
    for (const t of d) tf.set(t, (tf.get(t) ?? 0) + 1)
    let score = 0
    for (const t of terms) {
      const f = tf.get(t)
      if (!f) continue
      const n = df.get(t) ?? 0
      const idf = Math.log(1 + (N - n + 0.5) / (n + 0.5))
      score += idf * ((f * 2.2) / (f + 1.2 * (0.25 + 0.75 * (d.length / avg))))
    }
    return { chunk, score }
  })
  // intent boosts: phrasing that points at one specific fact
  const boost = (id: string, by: number) => { const h = hits.find((x) => x.chunk.id === id); if (h) h.score += by }
  if (/\b(this|last|latest|recent|current)\s+month\b|\bthis month\b/i.test(question)) boost('latest', 6)
  if (/\b(how (is|are|am)\b.*\b(doing|going|looking)|status|overall|summary|so far|till now|until now)\b/i.test(question)) boost('history', 4)
  return hits.filter((h) => h.score > 0).sort((a, b) => b.score - a.score).slice(0, k)
}

// ---------------------------------------------------------------- scope rules
const ADVICE_Q: RegExp[] = [
  /\b(should|shall|must)\s+(i|we)\s+(buy|sell|switch|invest|increase|decrease|reduce|change|top|put|add|pick|choose|move)/i,
  /\b(can|could)\s+i\s+(sell|switch|increase|decrease|reduce|change|top)/i,
  /\b(is it|would it be|am i)\s+(a\s+)?(good|bad|safe|wise|worth|right|smart|better)/i,
  /\b(better|best|ideal|right)\s+(time|moment|fund|option|plan|amount)\b/i,
  /\b(which|what)\s+(fund|funds|stock|stocks|scheme|mutual fund|sip)\b/i,
  /\b(recommend|suggest|advise|advice|tip|tips|opinion|strategy)\b/i,
  /\b(buy|sell|switch|top[- ]?up|lump ?sum)\b/i,
  /\b(invest|put)\s+(more|extra|less|in|into)\b/i,
  /\bhow much\s+(should|to|do i need to)\s+(invest|save|put|add|pay)\b/i,
  /\b(increase|decrease|reduce|raise|change)\s+(my\s+|the\s+)?(sip|amount|instalment|installment|contribution)\b/i,
  /\bwill\s+(it|my|the|this|i)\b.*\b(grow|double|triple|reach|make|earn|give|return|recover|fall|rise|go up|go down|crash|beat)\b/i,
  /\b(guarantee|guaranteed|sure|certain|promise)\b/i,
  /\b(predict|forecast|expected return|future return)\b/i,
  /\b(tax|taxes|ltcg|stcg|elss)\b/i,
]
/** Doubts about whether to carry on: the user decides, so we show facts and never recommend. */
const DECISION = /\b(cancel(l?ing|led)?|stop(ping)?|pause|pausing|quit|quitting|discontinue|withdraw|redeem|exit|close)\b.{0,30}\b(sip|gullak|investing|investment|it|this|now|money|everything)\b|\b(should|shall|can|could|may|do|will)\s+(i|we)\b.{0,30}\b(cancel|stop|pause|quit|continue|skip|withdraw|redeem|exit|carry on|keep going)\b|\bwhat (happens|will happen) (if|when) (i|we)\s+(cancel|stop|pause|quit|skip|withdraw)/i
/** Frustration or worry about returns: reply with empathy and the real numbers. */
const WORRY = /\b(no use|useless|waste|wasting|pointless|worthless|not worth|losing|lost|no (returns?|profit|gain|growth)|not (getting|earning|making|seeing)|unable to (get|see|earn|make)|don'?t (get|see|feel)|disappoint\w*|worried|worry|scared|afraid|nervous|fed up|frustrat\w*|give up|regret|doubt|not growing|barely|so little|too little|slow)\b/i
const OFF_INJECTION = /\b(ignore|forget|disregard)\s+(all\s+|the\s+|your\s+)?(previous|above|prior|instructions|rules)|system prompt|you are now|pretend to be|jailbreak|act as\b/i
const OTHER_GOAL_GENERIC = /\b(other|another|all|every|rest of)\s+(my\s+)?(goal|goals|gullak|gullaks|piggy|piggies|sip|sips)\b|\bcompare\b.*\b(goal|gullak)\b/i
const HELLO = /^\s*(hi|hello|hey|namaste|hii+|yo|good (morning|evening|afternoon)|help|what can you do|who are you)\b/i
const DOMAIN = new Set(('gullak goal sip month monthly streak progress added value target pace unit nav skipped skip mood happy sad dip discipline paid instalment contribution pig piggy invested saved saving savings projected break reach consecutive habit months consistent consistency').split(' '))

const words = (s: string) => s.toLowerCase().replace(/[^a-z0-9\s']/g, ' ').split(/\s+/).filter(Boolean)
/** Distinctive words (>= 4 letters) of other goal names that the current goal name doesn't share. */
function otherGoalWords(goalName: string, others: string[]): string[] {
  const mine = new Set(words(goalName))
  const out: string[] = []
  for (const n of others) for (const w of words(n)) if (w.length >= 4 && !mine.has(w) && !['goal', 'gullak', 'fund'].includes(w)) out.push(w.replace(/'s$/, ''))
  return out
}
const mentionsOtherGoal = (q: string, goalName: string, others: string[]) => {
  const ql = q.toLowerCase()
  if (OTHER_GOAL_GENERIC.test(ql)) return true
  const mine = goalName.toLowerCase()
  for (const n of others) {
    const nl = n.toLowerCase()
    if (nl !== mine && ql.includes(nl)) return true
  }
  const qw = new Set(words(q).map((w) => w.replace(/'s$/, '')))
  return otherGoalWords(goalName, others).some((w) => qw.has(w))
}

export const SUGGESTED = (goalName: string, opts: { skipped?: boolean; dip?: boolean } = {}) => [
  'How is my Gullak doing?',
  'What happened this month?',
  opts.skipped ? 'Why is my Gullak sad?' : 'How long is my streak?',
  opts.dip ? 'Why did the market dip hurt?' : 'How much did the market add?',
  'How much could it be in 5 years?',
  'What happens if I cancel?',
]

const SCOPE_NOTE = 'I can only talk about this Gullak: its progress, months, streak and what happened to the money so far.'
export const REPLIES: Record<Exclude<AskKind, 'answer' | 'decision' | 'worry'>, string> = {
  advice: `I can't give investment advice, like what to buy, stop or change, or what will happen next. What I can do is show how steady you've been. Try asking about your streak, your last month or how much you've added so far.`,
  other_goal: `I only answer for this Gullak so each goal stays separate. Open the other Gullak and ask me there. ${SCOPE_NOTE}`,
  off_topic: `That's outside this Gullak, so I can't help with it. ${SCOPE_NOTE} Tap a question below to start.`,
  hello: `Hi, I'm Gullak. ${SCOPE_NOTE} I don't give investment advice. Tap a question below or type your own.`,
}

export function classify(req: Pick<AskRequest, 'question' | 'goalName' | 'otherGoalNames' | 'chunks' | 'history'>): { kind: AskKind; hits: Hit[] } {
  const q = req.question.trim()
  if (!q) return { kind: 'hello', hits: [] }
  if (OFF_INJECTION.test(q)) return { kind: 'off_topic', hits: [] }
  if (HELLO.test(q) && words(q).length <= 6) return { kind: 'hello', hits: [] }
  if (mentionsOtherGoal(q, req.goalName, req.otherGoalNames)) return { kind: 'other_goal', hits: [] }
  if (ADVICE_Q.some((re) => re.test(q))) return { kind: 'advice', hits: [] }
  if (DECISION.test(q)) return { kind: 'decision', hits: [] }
  if (WORRY.test(q) && !/\b(skipped|streak|month|march|april|may|june|july|august|september|october|why is my gullak sad)\b/i.test(q)) return { kind: 'worry', hits: [] }
  const hits = retrieve(q, req.chunks, 3, req.history)
  const onDomain = words(q).some((w) => DOMAIN.has(w) || DOMAIN.has(w.replace(/s$/, ''))) || /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\b|₹|\d/.test(q.toLowerCase())
  const vocab = new Set(req.chunks.flatMap((c) => tokens(`${c.title} ${c.text}`)))
  const qt = tokens(q)
  const known = qt.length > 0 && qt.every((t) => vocab.has(t)) // every content word is about this goal's facts
  if (!hits.length || (!onDomain && !known)) return { kind: 'off_topic', hits: [] }
  return { kind: 'answer', hits }
}

// ---------------------------------------------------------------- answers
/** Offline / fallback answer: the best-matching facts, as they are written. */
export function templateAnswer(hits: Hit[]): string {
  const top = hits.slice(0, hits[0] && hits[0].chunk.id.startsWith('month-') && hits[1]?.chunk.id.startsWith('month-') ? 2 : 1)
  return top.map((h) => h.chunk.text).join(' ')
}

const wc = (s: string) => s.trim().split(/\s+/).filter(Boolean).length
/** AI answers must stay inside the retrieved facts: no advice, no invented numbers, no other goals, short. */
export function validateAnswer(text: unknown, req: AskRequest, hits: Hit[]): { ok: true; answer: string } | { ok: false; reason: string } {
  if (typeof text !== 'string' || !text.trim()) return { ok: false, reason: 'empty' }
  const a = text.trim().replace(/\*\*/g, '').replace(/^["']|["']$/g, '')
  if (wc(a) > 80) return { ok: false, reason: 'too long' }
  const adv = findAdvice(a)
  if (adv) return { ok: false, reason: `advice phrase: ${adv}` }
  const bad = findInventedNumber(a, hits.map((h) => h.chunk.text))
  if (bad) return { ok: false, reason: `number not in context: ${bad}` }
  const al = a.toLowerCase()
  if (otherGoalWords(req.goalName, req.otherGoalNames).some((w) => new RegExp(`\\b${w}\\b`).test(al))) return { ok: false, reason: 'mentions another goal' }
  return { ok: true, answer: a }
}

export const ASK_SYSTEM =
  `You are Gullak, a friendly piggy-bank assistant inside an Indian investing app. You answer questions about ONE goal Gullak only, using ONLY the CONTEXT facts provided. ` +
  `Rules: (1) If the answer is not in CONTEXT, say you don't have that for this Gullak. (2) Never answer about other goals, other funds, markets in general, or any other topic. (3) Never give investment advice: no buy, sell, stop, continue, pause, switch, amounts, funds or timing, and never predict or promise returns; projections are illustrations at an assumed rate. ` +
  `(4) Lean on investment discipline: streak, consistency, instalments paid. Be warm, never guilt. (5) Use only numbers that appear in CONTEXT, copied exactly. (6) Plain Indian English, 60 words or fewer, no markdown, no lists.`

export const askPrompt = (req: AskRequest, hits: Hit[]) =>
  `CONTEXT (goal: ${req.goalName}):\n${hits.map((h, i) => `[${i + 1}] ${h.chunk.title}: ${h.chunk.text}`).join('\n')}\n\n` +
  (req.history?.length ? `Earlier questions: ${req.history.slice(-2).join(' | ')}\n` : '') +
  `Question: ${req.question}\nAnswer in 60 words or fewer using only CONTEXT.`

/** Rule-based reply for everything that never reaches the model. */
const textOf = (chunks: Chunk[], id: string) => chunks.find((c) => c.id === id)?.text ?? ''
const firstSentences = (t: string, n: number) => (t.match(/[^.!?]+[.!?]+/g) ?? [t]).slice(0, n).join('').trim()

/** Supportive, fact-only replies for "should I cancel?" and "I'm not getting returns". Built from this Gullak's own facts, never from the model. */
export function supportReply(kind: 'decision' | 'worry', chunks: Chunk[]): string {
  const progress = textOf(chunks, 'progress')
  const split = textOf(chunks, 'split')
  const streak = firstSentences(textOf(chunks, 'streak'), 1)
  if (kind === 'decision') {
    return `That one is your call, and I can't tell you what to do. I can show you the facts for this Gullak. ${progress} ${textOf(chunks, 'cancel')} Ask me about your streak or the market if that helps you think it through.`.replace(/\s+/g, ' ').trim()
  }
  return `I hear you, waiting for results can feel slow. Here is where this Gullak stands. ${progress} ${split} ${streak} I can't predict returns, but I can show you any month in detail.`.replace(/\s+/g, ' ').trim()
}

export const ruleReply = (kind: Exclude<AskKind, 'answer'>, chunks: Chunk[] = []): AskResponse => ({
  answer: kind === 'decision' || kind === 'worry' ? supportReply(kind, chunks) : REPLIES[kind], kind, source: 'rule',
})
