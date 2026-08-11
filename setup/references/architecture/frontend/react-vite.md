# React + Vite (Frontend SPA)

Reference for the `coder` role on any `frontend`-labelled TypeScript sub-issue
building a React single-page app with Vite. Distilled from the two highest-signal
production Vite + React boilerplates, then mapped to this repo's
`frontend-rules-typescript.md` and `coding-principles.md` (which win on any
conflict):

- [kriasoft/react-starter-kit](https://github.com/kriasoft/react-starter-kit) — React 19 SPA under `apps/app`. TanStack Router (file-based),
  TanStack Query, Tailwind v4, shadcn/ui, Vite, Vitest. The cleanest modern SPA
  config — its `vite.config.ts`, `lib/query.ts`, `lib/utils.ts`, and
  `components.json` are quoted below almost verbatim.
- [alan2207/bulletproof-react](https://github.com/alan2207/bulletproof-react) — the `apps/react-vite` target. React Router v7, TanStack Query,
  Zustand, Tailwind, shadcn-style Radix components, RHF + Zod, Vitest + Testing
  Library + Playwright + MSW + Storybook. The canonical **feature-based**
  folder layout; this doc's `src/` tree is its structure verbatim.
- [shadcn/ui](https://ui.shadcn.com) — the `components.json` contract (`style`,
  `baseColor`, `cssVariables`, `aliases`) and the `cn()` + `class-variance-authority`
  pattern are now the de facto standard across both boilerplates.

> "Recommended" below = *the modern TS default for a new SPA*. Tailwind v3 → v4
> is a real breaking change (CSS-first config, no `tailwind.config.js`); both
> 2024/25 boilerplates are now on v4, so pick v4 for new code. Existing v3
> projects — keep v3, don't rewrite without reason.

## Recommended stack components

| Layer | Recommended (new TS code) | Also common | Notes |
|---|---|---|---|
| Build tool | **Vite** (≥ 5; v6/v7 stable) | — | Vite is the dominant React bundler; CRA is dead. Vite 8 ships oxc-based `@vitejs/plugin-react` and native `tsconfigPaths`. |
| Framework | **React 19** | React 18 (LTS, still widespread) | React 19 = Actions, `use()`, RSC-ready. Both boilerplates pin 19. |
| Language | **TypeScript, `"strict": true`** | — | No `any` — see `frontend-rules-typescript.md`. |
| Router | **TanStack Router** (file-based, type-safe) or **React Router v7** | — | TanStack Router = generated route tree, typed params/search, `beforeLoad` guards (RSK). React Router = lower ceremony, config or file routes (bulletproof). Pick one per app. |
| Styling | **Tailwind CSS v4** | Tailwind v3 (legacy) | v4 = CSS-first config via `@import "tailwindcss"` + `@theme`; no JS config file. Installed via `@tailwindcss/vite` plugin, **not** PostCSS. |
| UI components | **shadcn/ui** (copy-in, Radix + CVA) | Mantine, MUI | shadcn is a generator (`npx shadcn add`), not a dependency. `new-york` style, `neutral` base, `cssVariables: true` is the 2024/25 default. |
| State — global | **Zustand** (hook store, no boilerplate) | Jotai (atomic, RSK's pick), Redux Toolkit (large apps) | Zustand = one `create()` call, no Provider, devtools built in. Jotai if you prefer atom-level composition. |
| State — local UI / theme | **React Context + `useState`** | — | Theme, locale, auth session wrapper — Context is fine; don't reach for Zustand for a single toggle. |
| Data fetching | **TanStack Query** (v5) | SWR, tRPC client | The cache IS the server state. RHF/Router/Q all compose with it. |
| Forms | **React Hook Form** + **Zod** (`@hookform/resolvers/zod`) | TanStack Form | RHF is uncontrolled = minimal re-renders. Zod schema is the single source of truth (drives both parse and TS type). |
| Linter | **ESLint** (`@eslint/js` + `typescript-eslint` + `eslint-plugin-react-hooks` + `eslint-plugin-import`) | Biome | ESLint is the React ecosystem default; both boilerplates use it. |
| Formatter | **Prettier** | Biome (lint+format in one) | If already on Biome for lint, use it for format too. |
| Test — unit/component | **Vitest** + **@testing-library/react** | Jest | Vitest = Vite-native, same config, ESM out of the box. happy-dom or jsdom as env. |
| Test — E2E | **Playwright** | Cypress | Playwright = multi-browser, faster, better traces. bulletproof ships it under `e2e/`. |
| Test — API mock | **MSW** (`msw`) | — | Intercept `fetch`/`xhr` at the service-worker layer; same handlers for component tests and dev. |
| Package manager | **pnpm** | npm, yarn, bun | pnpm = disk-efficient, strict, fast. RSK uses bun; bulletproof uses yarn. pnpm is the new-project default here. |

## Folder structure

The **feature-based** layout (bulletproof-react, verbatim under `apps/react-vite/src/`).
Group by *domain*, not by file-type — a feature's components, API calls, and
hooks live together so you can reason about one slice at a time:

```
src/
  main.tsx               # entry: createRoot, mount <App/>, import global styles
  App.tsx                # providers tree (Router → QueryClient → Theme → Outlet)
  app/                   # (optional) app-shell concerns when router is separate
    routes/              # route components / loaders (TanStack: generated tree lives here too)
  routes/                # OR TanStack file-routes: __root.tsx, (app)/, (auth)/ route groups
  components/
    ui/                  # shadcn primitives: button/, dialog/, dropdown/, form/  (one folder each)
    layouts/             # AppLayout, AuthLayout, DashboardLayout (shell chrome)
    errors/              # ErrorBoundary, NotFound, error-state fallbacks
  features/
    auth/
      api/               # get-session.ts, login.ts  (one async fn per endpoint)
      components/        # AuthForm, UserMenu
    users/
      api/               # get-users.ts, delete-user.ts, update-profile.ts
      components/        # UsersList, UpdateProfile, DeleteUser
    discussions/
      api/
      components/
  hooks/                 # cross-feature hooks: useDebounce, useMediaQuery
  lib/                   # framework wiring (singletons, clients, configs)
    api-client.ts        # axios instance w/ interceptors (or fetch wrapper)
    react-query.ts       # QueryClient + defaultOptions
    utils.ts             # cn() helper (re-exported from shadcn)
    errors.ts            # getErrorMessage(), isUnauthenticatedError()
  config/
    env.ts               # Zod-validated VITE_ env → typed `env` singleton
    paths.ts             # typed route path helpers (React Router typegen)
  store/                 # Zustand stores: useAuthStore, useUIStore  (one file per slice)
  types/                 # shared domain DTOs: user.ts, common.ts (Pagination<T>, ApiEnvelope<T>)
  utils/                 # pure helpers: cn.ts, format.ts, storage.ts
  assets/                # images, fonts, svg (or public/ for unserved-by-bundler assets)
  styles/
    globals.css          # @import "tailwindcss"; @theme {}; :root + .dark CSS variables
  testing/               # setup-tests.ts, mocks/ (MSW handlers)
e2e/                     # Playwright tests (outside src/)
public/                  # served as-is: favicon, robots.txt, _redirects, _headers
```

Notes:
- **`components/ui/`** = generic, app-agnostic primitives (shadcn output). **`features/<x>/components/`** = composed, domain-specific. Never import a feature component into `components/ui/` — the dependency direction is features → ui, never the reverse.
- **`lib/` vs `utils/`** — `lib/` = framework wiring that holds state/side-effects (clients, configs, singletons); `utils/` = pure functions (`cn`, `formatDate`). bulletproof keeps both; RSK collapses into `lib/`. Pick one and stay consistent.
- **`store/` (Zustand)** — one store per slice (`auth`, `ui`), not one god-store. Each is a single `create()` call in its own file.
- **`types/`** — mirror the backend's response DTOs; do **not** hand-write types the API already returns (tRPC / OpenAPI codegen does this for you).

## Conventions

### Import style — absolute via `@/*`

This repo mandates absolute imports via the `@/*` alias; no `../../../`
chains (`frontend-rules-typescript.md`). Configured in two places:

```jsonc
// tsconfig.json
{ "compilerOptions": {
    "baseUrl": ".",
    "paths": { "@/*": ["src/*"] }
}}
```

```ts
// vite.config.ts — Vite resolves the alias at dev + build time
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": "/src" },
    // Vite 8+ alternative: native tsconfig paths, no plugin needed
    // tsconfigPaths: true,
  },
});
```

`@vitejs/plugin-react` + the alias is the bulletproof setup. Vite 8 (RSK) can
drop the alias and use `resolve.tsconfigPaths: true` natively — pick whichever
your Vite version supports.

### Component naming — PascalCase, feature-scoped, one component per file

- **Files**: PascalCase matching the default export — `UserMenu.tsx` exports
  `UserMenu`. `kebab-case.tsx` only for non-component modules (`api-client.ts`).
- **One component per file** (repo rule); colocate tests as
  `__tests__/UserMenu.test.tsx` next to it (bulletproof) or `*.test.tsx`
  alongside (RSK). Pick one convention per repo.
- **Props interface** named `<Component>Props`, exported alongside the component
  only if reused; otherwise inline. shadcn primitives use CVA variants:
  ```ts
  // components/ui/button/button.tsx — shadcn pattern
  const buttonVariants = cva("inline-flex items-center justify-center", {
    variants: {
      variant: { default: "bg-primary text-primary-foreground", ... },
      size: { default: "h-9 px-4 py-2", sm: "h-8 px-3", lg: "h-10 px-8" },
    },
    defaultVariants: { variant: "default", size: "default" },
  });
  export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
      VariantProps<typeof buttonVariants> {}
  ```

### Hook naming — `use*` prefix, return tuple or object

- Every custom hook starts with `use` and lives in `hooks/` (global) or
  `features/<x>/hooks/` (scoped). bulletproof colocates `__tests__/` per hook.
- Return a **tuple** `[value, setter]` when there's an obvious pair (à la
  `useState`); return an **object** when there are 3+ fields. Be consistent.

### State pattern — Zustand vs Context vs `useState`

| Need | Use | Example |
|---|---|---|
| One component's local toggle/form value | `useState` | `const [open, setOpen] = useState(false)` |
| Cross-tree value that rarely changes + Provider is fine | **React Context** | `<ThemeProvider>`, `<AuthProvider>` wrapping `<QueryClientProvider>`, locale, current user from session |
| Global mutable store read by many components, updated often, no Provider wanted | **Zustand** | auth tokens, UI prefs (sidebar collapsed), notifications queue, theme state accessed outside React (interceptors) |
| Derived/atomic state with lots of interdependencies | Jotai | RSK's pick; reach for it if Zustand stores become entangled |

```ts
// store/useAuthStore.ts — Zustand
import { create } from "zustand";

interface AuthState {
  token: string | null;
  setToken: (t: string | null) => void;
  logout: () => void;
}
export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  setToken: (token) => set({ token }),
  logout: () => set({ token: null }),
}));

// read outside React (in an axios interceptor) — no hook needed:
// const { token } = useAuthStore.getState();
```

- **Don't put server state in Zustand/Context.** That's TanStack Query's job.
  The cache is the source of truth for anything fetched from the API.
- **Context for providers, Zustand for stores**: wrap the app in
  `<QueryClientProvider>` + `<ThemeProvider>` (Context); read auth/UI flags from
  Zustand hooks. This is the bulletproof split.

### Routing — file-based (TanStack Router) or config-based (React Router)

**TanStack Router** (RSK) — one file per route under `routes/`, route tree is
**generated** to `lib/routeTree.gen.ts` by `@tanstack/router-plugin/vite`:

```ts
// routes/(app)/route.tsx — layout route w/ auth guard
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { sessionQueryOptions } from "@/lib/queries/session";

export const Route = createFileRoute("/(app)")({
  beforeLoad: async ({ context, location }) => {
    const session = await context.queryClient.fetchQuery(sessionQueryOptions());
    if (!session?.user) throw redirect({ to: "/login", search: { returnTo: location.href } });
    return { user: session.user };
  },
  component: () => <Outlet />,
});
```

```ts
// vite.config.ts — the plugin
import { tanstackRouter } from "@tanstack/router-plugin/vite";
export default defineConfig({
  plugins: [
    tanstackRouter({
      routesDirectory: "./routes",
      generatedRouteTree: "./lib/routeTree.gen.ts",
      autoCodeSplitting: true,
    }),
    react(),
  ],
});
```

**React Router v7** (bulletproof) — routes declared in `app/routes/`, typegen
emits `paths.ts`. Lower ceremony, no codegen step for basic apps.

Both support **route groups** `(app)/`, `(auth)/` to group layouts without
affecting the URL. Use them to attach layout chrome + guards per section.

### Styling — Tailwind v4 (CSS-first) + `cn()` helper

Tailwind v4 has **no `tailwind.config.js`**. Config lives in CSS:

```css
/* styles/globals.css — Tailwind v4 (RSK verbatim, trimmed) */
@import "tailwindcss";
@import "tw-animate-css"; /* enter/exit utilities shadcn dialogs/selects need */

@source "./lib/**/*.{ts,tsx}";
@source "./routes/**/*.{ts,tsx}";
@source "./components/**/*.{ts,tsx}";

@custom-variant dark (&:is(.dark *));   /* class-based dark mode */

@theme inline {
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
}

:root {
  --radius: 0.625rem;
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  /* ...full shadcn neutral palette... */
}
.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
}
```

Installed via the Vite plugin (not PostCSS in v4):
```ts
// vite.config.ts
import tailwindcss from "@tailwindcss/vite";
export default defineConfig({ plugins: [tailwindcss(), react()] });
```

The `cn()` helper merges Tailwind classes (later wins, conflict-aware):

```ts
// lib/utils.ts (or utils/cn.ts) — bulletproof verbatim
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

```json
// components.json — shadcn/ui config (RSK's values)
{
  "style": "new-york",
  "rsc": false,
  "tsx": true,
  "tailwind": { "css": "styles/globals.css", "baseColor": "neutral", "cssVariables": true },
  "aliases": {
    "components": "@/components",
    "ui": "@/components/ui",
    "utils": "@/lib/utils",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "iconLibrary": "lucide"
}
```

- Add components with `pnpm dlx shadcn@latest add button dialog` — they land in
  `src/components/ui/`. They are **yours to edit**, not a black-box dependency.
- `"rsc": false` for a Vite SPA (no React Server Components). Flip to `true`
  only if you migrate to Next.js/Remix SSR.

### API layer — one client, one fn per endpoint, features own their calls

A single configured HTTP client (axios or `fetch` wrapper) in `lib/`, with one
async function per endpoint living next to the feature that calls it:

```ts
// lib/api-client.ts — bulletproof verbatim
import Axios, { type InternalAxiosRequestConfig } from "axios";
import { env } from "@/config/env";
import { paths } from "@/config/paths";

export const api = Axios.create({ baseURL: env.API_URL });
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (config.headers) config.headers.Accept = "application/json";
  config.withCredentials = true;
  return config;
});
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      window.location.href = paths.auth.login.getHref(window.location.pathname);
    }
    return Promise.reject(error);
  },
);
```

```ts
// features/users/api/get-users.ts
import { api } from "@/lib/api-client";
import type { User } from "@/types/user";

