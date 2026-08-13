---
name: review-pr
description: Static review of an open PR against its issue's acceptance criteria — BLOCKING findings or LGTM, posted to the PR. On LGTM, tells the user to merge manually (QA runs post-merge). Trigger on "code review pr", "review this PR", "techlead review".
---

# review-pr

The techlead role's phase: a static diff review with fresh eyes — judge the
diff on its own merits, don't inherit the implementer's reasoning. If the
project provides its own `code-review` skill for house standards, load that
too.

GitHub calls below (`gh pr diff`, `gh pr review`): prefer the MCP GitHub
tools when connected, otherwise run `gh` as written — mapping in
[docs/github-access.md](../docs/github-access.md).

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
3. **On LGTM** — review passed. **Do NOT move the ticket to `qa`** —
   QA runs **post-merge**, not now. Leave the ticket at `review`, delete
   `tickets/.active`, and **tell the user to merge the PR manually** (the
   techlead's LGTM is the green light for merge — it's the moment for the
   user's own self-review of the diff). The board stays in the Review
   column until the merge lands; `verify-qa` will move it to `qa` once it
   starts post-merge.
   Then **delete `tickets/.active`** (or set `agent: null`), so the board
   clears the working indicator.
   **On BLOCKING findings** — leave the ticket at `review` (it's not
   done), delete `tickets/.active`. The ticket stays in the Review column.
   When the fix comes back from `coder` and re-review passes, re-acquire
   `.active` as techlead and re-review; if re-review finds more blocking
   issues, send back to `coder` again. Max 3 rounds total before stopping.
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
   `frontend-rules-typescript` (at `setup/references/rules/`) or the
   project's own equivalents where
   relevant — explicitly, not as a vague impression. A clear, checkable
   violation is **BLOCKING**; a stylistic call the skill doesn't actually
   pin down is not.
4. **API docs check**: if the diff adds or changes an endpoint, the
   Postman collection at `docs/postman/` must be updated in the same PR
   per **Postman / API Docs Rules** (`setup/references/rules/postman-rules.md`)
   — every case as a sub-request, positive + negative + auth/not-found/conflict
   where they apply, with test scripts. A missing doc update, or one with
   only the happy path, is **BLOCKING**.
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
back to **`coder`** (the same role that wrote the diff, fresh context), not
fixed here.

## After the review

- **LGTM** → review passed. **Tell the user to merge the PR manually** —
  the techlead LGTM is the green light for merge, and the merge moment is
  the user's self-review checkpoint. Do NOT move the ticket to `qa` here;
  QA runs post-merge and will pick the ticket up once the merge lands. The
  ticket stays in the Review column until merged.
- **BLOCKING findings** → **delegate the fix back to the `coder` role**
  (re-spawn it as a subagent with fresh context, same branch). Hand it the
  findings list verbatim, tell it to fix each on the same branch, push, and
  return. Then **re-review with a fresh `techlead`**. **Never fix the
  findings inline in this context** — the agent running this skill is the
  reviewer, not the coder; fixing inline merges two roles that must stay
  separate (a review by the same context that then fixes is not a review).
  This is not a choice for the user to delegate-vs-fix-manually: the default
  path is always "send back to coder, re-review". Only offer "fix manually" as
  an explicit user override when the user says they want to do it themselves
  — and even then, **you** (this agent) don't edit the code; you hand the
  findings to the user and stop.

## Next

Never end on "review posted" and stop. Put the next step to the user —
reply with one:

1. **LGTM → Lanjut — `/verify-qa`** (Recommended). The static review passed;
   hand it to QA to verify the acceptance criteria by execution. Moves the
   sub-issue to the QA column (`ticket-move.mjs <id> qa`).
2. **BLOCKING → Lanjut — `/implement-issue`**. Send the findings back to the
   `coder` role to fix on the same branch, then re-review.
3. **Diskusi** — disagreement with a finding; say which one and I'll
   reconsider.
4. **Berhenti** — leave here. Resume later with `/relay` (detects the PR
   state and routes to the right stage), or run `/verify-qa` directly on an
   approved PR.
