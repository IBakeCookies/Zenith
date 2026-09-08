# The strip that moved onto its rows

**Kind:** feature · **Status:** landed 2026-09-08 · **Roadmap:** none

Frozen at land: this file says what was decided on the date it carries, never
how the code works today — that is MATH.md and the area `AGENTS.md`. When later
work changes the behaviour, it writes its own feature file; it does not edit
this one. Same status as [zenith.md](../../zenith.md), for the same reason.

## Goal

On `/`, the day is drawn twice: a strip of boxed blocks above the ledger, each
repeating the title, run position, hours and flow verdict of the row beneath
it, and the ledger itself. After this, the strip is gone and each funded row
carries its own thin rail on one shared hour scale: hatched while the task is
warming up toward flow, solid once it is in flow, a dashed ghost for the time
flow would still have needed, and a faint segment for the switch cost that
follows it. The flow verdict moves onto the row's meta line. A day of any
length fits the card's width and nothing on the screen scrolls sideways.

Nothing about the day moves: widths, offsets, gaps and run slots are what the
strip drew, laid on the rows instead of above them.

## Scenarios

### Scenario — a block splits into warm-up, in-flow and ghost hours

`src/lib/presentation/utils/day-timeline.test.ts`

- **Given** a funded task allocated 1 h with a time-to-flow of 1.1 h
- **When** the timeline is built
- **Then** its block has `warmupHours: 1`
- **Then** its block has `inFlowHours: 0`
- **Then** its block has `ghostHours` of 0.1 (to the printed minute)

### Scenario — a block past flow has no ghost

`src/lib/presentation/utils/day-timeline.test.ts`

- **Given** a funded task allocated 1.5 h with a time-to-flow of 1 h
- **When** the timeline is built
- **Then** its block has `warmupHours: 1`
- **Then** its block has `inFlowHours: 0.5`
- **Then** its block has `ghostHours: 0`

### Scenario — every block but the last carries the switch cost

`src/lib/presentation/utils/day-timeline.test.ts`

- **Given** three funded tasks in run order, a switch cost of 0.25 h
- **When** the timeline is built
- **Then** the first two blocks have `switchHours: 0.25`
- **Then** the last block has `switchHours: 0`

### Scenario — consecutive blocks are still separated by the switch cost (pin)

`src/lib/presentation/utils/day-timeline.test.ts`

- **Given** two funded tasks, the first allocated 1 h, a switch cost of 0.25 h
- **When** the timeline is built
- **Then** the second block's `startOffset` is 1.25

### Scenario — a rail short of flow is hatch and ghost, no solid

`src/lib/presentation/component/day-rail.stories.svelte`

- **Given** a 3 h day, a block at offset 0, allocated 1 h, time-to-flow 1.1 h
- **When** the rail renders
- **Then** its warm-up segment is one third of the track wide
- **Then** its ghost segment follows the warm-up segment
- **Then** it has no in-flow segment

### Scenario — a rail past flow is hatch then solid, no ghost

`src/lib/presentation/component/day-rail.stories.svelte`

- **Given** a 3 h day, a block allocated 1.5 h, time-to-flow 1 h
- **When** the rail renders
- **Then** its warm-up segment is one third of the track wide
- **Then** its in-flow segment is one sixth of the track wide
- **Then** it has no ghost segment

### Scenario — a rail draws its switch cost after the block

`src/lib/presentation/component/day-rail.stories.svelte`

- **Given** a block with `switchHours: 0.25` on a 3 h day
- **When** the rail renders
- **Then** a switch segment one twelfth of the track wide follows the block

### Scenario — the last block draws no switch segment

`src/lib/presentation/component/day-rail.stories.svelte`

- **Given** a block with `switchHours: 0`
- **When** the rail renders
- **Then** it has no switch segment

### Scenario — a rail that runs past the day's end is clipped

`src/lib/presentation/component/day-rail.stories.svelte`

- **Given** a 3 h day, a block at offset 2 h allocated 1.5 h
- **When** the rail renders
- **Then** no segment's right edge lies beyond the track's right edge

