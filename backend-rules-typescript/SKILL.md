---
name: backend-rules-typescript
description: TypeScript backend coding conventions for this workflow's coder role — types, error/response shape, logging, imports, function size, comments, Postman/ERD sync, linting, middleware, routing. Auto-loaded for backend-labelled TypeScript sub-issues; use when implementing or reviewing TypeScript backend/API code.
---

# Backend Rules (TypeScript)

Conventions the `coder` role follows on any `backend`-labelled TypeScript
sub-issue. Load this before writing or editing backend code.

## Types

No `any` — use `unknown` with narrowing, generics, or a real type/interface.
Types and interfaces live in their own files under `types/`, one domain per
file (e.g. `types/user.ts`, `types/order.ts`), not inlined next to the code
that uses them.

## Error handling

Errors are constants, not inline strings scattered across call sites —
define each once (e.g. `errors/codes.ts`) and reference the constant
everywhere, so a message or code change is a one-line edit, not a grep-and-
replace.

## Response shape

Every API response follows the same envelope:

```ts
// success
{ status: "success", data: T }
// error
{ status: "error", error: { code: string, message: string } }
```

`error` appears only on failure; `data` only on success — never both, never
neither.

## Logging

Structured logs (JSON fields, not string concatenation) so Loki/Prometheus
can query on fields instead of grepping text. Respect log level: `debug` for
local/dev detail, `info`/`warn`/`error` in production — don't ship `debug`
noise to prod, don't drop context you'll need later. Every log line carries
the request ID (see Middleware below) so a request's full trail is
traceable across log lines.

## Imports

Absolute imports via the `@/*` alias — no `../../../` chains.

## Function size

Max 15 lines per function. Longer → extract and name the sub-step; don't
compress logic to dodge the line count, actually split it.

## Comments

None. If a name or structure needs a comment to be understood, rename or
restructure instead of explaining it.

## API docs & data model sync

Any API change (new or changed endpoint) → update the project's Postman
collection in the same PR, with **both a positive and a negative** example
request for the affected endpoint (not just the happy path). Any schema/
table change → update `ERD.md` in the same PR. Both are BLOCKING findings in
`techlead`'s review if missing — this isn't optional cleanup.

## Linting & formatting

Biome for lint + format. Run it before handing off; fix everything it flags,
don't hand off with known lint debt.

## Middleware

- **Request-ID middleware**: every request gets a unique ID, threaded through
  every log line for that request.
- **Centralized error-handler middleware**: routes throw or pass errors to
  it; it maps them to the response shape above. No per-route try/catch that
  duplicates this mapping.

## Routing

One router per resource/domain, in its own file/folder (e.g.
`routes/users.ts`) — no single file accumulating every endpoint.

## No redundant functions

Before writing a new helper, grep for one that already does this — reuse it
instead of reimplementing.
