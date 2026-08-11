# Astro (Frontend)

Reference for the `coder` role on any `frontend`-labelled TypeScript sub-issue
using Astro. Distilled from the highest-signal production boilerplates and the
official Astro docs, then mapped to this repo's `frontend-rules-typescript.md`
conventions (which win on any conflict):

- [withastro/astro `examples/`](https://github.com/withastro/astro/tree/main/examples) — the official starter kits, scaffolded by
  `npm create astro@latest` (`--template basics|blog|portfolio|minimal`,
  plus `framework-react`, `with-mdx`, `with-tailwindcss`, `with-nanostores`,
  `with-vitest`). These are the source-of-truth for the idiomatic layout;
  everything below mirrors them.
- [onwidget/AstroWind](https://github.com/onwidget/astro-wind) — ~5.9k★. The
  canonical **marketing/site** template: Astro 7 + Tailwind v4, component-driven
  sections (`src/components/`), `@astrojs/sitemap`, `@astrojs/rss`, i18n via
  `astro-i18n`-style locale folders. The pattern most agency/client sites copy.
- [satnaing/astro-paper](https://github.com/satnaing/astro-paper) — ~4.9k★. The
  canonical **blog** theme: Content Collections + MDX, RSS, sitemap, dark mode,
  a11y-first. The reference for a type-safe content pipeline.
- [saicaca/fuwari](https://github.com/saicaca/fuwari) — ~4.9k★. Aesthetic
  static blog; shows Content Collections + Tailwind + image optimization at
  scale (~5k stars of real-world usage).
- [ixahmedxi/orbitkit](https://github.com/ixahmedxi/orbitkit) — ~0.9k★. The
  **production monorepo** starter: Turborepo + Astro + better-auth + Drizzle +
  shadcn. The reference for full-stack Astro (auth, DB, multi-app workspace).

> Where this doc says "recommended", it means *the modern default for new Astro
> code*. Where it flags a library as "legacy/declining", existing code may still
> use it — don't rewrite without reason, but don't pick it for a new app.

> **Version reality (npm `latest`):** `astro` **7.2.0** is `latest` (the task
> brief said Astro 5; pin to the current major, 7, for new code — Astro 5/6 are
> superseded). Content Collections v2 (the **Content Layer API**) is GA;
> config lives at **`src/content.config.ts`** (not the legacy
> `src/content/config.ts`). **Server Islands** (`server:defer`) and
> **Client Routing** (`<ClientRouter />`, formerly "View Transitions") are GA.
> **`@astrojs/tailwind` is deprecated** — use **`@tailwindcss/vite`** (Tailwind
> v4) instead. `astro:env` (typed env) is stable since 5.0. Node ≥ 18.20.8,
> 20.3.0, or 22+.

## Recommended stack components

| Layer | Recommended (new TS code) | Also common | Notes |
|---|---|---|---|
| Framework | **Astro 7** | Astro 5/6 (existing) | Content-driven, islands-first, zero-JS-by-default. `output: 'static'` is the default. |
| Language | **TypeScript, `"strict": true`** | — | `astro check` runs diagnostics via `@astrojs/check` + `typescript`. |
| UI islands | **React** (most common pairing) | Vue, Svelte, Solid, Preact, Alpine | Astro is framework-agnostic; islands can **mix** frameworks on one page. React is the ecosystem default (shadcn, orbitkit). Add via `npx astro add react`. |
| Styling | **Tailwind CSS v4** via `@tailwindcss/vite` | UnoCSS, scoped `<style>`, CSS Modules | **Do not** install `@astrojs/tailwind` (deprecated). v4 is CSS-first: `@import "tailwindcss";` in a global stylesheet. |
| Content | **Astro Content Collections** (Content Layer API) + **MDX** (`@astrojs/mdx`) | remote data via `fetch()` loader | Type-safe Markdown/MDX/data; schema in `src/content.config.ts`; query with `getCollection()`. |
| State (islands) | **Nano Stores** (`nanostores` + `@nanostores/react`/`/preact`/`/vue`) | Pinia (Vue), Zustand (React) | Astro's official recommendation for cross-island state; tiny (~1 KB). Official `with-nanostores` example. |
| Data fetching | **`fetch()` in `.astro` frontmatter** | `getStaticPaths()`, loaders | Runs on the server at build time (static) or request time (SSR); ships zero JS. |
| i18n | **Astro built-in i18n** (`i18n` in `astro.config.mjs`) | `astro-i18n`, `paraglide` | Locale folders under `src/pages/`; routing + `Astro.currentLocale`. |
| Auth (full-stack) | **better-auth** or **Auth.js via adapter** | Clerk (managed), Lucia (archived) | Orbitkit uses better-auth. For static sites, client-side auth (Firebase/Clerk) or edge middleware. |
| DB (full-stack) | **Drizzle** or **Prisma** | Astro DB/Studio (beta) | Only when `output: 'server'` + an adapter. Migrations run as a deploy step, not on first request. |
| Linter | **ESLint 9 flat config** (`@eslint/js` + `typescript-eslint` + `eslint-plugin-astro`) | Biome | `eslint-plugin-astro` lints `.astro` files (no `console.log`, no unused, a11y). |
| Formatter | **Prettier** + **`prettier-plugin-astro`** | Biome | `prettier-plugin-astro` formats `.astro`; pair with `prettier-plugin-tailwindcss` for class sorting. |
| Test (unit/component) | **Vitest** + **`@testing-library/react`** (or framework equivalent) | — | Official `with-vitest` + `container-with-vitest` examples; Astro ships an experimental Component (Container) API for rendering `.astro` in isolation. |
| Test (E2E) | **Playwright** | Cypress | Cross-browser; pairs with Vitest for the unit layer. |
| Package manager | **pnpm** | npm, yarn, bun | pnpm is disk-efficient and the community default for Astro monorepos (orbitkit). |
| Node runtime | **Node ≥ 20 LTS** | Bun, Deno | Pin the major in `engines`; Bun works but has edge cases with some integrations. |
| Observability | **Sentry** (`@sentry/astro`) | — | Auto-instruments Astro pages, endpoints, server islands. |

## Folder structure

Astro convention, aligned with the official starters and this repo's rules
(`@/*` imports, `types/` per domain, one component per file). Static-by-default;
add `server/` + an adapter only if you go SSR:

```
astro.config.mjs        # integrations, output mode, adapters, i18n, vite config
tsconfig.json           # extends "astro/tsconfigs/strict"; paths for @/* aliases
package.json
eslint.config.mjs       # flat config (eslint-plugin-astro + typescript-eslint)
.content-types/         # generated by Content Layer (gitignore it)

src/
  pages/                # file-based routing ONLY — one route per .astro file
    index.astro         # → /
    about.astro         # → /about
    blog/
      index.astro       # → /blog
      [slug].astro      # → /blog/:slug  (getStaticPaths returns [{ params }])
      [...slug].astro   # → catch-all /:slug(.*)*
    rss.xml.ts          # → /rss.xml  (endpoint, returns new Response)
  layouts/              # page shells with <slot/> — NOT routes
    BaseLayout.astro    # <html><head><body> + global styles + <slot/>
    BlogPost.astro      # wraps article pages
  components/           # reusable UI — PascalCase, one component per file
    Header.astro
    Footer.astro
    ui/                 # design-system primitives (e.g., shadcn ports)
    islands/            # explicitly client-hydrated components (React/Vue/Svelte)
      SearchReact.tsx
  content/              # Content Collections source files (Markdown/MDX/JSON)
    blog/
      first-post.md
      second-post.mdx
    authors/
      ada.json
  content.config.ts     # ← collection schemas (Content Layer API) — zod + loaders
  styles/
    global.css          # @import "tailwindcss"; @theme { ... }; base layer
  lib/                  # pure helpers, no Astro imports
    utils.ts            # cn() etc.
  utils/                # (alias for lib/ — pick one, many starters use utils/)
  types/                # shared types, one domain per file: types/post.ts
  env.d.ts              # ambient declarations / astro/client reference

public/                 # served as-is at / — favicon, robots.txt, og images, fonts
  favicon.svg
  robots.txt

src/assets/             # (alternative) images processed by Astro's image pipeline
  logo.png              # import → <Image src={logo} />; optimized, hashed
```

Notes:
- **`src/pages/` is routing only** — no business logic. A page fetches (in
  frontmatter) and renders; logic moves into `src/lib/` or `src/utils/`.
- **`src/content.config.ts` (root of `src/`) is the Content Layer config.** The
  legacy location `src/content/config.ts` still works but is not the default.
- **`public/` vs `src/assets/`** — `public/` files are copied verbatim and
  referenced by URL (`/img.png`); `src/assets/` files are imported and run
  through Astro's image optimizer (responsive `srcset`, AVIF/WebP). Prefer
  `src/assets/` for anything you want optimized.
- **`server/` is not a default folder.** It appears only when you add SSR +
  an adapter; then `src/pages/api/*.ts` (endpoints) and server middleware
  (`src/middleware.ts`) become relevant. A static site has neither.

## Conventions

### Islands architecture — zero JS by default, hydrate on demand

Astro renders every page to HTML on the server. Components are **static by
default** — no JavaScript ships. To make a component interactive, add a
`client:*` directive **where it's used**, not where it's defined:

| Directive | When it hydrates | Use for |
|---|---|---|
| `client:load` | Immediately on page load | Interactive elements above the fold that must work instantly (nav toggle, hero CTA). |
| `client:idle` | When the browser is idle | Below-the-fold or non-critical widgets (chat bubble, widgets). Default when unsure. |
| `client:visible` | When it scrolls into view | Comments, embeds, anything far down the page. |
| `client:media="(max-width: 50em)"` | Only on matching viewports | Mobile-only nav, desktop-only widgets. |
| `client:only="react"` | **Skips server render** — renders only on the client | Components that touch `window`/`document` at module load and can't SSR. |

```astro
---
// src/pages/index.astro — runs on the server, ships zero JS by itself
import Counter from '../components/islands/CounterReact.tsx';
---
<html>
  <body>
    <h1>Static HTML, no JS shipped for this.</h1>
    <Counter client:load />            {/* hydrates immediately */}
    <Counter client:idle />            {/* hydrates when browser is idle */}
    <Counter client:visible />         {/* hydrates when scrolled into view */}
  </body>
</html>
```

Rule of thumb: **the default is no directive at all.** Reach for `client:*`
only when a component genuinely needs interactivity, and pick the laziest
directive that still feels right (`client:visible` > `client:idle` >
`client:load`). Every hydrated island is JS shipped; fewer = faster.

**You can mix frameworks on one page** (`<ReactThing client:load />` next to
`<VueThing client:visible />`), but each framework integration adds to the
runtime — pick one for a greenfield app unless you have a real reason to mix.

**Server Islands** (`server:defer`) are a separate, SSR-only feature: render
the static page shell immediately and stream a deferred component's HTML from
the server later (e.g., a personalized "recently viewed" block on an otherwise
cached page). GA since Astro 5; requires `output: 'server'` (or hybrid) and an
adapter. Don't confuse with client islands.

### File-based routing — `src/pages/`, `.astro`, dynamic `[slug]`

- **`src/pages/index.astro` → `/`.** `src/pages/blog/index.astro` → `/blog`.
  `src/pages/about.astro` → `/about`. One file per route.
- **Dynamic routes** `[param].astro` → `/blog/:slug`. For static output you
  **must** export `getStaticPaths()` returning `[{ params: { slug } }, ...]`.
  On SSR, params are dynamic without `getStaticPaths`.
- **Catch-all** `[...slug].astro` → matches `/a/b/c`. Rest params in
  `getStaticPaths` return `{ params: { slug: ['a','b','c'] } }`.
- **Endpoints** — `src/pages/api/*.ts` (or any `.ts` in `pages/`) export a
  `GET`/`POST`/etc. handler returning a `Response`. `src/pages/rss.xml.ts`
  returning XML is the canonical RSS feed pattern.
- **Nested layouts** via `<slot />`; set a layout per page with frontmatter
  `const layout = ...` or by wrapping children.

```astro
---
// src/pages/blog/[slug].astro
import { getCollection, render } from 'astro:content';
import BlogPost from '../../layouts/BlogPost.astro';

export async function getStaticPaths() {
  const posts = await getCollection('blog');
  return posts.map((post) => ({ params: { slug: post.id }, props: post }));
}

const post = Astro.props;
const { Content } = await render(post);
---
<BlogPost title={post.data.title}>
  <Content />                    {/* renders the Markdown/MDX body */}
</BlogPost>
```

### Content Collections — schema in `src/content.config.ts`, query with `getCollection`

Content Collections give you **type-safe content** with a Zod schema and a
loader (Content Layer API). Config lives at `src/content.config.ts`:

```ts
// src/content.config.ts
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

const authors = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/authors' }),
  schema: z.object({ name: z.string(), avatar: z.string() }),
});

export const collections = { blog, authors };
```

Query and render:

```astro
---
// src/pages/blog/index.astro
import { getCollection } from 'astro:content';
const posts = (await getCollection('blog', ({ data }) => !data.draft))
  .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
---
<ul>
  {posts.map((post) => <li><a href={`/blog/${post.id}/`}>{post.data.title}</a></li>)}
</ul>
```

- **`render()` from `astro:content'`** (v5+) replaces the old
  `import { Content } from 'post.render()'` / `post.body` patterns — use
  `const { Content } = await render(entry)`.
- **Loaders** — `glob()` (local files), `file()` (single JSON/YAML), and a
  `fetch()` loader for remote/HEAD APIs. The Content Layer caches and
  type-checks all of them the same way.
- **MDX components** — register components for use inside `.mdx` via the
  `components` prop or `mdxComponents` in the collection config.
- **Entries are keyed by `id`**, which the loader derives from the file path
  (slug). `entry.slug` is gone in v5+ — use `entry.id`.

### Layouts — base layout pattern, `<slot />`

A layout is just an `.astro` component that wraps children with `<slot />`.
The base layout owns `<html>`, `<head>`, and global styles:

```astro
---
// src/layouts/BaseLayout.astro
import '../styles/global.css';
import { ClientRouter } from 'astro:transitions';
interface Props { title: string; description?: string; }
const { title, description = 'Default description' } = Astro.props;
---
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>{title}</title>
    <meta name="description" content={description} />
    <ClientRouter />                {/* client-side routing / view transitions */}
  </head>
  <body>
    <slot />                        {/* page content renders here */}
  </body>
</html>
```

- **`Astro.props`** is the typed props object — match it to a `Props`
  interface at the top of the frontmatter.
- **`<ClientRouter />`** from `astro:transitions` enables client-side routing
  and view transitions (the renamed successor to `<ViewTransitions />`).
  Opt in per-layout; without it, every navigation is a full page load.
- **Nest layouts** by importing one layout into another and wrapping its
  `<slot />` — `BlogPost.astro` can itself use `BaseLayout.astro`.

### Import style — alias via `tsconfig.json`

Astro resolves `tsconfig.json` `paths` at build time. This repo mandates `@/*`
aliases; no `../../../` chains (`frontend-rules-typescript.md`):

```jsonc
// tsconfig.json
{
  "extends": "astro/tsconfigs/strict",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": { "@/*": ["./src/*"], "@components/*": ["./src/components/*"] }
  }
}
```

`astro/tsconfigs/strict` (or `strictest`) is the recommended base — it turns on
the checks Astro expects (`verbatimModuleSyntax`, etc.). Don't hand-roll a
tsconfig from scratch.

### Component & file naming

- **PascalCase `.astro` components**, filename matches the export —
  `Header.astro`, `BlogCard.astro`. One component per file
  (`frontend-rules-typescript.md`).
- **`Props` interface** typed at the top of frontmatter, not inline — except
  for one or two trivial primitive props.
- **Route files are lowercase** (`index.astro`, `[slug].astro`, `rss.xml.ts`)
  — these map to URLs; casing affects the path.
- **Islands carry their framework suffix** (`SearchReact.tsx`,
  `CartVue.vue`) when you mix frameworks, to disambiguate at a glance. A
  single-framework app can drop the suffix.

### Styling — scoped `<style>`, global import, Tailwind v4 integration

- **Scoped by default** — a `<style>` block in an `.astro` component is scoped
  to that component (Astro rewrites class names). Use it for component-local CSS.
- **Global styles** — import a stylesheet once in the base layout
  (`import '../styles/global.css'`) or a layout's `<style is:global>`. Tailwind
  lives here.
- **Tailwind v4** — install via the Vite plugin, **not** `@astrojs/tailwind`:

  ```bash
  npx astro add tailwind       # adds @tailwindcss/vite + astro.config wiring
  ```
  ```css
  /* src/styles/global.css */
  @import "tailwindcss";

  @theme {
    --color-primary: oklch(0.5 0.2 250);
    --font-display: "Inter", sans-serif;
  }
  ```

  The `npx astro add tailwind` command wires `@tailwindcss/vite` into
  `astro.config.mjs` `vite.plugins`. v4 is CSS-first: no `tailwind.config.js`,
  theme tokens live in `@theme`.
- **`cn()`** helper for class merging, same pattern as the Next.js doc
  (`clsx` + `tailwind-merge`) — reuse it, don't reinvent.

### Data fetching — in frontmatter, server-side, zero JS shipped

```astro
---
// src/pages/products.astro
import type { Product } from '@/types/product';

const res = await fetch('https://api.example.com/products');
if (!res.ok) throw new Error('Failed to load products');
const products = (await res.json()) as Product[];
---
<ul>
  {products.map((p) => <li>{p.name}</li>)}
</ul>
```

- **Static output** (`output: 'static'`, default) — this `fetch` runs once at
  **build time** and the result is baked into HTML. No JS ships to the client.
- **SSR output** (`output: 'server'` + adapter) — the fetch runs per request.
  Use `Astro.response.headers` / caching headers to tune behavior.
- **Mixing** — set `export const prerender = true|false` per page to statically
  generate some routes while others render on-demand (Astro 5+ lets any page
  opt in/out regardless of the global `output`).
- **Caching** — on static output there's no per-request cache; on SSR set
  `Cache-Control` headers or use `experimental.svg`/adapter caching. For
  client-driven polling/mutations, hydrate an island and fetch from the browser
  (or call your own `/api` endpoint).

### Integrations — `astro add` writes them into `astro.config.mjs`

```bash
npx astro add react          # UI island framework
npx astro add mdx            # .mdx in Content Collections
npx astro add sitemap        # /sitemap-index.xml
npx astro add tailwind       # @tailwindcss/vite (Tailwind v4)
npx astro add vercel         # @astrojs/vercel adapter (SSR)
```

Each `astro add` installs the package and appends it to `integrations: []` in
`astro.config.mjs`. Adapters go in `adapter:`. Don't hand-edit `integrations`
blindly — `astro add` keeps versions and peer-deps consistent.

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import vercel from '@astrojs/vercel/serverless';

export default defineConfig({
  site: 'https://example.com',
  output: 'static',                 // default; or 'server'
  integrations: [react(), mdx(), sitemap()],
  vite: { plugins: [tailwindcss()] },
  // adapter: vercel(),             // required when output: 'server'
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'id'],
    routing: { prefixDefaultLocale: false },
  },
});
```

### Environment — `astro:env` (typed), `PUBLIC_` prefix, `import.meta.env`

Astro 5+ ships **`astro:env`** for typed, validated environment variables —
the recommended pattern, analogous to `@t3-oss/env-nextjs` in the Next.js doc:

```ts
// src/env.d.ts  (or astro:env schema via experimental flag)
/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />
```
```js
// astro.config.mjs — declare the schema
export default defineConfig({
  env: {
    schema: {
      API_URL: 'string',            // server-only by default
      PUBLIC_SITE_URL: 'string',    // PUBLIC_ prefix → exposed to client
    },
  },
});
```
```astro
---
import { API_URL } from 'astro:env/server';
import { PUBLIC_SITE_URL } from 'astro:env/client';

const res = await fetch(`${API_URL}/posts`);
---
<a href={PUBLIC_SITE_URL}>Home</a>
```

- **`PUBLIC_` prefix** — only values prefixed `PUBLIC_` are exposed to client
  code. Anything else stays server-only and throws if imported on the client.
- **`import.meta.env`** still works (Vite convention): `import.meta.env.SITE`,
  `import.meta.env.PROD`, `import.meta.env.DEV`, and any `PUBLIC_*` key.
- **Secrets** (`DATABASE_URL`, auth secrets, API keys) live in the platform's
  env (Vercel/Netlify/Cloudflare project settings, or the orchestrator), never
  in the repo. Ship `.env.example` with keys only.
- Astro loads `.env` automatically in dev; in prod the platform injects them.

## Key libraries

| Library | Purpose |
|---|---|
| `astro` | Framework: file routing, islands, Content Layer, SSR/SSG, image opt, `<ClientRouter />`, `astro:env`. |
| `@astrojs/react` / `@astrojs/vue` / `@astrojs/svelte` / `@astrojs/solid-js` / `@astrojs/preact` | UI island framework integrations (add the one(s) you use; React is the default). |
| `@astrojs/mdx` | MDX support inside Content Collections and pages. |
| `@tailwindcss/vite` | Tailwind v4 via Vite plugin (replaces deprecated `@astrojs/tailwind`). |
| `astro:content` (built-in) + `astro/loaders` | Content Collections v2: `defineCollection`, `getCollection`, `render()`, `glob()`/`file()` loaders. |
| `nanostores` + `@nanostores/react` (or `/vue`, `/preact`) | Cross-island reactive state, ~1 KB; Astro's official recommendation. |
| `@astrojs/sitemap` | Generates `/sitemap-index.xml` from routes. |
| `@astrojs/rss` | Builds an RSS/Atom feed endpoint (`src/pages/rss.xml.ts`). |
| `@astrojs/node` / `@astrojs/vercel` / `@astrojs/cloudflare` / `@astrojs/netlify` | SSR output adapters (Node self-host, Vercel, Cloudflare, Netlify). |
| `better-auth` (or Auth.js) | Auth for full-stack Astro; orbitkit uses better-auth. |
| `drizzle-orm` + `drizzle-kit` (or `@prisma/client` + `prisma`) | Type-safe SQL ORM + migrations (SSR/full-stack only). |
| `@sentry/astro` | Error/perf monitoring; auto-instruments pages, endpoints, server islands. |

Dev-only: `@astrojs/check` + `typescript` (powers `astro check`),
`eslint-plugin-astro` + `typescript-eslint` + `@eslint/js` (flat config),
`prettier` + `prettier-plugin-astro` (+ `prettier-plugin-tailwindcss`),
`vitest`, `@testing-library/react` (+ framework equivalents),
`@playwright/test`, `@types/*`.

## Dev commands

A modern pnpm + Astro 7 + Vitest + Tailwind v4 setup (modeled on AstroWind +
astro-paper + orbitkit):

```jsonc
// package.json "scripts"
{
  "dev": "astro dev",
  "build": "astro build",
  "preview": "astro preview",
  "check": "astro check",           // TS diagnostics for .astro + .ts
  "lint": "eslint .",
  "format": "prettier --write .",
  "typecheck": "astro check && tsc --noEmit",
  "test": "vitest run",
  "test:watch": "vitest",
  "test:e2e": "playwright test",
  "db:generate": "drizzle-kit generate",   // or prisma generate
  "db:migrate": "drizzle-kit migrate",     // or prisma migrate deploy
  "add": "astro add",                      // add integrations: pnpm add react mdx sitemap
  "verify": "pnpm check && pnpm lint && pnpm test"
}
```

- **Local dev loop:** `pnpm create astro@latest` (scaffold, choose `basics` or
  `blog` template) → `pnpm install` → copy `.env.example` → `.env` →
  `pnpm dev`. Dev server runs on `http://localhost:4321`.
- **`astro add <integration>`** auto-installs and wires integrations into
  `astro.config.mjs`; use it instead of hand-editing (keeps peer-deps happy).
- **`astro check`** runs `@astrojs/check` for type diagnostics across `.astro`
  and `.ts` files — run it in CI before `build`. `astro build` does not fail on
  type errors by default, so wire `check` into your `verify` script.
- **Content Collections** are regenerated on `astro dev`/`build`; types land in
  `.astro/types.d.ts` and `.content-types/` (gitignore both).

## Deployment notes

**Static (default).** With `output: 'static'` (the default) and no adapter,
`astro build` emits a fully static site to `dist/`. Deploy it to any static
host — Vercel, Netlify, Cloudflare Pages, GitHub Pages, S3+CloudFront, or an
nginx box serving `dist/`. This is the model for content sites (blogs, docs,
marketing) and most Astro apps: zero server runtime, cheapest to host.

**SSR with an adapter.** For dynamic routes, auth, DB access, or server
islands, set `output: 'server'` (or per-page `export const prerender = false`)
and add an adapter:

| Adapter | `npx astro add …` | Deploys to |
|---|---|---|
| `@astrojs/node` | `node` | Self-host (Docker, VPS) — `node ./dist/server/entry.mjs` behind nginx/traefik. |
| `@astrojs/vercel` | `vercel` | Vercel serverless/edge functions; zero-config on push. |
| `@astrojs/cloudflare` | `cloudflare` | Cloudflare Pages/Workers. |
| `@astrojs/netlify` | `netlify` | Netlify functions. |

```js
// astro.config.mjs — SSR on Vercel
import vercel from '@astrojs/vercel/serverless';
export default defineConfig({
  output: 'server',
  adapter: vercel(),
});
```

**Hybrid rendering.** Astro 5+ lets any page opt in/out of prerendering with
`export const prerender = true|false` regardless of the global `output` setting.
The common shape: `output: 'server'` globally, with most marketing/blog pages
`prerender = true` and a few dynamic routes (`/api/*`, dashboard) rendering on
request. You get static performance where you can and SSR where you need it.

**Node runtime (self-host).** With `@astrojs/node`, build then run the server:
```bash
pnpm build
node ./dist/server/entry.mjs      # listens on $PORT (default 4321)
```
Pin `NODE_ENV=production`, run behind a reverse proxy for TLS/gzip, and run DB
migrations **once per deploy** in a release job — not lazily on first request.

**Image & font optimization.** Use Astro's built-in `<Image>` (from
`astro:assets`) for responsive `srcset`/AVIF/WebP — never raw `<img>` for
content images. For local fonts, place files in `src/assets/` or
`public/fonts/` and `@font-face` them in `global.css`; Astro respects
`font-display: swap` to avoid layout shift.

**Production hygiene:**
- **Set `site` in `astro.config.mjs`** — `@astrojs/sitemap`, RSS, canonical
  URLs, and OG image generation all read it. Omitting it produces broken
  absolute URLs in production.
- **`astro check` in CI** — `astro build` won't fail on type errors, so gate
  deploys on `astro check && tsc --noEmit`.
- **Content schema is a contract** — changing a Zod field in
  `src/content.config.ts` without migrating existing Markdown frontmatter
  will break `build`. Treat collection schemas like a DB migration.
- **`@astrojs/tailwind` is deprecated** — any starter still on it should be
  migrated to `@tailwindcss/vite`. Don't add `@astrojs/tailwind` to new code.
- **Secrets**: auth secrets, `DATABASE_URL`, API keys live in the platform's
  env, never in the repo. Only `PUBLIC_*` (and `astro:env` `client:` schema
  entries) are safe to expose to the browser.
- **Islands cost JS** — every `client:*` directive ships a framework runtime.
  Default to no directive; use `client:visible`/`client:idle` before
  `client:load`; use `client:only` only when SSR is impossible.
