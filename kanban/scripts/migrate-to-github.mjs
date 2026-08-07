#!/usr/bin/env node
/**
 * Migrate local tickets to GitHub.
 *
 * One-way: local → GitHub. After migration, local .md files become
 * read-only shadows (github-url filled in the frontmatter).
 *
 * Usage:
 *   node migrate-to-github.mjs --parent 0001 [--all | --open]
 *
 * Flow:
 *   1. Read all tickets/*.md
 *   2. Skip ones that already have a github-url (already migrated)
 *   3. For each: create a GitHub issue from the .md body + frontmatter
 *   4. Link sub-issues to parent via GitHub's sub_issue API
 *   5. Write github-url back into each .md frontmatter
 *   6. Report: created / skipped / failed
 *
 * Requires: gh CLI authenticated, and a GitHub remote configured.
 */

import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import matter from 'gray-matter'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const TICKETS_DIR = path.join(ROOT, 'tickets')

// ── Args ────────────────────────────────────────────────────────────────
function parseArgs(argv) {
  const args = { scope: 'open' }
  for (let i = 2; i < argv.length; i++) {
    switch (argv[i]) {
      case '--all': args.scope = 'all'; break
      case '--open': args.scope = 'open'; break
      case '--parent': args.parent = argv[++i]; break
      case '--help': case '-h':
        console.log(`Usage: migrate-to-github.mjs [--all | --open] [--parent <id>]

  --all        migrate ALL local tickets (including done/closed)
  --open       migrate only open tickets (open, in-progress, review, qa)
  --parent <id>  migrate only tickets whose parent is <id>

Requires: gh CLI authenticated + a GitHub remote (git remote get-url origin).
After migration, local .md files get github-url in frontmatter (read-only shadow).

Idempotent: tickets that already have github-url are skipped.`)
        process.exit(0)
    }
  }
  return args
}

// ── GitHub helpers ──────────────────────────────────────────────────────
function getRepoSlug() {
  try {
    const url = execSync('git remote get-url origin', { encoding: 'utf-8' }).trim()
    // ssh: git@github.com:owner/repo.git
    // https: https://github.com/owner/repo.git
    const m = url.match(/github\.com[:/]([^/]+)\/([^/.]+)/)
    return m ? `${m[1]}/${m[2]}` : null
  } catch {
    return null
  }
}

function gh(...args) {
  return execSync('gh ' + args.join(' '), { encoding: 'utf-8' }).trim()
}

const TYPE_TO_LABEL = {
  feat: 'feature',
  fix: 'bug',
  task: 'task',
  chore: 'chore',
  docs: 'documentation',
}

function createIssue(repo, ticket) {
  const label = TYPE_TO_LABEL[ticket.type] || 'task'
  const body = matter(ticket.raw).content
  // build the title: "FR-2.1 — Login Page" or just "Login Page"
  const title = ticket.title
  const extraLabels = ticket.labels.length ? ` --label ${ticket.labels.map(l => `"${l}"`).join(',')}` : ''

  try {
    const issueUrl = gh(
      'issue create',
      `--repo ${repo}`,
      `--title "${title.replace(/"/g, '\\"')}"`,
      `--body "${body.replace(/"/g, '\\"').replace(/\n/g, '\\n')}"`,
      `--label ${label}${extraLabels}`,
    )
    return issueUrl
  } catch (e) {
    throw new Error(`gh issue create failed: ${e.message}`)
  }
}

function linkSubIssue(repo, parentId, subIssueUrl) {
  // Extract issue number from URL (last path segment)
  const m = subIssueUrl.match(/issues\/(\d+)$/)
  if (!m) return
  const subNumber = m[1]
  // Get parent issue number from its github-url
  const parentM = parentId.match(/issues\/(\d+)$/)
  if (!parentM) return
  const parentNumber = parentM[1]
  try {
    const subId = gh('api', `repos/${repo}/issues/${subNumber}`, '--jq .id')
    gh('api', `repos/${repo}/issues/${parentNumber}/sub_issues`, '-F', `sub_issue_id=${subId}`)
  } catch {
    // linking failure is non-fatal — the issue exists, just not linked
  }
}

// ── Main ────────────────────────────────────────────────────────────────
const args = parseArgs(process.argv)

// preflight
const repo = getRepoSlug()
if (!repo) {
  console.error('✗ No GitHub remote found. Run: git remote add origin <url>')
  process.exit(1)
}
try {
  gh('auth status')
} catch {
  console.error('✗ gh CLI not authenticated. Run: gh auth login')
  process.exit(1)
}

if (!fs.existsSync(TICKETS_DIR)) {
  console.error(`✗ No tickets/ directory at ${TICKETS_DIR}`)
  process.exit(1)
}

// load all local tickets
const files = fs.readdirSync(TICKETS_DIR).filter((f) => f.endsWith('.md'))
const tickets = files.map((filename) => {
  const filepath = path.join(TICKETS_DIR, filename)
  const raw = fs.readFileSync(filepath, 'utf-8')
  const { data, content } = matter(raw)
  return {
    filename,
    filepath,
    raw,
    id: data.id,
    type: data.type,
    title: data.title || filename.replace(/\.md$/, '').replace(/^\d+-\w+-/, '').replace(/-/g, ' '),
    status: data.status || 'open',
    parent: data.parent || null,
    labels: data.labels || [],
    githubUrl: data['github-url'] || null,
  }
})

// filter
let filtered = tickets.filter((t) => !t.githubUrl) // skip already migrated
if (args.scope === 'open') {
  const openStatuses = ['open', 'in-progress', 'review', 'qa']
  filtered = filtered.filter((t) => openStatuses.includes(t.status))
}
if (args.parent) {
  filtered = filtered.filter((t) => t.parent === args.parent)
}

if (filtered.length === 0) {
  console.log('No tickets to migrate (all already have github-url, or none match the filter).')
  process.exit(0)
}

console.log(`Migrating ${filtered.length} ticket(s) to ${repo}…\n`)

const OPEN_STATUSES = ['open', 'in-progress', 'review', 'qa']
let created = 0
let skipped = 0
const idToUrl = {} // for sub-issue linking after all are created

// Phase 1: create all issues
for (const t of filtered) {
  process.stdout.write(`  #${t.id} ${t.title}… `)
  try {
    const url = createIssue(repo, t)
    idToUrl[t.id] = url

    // If the ticket is already done locally, close the issue
    if (!OPEN_STATUSES.includes(t.status)) {
      const m = url.match(/issues\/(\d+)$/)
      if (m) gh('issue close', m[1], `--repo ${repo}`)
    }

    // write github-url back into frontmatter
    const { data, content } = matter(t.raw)
    data['github-url'] = url
    data.id = String(data.id).padStart(4, '0')
    fs.writeFileSync(t.filepath, matter.stringify(content, data), 'utf-8')

    console.log(`✓ ${url}`)
    created++
  } catch (e) {
    console.log(`✗ ${e.message}`)
    skipped++
  }
}

// Phase 2: link sub-issues to parents
console.log('\nLinking sub-issues…')
for (const t of filtered) {
  if (t.parent && idToUrl[t.id] && idToUrl[t.parent]) {
    process.stdout.write(`  #${t.id} → parent #${t.parent}… `)
    try {
      linkSubIssue(repo, idToUrl[t.parent], idToUrl[t.id])
      console.log('✓')
    } catch {
      console.log('⚠ (non-fatal)')
    }
  }
}

console.log(`\nDone: ${created} created, ${skipped} failed, ${tickets.length - filtered.length} already migrated.`)
