---
description: Create a well-structured GitHub issue (bug or task) via gh
argument-hint: "<title> [context]"
---
Create a GitHub issue using the `gh` CLI, following the project's issue conventions.

Raw input: $ARGUMENTS — treat the leading phrase as the title, the rest as context.

GitHub calls below: prefer the MCP GitHub tools when connected, otherwise
run `gh`/`gh api` exactly as written — mapping and exceptions (the
blocked-by dependency link has no MCP equivalent) in
[docs/github-access.md](../docs/github-access.md).

## Before creating

1. Detect the type from the input: **bug**, **feature/task**, or **chore**.
2. Keep it atomic — one concern per issue. If the input covers multiple things, propose splitting into separate issues and ask which to create.
3. **Features get a parent issue + sub-issues.** Every feature is created as one **parent issue** (the feature itself: context, goal, overall acceptance criteria) plus **sub-issues** for the implementable parts, linked via GitHub's native sub-issue relationship:
   - Split by layer at minimum: one `backend` sub-issue, one `frontend` sub-issue. Add more sub-issues only if the feature genuinely has more atomic parts — don't pad.
   - The backend sub-issue comes first; note it as a dependency in the frontend sub-issue's body.
   - Each sub-issue gets acceptance criteria scoped to its layer; the parent holds the feature-level criteria.
   - Features touching a single layer still get a parent + one sub-issue, so tracking is uniform.
   - **Bugs and chores stay single issues** — no parent/sub structure.
4. Rewrite the title to be specific and action-oriented, imperative mood
   (e.g. "Fix crash when saving an expense with an empty amount"), not vague ("app is broken").
5. Choose labels: `bug` | `feature` | `chore`, plus **area labels** — at least one of `backend` / `frontend`. Use both only when the issue genuinely touches both layers (rare after rule 3).

## Body template — bug

```
## Summary
<one-sentence description of the PROBLEM, not a guessed cause or fix>

## Steps to reproduce
1. ...
2. ...

## Expected
<what should happen>

## Actual
<what happens instead — objective and observable, e.g. "returns 500", not "doesn't work">

## Environment
<device / browser / API version, if relevant>

## Severity
low | medium | high | critical
```

Report **symptoms, not diagnoses** (Bugzilla / Tatham): the Summary and
Actual state what you *observed*; keep any hypothesis about the cause in a
separate note, never in place of the facts. Steps to reproduce is the single
most important field — make it precise enough that someone else can trigger
the failure from scratch; include error text verbatim.
When in doubt, include more detail rather than less — the reader can skip
what they don't need but can't invent what's missing. Name things
explicitly (the exact field, button, or endpoint) instead of vague
references like "it" or "this".

## Body template — feature parent issue

```
## User story
As a <role>, I want <goal>, so that <benefit>.

## Context
<why this is needed — the problem or goal, beyond the one-line story>

## Description
<what to build, feature-level — details live in the sub-issues>

## Acceptance criteria (feature-level)
- [ ] <condition verifiable when ALL sub-issues are done>
- [ ] ...

## Definition of done
- [ ] All sub-issues merged and closed
- [ ] Feature-level acceptance criteria above verified end-to-end (not just per sub-issue in isolation)
- [ ] `review-pr` LGTM obtained on every sub-issue PR
- [ ] `verify-qa` passed post-merge on main

## Out of scope
<what this feature does NOT cover>
```

The **User story** line frames the feature from the user's perspective (Agile
Alliance): who it's for and why, not just what to build. **Context** carries
the Conversation — decisions and tradeoffs the team already discussed; a
reader who wasn't in that discussion should still be able to follow the
reasoning from this section alone. Sub-issues appear automatically in
GitHub's sub-issue panel — don't maintain a manual task list in the body.

## Body template — sub-issue / task

```
## Parent
#<parent issue number>

## Description
<what to build / change in THIS layer only>

## Acceptance criteria
- [ ] <clear, testable condition scoped to this layer>
- [ ] ...

## Definition of done
- [ ] Acceptance criteria above all pass
- [ ] Code follows this repo's coding rules (`coding-principles`, plus the stack-specific rule doc for this layer)
- [ ] Tests covering the change added/updated and passing
- [ ] Lint/typecheck clean
- [ ] No regressions in adjacent flows touched by this change
- [ ] PR opened, reviewed, and merged — `review-pr` LGTM obtained before merge

## Dependencies / related
<e.g. "Blocked by #<backend sub-issue> — needs <specific contract, e.g. the
response shape of POST /expenses>" for the frontend sub-issue>
```

**Description** names a concrete entry point — file path, function,
endpoint, or component — to start from, and states *why* this is needed,
not only what to build; the reader may not have been in the discussion that
decided this.

