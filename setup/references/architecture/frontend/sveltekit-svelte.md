# SvelteKit + Svelte (Frontend / Full-stack)

Reference for the `coder` role on any `frontend`-labelled TypeScript sub-issue
using SvelteKit. Distilled from the highest-signal production boilerplates and
the SvelteKit 2 / Svelte 5 docs, then mapped to this repo's
`frontend-rules-typescript.md` conventions (which win on any conflict):

- [ocluf/justship](https://github.com/ocluf/justship) — ~640★. A **Svelte 5 +
  SvelteKit 2** SaaS boilerplate: Lucia + Drizzle (Turso/libSQL) + Stripe +
  Postmark + bits-ui/shadcn-svelte + sveltekit-superforms + Zod + PostHog +
  Playwright. The cleanest *current-generation* (runes) reference — its
  `src/lib/server/` split, `hooks.server.ts`, and superforms action pattern are
  the modern default.
- [okupter/kitforstartups](https://github.com/okupter/kitforstartups) — ~730★.
  An adapter-**node** deployable SvelteKit 2 SaaS with Lucia + Drizzle
  (multi-DB: Postgres / MySQL / Turso), `arctic` OAuth, Resend, `sequence()`
  hooks. Use it as the reference for **self-hosted/Node deployment** and the
  multi-database layout under `src/lib/drizzle/<dialect>/`.
- [huntabyte/shadcn-svelte](https://github.com/huntabyte/shadcn-svelte) — ~9k★ +
  [huntabyte/bits-ui](https://github.com/huntabyte/bits-ui) ~3.5k★. shadcn-svelte
  is a CLI/registry that copies Radix-style components into
  `$lib/components/ui/`; bits-ui is the headless primitive layer beneath them.
  Not a runtime dep you call — you own the generated files.
- [joysofcode/enterprise-stack](https://github.com/joysofcode/enterprise-stack)
  — ~380★. Older (SK1, Svelte 3, Skeleton) but a good reference for the
  *shape* of an enterprise layout: Prisma + Lucia + superforms + Zod + Stripe
  + Playwright. Treat version numbers as legacy; the structure is the lesson.

> Where this doc says "recommended", it means *the modern default for new
> SvelteKit code on Svelte 5 / SvelteKit 2*. Where it flags a library as
> "legacy/declining" (Lucia, Skeleton v1), existing code may still use it —
> don't rewrite without reason, but don't pick it for a new app.

> **Auth caveat (important):** Lucia v3 is **deprecated** (announced March
> 2025; v3.2.2 is the final maintenance release). Both boilerplates above
> still ship it, so you will see it in existing code. For **new** apps the
> rising default is **Better Auth**; `@auth/sveltekit` (Auth.js) is the
> long-standing alternative. Migrate, don't start fresh on Lucia.

## Recommended stack components

| Layer | Recommended (new TS code) | Also common | Notes |
|---|---|---|---|
| Framework | **SvelteKit 2** | Astro (Svelte islands), Vite SPA | SvelteKit is the official meta-framework: routing, SSR, server endpoints, env, adapters. `npm create svelte` → now `sv create`. |
| UI runtime | **Svelte 5** (runes: `$state`, `$derived`, `$effect`, `$props`) | Svelte 4 (legacy) | Runes are the reactive system in 5. Stores still work but are the old model; write new components with runes. |
| Language | **TypeScript, `"strict": true`** | — | `tsconfig.json` extends `./.svelte-kit/tsconfig.json`. No `any` — see `frontend-rules-typescript.md`. |
| Styling | **Tailwind CSS v4** via `@tailwindcss/vite` | Tailwind v3 (`tailwind.config.js` + PostCSS — justship/kitforstartups still on v3), CSS Modules | v4 = `@import "tailwindcss"` in `app.css`, Vite plugin, CSS-first `@theme`. |
| UI components | **shadcn-svelte** (bits-ui + CVA + Tailwind) | Skeleton (v2), Melt UI (bits-ui predecessor), daisyUI | shadcn-svelte is the default; copy-in components you fully own, not a black-box dep. justship uses it. |
| Icons | **@lucide/svelte** | lucide-svelte (old name), @lucide/icons | Scoped package is current; `import { Mail } from '@lucide/svelte'`. |
| State (client) | **Svelte 5 runes** (`$state`, `$derived`, `$effect`) + `.svelte.ts` modules for shared state | Svelte stores (`writable`/`readable`/`derived`), nanostores | Runes-in-`.svelte.ts` replace most store use cases. Stores still interop (a store auto-unwraps with `$` in markup). |
| State (server) | **`+layout.server.ts` / `+page.server.ts` `load`** | — | Default: data lives on the server, streamed to the page via `data` prop. No store. |
| Data fetching (server) | **`load` functions** (`+page.server.ts`, `+layout.server.ts`) | — | The SvelteKit primitive. Runs on server, typed via `./$types`, output is the `data` prop. |
| Data fetching (client) | **`+page.ts` universal `load`** / TanStack Svelte Query | SWR | `+page.ts` runs on both server and client (hydration). Reach for Svelte Query only for client-driven polling/mutation `load` can't cover. |
| Forms | **sveltekit-superforms** + **Zod** + SvelteKit form actions | raw form actions, formsnap | superforms wires Zod → action → client `superForm()` with progress, tainted-state, flash messages. Both boilerplates use it. |
| Validation | **Zod** | Valibot, ArkType | Schema is shared between the superforms adapter and the server action; `z.infer` feeds TS types. |
| Auth | **Better Auth** | **`@auth/sveltekit`** (Auth.js), **Lucia v3** *(deprecated)* | Lucia = the boilerplate default but deprecated. Better Auth is the current rising pick; Auth.js is the established alternative. |
| OAuth | **arctic** (justship + kitforstartups both use it) | `@lucia-auth/oauth` (Lucia's old helper), Better Auth social plugins | arctic is a standalone OAuth library that works with any session backend. |
| ORM (SQL, full-stack) | **Drizzle** (`drizzle-orm` + `drizzle-kit`) | Prisma (enterprise-stack's pick), Kysely | Drizzle = no codegen, SQL-first, edge-friendly. Lucia↔Drizzle is the dominant pairing; the adapter is `@lucia-auth/adapter-drizzle`. |
| Env access | **`$env/static/private` / `$env/dynamic/public`** etc. | hand-rolled `process.env` | SvelteKit ships typed, validated-at-build env modules. Static = inlined + typed; dynamic = read at runtime (good for Docker/multi-env). |
| Linter | **ESLint 9 flat config** + `eslint-plugin-svelte` + `typescript-eslint` | Biome | `eslint-plugin-svelte` is required to lint `.svelte` files (template rules, a11y). justship's `eslint.config.js` is the modern flat-config template. |
| Formatter | **Prettier** + **`prettier-plugin-svelte`** | Biome | `prettier-plugin-svelte` parses `.svelte`; add `prettier-plugin-tailwindcss` for class sorting. |
| Type check | **`svelte-check`** | — | Svelte's own type checker; runs `tsc` + template checks. The `check` script every boilerplate ships. |
| Test (unit/component) | **Vitest** + **`@testing-library/svelte`** | — | Vitest is Vite-native (SvelteKit is Vite). Config lives in `vite.config.ts`. |
| Test (E2E) | **Playwright** | — | Both boilerplates ship it; `playwright.config.ts` at root, tests in `tests/`. |
| Package manager | **pnpm** | npm, yarn, bun | pnpm is the disk-efficient default; kitforstartups is a pnpm workspace. |
| Email | **Resend** (`resend`) + `react-email`-style HTML | Postmark, emailjs | justship uses Postmark; kitforstartups uses Resend (with Mailhog in dev). |
| Payments (SaaS) | **Stripe** (`stripe`) | — | Webhook handler is a `+server.ts` endpoint; justship's `routes/stripe/` is the canonical shape. |
| Analytics | **PostHog** (`posthog-js`) | — | Init in `+layout.ts` guarded by `browser && !dev`; justship's pattern. |
| Observability | **Sentry** (`@sentry/sveltekit`) | — | Sentry's SvelteKit SDK auto-instruments `load`, actions, `handle`. |
| Git hooks | **husky** + **lint-staged** (or `lefthook`) | — | Run `svelte-check` + Prettier + ESLint on staged files. |

## Folder structure

SvelteKit layout, aligned with both boilerplates and this repo's rules
(`$lib` imports, `types/` per domain, MVVM View/ViewModel split):

```
src/
  routes/                    # file-system routing — routes ONLY
    +layout.svelte           # root <html> shell (app.html is the template; this is the component)
    +layout.ts               # root universal load (e.g. PostHog init when browser)
    +layout.server.ts        # root server load (site-wide data)
    +error.svelte            # ERROR BOUNDARY — catches thrown error()/unexpected errors
    +page.svelte             # /
    (app)/                   # route group (parens) — URL not affected, own layout
      +layout.server.ts      # auth guard: return { user: event.locals.user }
      +layout.svelte         # app chrome (sidebar/topbar) + {@render children()}
      +page.svelte
      dashboard/
        +page.server.ts
        +page.svelte
      settings/
        +page.server.ts      # load + actions (e.g. updateSettings)
        +page.svelte
    (auth)/                  # route group — public, different chrome
      login/
        +page.server.ts      # actions: { login_with_email, signout }
        +page.svelte
      login/google/
        +server.ts           # OAuth redirect endpoint
        callback/+server.ts  # OAuth callback endpoint
    api/                     # +server.ts endpoints — webhooks, OAuth callbacks, public JSON
      stripe/webhook/+server.ts
    sitemap.xml/+server.ts
  lib/                       # $lib alias — everything importable
    components/
      ui/                    # shadcn-svelte generated — don't hand-edit, `npx shadcn-svelte add`
      features/              # feature-scoped composites: features/user/user-table.svelte
    server/                  # *** SERVER-ONLY *** — auto-stripped from client bundle
      auth.ts                # Lucia / Better Auth config + session helpers
      database/
        db.ts                # Drizzle client singleton
        schema.ts            # Drizzle table defs (user, session, tokens)
        user.model.ts        # queries/mutations per entity (getUserByEmail, createNewUser…)
    utils.ts                 # cn() + shared pure utils
    types.ts                 # shared types (App.Locals live in app.d.ts)
    hooks/                   # client hooks (actions, if any)
    stores/                  # legacy stores — prefer runes-in-.svelte.ts for new code
  params/                    # custom matchers: src/params/[name].ts → routes/[x=[name]]
  app.d.ts                   # App.Locals / App.Error / App.Platform typing
  app.html                   # <html><head>%sveltekit.head%…%sveltekit.body%
  app.css                    # Tailwind: @import "tailwindcss"; (v4) or @tailwind layers (v3) + theme vars
  hooks.server.ts            # runs on every server request — auth session → event.locals
  hooks.client.ts            # (optional) runs on client navigation
static/                      # static assets, served at root (favicon, manifest, icons)
drizzle/                     # generated migrations (drizzle-kit generate)
  0000_*.sql
  meta/
drizzle.config.ts            # schema path, dialect, dbCredentials
svelte.config.js             # adapter + vitePreprocess + aliases ($styles, etc.)
vite.config.ts               # sveltekit() plugin + Vitest config
tailwind.config.js           # v3 only; v4 is CSS-first
components.json              # shadcn-svelte CLI config (aliases: $lib/components, $lib/utils)
tsconfig.json                # extends ./.svelte-kit/tsconfig.json
playwright.config.ts
package.json
```

Notes:
- **`src/lib/server/` is a special-cased alias.** SvelteKit forbids importing
  anything under `$lib/server` (or any `$server`-suffixed folder) into client
  code — the build will fail. This is the real tripwire that replaces
  `"server-only"`; put DB clients, Drizzle schema, auth secrets, and email
  helpers here.
- **`src/routes/` holds routes only** — no business logic. Each route file is
  thin: `load` fetches on the server, `+page.svelte` renders a View. Move
  logic into `$lib/server/` (server) or a `.svelte.ts` store/hook (client).
- **`static/` is the analog of Next's `public/`** — served at `/`, no
  processing. Put `manifest.webmanifest`, icons, robots.txt, social cards here.
- **Route groups `(name)`** organize without affecting the URL. Both
  boilerplates split `(app)` (authed) vs `(auth)`/`(login)` (public), each
  with its own `+layout.server.ts` guard and chrome.
- **`app.html` is the HTML template**, not a component — it has
  `%sveltekit.head%` and `%sveltekit.body%` placeholders. The root
  `+layout.svelte` is the component that renders inside `%sveltekit.body%`.

## Conventions

### Runes vs stores — default to runes, one component per `.svelte` file

**Svelte 5 runes are the reactive system.** Use them in every new component;
stores are the legacy model (they still work and interop — a `$store` in
markup auto-unwraps — but don't start new patterns on them):

| Rune | Purpose | Replaces (Svelte 4) |
|---|---|---|
| `$props()` | component input | `export let x` |
| `$state(x)` | reactive local state | `let x = …` (implicit reactive) |
| `$derived(x)` | computed from other state | `$: doubled = x * 2` |
| `$effect(() => …)` | side effect on dep change | `$: { … }` (side effects) |
| `$bindable()` | two-way bindable prop | `export let x` + `bind:x` |
| `{#snippet}` / `{@render}` | render-prop / slot | `<slot>` / `<svelte:fragment>` |

```svelte
<!-- components/login/Login.svelte — Svelte 5 runes -->
<script lang="ts">
  import { superForm } from 'sveltekit-superforms';
  import { zodClient } from 'sveltekit-superforms/adapters';
  import { loginFormSchema, type LoginFormSchema } from './schema';
  import type { SuperValidated, Infer } from 'sveltekit-superforms';

  // $props() — component input (replaces `export let`)
  let { data }: { data: SuperValidated<Infer<LoginFormSchema>> } = $props();

  // $state — reactive local state
  let email_input: HTMLInputElement | null = $state(null);
  let loginWithEmail = $state(false);

  const form = superForm(data, { validators: zodClient(loginFormSchema) });
  const { form: formData, enhance } = form;
</script>

<form method="POST" action="/login?/login_with_email" use:enhance>
  <input bind:value={$formData.email} bind:this={email_input} placeholder="Email" />
  <button>Continue</button>
</form>
```

For **shared client state across components**, put runes in a `.svelte.ts`
module (the `.svelte.ts` extension unlocks runes outside a component):

```ts
// lib/stores/cart.svelte.ts — runes in a plain module
class Cart {
  items = $state<CartItem[]>([]);
  total = $derived(this.items.reduce((s, i) => s + i.price, 0));
  add(item: CartItem) { this.items.push(item); }
}
export const cart = new Cart();
```

Import and use directly — `cart.total` is reactive in any `.svelte` file.

### File-based routing — `+`-prefixed filenames are the contract

| File | Role | Runs on |
|---|---|---|
| `+page.svelte` | page UI (the View) | client (SSR'd first) |
| `+page.ts` | **universal** `load` (client + server) | both |
| `+page.server.ts` | **server** `load` + **`actions`** (form actions) | server only |
| `+layout.svelte` | wraps every route in the subtree | client |
| `+layout.ts` / `+layout.server.ts` | layout-level `load` | both / server |
| `+server.ts` | API endpoint (`GET`, `POST`, …) — the analog of a route handler | server |
| `+error.svelte` | error boundary for this subtree | client |
| `+layout.guards.ts` (rare) | per-subtree guard | — |

Rules:
- **`+page.ts` (universal) vs `+page.server.ts` (server)** — if the load
  touches the DB, secrets, or `$env/static/private`, it *must* be
  `+page.server.ts`. Use `+page.ts` only when you need the same code on the
  client (e.g. fetch from a public API, or share derived state during
  navigation). You can have both: server load output is the *input* to the
  universal load via `await parent()`.
- **`+server.ts` endpoints** are for webhooks (Stripe), OAuth callbacks, and
  public JSON/XML APIs (`GET` returns `json()` or `new Response()`). Don't
  build a `+server.ts` CRUD next to form actions — pick form actions for your
  own UI's writes, `+server.ts` for third-party/external callers.
- **`./$types`** — every `+page.svelte`/`+page.server.ts` imports its types
  from `./$types` (`PageData`, `PageServerLoad`, `Actions`, `LayoutLoad`).
  These are **generated** by `svelte-kit sync` (runs on `dev`/`build`/`check`);
  never hand-edit them.
- **Route files are lowercase with `+`** (`+page.svelte`, `+server.ts`) — these
  are SvelteKit reserved filenames; casing or omitting `+` breaks the router.

### Form actions — `superValidate` + Zod, the canonical pattern

justship and kitforstartups both use this exact shape. The server action
validates with the Zod schema (the *same* schema the client uses), returns
`fail()` on error, and the client picks it up via `superForm()`:

```ts
// routes/(auth)/login/+page.server.ts
import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { error, fail } from '@sveltejs/kit';
import { loginFormSchema } from '$lib/components/login/schema';
import { getUserByEmail, createNewUser } from '$lib/server/database/user.model';

export const load = async (event) => {
  const form = await superValidate(zod(loginFormSchema));      // empty form for GET
  return { form, user: event.locals.user };
};

export const actions = {
  login_with_email: async ({ request, getClientAddress }) => {
    const form = await superValidate(request, zod(loginFormSchema));  // validate POST
    if (!form.valid) return fail(400, { form });                       // back to client w/ errors

    const user = await getUserByEmail(form.data.email)
      ?? await createNewUser({ id: generateId(15), email: form.data.email });
    // …send verification email, rate-limit, etc.
    return { form };                                                   // success
  },
};
```

```svelte
<!-- routes/(auth)/login/+page.svelte -->
<script lang="ts">
  import { superForm } from 'sveltekit-superforms';
  import { zodClient } from 'sveltekit-superforms/adapters';
  import type { PageData } from './$types';
  import { loginFormSchema } from '$lib/components/login/schema';

  let { data }: { data: PageData } = $props();
  const { form, enhance } = superForm(data.form, {
    validators: zodClient(loginFormSchema),
    onResult(e) { if (e.result.type === 'success') { /* navigate */ } },
  });
</script>

<form method="POST" use:enhance>
  <input name="email" bind:value={$form.email} />
  {#each $form.errors.email ?? [] as err}<p class="text-red-500">{err}</p>{/each}
  <button>Continue</button>
</form>
```

- **`use:enhance`** (SvelteKit built-in) progressively enhances the form:
  works without JS, falls back to a full POST with JS off. `superForm`'s
  `enhance` wraps it with tainted-state, loading spinners, and flash.
- **One schema, two adapters**: `zod(schema)` on the server action,
  `zodClient(schema)` on the client `superForm`. Never re-define the schema
  per side.
- **`fail(status, { form })`** keeps the typed payload; `error(status, msg)`
  throws to the `+error.svelte` boundary. Use `fail` for validation errors
  the form should show inline, `error` for unexpected/server failures.

### Load functions — server for secrets/DB, universal for shared logic

```ts
// routes/(app)/+layout.server.ts — AUTH GUARD pattern (both boilerplates)
import type { LayoutServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: LayoutServerLoad = async (event) => {
  if (!event.locals.user) redirect(302, '/login');   // hooks.server.ts populated locals
  return { user: event.locals.user };
};
```

- **`event.locals`** is populated by `hooks.server.ts` (see Auth below) and is
  the bridge between the session and your `load`/`actions`.
- **`await parent()`** lets a child `load` read its parent layout's data — use
  this to avoid re-fetching user/site config in every route.
- **Streaming**: return a `Promise` from `load` and SvelteKit streams it —
  render the slow part inside `{#await}` so the fast parts paint first.

### Import style — `$lib` alias (built-in, no config)

`$lib` is wired by SvelteKit itself — no `tsconfig` `paths` entry needed (it's
in the generated `.svelte-kit/tsconfig.json`). Custom aliases go in
`svelte.config.js` `kit.alias` (kitforstartups adds `$styles`):

```js
// svelte.config.js — kitforstartups pattern
const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter(),
    alias: { $styles: 'src/styles' },   // import '$styles/global.css'
  },
};
```

This repo mandates `$lib/*` imports; no `../../../` chains
(`frontend-rules-typescript.md`). shadcn-svelte's `components.json` aliases
must agree (`$lib/components`, `$lib/utils`, `$lib/components/ui`) or
`npx shadcn-svelte add <x>` emits broken imports.

### Component & file naming

- **PascalCase component, matching filename** — `UserProfile.svelte` exports
  `UserProfile`. One component per file (`frontend-rules-typescript.md`).
- **`<ComponentName>Props`** typed interface — in Svelte 5 it's the `$props()`
  destructuring type, not `export let`. Prefer `let { a, b }: Props = $props()`
  with a `Props` interface over inline.
- **Route files are lowercase with `+`** (`+page.svelte`, `+server.ts`,
  `+layout.server.ts`, `+error.svelte`) — reserved filenames; casing breaks
  the router.
- **`.svelte.ts` / `.svelte.js`** for modules that use runes (shared state,
  plain TS logic with `$state`/`$derived`).

### Styling — Tailwind, scoped-by-default, `cn()`, shadcn-svelte variants

Svelte styles are **scoped to the component by default** — a `<style>` block
in `Button.svelte` only affects that component. Global styles go in
`src/app.css`, imported once in the root `+layout.svelte` (or `app.html`):

```css
/* src/app.css — justship's shadcn-svelte theme (Tailwind v3 @layer form) */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 0 0% 3.9%;
    --primary: 0 0% 9%;
    /* …shadcn CSS variables; .dark override below */
  }
  .dark { --background: 0 0% 3.9%; --foreground: 0 0% 98%; /* … */ }
}
```

For **Tailwind v4** (CSS-first), drop `tailwind.config.js` and PostCSS; add the
Vite plugin and one import:

```ts
// vite.config.ts (Tailwind v4)
import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
export default defineConfig({ plugins: [tailwindcss(), sveltekit()] });
```
```css
/* src/app.css (v4) */
@import "tailwindcss";
@theme { --color-background: hsl(var(--background)); /* … */ }
```

The `cn()` helper (clsx + tailwind-merge) is required for shadcn-svelte
variants to override cleanly:

```ts
// lib/utils.ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }
```

shadcn-svelte components use `tailwind-variants` (or CVA) for variants —
extend via the variants map, don't string-concatenate classes.

### Server-only code — `$lib/server/`, the build-time guard

SvelteKit **statically prevents** importing anything under `$lib/server/` (or
any folder ending in `.server`) into client-rendered code — the build fails.
This is the real, enforced tripwire (no `import "server-only"` needed):

```
src/lib/server/
  auth.ts             # Lucia/Better Auth instance, sessionCookie config
  database/
    db.ts             # Drizzle client (Turso/Postgres/MySQL driver)
    schema.ts         # table definitions
    user.model.ts     # getUserByEmail, createNewUser, …
  email/
    email.ts          # Postmark/Resend client
  stripe.ts           # Stripe SDK
```

Rule: any file that imports `drizzle-orm`, your DB driver, `lucia`, `stripe`,
`resend`, or reads `$env/static/private` **must** live under `$lib/server/`
(or a `*.server.ts` file). The server `load`/`actions`/`+server.ts` import
from here; components never do.

### Auth — `hooks.server.ts` populates `event.locals`, `app.d.ts` types it

The canonical Lucia-in-SvelteKit pattern (justship + kitforstartups identical):

```ts
// src/app.d.ts — type the locals the hook writes
declare global {
  namespace App {
    interface Locals {
      user: import('lucia').User | null;
      session: import('lucia').Session | null;
    }
  }
}
export {};
```

```ts
// src/hooks.server.ts — runs on EVERY server request
import { lucia } from '$lib/server/auth';
import type { Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';   // compose multiple handles

const authHandle: Handle = async ({ event, resolve }) => {
  const sessionId = event.cookies.get(lucia.sessionCookieName);
  if (!sessionId) { event.locals.user = null; event.locals.session = null; return resolve(event); }

  const { session, user } = await lucia.validateSession(sessionId);
  if (session?.fresh) {                                  // rolling session cookie
    const c = lucia.createSessionCookie(session.id);
    event.cookies.set(c.name, c.value, { path: '.', ...c.attributes });
  }
  if (!session) {                                        // invalid → clear cookie
    const c = lucia.createBlankSessionCookie();
    event.cookies.set(c.name, c.value, { path: '.', ...c.attributes });
  }
  event.locals.user = user;
  event.locals.session = session;
  return resolve(event);
};

export const handle = sequence(authHandle);              // add more handles here
```

- **`sequence()`** composes handles (auth, i18n, logging) — kitforstartups's
  pattern. Each handle wraps the next.
- **Guards live in `+layout.server.ts`**, not the hook: the hook *populates*
  `locals`; the layout *checks* it and `redirect()`s. This keeps the hook fast
  (no redirect logic) and colocates authz with the route.
- **For Better Auth / Auth.js**, the shape is the same — a `handle` (or
  middleware) validates the session and writes `event.locals`; the
  `app.d.ts` types change to match the library's session/user types.

### Error handling — `error()`, `fail()`, `+error.svelte` boundaries

- **`throw error(404, 'Not found')`** (or just `error(...)` in SvelteKit 2 —
  `throw` is optional) → renders the nearest `+error.svelte` with that status.
- **`return fail(400, { form })`** → stays on the same page, returns the
  payload to the action/form (used for validation errors).
- **`redirect(302, '/login')`** → navigation (also `throw`-optional in SK2).
- **`+error.svelte`** is the boundary — render recovery UI, read `page.status`
  and `page.error`. The root `+error.svelte` (in `src/routes/`) catches
  anything not caught deeper.
- In `load`/`actions`, throw for unexpected failures (the boundary catches
  them); return typed failures for *expected* business errors you want inline.

### Environment — four typed modules, static vs dynamic

SvelteKit ships typed env modules — never read `process.env` directly:

| Module | When it's read | Use for |
|---|---|---|
| `$env/static/private` | build time (inlined, treeshaken) | server secrets that never change per-request (`DATABASE_URL`, `AUTH_SECRET`) — fails build if missing |
| `$env/static/public` | build time (inlined into client bundle) | public build-time config (`PUBLIC_ORIGIN`) — **exposed to the browser** |
| `$env/dynamic/private` | runtime (per-request) | secrets that vary by request/Docker env, or serverless cold-start |
| `$env/dynamic/public` | runtime | public values that change without rebuild |

```ts
// $lib/server/auth.ts
import { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } from '$env/static/private';
import { PUBLIC_ORIGIN } from '$env/static/public';
import { dev } from '$app/environment';
```

- **`PUBLIC_` prefix is mandatory** for anything the browser sees — non-prefixed
  vars are server-only and will error if imported into `$env/static/public`.
- **Static = typed + validated at build** (missing `DATABASE_URL` fails the
  build, not runtime). Dynamic = flexible but untyped-by-default; cast at the
  boundary.
- **`.env` / `.env.local` are git-ignored**; ship `.env.example` with keys
  only (justship's `.env.example` is the template). Vite loads `.env` in dev;
  in prod the platform (Vercel/Fly/Docker) injects them.
- `$app/environment` gives `dev`, `browser`, `building`, `version` flags —
  use `dev` to skip analytics / use localhost callbacks.

## Key libraries

| Library | Purpose |
|---|---|
| `@sveltejs/kit` | Framework: routing, `load`, form actions, `+server.ts` endpoints, `hooks`, env modules, adapters. |
| `svelte` | Svelte 5 runtime + compiler (runes: `$state`, `$derived`, `$effect`, `$props`). |
| `@sveltejs/vite-plugin-svelte` | Vite plugin + `vitePreprocess()` (TS/PostCSS in `.svelte`). |
| `@sveltejs/adapter-auto` / `-node` / `-static` / `-cloudflare` / `-vercel` | Build adapters — pick per deploy target (see Deployment). |
| `tailwindcss` (v4 `@tailwindcss/vite`, or v3 + `autoprefixer`/`postcss`) | Utility-first CSS; v4 is CSS-first, v3 uses `tailwind.config.js`. |
| `clsx` + `tailwind-merge` | The `cn()` trinity — merge Tailwind classes, later-wins, conflict-dedupe. |
| `tailwind-variants` (or `class-variance-authority`) | Type-safe component variants (shadcn-svelte's variant engine). |
| `bits-ui` | Headless, accessible primitives (the Svelte analog of Radix). Foundation under shadcn-svelte. |
| `shadcn-svelte` (CLI/registry, not a runtime dep) | Copies styled components into `$lib/components/ui/`. Run `npx shadcn-svelte@latest add <x>`. |
| `@lucide/svelte` | Icon set (shadcn-svelte default). |
| `zod` | Schema-first validation; `z.infer` feeds TS types; shared by superforms adapter + server action. |
| `sveltekit-superforms` | Form library: Zod ↔ action ↔ client `superForm()` with enhance, tainted-state, flash messages. |
| `lucia` **(deprecated)** + `@lucia-auth/adapter-drizzle` **or** `better-auth` **or** `@auth/sveltekit` | Auth: sessions, cookies, OAuth, email magic links. Don't start new apps on Lucia. |
| `arctic` | Standalone OAuth (Google/GitHub/…) that pairs with any session backend — both boilerplates use it. |
| `drizzle-orm` + `drizzle-kit` **or** `@prisma/client` + `prisma` | Type-safe SQL ORM + migration CLI. Drizzle = no codegen, edge-friendly (justship + kitforstartups). |
| `oslo` | Small crypto/encoding helpers (Lucia's utility lib — `generateId`, etc.). |
| `mode-watcher` | Dark/light mode (`<ModeWatcher />` + `toggleMode()`). |
| `@tanstack/svelte-query` | Client data fetching/mutation cache (only where `load` can't). |
| `svelte-sonner` | Toasts (Sonner port for Svelte). |
| `vaul-svelte` | Drawer/sheet component (mobile nav, bottom sheets). |
| `resend` (+ email HTML) **or** `postmark` | Transactional email. |
| `stripe` | Payments; webhook handler is a `+server.ts` endpoint. |
| `posthog-js` | Product analytics; init in `+layout.ts` guarded by `browser && !dev`. |
| `@sentry/sveltekit` | Error/perf monitoring; auto-instruments `load`, actions, `handle`. |

Dev-only: `eslint` (flat config + `eslint-plugin-svelte` + `typescript-eslint`),
`prettier` + `prettier-plugin-svelte` (+ `prettier-plugin-tailwindcss`),
`svelte-check` (the `check` script), `vitest`, `@testing-library/svelte`,
`@playwright/test`, `husky` + `lint-staged` (or `lefthook`), `knip` (dead-code).

## Dev commands

A modern pnpm + SvelteKit 2 + Svelte 5 + Vitest + Drizzle setup (modeled on
justship + kitforstartups):

```jsonc
// package.json "scripts"
{
  "dev": "vite dev",
  "build": "vite build",
  "preview": "vite preview",
  "check": "svelte-kit sync && svelte-check --tsconfig ./tsconfig.json",
  "check:watch": "svelte-kit sync && svelte-check --tsconfig ./tsconfig.json --watch",
  "lint": "prettier --check . && eslint .",
  "format": "prettier --write .",
  "typecheck": "svelte-kit sync && svelte-check --tsconfig ./tsconfig.json",
  "test": "vitest run",
  "test:watch": "vitest",
  "test:e2e": "playwright test",
  "db:generate": "drizzle-kit generate",   // writes ./drizzle/0000_*.sql
  "db:migrate": "tsx ./migrate.ts",        // applies migrations
  "db:studio": "drizzle-kit studio",       // or: drizzle-kit introspect
  "ui:add": "npx shadcn-svelte@latest add" // drops a component into $lib/components/ui/
}
```

- **Scaffold a new app:** `npx sv create` (the unified Svelte CLI) → choose
  "SvelteKit minimal", TypeScript, ESLint+Prettier, Drizzle (optional). This
  replaces the old `npm create svelte@latest`.
- **Local dev loop:** `pnpm install` → copy `.env.example` → `.env` →
  `pnpm db:migrate` → `pnpm dev`. Dev server is on `http://localhost:5173`.
- **`svelte-kit sync`** regenerates `./$types` and `.svelte-kit/tsconfig.json`;
  it runs automatically on `dev`/`build`/`check`, but run it (or `pnpm check`)
  after renaming a route if your editor's types go stale.
- **`pnpm check`** is the SvelteKit-native gate (replaces `tsc --noEmit`):
  runs `svelte-check` which type-checks both `.ts` and the `<script>`/template
  of `.svelte` files. CI should run `check && lint && test`.
- **shadcn-svelte init** (`npx shadcn-svelte@latest init`) writes
  `components.json` and the `cn()` helper; thereafter `ui:add <name>` drops
  components into `$lib/components/ui/`.
- **Drizzle** migrations: `db:generate` writes SQL to `./drizzle/`,
  `db:migrate` applies them (via a small `migrate.ts` runner using `tsx`).
  `db:push` skips the SQL files and pushes the schema directly — dev-only.

## Deployment notes

**Adapters are the deploy contract.** Unlike Next.js (which assumes Vercel),
SvelteKit is adapter-pluggable — `svelte.config.js` picks the target:

| Adapter | Target | Output |
|---|---|---|
| `@sveltejs/adapter-auto` | auto-detects Vercel/Netlify/Cloudflare | justship's default; convenient, less control |
| `@sveltejs/adapter-node` | any Node host (Fly, Railway, Docker, bare metal) | kitforstartups's pick; emits a self-contained Node server in `build/` |
| `@sveltejs/adapter-static` | fully static SPA/SSG (`export const prerender = true`) | no server, no form actions, no SSR — for blogs/docs |
| `@sveltejs/adapter-cloudflare` / `-vercel` | Cloudflare Pages/Workers, Vercel | serverless functions + edge, platform-specific bindings |
| `@sveltejs/adapter-bun` | Bun runtime | fastest cold start if you run on Bun |

```js
// svelte.config.js — adapter-node (self-hosted)
import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
const config = {
  preprocess: vitePreprocess(),
  kit: { adapter: adapter() },
};
export default config;
```

**Node self-host (adapter-node).** `pnpm build` emits `build/` (server) +
`static/` (assets). Run `node build/index.js` — listens on `$PORT` (default
3000), reads `$ORIGIN`/`$BODY_SIZE_LIMIT`/`$HOST`. Multi-stage `Dockerfile`:
`deps` → `builder` (`pnpm build`) → `runner` (copy `build/` + `static/` +
`package.json` + `node_modules`, `NODE_ENV=production`, non-root user). Run
migrations **once per deploy** in a release job (`pnpm db:migrate`), not in
the app's startup.

**Static / SSG (adapter-static).** For blogs/docs/marketing: set
`export const prerender = true` in the root `+layout.ts` (or per-page),
add a `fallback` in adapter config, drop `+server.ts` and form actions (they
need a server). Output goes to `build/`; deploy to any static host.

**Edge runtime / serverless.** adapter-cloudflare and adapter-vercel deploy
`load`/actions/endpoints as serverless/edge functions. Constraints: no Node
APIs (`fs`, native addons), and **Drizzle's Node drivers don't run on the
edge** — use the HTTP/serverless drivers (`@libsql/client`, `postgres`
over HTTP, Neon's serverless driver, PlanetScale's) instead. kitforstartups
ships Turso (libSQL) precisely because it's edge-friendly.

**Production hygiene:**
- **`hooks.server.ts` for auth** runs on every server request — keep it lean
  (session-cookie validation only); put redirect/guard logic in
  `+layout.server.ts` so the hook stays fast.
- **`prerender`** specific routes (marketing, blog) in their `+page.ts` for
  free static output even on adapter-node — SvelteKit will SSR them at build.
- **`$env/static/*` is inlined at build** — changing a static env var requires
  a rebuild. For values that change without a rebuild (multi-tenant origin,
  feature flags), use `$env/dynamic/*`.
- **`svelte-check` is the type gate** — `vite build` does *not* type-check by
  default; run `pnpm check` in CI before deploy (or add `"build": "pnpm check
  && vite build"`).
- **Secrets**: `DATABASE_URL`, `AUTH_SECRET`/`BETTER_AUTH_SECRET`, API keys,
  Stripe webhook secret live in the platform's env (Vercel/Fly/Docker
  orchestrator secrets), never in the repo. Only `PUBLIC_*` values are safe
  to expose to the browser.
- **CSRF**: SvelteKit form actions are CSRF-protected by default (origin
  check on `POST`). Don't disable it. For `+server.ts` endpoints accepting
  external POSTs (webhooks), verify signatures (Stripe webhook signing
  secret, etc.) — the built-in CSRF check is bypassed for non-form content
  types, so signature verification is your trust boundary.