### Scenario — a finished block's rail dims

`src/lib/presentation/component/day-rail.stories.svelte`

- **Given** a block with `isCompleted: true`
- **When** the rail renders
- **Then** the rail carries `opacity-60`

### Scenario — every segment names itself without colour

`src/lib/presentation/component/day-rail.stories.svelte`

- **Given** a block short of flow with a switch cost
- **When** the rail renders
- **Then** each of its segments holds an `sr-only` name (warming up, what flow
  still needs, switch)

### Scenario — the axis prints one tick per hour

`src/lib/presentation/component/day-timeline.stories.svelte`

- **Given** a 3 h day with one funded block
- **When** the axis renders
- **Then** it reads `0h`, `1h`, `2h`, `3h`

### Scenario — the axis still says when nothing is funded (pin)

`src/lib/presentation/component/day-timeline.stories.svelte`

- **Given** a day with tasks and no funded block
- **When** the axis renders
- **Then** it reads "Nothing is funded today"

### Scenario — the axis carries no time of day (pin)

`src/lib/presentation/component/day-timeline.stories.svelte`

- **Given** a 3 h day
- **When** the axis renders
- **Then** it holds no `hh:mm` text

### Scenario — the legend prints the day's real switch cost

`src/lib/presentation/component/day-legend.stories.svelte`

- **Given** a switch cost of 0.75 h
- **When** the legend renders
- **Then** its fourth item reads `45m switch`

### Scenario — a funded open row short of flow prints its verdict on the meta line

`src/lib/presentation/component/task-item.stories.svelte`

- **Given** an open task allocated 1 h with a time-to-flow of 1.1 h, run position 1
- **When** the row renders
- **Then** its meta line reads `short of flow by 6m`
- **Then** that text carries `BAND_TEXT_CLASS.warning`

### Scenario — a row that reaches flow prints no verdict

`src/lib/presentation/component/task-item.stories.svelte`

- **Given** an open task allocated 1.5 h with a time-to-flow of 1 h
- **When** the row renders
- **Then** its meta line holds no `short of flow`

### Scenario — a funded row carries a rail

`src/lib/presentation/component/task-item.stories.svelte`

- **Given** an open task with a block
- **When** the row renders
- **Then** a rail renders under the row's two columns

### Scenario — an unfunded row carries no rail

`src/lib/presentation/component/task-list.stories.svelte`

- **Given** a split day, one task in the unfunded group
- **When** the list renders
- **Then** the unfunded row holds no rail

### Scenario — a completed row keeps its rail and drops its verdict (pin on the drop)

`src/lib/presentation/component/task-item.stories.svelte`

- **Given** a completed task with a block short of flow
- **When** the row renders
- **Then** its rail is visible
- **Then** its meta line holds no `short of flow`

### Scenario — the Plan card lists no strip above the ledger

`e2e/task-list.e2e.ts`

- **Given** a fresh profile with a budget of 3 h and one task `Deep work`
- **When** `/` renders
- **Then** `#1 Deep work` appears exactly once on the page

### Scenario — the document never scrolls sideways, on a long day on a phone

`e2e/task-list.e2e.ts`

- **Given** a 390px viewport, a budget of 12 h, four funded tasks
- **When** `/` renders
- **Then** the document's scroll width equals its client width
- **Then** `Deep work`'s row shows its rail

### Scenario — ticking a task off dims its rail

`e2e/task-list.e2e.ts`

- **Given** the one-task day, `Deep work` funded
- **When** `Mark Deep work complete` is checked
- **Then** `Deep work`'s rail carries `opacity-60`

### Scenario — a past day draws the rails it was planned under

`e2e/day-navigation.e2e.ts`

- **Given** a task planned today, the clock moved a day forward, `/?date=` that day
- **When** the page renders
- **Then** `Deep work`'s row shows its rail
- **Then** the page holds no `hh:mm` text

## Out of scope

- **Mock B, the one-line strip.** Considered and rejected in Decisions; nothing
  of it is built.
