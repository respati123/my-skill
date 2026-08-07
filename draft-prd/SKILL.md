---
name: draft-prd
description: Write a Product Requirements Document (PRD) for one feature, breaking an existing BRD down into user flows, UX requirements, and acceptance criteria. Trigger only when the user explicitly asks for a PRD — "draft a PRD", "buat PRD" — not on generic requests like "spec this feature" or "document this".
---

# Draft PRD

A BRD answers *why are we building this*. A PRD answers *what exactly are we building, screen by screen* — one level more concrete.

Always built on an existing BRD, and always **one feature per PRD**. A BRD bundling five features becomes five PRDs, each reviewable and shippable on its own.

Last in the chain: `interrogate` → `draft-brd` → `lexicon` → **`draft-prd`** — looping back to `lexicon` whenever a new term surfaces.

## Workflow

### 1. Find the linked BRD

Look in `docs/brd/`. If the user names one, confirm the file.

If none matches, **stop and say so.** Offer `draft-brd` — or, if the intent was really "just spec this thing", ask rather than improvising. Without a BRD there is no goal or scope to hold this PRD accountable to, and a PRD accountable to nothing is a wish list.

### 2. Pick the one feature

If the BRD already scopes a single feature, confirm in one line and move on.

If it bundles several, list every one as an option and ask which to draft now — `AskUserQuestion`, single-select. Don't draft them all in one pass; the rest stay available for another invocation.

### 3. Ground it in something real

A PRD describing a flow that nothing can support is just a second round of back-and-forth during implementation. What grounds it depends on what already exists:

**Code exists** — read this repo, not the web; the BRD already settled the external context.
- Similar existing features (routes, components, UI patterns) so you follow conventions instead of inventing them.
- Existing endpoints and data model touching this area.
- The project's coding rules — `coding-principles` always, plus
  `backend-rules-typescript` (+ `hono`) and/or `frontend-rules-typescript`
  by label. They live at `setup/references/rules/`, same ones
  `implement-issue` loads, so this PRD doesn't ask for something those rules
  forbid.

**Greenfield — no code yet** — read the domain model instead: `CONTEXT.md` / `CONTEXT-MAP.md` and `docs/adr/` from `lexicon`. Entity names, boundaries, and relationships play the role the codebase would.

If neither exists, **stop.** Run `lexicon` first. A greenfield PRD written with no vocabulary locked down will contradict the next PRD, and you won't find out until both are built.

**When the BRD asks for something the ground can't support** — missing data, incompatible model — don't quietly redesign the feature around it. Put it in Open Questions with the options (extend the model vs. narrow the feature) and let the user decide. It may mean revising the BRD, not the PRD.

### 4. Interview for the gaps

Mine anything the user pasted first — notes, sketches, a brief. Don't re-ask what they already answer.

Cross-check [the template](references/prd-template.md) against what the BRD, step 3, and pasted material already cover. Ask only what's open, in one batch. Gaps worth asking explicitly:

- The happy-path flow, step by step, if the BRD leaves it implicit
- Which edge cases and error states actually matter here — ask, don't invent a generic list
- What's out of scope for *this* PRD, which can narrow further than the BRD's
- Any UX decision the project's design system doesn't already settle
- **Non-functional requirements that genuinely apply** — a real performance target, an authorization rule, an accessibility need. Ask only where a concrete bar exists; everything else gets `N/A — [why]`. The implementer builds only what's written and QA verifies only what's written.
- **Instrumentation** — if the BRD's metric is a real outcome, which event(s) must this feature emit so the metric is measurable? Skip for table-stakes features with no measured outcome.

Where the BRD or step 3 already answers something, state it as an assumption instead of asking: "Following the existing transaction-row pattern for this list — flag if it needs a different layout."

**New domain terms and entities go back to the model, not into this PRD.** When the interview surfaces a term `CONTEXT.md` doesn't define — or uses a defined term to mean something else, or needs an entity or relationship the `## Model` diagram doesn't have — run `lexicon` and resolve it there, before writing any requirement that leans on it. A definition or a box that lives only in this PRD is invisible to the next one, and the two will drift.

Nearly every feature touches the data model, so treat "no entity change" as a claim to verify, not a default to assume.

For a feature with a **frontend surface**, the design isn't settled in prose here. Run `impeccable shape` to produce a confirmed design brief and fill the template's Design / Prototype field, so the implementer builds against a concrete target rather than this document's adjectives. Backend-only features leave it `N/A`.

**Done when** every template section is either answered by steps 1–3 or in the batch you put to the user, **and** every domain term this PRD will use is defined in `CONTEXT.md`. Walk the template section by section — one you never checked is one you will guess at in step 5.

### 5. Draft

Fill [references/prd-template.md](references/prd-template.md).

Acceptance criteria are testable statements, not prose — someone should check each one off during QA without interpreting intent. Number functional detail against the BRD's requirement IDs where the link is direct (BRD FR-2 → FR-2.1, FR-2.2) so traceability back to the business justification survives.

**Done when** every section holds real content or an explicit `N/A — [why]`, **and** every BRD requirement in this feature's scope maps to at least one FR here, **and** every FR here traces back to a BRD requirement (no orphan FRs — an FR with no BRD parent is scope drift; flag it in Open Questions rather than silently expanding scope), **and** every FR appears in at least one acceptance criterion, **and** every entity change listed under Data & API Impact already exists in the `## Model` diagram. A requirement with no criterion is a requirement QA will not check; an entity change in a PRD but not in the model is a table the next PRD won't know about.

### 6. Save and iterate

Save to `docs/prd/<slug>.md` — same base slug as the BRD, plus the feature name when the BRD covers more than one. Point the user at the file and ask what to change. The person implementing against this document is the real reviewer. After `draft-tickets` creates issues, come back and fill the PRD's `## Implementation` section with the sub-issue numbers — the link must be two-way, or a future reader finds the issues but not the spec they implement.

## Next

Never end on "saved" and stop. Once the PRD lands, put the next step to the user — reply with one:

1. **Lanjut — next PRD, or `/draft-tickets`** (Recommended). If features remain in the BRD's `## Features` list without a PRD, draft the next one (`/draft-prd`). If every feature has a PRD, break them into issues with `/draft-tickets`.
2. **Diskusi / revisi** — refine this PRD first; say what's off and I'll edit in place, then re-offer.
3. **Berhenti** — leave here. Resume later with `/relay` (detects how many PRDs exist vs the BRD's feature count and offers the next step), or run `/draft-tickets` directly.

Mid-discussion, keep discussing — don't force the menu. Offer it again only when the discussion lands or the PRD is updated.
