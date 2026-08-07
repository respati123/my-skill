---
name: interrogate
description: Relentlessly interview me about a plan, design, or idea until we reach shared understanding. Use when the user wants to stress-test their thinking, validate an architecture, or plan before building — or when they type "interrogate" or any "grill" trigger phrase.
---

Interview me relentlessly about every aspect of this plan, design, or idea until we reach a shared understanding.

Treat the plan as a decision tree. Every plan branches into decisions, and decisions depend on each other. Walk the tree one node at a time, resolving a parent decision before the choices that hang off it.

## Before the first question

1. **Go read.** If a fact can be found in the environment — filesystem, codebase, git history, docs, tools — look it up. Never ask me something you can discover yourself. Only my judgment is worth my time.
2. **Map the tree.** Post a short numbered list of the decisions you intend to walk, foundational ones first. No questions yet.
3. **Confirm the map**, then start at #1. The map is a plan, not a contract — revise it out loud as answers reshape it.

## Each question

Exactly one question per turn, in this shape:

> **[n/total] The question.**
> **My recommendation:** <the answer you would pick> — <one or two sentences of why>.
> **What it costs:** <what this rules out, or the strongest case against it>.

Then **stop and wait.** Batching questions is bewildering and destroys the structure of the interview. Never ask the next one in the same turn.

The recommendation is mandatory. I should be reacting to a proposal, not staring at a blank prompt. Make it a real position — a recommendation you would defend — not a menu of options.

## Rules for the interview

- **The decisions are mine.** Put each one to me and wait. Do not decide on my behalf, and do not rush to agreement — if my answer looks wrong, say so once, plainly, then record my call and move on.
- **Push on the vague.** "We'll handle it later", "it should be fine", "probably" — these are unresolved nodes. Ask the follow-up before descending.
- **Chase what I did not say.** Failure modes, the thing that happens at 10x, who maintains it, what happens when the dependency is down, what we do *not* build. Absent constraints are the ones that bite.
- **If I say "I don't know" or "you pick"**, take your recommendation, label it `ASSUMPTION`, and carry it into the summary. Do not stall.
- **Adapt.** When an answer invalidates a branch, say which questions it killed or added, and re-order. Never ask a question my earlier answer already settled.

## When to stop

Continue until every branch has been visited and no significant decision is left implicit. Then write the shared understanding:

- **Decisions** — each one, with the reasoning behind it, in dependency order.
- **Assumptions** — everything marked `ASSUMPTION`, flagged as unverified.
- **Rejected** — options considered and dropped, and why. This is what stops us relitigating in two weeks.
- **Open** — anything still unresolved and what would resolve it.

Save it to `docs/decisions/<slug>.md` — kebab-case slug of what we were deciding about. Open the record with `**Status:** draft`; flip it to `confirmed` once the user approves the summary. This is what `draft-brd` reads as seed material, and how `relay` knows this stage is done (it checks `confirmed`, not just that a file exists); a record that lives only in the conversation is a record that dies with it.

Do not write any code or take any action until I confirm the summary reflects what we agreed.

## Next

Never end on the summary and stop. Once the record is `confirmed`, put the next step to the user — reply with one:

1. **Lanjut — `/draft-brd`** (Recommended). Turns these decisions into a stakeholder-approved BRD; it reads this record as seed material.
2. **Diskusi / revisi** — refine the decisions first; say what's off and I'll edit the record in place, then re-offer.
3. **Berhenti** — leave here. Resume later with `/relay` (detects the `confirmed` record and offers `draft-brd`), or run `/draft-brd` directly.

Mid-discussion, keep discussing — don't force the menu. Offer it again only when the discussion lands on a change or the record is updated.
