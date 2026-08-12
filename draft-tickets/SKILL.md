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

   **Read `docs/architecture.md` first** (Status: Confirmed) — it decides
   the split. A monorepo with one backend + one frontend splits 2 ways; a
   microservices project splits per service; a mobile-inclusive project adds
   a mobile sub-issue. The stack also names the infra the backend sub-issue
   must wire (Redis, queue, WebSocket) — pull those from the architecture
   doc's infra list, don't re-derive them from the PRD. If no
   `architecture.md` exists, stop and run `/stack` first — ticket breakdown
   without a confirmed stack guesses at the split.
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
5. **Create each ticket via the kanban API** — for each parent and sub-issue
   in the breakdown, run:
   ```
   node kanban/scripts/ticket-create.mjs --type <type> --slug <slug> --title "<title>" --parent <parent-id> --labels <comma,separated>
   ```
   Map each ticket to its type: `feat` for feature work, `fix` for bugs,
   `task` for generic items, `chore` for tooling/deps, `docs` for
   documentation. The script creates the `.md` file in `tickets/` and the
   file watcher syncs it to the board. Carry the FR-id into the title or slug
   (e.g. `--slug fr2-1-login-endpoint`) so traceability from BRD → PRD →
   ticket survives.
6. Report the created ticket ids and offer to start `implement-issue` on the
   first ready sub-issue (backend before frontend, per the dependency order
   from step 2).

Bugs/chores found outside a spec still go through the plain `/issue`
command, not this skill — `draft-tickets` is specifically for spec-derived
feature breakdowns.

## Next

Never end on "tickets created" and stop. Put the next step to the user —
reply with one:

1. **Lanjut — `/implement-issue`** (Recommended). Start coding the first
   ready sub-issue (backend first, then frontend).
2. **Lanjut — start the kanban board**. `cd kanban && node server.mjs &`,
   then open the board to see the tickets visually.
3. **Diskusi / revisi** — adjust the breakdown; say what's off and I'll
   edit the tickets via the API, then re-offer.
4. **Berhenti** — leave here. Resume later with `/relay` (detects open
   tickets and offers `implement-issue`), or run `/implement-issue` directly.

**GitHub reminder:** these are local tickets right now. When you're ready
for GitHub, run `node kanban/scripts/migrate-to-github.mjs --open` — it
pushes them to GitHub issues and local files become read-only shadows.
Not needed to continue the pipeline; GitHub is optional.
