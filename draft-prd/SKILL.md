---
name: draft-prd
description: Write a Product Requirements Document (PRD) for one feature, breaking an existing BRD down into 7 sections — Overview, Requirements, Core Features, User Flow, Architecture, Database Schema, Design and Technical Constraints. Grills the user section-by-section. Trigger only when the user explicitly asks for a PRD — "draft a PRD", "buat PRD" — not on generic requests like "spec this feature" or "document this".
---

# Draft PRD

A BRD answers *why are we building this*. A PRD answers *what exactly are we
building, screen by screen and table by table* — one level more concrete.

Always built on an existing BRD, and always **one feature per PRD**. A BRD
bundling five features becomes five PRDs, each reviewable and shippable on its
own.

Last in the spec chain: `interrogate` → `draft-brd` → `lexicon` →
**`draft-prd`** → `stack` → `draft-tickets` — looping back to `lexicon`
whenever a new term surfaces.

## Workflow

### 1. Find the linked BRD

Look in `docs/brd/`. If the user names one, confirm the file.

If none matches, **stop and say so.** Offer `draft-brd` — or, if the intent
was really "just spec this thing", ask rather than improvising. Without a BRD
there is no goal or scope to hold this PRD accountable to, and a PRD
accountable to nothing is a wish list.

### 2. Pick the one feature

If the BRD already scopes a single feature, confirm in one line and move on.

If it bundles several, list every one as an option and ask which to draft now
— `AskUserQuestion`, single-select. Don't draft them all in one pass; the rest
stay available for another invocation.

### 3. Ground it in something real

A PRD describing a flow that nothing can support is just a second round of
back-and-forth during implementation. What grounds it depends on what already
exists:

**Code exists** — read this repo, not the web; the BRD already settled the
external context.
- Similar existing features (routes, components, UI patterns) so you follow
  conventions instead of inventing them.
- Existing endpoints and data model touching this area.
- The project's coding rules — `coding-principles` always, plus
  `backend-rules-typescript` (+ `hono`) and/or `frontend-rules-typescript` by
  label, at `setup/references/rules/`. Same ones `implement-issue` loads, so
  this PRD doesn't ask for something those rules forbid.

**Greenfield — no code yet** — read the domain model instead: `CONTEXT.md` /
`CONTEXT-MAP.md` and `docs/adr/` from `lexicon`. Entity names, boundaries, and
relationships play the role the codebase would.

If neither exists, **stop.** Run `lexicon` first. A greenfield PRD written
with no vocabulary locked down will contradict the next PRD, and you won't
find out until both are built.

**When the BRD asks for something the ground can't support** — missing data,
incompatible model — don't quietly redesign the feature around it. Put it in
Open Questions with the options (extend the model vs. narrow the feature) and
let the user decide. It may mean revising the BRD, not the PRD.

### 4. Interview — section by section

The PRD has **seven sections**. Interview the user for each, in order. Mine
anything the user pasted first — notes, sketches, a brief — so you don't
re-ask what they already answered. For each section, state what the BRD + step
3 already settle as assumptions, then **ask only what's open**, in a batch per
section.

#### Section 1 — Overview
The user problem + the feature in one line each. Usually the BRD already
carries the problem; confirm it rather than re-ask. Ask only: who is the
primary user of this feature, and what's the one-sentence outcome they get?

#### Section 2 — Requirements
The testable behaviour + the non-functional bars + the acceptance checklist.
Grill the user on:
- **Functional requirements** — number each against the BRD (FR-2 → FR-2.1).
  Ask: which behaviours must this feature have to satisfy the BRD goal? For
  each, make it concrete enough to test.
- **Non-functional** — ask only where a real bar exists: a performance target,
  an authz rule, an accessibility need. Everything else gets `N/A — [why]`.
  Don't invent generic NFRs.
- **Analytics** — if the BRD's metric is a real outcome, which event(s) must
  this feature emit? Skip for table-stakes features with no measured outcome.
- **Acceptance criteria** — derive these from the FRs; each FR must appear in
  at least one criterion. Ask the user to confirm the bar, not to invent new
  ones.

#### Section 3 — Core Features
The feature list, framed as user outcomes. Ask: what are the distinct pieces
a user would name as "a feature"? For each, what does it do, for whom, why it
matters. If user stories add signal beyond the list, capture them here.

#### Section 4 — User Flow
The happy path + the edge cases. Grill:
- **Happy path** — step by step, the primary journey end-to-end. Ask the user
  to walk it; don't infer from the BRD.
- **Edge cases & error states** — ask *which ones actually matter here*, don't
  invent a generic list. Input invalid, resource not found, authz denied,
  partial data, concurrent edit — only the ones this feature can produce.

