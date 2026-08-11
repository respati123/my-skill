# Express + Node.js + TypeScript (Backend)

Reference for the `coder` role on any `backend`-labelled TypeScript sub-issue
using Express. Distilled from the highest-signal production boilerplates and
the Node.js best-practices list, then mapped to this repo's
`backend-rules-typescript.md` conventions (which win on any conflict):

- [hagopj13/node-express-boilerplate](https://github.com/hagopj13/node-express-boilerplate) — ~7.6k★. JS, but the *canonical* production Express
  layout: `config/ controllers/ services/ routes/v1/ middlewares/ models/
  validations/ utils/`. Its `catchAsync` + `ApiError` + centralized
  `errorConverter`/`errorHandler` pair is the pattern most TS codebases copy.
- [w3tecch/express-typescript-boilerplate](https://github.com/w3tecch/express-typescript-boilerplate) — ~3.4k★. TS, but stale (TypeORM 0.2,
  `tslint`, TS 3.0). Useful only for its `env.ts` typed-config and its
  `controllers/ services/ repositories/` split; do not copy its toolchain.
- [goldbergyoni/nodebestpractices](https://github.com/goldbergyoni/nodebestpractices) — ~105k★. The consensus backstop for error handling,
  security headers, logging, testing, and production deployment. Cite this
  when a reviewer asks "why".

> Where this doc says "recommended", it means *the modern TS default for new
> code*. Where it flags a library as "legacy/declining", existing code may
> still use it — don't rewrite without reason, but don't pick it for a new
> service.

## Recommended stack components

| Layer | Recommended (new TS code) | Also common | Notes |
|---|---|---|---|
| Runtime | **Node.js** (LTS, ≥ 20) | — | Pin the major in `engines`. |
| Framework | **Express 4** | Express 5 (stable Oct 2024, ecosystem still catching up), Fastify, Hono | Express 5 is safe to start new; many middleware still target 4. |
| Language | **TypeScript, `"strict": true`** | — | No `any` — see `backend-rules-typescript.md`. |
| ORM (SQL) | **Prisma** (dominates new TS) | Drizzle (rising, SQL-first), Kysely (query-builder) | TypeORM / Sequelize = legacy; keep if present, don't pick new. |
| ORM (Mongo) | **Mongoose** (de facto) | Prisma (Mongo connector) | Mongoose is the only mature choice for Mongo on Node. |
| Validation | **Zod** (TS-native, infers types) | Joi, `class-validator`/`class-transformer` | Zod's `z.infer<typeof schema>` removes the dual-type maintenance tax. Joi is the hagopj13 default; Zod is the modern default. |
| Linter | **Biome** (this repo's default per `backend-rules-typescript.md`) | ESLint (`@typescript-eslint`) | If a project is already on ESLint, stay on it; Biome is the new-project default here. |
| Formatter | **Biome** / Prettier | — | Biome does lint+format in one. |
| Test | **Vitest** (Vite-native, TS out of the box) | Jest (+ `ts-jest` or `swc`), node:test | Jest still dominates by volume; Vitest is the TS-era default. hagopj13 uses Jest. |
| Package manager | **pnpm** (new projects) | npm, yarn | pnpm = disk-efficient, strict; npm = universal default. |
| Dev runner | **tsx** (esbuild-based, fast) | `ts-node`, `nodemon` + `tsc --watch` | tsx supersedes ts-node for dev. |
| Process manager (prod, non-container) | **PM2** | systemd, Docker restart policy | PM2 = zero-downtime reload, clustering. In Docker/K8s, the orchestrator does this — don't run PM2 inside the container. |
| Dev watcher | **nodemon** / `tsx watch` | — | Restarts on file change. |
| HTTP logging | **morgan** (dev) → structured (Pino) prod | Pino-http | morgan for `dev` format in local; structured JSON in prod. |
| App logging | **Pino** (fastest, JSON-first) / Winston | — | Winston = hagopj13 default; Pino = perf default. |
| API docs | OpenAPI via Swagger annotations (`swagger-jsdoc` + `swagger-ui-express`) or **Zod → OpenAPI** (`@asteasolutions/zod-to-openapi`) | — | Prefer generating the spec from the same Zod schemas that validate input — single source of truth. |

## Folder structure

Adapted from hagopj13's production layout, ported to TS and aligned with this
repo's rules (one router per domain, types in `types/`, validators in
`validators/`):

```
src/
  app.ts                  # express app: middleware chain, route mounting, error handler (last)
  index.ts                # entry: connect DB, start server, handle uncaughtException/rejection
  config/
    config.ts             # typed + validated config (envvars) — exported singleton
    logger.ts             # pino/winston instance
    prisma.ts             # PrismaClient singleton (or mongoose.ts, typeorm.ts)
  routes/
    v1/                    # versioned routers
      index.ts            # mounts each domain router under /v1
      user.route.ts
      auth.route.ts
  controllers/
    user.controller.ts    # HTTP only: validate → call service → shape response. No business logic.
    auth.controller.ts
  services/
    user.service.ts       # business logic, DB access via the ORM. Throws ApiError, knows nothing about Express.
    auth.service.ts
  middlewares/
    error.ts              # errorConverter + errorHandler (registered LAST in app.ts)
    auth.ts               # JWT verify + role/permission check
    validate.ts           # runs a Zod/Joi schema against req.params|query|body
    rateLimiter.ts        # express-rate-limit presets
    request-id.ts         # assigns req.id, binds logger child (REPO-REQUIRED)
  validators/             # (a.k.a. validations/) Zod schemas, one per domain
    user.schema.ts
    auth.schema.ts
  models/                 # raw ORM models/schema files (Prisma: schema.prisma lives at repo root)
  types/
    express.d.ts          # ambient: augment Request with req.user, req.id
    user.ts               # domain DTOs (Request/Response interfaces)
    common.ts             # shared: PaginationQuery, Envelope<T>, etc.
  utils/
    ApiError.ts           # custom Error subclass
    asyncHandler.ts       # catchAsync wrapper
    pick.ts               # subset of an object by keys (pagination/filter helpers)
tests/
  user.controller.test.ts
  user.service.test.ts
  setup.ts
```

Notes:
- **`types/` not inline** — this repo mandates one domain per file
  (`types/user.ts`), per `backend-rules-typescript.md`. Prisma generates its
  own types under `node_modules/.prisma/client`; don't hand-write those.
- **`routes/v1/`** — API versioning by URL prefix. hagopj13 does exactly this;
  it's the lowest-effort, most-predictable scheme.
- **`validators/` vs `models/`** — validators = *input* shape (request DTOs);
  models = *persistence* shape (ORM). They diverge on purpose (e.g. a
  `CreateUser` request has `password` but no `_id`).

## Conventions

### Import style — absolute via `@/*`

This repo mandates absolute imports via the `@/*` alias; no `../../../`
chains (`backend-rules-typescript.md`). Two ways to make it work at runtime:

1. **`tsconfig.json` `paths` + a runtime resolver** — the standard TS way:
   ```jsonc
   // tsconfig.json
   { "compilerOptions": {
       "baseUrl": ".",
       "paths": { "@/*": ["src/*"] }
   }}
   ```
   Then at runtime either:
   - **tsx / ts-node**: register `tsconfig-paths` (`tsx --tsconfig tsconfig.json` resolves paths natively in recent tsx; for ts-node use `-r tsconfig-paths/register`).
   - **compiled (tsc + node)**: use [`tsc-alias`](https://github.com/justkey007/tsc-alias) in the build step, or `module-alias` with a `package.json` `"_moduleAliases"` block. `tsc` alone does **not** rewrite paths.
2. **`module-alias`** alone (no tsconfig `paths`) — simpler, one source of truth in `package.json`, but untyped; less common in TS code.

Recommended: `tsconfig` `paths` + `tsx` in dev + `tsc-alias` in the build.

### Controller pattern — thin, `asyncHandler`-wrapped, no try/catch

Controllers do **only** HTTP work: read validated `req.body`/`req.params`,
call a service, send a response. No business logic, no DB calls. Every
async controller is wrapped so a rejected promise routes to the centralized
error handler — **no per-route try/catch** (repo rule).

```ts
// utils/asyncHandler.ts — the catchAsync pattern from hagopj13
import type { Request, Response, NextFunction, RequestHandler } from 'express';

export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler =>
  (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
```

```ts
// controllers/user.controller.ts
import httpStatus from 'http-status';
import { asyncHandler } from '@/utils/asyncHandler';
import { userService } from '@/services/user.service';
import type { UserResponse } from '@/types/user';

export const createUser = asyncHandler(async (req, res) => {
  const user = await userService.createUser(req.body);          // validated already by middleware
  const body: { status: 'success'; data: UserResponse } = { status: 'success', data: user };
  res.status(httpStatus.CREATED).json(body);
});
```

- A controller function stays ≤ **15 lines** (repo cap). Call → shape → respond.
- The repo's response **envelope** is `{ status: 'success', data: T }` /
  `{ status: 'error', error: { code, message } }` — match it; the central
  error handler emits the error half.

### Service pattern — business logic, no Express types

Services own the rules and the DB. They take plain values (validated DTOs,
not `req`), return plain values, and throw `ApiError` for expected failures.
Importing anything from `express` in a service file is a smell.

```ts
// services/user.service.ts
import httpStatus from 'http-status';
import { prisma } from '@/config/prisma';
import { ApiError } from '@/utils/ApiError';
import type { CreateUserInput } from '@/validators/user.schema';

export const userService = {
  async createUser(input: CreateUserInput) {
    const exists = await prisma.user.findUnique({ where: { email: input.email } });
    if (exists) throw new ApiError(httpStatus.CONFLICT, 'Email already taken');
    return prisma.user.create({ data: input });
  },
};
```

The `userService = { ... }` object-export form (hagopj13 style) keeps related
operations co-located and is trivially mockable. Alternatively one
`export async function createUser(...)` per file — pick one and be consistent.

### Endpoint naming — REST, one router file per resource

- Nouns, plural: `/users`, `/users/:userId`, `/users/:userId/orders`.
- HTTP verbs carry the intent: `GET` list/read, `POST` create, `PATCH`/`PUT`
  update, `DELETE` remove. Don't tunnel verbs in the path (`/getUser`).
- One router per resource, mounted under the version prefix:

```ts
// routes/v1/user.route.ts
import { Router } from 'express';
import { auth } from '@/middlewares/auth';
import { validate } from '@/middlewares/validate';
import { userSchema } from '@/validators/user.schema';
import { userController } from '@/controllers/user.controller';

export const userRouter = Router();

userRouter
  .route('/')
  .post(auth('manage_users'), validate(userSchema.create), userController.createUser)
  .get(auth('read_users'), validate(userSchema.list), userController.listUsers);

userRouter
  .route('/:userId')
  .get(validate(userSchema.byId), userController.getUser)
  .patch(auth('manage_users'), validate(userSchema.update), userController.updateUser)
  .delete(auth('manage_users'), userController.deleteUser);
```

```ts
// routes/v1/index.ts
import { Router } from 'express';
import { userRouter } from './user.route';
import { authRouter } from './auth.route';

export const v1 = Router();
v1.use('/users', userRouter);
v1.use('/auth', authRouter);

// app.ts
app.use('/v1', v1);
```

The middleware order on each route is **`auth → validate → controller`** —
authorize before doing work, validate before the controller touches input.

### Error handling — centralized, `ApiError`, `errorConverter` + `errorHandler`

The single most-cited best practice in `nodebestpractices` (§"Error Handling
Best Practices"). Three pieces:

**1. `ApiError`** — carry a status code and an *operational* flag (expected
errors the app throws on purpose vs. programmer bugs):

```ts
// utils/ApiError.ts
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational = true,
    stack = '',
  ) {
    super(message);
    if (stack) this.stack = stack;
    else Error.captureStackTrace(this, this.constructor);
  }
}
```

**2. `errorConverter`** — normalize *any* thrown thing (Mongoose, Prisma
`PrismaClientKnownRequestError`, ZodError, JWT errors) into an `ApiError`
before it reaches the final handler. One place to translate third-party
errors.

**3. `errorHandler`** — the terminal middleware. In production, mask any
non-operational error to a generic 500 (don't leak stack/internal ids — repo
security rule). In dev, attach the stack. Emit the repo error envelope.

```ts
// middlewares/error.ts
import httpStatus from 'http-status';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import type { ErrorRequestHandler } from 'express';
import { config } from '@/config/config';
import { logger } from '@/config/logger';
import { ApiError } from '@/utils/ApiError';

export const errorConverter: ErrorRequestHandler = (err, _req, _res, next) => {
  if (err instanceof ApiError) return next(err);
  if (err instanceof ZodError)
    return next(new ApiError(httpStatus.BAD_REQUEST, err.issues.map((i) => i.message).join(', ')));
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025')
    return next(new ApiError(httpStatus.NOT_FOUND, 'Resource not found'));
  return next(new ApiError(httpStatus.INTERNAL_SERVER_ERROR, err.message, false, err.stack));
};

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  let { statusCode, message } = err;
  if (config.env === 'production' && !err.isOperational) {
    statusCode = httpStatus.INTERNAL_SERVER_ERROR;
    message = httpStatus[httpStatus.INTERNAL_SERVER_ERROR];
  }
  logger.error({ reqId: req.id, statusCode, message, stack: err.stack });
  res.status(statusCode).json({ status: 'error', error: { code: String(statusCode), message } });
};
```

Register **`errorConverter` then `errorHandler`, after all routes** in `app.ts`:
```ts
app.use('/v1', v1);
app.use(errorConverter);
app.use(errorHandler);   // must be last — anything after it never runs
```

### Middleware

| Middleware | Library / file | Purpose |
|---|---|---|
| Helmet | `helmet` | Secure headers (CSP, HSTS, no-sniff, frameguard). Always on, near the top. |
| CORS | `cors` | Allowlist origins per env. Never `cors()` with no args in prod. |
| Compression | `compression` | gzip/brotli responses. |
| Body parse | `express.json()`, `express.urlencoded({ extended: true })` | Set a `limit` to block oversized payloads. |
| HTTP log | `morgan` (dev) / `pino-http` (prod) | Request logging. |
| **Request ID** | `src/middlewares/request-id.ts` (+ `crypto.randomUUID()` or `nanoid`) | **Repo-required.** Assigns `req.id`, creates a logger child, threads the ID into every log line for that request. |
| Auth | `src/middlewares/auth.ts` | Verifies JWT (`jsonwebtoken`), loads `req.user`, checks fine-grained rights (hagopj13's `roleRights` map). |
| Validate | `src/middlewares/validate.ts` | Runs a Zod/Joi schema against `req.params|query|body`; on failure → `next(ApiError(400))`. |
| Rate limit | `express-rate-limit` | Per-route presets (hagopj13's `authLimiter`: 20 / 15 min, `skipSuccessfulRequests`). Pair with `express-rate-limit`'s Redis store in multi-instance deploys. |
| Sanitize | `express-mongo-sanitize` (Mongo) + `xss`/`dompurify` for stored HTML | Strip `$`/`.` operators from user input (NoSQL injection), sanitize stored HTML. |
| Error | `src/middlewares/error.ts` | See above. Registered last. |

**Auth is per-resource, not per-app.** hagopj13's `auth(...requiredRights)`
returns middleware that runs *before* the controller, and rights are checked
against a role→rights map — fine-grained, not just "logged in".

### Environment — dotenv + validation at boot

Load `.env` once, **validate it with a schema, fail fast if invalid**. hagopj13
uses a Joi schema; the TS-modern equivalent is Zod (reuses the same lib as
request validation):

```ts
// config/config.ts
import dotenv from 'dotenv';
import path from 'node:path';
import { z } from 'zod';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const schema = z.object({
  NODE_ENV: z.enum(['production', 'development', 'test']),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRATION_MINUTES: z.coerce.number().default(30),
});
const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error('❌ Invalid env vars:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}
export const config = parsed.data;
export const env = config.NODE_ENV;
```

- Never `process.env.X` directly elsewhere — import `config`. One source of truth.
- **`.env` never committed**; ship a `.env.example` with the keys and no values.
- Different files per env: `.env`, `.env.test` (hagopj13 pattern).

### Logging — structured JSON, level by env, request-ID in every line

Repo rule: structured logs (JSON fields, not string concat), level by env
(`debug` local, `info`+prod), and **every line carries the request ID**. Two
solid choices:

- **Pino** — fastest, JSON by default, child loggers bind fields:
  ```ts
  // config/logger.ts
  import pino from 'pino';
  export const logger = pino({ level: config.NODE_ENV === 'development' ? 'debug' : 'info' });
  // in request-id middleware: req.log = logger.child({ reqId: req.id }); use req.log everywhere.
  ```
- **Winston** — hagopj13's choice. Console transport, `stderrLevels:
  ['error']`, dev gets `colorize`, prod gets plain JSON.

Mask secrets at the log boundary (passwords, tokens, PII) — repo security
rule. Pino has `pino.noConflict` / redact paths (`redact: ['req.headers.authorization']`).

## Database setup

### Prisma (recommended for SQL) — generated client, singleton

- Schema at repo root: `prisma/schema.prisma`. `DATABASE_URL` from `config`.
- Generate the client in `postinstall`: `"postinstall": "prisma generate"`.
- **One `PrismaClient` instance per process** — don't `new` it in hot paths.
  In dev, disconnect the global on HMR to avoid exhausting connections:

```ts
// config/prisma.ts
import { PrismaClient } from '@prisma/client';
import { config } from './config';

export const prisma =
  globalThis.__prisma ??
  new PrismaClient({ log: config.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'] });
if (config.NODE_ENV !== 'production') globalThis.__prisma = prisma;
```

```ts
// types/global.d.ts
declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}
```

### Migrations

- **Prisma**: `prisma migrate dev --name <slug>` (dev), `prisma migrate deploy`
  (prod — applies pending migrations, never creates new ones). Generated SQL
  lives in `prisma/migrations/`. A schema change → a migration in the same
  PR (repo rule: update `ERD.md` too, BLOCKING in techlead review).
- **Mongoose** (Mongo): schemaless; migrations are usually data scripts.
  Many shops still write a tiny `scripts/migrate.ts` for renames/field adds.
- **TypeORM** (legacy if present): `typeorm migration:generate`, files under
  `src/database/migrations/` (w3tecch layout), run via CLI at deploy.

**Rule of thumb:** migrations are version-controlled, forward-only, and run
at deploy time — never `synchronize: true` (auto-DDL from entities) in prod.

## Key libraries

| Library | Purpose |
|---|---|
| `express` | HTTP framework / router / middleware pipeline. |
| `@prisma/client` (+ `prisma` CLI) | Type-safe SQL ORM; generated client from `schema.prisma`. (Or `mongoose` for Mongo.) |
| `zod` | Schema-first validation; `z.infer` feeds TS types. Also drives env validation. |
| `helmet` | Secure HTTP response headers. |
| `cors` | Cross-origin allowlist. |
| `compression` | gzip/brotli response compression. |
| `express-rate-limit` (+ `rate-limit-redis` for multi-instance) | Brute-force / abuse throttling, per-route. |
| `jsonwebtoken` (+ `passport-jwt` if using Passport) | Issue/verify JWTs for `auth` middleware. |
| `bcryptjs` | Password hashing (Node-friendly, no native build). (`argon2` is stronger if you can add a native dep.) |
| `http-status` | Named status constants (`httpStatus.CREATED`) instead of magic numbers — hagopj13 standard. |
| `pino` (or `winston`) | Structured logging; `pino-http` for per-request logs. |
| `morgan` | HTTP access log (dev format). |
| `dotenv` | Load `.env` into `process.env` at boot. |
| `swagger-jsdoc` + `swagger-ui-express`, **or** `@asteasolutions/zod-to-openapi` | Serve OpenAPI docs; prefer generating from your Zod schemas. |
| `express-mongo-sanitize` (+ `xss`/`dompurify`) | NoSQL-injection / stored-HTML sanitization (Mongo projects). |
| `nodemailer` | Transactional email (verify, reset password) — hagopj13 ships this. |

Dev-only: `tsx`, `vitest` (or `jest`+`ts-jest`), `supertest`, `@types/*`,
`tsc-alias`, `husky` + `lint-staged`.

## Dev commands

A modern pnpm + tsx + vitest + prisma setup:

```jsonc
// package.json "scripts"
{
  "dev": "tsx watch src/index.ts",
  "build": "tsc -p tsconfig.json && tsc-alias -p tsconfig.json",
  "start": "node dist/index.js",
  "lint": "biome check src",                    // or eslint . ; repo default is Biome
  "format": "biome format --write src",
  "typecheck": "tsc --noEmit",
  "test": "vitest run",
  "test:watch": "vitest",
  "prisma:generate": "prisma generate",
  "prisma:migrate": "prisma migrate dev",
  "prisma:deploy": "prisma migrate deploy",
  "db:studio": "prisma studio"
}
```

- **Local dev loop:** `pnpm install` → copy `.env.example` → `.env` → `pnpm prisma migrate dev` → `pnpm dev`.
- **Build = `tsc` emit + path-alias rewrite** (tsx resolves `@/*` at runtime for free in dev; `tsc` does **not** rewrite paths, hence `tsc-alias`).

## Deployment notes

**Docker (primary).** Multi-stage `Dockerfile`: `deps` (install, cache
`node_modules` / `.pnpm-store`) → `build` (`tsc` + `tsc-alias`) → `runner`
(copy `dist/` + prod `node_modules`, no dev deps, run as non-root, set
`NODE_ENV=production`). Bind `.env` via the orchestrator (secret), not baked
into the image. Run migrations **once per deploy** (`prisma migrate deploy`
in a release job / `web`+`migrate` compose services), not on every container
start in a scaled-out fleet — or guard it with a leader-election/lock.

**PM2 (non-container).** `pm2 start ecosystem.config.json` with `instances:
'max'` (cluster mode), `exec_mode: 'cluster'`, `max_memory_restart`. PM2 gives
zero-downtime reload (`pm2 reload`) and log rotation. **Do not use PM2 inside
Docker/K8s** — the orchestrator owns restarts, scaling, and logs there; PM2
in a container just hides signals from the runtime and breaks graceful
shutdown.

**Production hygiene** (from `nodebestpractices`):
- Catch `process.on('uncaughtException')` and `process.on('unhandledRejection')`
  — log, then **exit and let the supervisor restart** the process. Don't try
  to continue; the state is unknown.
- Enable `helmet`, CORS allowlist, rate limiting, and body-size limits.
- Run behind a reverse proxy (nginx / a load balancer); trust it with
  `app.set('trust proxy', 1)` so `req.ip` and rate-limit keys are correct.
- **Zero-downtime deploy:** cluster mode reload (PM2) or rolling update (K8s)
  + a readiness check that waits for the DB + migrations before accepting traffic.
- **Graceful shutdown:** on `SIGTERM`, stop accepting new connections, drain
  in-flight requests, close the DB pool, then exit. Express 5 / Node `http.Server`
  `.close(cb)` does the draining; pair it with a timeout.
- Ship logs as JSON to stdout/stderr only — the platform aggregates them. No
  file transports in a container.
