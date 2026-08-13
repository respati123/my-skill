# Research: what makes a ticket "proportional" for a junior reader

> Note on convention: there was no existing `docs/research/` directory or
> research-note convention in this repo before this file. This establishes
> one — future research notes can follow the same shape (recommendations up
> top, cited findings below, concrete template deltas at the end).

Scope: this is research only. It does not edit
`setup/references/commands/issue.md` or `draft-tickets/SKILL.md`. Findings
are written to be directly actionable by whoever applies them next.

---

## Recommendations (tied to specific template sections)

- **Sub-issue/task → Description**: add an explicit instruction to name a
  concrete entry point (file path, function, endpoint, component) and to
  state *why*, not just *what* — a junior reader has no meeting-room context
  to fall back on. Source: Tatham's "show me how to show myself"
  ([bugs.html](https://www.chiark.greenend.org.uk/~sgtatham/bugs.html)),
  Google's why-not-just-what CL description rule
  ([cl-descriptions.html](https://google.github.io/eng-practices/review/developer/cl-descriptions.html)).

- **Sub-issue/task → Acceptance criteria**: add a hard rule that the `Then`
  clause must name an **observable output** (API status/body, UI state,
  returned value) and never an internal implementation detail (a DB row, an
  internal function call). Source: Cucumber's Gherkin reference and
  "Writing better Gherkin" guide
  ([cucumber.io/docs/gherkin/reference](https://cucumber.io/docs/gherkin/reference/),
  [cucumber.io/docs/bdd/better-gherkin](https://cucumber.io/docs/bdd/better-gherkin/)).

- **Sub-issue/task → Acceptance criteria**: cap each Given/When/Then
  criterion at 3–5 clauses (G/W/T + a couple of `And`s), and cap the number
  of criteria per sub-issue at roughly 3–7 — beyond that, the ticket is
  probably not "Small" per INVEST and should be split into another
  sub-issue. Source: Cucumber's explicit "3-5 steps" recommendation
  ([reference](https://cucumber.io/docs/gherkin/reference/)); INVEST's
  "Small" criterion ([Agile Alliance](https://agilealliance.org/glossary/invest/),
  [Atlassian DoR](https://www.atlassian.com/agile/project-management/definition-of-ready)).

- **Sub-issue/task → Acceptance criteria**: replace the existing
  "never a subjective bar" rule's abstract phrasing with Atlassian's concrete
  rewrite pattern — vague ("looks good") → measurable ("300×300px",
  "returns 422", "completes in <2s"). Source: Atlassian's Acceptance
  Criteria guide, "Measurability" characteristic
  ([atlassian.com/work-management/.../acceptance-criteria](https://www.atlassian.com/work-management/project-management/acceptance-criteria)).

- **Sub-issue/task → Dependencies / related**: require naming *what*
  specifically is needed from the blocking issue (e.g. "the response shape
  of `POST /expenses` from #12"), not just "Blocked by #12" — a junior
  reader shouldn't have to open and re-read the other issue to know why the
  dependency exists. Source: INVEST's "Independent" criterion as the
  baseline expectation, made explicit for the case where independence isn't
  possible (Agile Alliance / Atlassian DoR, same links as above).

- **Feature parent issue → User story / Context**: keep the existing "User
  story" line as the Card, but make the Context section explicitly carry the
  Conversation — decisions and reasoning that would otherwise live only in a
  meeting or Slack thread a junior reader wasn't in. Source: Agile
  Alliance's 3 Cs (Card/Conversation/Confirmation) glossary entry for User
  Story ([agilealliance.org/glossary/user-stories](https://agilealliance.org/glossary/user-stories/)).

- **Bug template**: the existing symptom-vs-diagnosis rule is already
  well-aligned with Tatham; add one line reinforcing "be verbose, not
  terse" (extra detail costs the reader nothing; missing detail costs a
  round-trip) and a note against ambiguous pronouns ("it", "this") in Steps
  to reproduce / Actual. Source: Tatham, "Be verbose" and "Be careful of
  pronouns" sections ([bugs.html](https://www.chiark.greenend.org.uk/~sgtatham/bugs.html)).

- **draft-tickets/SKILL.md (optional, process-level)**: consider a
  lightweight "ready to hand to a junior" gate before creating a sub-issue —
  does it pass INVEST (especially Independent + Small + Testable)? Source:
  Atlassian's Definition of Ready, which is explicitly built on INVEST
  ([atlassian.com/agile/.../definition-of-ready](https://www.atlassian.com/agile/project-management/definition-of-ready)).

---

## Findings by question

### 1. Ideal length/structure for a task-sized ticket

No source gives a single "N acceptance criteria is correct" number for a
ticket as a whole. But three independent anchors converge on "small, single
behavior, few criteria":

- **INVEST's "Small"** criterion: a story should be "small enough to fit
  within an iteration" — Bill Wake's original formulation, glossed by Agile
  Alliance as: *"S — Small (so as to fit within an iteration)"*
  ([agilealliance.org/glossary/invest](https://agilealliance.org/glossary/invest/)).
  Atlassian's Definition of Ready page operationalizes the same idea: *"The
  work must be manageable. If a task is complex, you should be able to break
  it down into smaller ones. Doing so prevents fire drills... and your team
  won't burn out."*
  ([atlassian.com/agile/.../definition-of-ready](https://www.atlassian.com/agile/project-management/definition-of-ready)).

- **Google's Small CLs guidance** gives the only concrete numeric anchor
  found across all sources, for the analogous unit (a code change instead
  of a ticket): *"100 lines is usually a reasonable size for a CL, and 1000
  lines is usually too large."* The reasoning transfers directly to ticket
  scoping: *"It's easier for a reviewer to find five minutes several times
  to review small CLs than to set aside a 30 minute block to review one
  large CL,"* and *"it's better to err on the side of writing CLs that are
  too small vs. CLs that are too large."*
  ([google.github.io/eng-practices/review/developer/small-cls.html](https://google.github.io/eng-practices/review/developer/small-cls.html)).
  A ticket whose implementation would need a CL near or above that ceiling
  is a signal the ticket itself is too big — this is a proxy metric the pm
  role could actually use ("does this sub-issue look like a >1 file,
  >100-line change? if so, split it").

- **Cucumber's step-count guidance** is the most directly reusable number
  for acceptance-criteria structure: *"You can have as many steps as you
  like, but we recommend 3-5 steps per example. Having too many steps will
  cause the example to lose its expressive power as a specification and
  documentation."*
  ([cucumber.io/docs/gherkin/reference](https://cucumber.io/docs/gherkin/reference/)).
  Applied to this repo's Given/When/Then acceptance criteria: each
  criterion should read as Given + When + Then plus at most one or two
  `And`s — not a paragraph-length compound condition.

- **When does more detail help vs. hurt?** Tatham's essay is explicit that
  for *facts the reader cannot reconstruct* (what happened, exact error
  text, exact steps), more is strictly better: *"Give more information
  rather than less. If you say too much, the programmer can ignore some of
  it. If you say too little, they have to come back and ask more
  questions."* ([bugs.html](https://www.chiark.greenend.org.uk/~sgtatham/bugs.html)).
  But this is scoped to *reproducible facts*, not to padding a ticket with
  restated context or redundant criteria — Cucumber's "too many steps ...
  lose[s] expressive power" and INVEST's "Small" pull the other way for
  *structure*. The synthesis: be exhaustive about concrete, load-bearing
  facts (paths, exact text, exact commands); be minimal about structural
  scaffolding (criteria count, steps per criterion, sections).

- **GitHub's own guidance** on issue structure is thin (GitHub does not
  publish a dedicated "how to write a good issue" doc analogous to Google's
  eng-practices), but its one clear structural rule is decomposition:
  *"Breaking a large issue into smaller issues makes the work more
  manageable and enables team members to work in parallel. It also leads to
  smaller pull requests, which are easier to review,"* and native sub-issues
  exist precisely to let teams "break down tasks into exactly the amount of
  detail that you and your team require."
  ([docs.github.com/.../best-practices-for-projects](https://docs.github.com/en/issues/planning-and-tracking-with-projects/learning-about-projects/best-practices-for-projects)).
  This directly validates this repo's existing parent+sub-issue split rule
  in `issue.md` step 3 — it isn't just a repo convention, it's what GitHub's
  own docs recommend as the mechanism for right-sizing.

### 2. What concretely differs, writing for a junior vs. senior reader

None of the six sources use the word "junior" — this is a synthesis, but
every point below traces to a specific, quotable rule:

- **Explicit entry points over assumed familiarity.** Tatham's core
  instruction for showing a problem to someone who wasn't there: *"tell
  them exactly what you did. If it's a graphical program, tell them which
  buttons you pressed and what order you pressed them in."*
  ([bugs.html](https://www.chiark.greenend.org.uk/~sgtatham/bugs.html)). A
  senior reader can infer "the auth middleware" from a one-line mention; a
  junior reader needs `src/middleware/auth.ts`. This is squarely a
  Description-section instruction, not an acceptance-criteria one.

- **State the "why," because the reader lacks institutional context.**
  Google's CL-description guidance frames this as writing for a reader
  *without* your current context: *"Future developers will search for your
  CL based on its description,"* and the description must cover not just
  what changed but the reasoning, because *"Reading source code may reveal
  what the software is doing but it may not reveal why it exists."*
  ([cl-descriptions.html](https://google.github.io/eng-practices/review/developer/cl-descriptions.html)).
  A junior implementer is in exactly the position of Google's "future
  developer" — they weren't in the planning conversation, so the ticket has
  to carry the Conversation in writing (see the 3 Cs finding below).

- **Avoid pronouns and unclear references.** Tatham, on ambiguity: *"Don't
  use words like 'it', or references like 'the window', when it's unclear
  what they mean"* — and explicitly recommends being "longer and more
  repetitive" if that's what clarity costs
  ([bugs.html](https://www.chiark.greenend.org.uk/~sgtatham/bugs.html)). A
  senior reader disambiguates from context automatically; spelling every
  referent out removes that dependency.

- **Behavior-level language, not implementation mechanics, inside
  acceptance criteria specifically.** Cucumber's declarative-style guidance
  says to keep scenario wording at the level of user-visible behavior:
  *"By avoiding terms like 'click a button' that suggest implementation,
  the scenario is more resilient,"* and the test for whether something
  belongs in a scenario is *"Will this wording need to change if the
  implementation does?"*
  ([cucumber.io/docs/bdd/better-gherkin](https://cucumber.io/docs/bdd/better-gherkin/)).
  This appears to cut against "be maximally explicit for juniors," but it
  doesn't — it's scoped to a different part of the ticket. The refinement:
  explicit *entry points* (file paths, endpoint names) belong in
  Description; acceptance criteria stay declarative/behavioral so they
  don't rot when implementation details shift and so QA can execute them
  without reading code.

- **One behavior per criterion.** This is implicit across three sources:
  Cucumber's 3-5-step ceiling per scenario, Atlassian's "Independence"
  characteristic of good acceptance criteria (*"Each criterion should stand
  on its own... If criteria rely on one another to make sense, you probably
  need to rewrite them"* —
  [atlassian.com/work-management/.../acceptance-criteria](https://www.atlassian.com/work-management/project-management/acceptance-criteria)),
  and Google's "one self-contained change... addresses just one thing" for
  CLs. A junior reader benefits disproportionately from this because
  compound criteria force them to hold multiple unstated assumptions in
  their head to know when they're actually done.

### 3. Phrasing acceptance criteria so a junior can self-verify

The repo's existing Given/When/Then mandate holds up well against the
sources, with two concrete refinements surfaced by research:

- **Given/When/Then's structural rationale is exactly right** — Cucumber
  frames the three keywords as boundaries, not decoration: steps should
  *"Describe an initial context (Given steps)... an event (When steps)...
  an expected outcome (Then steps)"*
  ([cucumber.io/docs/gherkin/reference](https://cucumber.io/docs/gherkin/reference/)).
  Separating these three removes exactly the kind of ambiguity a junior
  reader can't resolve on their own (what state do I need first, what do I
  do, how do I know it worked).

- **Refinement — the `Then` clause must be an observable output, not
  internal state.** Cucumber is explicit: *"An outcome should be on an
  observable output. That is, something that comes out of the system
  (report, user interface, message), and not a behaviour deeply buried
  inside the system (like a record in a database)."*
  ([cucumber.io/docs/gherkin/reference](https://cucumber.io/docs/gherkin/reference/)).
  This repo's example (`Then the API returns 422 and no record is created`)
  already partly violates this — "no record is created" is internal-state
  language. A junior can self-verify an HTTP status and response body
  without DB access; they usually can't self-verify "no record was
  created" without being taught how to query the DB first. Suggest
  splitting or rephrasing toward what's externally observable
  (e.g. a subsequent `GET` confirms the record doesn't appear) when the
  DB-state check is unavoidable.

- **Refinement — quantify wherever a number exists.** Atlassian's
  Measurability characteristic: *"Whenever possible, quantify expectations
  to create a definitive pass/fail threshold... Replace vague statements
  like: 'The results page should look good' [with] 'Each product image
  displays at a minimum resolution of 300×300 pixels.'"*
  ([atlassian.com/work-management/.../acceptance-criteria](https://www.atlassian.com/work-management/project-management/acceptance-criteria)).
  This repo already bans subjective bars ("code is clean," "performance is
  good") — the addition here is the concrete rewrite pattern to point
  authors at, not just the prohibition.

- **Testability as the acid test.** Both Atlassian (*"Every criterion must
  be objectively verifiable. Each criterion should map cleanly to one or
  more executable tests"*) and INVEST's "Testable" (*"in principle, even if
  there isn't a test for it yet"* —
  [agilealliance.org/glossary/invest](https://agilealliance.org/glossary/invest/))
  converge on the same bar this repo already states
  ("verifiable by execution"). No refinement needed here — the sources
  confirm the existing rule is correctly calibrated.

### 4. Concrete anti-patterns

- **Vague/subjective verbs and bars.** Atlassian names this directly:
  *"looks good," "should work well"* — replace with measurable thresholds
  ([acceptance-criteria](https://www.atlassian.com/work-management/project-management/acceptance-criteria)).

- **Diagnosis presented as fact.** Tatham's core bug-report distinction:
  *"try to make very clear what are actual facts... and what are
  speculations"* — a diagnosis stated as if it were the symptom sends the
  implementer chasing the wrong cause
  ([bugs.html](https://www.chiark.greenend.org.uk/~sgtatham/bugs.html)).
  This repo's bug template already separates Actual (observed) from any
  hypothesis, correctly.

- **Ambiguous pronouns / unnamed referents** ("it", "this", "the window")
  — Tatham, same source as above.

- **Acceptance criteria that check implementation internals instead of
  observable outcomes** ("a row is added to the users table" instead of
  "the user sees a confirmation message") — Cucumber's observable-output
  rule, cited above.

- **Compound / non-independent criteria** that silently bundle two
  behaviors into one checkbox — Atlassian's Independence characteristic,
  cited above; a junior reader who ships behavior A but misses embedded
  behavior B has no signal they're not actually done.

- **Tickets sized past what one reviewer can hold in their head at once**
  — Google's small-CL reasoning generalizes directly: oversized units
  "cause frustration, leading reviewers to miss important feedback," the
  ticket equivalent being a junior implementer missing requirements buried
  deep in a long body
  ([small-cls.html](https://google.github.io/eng-practices/review/developer/small-cls.html)).

- **Undeclared dependencies.** INVEST's "Independent" flags coupling
  between tickets as a quality defect, not a neutral fact — when it's
  unavoidable (this repo's backend-blocks-frontend case), the fix is to
  state *what* is depended on, not just *that* a dependency exists.

---

## Suggested template changes to `setup/references/commands/issue.md`

Research-only — not applied here. Concrete deltas for whoever edits the
file next:

1. **Sub-issue/task → `## Description`**: append a line: *"Name a concrete
   entry point — file path, function, endpoint, or component — to start
   from. State why this is needed, not only what to build; the reader may
   not have been in the discussion that decided this."*

2. **Sub-issue/task → the Given/When/Then paragraph**: add two sentences
   after the existing example: *"Keep each criterion to 3–5 clauses
   (Given/When/Then plus at most one or two Ands) — more, and the criterion
   stops reading as a single testable behavior (Cucumber). The Then clause
   must name an observable output (a response, a UI state, a returned
   value) — never an internal implementation detail like a database row."*

3. **Sub-issue/task → Acceptance criteria section header**: add a soft
   ceiling: *"Aim for roughly 3-7 acceptance criteria. Needing more usually
   means the sub-issue covers more than one behavior — split it instead of
   padding this one."*

4. **Sub-issue/task → the "never a subjective bar" sentence**: extend with
   the rewrite pattern: *"— e.g. not 'the page looks good' but 'the hero
   image renders at ≥300×300px'; not 'it's fast' but 'the endpoint responds
   in <200ms at p95'."*

5. **Sub-issue/task → `## Dependencies / related`**: change the example
   from `"Blocked by #<backend sub-issue>"` to require the *what*: *"Blocked
   by #<n> — needs `<specific contract, e.g. the response shape of POST
   /expenses>`."*

6. **Feature parent issue → `## Context`**: add one sentence clarifying its
   job: *"This is where the Conversation lives — decisions and tradeoffs
   the team already discussed. A reader who wasn't in that discussion should
   still be able to follow the reasoning from this section alone."*

7. **Bug template**: after the existing "Report symptoms, not diagnoses"
   sentence, add: *"When in doubt, include more detail rather than less —
   the reader can skip what they don't need but can't invent what's
   missing. Name things explicitly (the exact field, button, or endpoint)
   instead of 'it' or 'this'."*

8. **`draft-tickets/SKILL.md`, optional**: before "Propose the full
   breakdown... to the user," add a one-line self-check gate: *"Each
   sub-issue should be Independent, Small, and Testable (INVEST) before
   it's proposed — if a sub-issue depends on unstated context or covers more
   than one behavior, split or rewrite it first."*
