---
name: lexicon
description: Lock a project's lexicon before the PRDs — the canonical name for each domain thing, a conceptual ERD of how they relate, and ADRs for the decisions behind them. Use when vocabulary must be settled before building, when two modules name the same thing differently, when a new entity or relationship appears, or when an architectural decision needs recording.
---

# Lexicon

Three things live here: a **glossary** of what each term means, a **Model** diagram of how the entities relate, and **ADRs** recording decisions that would otherwise look arbitrary later.

This is the *active* discipline — challenging terms, inventing edge-case scenarios, writing definitions down the moment they crystallise. Merely reading `CONTEXT.md` for vocabulary is not this skill; that's a one-line habit any skill can do. This is for when you're **changing** the model.

## Two modes

**Standalone** — run once, up front, usually off a BRD, before the first PRD. This is the mode that matters on a multi-module system: extract every term the BRD uses, resolve the collisions, lock the vocabulary. See [Standalone pass](#standalone-pass).

**Ride-along** — another skill is doing the driving (a design session, an interview) and you capture terms as they surface. See [During a session](#during-a-session).

## File structure

Most repos have a single context:

```
/
├── CONTEXT.md
├── docs/adr/
│   ├── 0001-event-sourced-orders.md
│   └── 0002-postgres-for-write-model.md
└── src/
```

A `CONTEXT-MAP.md` at the root means multiple contexts, and points at where each lives:

```
/
├── CONTEXT-MAP.md
├── docs/adr/                         ← system-wide decisions
└── src/
    ├── ordering/
    │   ├── CONTEXT.md
    │   └── docs/adr/                 ← context-specific decisions
    └── billing/
        ├── CONTEXT.md
        └── docs/adr/
```

Create files lazily — only when there's something to write. No `CONTEXT.md`? Create it when the first term resolves. No `docs/adr/`? Create it when the first ADR is needed.

Format: [glossary-format.md](references/glossary-format.md) and [adr-format.md](references/adr-format.md).

## Standalone pass

Run this before the PRDs, not after.

1. **Harvest.** Pull every domain noun out of the BRD (and any existing code). Not general programming concepts — only terms this business would recognise.
2. **Cluster by real thing, not by word.** Group terms that point at the same underlying thing even when they're spelled differently. This is where the work is.
3. **Resolve each cluster** with the user, one at a time: pick the canonical term, define it in a sentence or two, list the losers under `_Avoid_`. Propose your pick with a reason — don't hand over a blank form.
4. **Draw the boundaries.** Where terms cluster into separate areas of the business, name each area as a context, write its `CONTEXT.md`, and record how they relate in `CONTEXT-MAP.md`.
5. **Draw the model.** Turn the resolved entities into the `## Model` diagram — a mermaid `erDiagram` of entities and relationships. Settle each cardinality with the user; “can an Order exist without an Invoice” is a domain decision, not a drawing detail. No columns or types — those are physical, and `ERD.md` is generated from the schema. Write `model-version: n` at the top of `## Model` and bump it whenever an entity or relationship changes — PRDs record the version they were written against, so they can tell when they’ve gone stale.

**Done when** every domain noun in the BRD appears in a `CONTEXT.md` or was explicitly ruled out as general vocabulary, **and** every entity in the diagram has a definition, **and** every defined thing appears in the diagram. Walk the BRD's requirements one by one to confirm — a term you skipped is a term two PRDs will define differently.

### Watch for the same thing under different names

On any system with more than one module, the same real thing arrives wearing a different name in each. Inventory calls it *stock item*, purchasing calls it *material*, accounting calls it *product* — one table, three names, discovered during implementation.

Chase these deliberately: when a term appears in one module, ask what the other modules call that same thing before defining it. Either they're genuinely the same (pick one name, the rest go under `_Avoid_`) or they're genuinely different (define both, and say plainly what distinguishes them — that distinction is the valuable part).

Watch the reverse too: one word meaning different things per module. *Order* in sales is a customer's request; *order* in manufacturing is a work instruction. Same word, unrelated things. Split them.

## During a session

### Challenge against the glossary

When a term conflicts with what `CONTEXT.md` already says, call it immediately. "Your glossary defines 'cancellation' as X, but you seem to mean Y — which is it?"

### Sharpen fuzzy language

When a term is vague or overloaded, propose a precise canonical one. "You're saying 'account' — do you mean the Customer or the User? Those are different things."

### Stress-test with scenarios

When domain relationships are being discussed, invent concrete scenarios that probe the edges and force precision about where one concept stops and the next starts. A boundary nobody has tested is a boundary nobody has agreed on.

### Cross-reference with code

When the user states how something works, check whether the code agrees, and surface any contradiction. "Your code cancels entire Orders, but you just said partial cancellation is possible — which is right?"

### Write it down inline

When a term resolves, update `CONTEXT.md` right there. Don't batch — a definition that felt obvious at the time is the one nobody can reconstruct next week.

If the term is a new entity, or changes how existing ones relate, update the `## Model` diagram in the same edit. The glossary and the diagram going out of sync is the failure this section exists to prevent.

Keep `CONTEXT.md` free of implementation detail. It is a glossary, not a spec, not a scratch pad, not a home for technical decisions. Those go in ADRs.

## Offer ADRs sparingly

Only when all three hold:

1. **Hard to reverse** — changing your mind later costs something real
2. **Surprising without context** — a future reader will wonder "why on earth did they do it this way?"
3. **The result of a real trade-off** — there were genuine alternatives and one was picked for specific reasons

Miss any one and skip it. Easy to reverse? You'll just reverse it. Not surprising? Nobody will wonder. No alternative? Nothing to record beyond "we did the obvious thing."

Full criteria and what qualifies: [adr-format.md](references/adr-format.md).

## Next

Never end on "glossary saved" and stop. Once `CONTEXT.md` (and the Model diagram) land, put the next step to the user — reply with one:

1. **Lanjut — `/draft-prd`** (Recommended). One PRD per feature from the BRD, now that vocabulary is locked. Loop back here whenever a PRD surfaces a new term.
2. **Diskusi / revisi** — refine a definition or the model; say what's off and I'll edit `CONTEXT.md` in place (bump `model-version` on any entity/relationship change), then re-offer.
3. **Berhenti** — leave here. Resume later with `/relay` (detects `CONTEXT.md` present and offers `draft-prd`), or run `/draft-prd` directly.

Mid-discussion, keep discussing — don't force the menu. Offer it again only when the model is updated.
