# Spec-driven dev skills

A fully self-contained chain of skills that carries a project from idea to green
QA — `interrogate → draft-brd → lexicon → draft-prd → stack →
draft-tickets → ship → implement-issue → review-pr → verify-qa` — with two
runners: `relay` (spec+stack chain) and `ship` (implementation chain), each
gating handoffs. **Every skill lives in this repo; there are no dependencies on
`~/.agents/skills/` or any external folder.**

## All skills in this repo

| Skill | What it does | Artifact |
|---|---|---|
| `interrogate` | Relentless decision-tree interview before building | `docs/decisions/<slug>.md` (`Status: confirmed`) |
| `draft-brd` | Turns decisions into a stakeholder-approved BRD | `docs/brd/<slug>.md` (`Status: Approved`) |
| `lexicon` | Locks domain vocabulary, model, and ADRs | `CONTEXT.md` + `## Model` (`model-version`), `docs/adr/` |
| `draft-prd` | One PRD per BRD feature — user flows, UX, AC | `docs/prd/<slug>.md` |
| `stack` | Grills the tech-stack decision tree (topology→backend→frontend→mobile), PRD-driven | `docs/architecture.md` (`Status: Confirmed`) |
| `draft-tickets` | Breaks a PRD into GitHub parent + sub-issues | parent issue + sub-issues |
| `implement-issue` | Branch, code, PR for one sub-issue | branch + PR |
| `review-pr` | Static PR review to LGTM | PR review |
| `verify-qa` | Verify AC by executing the app | `docs/qa/<slug>-<date>.md` |
| `relay` | Runs the spec chain, gating each handoff | — |
| `ship` | Runs the implementation chain, gating at checkpoints | — |
| `setup` | Project readiness: git, AGENTS.md, installs roles | `.agents/agents/*`, `AGENTS.md` |
| `research` | Background domain research for sharp BRD questions | research notes |
| `impeccable` | Design system; `draft-prd` calls its `shape` sub-skill | design brief |

The roles (`scout`, `pm`, `coder`, `techlead`, `qa`, `role-installer`) ship as
templates inside [`setup/`](setup/references/agents/). `setup` deposits them
to **two places** in the host project:

- **`.agents/roles/`** — pristine source-of-truth (overwritten on each `setup`,
  never edited by hand). What `role-installer` restores a missing role from.
- **`.agents/agents/`** — working copies harnesses load (skip-existing — safe to
  customize). Shims (`.claude/agents/`, `.pi/agents/`, `.cursor/agents/`) point
  back at these.

The coding rules (`coding-principles`, `backend-rules-typescript`,
`frontend-rules-typescript`, `postman-rules`) live at
[`setup/references/rules/`](setup/references/rules/) — these are **reference
documents the `coder` and `techlead` roles load**, not user-triggered skills.
Edit a role → change it in `.agents/agents/`; the pristine copy in
`.agents/roles/` stays untouched so a restore always brings back the original.

## Pipeline

```
interrogate  →  draft-brd  →  lexicon  →  draft-prd  →  draft-tickets
                                                            ↓
                  verify-qa  ←  review-pr  ←  implement-issue
```

`relay` locates the current stage from the filesystem every time it runs and
gates each handoff with: **Lanjut / Diskusi / Lompat / Berhenti**.

## Install

Copy (or symlink) each skill directory into your agent's skills folder. Each has
a `SKILL.md` with its trigger and, where needed, a `references/` folder of
templates/formats.

> **Note on `impeccable`:** its scripts hardcode the folder name `impeccable/`
> (in hook commands and script paths). Keep the folder name as-is when you copy
> it — renaming it breaks those runtime paths.

## Status & traceability

The chain is provable end to end: every BRD feature (F-1, F-2…) → a PRD →
sub-issues (titled with their FR-id, each carrying `## Parent`) → a PR → a QA
checklist at `docs/qa/<slug>-<date>.md`. Status gates (`confirmed`, `Approved`,
`model-version`) mean `relay` can tell a finished stage from an abandoned one.
