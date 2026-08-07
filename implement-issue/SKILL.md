---
name: implement-issue
description: Implement one GitHub sub-issue end to end — scout the area, branch, code, test, push a PR. Trigger on "implement-issue", "implement issue #N", "code this issue", "implement this ticket".
---

# implement-issue

The coder role's phase, runnable on its own (not only via the full `/ship`
pipeline). This is the only phase allowed to modify code.

GitHub calls below (`gh issue ...`, `gh label ...`): prefer the MCP GitHub
tools when connected, otherwise run the `gh` command as written — mapping
and exceptions (blocked-by check, anything local) in
[docs/github-access.md](../../docs/github-access.md).

## Workflow

**Delegate to the `coder` role** — this whole phase is the coder role's job.

Roles are defined in `.agents/agents/` and surfaced through per-harness
shims (`.claude/agents/`, `.pi/agents/`, …); see the `setup` skill and
`role-installer`. Delegate, don't inline:

**0. Active-lock gate.** One ticket works at a time. Check `tickets/.active`:
if it exists and points at a **different** ticket, stop — tell the user
"#<id> is being worked on by <agent>; finish it first." If it points at
this ticket (resuming), or is absent, proceed. The board reads this file to
show the live status.

1. **Ensure the role resolves** — invoke `role-installer` with task
   `ensure coder`. It copies the role into `.agents/agents/` if missing and
   generates the shim for whatever harness is running.
2. **On `READY`** — **write `tickets/.active`** with
   `{"ticket":"<id>","agent":"coder","started":"<ISO now>"}`, then
   **move the ticket to `in-progress`**:
   ```
   node kanban/scripts/ticket-move.mjs <id> in-progress
   ```
   Then delegate to `coder` through your harness's subagent mechanism (Agent tool,
   `subagent` tool, …), foreground. Pass it the target sub-issue. **Run
   coder in a worktree** — it branches, commits, and pushes, so keep that
   off the main working tree. If your mechanism has an isolation flag (e.g.
   `isolation: "worktree"`), use it; otherwise set up the worktree yourself
   (`git worktree add`) and pass its path as the delegate's working
   directory.
3. **On return** — **move the ticket to `review`** (coder is done, handoff
   to techlead):
   ```
   node kanban/scripts/ticket-move.mjs <id> review
   ```
   Then **delete `tickets/.active`** (or set `agent: null`), so the board
   clears the working indicator.
4. **On `NEEDS_RESTART` or no delegation tool available** — tell the user
   what's needed (restart to pick up the shim, or a subagent-capable tool)
   and stop; don't silently fall back to inline.

1. Identify the target sub-issue.
   - If the user named one, use it.
   - If not, list open issues (`gh issue list --state open --json
     number,title,labels`) and triage each by querying its native blockers
     — `gh api repos/{owner}/{repo}/issues/<n>/dependencies/blocked_by --jq
     '.[] | select(.state=="open") | .number'`. Any hit means **blocked**;
     no hits and no `in-progress` label means **ready**; already
     `in-progress` means someone's on it. Present the ready list and ask
     which to work on — don't auto-pick.
   - If everything ready is actually blocked, say so and point at the
     blocking issue(s) instead — that's what should get picked up first.
2. Label it `in-progress` before doing anything else (ensure the label
   exists first; ignore already-exists errors):
   ```
   gh label create in-progress --color FBCA04 --description "Being worked on" 2>/dev/null
   gh issue edit <n> --add-label in-progress
   ```
3. Read its acceptance criteria and its `## Parent` reference for
   feature-level context.
4. Scout first: read the target area's structure, conventions, and existing
   contracts before writing anything — reuse what's already there instead of
   inventing new patterns. Load the same skills `coder.md` does: always
   `coding-principles`; `backend-rules-typescript` (+ `hono` if the project
   uses it) for a `backend`-labelled TypeScript sub-issue;
   `frontend-rules-typescript` + `impeccable` for a `frontend`-labelled one.
   Non-TypeScript backend, or the project has its own domain skills
   (`backend-rules`, `frontend-rules`, `ui-design`)? Those take precedence.
5. `git fetch origin` and branch `feat/<issue>-<slug>` or
   `fix/<issue>-<slug>` off the up-to-date default branch — never a stale
   local copy, a dependent sub-issue needs previously merged work underneath it.
6. Implement, scoped tight to this sub-issue's acceptance criteria only —
   note anything extra you're tempted to fix, don't do it here.
7. Add/update tests for what changed. Run the project's lint and test
   commands; fix failures before handing off.
8. Added or changed an API endpoint? Update the project's API docs (e.g.
   `docs/postman/`) in the same PR, with both a positive and a negative
   example request. Added or changed a table/schema, and the project keeps
   an `ERD.md`? Update it too. Both are BLOCKING findings in `techlead`'s
   review if missed.
9. Commit, push, open a PR with `Closes #<sub-issue>` (the sub-issue, never
   the parent).
10. Report: PR URL, branch, files changed, commands run and their results.
    Never merge.
