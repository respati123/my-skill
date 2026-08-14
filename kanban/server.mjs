#!/usr/bin/env node
/**
 * Kanban backend — one process, three jobs:
 *   1. Watch tickets/*.md (source of truth) → index into SQLite (projection)
 *   2. Serve HTTP API  (GET /api/tickets, PATCH /api/tickets/:id)
 *   3. Serve the built frontend (or proxy to Vite dev)
 *
 * The UI NEVER writes to SQLite directly. A status change = PATCH that
 * rewrites the .md frontmatter; the watcher then re-indexes → SQLite updates.
 * File is the source of truth, SQLite is the read cache. All file access
 * goes through ./lib/ticket-store.mjs — see docs/adr/0001-ticket-file-stays-source-of-truth.md.
 */

import Database from 'better-sqlite3'
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  TICKETS_DIR,
  listTickets,
  createTicketFile,
  patchFrontmatter,
} from './lib/ticket-store.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DB_PATH = path.join(__dirname, 'data', 'kanban.db')
const SCHEMA_PATH = path.join(__dirname, 'schema.sql')
const PORT = process.env.KANBAN_PORT || 3211

// ── DB ──────────────────────────────────────────────────────────────────
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true })
const db = new Database(DB_PATH)
db.pragma('journal_mode = WAL')
db.exec(fs.readFileSync(SCHEMA_PATH, 'utf-8'))

function upsertTicket(t) {
  db.prepare(`
    INSERT INTO tickets (id, type, slug, title, status, parent, labels, github_url, filename, body, updated_at)
    VALUES (@id, @type, @slug, @title, @status, @parent, @labels, @github_url, @filename, @body, datetime('now'))
    ON CONFLICT(id) DO UPDATE SET
      type=excluded.type, slug=excluded.slug, title=excluded.title,
      status=excluded.status, parent=excluded.parent, labels=excluded.labels,
      github_url=excluded.github_url, filename=excluded.filename, body=excluded.body,
      updated_at=datetime('now')
  `).run({ ...t, labels: JSON.stringify(t.labels) })
}

function deleteTicket(id) {
  db.prepare('DELETE FROM tickets WHERE id = ?').run(id)
}

// ── Full reindex — reads through ticket-store, not the filesystem directly ─
function reindexAll() {
  fs.mkdirSync(TICKETS_DIR, { recursive: true })
  const tickets = listTickets()
  const seenIds = new Set()
  for (const t of tickets) {
    upsertTicket(t)
    seenIds.add(t.id)
  }
  const rows = db.prepare('SELECT id FROM tickets').all()
  for (const { id } of rows) {
    if (!seenIds.has(id)) deleteTicket(id)
  }
}

// ── File watcher ────────────────────────────────────────────────────────
reindexAll()
console.log(`[kanban] indexed ${db.prepare('SELECT COUNT(*) as c FROM tickets').get().c} tickets`)

let debounceTimer = null
function scheduleReindex() {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    reindexAll()
  }, 150)
}

if (fs.existsSync(TICKETS_DIR)) {
  fs.watch(TICKETS_DIR, { recursive: false }, (event, filename) => {
    if (!filename || !filename.endsWith('.md')) return
    console.log(`[kanban] ${event}: ${filename} → reindexing`)
    scheduleReindex()
  })
}

// ── HTTP server ─────────────────────────────────────────────────────────
function readBody(req) {
  return new Promise((resolve) => {
    let body = ''
    req.on('data', (c) => (body += c))
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {})
      } catch {
        resolve({})
      }
    })
  })
}

function json(res, code, data) {
  res.writeHead(code, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, PATCH, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  })
  res.end(JSON.stringify(data))
}

const server = http.createServer(async (req, res) => {
  // CORS preflight
  if (req.method === 'OPTIONS') return json(res, 204, {})

  const url = new URL(req.url, `http://localhost:${PORT}`)

  // GET /api/tickets
  if (req.method === 'GET' && url.pathname === '/api/tickets') {
    const tickets = db.prepare('SELECT * FROM tickets ORDER BY id').all()
    return json(res, 200, tickets.map((t) => ({ ...t, labels: JSON.parse(t.labels) })))
  }

  // GET /api/active — which ticket+agent is working right now (from tickets/.active sidecar)
  if (req.method === 'GET' && url.pathname === '/api/active') {
    const activePath = path.join(TICKETS_DIR, '.active')
    if (!fs.existsSync(activePath)) return json(res, 200, null)
    try {
      const data = JSON.parse(fs.readFileSync(activePath, 'utf-8'))
      return json(res, 200, data)
    } catch {
      return json(res, 200, null)
    }
  }

  // PATCH /api/tickets/:id  { status }
  const patchMatch = url.pathname.match(/^\/api\/tickets\/(\d+)/)
  if (req.method === 'PATCH' && patchMatch) {
    const body = await readBody(req)
    const result = patchFrontmatter(patchMatch[1], { status: body.status })
    // watcher will reindex — no direct DB write here
    return json(res, result.error ? 400 : 200, result.error ? result : { ok: true, id: result.ticket.id, status: result.ticket.status })
  }

  // POST /api/tickets — create a new ticket file
  if (req.method === 'POST' && url.pathname === '/api/tickets') {
    const body = await readBody(req)
    const result = createTicketFile(body)
    if (result.ok) upsertTicket(result.ticket) // instant consistency; watcher will also reindex
    return json(res, result.error ? 400 : 201, result)
  }

  // POST /api/reindex — force a full reindex
  if (req.method === 'POST' && url.pathname === '/api/reindex') {
    reindexAll()
    return json(res, 200, { ok: true })
  }

  // ── Serve the built frontend (production mode) ────────────────────────
  // API routes above are matched first; anything else is a frontend route.
  // If dist/ exists, serve it (SPA — index.html fallback for client routing).
  // If dist/ doesn't exist, tell the user to run the dev server or build.
  if (req.method === 'GET' && !url.pathname.startsWith('/api/')) {
    const distDir = path.join(__dirname, 'dist')
    if (!fs.existsSync(distDir)) {
      return json(res, 200, {
        message: 'Board not built. Run one of:',
        dev: 'cd kanban && pnpm dev  (hot reload, port 5173)',
        build: 'cd kanban && pnpm build && node server.mjs  (serves dist/ on this port)',
      })
    }
    // resolve the file path, prevent traversal
    let filePath = path.join(distDir, decodeURIComponent(url.pathname))
    if (url.pathname === '/' || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      filePath = path.join(distDir, 'index.html') // SPA fallback
    }
    if (!filePath.startsWith(distDir)) {
      return json(res, 403, { error: 'forbidden' })
    }
    const ext = path.extname(filePath)
    const types = {
      '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
      '.json': 'application/json', '.svg': 'image/svg+xml',
      '.png': 'image/png', '.jpg': 'image/jpeg', '.ico': 'image/x-icon',
      '.woff': 'font/woff', '.woff2': 'font/woff2',
    }
    try {
      const body = fs.readFileSync(filePath)
      res.writeHead(200, { 'Content-Type': types[ext] || 'application/octet-stream' })
      res.end(body)
    } catch {
      res.writeHead(404, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'not found' }))
    }
    return
  }

  return json(res, 404, { error: 'not found' })
})

server.listen(PORT, () => {
  console.log(`[kanban] API + board at http://localhost:${PORT}`)
  console.log(`[kanban] watching ${TICKETS_DIR}`)
})
