# Bun + Hono + TypeScript (Backend)

Reference for the `coder` role on any `backend`-labelled TypeScript sub-issue
using Hono on the Bun runtime. Distilled from the highest-signal Hono+Bun
boilerplates, the official Hono API, and Bun's own conventions — then mapped
to this repo's `backend-rules-typescript.md` (which wins on any conflict):

- [ProMehedi/bun-hono-api-starter](https://github.com/ProMehedi/bun-hono-api-starter) — ~85★. The most complete production layout for Bun+Hono+Mongoose:
  `server.ts` entry, `config/ controllers/ routes/ middlewares/ models/ utils/
  components/`, `AppError` + `HTTPException` error layer, custom rate-limiter,
  `bodyLimit`/`secureHeaders`/`csrf`/`compress`/`cors` wired in order, dual
  Bun + Cloudflare Workers export.
- [kbkn3/hono-bun-cleanArchitecture](https://github.com/kbkn3/hono-bun-cleanArchitecture) — ~39★. Clean-architecture take
  (`src/domain/ src/adapters/ src/router/ src/middleware/ src/container.ts`),
  Biome, `bun test` + coverage, k6 perf harness, three deploy targets
  (CF Workers `wrangler`, Node `@hono/node-server`+`tsx`, Bun Docker). Use this
  as the reference for multi-runtime + testable structure.
- [nirnejak/hono-bun-starter](https://github.com/nirnejak/hono-bun-starter) — ~16★. The canonical **Drizzle + Zod + Better Auth**
  layout: `src/{routes,controllers,db,utils}`, `@/*` alias, `zValidator` +
  `drizzle-zod` (`createInsertSchema`) deriving validators from the DB schema,
  `bun --hot`, oxlint/oxfmt, Neon serverless Postgres.
- [Hono official docs](https://hono.dev) + this repo's `hono` skill
  (`/home/respati/.agents/skills/hono/SKILL.md`) — the API backstop for
  routing, `Context`, middleware, validation, JSX, streaming, RPC client.

> Where this doc says "recommended", it means *the modern Hono+Bun default for
> new code*. Where it flags a library as "edge-only" or "heavier", existing
> code may still use it — don't rewrite without reason, but don't pick it for a
> new service.

## Recommended stack components

| Layer | Recommended (new code) | Also common | Notes |
|---|---|---|---|
| Runtime | **Bun** (≥ 1.1) | — | Pin major in `engines`/`volta`. Native TS, test runner, bundler, `--hot` reload. |
| Framework | **Hono 4.x** | — | Edge-first; `export default app` runs on Bun/Workers/Deno/Bun. |
| Language | **TypeScript, `"strict": true`** | — | No `any` — see `backend-rules-typescript.md`. |
| ORM (SQL) | **Drizzle ORM** (dominates Hono+Bun repos; edge-compatible, SQL-first) | Prisma (heavier, only recently Bun-friendly), Kysely | Drizzle wins here because it ships serverless/edge drivers (Neon, PlanetScale, Turso) and a `drizzle-zod` bridge that derives validators from the schema — nirnejak's pattern. |
| ORM (Mongo) | **Mongoose** (ProMehedi's choice) | — | The only mature Mongo option on Bun. |
| Validation | **Zod** via `@hono/zod-validator` (Hono's blessed middleware) | Valibot via `@hono/standard-validator`, Hono's `validator()` built-in | Zod is the de facto default; `z.infer` feeds TS types and `drizzle-zod`/`zod-openapi` reuse the schema. |
| Auth | **`hono/jwt`** + `hono/bearer-auth` (built-in) or **Better Auth** (full framework) | Lucia, Clerk | Built-in JWT covers most APIs; Better Auth (nirnejak) when you need sessions + OAuth + email. |
| Linter | **Biome** (kbkn3; this repo's default) | oxlint (nirnejak — newest/fastest), ESLint `@typescript-eslint` (established) | Biome = lint+format in one Rust binary. oxlint/oxfmt is the bleeding edge. ESLint is fine if already present. |
| Formatter | **Biome** (same tool) / oxfmt / Prettier (ProMehedi) | — | Don't mix — pick one. |
| Test | **`bun test`** (native, zero-config — kbkn3) | Vitest (if you need Vite-plugin parity / jsdom) | `bun test` is the default for pure-Bun services; no `ts-jest`/`tsx` dance. |
| Package manager | **Bun** (`bun install`, `bun.lock`) | pnpm | Bun is both runtime and PM here — `bun.lock` is the lockfile. |
| Dev runner | **`bun --hot src/index.ts`** | `bun src/index.ts` (no reload) | `--hot` = fast in-place reload, keeps port open. |
| HTTP logging | **`hono/logger`** (built-in, dev) → structured **Pino** prod (ProMehedi) | — | `hono/logger` to stdout in dev; Pino for JSON prod logs with redact paths. |
| App logging | **Pino** (ProMehedi) / `hono/logger` | — | Pino = fastest JSON logger on Bun. |
| API docs | **Zod → OpenAPI** (`@asteasolutions/zod-to-openapi` + `@hono/zod-openapi`) or Scalar/ZodOpenAPI Hono middleware | hand-written Swagger | Generate the spec from the same Zod schemas that validate input. |
| Process mgr (non-container) | none needed — Bun is the process | PM2 (rare on Bun) | In Docker/K8s the orchestrator owns restarts. |

## Folder structure

A consensus layout blending ProMehedi (controllers/routes/middlewares split),
nirnejak (Drizzle `db/`, Zod validators inline), and this repo's rules
(one domain per file, types in `types/`):

```
src/
  index.ts                # entry: create app, wire global middleware, mount routers, `export default app`
  app.ts                  # (optional) app factory if index.ts stays thin; useful for tests (app.request())
  env.ts                  # Zod-validated env singleton (see Environment)
  lib/
    db.ts                 # Drizzle client singleton (or prisma.ts / mongoose.ts)
    logger.ts             # pino instance (prod) / hono/logger passthrough (dev)
    drizzle.ts            # (optional) createFactory<Env>() to share types — see Middleware
  routes/
    index.ts              # mounts each domain router under the app
    user.routes.ts        # one Hono() per resource, zValidator + handler per route
    auth.routes.ts
    waitlist.routes.ts
  controllers/
    user.controller.ts    # HTTP only: read c.req.valid('json'), call service, return c.json(). No business logic.
    auth.controller.ts
  services/               # (optional, for non-trivial logic) business rules + DB calls. No Hono types imported.
    user.service.ts
  schemas/                # Zod schemas, one per domain; request DTOs. Derive from Drizzle via drizzle-zod where possible.
    user.schema.ts
    auth.schema.ts
  middlewares/
    error.ts              # app.onError + app.notFound (registered on the root app)
    auth.ts               # jwt verify via hono/jwt, c.set('user', ...), role check
    rate-limit.ts         # rateLimit({...}) factory + presets (strict/standard/signup)
    request-id.ts         # c.set('requestId', ...), bind logger child
    logger.ts             # pino-http style request logging
  models/                 # Mongoose models (Mongo only); OR:
  db/
    schema.ts             # Drizzle table defs (pgTable/...) + relations
    migrations/           # generated SQL from `drizzle-kit generate`
    index.ts              # drizzle(...) client instance
  types/
    env.ts                # Hono Env generics: Bindings (D1/KV/DB) + Variables (user, requestId)
    user.ts               # domain DTOs (response shapes)
    common.ts             # PaginationQuery, Envelope<T>, etc.
  utils/
    http-errors.ts        # AppError + HTTPException helpers
    jwt.ts                # sign/verify wrappers around hono/jwt
    response.ts           # envelope helpers: ok(data), created(data), paginated(...)
tests/
  user.controller.test.ts # uses app.request() — no server start
  user.routes.test.ts
  setup.ts
drizzle.config.ts         # (Drizzle) schema path, out dir, dialect, dbCredentials
tsconfig.json
package.json
.env.example
Dockerfile
```

Notes:
- **`index.ts` vs `app.ts`** — Hono's idiomatic entry is `export default app`
  in `index.ts` (works on Bun, Workers, Deno). Splitting `app.ts` (the Hono
  instance) from `index.ts` (the export/server) makes `app.request()` tests
  cleaner — ProMehedi collapses both into `server.ts`; nirnejak keeps one
  `src/index.ts`. Pick one; consistency > the choice.
- **`schemas/` vs `models/`** — schemas = *input* shape (request DTOs, Zod);
  models/db = *persistence* shape (ORM). They diverge on purpose.
  `drizzle-zod`'s `createInsertSchema(table).omit({ id: true })` (nirnejak)
  lets one Drizzle table drive its create/update validators — single source.
- **`types/env.ts`** — Hono's typed `Env` (`Bindings` + `Variables`) is the
  Hono equivalent of Express's `Request` augmentation. Put it in one place,
  thread it via `new Hono<Env>()` or `createFactory<Env>()`.
- **No `routes/v1/` unless you actually version.** Hono's `basePath('/api/v1')`
  (ProMehedi) or `app.route('/api/v1', api)` does the prefix; only shard into
  `v1/`, `v2/` when you ship a v2.

## Conventions

### Import style — absolute via `@/*` (or `~/*`), resolved natively by Bun

Hono+Bun repos use a **single** tsconfig `paths` alias and Bun resolves it at
runtime with **no extra plugin** — this is the key DX win over Express+tsx:

```jsonc
// tsconfig.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": { "@/*": ["./src/*"] }   // nirnejak; ProMehedi uses "~/*": ["./*"]
  }
}
```

- **Dev**: `bun --hot src/index.ts` resolves `@/...` from tsconfig natively. No
  `tsconfig-paths`, no `-r register`.
- **Build**: `bun build src/index.ts --outdir dist` also resolves paths
  natively. If you instead `tsc`-emit (rare on Bun), add `tsc-alias` — `tsc`
  alone does not rewrite `paths`.
- Import order convention (nirnejak CLAUDE.md): external libs first, blank
  line, then `@/...` locals. Named imports throughout (tree-shaking).
- Avoid `../../../` chains (repo rule). One alias, used everywhere.

### Endpoint naming — REST nouns, `app.route()` mounting, chained routes

- Nouns, plural: `/users`, `/users/:userId`, `/users/:userId/orders`. HTTP verbs
  carry intent; no `/getUser`.
- **One `Hono()` instance per resource**, mounted with `app.route()` — Hono's
  equivalent of Express's `Router()`:

```ts
// src/routes/user.routes.ts
import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { auth } from '@/middlewares/auth'
import { createUserSchema } from '@/schemas/user.schema'
import { createUser, getUser } from '@/controllers/user.controller'

const user = new Hono()

user.post('/', zValidator('json', createUserSchema), createUser)
user.get('/:id', auth, getUser)

export default user
```

```ts
// src/routes/index.ts
import { Hono } from 'hono'
import user from './user.routes'
import auth from './auth.routes'

const api = new Hono().basePath('/api/v1')   // or set the prefix at the mount point
api.route('/users', user)
api.route('/auth', auth)

export default api

// src/index.ts
const app = new Hono()
app.route('/', api)          // mount the versioned tree
export default app
```

- **Chained routes preserve types for RPC** (Hono-specific). For type-safe
  `hc()` clients, assign the chain to a const and export its type:

```ts
const route = user
  .post('/', zValidator('json', createUserSchema), createUser)
  .get('/:id', auth, getUser)
export type UserRoute = typeof route   // feed to hc<UserRoute>(url) on the client
```

  Without chaining, `InferRequestType`/`InferResponseType` lose inference.

### Variable/function naming

- **Variables/functions**: `camelCase` — `getUsers`, `createUser`, `userRoutes`.
- **Types/Interfaces/Classes**: `PascalCase` — `UserResponse`, `AppError`, `Env`.
- **Files**: `kebab-case` — `user.routes.ts`, `http-errors.ts` (ProMehedi uses
  `user.controllers.ts`/`user.routes.ts`; nirnejak uses single-word `user.ts`).
  Pick one suffix convention and grep-enforce it.
- **DB columns**: `snake_case` (Drizzle convention — `created_at`, `user_id`).
- **Constants**: `UPPER_SNAKE_CASE` — `JWT_SECRET`, `MAX_POOL_SIZE`.

### Type definitions — `Env` generics + `z.infer`, no dual maintenance

Hono types requests via **middleware**, not by annotating `req`/`res`. The
typed surface area is the `Env` and the Zod schema:

```ts
// src/types/env.ts
import type { Context, MiddlewareHandler } from 'hono'

export type Env = {
  Bindings: {
    // Platform bindings (Cloudflare: D1Database, KVNamespace; Bun: usually empty)
    DATABASE_URL: string
  }
  Variables: {
    user: { id: string; role: 'admin' | 'user' }   // set by auth middleware
    requestId: string                                // set by request-id middleware
  }
}

export type AppContext = Context<Env>
export type AppMiddleware = MiddlewareHandler<Env>
```

```ts
// src/schemas/user.schema.ts
import { z } from 'zod'

export const createUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
})
export type CreateUserInput = z.infer<typeof createUserSchema>   // no hand-written DTO

export const userResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
})
export type UserResponse = z.infer<typeof userResponseSchema>
```

- **Response types**: export from `schemas/` (Zod-derived) or `types/` (plain
  interfaces). Don't hand-write what `z.infer` gives you.
- **Validated body is fully typed** in the handler: `const body = c.req.valid('json')`
  is `CreateUserInput`, not `any`.

### Error handling — `HTTPException` first, `AppError` for typed subclasses, `app.onError` central

Hono's error flow has **two** native hooks — `app.onError(handler)` (the
central handler, equivalent to Express's terminal error middleware) and
`app.notFound(handler)` (404). The idiomatic way to *raise* an HTTP error
inside a handler is `HTTPException`:

```ts
// raising — Hono-native, no custom class needed for the common case
import { HTTPException } from 'hono/http-exception'

export const getUser = async (c: AppContext) => {
  const user = await userService.findById(c.req.param('id'))
  if (!user) throw new HTTPException(404, { message: 'User not found' })
  return c.json({ user })
}
```

```ts
// src/middlewares/error.ts — the single central handler
import type { ErrorHandler, NotFoundHandler } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { ZodError } from 'zod'
import { env } from '@/env'
import { logger } from '@/lib/logger'
import { AppError } from '@/utils/http-errors'

export const errorHandler: ErrorHandler = (err, c) => {
  // 1. Hono's own HTTPException — carry its status
  if (err instanceof HTTPException) {
    return c.json({ success: false, error: { code: err.status, message: err.message } }, err.status)
  }
  // 2. Custom AppError subclasses (ValidationError, NotFoundError, ...)
  if (err instanceof AppError) {
    return c.json({ success: false, error: { code: err.statusCode, message: err.message } }, err.statusCode)
  }
  // 3. Zod validation errors (defense-in-depth — zValidator returns 400 already)
  if (err instanceof ZodError) {
    return c.json({ success: false, error: { code: 400, message: err.issues.map(i => i.message).join(', ') } }, 400)
  }
  // 4. Unknown — mask in prod, log, 500
  logger.error({ requestId: c.get('requestId'), err })
  const message = env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message
  return c.json({ success: false, error: { code: 500, message } }, 500)
}

export const notFound: NotFoundHandler = (c) =>
  c.json({ success: false, error: { code: 404, message: `Not Found - [${c.req.method}]:[${c.req.path}]` } }, 404)
```

Register **after** all routes (ProMehedi pattern):

```ts
// src/index.ts
app.route('/', api)
app.onError(errorHandler)
app.notFound(notFound)
export default app
```

When you want typed, named errors (cleaner than `throw new HTTPException(400,
{ message })` scattered around), subclass `AppError` — ProMehedi's shape:

```ts
// src/utils/http-errors.ts
export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly isOperational = true,
  ) {
    super(message)
    Object.setPrototypeOf(this, new.target.prototype)   // correct prototype across runtimes
    Error.captureStackTrace?.(this, this.constructor)
  }
}
export class ValidationError extends AppError { constructor(m: string) { super(400, m) } }
export class AuthenticationError extends AppError { constructor(m = 'Authentication failed') { super(401, m) } }
export class NotFoundError extends AppError { constructor(resource: string) { super(404, `${resource} not found`) } }
```

- **No try/catch in handlers.** Hono routes unhandled rejections/throws to
  `app.onError` automatically — no `asyncHandler` wrapper needed (unlike
  Express). This is a real reduction in boilerplate.
- **No stack in prod responses** — `app.onError` strips it; the express-doc
  security rule applies identically.

### Middleware — `createMiddleware`/`createFactory`, typed `Env`, registration order

Hono middleware is `(c, next) => ...` (or `Promise<void>`). Define reusable,
typed middleware with `createMiddleware` from `hono/factory`; share the `Env`
across app + handlers with `createFactory`:

```ts
// src/middlewares/auth.ts
import { createMiddleware } from 'hono/factory'
import { HTTPException } from 'hono/http-exception'
import { verify } from 'hono/jwt'
import { env } from '@/env'
import type { Env } from '@/types/env'

export const auth = createMiddleware<Env>(async (c, next) => {
  const header = c.req.header('Authorization')
  if (!header?.startsWith('Bearer ')) throw new HTTPException(401, { message: 'Missing token' })
  try {
    const payload = await verify(header.slice(7), env.JWT_SECRET)
    c.set('user', { id: payload.sub as string, role: payload.role as 'admin' | 'user' })
  } catch {
    throw new HTTPException(401, { message: 'Invalid token' })
  }
  await next()
})
```

**Execution order = registration order.** `await next()` runs downstream; code
*after* `next()` runs on the way back (post-handler — set response headers,
log elapsed):

```ts
app.use(async (c, next) => {
  const start = Date.now()
  await next()
  c.res.headers.set('X-Response-Time', `${Date.now() - start}ms`)
})
```

**Built-in middleware to wire by default** (all ship with Hono, all seen in
ProMehedi's `server.ts`):

| Middleware | Import | Purpose |
|---|---|---|
| Logger | `hono/logger` | Request log to stdout (dev). |
| Secure headers | `hono/secure-headers` | HSTS, no-sniff, frameguard, CSP. Always on, near the top. |
| CORS | `hono/cors` | Origin allowlist per env; never bare `cors()` in prod. |
| CSRF | `hono/csrf` | Origin check on state-changing requests (prod). |
| Body limit | `hono/body-limit` | Cap payload (e.g. 1 MiB) — blocks oversized bodies. |
| Compress | `hono/compress` | gzip/brotli responses above threshold. |
| ETag | `hono/etag` | Conditional requests, saves bandwidth. |
| Request ID | `hono/request-id` | Assigns/c.thread `X-Request-Id` (or roll your own). |
| Rate limit | custom `rateLimit({...})` factory (ProMehedi) | Per-route presets; Redis store in multi-instance. |
| Auth | `hono/jwt` / `hono/bearer-auth` / custom | Verify token, `c.set('user', ...)`, role checks. |
| Pretty JSON | `hono/pretty-json` | `?pretty` query for dev-readable JSON. |

**Order matters** — ProMehedi's chain is a good reference: `loggerMiddleware →
secureHeaders → csrf(prod) → rateLimit → bodyLimit → compress → cors → routes →
onError → notFound`. Authorize/validate per-route (`auth`/`zValidator` in the
route's middleware args), not globally.

### Environment — Zod-validated env at boot, `process.env` on Bun / `c.env` on Workers

Load and validate env once, fail fast. On Bun you have `process.env`; on
Cloudflare Workers you read bindings from `c.env` (there is no `process`). Keep
both happy by validating `process.env` into a typed singleton and reading
platform bindings off the context:

```ts
// src/env.ts
import { z } from 'zod'

const schema = z.object({
  NODE_ENV: z.enum(['production', 'development', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  ALLOWED_ORIGINS: z.string().default('http://localhost:3000'),
})

const parsed = schema.safeParse(process.env)
if (!parsed.success) {
  console.error('❌ Invalid env vars:', parsed.error.flatten().fieldErrors)
  process.exit(1)
}
export const env = parsed.data
```

- Never `process.env.X` elsewhere — import `env`. One source of truth.
- `.env` never committed; ship `.env.example` with keys, no values (both repos do).
- **Workers caveat**: `process.env` is undefined on CF Workers — move secrets
  into `wrangler.toml` `[vars]` / secrets and read via `c.env`/`hono/env`'s
  `env(c)`. If you target both runtimes, gate env access behind `env()` and
  use `Bindings` for the Workers path.

## Database setup

### Drizzle (recommended for SQL) — schema in TS, generated SQL migrations

- **Schema location**: `src/db/schema.ts` (one `pgTable` per table + `relations`).
  nirnejak co-locates all tables there; for >10 tables, split per domain
  (`src/db/schema/user.ts`) and barrel-export from `schema/index.ts`.
- **Client singleton** — one `drizzle(...)` per process. nirnejak uses the Neon
  serverless driver (edge-friendly); `pg`/`postgres-js` for a long-lived
  connection pool on a Bun VM:

```ts
// src/lib/db.ts  (Neon serverless — edge/Bun, HTTP per query)
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from '@/db/schema'

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set')
const sql = neon(process.env.DATABASE_URL)
export const db = drizzle({ client: sql, schema })
```

```ts
// src/lib/db.ts  (postgres-js — Bun VM, pooled TCP)
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from '@/db/schema'

const client = postgres(process.env.DATABASE_URL!, { max: 10 })
export const db = drizzle({ client, schema })
```

- **drizzle.config.ts** at repo root (nirnejak):

```ts
// drizzle.config.ts
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './src/db/migrations',
  dialect: 'postgresql',
  dbCredentials: { url: process.env.DATABASE_URL! },
})
```

- **Migrations**: `drizzle-kit generate` (dev — emits versioned SQL to
  `src/db/migrations/`), `drizzle-kit migrate` (apply). `db:push` is the
  fast-path for prototyping (pushes schema directly, no migration files) —
  **never in prod**. A schema change → a generated migration in the same PR
  (repo rule: update `ERD.md`, BLOCKING in techlead review).
- **Derive validators from the schema** to avoid drift — nirnejak's move:

```ts
import { createInsertSchema } from 'drizzle-zod'
import { z } from 'zod'
import { waitlist } from '@/db/schema'

export const insertWaitlistSchema = createInsertSchema(waitlist, {
  email: z.email(),
}).omit({ id: true })   // client must not send id
```

### Prisma (alternative) — generated client, singleton

- Schema at repo root: `prisma/schema.prisma`, `DATABASE_URL` from `env`.
- `postinstall: "prisma generate"` so the client exists after `bun install`.
- **One `PrismaClient` per process**; in dev, cache on `globalThis` to survive
  `--hot` reloads without leaking connections (same pattern as the Express doc).
- Heavier than Drizzle and historically slower to support Bun — prefer Drizzle
  for new Hono+Bun SQL services unless the team already knows Prisma.

### Mongoose (Mongo) — ProMehedi's pattern

- `connectDB()` at boot with retry + backoff; `mongoose.connect(uri, {
  maxPoolSize: 10, minPoolSize: 2 })`. Set `autoIndex: NODE_ENV !== 'production'`.
- One schema/model per file under `models/` (`user.model.ts`), interface
  (`IUser`) co-located, instance methods (`matchPassword`) on the schema.
- No migration system — schemaless. Write a `scripts/migrate.ts` for renames /
  field adds when needed.

**Rule of thumb (all ORMs)**: migrations are version-controlled, forward-only,
run at deploy time — never auto-sync entities to the DB in prod.

## Key libraries

| Library | Purpose |
|---|---|
| `hono` | HTTP framework — router, `Context`, middleware pipeline, `export default app` server. |
| `@hono/zod-validator` | Bind a Zod schema to a request part (`json`/`query`/`param`/`header`); makes `c.req.valid(...)` typed. |
| `zod` | Schema-first validation; `z.infer` feeds TS types; also drives env validation. |
| `drizzle-orm` + `drizzle-kit` | Type-safe SQL ORM; `drizzle-kit` generates/migrates from `schema.ts`. (Or `mongoose` for Mongo, `@prisma/client`+`prisma` for Prisma.) |
| `drizzle-zod` | Derive Zod insert/select schemas from Drizzle tables — single source of truth. |
| `@neondatabase/serverless` / `postgres` / `pg` | Drizzle DB driver — Neon for edge, `postgres-js`/`pg` for pooled TCP on a VM. |
| `hono/jwt`, `hono/bearer-auth`, `hono/basic-auth` | Built-in token auth for middleware (verify/sign JWTs). |
| `better-auth` | Full auth framework (sessions, OAuth, email) with a Drizzle adapter — when JWT isn't enough. |
| `pino` (+ `pino-pretty` dev) | Structured JSON logging; redact paths for secrets. |
| `@asteasolutions/zod-to-openapi` + `@hono/zod-openapi` | Generate OpenAPI from your Zod schemas; serve Scalar/Swagger UI. |
| `hono/http-exception` | The native `HTTPException` for raising typed HTTP errors in handlers. |
| `hono/factory` | `createFactory<Env>()` / `createMiddleware<Env>()` — share `Env` across app, handlers, middleware. |
| `hono/client` | `hc()` RPC client; `export type AppType = typeof route` gives end-to-end request/response types. |
| `hono/streaming` | `stream`/`streamText`/`streamSSE` for streaming responses and SSE. |

Dev-only: `@types/bun`, `typescript`, `biome` (or `oxlint`+`oxfmt`, or
`eslint`+`prettier`), `drizzle-kit`, `husky` + `lint-staged`. `vitest` only if
you outgrow `bun test`.

## Dev commands

A Bun + Drizzle + Biome + `bun test` setup (the modern default):

```jsonc
// package.json "scripts"
{
  "dev": "bun --hot src/index.ts",
  "start": "bun run src/index.ts",                 // prod from source (Bun runs TS directly)
  "build": "bun build src/index.ts --outdir dist --target bun",
  "start:dist": "bun run dist/index.js",
  "typecheck": "tsc --noEmit",
  "lint": "biome check src",                       // or oxlint / eslint .
  "format": "biome format --write src",
  "test": "bun test",
  "test:watch": "bun test --watch",
  "test:coverage": "bun test --coverage",
  "db:generate": "drizzle-kit generate",
  "db:migrate": "drizzle-kit migrate",
  "db:push": "drizzle-kit push",                  // dev/prototyping only
  "db:studio": "drizzle-kit studio"
}
```

- **Local dev loop:** `bun install` → copy `.env.example` → `.env` →
  `bun run db:migrate` → `bun dev`. Bun reads `.env` automatically (no
  `dotenv` import needed), but the `env.ts` Zod parse still runs at boot.
- **Build = `bun build`** (Bun's bundler). It resolves tsconfig `paths`
  natively, so no `tsc-alias` step (unlike Express + `tsc`). `--target bun`
  keeps the Bun runtime assumptions; use `--target node` if you ship to Node.
- **Test with `app.request()`** — no server start, no port:

```ts
// tests/user.routes.test.ts
import { describe, it, expect } from 'bun:test'
import app from '@/index'   // or from a dedicated app.ts

describe('POST /api/v1/users', () => {
  it('creates a user', async () => {
    const res = await app.request('/api/v1/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Ada', email: 'ada@x.io', password: 'secret123' }),
    })
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.user.email).toBe('ada@x.io')
  })
})
```

## Deployment notes

Hono's `export default app` runs on multiple runtimes unchanged — **the
deploy target is a config choice, not a code rewrite**. Three production paths:

**1. Bun (VM / bare metal).** Run the TS directly (`bun src/index.ts`) or the
bundled output (`bun dist/index.js`). Bun is the process — no PM2, no
`nodemon` in prod. For graceful shutdown, hook `process.on('SIGTERM')` to
drain in-flight requests and close the DB pool. `Bun.serve` (which Hono's
default export drives) handles keep-alive and HTTP/1.1 pipelining natively.

**2. Docker.** Single-stage is often enough for Bun (the runtime is tiny):
nirnejak's `Dockerfile` is the minimal reference —

```dockerfile
FROM oven/bun:alpine
WORKDIR /usr/src/app
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile
COPY . .
RUN bun run build
ENV PORT=9000
EXPOSE 9000
CMD ["bun", "run", "dist/index.js"]
```

For prod hardening add: multi-stage (build → `oven/bun:alpine` runtime with
only `dist/` + prod deps), run as non-root (`USER bun`), bind secrets via the
orchestrator (never bake `.env`), healthcheck on a `/health` route. Run
migrations **once per deploy** (release job or `web`+`migrate` compose
services), not on every container start in a scaled fleet.

**3. Cloudflare Workers / Pages.** `export default app` *is* the Worker entry;
deploy with `wrangler deploy --minify src/index.ts` (kbkn3). Caveats:
- **No `process.env`, no Node APIs** — secrets live in `wrangler.toml`
  `[vars]`/secrets and bindings (`D1Database`, `KVNamespace`, `R2Bucket`) come
  through `c.env`. Type them in `Env['Bindings']`.
- **Edge DB driver required** — Neon serverless, Turso (`@libsql/client`),
  PlanetScale, or D1. A pooled `pg`/`postgres-js` connection does **not** work
  on Workers.
- **CPU/wall-clock limits** per request; size budget after `--minify`. Heavy
  long-running work belongs on a VM, not Workers.

**Production hygiene** (carries over from the Express doc):
- Catch `process.on('uncaughtException')` / `'unhandledRejection'` (nirnejak
  does) — log, then exit and let the supervisor restart.
- `secureHeaders` + CORS allowlist + rate limiting + `bodyLimit` always on
  (ProMehedi's full chain).
- Run behind a reverse proxy / CDN; when trusting `X-Forwarded-For` for rate
  limiting or `req.ip`, ensure the proxy overwrites client-supplied values
  (ProMehedi's rate-limit IP resolver flags exactly this).
- Ship logs as JSON to stdout/stderr only — the platform aggregates. No file
  transports in a container. Mask secrets at the log boundary (`pino` redact).
- **Zero-downtime deploy:** rolling update (K8s) or Bun's built-in hot reload
  in dev only; in prod use the orchestrator's rolling/replace strategy +
  readiness gate that waits for DB + migrations before accepting traffic.
- **Graceful shutdown:** on `SIGTERM`, stop accepting connections, drain
  in-flight requests, close the DB pool, exit. Wrap with a hard timeout.
