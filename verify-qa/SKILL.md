---
name: verify-qa
description: Verify a PR's acceptance criteria by executing the app, not by reading code — runs after review-pr's LGTM. Trigger on "verify-qa", "qa this PR", "verify this PR".
---

# verify-qa

The qa role's phase: dynamic verification, after the review passes (serial,
never parallel with review).

GitHub calls below (`gh api .../sub_issues`): prefer the MCP GitHub tools
when connected, otherwise run `gh` as written — mapping in
[docs/github-access.md](../docs/github-access.md). `gh pr checkout` stays
`gh` regardless — it's a local operation, no MCP path exists for it.

## Workflow

**Delegate to the `qa` role** — this whole phase is the qa role's job.

Roles are defined in `.agents/agents/` and surfaced through per-harness
shims (`.claude/agents/`, `.pi/agents/`, …); see the `setup` skill and
`role-installer`. Delegate, don't inline:

**0. Active-lock gate.** One ticket works at a time. Check `tickets/.active`:
if it exists and points at a **different** ticket, stop — tell the user
"#<id> is being worked on by <agent>; finish it first." If it points at
this ticket, or is absent, proceed.

1. **Ensure the role resolves** — invoke `role-installer` with task
   `ensure qa`. It copies the role into `.agents/agents/` if missing and
   generates the shim for whatever harness is running.
2. **On `READY`** — **write `tickets/.active`** with
   `{"ticket":"<id>","agent":"qa","started":"<ISO now>"}`, then
   delegate to `qa` through your harness's subagent mechanism (Agent tool,
   `subagent` tool, …), foreground. Pass it the PR number.
3. **On PASS** — **move the ticket to `done`** (pipeline complete):
   ```
   node kanban/scripts/ticket-move.mjs <id> done
   ```
   Then **delete `tickets/.active`** (or set `agent: null`), so the board
   clears the working indicator.
   **On FAIL** — leave the ticket at `qa`, delete `tickets/.active`. The
   ticket stays in the QA column until the coder fixes the failing criteria.
4. **On `NEEDS_RESTART` or no delegation tool available** — only run the
   phase inline if this context is independent of the implementation and
   review (verification by the same context that wrote or approved the
   code isn't independent verification); otherwise tell the user what's
   needed (restart to pick up the shim, or a subagent-capable tool) and
   stop.

1. Check out the PR branch: `gh pr checkout <PR>`. Run the project's lint,
   test, and e2e commands.
2. **CI status**: check `gh pr checks <PR>` (or `statusCheckRollup`). Still
   running → wait and re-check. Failed → a finding, same as a local
   failure, even if the local run passed.
3. A failing test → re-run up to **2 more times, hard cap**. Consistently
   fails → genuine **FAIL**. Inconsistent across attempts → report
   **FLAKY** separately (which test, attempts, pattern) instead of quietly
   calling it PASS — it doesn't block this PR by itself, but never hide it.
4. For each acceptance criterion, verify it **by execution** — run the
   flow, hit the endpoint, observe the output. Reading the code is not
   verification. Pull the criteria from the **source PRD at
   `docs/prd/<slug>.md`** — the issue body is a copy, and copies drift. If
   the issue drops or rewrites an AC the PRD lists, verify against the PRD
   and flag the drift.
5. Report a checklist: each criterion PASS/FAIL with the evidence (command +
   observed output), CI status, and any FLAKY tests. Anything you couldn't
   execute is UNVERIFIED, not PASS. **Write the checklist to
   `docs/qa/<slug>-<date>.md`** (slug from the PRD, ISO date) — a green QA
   that lives only in chat dies with the session. The file is the auditable
   record that this stage ran and what it saw.
6. Verdict: **PASS** only if every criterion passes AND CI is green (or no
   CI configured); otherwise **FAIL** with the failing criteria/CI check
   listed. Never fix code yourself.

   **Invoked standalone (not via `ship`)**: on FAIL, **delegate the fix back
   to the `coder` role** (re-spawn, fresh context, same PR branch). Hand it the
   failing criteria + evidence verbatim, tell it to fix on the same branch,
   push, and return. Then re-run `verify-qa`. **Never fix the findings inline
   in this context** — the agent running this skill is the QA verifier, not
   the coder; fixing inline merges two roles that must stay separate, and the
   QA agent isn't loading the coder's coding rules. "Fix manually" is only an
   explicit user override when the user says they want to do it themselves —
   and even then, **you** (this agent) don't edit the code; you hand the
   findings to the user and stop.
7. On **PASS**: check whether this was the last sub-issue for its parent.
   Read the parent number from this issue's `## Parent` line, then list the
   parent's sub-issues and their state:
   ```
   gh api repos/{owner}/{repo}/issues/<parent>/sub_issues --jq '.[] | "\(.number) \(.state)"'
   ```
   If every sub-issue is `closed` (this one included, once its PR is
   merged), say so explicitly: **"All sub-issues of #<parent> are done —
   label the parent `done` and close it manually."** GitHub does not
   auto-close a parent when its sub-issues close, and closing it is a
   manual, human step (same gate `/ship`'s final checkpoint uses) — don't
   label or close the parent yourself. If sub-issues are still open, just
   note how many remain; no action needed.

## Next

Never end on "QA done" and stop. Put the next step to the user — reply
with one:

1. **PASS → Lanjut — next sub-issue** (Recommended). This one's green; start
   `/implement-issue` on the next ready sub-issue (backend before frontend).
   If this was the **last** sub-issue for its parent, the parent is done —
   remind the user to close it (manual step, see step 7).
2. **FAIL → Lanjut — `/implement-issue`**. Send the failing criteria back to
   the `coder` role to fix on the same branch, then re-run QA.
3. **Diskusi** — a criterion is ambiguous or UNVERIFIED; say which and I'll
   re-check against the PRD.
4. **Berhenti** — leave here. Resume later with `/relay` (detects the QA
   verdict and routes accordingly), or start `/implement-issue` on the next
   sub-issue directly.

**Status transition:** on PASS, `ticket-move.mjs <id> done` moved the
sub-issue to Done. The board reflects the green QA.
