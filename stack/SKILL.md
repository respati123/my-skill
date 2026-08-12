---
name: stack
description: Grill the user through a top-down tech-stack decision tree (topology → deployment → backend → frontend → mobile) driven by BRD/PRD signals, then write docs/architecture.md. Trigger on "stack", "tech stack", "pick the stack", "what technology", "tentukan tech stack", or after draft-prd when no architecture.md exists. Sits between draft-prd and draft-tickets in the relay chain.
---

# stack

Grill the user through a **top-down tech-stack decision tree**, driven by what
the BRD/PRD actually requires, then write `docs/architecture.md` — the one
document every downstream skill (`draft-tickets`, `implement-issue`, the
`coder` role) reads to know *how* to build, not just *what* to build.

This is the "HOW" stage. `draft-prd` answered WHAT. `draft-tickets` will break
that into implementable issues — but it can't, sanely, until the stack is
pinned. A sub-issue breakdown for a Hono+Bun monorepo looks nothing like one
for a Spring Boot microservices cluster; the stack decides the split.

## Entry gate

**Requires:** at least one approved PRD at `docs/prd/<slug>.md`. Stack
decisions grounded in real requirements beat guesses — and the requirements
live in the PRD. No PRD → run `/draft-prd` first.

**Skip if:** `docs/architecture.md` already exists with `Status: Confirmed`
(resume instead — see "Resume" below).

## Phase 0 — Scout (existing projects only)

If the project already has code (not a greenfield repo), do a quick read-only
scout pass first — the real stack is already on disk and the grill should
**confirm or amend**, not pretend the repo is blank:

- `package.json` / `go.mod` / `pyproject.toml` / `pom.xml` / `build.gradle` /
  `Cargo.toml` → language + framework + key deps
- `docker-compose.yml`, `Dockerfile` → deployment topology
- `turbo.json` / `pnpm-workspace.yaml` / `lerna.json` → monorepo signal
- existing `docs/` or `README.md` for stated architecture

