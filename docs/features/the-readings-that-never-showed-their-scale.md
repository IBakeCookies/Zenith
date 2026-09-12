# The readings that never showed their scale

**Kind:** feature · **Status:** landed 2026-09-12 · **Roadmap:** none

Frozen at land: this file says what was decided on the date it carries, never
how the code works today — that is MATH.md and the area `AGENTS.md`. When later
work changes the behaviour, it writes its own feature file; it does not edit
this one.

## Goal

On `/analytics` I can see how big each of the four headline readings is against
the thing it is measured on — 6 of 23 tasks, 1.5 of 20.8 hours, a streak of 0
against my longest of 11 — instead of a bare number I have to hold a
denominator for. The three extra readings worth keeping read without opening a
disclosure, and each tag's share of the range's logged hours reads as a bar
across the row.

Design source: the **Main** artboard of the 2026-09-12 Analytics Cards canvas
(direction A, "Readings on their scale"). Only its first two cards are in
scope.

## Scenarios

### Scenario — Tasks completed reads against what was planned

`e2e/analytics-stats.e2e.ts`

- **Given** a range whose days hold 23 planned tasks, 6 of them completed
- **When** the analytics page finishes loading
- **Then** the Tasks completed tile draws a `band-track` bar under its note
- **Then** that bar's fill is 26% wide

### Scenario — Logged hours reads against the hours planned

`e2e/analytics-stats.e2e.ts`

- **Given** the same range, with 1.5 🪫-logged hours against 20.8 planned
- **When** the analytics page finishes loading
- **Then** the Logged hours tile's bar fill is 7% wide
- **Then** its note reads `of 20.8 h planned`

### Scenario — The streak reads against the longest one in the range

`e2e/analytics-stats.e2e.ts`

- **Given** a range with a current streak of 0 and a longest streak of 5
- **When** the analytics page finishes loading
- **Then** the Current streak tile draws 5 pips
- **Then** none of them carries the fill class
- **Then** its note reads `longest 5 days`

### Scenario — A streak too long to count reads as a bar

`src/lib/presentation/utils/metric-descriptor.test.ts`

- **Given** `buildMetricTrack(0, 9)`
- **When** the scale is built
- **Then** its `kind` is `bar`

### Scenario — A reading with nothing to measure against draws no scale

`src/lib/presentation/utils/metric-descriptor.test.ts`

- **Given** `buildMetricTrack(0, 0)`
- **When** the scale is built
- **Then** the result is `undefined`

### Scenario — The Logged hours tile has no scale while its reading is missing

`e2e/analytics-stats.e2e.ts`

- **Given** a range whose model report failed, so the tile reads `—`
- **When** the analytics page finishes loading
- **Then** the Logged hours tile draws no `band-track`

### Scenario — The three remaining readings need no click

`e2e/analytics-stats.e2e.ts`

- **Given** a range with logged days
- **When** the analytics page finishes loading
- **Then** `Active days`, `Rest hours` and `Best day` are visible
- **Then** no `more metrics` disclosure is on the page
- **Then** `Longest streak` is not a row of its own
- **Then** `Planned hours` is not a row of its own

### Scenario — Each tag row shows its share of the range's logged hours

`src/lib/presentation/component/tag-hours-card.stories.svelte`

- **Given** a breakdown of school 0.8 h, exercise 0.5 h and 0.2 untagged hours
- **When** the card renders
- **Then** the school row's fill is 53% wide
- **Then** the exercise row's fill is 33% wide
- **Then** the Untagged row's fill is 13% wide

### Scenario — A tag row's bar spans the width the label and hours leave

`src/lib/presentation/component/tag-hours-card.stories.svelte`

- **Given** the same breakdown
- **When** the card renders
- **Then** the school row's track carries `flex-1`

### Scenario — The double-counting caveat reads under the rows it explains

`src/lib/presentation/component/tag-hours-card.stories.svelte`

- **Given** the same breakdown
- **When** the card renders
- **Then** the card's hint under its heading does not mention counting twice
- **Then** a note after the last row says a two-tag task counts under both

### Scenario (pin) — A card with nothing logged draws no bars

`src/lib/presentation/component/tag-hours-card.stories.svelte`

- **Given** an empty breakdown
- **When** the card renders
- **Then** the empty-state sentence is visible
- **Then** no `band-track` is in the card

## Out of scope

- **The canvas's other two cards.** Plan adherence and Your model keep their
  shipped bodies. Direction A redesigns them too; that is a separate spec.
- **The `Halves` and `Ledger` artboards.** Both were considered on the canvas
  and neither is being built.
- **Hover definitions on the four labels.** The Main artboard puts
  `hint-underline` on three of them. Rejected — see Decisions.
- **Bands on the analytics readings.** These four are still unjudged: every
  track here is `neutral`, and no threshold policy is added.
- **`/`'s metric cards.** `metric-headline-strip.svelte` keeps exactly the
  scales it ships today; it only stops owning the markup that draws them.

## Read before building

