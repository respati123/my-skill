---
name: review-pr
description: Static review of an open PR against its issue's acceptance criteria — BLOCKING findings or LGTM, posted to the PR. Trigger on "code review pr", "review this PR", "techlead review".
---

# review-pr

The techlead role's phase: a static diff review with fresh eyes — judge the
diff on its own merits, don't inherit the implementer's reasoning. If the
project provides its own `code-review` skill for house standards, load that
too.

GitHub calls below (`gh pr diff`, `gh pr review`): prefer the MCP GitHub
tools when connected, otherwise run `gh` as written — mapping in
[docs/github-access.md](../../docs/github-access.md).

## Workflow

**Delegate to the `techlead` role** — this whole phase is the techlead
role's job.

Roles are defined in `.agents/agents/` and surfaced through per-harness
shims (`.claude/agents/`, `.pi/agents/`, …); see the `setup` skill and
`role-installer`. Delegate, don't inline:

**0. Active-lock gate.** One ticket works at a time. Check `tickets/.active`:
if it exists and points at a **different** ticket, stop — tell the user
"#<id> is being worked on by <agent>; finish it first." If it points at
this ticket, or is absent, proceed.

1. **Ensure the role resolves** — invoke `role-installer` with task
   `ensure techlead`. It copies the role into `.agents/agents/` if missing
   and generates the shim for whatever harness is running.
2. **On `READY`** — **write `tickets/.active`** with
   `{"ticket":"<id>","agent":"techlead","started":"<ISO now>"}`, then
   delegate to `techlead` through your harness's subagent mechanism (Agent
   tool, `subagent` tool, …), foreground. Pass it the PR number only — fresh
   context matters: don't hand it the implementer's reasoning, just the PR.
3. **On return** — **delete `tickets/.active`** (or set `agent: null`), so
   the board clears the working indicator.
4. **On `NEEDS_RESTART` or no delegation tool available** — only run the
   phase inline if this context did **not** write the diff being reviewed
   (a review by the same context that wrote the code is not a review);
   otherwise tell the user what's needed (restart to pick up the shim, or a
   subagent-capable tool) and stop.

1. Fetch the diff (`gh pr diff <PR>`) and the linked issue's acceptance
   criteria. **Open the source PRD at `docs/prd/<slug>.md` too** — the issue
   body is a copy, and copies drift. The PRD's Acceptance Criteria section is
   the canonical bar; review against it. If the issue drops or rewrites an AC
   the PRD lists, that gap is a finding, not a pass.
2. Review for: correctness, criteria actually met, missing tests, edge
   cases, scope creep, and violations of the project's documented rules.
3. **Coding-rules check**: apply the specific skill(s) `coder` was supposed
   to load — `coding-principles` always, plus `backend-rules-typescript`/
   `frontend-rules-typescript` or the project's own equivalents where
   relevant — explicitly, not as a vague impression. A clear, checkable
   violation is **BLOCKING**; a stylistic call the skill doesn't actually
   pin down is not.
4. **API docs check**: if the diff adds or changes an endpoint, the
   project's API docs (e.g. `docs/postman/`) must be updated in the same
   PR, with both a positive and a negative example request for the
   affected endpoint — a missing doc update, or one with only the happy
   path, is **BLOCKING**.
5. **Data model check**: if the diff adds or changes a table/schema and
   the project keeps an `ERD.md`, it must be updated in the same PR — a
   missing update is **BLOCKING**.
6. **ADR check**: if the diff makes an architecturally significant,
   hard-to-reverse decision (a new dependency/framework/datastore, a new
   module boundary or service split, a public interface/contract, or a
   cross-cutting construction technique) and no ADR under `docs/adr/` is
   added or updated in the same PR, that's **BLOCKING**. A local refactor,
   a new field, or any reversible/self-contained choice is not significant
   — don't demand an ADR for those.
7. **Security check** (per `coding-principles`): string-concatenated/
   interpolated SQL instead of parameterized queries, a hardcoded secret or
   credential, a non-crypto RNG for a token/ID/nonce, or a resource access
   with no per-resource authorization check are each **BLOCKING** — a
   targeted check for these specific red flags, not an open-ended audit.
8. **CI status**: an open, failing CI check on the PR is **BLOCKING**
   regardless of the rest of the review — don't LGTM a PR whose CI is red.
   Still running → that's a reason you can't LGTM yet, not a pass-by-default.
9. Group findings **BLOCKING** vs **non-blocking**, each with file, line,
   and a concrete failure scenario. No blocking findings → `LGTM`.
10. Post the review on the PR itself:
    BLOCKING → `gh pr review <PR> --request-changes --body "<findings>"`;
    LGTM → `gh pr review <PR> --approve --body "<summary + non-blocking notes>"`.

Review statically — don't run the app (that's `verify-qa`, and it runs after
this passes) and never edit code (neither this skill nor `techlead` ever
does — a fix, if any, is always a separate delegation). Blocking findings go
back to whoever's implementing, not fixed here.

## After the review

- **LGTM** → done, nothing further to do.
- **BLOCKING findings** → don't just post and stop. Summarize the findings,
  then ask the user (`AskUserQuestion`, single-select) how they want to
  proceed: (1) delegate to the `coder` role/subagent to fix them on the same
  branch, then re-review, or (2) leave it for the user to fix manually. Only
  spawn `coder` on explicit choice (1) — never fix the findings yourself or
  assume the answer.
