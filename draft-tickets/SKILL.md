---
name: draft-tickets
description: Break an approved BRD/PRD into a GitHub parent issue + sub-issues, following this repo's issue conventions. Trigger on "draft-tickets", "buat tickets", "break this into issues", "turn this spec into issues".
---

# draft-tickets

The pm role's ticket-creation phase: turns an approved spec into GitHub
issues. Uses the exact same conventions as the `/issue` command — read
`prompts/issue.md` for the full body templates, label rules, and native
sub-issue linking steps, and follow them exactly. The only difference here is
where the content comes from.

## Workflow

**Delegate to the `pm` role** — this whole phase is the pm role's job.

Roles are defined in `.agents/agents/` and surfaced through per-harness
shims (`.claude/agents/`, `.pi/agents/`, …); see the `setup` skill and
`role-installer`. Delegate, don't inline:

1. **Ensure the role resolves** — invoke `role-installer` with task
   `ensure pm`. It copies the role into `.agents/agents/` if missing and
   generates the shim for whatever harness is running.
2. **On `READY`** — delegate to `pm` through your harness's subagent
   mechanism (Agent tool, `subagent` tool, …), foreground. Pass it the spec
   (or which PRD if known) plus this skill's workflow below.
3. **On `NEEDS_RESTART` or no delegation tool available** — tell the user
   what's needed (restart to pick up the shim, or a subagent-capable tool)
   and stop; don't silently fall back to inline.

1. Find the spec: look for the relevant PRD in `docs/prd/` (and its BRD in
   `docs/brd/` for context). If the user names one, confirm it; if none
   exists and none is named, ask which spec this is for — don't invent
   requirements.
2. Derive the breakdown from the PRD's FR numbering: one **parent issue**
   (feature-level acceptance criteria, from the PRD's scope) plus
   **sub-issues** per implementable part (backend first, then frontend) —
   same split rule as `prompts/issue.md`: at minimum one backend + one
   frontend sub-issue, more only if genuinely atomic. **Title each
   sub-issue with its FR-id** (e.g. `FR-2.1 — create order endpoint`) and
   carry the FR-id into the body, so the BRD → PRD → issue → PR chain stays
   queryable end to end — the traceability dies the moment an issue has no
   FR-id to point back at.
3. Follow `prompts/issue.md`'s body templates, label conventions, and
   creation steps exactly: ensure labels exist, create parent then
   sub-issues, link every sub-issue via the sub-issues API, **verify the
   link worked**, no status label on creation. **Every sub-issue body must
   carry a `## Parent: #<n>` line** pointing at the parent issue — `implement-issue`
   reads it for feature-level context, so a missing `## Parent` breaks that
   silently. Don't rely on `prompts/issue.md` to remember it; this skill owns
   it.
4. Propose the full breakdown (parent + sub-issue titles) to the user before
   creating anything.
5. Report parent + sub-issue numbers and URLs.
6. **Ask which sub-issue to start on** (`AskUserQuestion`, single-select):
   list the ones that are actually ready — not blocked by another sub-issue
   per the dependency order from step 2 — as options, with the first one in
   dependency order (backend before the frontend sub-issue that depends on
   it) labeled "(Recommended)". Once the user picks, load the `implement-issue`
   skill for that sub-issue number right away — don't wait for a separate
   go-ahead.

Bugs/chores found outside a spec still go through the plain `/issue`
command, not this skill — `draft-tickets` is specifically for spec-derived
feature breakdowns.
