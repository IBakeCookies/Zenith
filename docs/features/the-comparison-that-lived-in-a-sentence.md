# The comparison that lived in a sentence

**Kind:** feature · **Status:** landed 2026-09-12 · **Roadmap:** none

Frozen at land: this file says what was decided on the date it carries, never
how the code works today — that is MATH.md and the area `AGENTS.md`. When later
work changes the behaviour, it writes its own feature file; it does not edit
this one.

## Goal

The two analytics cards that compare numbers stop asking the reader to do it in
prose. **Plan adherence** leads with its verdict and draws each planner's match
as a bar, so which plan your days resemble is a glance rather than a subtraction
of two percentages; the three effective-task figures read as one line of
numbers. **Your model** becomes a five-column table — parameter, trend, fitted,
default, evidence — so a fit sits beside the default it is anchored to instead
of inside the sentence under it. On a phone every model row folds to three
lines and keeps all five columns.

## Scenarios

### Scenario — the verdict leads the adherence card

`src/lib/presentation/component/plan-adherence-summary.stories.svelte`

- **Given** the default story: `classicOverlap` 0.41, `energyOverlap` 0.56,
  `usedCount` 30, the tie verdict
- **When** the summary renders
- **Then** the element holding the verdict sentence also holds
  `based on 30 logged days`

### Scenario — a match draws a bar at its own percentage

`src/lib/presentation/component/plan-adherence-summary.stories.svelte`

- **Given** the default story
- **When** the summary renders
- **Then** the classic row's fill has width `41%`

### Scenario — the energy bar draws its own percentage

`src/lib/presentation/component/plan-adherence-summary.stories.svelte`

- **Given** the default story
- **When** the summary renders
- **Then** the energy row's fill has width `56%`

### Scenario — neither bar judges its reading

`src/lib/presentation/component/plan-adherence-summary.stories.svelte`

- **Given** the default story, whose 41% would band `warning` under
  `getBandBiggerBetter`
- **When** the summary renders
- **Then** both fills carry the same fill class

### Scenario — the three spreads read as one line of figures

`src/lib/presentation/component/plan-adherence-summary.stories.svelte`

- **Given** the default story: `actualTaskSpread` 1.2, `classicTaskSpread` 3.2,
  `energyTaskSpread` 1.6
- **When** the summary renders
- **Then** the figure labelled `you` reads `1.2`

### Scenario — the classic and energy spreads keep their own labels

`src/lib/presentation/component/plan-adherence-summary.stories.svelte`

- **Given** the default story
- **When** the summary renders
- **Then** the figure labelled `classic` reads `3.2`

### Scenario — one logged day is still counted in the singular

`src/lib/presentation/component/plan-adherence-summary.stories.svelte`

- **Given** a story variant with `usedCount` 1
- **When** the summary renders
- **Then** the verdict line reads `based on 1 logged day`

### Scenario — the model table names its five columns

`src/lib/presentation/component/model-parameter-table.stories.svelte`

- **Given** the default story: the five `ModelRow`s, recovery fitted at
  `≈ 1.07 ± 0.12 /h` against a `0.70` default
- **When** the table renders
- **Then** the head row renders a cell reading `Default`

### Scenario — the evidence column is headed

`src/lib/presentation/component/model-parameter-table.stories.svelte`

- **Given** the default story
- **When** the table renders
- **Then** the head row renders a cell reading `Evidence`

### Scenario — a fit sits in the column beside its default

`src/lib/presentation/component/model-parameter-table.stories.svelte`

- **Given** the default story's recovery row
- **When** the table renders
- **Then** that row's fitted cell reads `≈ 1.07 ± 0.12 /h`

### Scenario — the default has a cell of its own

`src/lib/presentation/component/model-parameter-table.stories.svelte`

- **Given** the default story's recovery row
- **When** the table renders
- **Then** that row's default cell reads `0.70`

### Scenario — the evidence no longer repeats the default

`src/lib/presentation/component/model-parameter-table.stories.svelte`