#### Section 5 — Architecture
The system view — which components touch it, what endpoints exist or are
needed, how data flows. Grill:
- **Components / modules** — which existing parts of the system does this
  touch? Name them; don't invent new ones unless the user confirms one is
  needed.
- **API / endpoints** — existing reused vs. new/changed. For each new one:
  method, path, one-line purpose.
- **Data flow** — how does a request move through the system? Ask if any
  queue, cache, or external service is in the path.
- **Rollout / rollback** — risky changes only (migration, feature flag,
  backfill). Plain additive → `N/A`.

#### Section 6 — Database Schema
Table-level detail. **Nearly every feature touches the data model**, so treat
"no entity change" as a claim to verify, not a default to assume. Grill:
- **Entities read / written** — names from `CONTEXT.md`.
- **Schema changes** — new entities, new relationships, or new fields. For
  each, list fields with types (nullable? default? index?) so a migration can
  be written from this alone.
- **Migration notes** — forward-only vs reversible, backfill needed, downtime.

**New domain terms and entities go back to the model, not into this PRD.**
When this section surfaces a term `CONTEXT.md` doesn't define — or uses a
defined term to mean something else, or needs an entity the `## Model` diagram
doesn't have — run `lexicon` and resolve it there before writing the
requirement that leans on it. A definition or a box that lives only in this
PRD is invisible to the next one, and the two will drift.

#### Section 7 — Design and Technical Constraints
The visual/UX target + the hard technical limits. Grill:
- **Design / UX** — states to cover (empty, loading, error, success, partial);
  existing patterns reused vs. genuinely new ones. For a feature with a
  **frontend surface**, run `impeccable shape` to produce a confirmed design
  brief and fill the Design field, so the implementer builds against a concrete
  target. Backend-only features → `N/A`.
- **Technical constraints** — hard limits the stack/rules/architecture impose.
  Pull from `setup/references/rules/` and `docs/architecture.md` (if it
  exists). Things the implementer cannot change.
- **Dependencies** — other features, APIs, or teams this needs before it can
  ship.

**Done when** every one of the seven sections is either answered by steps 1–3
or in the batch you put to the user, **and** every domain term this PRD will
use is defined in `CONTEXT.md`. Walk the seven sections in order — one you
never checked is one you will guess at in step 5.

### 5. Draft

Fill [references/prd-template.md](references/prd-template.md) — the seven
sections, in order, plus the meta sections (Open Questions, Out of Scope,
Assumptions, Implementation).

Acceptance criteria are testable statements, not prose — someone should check
each one off during QA without interpreting intent. Number functional detail
against the BRD's requirement IDs (BRD FR-2 → FR-2.1, FR-2.2) so traceability
back to the business justification survives.

**Done when** every section holds real content or an explicit `N/A — [why]`,
**and** every BRD requirement in this feature's scope maps to at least one FR
here, **and** every FR here traces back to a BRD requirement (no orphan FRs —
an FR with no BRD parent is scope drift; flag it in Open Questions rather than
silently expanding scope), **and** every FR appears in at least one acceptance
criterion, **and** every entity change listed under Database Schema already
exists in the `## Model` diagram. A requirement with no criterion is a
requirement QA will not check; an entity change in a PRD but not in the model
is a table the next PRD won't know about.

### 6. Save and iterate

Save to `docs/prd/<slug>.md` — same base slug as the BRD, plus the feature
name when the BRD covers more than one. Point the user at the file and ask
what to change. The person implementing against this document is the real
reviewer. After `draft-tickets` creates issues, come back and fill the PRD's
`## Implementation` section with the sub-issue numbers — the link must be
two-way, or a future reader finds the issues but not the spec they implement.

## Next

Never end on "saved" and stop. Once the PRD lands, put the next step to the
user — reply with one:

1. **Lanjut — `/stack`** (Recommended). Every feature now has a PRD — pin the
   tech stack next (topology → backend → frontend → mobile, driven by what the
   PRDs require). Once the stack is confirmed in `docs/architecture.md`,
   proceed to `/draft-tickets`. If `docs/architecture.md` already exists
   (`Status: Confirmed`), skip straight to `/draft-tickets`.
2. **Lanjut — next PRD** if features remain in the BRD's `## Features` list
   without a PRD. Draft the next one (`/draft-prd`) before stack/tickets — the
   stack grill reads all PRDs for infra signals.
3. **Diskusi / revisi** — refine this PRD first; say what's off and I'll edit
   in place, then re-offer.
4. **Berhenti** — leave here. Resume later with `/relay` (detects how many
   PRDs exist vs the BRD's feature count and offers the next step), or run
   `/stack` directly.

Mid-discussion, keep discussing — don't force the menu. Offer it again only
when the discussion lands or the PRD is updated.
