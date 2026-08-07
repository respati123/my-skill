---
description: Read-only progress report — where every feature and issue stands, plus a recommended next action
argument-hint: "[issue number | keyword] (optional — empty means the whole project)"
---
Report where the work stands. **Read-only**: never edit code, labels, issues,
or PRs. Scope: $ARGUMENTS (empty = everything).

## Gather (via gh)

Prefer the MCP GitHub tools when connected, otherwise run `gh` as written —
mapping in [docs/github-access.md](../docs/github-access.md). Since the
`--json` fields below (`reviewDecision`, `statusCheckRollup`) drive the
report, confirm an MCP substitute actually returns them before trusting it
over `gh`.

1. All issues, including closed:
   `gh issue list --state all --limit 100 --json number,title,state,labels,body,url`
2. Open PRs: `gh pr list --json number,title,url,reviewDecision,statusCheckRollup`
3. Build the tree: sub-issues name their parent in the body (`## Parent` /
   `#<n>` per the issue conventions); anything else is a parent feature or a
   standalone bug/chore. If a body is ambiguous, confirm via
   `gh api repos/{owner}/{repo}/issues/<n>/sub_issues`.

Status per issue, derived from labels + state:
- `done` label or closed → **done**
- `in-progress` label → **in progress**
- no status label, open → **not started**

## Report

One compact overview, features first:

```
Feature #12 — Recurring transactions        [in progress, 1/3 done]
  ✓ #13 backend: recurrence engine          done   (PR #21 merged)
  ▶ #14 backend: notification job           in progress (PR #22 open, review pending)
  ○ #15 frontend: schedule UI               not started (blocked by #14)

Feature #16 — CSV export                    [not started, 0/2]
  ○ #17 backend  ○ #18 frontend

Standalone: #19 bug: crash on empty amount  [not started]
```

Then **open PRs awaiting human merge** — these block dependent sub-issues,
list them explicitly.

## Recommend

End with ONE next action, picked in this priority order:

1. A `done` sub-issue with its PR still open → **ask the user to merge it**
   (it blocks everything behind it).
2. A sub-issue `in-progress` → resume it: `/ship <n>`.
3. An in-progress feature with an unstarted sub-issue whose dependency is
   merged → start it: `/ship <n>`.
4. No feature in progress → the first unstarted parent: `/ship <parent>`.
5. Nothing at all → suggest the pm flow (`create-brd` → `create-prd`) for the
   next feature.

If the user gave a scope argument, apply the same logic within that scope only.
