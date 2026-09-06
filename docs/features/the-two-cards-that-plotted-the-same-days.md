# The two cards that plotted the same days

**Kind:** feature · **Status:** planning · **Roadmap:** none

Frozen at land: this file says what was decided on the date it carries, never
how the code works today — that is MATH.md and the area `AGENTS.md`.

## Goal

`/analytics` draws the same daily completion rate twice: once as bars on
**Completion rate**, once as a dashed reference line on **Yield and
completion**. After this, one card holds both readings — completion rate as
bars, Yield Index as a line on the same 0–100 axis — so the user can see
whether a day's yield tracked what they finished without carrying a number
between two cards.

## Scenarios

### Scenario — one card holds both readings

`e2e/analytics.e2e.ts`

- **Given** a seeded day with two tasks, one marked done, viewed on `/analytics`
  in the 7-day range
- **When** the page loads
- **Then** a heading **Completion & yield** is visible
- **Then** the heading **Yield and completion** is gone
- **Then** exactly one `role="img"` chart carries the merged card's accessible
  name

### Scenario — the merged card names both series

`e2e/analytics.e2e.ts`

- **Given** the same seeded day
- **When** the page loads
- **Then** the legend text `Yield Index` is visible
- **Then** the legend text `Completion Rate` is visible

### Scenario — the year view keeps both series on monthly slots

`e2e/analytics.e2e.ts`

- **Given** the same seeded day
- **When** the range toggle is set to **Last 12 months**
- **Then** the year hint naming the monthly average is visible
- **Then** the yield line is still drawn (its path is present, not only the
  legend)

### Scenario — a bar chart slot with no completed task draws no yield point

`src/lib/presentation/component/completion-bar-chart.stories.svelte` (`play`)

- **Given** points whose middle slot has `line: null` and a non-null bar value
- **When** the story renders
- **Then** the line is split into two paths rather than one crossing the slot

### Scenario — a lone recorded slot still draws its yield reading

`src/lib/presentation/component/completion-bar-chart.stories.svelte` (`play`)

- **Given** points where exactly one slot has a non-null `line`
- **When** the story renders
- **Then** that slot draws a dot, not a zero-length path

### Claim — a month's yield average ignores the days that finished nothing

`src/lib/business/model/metric/history.test.ts`

- **Given** a month holding one day with `completedTasks > 0` and one day with
  `completedTasks === 0`
- **Then** the month's yield average equals the first day's `yieldIndex`

### Claim — a month with no completing day has no yield reading

`src/lib/business/model/metric/history.test.ts`

- **Given** a month whose recorded days all finished nothing, and a month with
  no recorded day at all
- **Then** both carry `yieldAverage: null` — the slot the chart breaks its line
  at, never a 0

### Claim — the day slots carry yield the same way the deleted line did (pin)

`src/lib/presentation/utils/completion-chart-points.test.ts`

- **Given** week- and month-range summaries, one of which completed nothing
- **Then** each slot's `line` is that day's `yieldIndex`, and `null` on the day
  that completed nothing and on a day with no summary — the rule
  `yieldTrendSeries` holds today

## Out of scope

- **The Load trend card.** It keeps `metric-trend-chart.svelte` and its three
  series unchanged. Only the yield card is absorbed.
- **The Avg completion rate tile.** A range summary and a per-slot series are
  not the same reading; the fold above stays as it is.
- **The y-axis ticks and the chart height.** Already landed separately — both
  charts are 800×180 on `[0, 25, 50, 75, 100]`, and this change inherits that.
- **Any change to what Yield Index or Completion Rate mean.** Both are read off
  `DaySummary` fields exactly as today (MATH.md §3 weighting); no formula moves,
  so MATH.md is untouched.
- **A tooltip for the yield line.** The bars keep their full-slot hover target;
  the line gets no second one.

## Read before building

- `src/routes/(app)/analytics/+page.svelte` — the two cards to merge (the
  `ana_completion_rate` card and the `ana_yield_trend` card), and the loading
  skeleton's per-card body list, which loses one entry
- `src/lib/presentation/component/completion-bar-chart.svelte` — the surviving
  chart: fixed 800×180 viewBox, `yTicks`, the 2px zero-stub, the full-slot hover
  rect
- `src/lib/presentation/component/metric-trend-chart.svelte` — `runsOf`, the
  gap-splitting the line needs, and the legend markup (including the two-segment
  dashed swatch) to lift from
