# AGENTS.md template

Generated/updated by `setup`. If the project already has an AGENTS.md,
MERGE: add only the missing sections below, never delete or rewrite what the
user wrote.

```markdown
# AGENTS.md

## Project map
<!-- filled from the scout report: what this project is, top-level layout -->
- `<dir>/` — <what lives here>

## Stack
<!-- languages, frameworks, notable libraries — from scout report -->

## Commands
- Install: `<cmd>`
- Dev: `<cmd>`
- Build: `<cmd>`
- Lint: `<cmd>`
- Test: `<cmd>`

## Conventions
<!-- naming, patterns, idioms the scout found; keep only what an implementer
     must follow, not a style essay -->

## Development workflow (multi-agent)
Roles: `scout` (read-only recon), `pm` (BRD/PRD/issues), `coder` (implements),
`techlead` (static review), `qa` (verifies by execution).

Pipeline per feature (one sub-issue = one PR = one full cycle, sequential,
backend first):
1. `pm` — BRD → PRD → parent issue + sub-issues.
2. Per sub-issue: label `in-progress` → `scout` recon (mandatory) → `coder`
   implements → PR (`Closes #<sub-issue>`, never the parent).
3. `techlead` reviews the diff with fresh context: BLOCKING findings go back
   to `coder` (max 3 rounds, then stop and report); `LGTM` proceeds.
4. `qa` runs serially after LGTM: verifies every acceptance criterion by
   execution. FAIL goes back to `coder`; PASS → label `done`.
5. A human merges each PR; the next sub-issue starts after the merge. The
   parent issue is labeled `done` and closed manually when all sub-issues
   are done. Agents NEVER merge.

### Quick reference — what to type
- Not sure what to do next, for any reason → `setup` (safe to
  re-run any time; reports status and recommends the single next command).
- New feature, no spec yet → `relay`.
- Spec approved, no issues yet → `draft-tickets`.
- Ready to work a sub-issue → `/ship <issue>` (or run the phases on their
  own: `implement-issue` → `review-pr` → `verify-qa`).
- Just want to know where everything stands → `/scout`.

## Do not
- Do not merge PRs — merging is always manual.
- Do not let any agent other than `coder` modify code.
- Do not skip the scout step before implementation.
```
