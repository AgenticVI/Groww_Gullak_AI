# Goal Gullak — MVP

One piggy bank (Gullak) per goal. Tap the sparkle-pig **Analyse** button and AI explains progress toward the goal,
what you added versus what the market added, and when you could break the Gullak (reach the target) at an assumed rate.
Goal tracking only: it never recommends funds, amounts or actions.

```bash
npm i && cp .env.example .env   # add GEMINI_API_KEY (server-side only)
npm run dev                     # client :5173, API :8787
npm test                        # guardrails, templates, mocked-Gemini pipeline, goal maths
```

- `src/lib/goals.ts` all goal maths (series, you vs market, pace / break date). The LLM never computes numbers.
- `shared/guard.ts` rejects AI output with invented ₹/%/numbers or advice phrases → `shared/templates.ts` fallback.
- `server/insight.ts` Gemini call (JSON schema, 5 s timeout, cache); `shared/prompts.ts` prompts.
- Insight types: `goal_summary`, `goal_month`, `cancel_check` (plus legacy month/storm/long-term/year types).
- Example goals "Goa trip" and "Emergency fund" use illustrative contributions; "First bike" uses the real SIP data.
- Rotate any API key that was ever pasted into chat.

## Ask Gullak (RAG chatbot)

Pig-head chat, opened from the **Ask Gullak** pill on SIP details / goal detail and from the AI panel. One bot, always scoped to ONE goal.

- `src/lib/askCorpus.ts` builds the goal's knowledge base (progress, you vs market, pace, streak, mood, every month) from the goal maths.
- `shared/rag.ts` retrieval (BM25 + synonyms), rule gates (advice, other goals, off-topic, prompt injection → fixed refusals), and the answer guard (no advice phrases, no numbers outside the retrieved facts, no other goal names).
- `server/ask.ts` + `POST /api/ask`: Gemini sees only the retrieved facts; any rejected or failed answer falls back to the facts themselves.
- Suggested-question chips sit above the input so users see it is a goal Q&A, not a general chatbot.

## Evaluation
`npm run eval` runs the Ask Gullak golden set, a held-out set, a guard red-team and a mocked-model fallback test, and exits non-zero if a quality gate fails. The full report is in [docs/EVAL.md](docs/EVAL.md).
