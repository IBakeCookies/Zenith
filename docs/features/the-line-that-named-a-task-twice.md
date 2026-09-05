# The line that named a task twice

**Kind:** repair · **Status:** landed 2026-09-05 · **Roadmap:** item `none`

Frozen at land: this file says what was decided on the date it carries, never
how the code works today — that is MATH.md and the area `AGENTS.md`. When later
work changes the behaviour, it writes its own feature file; it does not edit
this one. Same status as [zenith.md](../../zenith.md), for the same reason.

## Goal

The mid-day re-plan's position 1 stops being a line on the Plan card's heading
row that spells the task's title — a title the row below prints again — and
becomes a **"Next" badge in that row's `lead`, beside its `#N`**. The answer to
"what do I do now" then rides the thing to act on, and the heading row is the
day's Load and Save alone.

`#N` and "Next" sit together because both mark a position in a plan; the badges
beside the title stay the task's own attributes. The two positions are read from
different bases and are not reconciled: `#N` is the whole-day plan's order and
stays the morning's answer, so `#4 NEXT` is the normal afternoon reading. Only
the tooltip changes to say so.

## Scenarios

### Scenario — the badge sits with `#N`, not with the attribute badges

`src/lib/presentation/component/task-item.stories.svelte`

- **Given** `runOrder: 4` and `isNext: true`
- **When** the row renders
- **Then** the "Next" badge is `#4`'s next sibling
- **Then** both precede the completion checkbox
- **Then** hovering "Next" opens the re-plan tooltip

### Scenario — the list badges the row the re-plan names

`src/lib/presentation/component/task-list.stories.svelte`

- **Given** the default day and `nextTaskId: 1`
- **When** the list renders
- **Then** the row for that task contains the "Next" badge
- **Then** that same row still reads `#3`

### Scenario — `/` reads the badge off the mid-day re-plan

`e2e/tasks.e2e.ts`

- **Given** two tasks, a budget, and the day's first 🪫 log
- **When** the Plan card renders
- **Then** exactly one row contains the "Next" badge
- **Then** the card's heading row contains no "Next"

## Out of scope

- Ordering the rows by the re-plan, or renumbering `#N` from it — the sequence
  is completion-invariant on purpose (presentation/AGENTS.md).
- Any second mark for "what now" on the heading row. In a list longer than a
  screen the badge has to be scrolled to; that cost was accepted rather than
  paid for with a duplicate reading.

## Doc routing

- `presentation/AGENTS.md` — the badge's placement rule and the two bases.
- `style/tokens.css` — `order-badge` now describes two badges on one row.
- The deleted `e2e/tasks.e2e.ts` truncation test pinned `next-up-line.svelte`'s
  `min-w-0`/`truncate` pair; with no title on the heading row there is nothing
  to elide, and the row's own title wraps.
