---
name: plan
description: Interview the user and write the failing tests that define a Fallow change — e2e for a flow, a unit test or probe for a model or repair — with the build brief in the test file's header. Use when starting new work or fixing a known bug, before any code is written. Not about the app's own day planner.
---

# Planning a change

Output is the failing tests, and nothing else — no implementation, no
subagents, no branch. The tests are the spec: acceptance criteria that run, and
the whole input of `/build`. Assume that reader has none of this conversation.

Read AGENTS.md's **doc table**, **§0** and **§4**, and
[docs/testing.md](../../../docs/testing.md)'s R6 and level table. Not §1–§3:
those govern writing code, and this phase writes none. Never restate a rule
here; route to it.

## Kind picks the level

- **feature** — the user can see or do something they cannot now. One
  `e2e/<name>.e2e.ts`, named for the feature (testing.md), test titles in the
  user's words. **If it cannot be said in their words, it is not a feature** —
  do not stretch one; a repair dressed as a feature invents a user the change
  does not have.
- **model** — the solver computes something else; the outcome reaches the user
  with no click. A `*.test.ts` beside the module when the answer is a bound that
  must hold. When it is a number that moves, it is a probe — an instrument, not
  a test — so the brief names it (`scripts/<name>.probe.ts` → MATH.md §N) and
  `/build` writes it.
- **repair** — a figure, constant or doc disagreed with the code, and nothing
  shipped moves. A test where one can pin the agreement; where none can, there
  is nothing to plan — fix the doc (AGENTS.md §0).

An investigation with nothing to build has no plan. Its finding goes to the
file that owns the thing — MATH.md, the area `AGENTS.md`'s settled decisions,
the probe header — and ROADMAP.md collapses to a date and that link.

## Interview

Ask the user; do not infer. Batch questions with `AskUserQuestion`, and only
for things that change what gets built — routine calls are yours.

- the observable outcome — what the user sees or can do that they cannot now
- the state it depends on: which day, which logs, which fits (almost nothing in
  Fallow is stateless — the causal fit window alone means the same click gives
  different output on different data)
- the boundary — the nearby thing this is _not_
- empty, failed and first-run cases, which is where tests go missing

A known bug is one test: the reproduction is already arrange, act, assert.
Interview for the exact state it needs and write that. Restructuring with no
behaviour change is `/refactor`, not a plan.

## Writing the tests

- One behaviour per test, one observable per assertion. A test with an `and`
  in it can come back half-true.
- Every arrange is constructible against today's tree — a fresh profile, a
  seeded day, a fixture. A component that does not exist yet has no story to
  play against: its acceptance test is the e2e that drives the page, and the
  story arrives with the build as a fixture.
- Run each file and read the red. `npx playwright test e2e/<file>` for a flow,
  `npm run test:unit -- --run <path>` otherwise (`--project storybook` for a
  story); what each costs and what may not run alongside is in testing.md's
  five commands. **The red is the behaviour being absent** — a locator that
  finds nothing, a figure that reads wrong, a function that is not there. A
  typo, a fixture that cannot be arranged or a wrong locator is the test's own
  bug; fix it before finishing.
- A **pin** asserts what the change must not move, so it passes today. Watch it
  pass and list it under Pins, or `/build` reads a green test as one that never
  ran red.

## The brief

The header comment of the test file that carries the primary scenario — or,
in an existing file, the comment above the tests you added. The e2e files show
the shape: prose that says why the flow is worth driving.

```
/* <Goal — one or two sentences: for a feature, in the user's words; for a
   model, the number that moves; for a repair, that nothing shipped moves.>

   Tests: <every test file this plan wrote>
   Pins: <titles that pass today>
   Out of scope: <considered and left out, one line each>
   Read before building:
   - <path> — <why it matters here>
   - MATH.md §N — <the formula this touches>
   Decisions: <decided — why. Rejected <alternative>, because <reason>.>
   Roadmap: item N | none */
```

Everything under the Goal is `/build`'s input and is deleted at land (the build
skill says where each part goes), so write it for the implementer.

**Out of scope** is what stops the implementer building more than was asked
(AGENTS.md §0). **Read before building** is routing you resolve yourself, by
the doc table and by grepping for the code that owns the behaviour — files and
MATH.md sections, not areas; cite the area `AGENTS.md` when a public export is
added or moved, since that is where the repo prices its interfaces. A ROADMAP
item is a want, not a record of how the code works; when routing disproves one,
say so under Decisions and route to the ROADMAP line so `/build` corrects it.
**Decisions** carry the rejected half, which the code cannot show.

## Before finishing

- MATH.md changes? Name the section under Read before building.
- Re-opens a settled decision (AGENTS.md §4, the model rules, ROADMAP's
  not-proposed list)? Say so to the user and stop — those are closed.
- On the roadmap? Cite the item number; renumber nothing.
- Open questions answered, or stop and ask — the brief has no section for them.

Then show the test files and their titles, and say the build phase is
`/build <test file>`.
