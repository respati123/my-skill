# BRD Template

Fill every section. If one genuinely doesn't apply, write "N/A — [why]" instead of deleting it, so the reader knows it was considered, not forgotten.

Coming from an `/interrogate` decision record, these map directly:

| Decision record | BRD section |
|---|---|
| Decisions (+ reasoning) | Functional Requirements, Background |
| Rejected | Scope → Out of scope |
| Assumptions | Assumptions & Constraints |
| Open | Open Questions |

```markdown
# BRD: [Feature/Project Name]

**Status:** Draft | **Approved by:** [name] on [date] | **Author:** [name] | **Date:** [YYYY-MM-DD] | **Version:** 0.1

## Executive Summary
2-3 sentences: what this is, who it's for, why it matters now.

## Background / Problem Statement
What's the current situation, and what's broken or missing about it? Cite
research where it supports the problem (e.g. "competitor X handles this via Y").

## Goals & Success Metrics
- Goal: [outcome]
  Metric: [number/threshold that proves it happened]
(A goal without a metric is a wish, not a requirement.)

## Features
Every feature this project delivers, as a numbered, countable list. This is
the single source `relay` counts to decide "PRD 2 of 4", and what `draft-prd`
and `draft-tickets` iterate — a free-form bullet list can't be counted.

| ID | Feature | One-line description |
|----|---------|----------------------|
| F-1 | | |
| F-2 | | |

## Scope
**In scope:**
- ... (reference feature IDs from `## Features` above)

**Out of scope:**
- ... (explicit exclusions, each with its reasoning — this is what prevents
  scope creep later)

## Stakeholders
| Role | Name/Team | Responsibility |
|------|-----------|-----------------|
| Sponsor | | approves scope/budget |
| Product | | owns requirements |
| Engineering | | implements |
| End users | | who actually uses this |

## Functional Requirements
Numbered, testable, one behaviour each:
- FR-1: [The system shall ...]
- FR-2: ...

## Non-Functional Requirements
Only the ones actually load-bearing for this feature — pull from the project's
real constraints, not a generic checklist:
- Performance: ...
- Security: ...
- i18n/localization: user-facing strings via translation keys, not hardcoded
- Accessibility / mobile-first: ...

## Assumptions & Constraints
- Assumption: [stated explicitly so it can be challenged]
- Constraint: [deadline, budget, regulatory, technical]

## Dependencies
What this needs from other teams/systems/features before it can ship.

## Risks & Mitigations
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|

## Timeline & Milestones
Rough phases/dates if known — mark "TBD" rather than inventing a date.

## Open Questions
Anything still unresolved — don't silently guess on things that materially
change scope.

## References
Sources used during research and any seed material this BRD was built from.
```
