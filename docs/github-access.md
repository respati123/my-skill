# GitHub Access

This project supports two modes for issue/PR management: **GitHub-connected**
and **local-first** (kanban board). The skills work in both — they check for
`gh` and a remote, and fall back to local ticket files when GitHub isn't
configured.

## GitHub-connected mode

When `gh` is authenticated and a remote is configured (`git remote get-url
origin` succeeds):

- **Prefer MCP GitHub tools** when connected (the `mcp__github` toolset) —
  they're faster and avoid rate limits.
- **Otherwise run `gh` directly**:
  ```bash
  gh issue list --state open
  gh issue edit <n> --add-label in-progress
  gh pr review <PR> --approve --body "..."
  gh pr checkout <PR>
  gh pr checks <PR>
  gh api repos/{owner}/{repo}/issues/<n>/sub_issues --jq '.[] | "\(.number) \(.state)"'
  ```

## Local-first mode (kanban board)

When `gh` is not configured, or no remote exists, the pipeline runs on local
tickets instead. Every GitHub operation has a local equivalent:

| GitHub | Local equivalent |
|--------|-----------------|
| Create issue | `node kanban/scripts/ticket-create.mjs --type <t> --slug <s> --title "..."` |
| Label `in-progress` / `review` / `qa` / `done` | `node kanban/scripts/ticket-move.mjs <id> <status>` |
| List issues | `GET http://localhost:3211/api/tickets` (or open the board at `:3211`) |
| Check active ticket | `GET http://localhost:3211/api/active` (reads `tickets/.active` sidecar) |
| Link sub-issues | `--parent <id>` on `ticket-create.mjs` |
| Migrate to GitHub later | `node kanban/scripts/migrate-to-github.mjs --open` |

### Status mapping

| Kanban status | GitHub equivalent | Column |
|--------------|-------------------|--------|
| `open` | (no label, or `backlog`) | Backlog |
| `in-progress` | `in-progress` label | Coder |
| `review` | `review` label | Review |
| `qa` | `qa` label | QA |
| `done` | `done` label | Done |

### One-way migration

`migrate-to-github.mjs --open` pushes local tickets to GitHub issues (creates,
links sub-issues, writes `github-url` into frontmatter). After migration, local
files become **read-only shadows** — the board still displays them, but GitHub
is the source of truth for issue state.

## Blocked-by check

Before starting a sub-issue, check whether it's blocked by an unmerged
dependency. In GitHub mode, read the sub-issue's `blocked-by` metadata or the
parent's sub-issue list state. In local mode, the dependency order comes from
`draft-tickets`'s breakdown (backend before frontend) — `ship` follows the
same order.

## What stays manual regardless of mode

- **Merging a PR** — `ship` and the pipeline skills never auto-merge. The
  **techlead's LGTM is the merge signal**: once review passes, the user
  merges manually (it's the user's self-review checkpoint). QA runs
  **post-merge**, on `main` — so merge has to land before `verify-qa` can
  start. This ordering matters: QA on an unmerged feature branch tests the
  wrong thing.
- **Closing a parent issue** — GitHub doesn't auto-close a parent when its
  sub-issues close. The user closes it manually.
