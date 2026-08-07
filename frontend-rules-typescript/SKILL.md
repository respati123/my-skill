---
name: frontend-rules-typescript
description: TypeScript/React frontend coding conventions for this workflow's coder role — types, component structure, props, state management, imports, comments, linting, testing. Auto-loaded for frontend-labelled TypeScript sub-issues; use when implementing or reviewing React/TypeScript UI code. Distinct from impeccable, which covers visual/design consistency, not code structure.
---

# Frontend Rules (TypeScript/React)

Conventions the `coder` role follows on any `frontend`-labelled TypeScript
sub-issue. Load this before writing or editing frontend code. This is about
**code structure**, not visual design — `impeccable` (DESIGN.md, visual
language) still applies on top of this, the two aren't a substitute for
each other.

## Types

No `any` — use a real type/interface, generics, or `unknown` with
narrowing. Shared types/interfaces live in their own files (e.g.
`types/user.ts`), not inlined next to every component that uses them;
a type used by exactly one component can stay colocated with it.

## Component structure

One component per file, named export, PascalCase filename matching the
component name. A component handling multiple unrelated concerns (data
fetching + form logic + layout, all in one file) is a split candidate —
extract sub-components or hooks rather than growing one file indefinitely.
Logic inside a component still follows `coding-principles`' general rules
(0-2 params, max 3 nesting levels) — this skill doesn't relax those.

## Props

Always a named, typed interface — `<ComponentName>Props` — not an inline
object type, except for a component with one or two trivial primitive
props. Optional props get a default, not a runtime `undefined` check
scattered through the body.

## MVVM: View / ViewModel separation

Every component with non-trivial logic splits into a **View** (the
component — rendering only) and a **ViewModel** (a custom hook owning the
logic, e.g. `useUserProfileViewModel()` for `UserProfile`).

- The ViewModel always returns exactly `{ states, handlers }`:
  - `states` — everything the view renders: local reducer state, data-
    endpoint results, and any state-management store slice the ViewModel
    consumes, merged into one flat object.
  - `handlers` — every user-interaction entry point (click, submit, change,
    ...). Every value under `handlers` is a function — nothing else belongs
    there.
- Internally, the ViewModel is **stateless business logic driven by a
  `useReducer`**, not scattered `useState` calls — state transitions go
  through reducer actions, not ad-hoc setters spread across the hook.
- **Data fetching** (the data endpoint/API call) lives inside the
  ViewModel — the component never calls a fetch/query hook directly.
- **State management** (a shared store, if the project uses one) is also
  read from and dispatched to inside the ViewModel, then folded into
  `states`/`handlers` — the component never talks to the store directly.
- The View receives `{ states, handlers }` and does nothing but render —
  no business logic, no data fetching, no reducer, no store access inside
  the component itself.
- Passing `states`/`handlers` down more than 2-3 levels to a nested
  presentational component that doesn't need the rest? Pass just the slice
  it needs, not the whole object — and past that depth, reconsider whether
  the nested component should own its own ViewModel instead of inheriting
  one from an ancestor.

## Imports

Absolute imports via the `@/*` alias — no `../../../` chains.

## Comments

None. If a name or structure needs a comment to be understood, rename or
restructure instead of explaining it.

## Linting & formatting

Biome for lint + format. Run it before handing off; fix everything it
flags.

## Testing

Component tests via Testing Library (React Testing Library), asserting on
rendered output and user-facing behavior — not implementation details
(internal state, private methods). Mock network calls at the boundary
(e.g. MSW) rather than mocking the data-fetching hook itself. A ViewModel's
reducer logic can be tested directly (pure function, no rendering needed)
separately from the component tests above.

## E2E testing

Cover critical user journeys end-to-end (login, checkout, the core flow a
feature exists for) — not implementation detail, and not every component
combination. One E2E test per critical journey is usually enough; resist
adding more just because a flow exists — that's what the component tests
above are for. Use Playwright unless the project already has a different
E2E harness in place; assert on user-visible outcomes (rendered text, URL,
visible state), never on internal implementation.

## No redundant components/hooks

Before writing a new component or hook, grep for one that already does
this — reuse or extend it instead of reimplementing.
