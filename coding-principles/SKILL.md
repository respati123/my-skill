---
name: coding-principles
description: Explicit, checkable coding rules for the coder role — parameter/nesting limits, error handling, dependency injection, pattern-representativeness before adopting, security-critical defaults, file size, commit hygiene. Language-agnostic; auto-loaded for every sub-issue. Use when implementing or reviewing any code, not just TypeScript backend/frontend.
---

# Coding Principles (explicit rules)

Language-agnostic rules for the `coder` role, distilled from
[shinpr/claude-code-workflows](https://github.com/shinpr/claude-code-workflows)'
`coding-principles` skill down to what's **explicit and checkable** — not
generic philosophy like "prioritize maintainability" or "keep it simple",
which this workflow already enforces via the active lazy/YAGNI discipline
every response runs under. If a rule below conflicts with a more specific
project or stack skill (e.g. `backend-rules-typescript`'s 15-line function
cap), the more specific one wins — these are the language-agnostic default,
not an override.

## Function design

- **0-2 parameters** recommended. 3+ → group into an object/struct instead
  of a long positional list.
- **Single responsibility** per function — extract complex logic into
  separate, well-named sub-functions rather than one function doing several
  things.
- **Max 3 levels of nesting.** Use early returns or extract a sub-function
  to flatten anything deeper — don't let a function grow sideways.
- No hard line-count ceiling is set here (defer to a stack-specific skill if
  one exists); as a default absent one, treat >50 lines as a signal to look
  for a natural split, not a hard block.

## Error handling

- **Always handle errors** — log with context or propagate explicitly.
  Never swallow an error silently (empty catch, ignored rejection).
- **Mask sensitive data in logs** — passwords, tokens, PII never appear in a
  log line, even at debug level.
- **Fail fast** — surface an error as close to its source as possible,
  don't let a bad state travel further before it's caught.

## Dependency management

- **Inject external dependencies** (constructor args for classes, function
  parameters for procedural/functional code) instead of reaching for a
  global or constructing them inline. Depend on abstractions, not concrete
  implementations, so tests can substitute a fake/mock without patching.

## Before adopting a pattern (representativeness)

Nearby code is a starting point for investigation, not sufficient grounds to
copy it. Before following an existing pattern:

- **Referencing only 2-3 nearby files?** Confirm the pattern is
  representative by checking usage across the repo, not just the files
  closest at hand.
- **Multiple approaches coexist in the repo?** Identify the majority pattern
  and choose deliberately — picking whichever file happened to be nearest
  isn't a decision, it's an accident.
- **Adopting an external dependency** already used elsewhere in the repo?
  Verify the version/usage is consistent repo-wide; if the right version
  can't be determined from the repo alone, ask instead of guessing.
- Following an existing pattern for a **reason other than "it's what's
  already used"** (avoiding a breaking change, a pending coordinated
  migration)? State that reason so the next reader doesn't mistake it for
  an active recommendation.

## Security-critical defaults

- **Parameterized queries / prepared statements** for all database access —
  never string-concatenated or interpolated SQL.
- **Cryptographically secure random generators** for tokens, IDs, and
  nonces — never a non-crypto RNG for anything security-critical.
- **Secrets via environment variables or a secret manager** — never
  hardcoded, never committed.
- **Validate all external input** at the point it enters the system (type,
  format, length); **encode output** for the context it's rendered into
  (HTML, SQL, shell, URL) — a value safe in one context isn't automatically
  safe in another.
- **Authorization is checked per resource access**, not only once at the
  entry point — a valid session doesn't imply access to every resource it
  subsequently touches.
- **Error responses return only what the caller needs**; detailed
  diagnostics (stack traces, internal identifiers) stay server-side in logs,
  never in the response body.

## File organization

- One primary responsibility per file. Flag a file crossing roughly 500
  lines as a candidate for splitting rather than letting it keep growing.

## Commit hygiene

- Atomic, focused commits — one logical change per commit, not a grab-bag.
- Never commit a secret, credential, or `.env` value — same rule as
  Security-critical defaults above, applied at commit time, not just runtime.
