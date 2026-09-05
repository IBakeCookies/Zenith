# The table that went back to a row

**Kind:** feature · **Status:** landed 2026-09-05 · **Roadmap:** none

Frozen at land: this file says what was decided on the date it carries, never
how the code works today — that is MATH.md and the area `AGENTS.md`. When later
work changes the behaviour, it writes its own feature file; it does not edit
this one. Same status as [zenith.md](../../zenith.md), for the same reason.

## Goal

A task reads as one row of prose again, not as a set of cells to line up against
the tasks above it. Twelve headed columns became six over two weeks and a phone
still had to drag the ledger sideways to reach the delete button, so
[the row that became a table](the-row-that-became-a-table.md) is reversed: both
screens go back to `<li>`s in a `<ul>`, laid out as two blocks —

```
#N ☑ title BADGE ------------------------------ hours ⚡ 🪫 ✎ ✕
P·M·E | effort · stop by · prio   ⚡45m  🪫6/2  🪫4/1
```

— with the second line wrapping as one flow rather than as columns that have to
agree with the row above.

Two things carry over from the table and are not undone: the ✎/✕ controls stay
always visible (the hover-revealed strip is not coming back), and every
measurement is still read, corrected and dropped on the row it belongs to.

## Scenarios

Written after the implementation rather than before it — this change came in as
a drawing in the user's own message, refined four times against what the browser
actually showed, so the acceptance criteria settled in the same passes the code
did. Every line names the file its test lands in.

### Scenario — `/`'s ledger is a list of rows, not a table

- `task-list.stories.svelte` — the card renders a `<ul>` and no `<table>`.
- `task-list.stories.svelte` — a split day renders two `<ul>`s.

### Scenario — the plan's two groups are named lists, not headed ones

- `task-list.stories.svelte` — the group label is a `<p>`, and the list it names
  carries that name as its accessible name.
- `task-list.stories.svelte` — the funded rows are in the first list.
- `task-list.stories.svelte` — the dropped rows are in the second.

### Scenario — one row prints its readings as a sentence

- `task-item.stories.svelte` — `P 2 · M 8 · E 7` reads on the detail line.
- `task-item.stories.svelte` — `effort`, `flow @` and `stop by` read on the same
  line.
- `task-item.stories.svelte` — `prio 12.4` reads after them.

### Scenario — the hours take the right end of the title's line

- `task-item.stories.svelte` — the plan's hours read beside the title.
- `energy-task-row.stories.svelte` — the Lab's hours read in the same place.

### Scenario — a phone keeps the plan and drops the readings

- `tasks.e2e.ts` — at 390px the run order is visible.
- `tasks.e2e.ts` — the hours are visible.
- `tasks.e2e.ts` — ✎ and ✕ are visible.
- `tasks.e2e.ts` — the detail line exists and is hidden.
- `tasks.e2e.ts` — the document does not scroll sideways.

### Scenario — a row with no readings prints no empty detail line

- `task-item.stories.svelte` — a task with no ⚡ and no 🪫 renders the line only
  from `sm`.

### Scenario — a past day's row prints no empty control box

- `task-item.stories.svelte` — with no instrument and no editor handler, the
  right end of the title's line holds the hours alone.

### Scenario — ϕ prints its band the same way on the row and the day strip

- `day-timeline.test.ts` — a block carries the fit's spread only once there is a
  fit.
- `day-timeline.stories.svelte` — a fitted block reads `flow @ 1h 15m ± 21m`.
- `task-item.stories.svelte` — the row reads the same spelling.

### Scenario — the nav's labels survive one breakpoint longer

- `nav.stories.svelte` — the label is gated at `md`.

## Out of scope

- **The row's content.** Every reading the table printed is still printed; this
  change moves them, it does not add or drop one. The one exception is the
  `Logged` header, which was a column heading and has nothing to head now.
- **The three editor forms.** `FlowLogForm`, `DrainLogForm` and `TaskEditForm`
  move out of a spanning `<tr>` and into the `<li>` unchanged.
- **`/energy`'s schedule list.** It renders its own `<li>`s and never went
  tabular; only the Lab's task rows are in this change.
- **The day strip's own layout.** It keeps its sideways scroll — it is the one
  place on either task screen that still scrolls at all, and a scrolling strip
  of hours is not a scrolling ledger of tasks.
- **Renaming `isConstantsFitted`.** The row's ϕ band is gated on it and the
  state layer spells the same flag `constantsFitted`; that is an AGENTS.md §2
  rename with its own blast radius, not a layout change.