export const getUsers = async (): Promise<User[]> => {
  const { data } = await api.get("/users");
  return data;
};
```

Then expose it through TanStack Query — never call `getUsers()` directly in a
component; wrap it in a hook:

```ts
// features/users/api/use-users.ts
import { useQuery } from "@tanstack/react-query";
import { getUsers } from "./get-users";
import { queryConfig } from "@/lib/react-query";

export const useUsers = () =>
  useQuery({ queryKey: ["users"], queryFn: getUsers, ...queryConfig.queries });
```

**tRPC alternative** (RSK): if the backend is also TypeScript, skip the REST
client + hand-written types entirely — `@trpc/client` + `@trpc/tanstack-react-query`
give end-to-end types from router definition to component. The `lib/trpc.ts`
singleton wires `httpBatchLink` with `credentials: "include"`.

### Error handling — error boundaries + query error states + typed error helpers

Three layers, each owning a different failure mode:

**1. React error boundaries** — catch render/lifecycle crashes that `try/catch`
can't. Wrap the app root (and auth-gated layouts) in one:

```tsx
// components/errors/ErrorBoundary.tsx — react-error-boundary
import { ErrorBoundary } from "react-error-boundary";
export function AppErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback} onError={logError}>
      {children}
    </ErrorBoundary>
  );
}
```

**2. TanStack Query error states** — render per-query `isError`/`error` in the
component, or set `throwOnError` on a boundary query to let it bubble. The
`lib/react-query.ts` defaults (RSK) balance freshness vs. resilience:

```ts
// lib/react-query.ts — RSK defaults
import { QueryClient } from "@tanstack/react-query";
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60 * 1000,          // fresh for 2 min
      gcTime: 5 * 60 * 1000,             // GC after 5 min
      retry: 3,
      retryDelay: (i) => Math.min(1000 * 2 ** i, 30000), // exp backoff, cap 30s
      refetchOnWindowFocus: true,
      refetchOnReconnect: "always",
    },
    mutations: { retry: 1, retryDelay: 1000, onError: (e) => console.error(e) },
  },
});
```

**3. Typed error helpers** — normalize the zoo of error shapes (fetch `Response`,
axios `error.response`, tRPC `data.code`) into one consistent API:

```ts
// lib/errors.ts — RSK verbatim (trimmed)
export function getErrorStatus(error: unknown): number | undefined {
  if (!error || typeof error !== "object") return undefined;
  const err = error as Record<string, unknown>;
  if (typeof err.status === "number") return err.status;           // tRPC
  if (err.response && typeof (err.response as any).status === "number")
    return (err.response as any).status;                            // axios
  return undefined;
}
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "An unexpected error occurred";
}
export function isUnauthenticatedError(error: unknown): boolean {
  return getErrorStatus(error) === 401;
}
```

The **axios interceptor** (above) handles the cross-cutting 401 → redirect once,
so individual query hooks don't repeat it.

### Environment — `VITE_` prefix, Zod-validated at boot, one typed singleton

Vite only exposes env vars prefixed `VITE_` to client code (and **everything in
`VITE_*` is shipped to the browser** — never put secrets there). Validate at
load time, fail fast, then import a typed `env` everywhere — no scattered
`import.meta.env.X` reads:

```ts
// config/env.ts — bulletproof verbatim (prefix VITE_APP_)
import { z } from "zod";