- `src/lib/presentation/utils/completion-chart-points.ts` — `ChartPoint` and the
  year-vs-day branch that already lays out both slot shapes
- `src/lib/presentation/utils/metric-trend-series.ts` — `yieldTrendSeries` and
  `YieldTrendSeriesInput` are deleted here; `metricTrendSeries` stays
- `src/lib/business/model/metric/history.ts` — `MonthlyCompletion` and
  `monthlyCompletionRates` (the existing bucketing pass), `DaySummary.yieldIndex`
- `src/lib/business/store/analytics-store.svelte.ts` — the `monthlyRates` getter
- `messages/en.json` and the four other catalogues — `ana_completion_rate`,
  `ana_chart_hint_day`, `ana_chart_hint_year`, `ana_chart_aria`,
  `ana_yield_trend*`; catalogues are key-for-key with `en.json`
  (docs/deployment.md, "Adding a locale")
- `src/lib/presentation/AGENTS.md` — the `/analytics` section: the settled
  decision for why these two cards are one goes here, beside "The range readings
  are one card"
- `src/lib/business/model/AGENTS.md` — only if the `MonthlyCompletion` export is
  renamed; that is where this repo prices its interfaces
- `docs/testing.md` — the level table, and the story-`play` rules for the two
  component scenarios
- `e2e/analytics.e2e.ts` — `stats and chart come off the stored days`, `the
range carries a Yield reading` and `the range toggle reslices the stats` all
  assert on the current two-card copy

## Decisions

- **The yield value rides on `ChartPoint`, not a parallel array.** One slot, one
  object, both readings — the year branch and the day branch each fill it where
  they already build the slot. Rejected: a second `line: (number|null)[]` prop
  beside `points`, because two arrays that must stay the same length and order
  is exactly the desync `completion-chart-points.ts` was extracted to prevent.
- **The overlay is a required prop, not an optional one.** There is one caller
  and it always draws both series (AGENTS.md §0 — shape the interface at the
  first caller, no branch for a caller that does not exist). A bars-only story
  passes `line: null` on every slot. Rejected: `line?:` with a legend that
  appears and disappears, which is two states to test for no reader.
- **`runsOf` becomes a shared util with its own test.** The line's
  gap-splitting — runs of two or more are a path, a run of one is a dot — is now
  needed by both charts, which is R3's second real duplication and the point at
  which it is extracted, not before. It takes an `xPos(index)` callback because
  the two charts space their slots differently: the bar chart centres on a slot,
  the trend chart spreads edge to edge. Rejected: copying the twenty lines into
  the bar chart, and rejected: making the bar chart lay its slots out like the
  trend chart, which would move every bar off its label.
- **The month's yield average is folded in `monthlyCompletionRates`, in the pass
  that already buckets the days.** Rejected: a second `monthlyYieldAverages`
  walking the same summaries — a second bucketing of one input (R3).
- **A month averages yield over the days that completed something.** Same rule
  the daily line holds: `yieldIndex` is 0 on a day that finished nothing, and
  averaging those zeroes in would read as a bad month rather than an idle one.
  A month with no such day is `null`, which the chart breaks at.
- **The card is titled "Completion & yield" and sits where the bar card sits
  now** — under Tag hours, above Load trend, keeping the completion bars near
  the Avg completion rate tile that summarises them. Rejected: keeping the title
  "Completion rate", which would leave yield named only in the legend.
- **Rename `MonthlyCompletion` → `MonthlyRollup` and `monthlyCompletionRates` →
  `monthlyRollups`, and the store getter `monthlyRates` → `monthlyRollups`.**
  The type carries a yield average after this, so the old name is false; the
  rename is mechanical across six files and both tests. Rejected: leaving the
  names, because a type named for one of the two readings it holds is the kind
  of quiet lie the next reader pays for. If the build finds the rename spilling
  past those files, keep the names and say so in the landing commit.
- **`ana_yield_trend`, `ana_yield_trend_hint` and `ana_yield_trend_aria` are
  deleted, not left orphaned**, in all five catalogues; `ana_chart_hint_day`,
  `ana_chart_hint_year` and `ana_chart_aria` are reworded to name both readings.
  The deleted hint's sentence about why yield breaks on a day that finished
  nothing survives into the new hint — it is the only place the gap is explained.

## Open questions

None.
