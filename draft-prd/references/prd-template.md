# PRD Template

Fill every section. If one genuinely doesn't apply, write "N/A — [why]" instead of deleting it.

```markdown
# PRD: [Feature Name]

**Linked BRD:** [docs/brd/xxx.md] | **Status:** Draft | **Author:** [name]
**Date:** [YYYY-MM-DD] | **Version:** 0.1

## Overview
Problem first, then solution. One sentence on the user problem — link the BRD
rather than restating it — then one sentence on what this feature does and for
whom, phrased so a non-technical stakeholder could repeat it back correctly.

## Goal (tied to BRD)
Which BRD goal/metric this feature moves, and how. If it doesn't clearly tie
back to one, flag that as an open question rather than quietly omitting it.

## User Stories
- As a [user type], I want to [action], so that [outcome].

## User Flow
Numbered happy path, not a wall of prose:
1. User does X
2. System responds with Y

## Functional Requirements
Numbered against the BRD where the link is direct (BRD FR-2 → FR-2.1):
- FR-2.1: [concrete, testable behaviour]

## UX / UI Requirements
- States to cover: empty, loading, error, success, partial data.
- Name the existing patterns/components reused rather than describing new ones,
  unless this feature genuinely needs one.
- **Design / Prototype:** link the confirmed `impeccable shape` design brief the
  implementer builds against — inline if compact (3–5 bullets), else save to
  `docs/design/<feature>.md` and link. `N/A` for backend-only features, or UI
  fully covered by existing conventions.

## Non-Functional Requirements
Release requirements a prototype can't carry and nobody will build or verify
unless written down. Pull the concrete bar from the project's own rules; fill
only what applies.
- **Performance:** measurable targets that matter here ("list renders <200ms for
  1k rows", "endpoint p95 <300ms"), or `N/A — [why]`.
- **Security / authorization:** who may call or see this, authz rules, sensitive
  data handling, or `N/A — [why]`.
- **Accessibility:** keyboard nav, focus, labels and contrast for anything
  user-facing, or `N/A — [why]`.
- **i18n:** new user-facing strings needing translation keys, or `N/A — [why]`.

## Analytics / Instrumentation
So the BRD's metric is measurable and QA can verify the outcome *moved*, not
just that the feature renders. Name the event(s) and the metric each feeds.
Table-stakes/compliance feature with no measured outcome → `N/A — [why]` rather
than an invented event.
- [event name] — fired when [action], feeds [metric from BRD]

## Data & API Impact
From step 3 — what this touches technically.
- **Entities read:** [names from CONTEXT.md]
- **Entities written:** [names from CONTEXT.md]
- **Entity changes:** new entities, new relationships, or new fields on existing
  ones — each one already reflected in CONTEXT.md's `## Model` diagram before
  this PRD is done. Write `none` only after checking, not by default.
- Existing endpoints reused: [method + path]
- New/changed endpoints needed: [method + path, one-line purpose]
- **Rollout / rollback:** risky changes only (schema migration, feature flag,
  backfill, phased release) — how it ships safely and how to undo it. Plain
  additive feature → `N/A`.

## Edge Cases & Error Handling
| Case | Expected behaviour |
|------|--------------------|

## Out of Scope (for this PRD specifically)
Deliberately excluded from this feature, even if tempting to bundle in.

## Acceptance Criteria
Testable checklist — verifiable without guessing intent. Tag each line with the
FR it verifies; every FR must appear at least once.
- [ ] (FR-2.1) ...

## Implementation
Two-way link to the work that ships this PRD. Filled after `draft-tickets` runs
— record the parent issue and each sub-issue number (and the FR-id each
implements), so a reader finding the issues can find the spec back. Until then,
leave `pending — run draft-tickets`.

- Parent issue: #
- Sub-issues: # — [FR-x.y]

## Dependencies
Other features, APIs, or teams this needs before it can ship.

## Assumptions
Things the implementer will **proceed on** that could turn out wrong ("assuming
IDR-only", "assuming existing auth middleware covers this route"). Distinct from
Open Questions: assumptions don't block, they're risky-if-wrong.

## Open Questions
Unresolved things that **block** or could meaningfully change scope or UX.

## References
Linked BRD, and the code files or CONTEXT.md entries inspected in step 3.
```