- **`/energy`'s `plan-timeline-bar` and `plan-schedule-list`.** The Lab draws
  the energy optimizer's own blocks in the series palette; it shares nothing
  with the rail but `formatDuration` and `formatOffset`. Untouched.
- **The row's phone readings rule.** The meta line's readings half stays
  `hidden sm:flex`; the verdict sentence lives in it and hides with it. The
  rail and the axis stay on a phone (interview, 2026-09-08).
- **Time of day.** The axis is offsets from the day's zero, as settled
  (`presentation/AGENTS.md`, "carries no clock"). No start time, no finish.
- **The mid-day re-plan's `remaining` reading.** The rail draws the plan the
  allocator made, never the re-plan's hours.
- **A hero panel for the NEXT task** (canvas artboard B — Now first). Separate
  idea, separate spec if ever.

## Read before building

- `src/lib/presentation/AGENTS.md` — "The day's strip reads inside the Plan
  card, and carries no clock" is rewritten by this change (strip → axis + rails
  - legend; `minimumBlockWidths`, the floor, drag-scroll and the sideways
    scroll all go). "The row's layout" gains the rail as the row's third line,
    under both columns, and the verdict on the meta line. "Components" for the
    shell's snippet contract; this adds `rail` to `task-row-shell` and `foot` to
    `task-list-card`, both public exports.
- `src/lib/presentation/utils/day-timeline.ts` — the geometry util. `DayBlock`
  gains `warmupHours`, `inFlowHours`, `ghostHours`, `switchHours`; `DayTimeline`
  loses `minimumBlockWidths`. Its test file loses the three
  minimum-block-width cases.
- `src/lib/presentation/component/day-timeline.svelte` and its stories — becomes
  the axis. Keeps the `sr-only` "The day" heading and `day_timeline_empty`.
- `src/lib/presentation/component/task-row-shell.svelte` — where the rail slot
  goes: a full-width line under the two-column flex, inside the `<li>`, same
  horizontal padding as the axis so `0h` aligns with offset zero.
- `src/lib/presentation/component/task-item.svelte` — takes `block?: DayBlock`
  and `totalHours`, renders the rail into the shell's slot, prints the verdict
  in `meta` after `prio`. `getBandFlowReached` from `utils/band.ts` colours it.
- `src/lib/presentation/component/task-list.svelte` and
  `task-list-card.svelte` — pass `timeline` down to the rows; a new `foot`
  snippet after the list for the legend, threaded like `strip`.
- `src/routes/(app)/+page.svelte` — builds `timeline` already; renders the axis
  in `strip` and the legend in `foot`.
- `src/lib/presentation/utils/drag-scroll.ts` — delete; the strip was its only
  caller.
