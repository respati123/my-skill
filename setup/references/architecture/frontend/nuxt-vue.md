# Nuxt + Vue (Frontend / Full-stack)

Reference for the `coder` role on any `frontend`-labelled TypeScript sub-issue
using Nuxt. Distilled from the highest-signal production boilerplates and the
official Nuxt 4 directory-structure docs, then mapped to this repo's
`frontend-rules-typescript.md` conventions (which win on any conflict):

- [viandwi24/nuxt3-awesome-starter](https://github.com/viandwi24/nuxt3-awesome-starter) — ~1.8k★. The canonical "batteries-included" layout using
  **Nuxt Layers** (`extends`), component prefixes (`components: [{ prefix }]`),
  and `imports.dirs` to auto-import Pinia stores. Stale on versions (last
  touched 2023, still Nuxt 3.0), but its **layer + auto-import config** is the
  pattern most modern Nuxt codebases copy.
- [sidebase/sidebase](https://github.com/sidebase/sidebase) — ~850★. The
  canonical **full-stack** starter: `server/api/` (Nitro handlers), `prisma/`,
  `server/middleware/0.prisma.ts` (inject `PrismaClient` into `event.context`),
  `tests/` (Vitest + `@nuxt/test-utils` + Playwright). Active.
- [taunoha/nuxt4-starter-template](https://github.com/taunoha/nuxt4-starter-template) — ~20★ but the cleanest **Nuxt 4** reference: `app/` srcDir,
  `shared/` (types + utils auto-imported on both client & server), Tailwind v4
  via `@tailwindcss/vite`, `nuxt-security`, `eslint.config.mjs` flat config.
- [onmax/nuxt-skill-hub](https://github.com/onmax/nuxt-skill-hub) — Nuxt team's
  official "the Nuxt way" guidance for agents. The backstop for "use the
  smallest Nuxt abstraction before generic Vue", payload-backed data fetching,
  SSR/hydration, and `runtimeConfig` private-vs-public.

> **Version reality (npm `latest`, Aug 2025):** `nuxt` **4.5.2** is `latest`
> (Nuxt 4 released July 2025; `3.x` is still published on the `3x` tag at
> 3.21.11). `@nuxt/ui` is **4.x** — **built on `reka-ui` + Tailwind v4**, not
> the old `@nuxtjs/tailwindcss` + headless-ui combo. `@nuxt/eslint` (flat
> config) supersedes the old `@nuxtjs/eslint-config-typescript`. Pin majors
> in `package.json`; don't copy a 2023 starter's versions verbatim.

## Recommended stack components

| Layer | Recommended (new code) | Also common | Notes |
|---|---|---|---|
| Framework | **Nuxt 4** (`nuxt` 4.5.x) | Nuxt 3 (`3x` tag) | Nuxt 4 makes `app/` the srcDir by default and adds `shared/`. |
| UI framework | **Vue 3 + `<script setup lang="ts">`** | — | Composition API only; no Options API for new code. |
| Language | **TypeScript, `typescript.strict: true`** | — | Nuxt generates types in `.nuxt/`; `nuxi typecheck` runs `vue-tsc`. |
| Component lib | **Nuxt UI v4** (`@nuxt/ui`, reka-ui + Tailwind v4) | reka-ui directly, shadcn-vue, Naive UI, PrimeVue, DaisyUI | Nuxt UI = official, themeable, auto-imported. Use reka-ui directly if you want headless primitives only. |
| Styling | **Tailwind CSS v4** (via `@tailwindcss/vite`) or **Nuxt UI** (bundles Tailwind) | UnoCSS, `@nuxtjs/tailwindcss` v6 (Tailwind v3 bridge), SCSS in `assets/` | Tailwind v4 = no config file, CSS-first `@theme`. The `@nuxtjs/tailwindcss` module targets v3. |
| State (server-shared) | **`useState`** (built-in, SSR-safe) | — | For app-wide reactive state that survives hydration. |
| State (complex) | **Pinia** (`@pinia/nuxt`) | — | Official Vue store. Auto-imported if `imports.dirs: ['stores']` (viandwi24 pattern). |
| Data fetching | **`useFetch` / `useAsyncData`** (payload-backed, SSR-safe) | TanStack Query for Vue (`@tanstack/vue-query`) for cache-heavy clients | Use `useFetch` for simple GETs; `useAsyncData` when you call `$fetch`/multiple sources yourself. `$fetch` for non-reactive / server-to-server. |
| Forms | **VeeValidate 4** + **Zod** (or Valibot) | FormKit | VeeValidate `defineField` + `handleSubmit` + a Zod schema. Nuxt UI v4 form components integrate with VeeValidate. |
| Validation | **Zod** (or Valibot) | Joi, Yup | Schema-first; share the same schema between client form + server route. |
| Auth | **better-auth** (Nuxt SDK) or **`@sidebase/nuxt-auth`** (NextAuth-based) | hand-rolled session/JWT | better-auth = framework-agnostic, TS-first, rising. sidebase/nuxt-auth = OAuth/session via NextAuth. |
| ORM (if full-stack) | **Prisma** (SQL) / **Drizzle** | Mongoose (Mongo) | See the Express backend doc; here Prisma lives in `server/utils/db.ts` + `prisma/schema.prisma`. |
| Linter | **`@nuxt/eslint`** (flat config, `eslint.config.mjs`) | ESLint + `eslint-plugin-vue` + `@nuxtjs/eslint-config-typescript` | `@nuxt/eslint` is the modern default; generates a project-aware flat config. |
| Formatter | **Prettier** (+ `prettier-plugin-tailwindcss`) | Biome, dprint | Prettier is the Nuxt ecosystem default. |
| Test (unit/component) | **Vitest** + **`@vue/test-utils`** / **`@testing-library/vue`** | — | `environment: 'nuxt'` via `@nuxt/test-utils` gives you the real Nuxt instance in tests. |
| Test (e2e) | **Playwright** | Cypress | `@nuxt/test-utils` ships a `playwright` integration. |
| Package manager | **pnpm** | npm, yarn, bun | pnpm is the Nuxt team default; bun is fast but module resolution edge cases exist. |
| Node runtime | **Node ≥ 20 LTS** (Nuxt 4) | Bun, Deno | Pin the major in `engines`. |

## Folder structure

Nuxt 4 default srcDir is `app/` — all Vue-side code lives there. `server/`,
`shared/`, `public/`, and `nuxt.config.ts` stay at the repo root. Adapted from
taunoha's Nuxt 4 layout + sidebase's full-stack server structure:

```
nuxt.config.ts          # single config: modules, runtimeConfig, app.head, routeRules
app.config.ts           # (optional) build-time app config — NOT for secrets
package.json
tsconfig.json           # extends .nuxt/tsconfig.json (generated)
eslint.config.mjs       # flat config via @nuxt/eslint

app/                     # ← srcDir (Nuxt 4 default)
  app.vue                # root component: <NuxtLayout><NuxtPage/></NuxtLayout>
  error.vue              # global error page (404 / unhandled), gets `error` prop
  assets/
    css/main.css         # global CSS (Tailwind v4 @import, @theme), bundled by Vite
  components/            # auto-imported; path-based prefix: App/Header.vue → <AppHeader>
    App/
      Header.vue
    User/
      UserCard.vue       # → <UserUserCard> (or configure `pathPrefix: false`)
  composables/           # auto-imported (use* prefix not enforced but conventional)
    useAuth.ts
    useFormatDate.ts
  layouts/
    default.vue          # <slot/>; set per-page via definePageMeta({ layout })
    auth.vue
  middleware/            # route guards; `.global.ts` runs on every navigation
    auth.global.ts
    admin.ts
  pages/                 # file-based routing
    index.vue            # → /
    about.vue            # → /about
    users/
      index.vue          # → /users
      [id].vue           # → /users/:id (useRoute().params.id)
      [...slug].vue      # → catch-all /:slug(.*)*
  plugins/               # run on app init; `.client`/`.server` suffix to scope
    auth.client.ts
    pinia.ts             # usually auto by @pinia/nuxt, here if custom
  utils/                 # auto-imported (no `use` prefix); pure helpers
    format.ts
  stores/                # Pinia stores — add to imports.dirs for auto-import
    useUser.ts
  app.vue

server/                  # ← Nitro (root level, NOT under app/)
  api/                   # → mounted at /api
    v1/
      posts.get.ts       # GET /api/v1/posts (file name = HTTP method suffix)
      posts.post.ts      # POST /api/v1/posts
      posts/[id].get.ts  # GET /api/v1/posts/:id
      posts/[id].put.ts  # PUT /api/v1/posts/:id
  routes/                # → mounted at / (no /api prefix)
    sitemap.xml.ts
  middleware/            # runs on every server request (e.g. inject prisma)
    0.prisma.ts
  utils/                 # auto-imported server-side only; NOT importable from app/
    db.ts                # PrismaClient singleton
    auth.ts

shared/                  # ← Nuxt 4: auto-imported on BOTH client and server
  types/
    user.ts              # plain type/DTO, no Vue or Nitro imports
  utils/
    constants.ts

public/                  # served as-is at /; favicon, robots.txt, og images

prisma/                  # (if using Prisma) — repo root
  schema.prisma

tests/                   # Vitest specs; @nuxt/test-utils provides Nuxt env
  components/
    UserCard.test.ts
  server/api/
    posts.test.ts
  e2e/
    auth.spec.ts         # Playwright
  setup.ts
```

Notes:
- **`app/` srcDir is the Nuxt 4 default.** On Nuxt 3 projects the same dirs
  (`pages/`, `components/`, …) sit at the repo root. Don't mix — check
  `nuxt.config.ts` for a custom `srcDir` before assuming.
- **`server/` and `shared/` are ALWAYS at repo root**, never under `app/`,
  even on Nuxt 4. Nuxt docs: *"Do not import Vue app code in your server
  routes, and do not import server-only code in your app."* `shared/` is the
  only directory that bridges both.
- **Component auto-import + path prefixing.** `components/App/Header.vue` is
  available as `<AppHeader>` by default (`pathPrefix: true`). Set
  `components: [{ path: '~/components', pathPrefix: false }]` to drop the prefix.
- **`stores/` is NOT auto-imported by default** — add it in `nuxt.config.ts`:
  `imports: { dirs: ['stores'] }`, or let `@pinia/nuxt`'s `storesDirs` option
  handle it (viandwi24: `pinia: { storesDirs: ['~/stores/**'] }`).

## Conventions

### Import style — auto-imports, `~`/`@`, `#imports`

Nuxt auto-imports Vue APIs (`ref`, `computed`, `watch`), Nuxt composables
(`useFetch`, `useRoute`, `navigateTo`, `definePageMeta`), everything in
`composables/` and `utils/`, and (if you allow it) Pinia stores. You almost
never write `import { ref } from 'vue'`.

```vue
<!-- app/pages/users/[id].vue -->
<script setup lang="ts">
// no imports needed for ref, useRoute, useFetch, definePageMeta
const route = useRoute()
const { data: user, error } = await useFetch(`/api/v1/users/${route.params.id}`)

definePageMeta({ middleware: 'auth' })        // references app/middleware/auth.ts
useHead({ title: () => user.value?.name })    // SSR-safe <title>
</script>
```

- **Aliases:** `~` and `@` → `app/` (srcDir); `~~` and `@@` → repo root;
  `#shared`, `#imports`, `#build` are Nuxt-managed. For server code, `~/utils/db`
  resolves to `server/utils/db.ts`.
- **Explicit imports** (`#imports`) when a name is ambiguous or you want it
  discoverable: `import { useFetch, useHead } from '#imports'`.
- **No relative `../../` chains** — use `~/components/...` (this repo's
  `frontend-rules-typescript.md` rule; Nuxt's aliases make it trivial).

### Page = file-based routing

Files in `pages/` map to routes automatically. Dynamic segments use `[param]`,
catch-all uses `[...slug]`. File names can also carry the HTTP-method-style
suffix in `server/api/`, but **not** in `pages/`.

```ts
// app/pages/users/[id].vue → /users/:id
const route = useRoute()
const id = computed(() => String(route.params.id))
```

- Page metadata (layout, middleware, transition, key) via `definePageMeta({ … })`
  inside `<script setup>`. It's a compiler macro — no import, top-level only.
- Nested routes = nested folders. Layout switching: `definePageMeta({ layout: 'auth' })`.
- `app.vue` is optional when `pages/` exists (Nuxt injects a default). Use
  `<NuxtLayout>` + `<NuxtPage />` when you need a wrapper.

### Composables & `utils/` — auto-imported, SSR-safe

- `composables/useFoo.ts` → auto-imported as `useFoo`. Convention: `use` prefix.
- `utils/format.ts` exports → auto-imported with no prefix.
- **SSR safety:** any composable touching `window`/`document`/`localStorage`
  must guard with `import.meta.client` or `process.client`, or only run inside
  `onMounted`. `onMounted` does **not** fire during SSR.

### Data fetching — `useFetch` / `useAsyncData`, payload-backed

Nuxt fetches the data on the server, serializes it into the HTML payload, and
reuses it on the client (no double fetch). Three tiers:

- **`useFetch(url)`** — simplest, for GET endpoints. Returns `{ data, error,
  pending, refresh }`. Key is derived from the URL + options.
- **`useAsyncData(key, handler)`** — when you call `$fetch` yourself, hit
  multiple endpoints, or transform. You own the `key`.
- **`$fetch(url)`** — raw, not reactive, **not SSR-payload-backed**. Use inside
  event handlers (`onSubmit`, `onClick`) or inside server routes. Using `$fetch`
  at the top of `<script setup>` will double-fetch (server then client) — use
  `useFetch` instead.

```ts
// app/composables/useUser.ts
export function useUser(id: MaybeRef<string>) {
  return useFetch(`/api/v1/users/${toValue(id)}`, {
    key: () => `user-${toValue(id)}`,
    transform: (u: UserDTO) => ({ ...u, fullName: `${u.first} ${u.last}` }),
  })
}
```

- **Server-to-server:** inside `server/api/` handlers, call other endpoints with
  `$fetch` or share logic via `server/utils/` (auto-imported).
- **TanStack Query** (`@tanstack/vue-query`) is the upgrade when you need
  client-side caching, optimistic updates, or polling that `useFetch`'s
  `refresh()` doesn't cover cleanly.

### Server routes — Nitro / h3 handlers

Files in `server/api/` map to `/api/*`; `server/routes/` map to non-`/api`
paths; `server/middleware/` run on every request. Handlers use `defineEventHandler`
(or the `eventHandler` alias) from `h3` (re-exported by Nitro).

```ts
// server/api/v1/posts.get.ts  →  GET /api/v1/posts
import { z } from 'zod'                       // server utils + zod auto-resolved
const Query = z.object({ limit: z.coerce.number().default(20) })

export default defineEventHandler(async (event) => {
  const { limit } = await getQuery(event)     // or readValidatedBody for POST
  const parsed = Query.parse({ limit })
  return db.post.findMany({ take: parsed.limit })
})
```

```ts
// server/api/v1/posts/[id].get.ts  →  GET /api/v1/posts/:id
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const post = await db.post.findUnique({ where: { id } })
  if (!post) throw createError({ statusCode: 404, statusMessage: 'Post not found' })
  return post
})
```

- **Method suffix in filename** = route is method-restricted: `posts.get.ts`,
  `posts.post.ts`, `[id].put.ts`, `[id].delete.ts`. No suffix = all methods.
- **Errors:** `throw createError({ statusCode, statusMessage, data })` — Nuxt
  renders `error.vue` for 4xx/5xx in the app, and returns JSON for API routes.
- **Body / query / params:** `readBody`, `getQuery`, `getRouterParam`,
  `readValidatedBody(event, schema.parse)` (validate with the same Zod schema
  the client form uses — single source of truth).
- **`server/utils/db.ts` PrismaClient singleton** (Nuxt auto-imports `db`):

```ts
// server/utils/db.ts
import { PrismaClient } from '@prisma/client'
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }
export const db = globalForPrisma.prisma ?? new PrismaClient()
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
```

  (sidebase instead injects Prisma via `server/middleware/0.prisma.ts` into
  `event.context.prisma` — both patterns work; the singleton util is simpler.)

### State — `useState` vs Pinia

- **`useState<T>(key, init)`** — built-in, SSR-safe, shared across components
  for the request. Use for simple app-wide flags (theme, sidebar open, current
  tenant). No module needed.
- **Pinia** — when you need actions, getters, multiple related slices, devtools
  time-travel, or persistence. `@pinia/nuxt` auto-registers; enable store
  auto-import via `imports: { dirs: ['stores'] }` or `pinia.storesDirs`.

```ts
// app/stores/useUser.ts (Pinia setup-store style, TS-friendly)
import { defineStore } from 'pinia'
export const useUserStore = defineStore('user', () => {
  const user = ref<UserDTO | null>(null)
  const isLoggedIn = computed(() => !!user.value)
  async function login(email: string, password: string) {
    user.value = await $fetch('/api/auth/login', { method: 'POST', body: { email, password } })
  }
  return { user, isLoggedIn, login }
})
```

### Styling — Tailwind v4 or Nuxt UI

- **Tailwind v4 (current):** add `@tailwindcss/vite` to `nuxt.config.ts`
  `vite.plugins`, `@import 'tailwindcss'` in `app/assets/css/main.css`, list it
  in `css: ['~/assets/css/main.css']`. Theme via `@theme { --color-*: … }` in
  CSS — no `tailwind.config.js` needed. (taunoha pattern.)
- **`@nuxtjs/tailwindcss` v6** still targets Tailwind **v3** + a JS config; use
  it only if you must stay on v3. For new code, prefer the v4 vite plugin.
- **Nuxt UI v4** bundles Tailwind v4 + `reka-ui` + a theme system; just add the
  module and use `<UButton>`, `<UInput>`, etc. — auto-imported.
- **Scoped styles:** `<style scoped>` in `.vue` files for component-local CSS.
  Global CSS only in `app/assets/css/`.
- **`@nuxtjs/color-mode`** for dark/light without FOUC (writes a class on `<html>`
  before hydration).

### Error handling — `error.vue`, `createError`, route rules

- **`app/error.vue`** — the global error page. Receives an `error` prop
  (`{ statusCode, statusMessage, message }`). Call `clearError({ redirect: '/' })`
  to dismiss. It's rendered outside layouts by default.
- **Throw, don't return errors:** `throw createError({ statusCode: 404 })` in a
  server route, or `throw createError(...)` in a page's setup to render `error.vue`.
- **`routeRules` (render mode per route)** in `nuxt.config.ts`:

```ts
export default defineNuxtConfig({
  routeRules: {
    '/':        { prerender: true },     // SSG — built at `nuxt generate`
    '/blog/**': { isr: 60 },             // incremental static regen, 60s
    '/admin/**': { ssr: false },         // SPA-only (client-rendered)
    '/api/**':  { cors: true },          // Nitro route middleware
  },
})
```

### Render modes — SSR / SPA / SSG

| Mode | Config | When |
|---|---|---|
| **SSR** (default) | `ssr: true` | Dynamic, per-request, SEO-important content. |
| **SSG** (prerender) | `nuxt generate` / `routeRules: { prerender: true }` | Marketing sites, docs, blogs. Output is static HTML. |
| **SPA** | `ssr: false` | Dashboards behind auth, no SEO need, heavy client interactivity. |
| **ISR / SWR** | `routeRules: { isr: 60 }` | Stale-while-revalidate at the edge (needs a Nitro KV/cache backend). |
| **Hybrid** | mix `routeRules` entries | Most real apps: prerender marketing, SSR the app, SPA the dashboard. |

`compatibilityDate` is **required** in `nuxt.config.ts` (Nuxt 3.7+) — it pins
behavior across Nitro/Vite upgrades. Set it to the project start date.

### Environment — `runtimeConfig` private vs public

Secrets and server-only config live in top-level `runtimeConfig`; anything the
browser needs lives in `runtimeConfig.public`. Env vars are mapped by name
(uppercased, `NUXT_` prefix) automatically.

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  runtimeConfig: {
    databaseUrl: process.env.DATABASE_URL,           // server-only — NEVER sent to client
    authSecret: process.env.AUTH_SECRET,
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE,     // available on client via useRuntimeConfig().public
      buildAt: new Date().toISOString(),
    },
  },
})
```

```ts
// app/ — client or server
const { public: { apiBase } } = useRuntimeConfig()
// server/ — server only
const { databaseUrl } = useRuntimeConfig(event)
```

- **Never** put a secret under `runtimeConfig.public` — it ships in the HTML payload.
- Validate env at boot with Zod if you want fail-fast (this repo's convention
  for the Express backend applies here too).

### Testing — Vitest in Nuxt env + Playwright

`@nuxt/test-utils/module` gives Vitest a real Nuxt instance (auto-imports,
runtimeConfig, plugins) inside tests.

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import Vue from '@vitejs/plugin-vue'
export default defineConfig({
  plugins: [Vue()],
  test: {
    environment: 'nuxt',           // <-- from @nuxt/test-utils
    setupFiles: ['./tests/setup.ts'],
  },
})
```

```ts
// tests/components/UserCard.test.ts
import { mount } from '@vue/test-utils'
import UserCard from '~/components/User/UserCard.vue'
it('renders name', () => {
  const wrapper = mount(UserCard, { props: { user: { id: '1', name: 'Ada' } } })
  expect(wrapper.text()).toContain('Ada')
})
```

- Server route tests use `@nuxt/test-utils`'s `setup` + `$fetch` against the
  running Nuxt instance (sidebase pattern), or Nitro's test utils directly.
- E2E = Playwright; `@nuxt/test-utils/playwright` gives `createPage` that waits
  for Nuxt hydration.

### Linting — `@nuxt/eslint` flat config

```js
// eslint.config.mjs
import withNuxt from './.nuxt/eslint.config.mjs'   // generated by @nuxt/eslint
export default withNuxt(
  // your overrides here
  { rules: { 'vue/multi-word-component-names': 'off' } },
)
```

Pair with Prettier (+ `prettier-plugin-tailwindcss`) and `eslint-config-prettier`
to turn off conflicting rules. Run `npx nuxi prepare` after module changes so
`.nuxt/eslint.config.mjs` regenerates.

## Key libraries

| Library | Purpose |
|---|---|
| `nuxt` | Meta-framework: file routing, SSR/SSG/SPA, Nitro server, auto-imports, module system. |
| `vue` (3) | Underlying UI framework; `<script setup>` + Composition API. |
| `@pinia/nuxt` | Official Vue state-management module; setup-store style with TS. |
| `@vueuse/nuxt` | 200+ composable utilities (`useStorage`, `useDark`, `useEventListener`); auto-imported. |
| `@nuxt/ui` (v4) | Official component library on reka-ui + Tailwind v4 (`<UButton>`, `<UForm>`, etc.). |
| `reka-ui` | Headless, accessible Vue primitives (the Nuxt UI v4 engine) — use directly for custom design systems. |
| `tailwindcss` (v4) + `@tailwindcss/vite` | Utility CSS; v4 is CSS-first, no JS config. (Or `@nuxtjs/tailwindcss` v6 for the v3 bridge.) |
| `vee-validate` + `zod` | Schema-driven form validation; share the Zod schema with the server route. |
| `@nuxt/eslint` | Project-aware flat ESLint config; supersedes `@nuxtjs/eslint-config-typescript`. |
| `@nuxt/test-utils` | Vitest `environment: 'nuxt'` + Playwright helpers for e2e. |
| `better-auth` or `@sidebase/nuxt-auth` | Session/OAuth auth; better-auth = TS-first framework-agnostic, sidebase = NextAuth-based. |
| `@nuxt/image` | Optimized responsive images (`<NuxtImg>`, `<NuxtPicture>`), format conversion (webp/avif). |
| `@nuxt/icon` | Iconify-based `<Icon name="i-lucide-x" />`, bundled at build time. |
| `@nuxt/fonts` | Auto-downloads/self-hosts Google/Local fonts, no `@font-face` boilerplate. |
| `nuxt-security` | Security headers, CSP, rate-limit, XSS hardening — sane defaults. |
| `@nuxt/content` | Markdown/MDX/CSV as a file-based CMS with type-safe queries. |
| `@nuxtjs/i18n` | i18n: routing, `useI18n()`, SEO hreflang, locale messages. |
| `@nuxtjs/color-mode` | FOUC-free dark/light mode, class on `<html>` pre-hydration. |
| `@prisma/client` (+ `prisma`) | (Full-stack) type-safe SQL ORM; singleton in `server/utils/db.ts`. |

Dev-only: `vitest`, `@vue/test-utils`, `@testing-library/vue`, `playwright`,
`vue-tsc`, `prettier`, `prettier-plugin-tailwindcss`, `husky`, `lint-staged`.

## Dev commands

A modern pnpm + Nuxt 4 + Vitest setup (mirrors sidebase/taunoha):

```jsonc
// package.json "scripts"
{
  "dev": "nuxt dev",                         // http://localhost:3000, HMR
  "build": "nuxt build",                     // → .output/server/index.mjs (Node preset)
  "generate": "nuxt generate",               // SSG → .output/public/
  "preview": "nuxt preview",                 // serve the build locally
  "postinstall": "nuxt prepare",             // regenerate .nuxt/ types + eslint config
  "typecheck": "nuxi typecheck",             // runs vue-tsc --noEmit against generated tsconfig
  "lint": "eslint .",                        // flat config from @nuxt/eslint
  "lint:fix": "eslint . --fix",
  "format": "prettier --write .",
  "test": "vitest run",
  "test:watch": "vitest",
  "test:e2e": "playwright test"
}
```

- **Local dev loop:** `pnpm install` → copy `.env.example` → `.env` (with
  `DATABASE_URL`, `AUTH_SECRET`, `NUXT_PUBLIC_API_BASE`) → (full-stack) `pnpm prisma migrate dev`
  → `pnpm dev`.
- **`postinstall: nuxt prepare` is mandatory** — without it, `.nuxt/` types and
  the auto-generated `eslint.config.mjs` go stale after dependency changes.
- **Add a module:** `npx nuxi module add @nuxt/ui` (writes `modules:` in
  `nuxt.config.ts` and installs the package).

## Deployment notes

**Nuxt uses Nitro presets** — set via `nitro: { preset: 'vercel' }` in
`nuxt.config.ts`, the `NITRO_PRESET` env var, or auto-detected from the deploy
target. Output goes to `.output/`.

| Target | Preset | Output / command |
|---|---|---|
| **Node server** (default) | `node` (or `node-cluster`) | `node .output/server/index.mjs`; respects `NITRO_PORT`/`PORT` (3000), `NITRO_HOST`/`HOST`. |
| **Vercel** | `vercel` (auto-detected) | `nuxt build` → `.vercel/output/`; connect repo, Vercel runs the build. |
| **Netlify** | `netlify` | `nuxt build` → `.netlify/`. |
| **Cloudflare** | `cloudflare-pages` / `cloudflare-module` | Workers/Pages; note Workers runtime limits (no Node APIs). |
| **Static / SSG** | `static` (any CDN) | `nuxt generate` → `.output/public/`; SPA fallback at `200.html`/`404.html`. |
| **Deno** | `deno` / `deno-deploy` | Deno Deploy. |
| **Bun** | `bun` | `bun .output/server/index.mjs`. |

**Critical production hygiene:**
- **Always set `NODE_ENV=production`** when running the server. Vue Router (and
  others) only strip dev warnings under it — otherwise logs flood.
- **Run behind a reverse proxy** (nginx, Cloudflare, a load balancer) for TLS
  termination; the Nitro server serves plain HTTP.
- **`compatibilityDate` in `nuxt.config.ts` is required** and must not be
  backdated arbitrarily — it pins Nitro/Vite behavior.
- **Secrets via the host, not the bundle.** `runtimeConfig` (non-`public`) keys
  are server-only and safe; anything in `runtimeConfig.public` is embedded in
  client HTML — never put a DB URL or signing key there.
- **DB migrations run once per deploy** (release job), not on every container
  start in a scaled fleet — same rule as the Express backend doc.
- **Prerender large static routes** (`routeRules: { '/**': { prerender: true } }`)
  to cut server cost; let Nitro crawl links (`nitro: { prerender: { crawlLinks: true } }`).
- **Docker:** Nuxt ships a small `.output/server/` with bundled deps — a slim
  runtime image (e.g. `node:20-alpine`) is enough; no dev deps, no source.
