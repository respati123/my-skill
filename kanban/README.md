# Kanban Board

Local ticket visualization for the spec-driven dev workflow. Tickets live as
Markdown files in `../tickets/` (source of truth); this board is a read
projection with drag-and-drop status changes that rewrite the `.md`
frontmatter.

## Quick start

```bash
# from this directory
pnpm install          # first time only
pnpm build            # build the frontend into dist/
node server.mjs       # serve API + board on http://localhost:3211
```

Open `http://localhost:3211` — the board loads, 5 columns visible
(Backlog → Coder → Review → QA → Done), tickets rendered from `../tickets/*.md`.

### Dev mode (hot reload)

```bash
pnpm dev              # Vite dev server on http://localhost:5173 (proxies API to :3211)
node server.mjs &     # API server in background
```

Use dev mode when editing the frontend; use `build` + `node server.mjs` for
the self-contained single-process setup the skills expect.

## Architecture

```
tickets/*.md  ←── source of truth (YAML frontmatter: id, type, status, parent, labels)
      │
      ▼
 server.mjs   ←── file watcher (chokidar) → re-index on any .md change
      │
      ├──► SQLite (data/kanban.db) ← projection cache, rebuilt from files
      │
      ├──► HTTP API (port 3211)
      │      GET    /api/tickets        list all
      │      POST   /api/tickets        create (.md written)
      │      PATCH  /api/tickets/:id    update status (.md rewritten)
      │      GET    /api/active         read tickets/.active sidecar
      │      POST   /api/reindex        force full re-index
      │
      └──► dist/  ← built frontend (served in prod mode)
```

**The UI never writes to SQLite.** A status change = PATCH that rewrites the
`.md` frontmatter; the watcher then re-indexes → SQLite updates. File is the
source of truth, SQLite is the read cache.

## Active lock

`tickets/.active` (gitignored) marks which ticket an agent is working on right
now: `{ "ticket": "0001", "agent": "coder", "started": "<ISO>" }`. The board
shows a pulsing blue dot on the active card; if the lock is older than 30
minutes, it turns amber ("stale lock" — the agent may have crashed without
clearing it). Skills write/delete this file at delegation boundaries.

## CLI scripts (`scripts/`)

The skills call these instead of touching `.md` files directly:

| Script | What it does |
|---|---|
| `ticket-create.mjs` | Create a ticket via the API (writes the `.md`) |
| `ticket-move.mjs` | Move a ticket to a new status (rewrites frontmatter) |
| `migrate-to-github.mjs` | Push local tickets to GitHub issues (one-way) |
| `e2e-test.mjs` | 105-assertion wiring test (server + CLI + structural) |

Run the E2E test any time to verify the pipeline wiring:
```bash
node scripts/e2e-test.mjs
```

## Status flow

```
open → in-progress → review → [merge] → qa → done
```

- `open` → backlog
- `in-progress` → coder working (`implement-issue`)
- `review` → techlead reviewing (`review-pr`); on LGTM, stays here until merged
- `qa` → post-merge QA (`verify-qa`); moved here when QA starts, after merge
- `done` → QA passed

## Tech

- **Frontend:** React 19 + TypeScript + Tailwind v4 + shadcn/ui + @dnd-kit
- **Backend:** Node.js HTTP server (no framework) + better-sqlite3 + chokidar
- **Build:** Vite
- **Package manager:** pnpm

No external runtime dependencies beyond Node — the server is a single
`server.mjs`, the watcher is chokidar, the DB is SQLite. Everything else is
dev/build tooling.
