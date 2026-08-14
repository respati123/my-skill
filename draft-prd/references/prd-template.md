# PRD Template

Fill every section. If one genuinely doesn't apply, write "N/A — [why]"
instead of deleting it. The seven sections below are the structure; interview
the user section-by-section — don't fill them from guesses.

```markdown
# PRD: [Feature Name]

**Linked BRD:** [docs/brd/xxx.md] | **Status:** Draft | **Author:** [name]
**Date:** [YYYY-MM-DD] | **Version:** 0.1

## Overview

Problem first, then solution. One sentence on the user problem — link the BRD
rather than restating it — then one sentence on what this feature does and for
whom, phrased so a non-technical stakeholder could repeat it back correctly.

## Requirements

Everything the feature must do and be — functional behaviour, non-functional
bars, and testable acceptance criteria in one place.

### Functional Requirements
Numbered against the BRD where the link is direct (BRD FR-2 → FR-2.1):
- FR-2.1: [concrete, testable behaviour]

### Non-Functional Requirements
Pull the concrete bar from the project's rules; fill only what applies, `N/A
— [why]` for the rest.
- **Performance:** measurable targets that matter here, or `N/A — [why]`.
- **Security / authorization:** who may call or see this, authz rules, or `N/A
  — [why]`.
- **Accessibility:** keyboard nav, focus, labels, contrast, or `N/A — [why]`.
- **i18n:** new user-facing strings needing translation keys, or `N/A —
  [why]`.

### Analytics / Instrumentation
So the BRD's metric is measurable. Name the event(s) and the metric each feeds.
Table-stakes feature with no measured outcome → `N/A — [why]`.
- [event name] — fired when [action], feeds [metric from BRD]

### Acceptance Criteria
Testable checklist — verifiable without guessing intent. Tag each line with the
FR it verifies; every FR must appear at least once.
- [ ] (FR-2.1) ...

## Core Features

The feature list — what each piece does, phrased so the implementer knows what
to build without re-reading the BRD. Frame each as a user outcome, not an
implementation detail.

- **[Feature 1]** — what it does, for whom, why it matters.
- **[Feature 2]** — ...

Include the user stories here if they add signal beyond the feature list:
- As a [user type], I want to [action], so that [outcome].

## User Flow

Numbered happy path, not a wall of prose. Cover the primary journey end-to-end,
then list the meaningful edge cases/error states below.

### Happy Path
1. User does X
2. System responds with Y
3. ...

### Edge Cases & Error States
| Case | Expected behaviour |
|------|--------------------|
| (e.g. input invalid) | (e.g. 422 + field-level error) |

## Architecture

How the feature hangs together technically — which components touch it, what
endpoints exist or are needed, how data flows. This is the system view; the
table-level detail lives in Database Schema below.

### Components / Modules
Which existing parts of the system this feature touches (routes, services,
workers, UI modules) — name them, don't invent new ones unless necessary.

### API / Endpoints
- Existing reused: [method + path]
- New/changed: [method + path, one-line purpose]

### Data Flow
One paragraph or a short numbered list: how a request moves through the system
(client → API → service → DB → response), including any queue, cache, or
external service the flow hits.

### Rollout / Rollback
Risky changes only (schema migration, feature flag, backfill, phased release) —
how it ships safely and how to undo it. Plain additive feature → `N/A`.

## Database Schema

Table-level detail: entities read/written, new entities or fields, and the
migration shape. **Every entity change here must already exist in CONTEXT.md's
`## Model` diagram** before this PRD is done — write `none` only after
checking, not by default.

### Entities Touched
- **Read:** [names from CONTEXT.md]
- **Written:** [names from CONTEXT.md]

### Schema Changes
New entities, new relationships, or new fields on existing ones. For each,
list the fields with types so a migration can be written from this alone:
- **[Entity]** — new fields: `field_name: type` (nullable? default? index?)
- **[New Entity]** — full column list + relationships

### Migration Notes
Forward-only vs reversible, data backfill needed, downtime expectations.

## Design and Technical Constraints

The visual/UX target and the hard technical limits the implementer must
respect.

### Design / UX
- States to cover: empty, loading, error, success, partial data.
- Name the existing patterns/components reused rather than describing new
  ones, unless this feature genuinely needs one.
- **Design / Prototype:** link the confirmed `impeccable shape` design brief
  the implementer builds against — inline if compact (3–5 bullets), else save
  to `docs/design/<feature>.md` and link. `N/A` for backend-only features, or
  UI fully covered by existing conventions.

### Technical Constraints
Hard limits the project's stack, rules, or environment impose — things the
implementer cannot change and must build within. Pull from the coding rules
(`setup/references/rules/`) and the confirmed architecture
(`docs/architecture.md`).

### Dependencies
Other features, APIs, or teams this needs before it can ship.

---

## Open Questions
Decisions deferred to the user during the interview, with the options — extend
the model vs. narrow the feature, pick a library vs. build, etc.

## Out of Scope (for this PRD specifically)
Deliberately excluded from this feature, even if tempting to bundle in.

## Assumptions
Things the implementer will assume true unless told otherwise — stated
explicitly so a wrong assumption is a quick correction, not a rewrite.

## Implementation
Two-way link to the work that ships this PRD. Filled after `draft-tickets`
runs — record the parent issue and each sub-issue number (and the FR-id each
implements). Until then, leave `pending — run draft-tickets`.

- Parent issue: #
- Sub-issues: # — [FR-x.y]
```
