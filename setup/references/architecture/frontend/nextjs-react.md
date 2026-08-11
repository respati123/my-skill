# Next.js + React (Frontend / Full-stack)

Reference for the `coder` role on any `frontend`-labelled TypeScript sub-issue
using Next.js. Distilled from the highest-signal production boilerplates and
the App Router docs, then mapped to this repo's `frontend-rules-typescript.md`
conventions (which win on any conflict):

- [t3-oss/create-t3-app](https://github.com/t3-oss/create-t3-app) — ~28k★. The canonical *type-safe* TS full-stack starter:
  Next.js App Router + tRPC + Prisma/Drizzle + NextAuth + Tailwind + Zod. Its
  `@t3-oss/env-nextjs` typed-env pattern and `src/` layout are the modern default.
- [ixartz/SaaS-Boilerplate](https://github.com/ixartz/SaaS-Boilerplate) — ~4k★.
  The most complete *shipped* SaaS on App Router: Clerk auth, Drizzle, Tailwind
  v4, next-intl i18n, React Compiler, Vitest + Playwright, Storybook, Sentry.
  Use it as the reference for anything a real product needs (i18n, webhooks,
  observability, CI).
- [shadcn/ui](https://ui.shadcn.com/) + [vercel/next.js `examples/`](https://github.com/vercel/next.js/tree/canary/examples) — shadcn is not a
  package but a CLI that copies Radix-styled components into `components/ui/`;
  the Vercel examples cover every edge case (auth, with-supabase,
  with-prisma-starter, cms-*).

> Where this doc says "recommended", it means *the modern default for new
> Next.js code*. Where it flags a library as "legacy/declining", existing code
> may still use it — don't rewrite without reason, but don't pick it for a new
> app.

## Recommended stack components

| Layer | Recommended (new TS code) | Also common | Notes |
|---|---|---|---|
| Framework | **Next.js 15** (App Router) | Next.js 16 (out, bleeding edge), Remix/React Router | App Router has been the default since 13.4 / stable since 14. Don't start new work on the Pages Router. |
| React | **React 19** (ships with Next 15) | — | Server Components, `use()` hook, Actions, React Compiler (opt-in in 15). |
| Language | **TypeScript, `"strict": true`** | — | No `any` — see `frontend-rules-typescript.md`. |
| Styling | **Tailwind CSS v4** (CSS-first config) | Tailwind v3 (legacy), CSS Modules | v4 = `@import "tailwindcss"` in `globals.css`, no `tailwind.config.js` needed (config in CSS via `@theme`). |
| UI components | **shadcn/ui** (Radix + cva + Tailwind) | Mantine, Chakra, MUI | shadcn is the default here; copy-in components you fully own, not a black-box dep. |
| Icons | **lucide-react** | `@radix-ui/react-icons` | lucide is shadcn's default. |
| State (client) | **Zustand** (simple) / **Jotai** (atomic) | Redux Toolkit | RSC + server actions cut how much client state you need — reach for a store only for genuinely client-only UI state. |
| State (server) | **React Server Components** | — | Default: data lives on the server, streamed to the client. No store. |
| Data fetching (server) | **RSC `fetch()` + `revalidate`** | — | The App Router primitive; caches per-request, revalidates by tag/time. |
| Data fetching (client) | **TanStack Query v5** | SWR | Only for client-driven mutation/polling the server can't stream. T3 uses tRPC for end-to-end typesafe RPC instead. |
| RPC (optional, full-stack) | **tRPC v11** | — | T3 stack's pick: no schema gen, types flow from the router. Use if you don't want server actions. |
| Forms | **React Hook Form** + **Zod** (`@hookform/resolvers`) | TanStack Form, `react-aria` | RHF renders less, Zod schemas double as server-action input validators. |
| Validation | **Zod** | Valibot (smaller bundle), `yup` | Zod v3 is the safe default; v4 is out but ecosystem is catching up. |
| Auth | **Auth.js (NextAuth v5)** | **Clerk** (managed), Supabase Auth | Auth.js for self-hosted/email+OAuth; Clerk if you want hosted UI + orgs out of the box (ixartz's choice). |
| ORM (SQL, full-stack) | **Drizzle** (rising, SQL-first) | **Prisma** (dominant, generates client) | T3 offers both. Drizzle = no codegen step, lighter; Prisma = best DX/ergonomics, `.prisma` schema. Kysely for raw query-builder. |
| Env validation | **`@t3-oss/env-nextjs`** | hand-rolled Zod | Typed `env` object, fails fast, knows `NEXT_PUBLIC_` rules. |
| Linter | **ESLint 9 flat config** (`next/core-web-vitals` + `eslint-plugin-react-hooks` + `@typescript-eslint`) | Biome | Next.js needs its own ESLint plugin (no-image-element, etc.); Biome can't run those rules, so ESLint is the default for Next. |
| Formatter | **Prettier** (`prettier-plugin-tailwindcss`) | Biome | Tailwind class sorting is the killer plugin; Biome has no Tailwind sort yet. |
| Test (unit/component) | **Vitest** + **React Testing Library** | Jest | Vitest is Vite-native and TS-first; Jest works but is slower in Next. |
| Test (E2E) | **Playwright** | Cypress | Playwright is the ixartz/T3 default; cross-browser, fast. |
| API mock | **MSW** (Mock Service Worker) | — | Repo rule: mock at the network boundary, not the hook. |
| Package manager | **pnpm** | npm, yarn, bun | pnpm is disk-efficient and the T3 default. |
| Observability | **Sentry** (`@sentry/nextjs`) | — | ixartz's pick; Sentry's Next SDK auto-instruments RSC, route handlers, server actions. |
| Git hooks | **lefthook** / **husky** + lint-staged | — | lefthook is parallel + Go-fast (ixartz); husky is ubiquitous. |

## Folder structure

App Router layout, aligned with T3's `src/` convention and this repo's rules
(`@/*` imports, `types/` per domain, MVVM View/ViewModel split):

```
src/
  app/                       # routes only — file-system routing
    (marketing)/             # route group (parens) — URL not affected
      page.tsx               # landing
      layout.tsx
    (auth)/
      login/page.tsx
      register/page.tsx
    (dashboard)/
      layout.tsx             # auth guard + shell (sidebar/topbar)
      dashboard/page.tsx
      settings/
        page.tsx
        loading.tsx          # streaming Suspense fallback for this route
        error.tsx            # ERROR BOUNDARY (must be a Client Component)
      users/[userId]/        # dynamic segment → params is a Promise
        page.tsx
    api/                     # Route Handlers — only when it isn't a server action
      auth/[...nextauth]/route.ts
      webhooks/stripe/route.ts
    layout.tsx               # root <html><body>, mounts <Providers>
    page.tsx                 # redirect to (marketing) or (dashboard)
    loading.tsx              # root fallback
    error.tsx                # root error boundary
    global-error.tsx         # catches root-layout errors too
    not-found.tsx            # 404
    globals.css              # Tailwind v4: @import "tailwindcss"; @theme { ... }
  components/
    ui/                      # shadcn/ui primitives — generated, don't hand-edit
    features/                # feature-scoped composites: features/user/user-table.tsx
    providers.tsx            # client providers: ThemeProvider, QueryClientProvider
  lib/
    utils.ts                 # cn() + shared pure utils
    auth.ts                  # Auth.js config + server helpers (getSession, requireUser)
    db/                      # drizzle schema + client singleton
    validations/             # zod schemas per domain — shared by client + server actions
      user.ts
  server/                    # 'use server' territory — never imported by client code
    queries/                 # server-only data fetchers (called from RSC)
    actions/                 # server actions (mutations)
    services/                # business logic, no React/Next imports
  hooks/                     # client hooks; ViewModels live here (useXViewModel)
  stores/                    # zustand/jotai stores — client-only
  types/                     # shared types, one domain per file: types/user.ts
  env.js                     # @t3-oss/env-nextjs validated, typed env
public/                      # static assets, served at root
middleware.ts                # runs before every matched route — auth + i18n routing
drizzle/                     # or prisma/ — migrations live here
next.config.ts
components.json              # shadcn CLI config (aliases, style)
tsconfig.json
package.json
```

Notes:
- **`src/` is the T3 default.** It's optional (`app/` can live at repo root), but
  `src/` keeps the Next router root clean from config files. Pick one and set
  `@/*` to `./src/*` accordingly.
- **`app/` holds routes only** — no business logic. Each route file is thin:
  fetch on the server, render a View. Move logic into `server/` or a hook.
- **`server/` must never reach the client.** Any file importing `next/server`,
  `drizzle`, `@clerk/nextjs/server`, or your DB is server-only; the App Router
  tree-shakes it out of the client bundle only if no client component imports
  it. Add `import "server-only"` as a tripwire.
- **`components/ui/` is generated** by `npx shadcn@latest add <component>`.
  Customize the *variant* (`components.json` → `cssVariables`), not the file —
  re-running `add` overwrites it.

## Conventions

### Server vs Client components — default to Server, opt up to Client

**Server Components (the default).** Anything that fetches data, reads
secrets, or talks to the DB/ORM is a Server Component. No `'use client'`
directive = Server. They run once per request on the server and ship **zero**
JS to the client.

**Client Components.** Add `'use client'` **at the very top of the file**
(above imports) only when you need: `useState`/`useEffect`/`useReducer`,
event handlers (`onClick`), refs, browser APIs, or a client-only library
(`framer-motion`, `zustand`). Client components *can* still be rendered inside
a Server Component — the boundary is per-file, not per-app.

```tsx
// app/(dashboard)/settings/page.tsx — Server Component (no directive)
import { requireUser } from '@/lib/auth';
import { getUserSettings } from '@/server/queries/settings';
import { SettingsForm } from '@/components/features/settings/settings-form';

export default async function Page() {
  const user = await requireUser();                       // throws → not-found/error
  const settings = await getUserSettings(user.id);        // DB on the server
  return <SettingsForm initial={settings} />;             // hands off to a Client Component
}
```

```tsx
// components/features/settings/settings-form.tsx — Client Component
'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { settingsSchema, type SettingsInput } from '@/lib/validations/settings';
import { updateSettings } from '@/server/actions/settings';

export function SettingsForm({ initial }: { initial: Settings }) {
  const form = useForm<SettingsInput>({ resolver: zodResolver(settingsSchema), defaultValues: initial });
  return <form onSubmit={form.handleSubmit(updateSettings)}>{/* ... */}</form>;
}
```

Rule of thumb (this repo's MVVM rule): **the Client Component is the *View***
— it renders and delegates; all logic lives in a `useXViewModel()` hook that
returns `{ states, handlers }`, state driven by `useReducer`, not scattered
`useState`. Server Components don't get a ViewModel — they fetch and render.

### Route organization

- **File-system routing** — `app/users/page.tsx` → `/users`. `layout.tsx`
  wraps every route in its subtree; `page.tsx` is the leaf.
- **Route groups `(name)`** — organize without affecting the URL. The standard
  split is `(marketing)` / `(auth)` / `(app)` or `(dashboard)`, each with its
  own `layout.tsx` (different chrome, different auth).
- **Dynamic segments `[param]`** — `users/[userId]/page.tsx`. In Next 15
  `params` and `searchParams` are **Promises** (await them); catch-alls with
  `[...slug]`.
- **Server Actions vs Route Handlers** — the decision tree:
  - **Server Action** (`'use server'`): mutations from a form/onClick. The
    default for writes. Typesafe, no manual JSON, progressive-enhancement
    friendly (`action={fn}` works without JS).
  - **Route Handler** (`app/api/.../route.ts`): third-party webhooks
    (Stripe, Clerk), OAuth callbacks, file uploads, or a public JSON API.
    Anything that isn't your own UI calling your own server.
  - Don't build an `app/api/users/route.ts` CRUD alongside server actions —
    pick one. If you need a public API, that's a separate concern from your
    app's mutations.

```ts
// server/actions/settings.ts
'use server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { settingsSchema } from '@/lib/validations/settings';

export async function updateSettings(input: z.infer<typeof settingsSchema>) {
  const user = await requireUser();                       // authz first
  const data = settingsSchema.parse(input);               // re-validate on the server, always
  await db.update(...).where(eq(userId, user.id)).set(data);
  revalidatePath('/settings');                            // bust the RSC cache
}
```

### Import style — absolute via `@/*`

This repo mandates `@/*` aliases; no `../../../` chains
(`frontend-rules-typescript.md`). Next resolves them at build time from
`tsconfig.json` — no extra runtime resolver needed:

```jsonc
// tsconfig.json
{ "compilerOptions": { "baseUrl": ".", "paths": { "@/*": ["./src/*"] } } }
```

shadcn's `components.json` aliases must agree (`@/components`, `@/lib/utils`),
or `npx shadcn add` will emit broken imports.

### Component & file naming

- **PascalCase component, matching filename** — `UserProfile.tsx` exports
  `UserProfile`. One component per file, named export (`frontend-rules-typescript.md`).
- **`<ComponentName>Props`** typed interface, not inline — except one/two
  trivial primitive props.
- **Route files are lowercase** (`page.tsx`, `layout.tsx`, `error.tsx`,
  `loading.tsx`, `not-found.tsx`, `route.ts`) — these are Next reserved
  filenames; casing breaks the router.
- **ViewModels** live in `hooks/use-x-view-model.ts` and export
  `useXViewModel()` returning `{ states, handlers }`.

### Styling — Tailwind v4 utility-first, `cn()`, shadcn variants

Tailwind v4 is CSS-first: one line in `globals.css`, theme tokens in `@theme`,
no JS config required:

```css
/* app/globals.css */
@import "tailwindcss";

@theme {
  --color-background: hsl(var(--background));
  --color-foreground: hsl(var(--foreground));
  --color-primary: hsl(var(--primary));
  --radius-lg: var(--radius);
}

:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  /* ... shadcn CSS variables, light + .dark override */
}
```

The `cn()` helper merges Tailwind classes correctly (later wins, conflicts
deduped) — required for shadcn variants to override cleanly:

```ts
// lib/utils.ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

shadcn components use `class-variance-authority` for variants — extend via the
`cva` `variants` map, not by string-concatenating classes:

```tsx
const buttonVariants = cva('inline-flex items-center justify-center rounded-md text-sm', {
  variants: { variant: { default: 'bg-primary text-primary-foreground', outline: 'border border-input' },
              size: { default: 'h-10 px-4', sm: 'h-9 px-3' } },
  defaultVariants: { variant: 'default', size: 'default' },
});
```

Run `prettier-plugin-tailwindcss` so class order is deterministic across the
team — unsorted Tailwind classes are the #1 source of meaningless diffs.

### Data fetching pattern — RSC `fetch` + `revalidate`, server actions for writes

Default to fetching **inside the Server Component** (or a `server/queries/`
helper it calls). The App Router `fetch` is extended with caching/revalidation:

```tsx
// server/queries/products.ts
import 'server-only';

export async function getProducts() {
  const res = await fetch('https://api.example.com/products', {
    next: { revalidate: 3600, tags: ['products'] },   // ISR: refresh hourly, or on-demand
  });
  if (!res.ok) throw new Error('Failed to load products');
  return res.json() as Promise<Product[]>;
}

// bust on write:
// in a server action after mutation → revalidateTag('products');
```

- **`cache: 'no-store'`** = always dynamic. **`next: { revalidate }`** = ISR.
  **`next: { tags }`** = on-demand via `revalidateTag`.
- For DB/ORM access, call `db` directly in a `'server-only'` query module —
  don't route DB calls through `fetch`.
- **Client mutations** go through server actions (`'use server'`); for
  client-driven polling/subscriptions use TanStack Query, but prefer streaming
  RSC first.
- **Streaming**: wrap slow server fetches in `<Suspense>` with a `loading.tsx`
  fallback so the fast parts paint first.

### Error handling — `error.tsx` boundary, `not-found.tsx`, `global-error.tsx`

App Router errors are **per-segment boundaries**, not try/catch in every route:

- **`app/error.tsx`** — catches errors thrown in the sibling/child Server
  Components and server actions. **Must be a Client Component** (`'use client'`),
  receives `{ error, reset }`. Render a recovery UI; call `reset()` to retry.
- **`app/global-error.tsx`** — the only thing that catches an error thrown in
  the **root `layout.tsx`**. Replaces `<html><body>`, so it must render them.
- **`app/not-found.tsx`** — rendered when `notFound()` is called or a route
  misses. Call `notFound()` from a server query when a resource doesn't exist
  (cleaner than throwing).
- **`app/loading.tsx`** — Suspense fallback while the segment streams.

```tsx
// app/(dashboard)/settings/error.tsx
'use client';
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div>
      <h2>Something went wrong</h2>
      <p>{error.digest}</p>      {/* stable id for Sentry correlation */}
      <button onClick={reset}>Try again</button>
    </div>
  );
}
```

In server queries/actions, throw for unexpected failures (the boundary
catches them); call `notFound()` for missing resources; return typed errors
for *expected* business failures you want the UI to handle inline.

### Environment — typed + validated, `NEXT_PUBLIC_` for client-exposed

Use **`@t3-oss/env-nextjs`** (Zod under the hood) so env is typed, validated at
boot, and fails fast — same idea as the Express `config.ts` pattern:

```ts
// src/env.js
import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

export const env = createEnv({
  server: {                                  // server-only — never reaches the client
    DATABASE_URL: z.string().url(),
    AUTH_SECRET: z.string().min(32),
    RESEND_API_KEY: z.string().startsWith('re_'),
  },
  client: {                                  // MUST be prefixed NEXT_PUBLIC_
    NEXT_PUBLIC_APP_URL: z.string().url(),
    NEXT_PUBLIC_POSTHOG_KEY: z.string().optional(),
  },
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    AUTH_SECRET: process.env.AUTH_SECRET,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
  },
});
```

- **`NEXT_PUBLIC_` is a build-time inlining rule**, not access control — any
  value under it is baked into the client bundle. Put secrets under `server:`
  with no prefix; they stay on the server.
- Import `env` instead of `process.env.X` everywhere. One source of truth.
- `.env` / `.env.local` are git-ignored; ship `.env.example` with keys only.
- Next loads `.env.local` automatically in dev; in prod the platform
  (Vercel/Docker) injects them.

## Key libraries

| Library | Purpose |
|---|---|
| `next` | Framework: App Router, Server Components, server actions, route handlers, middleware, image/font optimization. |
| `react` / `react-dom` | React 19 (RSC, Actions, `use()`). |
| `tailwindcss` (v4) + `@tailwindcss/postcss` | Utility-first CSS; v4 is CSS-first, no JS config. |
| `class-variance-authority` | Type-safe component variants (shadcn's variant engine). |
| `clsx` + `tailwind-merge` | The `cn()` trinity — merge Tailwind classes, later-wins, conflict-dedupe. |
| `lucide-react` | Icon set (shadcn default). |
| `zod` | Schema-first validation; `z.infer` feeds TS types; drives form, server-action, and env validation. |
| `react-hook-form` + `@hookform/resolvers` | Performant forms; `zodResolver` wires the Zod schema. |
| `@hookform/resolvers` | Bridges RHF ↔ Zod (and yup/valibot). |
| `next-auth` / `@auth/core` (Auth.js v5) **or** `@clerk/nextjs` | Auth: session, OAuth, email magic links, RBAC. |
| `drizzle-orm` + `drizzle-kit` **or** `@prisma/client` + `prisma` | Type-safe SQL ORM + migration CLI. |
| `@t3-oss/env-nextjs` | Typed, validated, `NEXT_PUBLIC_`-aware env. |
| `zustand` / `jotai` | Client-only UI state (cart, sidebar, optimistic UI). |
| `@tanstack/react-query` | Client data fetching/mutation cache (only where RSC can't). |
| `next-themes` | Dark/light mode (shadcn's theme provider). |
| `next-intl` / `next-i18n-router` | i18n (routing + messages) for multi-locale apps. |
| `@sentry/nextjs` | Error/perf monitoring; auto-instruments RSC, actions, route handlers. |
| `resend` (+ `react-email`) | Transactional email; `react-email` for typed templates. |

Dev-only: `eslint` (`eslint-config-next` + `eslint-plugin-react-hooks` +
`@typescript-eslint`), `prettier` + `prettier-plugin-tailwindcss`, `vitest`,
`@testing-library/react`, `@playwright/test`, `msw`, `@types/*`, `lefthook`
(or `husky` + `lint-staged`), `knip` (dead-code), `@storybook/nextjs`.

## Dev commands

A modern pnpm + Next 15 + Vitest + Drizzle setup (modeled on T3 + ixartz):

```jsonc
// package.json "scripts"
{
  "dev": "next dev --turbopack",           // Turbopack dev server (default in 15)
  "build": "next build",                   // bundles server + client
  "start": "next start",                   // serve the production build
  "lint": "next lint",                     // eslint with next/core-web-vitals
  "format": "prettier --write .",
  "typecheck": "tsc --noEmit",
  "test": "vitest run",
  "test:watch": "vitest",
  "test:e2e": "playwright test",
  "db:generate": "drizzle-kit generate",   // or prisma generate / prisma migrate dev
  "db:migrate": "drizzle-kit migrate",
  "db:studio": "drizzle-kit studio",       // or prisma studio
  "ui:add": "npx shadcn@latest add",       // add a component into components/ui
  "check": "pnpm typecheck && pnpm lint && pnpm test"
}
```

- **Local dev loop:** `pnpm install` → copy `.env.example` → `.env` →
  `pnpm db:migrate` → `pnpm dev`. Turbopack is the default bundler in dev for
  Next 15; Webpack is still used for production builds.
- **`next lint`** scaffolds ESLint flat config (`eslint.config.mjs`) on first
  run; prefer extending `next/core-web-vitals` + `next/typescript`.
- **shadcn init** (`npx shadcn@latest init`) writes `components.json` and the
  `cn()` helper; thereafter `ui:add <name>` drops components into `components/ui/`.

## Deployment notes

**Vercel (default).** Zero-config for Next.js: builds run on Vercel, edge
network serves static + ISR pages, server components/actions run as
serverless/edge functions, images and fonts auto-optimized. Push to `main` →
preview deploys per PR → promote to production. **Drizzle/Prisma migrations
run in a Vercel build step or a post-deploy job** (`drizzle-kit migrate` /
`prisma migrate deploy`) — not lazily on first request.

**Docker self-host.** Next supports a standalone output for minimal images.
In `next.config.ts`:
```ts
export default { output: 'standalone' } satisfies Next.Config;
```
This emits `.next/standalone/` (a self-contained `node server.js`) plus
`.next/static/` and `public/` to copy in. Multi-stage `Dockerfile`:
`deps` → `builder` (`next build`) → `runner` (copy `standalone` + `static` +
`public`, run as non-root, `NODE_ENV=production`). The standalone server
listens on `$PORT` (default 3000); run behind nginx/traefik for TLS + gzip.
Run migrations **once per deploy** in a release job, not in every container.

**Edge runtime.** A route handler, server action, or middleware can declare
`export const runtime = 'edge'` to run on the edge (cold-start-free, global).
Constraints: no Node APIs (`fs`, most of `crypto`, native addons), no Prisma
(needs Node client — use Drizzle's HTTP drivers or Neon/PlanetScale serverless
drivers instead). Use the edge for auth middleware, geo redirects, and
latency-sensitive reads; keep DB-heavy logic on Node.

**Production hygiene:**
- **`middleware.ts`** for auth + i18n routing — it runs on every matched
  request before the route; keep it fast (no DB calls, JWT/session-cookie
  check only).
- **Images**: always `<Image>` (not `<img>` — `eslint-plugin-next` flags it),
  set `remotePatterns` for external hosts, prefer `next/font` over
  `@fontsource` for zero-CLS font loading.
- **`next build` fails on ESLint and type errors** by default — don't disable
  this (`eslint.ignoreDuringBuilds`) to ship faster; fix the errors.
- **Cache invalidation**: tag your fetches (`next: { tags: [...] }`) and call
  `revalidateTag`/`revalidatePath` in server actions after writes, or stale
  data persists until the time-based `revalidate` fires.
- **Secrets**: `AUTH_SECRET`, `DATABASE_URL`, API keys live in the platform's
  env (Vercel project settings / Docker orchestrator secrets), never in the
  repo. Only `NEXT_PUBLIC_*` values are safe to expose to the browser.
