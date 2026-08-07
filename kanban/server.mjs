#!/usr/bin/env node
/**
 * Kanban backend — one process, three jobs:
 *   1. Watch tickets/*.md (source of truth) → index into SQLite (projection)
 *   2. Serve HTTP API  (GET /api/tickets, PATCH /api/tickets/:id)
 *   3. Serve the built frontend (or proxy to Vite dev)
 *
 * The UI NEVER writes to SQLite directly. A status change = PATCH that
 * rewrites the .md frontmatter; the watcher then re-indexes → SQLite updates.
 * File is the source of truth, SQLite is the read cache.
 */

import Database from 'better-sqlite3'
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import matter from 'gray-matter'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const TICKETS_DIR = path.join(ROOT, 'tickets')
const DB_PATH = path.join(__dirname, 'data', 'kanban.db')
const SCHEMA_PATH = path.join(__dirname, 'schema.sql')
const PORT = process.env.KANBAN_PORT || 3211

// ── DB ──────────────────────────────────────────────────────────────────
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true })
const db = new Database(DB_PATH)
db.pragma('journal_mode = WAL')
db.exec(fs.readFileSync(SCHEMA_PATH, 'utf-8'))

// ── Ticket file parsing ─────────────────────────────────────────────────
const VALID_TYPES = ['feat', 'fix', 'task', 'chore', 'docs']
const VALID_STATUSES = ['open', 'in-progress', 'review', 'qa', 'done']

function titleCase(slug) {
  return slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function parseFilename(filename) {
  // 0001-feat-login-page.md → { id: "0001", type: "feat", slug: "login-page" }
  const base = filename.replace(/\.md$/, '')
  const m = base.match(/^(\d+)-(\w+)-(.+)$/)
  if (!m) return null
  return { id: m[1], type: m[2], slug: m[3] }
}

function parseTicketFile(filepath, filename) {
  const parsed = parseFilename(filename)
  if (!parsed) return null
  const raw = fs.readFileSync(filepath, 'utf-8')
  const { data, content } = matter(raw)
  return {
    id: parsed.id,
    type: VALID_TYPES.includes(parsed.type) ? parsed.type : 'task',
    slug: parsed.slug,
    title: data.title || titleCase(parsed.slug),
    status: VALID_STATUSES.includes(data.status) ? data.status : 'open',
    parent: data.parent || null,
    labels: JSON.stringify(data.labels || []),
    github_url: data['github-url'] || null,
    filename,
    body: content.trim(),
  }
}

function upsertTicket(t) {
  db.prepare(`
    INSERT INTO tickets (id, type, slug, title, status, parent, labels, github_url, filename, body, updated_at)
    VALUES (@id, @type, @slug, @title, @status, @parent, @labels, @github_url, @filename, @body, datetime('now'))
    ON CONFLICT(id) DO UPDATE SET
      type=excluded.type, slug=excluded.slug, title=excluded.title,
      status=excluded.status, parent=excluded.parent, labels=excluded.labels,
      github_url=excluded.github_url, filename=excluded.filename, body=excluded.body,
      updated_at=datetime('now')
  `).run(t)
}

function deleteTicket(id) {
  db.prepare('DELETE FROM tickets WHERE id = ?').run(id)
}

// ── Create a ticket file (the only creation path) ────────────────────────
function createTicket({ type, slug, title, status = 'open', parent = null, labels = [] }) {
  if (!VALID_TYPES.includes(type)) return { error: `invalid type: ${type}` }
  if (!slug || !/^[a-z0-9-]+$/.test(slug)) return { error: `invalid slug: ${slug}` }

  // next id = max existing + 1
  const row = db.prepare('SELECT MAX(CAST(id AS INTEGER)) as max FROM tickets').get()
  const id = String((row?.max || 0) + 1).padStart(4, '0')
  const filename = `${id}-${type}-${slug}.md`
  const filepath = path.join(TICKETS_DIR, filename)
  if (fs.existsSync(filepath)) return { error: `file exists: ${filename}` }

  const frontmatter = {
    id,
    type,
    status,
    parent,
    labels: labels.length ? labels : undefined,
    'github-url': null,
  }
  // remove keys with null/undefined values
  for (const k of Object.keys(frontmatter)) {
    if (frontmatter[k] == null) delete frontmatter[k]
  }
  const body = `# ${title || titleCase(slug)}\n`
  fs.writeFileSync(filepath, matter.stringify(body, frontmatter), 'utf-8')
  // watcher will reindex — return the parsed ticket
  const t = parseTicketFile(filepath, filename)
  if (t) upsertTicket(t)
  return { ok: true, ticket: t }
}

// ── Full reindex ────────────────────────────────────────────────────────
function reindexAll() {
  if (!fs.existsSync(TICKETS_DIR)) {
    fs.mkdirSync(TICKETS_DIR, { recursive: true })
    return
  }
  const files = fs.readdirSync(TICKETS_DIR).filter((f) => f.endsWith('.md'))
  const seenIds = new Set()
  for (const filename of files) {
    const t = parseTicketFile(path.join(TICKETS_DIR, filename), filename)
    if (!t) continue
    upsertTicket(t)
    seenIds.add(t.id)
  }
  // Remove tickets whose files no longer exist
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

// ── Write status back to .md (the only write path from the UI) ───────────
function updateTicketStatus(id, status) {
  if (!VALID_STATUSES.includes(status)) return { error: 'invalid status' }
  const row = db.prepare('SELECT filename FROM tickets WHERE id = ?').get(id)
  if (!row) return { error: 'ticket not found' }
  const filepath = path.join(TICKETS_DIR, row.filename)
  if (!fs.existsSync(filepath)) return { error: 'file not found' }
  const raw = fs.readFileSync(filepath, 'utf-8')
  const { data, content } = matter(raw)
  data.status = status
  // force id to zero-padded string — YAML coerces 0001→1 on write otherwise
  data.id = String(id).padStart(4, '0')
  fs.writeFileSync(filepath, matter.stringify(content, data), 'utf-8')
  // watcher will reindex — no direct DB write here
  return { ok: true, id: data.id, status }
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
    const result = updateTicketStatus(patchMatch[1], body.status)
    return json(res, result.error ? 400 : 200, result)
  }

  // POST /api/tickets — create a new ticket file
  if (req.method === 'POST' && url.pathname === '/api/tickets') {
    const body = await readBody(req)
    const result = createTicket(body)
    return json(res, result.error ? 400 : 201, result)
  }

  // POST /api/reindex — force a full reindex
  if (req.method === 'POST' && url.pathname === '/api/reindex') {
    reindexAll()
    return json(res, 200, { ok: true })
  }

  return json(res, 404, { error: 'not found' })
})

server.listen(PORT, () => {
  console.log(`[kanban] API at http://localhost:${PORT}/api/tickets`)
  console.log(`[kanban] watching ${TICKETS_DIR}`)
})