- **Given** the default story's recovery row, 92 ratings
- **When** the table renders
- **Then** that row's evidence cell reads `92 ratings`

### Scenario — an unfitted parameter prints the same number twice

`src/lib/presentation/component/model-parameter-table.stories.svelte`

- **Given** a story variant whose cognitive drain row is not fitted: fitted
  `0.35 /h`, default `0.35`
- **When** the table renders
- **Then** that row's fitted cell carries no `≈`

### Scenario — a parameter with no recorded history draws no sparkline

`src/lib/presentation/component/model-parameter-table.stories.svelte`

- **Given** a story variant whose free-time row has `trend: null`
- **When** the table renders
- **Then** that row's trend cell holds no `img` role

### Scenario — a phone keeps every column of the model table

`e2e/analytics-stats.e2e.ts`

- **Given** a 390px viewport, one seeded day, `/analytics` loaded past its
  skeleton
- **When** the model card renders
- **Then** the Recovery rate row's evidence is visible

### Scenario — a phone stacks the fit over the default it is anchored to

`e2e/analytics-stats.e2e.ts`

- **Given** the same 390px viewport and page
- **When** the model card renders
- **Then** the Recovery rate row's default cell shares a right edge with its
  fitted cell, within 1px

### Scenario — a phone names the default the head no longer can

`e2e/analytics-stats.e2e.ts`

- **Given** the same 390px viewport and page
- **When** the model card renders
- **Then** the Recovery rate row's default cell reads the word `default` before
  its number

### Scenario — the model table does not drag the page sideways

`e2e/analytics-stats.e2e.ts`

- **Given** the same 390px viewport and page
- **When** the model card renders
- **Then** `document.documentElement.scrollWidth` is no wider than 390

### Claim — every row carries its default and its evidence separately

`src/lib/presentation/utils/calibration-descriptor.test.ts`

- **Given** the fresh-profile snapshot the suite already builds
- **Then** row 0's `defaultValue` is `45 min`
- **Then** row 0's `evidence` is `0.0 ⚡ logs, recency-weighted`

### Claim — a deferred log is still named, in the evidence

`src/lib/presentation/utils/calibration-descriptor.test.ts`

- **Given** the snapshot with `pendingDrainCount` 2
- **Then** both drain rows' `evidence` ends in the counted-from-tomorrow
  sentence
- **Then** neither drain row's `evidence` contains the word `default`

### Claim — the ϕ skill sentence stays on the evidence, behind the counts

`src/lib/presentation/utils/calibration-descriptor.test.ts`

- **Given** the snapshot whose `flow.skill` reports a positive `gapHours`
- **Then** row 0's `evidence` reads the weighted count, then the closer-than-
  default sentence

## Out of scope

- **Band colours on the two match bars.** Both fills are the same quiet ink:
  the card's verdict deliberately refuses to call either planner good, and a
  41% drawn in `warning` says the user adhered badly when it may only mean the
  planner was wrong. `BAND_BAR_CLASS` is untouched.
- **The tie band and the verdict wording.** `ADHERENCE_TIE_BAND`,
  `adherenceVerdict` and the three verdict strings are unchanged; this change
  moves where the sentence is drawn, not what it says.
- **The two hints.** `ana_adherence_hint` and `ana_model_hint` keep their
  current wording, including the Energy Lab link.
- **What the fits compute.** No MATH.md section moves: §5 (ϕ), §8 (α, r, λ₀)
  and §9 (overlap, spread) are all read, none changed.
- **Tap-to-reveal evidence.** Rejected at the interview: the log counts are the
  whole argument for trusting a fit, and hiding them behind per-row open state
  buys a shorter card with a worse one.
- **Bars for the three effective-task figures.** They share no scale — `you`
  and the two planners are counts, not percentages — so a track under them
  would be three different rulers.
- **Sorting, filtering or reordering the model table.** Fit order stays.
- **Tooltips on the new column heads.** The card's hint already says what
  "fitted" and "default" mean, and `MetricLabel` would put five more tooltip
  triggers in one card.
