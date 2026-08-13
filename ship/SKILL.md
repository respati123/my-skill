---
name: ship
description: Drive a task end-to-end through the implementation pipeline — scout → code → PR → review → QA — delegating to the pipeline skills, pausing only at checkpoints. Trigger on "ship", "ship this", "drive this end to end", "build this feature end to end", or when given a task description, PRD path, or issue/ticket number to fully execute.
---

# ship

Drive the given task (a description, a PRD path, or an issue/ticket number)
end to end through the implementation pipeline.

You are the orchestrator. You delegate to the **pipeline skills** — not raw
roles — because each skill owns its active-lock, ticket-move, and status
transition. Ship's job is sequencing, gating at checkpoints, and parent-close
at the end. Don't reimplement what a pipeline skill already does.

GitHub calls below (`gh issue edit`, `gh pr review`): prefer the MCP GitHub
tools when connected, otherwise run `gh` as written — mapping and the
local-first fallback in [docs/github-access.md](../docs/github-access.md).

Delegate synchronously (never backgrounded, never parallel) — this pipeline
is a chain of gates (code → review → QA), and a backgrounded phase lets the
next gate start against unfinished work. Wait for each skill's output before
starting the next.

**One sub-issue = one PR = one full cycle** (steps 2–5). Sub-issues run
sequentially in dependency order (backend before frontend). A dependent
sub-issue does not start until the one it depends on is merged.

## Step 0 — Resume check

If the task is an existing issue/ticket number, look for prior work before
planning: an `in-progress` status, a `feat/<n>-*` / `fix/<n>-*` branch, or an
open PR referencing it. If found: detect the state (branch, unpushed commits,
PR and review status, ticket status), report what you detected, and re-enter
the cycle at the matching step. **Never re-create issues, branches, or PRs
that exist.** If the number is a parent ticket, resume its first non-`done`
sub-issue.

Local mode: check the board — `GET /api/tickets` and look at statuses.

## Step 1 — Plan  [CHECKPOINT 1]

If no issues exist yet:

- If the task references a PRD (`docs/prd/*.md`), read it: derive the issue
  breakdown and acceptance criteria from its FR numbering — don't invent new
  ones.
- Delegate to **`/draft-tickets`**: draft the parent ticket + sub-issue
  breakdown per the issue conventions (features = parent + BE/FE sub-issues;
  bugs/chores = single). Present the breakdown + implementation order.
- **STOP. Wait for approval.** Don't create anything until the user confirms
  the breakdown.

If issues already exist (resuming), skip to Step 2 with the next sub-issue.

## Step 2 — Start the next sub-issue  (auto)

Pick the next sub-issue in dependency order (backend first, per
`draft-tickets`'s breakdown):

- Move it: `node kanban/scripts/ticket-move.mjs <id> in-progress`. The first
  sub-issue also moves the parent `in-progress`.
- Delegate to **`/implement-issue`** with the sub-issue: it scouts, branches
  (`feat/<n>-<slug>`), implements, tests, lints, commits, pushes, opens a PR
  with `Closes #<sub-issue>` (never the parent), and moves the ticket to
  `review` on return. It manages its own active-lock.

## Step 3 — Review  (auto)

- Delegate to **`/review-pr`** with the PR URL (from `implement-issue`'s
  output). It runs a static review with fresh context, verdict BLOCKING or
  LGTM. On LGTM it tells the user to **merge the PR manually** (techlead
  approval is the green light for merge — review is done, QA runs
  post-merge, not pre-merge).
- **BLOCKING** → hand findings back to `/implement-issue` to fix on the same
  branch, then re-run `/review-pr`. Max **3 rounds**; if still blocked,
  **STOP** and report what remains. [CHECKPOINT]
- LGTM → continue.

## Step 4 — Merge  [CHECKPOINT 2]

- **Techlead LGTM is the green light for merge.** The user merges the PR
  manually (`gh pr merge` / GitHub UI) — never auto-merged by the skill.
  This is the moment for the user's own self-review of the diff before it
  hits main.
- **STOP. Wait for the user to confirm the PR is merged.** QA runs
  post-merge, so it cannot start until the merge lands. Once the user
  confirms (or `gh pr view <PR> --json state --jq .state` returns
  `MERGED`), continue.
- Do not advance until merged — QA on an unmerged branch tests the wrong
  thing.

## Step 5 — QA  (auto, post-merge)

- Delegate to **`/verify-qa`**: verify every acceptance criterion by
  execution on **`main`** (the merged code, not a feature branch). FAIL →
  the fix is a **new PR** (main is already merged — fix forward, don't
  revert unless the bug is destructive). Delegate to `/implement-issue`
  for a fix sub-issue, then re-run QA on the new merge. PASS → continue.

## Step 6 — Sub-issue done  [CHECKPOINT 3]

- Move it: `node kanban/scripts/ticket-move.mjs <id> done`.
- Present: PR URL (merged), review rounds used, QA checklist — including CI
  status and any FLAKY tests `verify-qa` flagged.
- Loop back to Step 2 for the next sub-issue.

## Step 7 — Feature done  [FINAL CHECKPOINT]

When every sub-issue is `done`:

- Move the parent: `node kanban/scripts/ticket-move.mjs <parent> done`.
- Present the summary — all PR URLs (merged), total review rounds, non-blocking
  notes left over.
- **STOP.** The parent issue is closed manually by the user. Say it
  explicitly: "All sub-issues are done. Close the parent #<n> manually."

## Checkpoints — where ship stops

Ship pauses at exactly four points, never elsewhere:

1. **After planning** (Step 1) — confirm the breakdown before creating
   anything.
2. **Merge** (Step 4) — techlead LGTM'd; the user merges manually for
   self-review. QA waits.
3. **Sub-issue done** (Step 6) — present the merged PR + QA result.
4. **Feature done** (Step 7) — present the summary, ask the user to close the
   parent.

Everything between is automatic delegation. If a skill fails twice at the
same gate (review blocks twice, QA fails twice), **STOP** and raise it — two
failures usually means the spec is wrong, not the code. Don't grind on code
that faithfully implements a broken spec.

## Next

Ship exits at one of three points:

1. **Feature done (all sub-issues green).** The parent is `done`. If there's
   another feature in the BRD with an un-started PRD, loop back to `/relay`
   (it'll route to `/draft-prd` for the next one, then back to `/ship` once
   issues exist). No more features? The project is ready to release — remind
   the user that **merging was manual** (ship never merged anything).
2. **Gate failure (twice on the same stage).** Don't grind. Revise the PRD or
   BRD (say which downstream artifacts go stale), then re-enter `/ship` at
   Step 2 after the fix.
3. **Spec gap surfaced mid-pipeline.** Stop, record the open question, resume
   with `/interrogate` to capture the decision, then `/ship` at Step 2.

Run `node kanban/scripts/e2e-test.mjs` any time to verify the pipeline wiring
is intact before resuming.
