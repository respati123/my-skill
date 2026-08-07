#!/usr/bin/env node
/**
 * Create a ticket via the kanban API.
 *
 * Usage:
 *   node ticket-create.mjs --type feat --slug login-page [--title "Login Page"] \
 *     [--status open] [--parent 0001] [--labels frontend,auth]
 *
 * The server writes the .md file; this script is a thin CLI wrapper.
 */

const BASE = process.env.KANBAN_URL || 'http://localhost:3211'

function parseArgs(argv) {
  const args = { labels: [] }
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i]
    const next = () => argv[++i]
    switch (a) {
      case '--type': args.type = next(); break
      case '--slug': args.slug = next(); break
      case '--title': args.title = next(); break
      case '--status': args.status = next(); break
      case '--parent': args.parent = next(); break
      case '--labels': args.labels = (next() || '').split(',').filter(Boolean); break
      case '--help': case '-h':
        console.log(`Usage: ticket-create.mjs --type <type> --slug <slug> [options]

  --type       feat | fix | task | chore | docs (required)
  --slug       kebab-case slug, e.g. "login-page" (required)
  --title      human title (optional, defaults to slug)
  --status     open | in-progress | review | qa | done (default: open)
  --parent     parent ticket id (optional)
  --labels     comma-separated, e.g. "frontend,auth"`)
        process.exit(0)
    }
  }
  return args
}

const args = parseArgs(process.argv)

if (!args.type || !args.slug) {
  console.error('Usage: ticket-create.mjs --type <type> --slug <slug>')
  console.error('Run with --help for details.')
  process.exit(1)
}

const res = await fetch(`${BASE}/api/tickets`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(args),
})

const data = await res.json()

if (!res.ok) {
  console.error(`Error: ${data.error}`)
  process.exit(1)
}

const t = data.ticket
console.log(`✓ Created ticket #${t.id} [${t.type}] ${t.title}`)
console.log(`  file: tickets/${t.filename}`)
console.log(`  status: ${t.status}`)