- **Every other analytics card.** Completion rate, load trend, day profiles,
  the drain ranking, the log history and the two calibration cards are
  untouched.
- **The Energy Lab's own fit lines.** `param-row.svelte`'s `fit` prop reads
  from the same vocabulary and keeps its current single-line shape.

## Read before building

- `src/routes/(app)/analytics/+page.svelte` — the two card bodies to be
  replaced (the `<!-- Plan adherence -->` block and the `ana_model` block), the
  `modelRows` / `auditVerdict` derivations that stay, and the shared `pending()`
  / `reportFailed()` snippets, which stay in the page: the new components render
  the resolved state only
- `src/routes/(app)/analytics/+page.svelte`, the loading skeleton — the
  `{#each ['h-16', 'aspect-[800/180]', …]}` array of six body heights, and its
  comment "Bar heights are the line-heights they stand in for". Both these cards
  change height, so their two entries are re-measured in this change or the
  server-rendered frame stops matching what lands on it
- `src/lib/presentation/utils/calibration-descriptor.ts` — `ModelRow` splits:
  `note` becomes `evidence`, and `defaultValue` is added. `noteWithSkill`,
  `drainNote` and the five row literals are where the `default {value} · `
  prefix comes off
- `src/lib/presentation/utils/calibration-descriptor.test.ts` — eleven
  assertions on `row.note` are rewritten against the two new fields; the file's
  fixtures are the stories' fixtures too
- `src/lib/presentation/utils/plan-audit-descriptor.ts` — `adherenceVerdict`,
  unchanged, now read by the extracted summary rather than the page
- `src/lib/presentation/component/param-trend.svelte` — the sparkline, moved
  into the table's Trend column unchanged; it is already `shrink-0`
- `src/lib/presentation/component/plan-advice-card.svelte` — the lever table,
  lines 125–176: the one CSS-grid-with-subgrid table in the tree, and the shape
  both new layouts copy (one grid owns the tracks, head and rows are
  `col-span-subgrid` children, `col-start-*`/`row-start-*` per cell below `sm`)
- `src/lib/presentation/AGENTS.md`, "Columns aligned down a card are one CSS
  grid with subgrid rows, never a `<table>` restyled at a breakpoint" — the
  settled decision this change works inside. Its citation names
  `plan-advice-card`'s lever table alone and gains the model table; `ModelRow`
  is this layer's public export and its new shape is priced here. **The file is
  at its budget (881/881, `scripts/brief-size.mjs`)**, so anything added pays
  for itself by deleting a line
- `src/lib/presentation/style/tokens.css` — `band-track` / `band-fill` for the
  two match bars, and `figure` / `figure-cell` / `figure-unit` for the three
  effective-task figures, which is exactly the "loud number, quiet label" shape
  the Day Setup header already has
- `src/lib/presentation/utils/band.ts` — `BAND_BAR_CLASS.neutral`
  (`bg-ty-secondary`) is the fill both bars take; nothing else in this file is
  read
- `src/lib/presentation/style/STYLE.md`, "A repeated cluster becomes an
  `@utility`" — `band-track`/`band-fill` gain a caller outside
  `metric-track.svelte`; check whether the bullet's list of call sites goes
  stale (AGENTS.md §0 — fix it here, do not report it)
- `messages/en.json` and the four sibling locales — nine keys added
  (`ana_adherence_spread_you` / `_classic` / `_energy`, `ana_model_col_*` ×5,
  `ana_model_default_prefix`), one removed (`ana_adherence_spread_note`), and
  seven reworded: `ana_model_note_flow`, `_flow_pending`, `_ratings`,
  `_recovery_pending`, `_drain_pending`, `_days`, `_days_pending` each lose
  their leading `default {value} · ` and, where it leaves them with no `{value}`
  placeholder, that parameter
