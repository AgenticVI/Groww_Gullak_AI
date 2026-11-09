# Goal Gullak – deploy on Vercel

## What's inside
- `index.html` – the whole app (static).
- `api/ai.js` – a Vercel serverless function. The Ask Gullak chat and the
  Analyse / AI notes call `POST /api/ai`; it adds your Gemini key on the server
  and calls the Gemini API. The key never reaches the browser.
- `logo.png` – the logo (already embedded in `index.html`).

## Deploy
1. Push this folder to a GitHub repo (or run `npx vercel` inside it).
2. Import it in Vercel. Framework preset: **Other**. No build command needed.
3. Vercel → Project → Settings → Environment Variables, add:
   - `GEMINI_API_KEY` = your Gemini key (required; `GOOGLE_API_KEY` also works)
   - `GEMINI_MODEL` = optional, defaults to `gemini-flash-latest`
   - `ALLOWED_ORIGIN` = optional, e.g. `https://your-project.vercel.app`
4. Redeploy so the variables take effect.

## How it decides where to send AI calls
- Opened on claude.ai → uses Claude's built-in artifact AI.
- Anywhere else (your Vercel site) → calls `/api/ai` (Gemini), which streams the answer back.

## Local testing
`npx vercel dev` (with a `.env` file based on `.env.example`), then open http://localhost:3000.
