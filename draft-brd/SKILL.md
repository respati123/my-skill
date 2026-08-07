---
name: draft-brd
description: Write a Business Requirements Document (BRD) for a software feature or project, saved as Markdown. Trigger only when the user explicitly asks for a BRD — "draft a BRD", "buat BRD" — not on generic requests like "document this feature" or "write a spec".
---

# Draft BRD

A BRD is only as good as the questions behind it. One full of boilerplate ("the system shall be scalable and secure") is worse than no BRD, because it buys false confidence. Everything below exists to ground the document in real context before you ask the user anything, so the questions you do ask are few and sharp.

Pairs with `interrogate` — that skill produces the decisions, this one turns them into a document a stakeholder can approve.

## Workflow

In order. Drafting from assumptions is the failure mode this skill exists to prevent.

### 1. Establish the topic

Feature/project name, one line on what it does and who it's for. If the user already said this when invoking, confirm in one line and move on — don't re-ask.

### 2. Find the seed material

Check, in this order, and stop at the first that hits:

- **A decision record from `/interrogate`** — look in `docs/decisions/`. The best possible input, because every decision already carries its reasoning. Read it fully; the template opens with a table mapping its sections onto the BRD's.
- **Raw material the user pasted** — notes, meeting transcript, brief.
- **Nothing** — proceed to step 3.

Extract what it already answers so you never re-ask it. Don't stall with "do you have any notes?" — look first, ask only if the answer changes what you do.

### 3. Research the domain (skip only if step 2 already covered it)

Invoke the `research` skill on the **domain**, not on "how to write a BRD" — that's process you already know. Ask it for: how similar products are typically scoped, standard requirements and compliance concerns in that domain, common pitfalls, what competitors do.

It runs in the background and writes findings to a Markdown file — read that file before step 4, and carry its sources into the BRD's References section.

This is what buys you sharp questions instead of template questions. For "recurring transactions", research surfaces timezone handling, month-end dates like the 31st, and failed-retry policy — edge cases a generic interview never reaches.

If the decision record from step 2 already cites research, say so and skip this step rather than duplicating it.

### 4. Interview for the gaps only

Cross-reference [the template](references/brd-template.md) against what steps 2 and 3 already cover. Ask **only what's missing**, in one batch — not one at a time, and not a 20-question form.

A decision record typically leaves exactly three holes, because a design interview never goes there:

- **Success metric** — the number that proves it worked
- **Stakeholders** — specifically, who approves scope and budget
- **Hard constraints** — deadline, budget, regulatory

**Never ask a blank question — always attach a recommendation.** Steps 2 and 3 exist precisely so you can propose the likely answer. "Based on [source], recommend A, B, C for v1 — confirm or adjust?" beats "What features do you want?". Use `AskUserQuestion` with your recommendation first and labeled "(Recommended)" when the choices are discrete.

If research or seed material answers something confidently, state it as an assumption instead of asking: "Assuming IDR-only like the rest of the app — flag if not."

**Frame the metric as an outcome, not an output.** An output is something shipped ("the export button exists"); an outcome is a change in behaviour or a business measure ("weekly active exporters up 20%", "support tickets about X halved"). Push for the outcome. If the honest answer is "this just has to exist" — table stakes, compliance — record that plainly rather than inventing a fake metric. Where you can, tie each requirement's acceptance criteria back to that metric.

**Done when** every section of the template is either already answered by steps 2–3 or included in the batch you put to the user. Walk the template section by section to confirm — a section you never checked is a section you will guess at in step 5.

### 5. Draft

Fill the structure in [references/brd-template.md](references/brd-template.md).

Functional requirements are numbered and testable (FR-1, FR-2…), one behaviour each — not vague prose. Non-functional requirements reflect this project's real constraints (check the repo's `CLAUDE.md` / `AGENTS.md`), not a generic checklist.

Coming from a decision record, carry each decision's reasoning across — a requirement whose "why" is recorded survives review.

**List every feature as a numbered row in `## Features`** (F-1, F-2…, one line each). This is the single source `relay` counts to detect "PRD 2 of 4", and what `draft-prd` and `draft-tickets` iterate — a free-form Scope bullet list can't be counted or iterated reliably.

**Done when** every section holds real content or an explicit `N/A — [why]`. No section left blank, and no section silently dropped.

### 6. Save and iterate

Save to `docs/brd/<slug>.md` — kebab-case slug of the feature name, create the folder if needed. Open the `**Status:**` line as `Draft`. Tell the user where it landed and ask directly: "anything to change?" Revise in place. On explicit approval, set `**Status:** Approved` and add `**Approved by:** [who] on [date]` — `relay` advances to `lexicon` only when this is `Approved`, not just because a BRD file exists. A BRD is judged by the person who has to act on it, not by an automated check.

## Next

Never end on "saved" and stop. Once the BRD lands, put the next step to the user — reply with one:

1. **Lanjut — `/lexicon`** (Recommended). Locks the domain vocabulary and model before any PRD — the chain is `interrogate → draft-brd → lexicon → draft-prd`, so lexicon comes next, not a PRD.
2. **Diskusi / revisi** — refine the BRD first; say what's off and I'll edit in place, then re-offer. Don't set `Status: Approved` until it's right.
3. **Berhenti** — leave here at `Status: Draft`. Resume later with `/relay` (advances only once the BRD is `Approved`), or run `/lexicon` directly once approved.

Mid-discussion, keep discussing — don't force the menu. Offer it again only when the discussion lands or the BRD is updated.
