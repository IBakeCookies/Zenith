# A headline reading shows its scale

**Kind:** feature · **Status:** landed 2026-09-11 · **Roadmap:** none

Frozen at land: this file says what was decided on the date it carries, never
how the code works today — that is MATH.md and the area `AGENTS.md`. When later
work changes the behaviour, it writes its own feature file; it does not edit
this one.

## Goal

A headline reading shows where it sits on its own scale, not only its number: a
track under each value, and one pip per task under Flow Coverage. The Momentum
badge moves beside the four readings instead of taking a row of its own above
them.

## Scenarios

### Scenario — a reading's track is drawn in its band

`src/lib/presentation/component/metric-headline-strip.stories.svelte`

- **Given** the story's Human Capacity tile, 104% in band `warning`, with a
  `bar` track
- **When** the strip renders
- **Then** the track's fill carries `BAND_BAR_CLASS.warning`

### Scenario — a reading past 100% fills its track and no further

`src/lib/presentation/component/metric-headline-strip.stories.svelte`

- **Given** the same Human Capacity tile at 104%
- **When** the strip renders
- **Then** the fill's width is `100%`
- **Then** the value still reads `104%`

### Scenario — Flow Coverage draws one pip per task

`src/lib/presentation/component/metric-headline-strip.stories.svelte`

- **Given** the story's Flow Coverage tile at 3/4 with a `pips` track
- **When** the strip renders
- **Then** the tile draws four pips
- **Then** three of them carry the band's fill class

### Scenario — a plan with more tasks than pips fit draws a bar

`src/lib/presentation/component/metric-headline-strip.stories.svelte`

- **Given** a story variant whose Flow Coverage tile reads 9/12
- **When** the strip renders
- **Then** the tile draws one fill element and no pips

### Scenario — a reading the day cannot answer draws no track

`src/lib/presentation/component/metric-headline-strip.stories.svelte`

- **Given** a story variant whose Human Capacity tile reads N/A and carries no
  track
- **When** the strip renders
- **Then** that tile draws no track element

### Scenario — Momentum sits beside the readings

`src/lib/presentation/component/metric-headline-strip.stories.svelte`

- **Given** the default story, momentum `0.4`
- **When** the strip renders
- **Then** the element holding the four tiles also holds the Momentum badge

### Claim — a reading the day cannot answer carries no track

`src/lib/presentation/utils/metric-descriptor.test.ts`

- **Given** `buildMetrics` called with `budgetHours: 0` — every headline
  reading but Completion Rate gates to N/A
- **Then** no gated-out reading carries a `track`

### Claim — pips up to eight funded tasks, a bar above

`src/lib/presentation/utils/metric-descriptor.test.ts`

- **Given** `flowCoverage.total` from 1 to 20, with tasks and a budget
- **Then** the Flow Coverage track's `kind` is `pips` at `total ≤ 8` and `bar`
  above it

### Claim (pin) — the tile's value stays a direct-child `<p>`

`e2e/time-budget.e2e.ts` (unchanged, still green)

- **Given** a fresh profile, one task, an 8h budget
- **Then** `div:has(> p)` filtered on the label `Human Capacity` still selects
  the tile and its `\d+%` value

## Out of scope

- **The one-line gloss under each reading, and under the badge.** Drawn in the
  canvas, cut here: seven message keys across five locales to restate what the
  tooltip already says. The tooltips are unchanged and keep carrying it.
- **The other twenty readings.** `metrics-dashboard.svelte` is untouched — no
  tracks in the lower card, and the four headline labels still read twice
  (presentation/AGENTS.md, "`/`'s readings are two cards").
- **Band thresholds.** `AXIS_BAND` and the `getBand*` helpers are unchanged;
  this change draws the band it is given.
- **Momentum's wording, its tooltip, and its `Math.sign` reading.**
- **Directions B (two question groups) and C (one rail)** from the canvas.
- **The narrow-viewport order.** Below `lg` the badge keeps its own row above a
  two-column grid, as today.

## Read before building

- `src/lib/presentation/component/metric-headline-strip.svelte` — the component
  this rewrites; its comment on why a headline set exists stays true
- `src/lib/presentation/utils/metric-descriptor.ts` — `buildMetrics`, the
  `gated` helper, and the four `headline: true` entries; the track is emitted
  here, beside the value it belongs to
- `src/lib/presentation/type/index.ts` — `Metric`; `MetricTrack` is added here
- `src/lib/presentation/utils/band.ts` — `BAND_BAR_CLASS` for the fill,
  `BAND_TEXT_CLASS` for the value; `BAND_BORDER_CLASS` and its doc comment are
  deleted with their only caller
- `src/lib/presentation/style/STYLE.md` — the bullet "A borderless panel nested
  inside a card uses `surface-inset`" ends by citing the headline tiles' 2px
  left rule as the third way out; that sentence goes false here and is
  corrected in the same commit (AGENTS.md §0)
- `src/lib/presentation/AGENTS.md` — "`/`'s readings are two cards: a verdict
  above the setup, four questions below" is the settled decision this change
  works inside; `MetricTrack` is a new public export of this layer, so its
  shape is priced here — and the file is at its budget (881/881,
  `scripts/brief-size.mjs`), so a line added here pays for itself by deleting
  one the left rule made false
- `src/lib/presentation/component/metric-headline-strip.stories.svelte` — the
  fixtures gain tracks, and the two new variants the scenarios name
- `e2e/time-budget.e2e.ts` — the `div:has(> p)` locator the markup must keep
  satisfying
- `docs/testing.md` — the level table; this is a component change, so the tests
  are `play` functions
- `docs/features/the-curve-nobody-chose.md` — untouched, but it is the other
  uncommitted spec in this tree; do not fold the two

## Decisions

- **The track is computed in `buildMetrics`, not the component** — R2, and the
  component would otherwise have to parse `"3/4"` back into two numbers.
  Rejected: passing `flowCoverage` through as a second prop, which gives the
  strip a second source of truth for one tile.
- **One `MetricTrack` shape, `{ kind: 'bar' | 'pips'; filled; total }`.** A
  percentage is `filled: 9, total: 100`. Rejected: two optional fields on
  `Metric`, which makes the illegal combination representable.
- **Pips only to eight funded tasks.** Above that they are thinner than the gap
  between them, and a dozen funded tasks is an ordinary day. Rejected: pips
  always (sub-pixel marks at 30 tasks); rejected bar always, because the
  denominator _is_ the reading for Flow Coverage.
- **The fill clamps at 100%; the value does not.** Human Capacity stays
  unclamped — reading over 100% is how the strip says the plan is overloaded —
  so only the bar's width is bounded, and the band already turns at the
  threshold.
- **A gated-out reading carries no track**, emitted through the same `gated`
  call that decides its value, so an N/A can never keep a stale scale. Rejected:
  a zero-length track, which draws an empty scale as though the reading were 0.
- **The 2px band rule down each tile goes.** With a band-coloured track under
  every value the rule is the same claim twice; `BAND_BORDER_CLASS` had this
  one caller and is deleted with it.
- **Momentum becomes the leading column from `lg`**, hugging the badge behind a
  `border-line-soft` divider, and keeps its own row below that width. Rejected:
  a fixed 196px column — with the gloss cut, that is a badge alone in empty
  space.
- **No new message keys.** The whole change is layout and one new mark.

## Open questions

None.