## Read before building

- `src/lib/presentation/component/task-row-shell.svelte` — the shell. It becomes
  an `<li>` holding two blocks and, when a draft is open, the editor beneath
  them. `columnCount` dies with the `colspan` it existed for.
- `src/lib/presentation/component/task-item.svelte` and
  `energy-task-row.svelte` — the two callers' snippets. `trailing` is renamed
  `planned`, because it is no longer "whatever comes last" but one named reading
  both screens put in the same place.
- `src/lib/presentation/component/task-list-card.svelte` and
  `task-list.svelte` — the card owns the `<ul>` and the two-group split again.
- `src/lib/presentation/utils/ledger-column.ts` — the column set. Deleted; it
  has no caller once the tables go.
- `src/lib/presentation/style/tokens.css` — the `@utility` block the ledger's
  cells and headers used.
- `src/lib/presentation/utils/duration-format.ts` — `formatDuration`. The row
  and the strip both print ϕ, so the ± spelling belongs beside it, not in either
  caller (R3).
- `src/lib/presentation/AGENTS.md` — "The row's layout", "A phone keeps the
  plan", "Every reading keeps its tooltip" and the R3 section all describe the
  table and are corrected in the same commit (AGENTS.md §0).
- `messages/*.json` — the seven `list_column_*` keys, in all five locales.
- `e2e/helpers.ts` — `taskRow`. It is the one place the e2e suite decides what a
  row IS, so the `<tbody>` → `<li>` move is one edit there rather than one per
  spec.

## Decisions

- **Back to `<li>`, not to a narrower table.** Cutting columns had already been
  tried twice, from twelve to six, and the sixth cut still left a phone dragging
  the ledger sideways. The reason is structural rather than a matter of degree:
  a table makes every row agree on a width, so the widest task's title sets the
  narrowest phone's layout. A row that wraps owes the row above it nothing.
  Rejected: `display: block` on the table at a breakpoint, which keeps the
  markup's promise of a comparison the layout no longer delivers.

- **The detail line wraps as one flow, PME and logged chips together.** The user
  asked for this directly after seeing them split across two lines: the chips
  are readings about the task exactly as `P·M·E` is, and a line break between
  them reads as a change of subject.

- **A phone hides the readings half and keeps the chips.** Seven figures at
  `text-2xs` wrap to three lines on a 390px screen and bury the hours, which are
  what the screen is for; the chips stay because they are what the row recorded,
  and ✎ is where a phone re-reads the three sliders. Rejected: shrinking the
  type further, which fails contrast; and a disclosure toggle, which is a
  control on every row to reveal what `✎` already shows.

- **The group label is a `<p>` naming a `<ul>`, not an `<h4>`.** Every row title
  is an `<h3>`, so an `<h4>` above the rows would be closed by the first one and
  the second group would read as part of the last task. `aria-label` on the list
  carries the name instead, which is what a screen reader announces on entering
  it. Rejected: `<h4>` with the rows demoted to `<h4>`-level titles, which makes
  every task a sibling of the group it is in.

- **ϕ prints its band in one helper, `formatDurationBand`.** The row said
  `flow @ 1h ± 21m` and the day strip said `flow at 1h` for the same quantity —
  R3's mirrors case. One spelling, in `duration-format.ts`, beside the rounding
  it already owns. The band prints only where there is a fit: `± undefined` is
  worse than no band, and a band on an unfitted default is a claim nothing
  measured.

- **Only the arrival sentence gets the band, and it carries the band as text
  colour.** The sentence and the bar under it are one reading, so they share one
  hue; a solid chip behind the words was built and rejected on sight. Band ink at
  `text-2xs` on the block's recessed fill measures under 4.5:1 on about half the
  46-theme catalogue, and it ships anyway — the `sr-only` band word and the bar's
  own proportion are what carry the reading without colour (WCAG 1.4.1). Every
  block prints the sentence at every width, truncating rather than dropping it,
  so the strip on screen and the strip a screen reader walks are the same strip.

- **The control group renders only when the row has a control.** A past day
  passes no instrument and no editor handler, and an empty box in their place
  takes the right end of the line the hours are meant to hold.

- **The nav's text-to-icon switch moves `sm:` → `md:`.** At 640px the labels
  still fit and reading "Today" beats decoding a glyph; the switch was one
  breakpoint eager. No new breakpoint — Tailwind's own next step down.

## Open questions

None.
