#!/usr/bin/env node
/**
 * Ticket store — the only module that reads or writes tickets/*.md.
 *
 * File-level only: no SQLite, no HTTP. kanban/server.mjs layers SQLite
 * indexing and the HTTP API on top of this. kanban/scripts/migrate-to-github.mjs
 * calls it directly, since that script runs standalone without the server
 * up. tickets/*.md is the source of truth — see
 * docs/adr/0001-ticket-file-stays-source-of-truth.md.
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import matter from 'gray-matter'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..', '..')
// Overridable so tests can point at a throwaway directory instead of the
// repo's real tickets/ — same pattern as KANBAN_URL in the CLI scripts.
export const TICKETS_DIR = process.env.TICKETS_DIR || path.join(ROOT, 'tickets')

export const VALID_TYPES = ['feat', 'fix', 'task', 'chore', 'docs']
export const VALID_STATUSES = ['open', 'in-progress', 'review', 'qa', 'done']

/** The statuses that count as "not done yet" — open work in flight. */
const OPEN_STATUSES = new Set(['open', 'in-progress', 'review', 'qa'])
export function isOpen(status) {
  return OPEN_STATUSES.has(status)
}

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

function parseTicketFile(filename) {
  const parsed = parseFilename(filename)
  if (!parsed) return null
  const raw = fs.readFileSync(path.join(TICKETS_DIR, filename), 'utf-8')
  const { data, content } = matter(raw)
  return {
    id: parsed.id,
    type: VALID_TYPES.includes(parsed.type) ? parsed.type : 'task',
    slug: parsed.slug,
    title: data.title || titleCase(parsed.slug),
    status: VALID_STATUSES.includes(data.status) ? data.status : 'open',
    parent: data.parent || null,
    labels: data.labels || [],
    github_url: data['github-url'] || null,
    filename,
    body: content.trim(),
  }
}

function findFilename(id) {
  const paddedId = String(id).padStart(4, '0')
  if (!fs.existsSync(TICKETS_DIR)) return null
  return (
    fs.readdirSync(TICKETS_DIR).find((f) => f.startsWith(`${paddedId}-`) && f.endsWith('.md')) || null
  )
}

// ── Reads ───────────────────────────────────────────────────────────────
export function listTickets() {
  if (!fs.existsSync(TICKETS_DIR)) return []
  return fs
    .readdirSync(TICKETS_DIR)
    .filter((f) => f.endsWith('.md'))
    .map((f) => parseTicketFile(f))
    .filter(Boolean)
}

export function readTicket(id) {
  const filename = findFilename(id)
  if (!filename) return null
  return parseTicketFile(filename)
}

// ── Create — the only creation path ───────────────────────────────────────
export function createTicketFile({ type, slug, title, status = 'open', parent = null, labels = [] }) {
  if (!VALID_TYPES.includes(type)) return { error: `invalid type: ${type}` }
  if (!slug || !/^[a-z0-9-]+$/.test(slug)) return { error: `invalid slug: ${slug}` }

  const maxId = listTickets().reduce((max, t) => Math.max(max, parseInt(t.id, 10) || 0), 0)
  const id = String(maxId + 1).padStart(4, '0')
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
  for (const k of Object.keys(frontmatter)) {
    if (frontmatter[k] == null) delete frontmatter[k]
  }
  fs.mkdirSync(TICKETS_DIR, { recursive: true })
  const body = `# ${title || titleCase(slug)}\n`
  fs.writeFileSync(filepath, matter.stringify(body, frontmatter), 'utf-8')
  return { ok: true, ticket: parseTicketFile(filename) }
}

// ── Frontmatter patch — status, github-url, anything else ────────────────
export function patchFrontmatter(id, patch) {
  if (patch.status && !VALID_STATUSES.includes(patch.status)) return { error: 'invalid status' }
  const filename = findFilename(id)
  if (!filename) return { error: 'ticket not found' }

  const filepath = path.join(TICKETS_DIR, filename)
  const raw = fs.readFileSync(filepath, 'utf-8')
  const { data, content } = matter(raw)
  Object.assign(data, patch)
  // force id to zero-padded string — YAML coerces 0001→1 on write otherwise
  data.id = String(data.id ?? id).padStart(4, '0')
  fs.writeFileSync(filepath, matter.stringify(content, data), 'utf-8')
  return { ok: true, ticket: parseTicketFile(filename) }
}

// ── Collapse to stub on migration — one-way, never repeated ──────────────
const DESCRIPTION_HEADINGS = ['## User story', '## Description', '## Summary']

function extractDescription(content) {
  for (const heading of DESCRIPTION_HEADINGS) {
    const idx = content.indexOf(heading)
    if (idx === -1) continue
    const rest = content.slice(idx)
    const nextHeadingIdx = rest.indexOf('\n## ', heading.length)
    return (nextHeadingIdx === -1 ? rest : rest.slice(0, nextHeadingIdx)).trim()
  }
  return content.trim()
}

export function collapseToStub(id, githubUrl) {
  const filename = findFilename(id)
  if (!filename) return { error: 'ticket not found' }

  const filepath = path.join(TICKETS_DIR, filename)
  const raw = fs.readFileSync(filepath, 'utf-8')
  const { data, content } = matter(raw)
  const description = extractDescription(content)
  const stub = `${description}\n\n→ Full details: ${githubUrl}\n`

  data['github-url'] = githubUrl
  data.id = String(data.id ?? id).padStart(4, '0')
  fs.writeFileSync(filepath, matter.stringify(stub, data), 'utf-8')
  return { ok: true, ticket: parseTicketFile(filename) }
}