- `e2e/calibration-fits.e2e.ts`, the two `page.getByText(/default \d/)`
  assertions (in "plan adherence and the model card resolve without calibration
  logs" and "visiting analytics records today's fitted params") — the word and
  the number stop being one text node, so both are rewritten to locate the
  Default cell. They are asserting that the page resolved, not that a sentence
  exists; keep that intent
- `e2e/analytics-stats.e2e.ts` — where the four phone-viewport scenarios land
- `e2e/task-list.e2e.ts`, lines 94–110 — the established 390px pin: set the
  viewport, assert what stays, assert `documentElement.scrollWidth`. Copy it
  rather than inventing a second way to measure a phone
- `src/lib/presentation/component/metric-headline-strip.svelte` — the shape for
  a card body extracted so its geometry can be `play`-tested; its `Props` take
  a view model, which is what `rows: ModelRow[]` is
- `docs/testing.md` — the level table: these are component changes, so the
  tests are story `play` functions, and only the width-dependent ones are e2e
- **The working tree is dirty with someone else's change** — `the-day-you-
could-not-correct`, which has `e2e/analytics-stats.e2e.ts`, all five locale
  files and `src/lib/presentation/AGENTS.md` already modified. Rebase or land
  onto it; do not revert those edits, and do not fold the two specs

## Decisions

- **One CSS grid with subgrid rows, never a `<table>`** — the settled
  presentation decision, and the reason it exists is this exact problem: a real
  table restyled at a breakpoint cannot move a cell to another row. The model
  table becomes its second caller, so the rule's citation names both.
- **A phone keeps all five columns, three lines per row** — parameter over
  fitted on line 1, sparkline over default on line 2, evidence full width on
  line 3. The fitted and default numbers therefore share a right edge and stack,
  which is the comparison the card is for. Rejected: folding the default back
  into the evidence sentence (two lines, but it puts the number the reader is
  comparing back inside prose, which is what this change is undoing); rejected
  tap-to-reveal evidence, above.
- **`ModelRow.note` splits into `defaultValue` and `evidence`** rather than the
  component parsing the sentence apart. The seven note messages lose their
  `default {value} · ` prefix, because the prefix is now a cell — leaving it in
  would print the default twice on every row.
- **The word `default` is `sm:sr-only` in the cell.** Below `sm` there is no
  head above that column, so the word is drawn; from `sm` the head carries it
  and the word stays for the screen reader, which hears no head-to-cell
  association in a grid either way. Rejected: a bare number at both widths (an
  unlabelled `0.70` floating at the right of line 2); rejected the word at both
  widths, which is the head said twice on a desktop.
- **An unfitted parameter prints its number in both cells.** The absent `≈` and
  `±` is already how this card marks a value nothing moved, and the evidence
  cell says why (`0 ratings`). Rejected: an em dash and the word "default",
  which each add a branch to the descriptor and a thing to decode — and five
  more strings across five locales, in the second case.
- **Both match bars take `BAND_BAR_CLASS.neutral` and scale 0–100%**, not to
  each other. Scaling to the larger of the two would draw a 4-point gap as a
  landslide.
- **The verdict and the day count lead the card, on one line.** They were the
  card's footnote and they are its conclusion; the two percentages under them
  are the evidence. Rejected: keeping the verdict below the bars, which leaves
  the reader subtracting two numbers before being told the answer.
- **Both bodies are extracted to components with stories.** Every scenario here
  is about rendered geometry — a fill's width, a cell's column — which a `play`
  asserts directly and an e2e asserts slowly through a seeded IndexedDB. The
  page keeps the `{#if}` chain, its `h2` and its hint, so `pending()` and
  `reportFailed()` are still defined once.
- **`plan-adherence-summary.svelte` and `model-parameter-table.svelte`** —
  spelled out, not `params`: AGENTS.md §2 bans abbreviations, and `param-row` /
  `param-trend` are a baseline rather than a precedent.
- **No MATH.md change, and no change to any fit.** Every number on both cards
  is the number that is there today, in a different place.

## Open questions

None.