Report what you detected in one block, then run the grill **proposing the
detected stack as the default at each node** ("detected: Hono + Bun + Drizzle —
keep, or change?"). Don't re-ask from zero what the repo already answers.

Greenfield (no code) → skip this phase, grill from the PRD signals.

## Phase 1 — Read the PRD/BRD signals

Before grilling, **skim every approved PRD + the BRD** and extract the signals
that drive infra decisions. State what you found, in one block, so the user
sees the basis for every recommendation:

| Signal in BRD/PRD | Implies |
|---|---|
| "realtime", "live updates", "chat", "collaborative editing" | WebSocket / SSE / server-sent events |
| "high transaction volume", "bursty traffic", "flash sale" | Redis cache, message queue (RabbitMQ / BullMQ / Kafka) |
| "background jobs", "email queue", "scheduled reports" | Job queue (BullMQ / Celery / Sidekiq / Asynq) |
| "full-text search", "search across X" | Elasticsearch / Meilisearch / Postgres FTS |
| "SEO", "server-rendered", "public marketing pages" | SSR framework (Next.js / Nuxt / Astro) over SPA |
| "offline support", "installable", PWA | service worker + manifest |
| "mobile app", "iOS and Android" | React Native / Expo / Flutter / native |
| "multi-tenant", "per-org data isolation" | row-level security / tenant ID pattern |
| "file uploads", "media storage" | S3-compatible object storage |
| "payments", "subscription" | Stripe / Lemon Squeezy + webhook handler |
| "analytics", "event tracking" | PostHog / Mixpanel / self-hosted |
| "monitoring", "observability", "production SLA" | OpenTelemetry / Sentry / structured logging (Pino / slog) |

If a PRD section is thin on a signal, **don't invent one** — say "no realtime
signal found; defaulting to no WebSocket layer unless you add it." The grill
proposes defaults from what's actually written, not hopeful guesses.

## Phase 2 — Grill (top-down decision tree)

Walk the user through the tree **one level at a time**. Each node: state the
**recommended default + one-line reasoning**, offer 2-3 alternatives, let the
user decide. Never a blank "what do you want?" — always a proposal with a why.

Use `AskUserQuestion` (single-select) at each node. The tree is sequential —
each level constrains the next (topology limits deploy options; backend
language limits framework/ORM choices; PRD signals add infra).

### Node 1 — Topology

**Default: monorepo** (one repo, one deploy unit) unless the BRD names
distinct services owned by different teams. Reasoning: a single repo keeps
the spec→code traceability chain (BRD → PRD → ticket → PR) intact; splitting
services early fragments that chain for no gain until scale or team
boundaries force it.

Options:
- **Monorepo** (recommended) — one repo, apps/ + packages/ if needed
- **Polyrepo** — separate repo per service/app, only if teams are separate
- **Microservices** — only if the BRD explicitly names >2 independent
  services with different scale/security/uptime needs; say the operational
  cost plainly (distributed tracing, inter-service auth, deploy coordination)

### Node 2 — Deployment

**Default: containerize** if the stack has a database, background workers,
or >1 service. Bare process if it's a single static SPA or a single binary
with no stateful deps.

Options:
- **Docker / docker-compose** (recommended for backends + DB) — reproducible,
  matches prod locally
- **Bare process** (Node/Bun directly, PM2) — only for single-process stateless apps
- **Serverless / edge** (Cloudflare Workers, Vercel, Lambda) — only if the
  PRD signals event-driven, cold-start-tolerant, low-memory workloads; call
  out the constraints (no long-lived connections, DB driver limits)

### Node 3 — Backend

Three sub-decisions, asked together (they constrain each other):

**3a. Language + framework.** Default by what this repo already supports with
a reference doc + coding rules:

| Stack | Reference doc | Coding rules |
|---|---|---|
| **TypeScript + Hono + Bun** (default — best-supported here) | `setup/references/architecture/backend/bun-hono-typescript.md` | `backend-rules-typescript.md` |
| TypeScript + Express + Node | `.../express-node-typescript.md` | `backend-rules-typescript.md` |
| Python + FastAPI | `.../fastapi-python.md` | (no TS rules — flag the gap) |
| Go + Gin/Fiber | `.../go-gin-fiber.md` | (no Go rules — flag the gap) |
| Java/Kotlin + Spring Boot | `.../spring-boot-java-kotlin.md` | (no JVM rules — flag the gap) |

**Recommend the default (TS + Hono + Bun)** unless a signal favors another:
existing team expertise, a library only available in language X, or a
hard performance requirement the BRD names. If the user picks a stack with
**no matching coding-rules doc**, say so plainly: "no `backend-rules-X` in
this repo — the `coder` role will run on `coding-principles.md` (generic)
only; conventions like import style and error shape will come from the
architecture reference doc instead."

**3b. Database.** Default by data shape:
- **PostgreSQL** (recommended default) — relational, mature, JSON columns,
  FTS, row-level security. Fits most PRDs.
- **MySQL / MariaDB** — only if team expertise or existing infra favors it
- **MongoDB** — only if the PRD signals deeply nested, schema-flexible
  documents with no relational queries (rare; most "we need flexibility"
  cases are better served by Postgres JSONB)
- **SQLite** — only for local-first / single-user / embedded (Turso, LiteFS
  for distributed)
- **Redis** — add as a cache/queue layer (not primary store) when PRD
  signals high-read or job-queue

**3c. ORM / data layer.** Default by stack:
- TS + Hono/Bun → **Drizzle** (recommended; lighter, better Bun support) or
  Prisma
- TS + Express → **Prisma** (recommended; ecosystem maturity) or Drizzle
- Python → **SQLAlchemy 2.0** (async) or SQLModel
- Go → **sqlc** (recommended; type-safe from SQL) or GORM
- Java/Kotlin → **Spring Data JPA** / Hibernate

**Infra add-ons (driven by Phase 1 signals — propose, don't ask blind):**
- Realtime → WebSocket lib per stack (Hono: `@hono/node-ws` / Bun ws; Express
  → `ws`; FastAPI → Starlette websockets; Go → gorilla/websocket or nhooyr's)
- High tx → Redis (cache) + queue (BullMQ / Celery / asynq)
- Search → Meilisearch (simple) or Postgres FTS (if already on PG)
- Monitoring → OpenTelemetry + Pino/slog structured logs + Sentry
- File storage → S3-compatible (R1, R2, MinIO local)

List only the ones the PRD signals. Don't propose Kafka for a CRUD app.

### Node 4 — Frontend

**Skip entirely if the PRD is backend-only** (no UI — an API, a CLI, a
background worker). Say that plainly.

Otherwise, three sub-decisions:

**4a. Framework.** Default by PRD signal:

| PRD signal | Recommended | Reference doc |
|---|---|---|
| SEO, marketing pages, content site | **Astro** | `.../astro.md` |
| SSR app, multi-page, auth-gated dashboard | **Next.js** | `.../nextjs-react.md` |
| Internal SPA, dashboard, no SEO need | **React + Vite** | `.../react-vite.md` |
| Team already on Vue | **Nuxt** | `.../nuxt-vue.md` |
| Team already on Svelte, bundle-size priority | **SvelteKit** | `.../sveltekit-svelte.md` |

Recommend the first matching signal. If no signal, **React + Vite** is the
safe default (lightest, most ecosystem).

**4b. UI components.** Default: **shadcn/ui + Tailwind** for React/Next/Svelte
(Nuxt → Nuxt UI; Astro → Tailwind only unless islands need a lib). Reasoning:
accessible, maintained baseline beats hand-rolling. Only go Tailwind-only if
the PRD demands a fully bespoke visual system.

**4c. State + data fetching.** Defaults:
- Server state → TanStack Query (React/Vue/Svelte) or the framework's native
  (Next RSC fetch, Nuxt useFetch, SvelteKit load)
- Client state → Zustand (React), Pinia (Vue), runes (Svelte 5)
- Forms → React Hook Form / VeeValidate / superforms + Zod

These are fixed per framework — don't ask, just record.

### Node 5 — Mobile (only if PRD signals)

If the BRD/PRD names "mobile app", "iOS", "Android":

**Default: React Native + Expo** — TypeScript consistency with the backend,
one language across the stack, Expo handles the native build pain. Only
propose Flutter or native if the PRD names a hard native-performance need
(graphics-heavy, AR) or the team has existing Dart/Swift/Kotlin expertise.

If no mobile signal → skip, say "no mobile layer — skipping."

## Phase 3 — Match to reference docs + flag gaps

After the grill, list which architecture reference docs apply (from
`setup/references/architecture/backend/` and `.../frontend/`), and **flag any
gap**: if the user picked a stack with no matching reference doc, say so and
offer to (a) proceed on generic `coding-principles.md` only, or (b) stop and
let the user / a researcher write the missing doc first.

The matching docs are what the `coder` role loads alongside the coding rules —
they carry the folder structure, import conventions, and naming patterns
specific to that stack. A gap here means the coder improvises structure; that's
a real cost worth naming.

## Phase 4 — Write `docs/architecture.md`

Write `docs/architecture.md` with these sections, every choice carrying its
one-line reasoning (not just the name — the *why*, so a future reader or a
spec revision can tell a deliberate decision from an accident):

```markdown
# Architecture

Status: Confirmed

## Decisions

### Topology
<monorepo | polyrepo | microservices> — <one-line reasoning>

### Deployment
<docker | bare | serverless> — <one-line reasoning>

### Backend
- Language + framework: <X> — <reasoning>
- Database: <X> — <reasoning>
- ORM: <X> — <reasoning>
- Infra: <list each add-on + which PRD signal triggered it>

### Frontend  (omit if backend-only)
- Framework: <X> — <reasoning>
- UI: <X>
- State/data/forms: <X>

### Mobile  (omit if no mobile signal)
- <X> — <reasoning>

## Reference docs loaded
- backend: setup/references/architecture/backend/<X>.md
- frontend: setup/references/architecture/frontend/<X>.md
- coding rules: <which rules docs apply>

## Folder structure (proposed)
<the tree from the matching reference doc, adapted to this project's name>

## Open questions / deferred
<anything the user deferred — "monitoring TBD until we see prod load", etc.>
```

Set `Status: Confirmed` once the user approves the written doc. **Promote any
hard-to-reverse decision to an ADR** via the `lexicon` skill if it clears the
significance bar (new datastore, a service-split, a public contract) — don't
bury an architectural decision in a stack doc when it deserves its own ADR.

## Phase 5 — Update AGENTS.md Stack section

Replace the AGENTS.md `## Stack` section (which was `TODO` or placeholder)
with the confirmed stack from `docs/architecture.md` — language(s),
framework(s), database, ORM, key infra. This is what `implement-issue` and the
`coder` role read before writing the first line of code.

## Resume

If `docs/architecture.md` exists with `Status: Confirmed`: report it, ask if
anything needs revising, and if not, advance. If it exists but `Status:
Draft` or missing sections, resume the grill at the first incomplete node.

A PRD or BRD revision downstream of a confirmed architecture → re-read the
signals; if a revision changes a signal (e.g. adds realtime to a previously
CRUD-only PRD), re-grill the affected node and update `docs/architecture.md`,
noting what changed and why.

## Next

Never end on "stack picked" and stop. Put the next step to the user — reply
with one:

1. **Lanjut — `/draft-tickets`** (Recommended). The stack is confirmed; break
   the PRD(s) into parent + sub-issues. The stack determines the sub-issue
   split (backend vs frontend vs mobile, dependency order).
2. **Lanjut — next PRD** if features remain without a PRD. The stack applies
   project-wide; finish the remaining PRDs first, then draft tickets for all
   of them.
3. **Diskusi / revisi** — a stack choice is off; say which node and I'll
   re-grill from there, then update `docs/architecture.md`.
4. **Berhenti** — leave here. Resume later with `/relay` (detects the
   confirmed architecture and offers `draft-tickets`), or run `/draft-tickets`
   directly.

**Architecture doc reminder:** `docs/architecture.md` is the source of truth
for *how*. If a decision feels significant enough to outlive the current PRD
(new datastore, service split, public API contract), promote it to an ADR via
`/lexicon` — don't let it live only in the stack doc.