- `src/lib/presentation/style/tokens.css`, `base.css` — `--spacing-day-block` /
  `--spacer-day-block` go with the floor. The hatch is a `repeating-linear-gradient`
  no Tailwind class expresses: one `@utility` (STYLE.md, "A repeated cluster
  becomes an `@utility`"), used by the rail and the legend swatch. Segment
  classes live in ONE record beside the util so rail and legend cannot drift.
- `src/lib/presentation/style/STYLE.md` — tokens section, for the flow hue
  family (`flow`, `flow-tint`, `flow-line`) the segments draw in; contrast
  scripts if a new fill goes under text (none is planned).
- `messages/*.json` (five locales) — four new legend keys; `day_timeline_done`
  becomes dead and goes. `flow_reached` stays: `task-form-preview.svelte` prints
  it. `flow_short` moves to the row.
- `e2e/day-navigation.e2e.ts` — "a past day draws the strip it was planned
  under" locates the strip by its heading and asserts `#1 Deep work` inside it;
  rewrite against the row's rail.
- `docs/testing.md` — test levels; story `play` conventions.
- `docs/design.md` — before splitting axis / rail / legend into three files.

## Decisions

- **Mock A over mock B.** A removes every duplicated reading (title, `#N`,
  hours, verdict) and the sideways-scroll machinery: text no longer lives inside
  a block, so a 15-minute block on a 12-hour day is a thin bar, not an
  unreadable one. Rejected: B, the one-line strip — it keeps the label-in-block
  problem, the minimum-width floor and the scroll, and its dashed ghost has no
  room because the next block sits where the tail would go.
- **The geometry stays in the util, extended.** Warm-up, in-flow, ghost and
  switch are four more numbers on `DayBlock`, tested there (R2). Rejected:
  `min`/`max` arithmetic in the rail's markup, which is the `$derived`-in-markup
  the util exists to prevent.
- **The switch cost is drawn, not left as empty track.** A faint segment the
  width of the switch cost after every block but the last. The last block's gap
  led nowhere and was never visible in the strip either. Rejected: empty track,
  because a gap on a rail three rows from the next rail is not readable as a
  thing (interview).
- **One flow hue on every rail; the band lives in the verdict sentence.** Hatch
  and solid separate warm-up from in-flow without colour (WCAG 1.4.1), so the
  band no longer needs to be the fill. The sentence carries `BAND_TEXT_CLASS`
  on the meta line, where band text already sits at a size and on a surface
  that measure. Rejected: band-coloured rails, which put four hues on a picture
  whose grammar is pattern; and both, which says one thing twice (interview).
  **Amended at land (2026-09-08, Shadi):** the rail is band-coloured after all,
  and the decision above survives only in where the WORDS go. In flow takes the
  success fill (`BAND_BAR_CLASS.success`, the green the strip's bar had), and
  warm-up and ghost take `BAND_HATCH_CLASS[band]` — amber short of flow, green
  once reached — so a rail reads as one hue rather than mixing the flow hue into
  its tail. The `hatch` utility stripes in `currentColor` to make that one
  utility rather than one per band. The switch segment is grey (`ty-ghost`): it
  is not the task's time. The legend's warm-up key is grey too, because both
  bands warm up and a key cannot be either; its shortfall key stays amber, which
  is the only band a shortfall has.
- **A block that reaches flow prints no sentence.** `readings` already prints
  ϕ as `flow @ …`; `flow_reached` beside it would be the same figure twice. The
  solid segment is the reading. Rejected: keeping `flow_reached` on the row.
- **A completed row keeps its rail, drops its verdict.** The rail is the plan,
  which does not move when a box is ticked; the verdict is a reading of a task
  the plan is no longer ranking, so it goes with `planned` and `meta`
  ("A completed task drops its `planned` and `meta` readings entirely"). The
  mock shows readings on a completed row; the shipped rule wins.
- **The rail dims; nothing else marks it.** `opacity-60`, like the row's title.
  No `✓`, no `sr-only` "done": the row's checkbox announces its state, and the
  strip's `day_timeline_done` only existed because the block was a second
  reading of it. Rejected: `line-through` — there is no text on a rail.
- **An over-long block is clipped, not scrolled.** The track is
  `overflow-hidden`; a block past the day's end (switch costs push the last
  block past `availableHours`) loses its tail and the row's `planned` hours say
  its full length. Rejected: scaling the axis to the last block's end, which
  makes the day's `0h…Nh` a lie about the budget.
- **Four legend items, one line under the list, the switch printed as a
  duration.** A legend that says `15m switch` when the switch cost is 45 m is a
  legend about another day. Rejected: two items with hover for the rest, and no
  legend (interview).
- **The rail and the axis stay on a phone.** A thin line costs no height and is
  the one reading a phone can afford after the readings hide; the axis labels
  are `text-2xs` and hourly. Rejected: `hidden sm:block`, which leaves a phone
  with hours and no picture (interview). `e2e/task-list.e2e.ts` keeps pinning
  that the document does not scroll sideways.
- **Legend and axis are slots on the card, not children of the list.** The
  card is the two screens' shared frame; `/` fills `strip` and `foot`, the Lab
  fills `strip` with its ☕ editor and leaves `foot` empty. Rejected: rendering
  the legend from `task-list`, which would give the Lab's list a prop it never
  sets.
- **The verdict message stays `flow_short`.** Same copy the strip printed, one
  key fewer to translate.

## Open questions

None.
