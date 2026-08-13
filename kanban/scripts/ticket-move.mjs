#!/usr/bin/env node
/**
 * Move a ticket to a new status via the kanban API.
 *
 * Usage:
 *   node ticket-move.mjs <id> <status>
 *   node ticket-move.mjs 0002 review
 *
 * The server rewrites the .md frontmatter; this script is a thin CLI wrapper.
 * Used by skills at pipeline transitions:
 *   coder done      → ticket-move.mjs <id> review
 *   techlead LGTM   → (stays at review; user merges manually)
 *   qa starts       → ticket-move.mjs <id> qa   (post-merge)
 *   qa PASS         → ticket-move.mjs <id> done
 */

const BASE = process.env.KANBAN_URL || 'http://localhost:3211'

const VALID_STATUSES = ['open', 'in-progress', 'review', 'qa', 'done']

const [id, status] = process.argv.slice(2)

if (!id || !status) {
  console.error('Usage: ticket-move.mjs <id> <status>')
  console.error(`  status: ${VALID_STATUSES.join(' | ')}`)
  console.error('')
  console.error('Examples:')
  console.error('  ticket-move.mjs 0002 review     # coder done → techlead review')
  console.error('  ticket-move.mjs 0002 qa         # techlead LGTM → qa verify')
  console.error('  ticket-move.mjs 0002 done       # qa PASS → done')
  process.exit(1)
}

if (!VALID_STATUSES.includes(status)) {
  console.error(`Invalid status: ${status}`)
  console.error(`Valid: ${VALID_STATUSES.join(' | ')}`)
  process.exit(1)
}

const paddedId = String(id).padStart(4, '0')

const res = await fetch(`${BASE}/api/tickets/${paddedId}`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ status }),
})

const data = await res.json()

if (!res.ok) {
  console.error(`Error: ${data.error}`)
  console.error('')
  console.error('Is the kanban server running? Start it with: node kanban/server.mjs')
  process.exit(1)
}

console.log(`✓ Moved ticket #${data.id} → ${status}`)
