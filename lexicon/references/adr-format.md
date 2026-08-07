# ADR Format

ADRs live in `docs/adr/`, numbered sequentially: `0001-slug.md`, `0002-slug.md`. Scan for the highest existing number and increment. Create the directory lazily — only when the first ADR is needed.

## Template

```md
# {Short title of the decision}

{1-3 sentences: the context, what was decided, and why.}
```

That's it. An ADR can be one paragraph. The value is recording *that* a decision was made and *why* — not filling out sections.

## Optional sections

Only when they add genuine value. Most ADRs need none.

- **Status** frontmatter (`proposed | accepted | deprecated | superseded by ADR-NNNN`) — useful once decisions start getting revisited
- **Considered Options** — only when the rejected alternatives are worth remembering
- **Consequences** — only when non-obvious downstream effects need calling out

## When to write one

All three must hold:

1. **Hard to reverse** — changing your mind later costs something real
2. **Surprising without context** — a future reader will look at the code and wonder "why on earth did they do it this way?"
3. **The result of a real trade-off** — there were genuine alternatives and one was picked for specific reasons

Easy to reverse? You'll just reverse it. Not surprising? Nobody will wonder. No real alternative? Nothing to record beyond "we did the obvious thing."

### What qualifies

- **Architectural shape.** "We're using a monorepo." "The write model is event-sourced, the read model projects into Postgres."
- **Integration patterns between contexts.** "Ordering and Billing communicate via domain events, not synchronous HTTP."
- **Technology choices carrying lock-in.** Database, message bus, auth provider, deployment target — not every library, just the ones that would take a quarter to swap.
- **Boundary and scope decisions.** "Customer data is owned by the Customer context; others reference it by ID only." The explicit no-s are worth as much as the yes-s.
- **Deliberate deviations from the obvious path.** "Manual SQL instead of an ORM, because X." Anything where a reasonable reader would assume the opposite. These stop the next engineer from "fixing" something that was intentional.
- **Constraints invisible in the code.** "We can't use AWS, compliance." "Responses must be under 200ms, partner API contract."
- **Rejected alternatives whose rejection is non-obvious.** Considered GraphQL and picked REST for subtle reasons? Record it, or someone proposes GraphQL again in six months.

### What doesn't

A term's definition is not an ADR — that's the glossary. If the thing you're recording is "what X means", it belongs in `CONTEXT.md`. An ADR records a *choice*, not a *meaning*.