const EnvSchema = z.object({
  API_URL: z.string().url(),
  ENABLE_API_MOCKING: z
    .string()
    .refine((s) => s === "true" || s === "false")
    .transform((s) => s === "true")
    .optional(),
});

const envVars = Object.entries(import.meta.env).reduce<Record<string, string>>(
  (acc, [key, value]) => {
    if (key.startsWith("VITE_APP_")) acc[key.replace("VITE_APP_", "")] = value as string;
    return acc;
  },
  {},
);

const parsed = EnvSchema.safeParse(envVars);
if (!parsed.success) {
  throw new Error(
    `Invalid env:\n${Object.entries(parsed.error.flatten().fieldErrors)
      .map(([k, v]) => `- ${k}: ${v}`)
      .join("\n")}`,
  );
}
export const env = parsed.data;
```

```bash
# .env.example — committed, no secrets; prefix MUST be VITE_ (or VITE_APP_)
VITE_APP_API_URL=http://localhost:3000/api
VITE_APP_ENABLE_API_MOCKING=true
```

- **`.env` never committed**; ship `.env.example` with keys and sample values.
- `.env.local` overrides `.env`; `.env.development` / `.env.production` are
  picked by Vite per `mode`. `VITE_API_URL` (RSK) or `VITE_APP_API_URL`
  (bulletproof) — pick one prefix and be consistent across the repo.

### Dev server proxy — forward `/api` to the backend in dev

Avoid CORS pain in development by proxying the API in Vite's dev server, so the
SPA and API share an origin locally:

```ts
// vite.config.ts
export default defineConfig({
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
});
```

In production, set the real `VITE_APP_API_URL` and let the host handle CORS
(allowlist the deployed origin on the backend).

## Key libraries

| Library | Purpose |
|---|---|
| `react` / `react-dom` | UI runtime (v19). |
| `@tanstack/react-router` | Type-safe, file-based router with codegen route tree + `beforeLoad` guards (RSK). |
| `react-router` (v7) | Router alternative — config or file routes, typed `paths` (bulletproof). |
| `@tanstack/react-query` (+ `@tanstack/react-query-devtools`) | Server-state cache: queries, mutations, retries, background refetch. |
| `@trpc/client` + `@trpc/tanstack-react-query` | End-to-end types when the backend is tRPC (replaces REST client + hand-written types). Optional. |
| `tailwindcss` (v4) + `@tailwindcss/vite` | Utility-first CSS; v4 installed via the Vite plugin, CSS-first config. |
| `tailwind-merge` + `clsx` | The `cn()` helper — conflict-aware class merge + conditional classes. |
| `class-variance-authority` (CVA) | Type-safe component variants — how every shadcn primitive is built. |
| `lucide-react` | Icon set (shadcn default `iconLibrary`). |
| `@radix-ui/react-*` | Headless, accessible primitives underpinning shadcn components (dialog, select, dropdown, etc.). |
| `zustand` | Global client state — hook store, no Provider. (Or `jotai` for atomic state.) |
| `react-hook-form` + `@hookform/resolvers` | Performant, uncontrolled forms; `zodResolver(schema)` wires Zod. |
| `zod` | Schema-first validation for forms, env config, and (tRPC) API contracts. `z.infer` feeds TS types. |
| `react-error-boundary` | Declarative error boundaries for render-time crashes. |
| `axios` | HTTP client with interceptors (or a `fetch` wrapper — both boilerplates' choice is axios). |
| `dayjs` | Small date formatting (bulletproof). `date-fns` is the other common pick. |

Dev-only: `vite`, `@vitejs/plugin-react`, `@tanstack/router-plugin` (if TanStack
Router), `vitest`, `@testing-library/react` (+ `jest-dom`, `user-event`),
`happy-dom` or `jsdom`, `@playwright/test`, `msw` (+ `@mswjs/data`),
`eslint`, `typescript-eslint`, `eslint-plugin-react-hooks`, `eslint-plugin-import`,
`eslint-plugin-jsx-a11y`, `prettier`, `eslint-config-prettier`,
`husky` + `lint-staged`. Optional: `storybook` + `@storybook/react-vite`.

## Dev commands

A modern pnpm + Vite + Vitest + Playwright SPA:

```jsonc
// package.json "scripts"
{
  "dev": "vite",
  "build": "tsc --noEmit && vite build",
  "preview": "vite preview",
  "lint": "eslint src --ignore-path .gitignore",
  "format": "prettier --write \"src/**/*.{ts,tsx,css}\"",
  "typecheck": "tsc --noEmit --pretty",
  "test": "vitest",
  "test:run": "vitest run",
  "test:e2e": "playwright test",
  "ui:add": "pnpm dlx shadcn@latest add",
  "storybook": "storybook dev -p 6006",
  "prepare": "husky"
}
```

- **Local dev loop:** `pnpm create vite@latest app --template react-ts` →
  `cd app && pnpm install` → copy `.env.example` → `.env` → `pnpm dev`.
  Then add the stack: `pnpm add @tanstack/react-query react-router zustand
  react-hook-form @hookform/resolvers zod axios tailwind-merge clsx
  class-variance-authority lucide-react` and `pnpm dlx shadcn@latest init`.
- **Build = `tsc --noEmit` (typecheck gate) + `vite build`** (emit to `dist/`).
  Vite handles the path alias; no `tsc-alias` step needed (unlike the backend,
  Vite resolves `@/*` at bundle time).
- **`tsc --noEmit`, not `tsc` emit** — Vite uses esbuild/rolldown to transpile;
  `tsc` is only the type checker. Running `tsc` without `--noEmit` would
  produce unused JS files next to the Vite output.

## Deployment notes

**Static hosting (primary).** Vite emits a static bundle to `dist/` — host it
on Vercel, Netlify, Cloudflare Pages, or any static CDN + S3 bucket. No Node
runtime needed in production.

- **SPA fallback (BLOCKING).** Client-side routing breaks on deep links /
  refresh unless every non-asset route returns `index.html`. Configure it per host:
  - **Vercel** / **Netlify**: add `public/_redirects` (`/* /index.html 200`)
    or `vercel.json` `rewrites: [{ source: "/(.*)", destination: "/index.html" }]`.
  - **Cloudflare Pages**: set "SPA" / a catch-all `/* → /index.html` rewrite in
    `_redirects` or `_headers`.
  - **nginx**: `try_files $uri $uri/ /index.html;` in the server block.
- **Asset hashing.** Vite names outputs `[name]-[hash].js` — cache the hashed
  assets for a year (`Cache-Control: public, max-age=31536000, immutable`),
  never cache `index.html` (it references the latest hashes).
- **Base path.** `vite build --base=/app/` if served from a subpath; RSK sets
  `base: './'` for portability. Default `/` for root-hosted apps.
- **Env at build time.** `VITE_*` vars are **inlined at build**, not runtime.
  For per-environment values, build once per target (`--mode staging` reads
  `.env.staging`) or inject placeholders and replace at deploy (Vercel/Netlify
  do this automatically for their env settings on the build).
- **Code-splitting.** Vite splits per dynamic `import()` and route automatically
  (TanStack Router's `autoCodeSplitting: true`). For manual vendor chunks, use
  `build.rolldownOptions.output.codeSplitting.groups` (Vite 8, RSK) or
  `rollupOptions.output.manualChunks` (Vite ≤ 7) to split `react`, `tanstack`,
  `vendor-ui` into stable long-term-cached chunks.
- **Cloudflare Workers edge (RSK).** For edge-deploy, wrap the built assets in
  a Worker (`wrangler deploy`) that serves static assets + SPA fallback; the
  same `dist/` powers both the CDN and the Worker.
- **Size budget.** Set `build.chunkSizeWarningLimit` and run
  `pnpm dlx vite-bundle-visualizer` before ship. Flag any vendor chunk > ~200kB
  gzipped — React + Router + Query + a Radix subset should fit comfortably under.

**Hygiene:**
- `strict` TypeScript + `eslint-plugin-react-hooks` (exhaustive-deps, rules of
  hooks) in CI — both catch the bugs that crash SPAs.
- Lighthouse CI or `@lhci/cli` on the preview deploy for perf/a11y budgets.
- MSW in tests + (optionally) dev so the frontend builds against a stable
  contract before the backend exists.
