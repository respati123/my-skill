---
name: relay
description: Run the spec-to-QA chain end to end, stopping to confirm at every stage.
disable-model-invocation: true
---

# Relay

Carries a project from idea to green QA by running the chain one stage at a time, stopping at every handoff for a decision.

Relay owns the **order and the gates**. It owns no stage logic — every stage is another skill, invoked as-is. If a stage misbehaves, fix that skill, not this one.

Project readiness — git, `AGENTS.md`, subagents — belongs to `setup`. Run that first if the project is bare; relay assumes it's been done and never re-checks.

## 1. Locate

Work out the current stage from the filesystem, every single time. Never assume the last known position — the user runs stages directly too, and the artifacts are the only honest record.

| Look for | Stage |
|---|---|
| no `docs/decisions/*.md` confirmed, no `docs/brd/*.md` | `interrogate` |
| decision record `confirmed`, no BRD | `draft-brd` |
| BRD `Status: Approved`, no `CONTEXT.md` | `lexicon` |
| `CONTEXT.md`, fewer PRDs than the BRD's `## Features` list | `draft-prd` |
| every feature has a PRD, no GitHub issues | `draft-tickets` |
| open sub-issues, none in progress | `implement-issue` |
| PR open, unreviewed | `review-pr` |
| review LGTM, not verified | `verify-qa` |
| QA green | done — report and exit |

Count features from the BRD's `## Features` table (F-1, F-2…), not the file count alone; a BRD covering four features with three PRDs is mid-stage, not finished. Status gates matter: an unconfirmed decision record or a `Draft` BRD means its stage isn't really done — say so, don't silently advance.

For a PRD to count as present, every template section must hold real content or an explicit `N/A — [why]` — a PRD with a blank Acceptance Criteria section is a half-finished stage, not a done one.

Open the report with one line on where things stand — "BRD Approved, glossary ada, PRD 2 dari 4" — before offering anything. Someone returning after a week needs the position before the proposal.

## 2. Gate

At every handoff, stop and put the next step to the user. Never run two stages on one confirmation, and never end a turn without a clear path forward — a chain nobody watches is just a long script, and a user left without options is stuck. Present the options as a numbered list (reply with one), next stage first and labelled "(Recommended)":

- **Lanjut** — run the next stage.
- **Diskusi / revisi** — refine the just-finished artifact, or discuss the plan, before moving on. Carry on the discussion as long as it's productive; re-offer these options only when it lands on a change or you reach a natural stopping point.
- **Lompat** — any other stage, including the one just finished.
- **Berhenti** — leave relay. Say which `/skill` resumes from this point (e.g. "resume with `/draft-prd` — the BRD is Approved and `CONTEXT.md` exists") and where the artifact lives, so the position stays recoverable from disk.

Then run the chosen stage by invoking its skill. Don't summarise or paraphrase what the stage will do; it speaks for itself.

## 3. Chain

| Stage | Skill | Artifact |
|---|---|---|
| 1 | `interrogate` | `docs/decisions/<slug>.md` (`Status: confirmed`) |
| 2 | `draft-brd` | `docs/brd/<slug>.md` (`Status: Approved`) |
| 3 | `lexicon` | `CONTEXT.md` + `## Model` (with `model-version`), `docs/adr/` |
| 4 | `draft-prd` | `docs/prd/<slug>.md` — **once per feature**; Design field is a hard gate (link an `impeccable shape` brief or write `N/A — backend-only`) |
| 5 | `draft-tickets` | parent issue + sub-issues (each titled with its FR-id; each carrying `## Parent: #<n>`) |
| 6 | `implement-issue` | branch, code, PR — **once per sub-issue, in dependency order** |
| 7 | `review-pr` | review to LGTM |
| 8 | `verify-qa` | acceptance criteria verified against the running app; checklist saved to `docs/qa/<slug>-<date>.md` |

**Every PRD before any code.** Stage 4 repeats until every feature in the BRD's `## Features` list has a PRD; only then does stage 5 run. On a system whose modules share entities, a clash found in a document costs a paragraph — the same clash found after both tables exist costs a migration.

Stages 6–8 repeat per sub-issue, **in dependency order**: schema/data sub-issues before the endpoints that read them, backend before the frontend that consumes it. When one sub-issue blocks another, surface that — don't let the user pick a sub-issue whose dependency isn't done.

Stages 6–8 repeat per sub-issue.

## 4. When a stage fails

Blocking review findings and failed QA are normal, not exceptional. Go back to `implement-issue`, fix, carry on — through a gate, like everything else.

**When the same stage fails twice, stop and raise it.** Two failures in one place usually means the PRD is wrong, not the code. Ask whether to revise the PRD — or the BRD behind it — rather than offering a third repair. Grinding on code that faithfully implements a broken spec is the failure this rule exists to catch.

**Resuming after a spec revision.** If the PRD or BRD is revised, re-run forward from the changed stage, not from scratch — but say which downstream artifacts are now stale (the issues, the in-flight branch, the model). A PRD change can invalidate open sub-issues and an open PR; a BRD change can invalidate every PRD under it and the lexicon. Name what's affected before proceeding, and let the user decide whether to revise downstream or roll the change forward.

## 5. Where relay stops

At green QA. Report that the PR is ready to merge, and exit.

Merging and deploying stay outside relay and outside this conversation's momentum. Everything relay runs is local or reversible: nothing reaches main, nothing reaches a user. Ending here keeps it that way.

## Next

When relay exits (green QA, or a gate failure that needs a human call):

1. **Green QA — Lanjut — next feature.** The PR is ready to merge. If there's
   another feature in the BRD with an un-started PRD, loop back to `/relay`
   (it'll route to `draft-prd` for the next one). If this was the last feature,
   the project is ready to ship — remind the user that **merging is manual**
   (relay never merges).
2. **Gate failure (twice on the same stage) — Diskusi.** Don't grind on a
   broken spec. Revise the PRD or BRD (say which downstream artifacts go
   stale), then re-run forward from the changed stage.
3. **Spec gap surfaced mid-pipeline — Berhenti.** Sometimes a stage reveals
   the spec itself is missing a decision. Stop, record the open question,
   resume with `/interrogate` to capture the decision, then `/relay` to
   continue.
