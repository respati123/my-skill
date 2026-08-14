#!/usr/bin/env node
/**
 * Migrate local tickets to GitHub.
 *
 * One-way: local → GitHub. After migration, local .md files collapse to a
 * short description + a link — GitHub holds the authoritative detail from
 * then on. See docs/adr/0001-ticket-file-stays-source-of-truth.md and
 * CONTEXT.md's "Migration" + "GitHub adapter" entries.
 *
 * This script is orchestration: it decides WHICH tickets to migrate, in what
 * order, and collapses each local stub after GitHub accepts it. All actual
 * `gh` CLI interaction lives in kanban/lib/gh.mjs (the GitHub adapter) and
 * all file writes in kanban/lib/ticket-store.mjs.
 *
 * Usage:
 *   node migrate-to-github.mjs [--all | --open] [--parent <id>] [--dry-run]
 *
 * Requires: gh CLI authenticated, and a GitHub remote configured.
 */

import {
  getRepoSlug,
  authStatus,
  createIssue,
  closeIssue,
  linkSubIssue,
} from '../lib/gh.mjs'
import { listTickets, collapseToStub, isOpen } from '../lib/ticket-store.mjs'

// ── Args ────────────────────────────────────────────────────────────────
function parseArgs(argv) {
  const args = { scope: 'open' }
  for (let i = 2; i < argv.length; i++) {
    switch (argv[i]) {
      case '--all': args.scope = 'all'; break
      case '--open': args.scope = 'open'; break
      case '--parent': args.parent = argv[++i]; break
      case '--dry-run': args.dryRun = true; break
      case '--help': case '-h':
        console.log(`Usage: migrate-to-github.mjs [--all | --open] [--parent <id>] [--dry-run]

  --all        migrate ALL local tickets (including done/closed)
  --open       migrate only open tickets (open, in-progress, review, qa)
  --parent <id>  migrate only tickets whose parent is <id>
  --dry-run    print what would migrate without creating anything on GitHub

Requires: gh CLI authenticated + a GitHub remote (git remote get-url origin).
After migration, local tickets collapse to a short description + a link to
the GitHub issue (read-only from then on).

Idempotent: tickets that already have a github_url are skipped.`)
        process.exit(0)
      default:
        console.error(`✗ Unknown flag: ${argv[i]}`)
        console.error('Run with --help for usage.')
        process.exit(1)
    }
  }
  return args
}

// pull the trailing issue number out of a GitHub issue URL
function issueNumberFromUrl(url) {
  const m = url.match(/issues\/(\d+)$/)
  return m ? Number(m[1]) : null
}

// ── Main ────────────────────────────────────────────────────────────────
const args = parseArgs(process.argv)

// preflight: remote + auth (both throw inside the adapter)
const repo = getRepoSlug()
if (!repo) {
  console.error('✗ No GitHub remote found. Run: git remote add origin <url>')
  process.exit(1)
}
try {
  authStatus()
} catch {
  console.error('✗ gh CLI not authenticated. Run: gh auth login')
  process.exit(1)
}

const tickets = listTickets()
if (tickets.length === 0) {
  console.error('✗ No tickets found. Is tickets/ empty?')
  process.exit(1)
}

// filter: skip already-migrated, then scope (--all / --open), then --parent
let filtered = tickets.filter((t) => !t.github_url)
if (args.scope === 'open') {
  filtered = filtered.filter((t) => isOpen(t.status))
}
if (args.parent) {
  filtered = filtered.filter((t) => t.parent === args.parent)
}

if (filtered.length === 0) {
  console.log('No tickets to migrate (all already have a github_url, or none match the filter).')
  process.exit(0)
}

console.log(`${args.dryRun ? 'Dry run: would migrate' : 'Migrating'} ${filtered.length} ticket(s) to ${repo}…\n`)

// Phase 1: create each issue, then collapse the local ticket to a stub.
// Track id → issue number so Phase 2 can link sub-issues to parents.
const idToNumber = {} // ticket.id → GitHub issue number
let created = 0
let skipped = 0

for (const t of filtered) {
  if (args.dryRun) {
    console.log(`  #${t.id} ${t.title} → would create GitHub issue, then collapse local body`)
    created++
    continue
  }
  process.stdout.write(`  #${t.id} ${t.title}… `)
  try {
    const url = createIssue(repo, {
      title: t.title,
      body: t.body,
      type: t.type,
      labels: t.labels,
    })
    const number = issueNumberFromUrl(url)
    if (number) idToNumber[t.id] = number

    // already-done locally → the GitHub issue should reflect that
    if (!isOpen(t.status) && number) {
      closeIssue(repo, number)
    }

    collapseToStub(t.id, url)
    console.log(`✓ ${url}`)
    created++
  } catch (e) {
    console.log(`✗ ${e.message}`)
    skipped++
  }
}

// Phase 2: link sub-issues to parents (both must have been created this run)
if (args.dryRun) {
  console.log('\n(dry run — skipping sub-issue linking)')
} else {
  console.log('\nLinking sub-issues…')
  for (const t of filtered) {
    if (!t.parent) continue
    const subNumber = idToNumber[t.id]
    const parentNumber = idToNumber[t.parent]
    if (!subNumber || !parentNumber) continue
    process.stdout.write(`  #${t.id} → parent #${t.parent}… `)
    try {
      linkSubIssue(repo, parentNumber, subNumber)
      console.log('✓')
    } catch {
      console.log('⚠ (non-fatal)')
    }
  }
}

console.log(`\n${args.dryRun ? 'Dry run: ' : ''}Done: ${created} ${args.dryRun ? 'would be created' : 'created'}, ${skipped} failed, ${tickets.length - filtered.length} already migrated.`)