**Write acceptance criteria as Given / When / Then** for anything non-trivial
(Gherkin / Cucumber): `Given <context>, When <action>, Then <observable
outcome>`. Separating context, action, and outcome removes ambiguity and
makes each criterion a script QA can execute directly — the same execution
model this workflow already uses. Example: `Given a logged-in user, When they
submit an expense with an empty amount, Then the API returns 422 and a
subsequent GET /expenses does not include it.` Keep plain `- [ ]` conditions
for genuinely trivial checks — don't add ceremony where a one-liner is
unambiguous. Every criterion, in either form, must be **verifiable by
execution** (an observable outcome, a measured threshold, a specific output)
— never a subjective bar like "the page looks good" or "it's fast"; quantify
instead ("the hero image renders at ≥300×300px", "the endpoint responds in
<200ms at p95").

Keep each criterion to 3–5 clauses (Given/When/Then plus at most one or two
Ands) — more, and it stops reading as a single testable behavior. The `Then`
clause must name an **observable output** (a response, a UI state, a
returned value) — never an internal implementation detail like a database
row. Aim for roughly 3–7 acceptance criteria per sub-issue; needing more
usually means the sub-issue covers more than one behavior — split it instead
of padding this one.

**Acceptance criteria vs. Definition of done**: acceptance criteria describe what THIS issue must do (feature-specific, verifiable by execution); Definition of done is the fixed process checklist that closes any ticket regardless of feature (tests, lint, review, merge, QA). Both are required — AC passing without the DoD checklist done is not a closeable ticket.

## Body template — chore

Use the sub-issue/task template without the Parent section.

## Status labels (lifecycle)

Every issue moves: *(no label)* → `in-progress` → `done`.
- `in-progress` is added when implementation starts on the issue (the parent gets it when its first sub-issue starts).
- `done` replaces it when QA passes (the parent when all sub-issues are done).
- The `ship` skill manages these transitions automatically; apply them manually (`gh issue edit <n> --add-label ...`) only when working outside the `ship` pipeline.
- New issues are created with **no status label** — unstarted work is whatever has neither.

## Create

1. Build titles and bodies from the correct templates above. For a feature, propose the full breakdown (parent + sub-issue titles) to the user **before creating anything**.
2. Ensure every label you're about to use exists — `gh issue create --label` **fails** on a missing label (idempotent — errors on existing labels are fine to ignore):
   ```
   gh label create in-progress --color FBCA04 --description "Being worked on" 2>/dev/null
   gh label create done --color 0E8A16 --description "QA passed, awaiting/after merge" 2>/dev/null
   gh label create feature --color A2EEEF 2>/dev/null
   gh label create chore --color CFD3D7 2>/dev/null
   gh label create backend --color 1D76DB 2>/dev/null
   gh label create frontend --color D93F0B 2>/dev/null
   ```
   (`bug` ships with GitHub by default; create it the same way if this repo deleted it.)
3. Create each issue: `gh issue create --title "<title>" --body "<body>" --label "<labels>"`. For features: parent first, then backend sub-issue, then frontend sub-issue.
4. Link each sub-issue to the parent — `POST /repos/{owner}/{repo}/issues/{issue_number}/sub_issues`
   (needs the sub-issue's database ID, not its number):
   ```
   sub_id=$(gh api repos/{owner}/{repo}/issues/<sub_number> --jq .id)
   gh api repos/{owner}/{repo}/issues/<parent_number>/sub_issues -F sub_issue_id=$sub_id
   ```
   (Use `gh repo view --json owner,name` if owner/repo aren't known.)

   - **Already has a different parent** (e.g. resuming a `ship` run that got
     interrupted after a partial link) → the call 422s. Retry once with
     `-F replace_parent=true` rather than treating it as a failure.
   - **Secondary rate limiting**: GitHub explicitly warns that creating
     several sub-issue links back-to-back can trigger it. If a call fails
     with a rate-limit error (403 with a `retry-after`-style message), wait
     a few seconds and retry that one link — don't abandon the batch.
   - Pace the calls one at a time in issue-creation order (never fire them
     concurrently); this alone avoids most rate-limit hits.

   **This step is mandatory, then verify it worked**:
   ```
   gh api repos/{owner}/{repo}/issues/<parent_number>/sub_issues --jq '.[].number'
   ```
   must list every sub-issue you created. Any missing → the link failed;
   redo it (applying the two cases above as needed) before reporting. The
   `## Parent` line in the body is context for agents, NOT a substitute for
   the native link.
5. If a sub-issue depends on another (the standing rule: the frontend
   sub-issue depends on the backend one), also create a **native**
   blocked-by link — `POST
   /repos/{owner}/{repo}/issues/{issue_number}/dependencies/blocked_by` —
   not just the "Dependencies / related" prose in the body. This is what
   lets `implement-issue` (and anything else) query blocking status
   programmatically instead of parsing text:
   ```
   blocker_id=$(gh api repos/{owner}/{repo}/issues/<backend_number> --jq .id)
   gh api repos/{owner}/{repo}/issues/<frontend_number>/dependencies/blocked_by -F issue_id=$blocker_id
   ```
   Same secondary-rate-limit caution as step 4 applies — one call at a
   time, retry a rate-limited call rather than skipping it.
6. If a milestone or assignee is obvious from context, add `--milestone` / `--assignee`.
7. Report back: parent issue number + URL and each sub-issue number + URL. Do not start coding yet unless asked.