- `src/routes/(app)/analytics/+page.svelte` — the readings card (the four
  `StatTile`s, the `<details>` fold and `foldedReadings`), and the loading
  skeleton above it that mirrors the card's shape
- `src/lib/presentation/component/stat-tile.svelte` — gains the track
- `src/lib/presentation/component/metric-headline-strip.svelte` — the shipped
  pips/bar markup to extract, in the `{#if item.track}` block
- `src/lib/presentation/utils/metric-descriptor.ts` — `flowCoverage.total <= 8`
  is the pip threshold to export; this is where `buildMetricTrack` lands
- `src/lib/presentation/type/index.ts` — `MetricTrack`, unchanged
- `src/lib/presentation/utils/band.ts` — `BAND_BAR_CLASS`, and why a component
  takes a `Band` and never a class string
- `src/lib/presentation/component/tag-hours-card.svelte` — the row markup and
  `ana_tag_hours_hint`
- `src/lib/presentation/AGENTS.md` — the settled decision "`/`'s readings are
  two cards", whose last paragraph says a tile draws a `MetricTrack`; it now
  has three drawers and a component, and that paragraph is this change's to fix
- `src/lib/presentation/style/STYLE.md` — the `band-track` / `band-fill`
  paragraph, for the same reason
- `e2e/analytics-stats.e2e.ts` — the `folded` list and the `5 more metrics`
  click at its top are written against the disclosure this removes
- `messages/*.json` (5 locales) — the copy moves below
- `docs/testing.md` — the level table, for the three files above

No MATH.md section is touched: nothing here changes a formula. Every
denominator already exists on `analytics-store.svelte.ts`
(`totalTasks`, `averageCompletionRate`, `longestStreak`, `plannedHours`).

## Decisions

- **The scale sits under the note, not beside the value** — the artboard's
  order is label, value, note, track. Rejected: the strip's order on `/`
  (value, band text, track), because a `StatTile` note is a comparison
  sentence and the bar reads as that sentence's evidence.
- **The streak's denominator is the longest streak in the range** — it is the
  only number on the card that says how good a streak is for this person.
  Rejected: the range length, because 0 of 7 and 0 of 30 say the same thing.
- **Pips up to 8, a bar above, from one exported rule.** `buildMetricTrack`
  (exported from `utils/metric-descriptor.ts`) owns the threshold, the
  zero-total guard, and — since a pip is one unit counted — pips only where both
  numbers are whole: 1.5 of 6 logged hours filled two pips, and `Array(6.5)` is
  not a length; `buildMetrics` calls it where it spelled the ternary
  inline. This departs from the artboard, which draws 11 pips. Rejected:
  pips at every total, because a 60-day streak draws 60 hairlines; rejected:
  raising the threshold, because one number cannot be right for both callers
  and a per-call threshold is a parameter with no second value. Rejected: a
  new `utils/metric-track.ts` module, because `metric-descriptor.ts` already
  owns turning numbers into `Metric` display shape.
- **The pips/bar markup becomes `metric-track.svelte`.** Three call sites draw
  it after this change (the strip's tile, `StatTile`, a tag row) — R3's second
  real caller, reached. `metric-label` and `metric-band-text` are the
  precedent. It takes `track` and `band`; `StatTile` passes `neutral`,
  because none of the analytics readings is judged.
- **The tag bar's denominator is the sum of the rows drawn, not the Logged
  hours tile.** A task carrying two tags counts under both, so the rows can
  add to more than the tile — against that denominator a bar could overrun its
  own track. Rejected: the largest row, because the reading is a share of the
  range, not a ranking.
- **The tag row's track takes the width the label and the hours leave.** The
  artboard fixes it at 240px inside a 678px block, which leaves half the card
  empty; that is an artboard-width artifact, not the design. The row is
  label · track (`flex-1`) · hours.
- **No hover definitions on the four labels.** The artboard dots three of
  them. Rejected: `Tasks completed` and `Logged hours` describe themselves,
  and four new strings in five locales buy a tooltip nobody opens.
- **The fold goes, and two of its five readings go with it.** `Longest
streak` and `Planned hours` become the streak and logged-hours notes, where
  they are the denominator the reader needs anyway; `Active days`, `Rest
hours` and `Best day` read on an always-open row under the same rule.
  Rejected: keeping the disclosure over three rows, because a disclosure
  hiding three lines costs more than it saves.
- **The loading skeleton follows the card.** Each of its four tiles gains a
  4px bar and its single fold line becomes the three-reading row, so the card
  does not resize when the readings land. Not tested: it is `aria-hidden`
  decoration.
- **Copy changes, five locales each.** `ana_logged_hours_note` becomes
  `of {hours} h planned`. `ana_streak_note` is replaced by
  `ana_streak_longest_one` / `ana_streak_longest_other` (the repo's plural
  convention — see `ana_day_one`). `ana_tag_hours_hint` loses its second
  sentence to a new `ana_tag_hours_double_count`, drawn after the rows.
  `ana_longest_streak` and `ana_planned_hours` lose their only call site and
  are deleted.

## Open questions

None.
