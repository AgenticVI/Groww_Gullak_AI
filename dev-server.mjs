// Local stand-in for `vercel dev`: static app plus POST /api/ai.
import { setDefaultResultOrder } from 'node:dns'
import { createServer } from 'node:http'

setDefaultResultOrder('ipv4first')
import { existsSync, readFileSync, statSync } from 'node:fs'
import { extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'
import handler from './api/ai.js'

const root = fileURLToPath(new URL('.', import.meta.url))

function loadEnv(name) {
  const file = join(root, name)
  if (!existsSync(file)) return
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq < 1) continue
    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1)
    if (process.env[key] == null || process.env[key] === '') process.env[key] = value
  }
}

loadEnv('.env')
loadEnv('.env.local')

const types = {
  '.html': 'text/html; charset=utf-8',
  '.png': 'image/png',
  '.txt': 'text/plain; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.json': 'application/json; charset=utf-8',
}

function adapt(res) {
  let statusCode = 200
  return {
    get headersSent() { return res.headersSent },
    setHeader(name, value) { res.setHeader(name, value) },
    status(code) { statusCode = code; return this },
    json(obj) {
      const body = JSON.stringify(obj)
      if (!res.headersSent) res.writeHead(statusCode, { 'content-type': 'application/json; charset=utf-8', 'content-length': Buffer.byteLength(body) })
      res.end(body)
    },
    writeHead(code, headers) { statusCode = code; res.writeHead(code, headers) },
    write(chunk) { return res.write(chunk) },
    end(chunk) { return res.end(chunk) },
  }
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', (chunk) => chunks.push(chunk))
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8')
      if (!raw) return resolve({})
      try { resolve(JSON.parse(raw)) } catch (err) { reject(err) }
    })
    req.on('error', reject)
  })
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url || '/', 'http://127.0.0.1')
  if (url.pathname === '/api/ai') {
    try { req.body = await readBody(req) } catch {
      res.writeHead(400, { 'content-type': 'application/json; charset=utf-8' })
      res.end(JSON.stringify({ error: 'bad request' }))
      return
    }
    await handler(req, adapt(res))
    return
  }

  let pathname = decodeURIComponent(url.pathname)
  if (pathname === '/') pathname = '/index.html'
  if (pathname.includes('\0') || pathname.split('/').some((part) => part.startsWith('.'))) {
    res.writeHead(404)
    res.end('Not found')
    return
  }
  const file = normalize(join(root, pathname))
  if (!file.startsWith(root) || !existsSync(file) || statSync(file).isDirectory()) {
    res.writeHead(404)
    res.end('Not found')
    return
  }
  const body = readFileSync(file)
  res.writeHead(200, { 'content-type': types[extname(file)] || 'application/octet-stream', 'content-length': body.length })
  res.end(body)
})

const port = Number(process.env.PORT) || 3000
server.listen(port, '127.0.0.1', () => {
  console.log(`Goal Gullak on http://127.0.0.1:${port}`)
})
