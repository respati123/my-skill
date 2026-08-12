# AGENTS.md

This repo is a **skills collection**, not an application — no build, no tests,
no runtime. Every directory is one skill: a `SKILL.md` plus, where needed, a
`references/` folder of templates/formats it reads. **Every skill is vendored
here — there are no dependencies on `~/.agents/skills/` or any external folder.**

## Skills in this repo

- `interrogate/` — decision-tree interview. Produces `docs/decisions/<slug>.md`.
- `draft-brd/` — Business Requirements Document. Produces `docs/brd/<slug>.md`.
- `lexicon/` — domain glossary, conceptual model, ADRs. Produces `CONTEXT.md`,
  `docs/adr/`.
- `draft-prd/` — Product Requirements Document (one per BRD feature). Produces
  `docs/prd/<slug>.md`.
- `stack/` — grills the tech-stack decision tree (topology → deployment →
  backend → frontend → mobile), driven by BRD/PRD signals. Produces
  `docs/architecture.md` (`Status: Confirmed`). Sits between `draft-prd` and
  `draft-tickets`; loads per-stack reference docs from
  `setup/references/architecture/`.
- `draft-tickets/` — breaks a PRD into GitHub parent + sub-issues.
- `implement-issue/` — branch, code, PR for one sub-issue.
- `review-pr/` — static PR review to LGTM.
- `verify-qa/` — verify AC by executing the app; checklist to `docs/qa/`.
- `relay/` — orchestrator; runs the spec+stack chain (interrogate →
  draft-brd → lexicon → draft-prd → stack → draft-tickets), gating each
  handoff.
- `ship/` — implementation orchestrator; drives a sub-issue end to end
  (scout → code → PR → review → QA), gating at checkpoints. `relay` hands
  off to `ship` once issues exist.
- `setup/` — project readiness (git, `AGENTS.md`); installs roles from its
  `references/agents/` into the host project as **pristine templates**
  (`.agents/roles/`, the source-of-truth `role-installer` restores from) **and
  working copies** (`.agents/agents/`, skip-existing, what harnesses shim to).
  Harness-agnostic — no `.claude/` hardcoding, no skill-path dependency.
  Coding rules (`coding-principles`, `backend-rules-typescript`,
  `frontend-rules-typescript`, `postman-rules`) live at `references/rules/` as
  **reference docs the roles load**, not standalone skills.
- `research/` — background domain research for `draft-brd`.
- `impeccable/` — design system; `draft-prd` calls its `shape` sub-skill.
  **Folder name is a runtime contract** — its scripts hardcode `impeccable/`;
  don't rename the folder.
- `coding-principles/`, `backend-rules-typescript/`, `frontend-rules-typescript/`
  — coding rules loaded by the `coder` role.

## Editing the skills

- Skills are Markdown. Frontmatter `name` + `description`; the body is the
  instruction set the agent loads on trigger.
- Keep cross-references consistent: every skill names the next one in the chain
  correctly (`draft-brd` → `lexicon`, not `create-prd`). When renaming a skill,
  grep the others.
- Templates live under `references/`. The skill text and its template must agree
  — a field added to the template must be mentioned in the skill's "Done when".

## The chain (all vendored in this repo)

```
interrogate → draft-brd → lexicon → draft-prd → stack → draft-tickets
                                                    ↓ ship → implement-issue → review-pr → verify-qa
```

Every stage — pipeline (`draft-tickets`, `implement-issue`, `review-pr`,
`verify-qa`), helpers (`setup`, `research`), design system (`impeccable`) —
lives in this repo. No `~/.agents/skills/` dependency. Roles
(`scout`/`pm`/`coder`/`techlead`/`qa`/`role-installer`) ship as templates
inside `setup/references/agents/`; coding rules (`coding-principles`,
`backend-rules-typescript`, `frontend-rules-typescript`, `postman-rules`)
ship as reference docs inside `setup/references/rules/`. `setup` deposits
roles to `.agents/roles/` (pristine) and `.agents/agents/` (working), then
shims them into whatever harnesses are detected.

## Conventions baked in

- Status gates: decision record `Status: confirmed`; BRD `Status: Approved`;
  `CONTEXT.md` `model-version: n`. `relay` checks these, not just file existence.
- Traceability: BRD `## Features` (F-1…) → PRD FR-ids (FR-x.y) → sub-issue
  titles carry the FR-id and a `## Parent: #<n>` line → QA checklist at
  `docs/qa/<slug>-<date>.md`.
- Every stage ends with a **Next** block: Lanjut / Diskusi / Berhenti (with the
  exact `/skill` that resumes).
