# The levers that lined up

**Kind:** feature · **Status:** landed 2026-09-08 · **Roadmap:** none

Frozen at land: this file says what was decided on the date it carries, never
how the code works today — that is MATH.md and the area `AGENTS.md`. When later
work changes the behaviour, it writes its own feature file; it does not edit
this one. Same status as [zenith.md](../../zenith.md), for the same reason.

## Goal

On the Adjust-the-plan card, the three day-level readings — the next block, the
switch cost, and tomorrow — read as three tiles instead of three grey sentences,
and each axis's levers sit in one table with headed columns (Lever, Reading,
Plan value, the button), so the numbers line up and can be compared down the
card. On a phone the same table stacks each lever into two lines with its button
beside it, and nothing scrolls sideways.

Drawn 2026-09-08 as
[docs/redesign/adjust-plan/Main.dc.html](../redesign/adjust-plan/Main.dc.html),
artboard **A — Facts and a lever table** of the Adjust-the-plan canvas.

## Scenarios

### Scenario — the three readings are tiles

`src/lib/presentation/component/plan-advice-card.stories.svelte`

- **Given** the Findings fixture: a 15-minute block going to “Tax return” at
  +2.4%, 30m reserved at 15m a switch bracketed +10.4% / −8.7%, and tomorrow
  holding 4 tasks on 6h with 3 funded
- **When** the card renders
- **Then** a tile labelled `Next 15 minutes` reads `“Tax return”`
- **Then** the same tile reads `+2.4% plan value` beneath it
- **Then** a tile labelled `Switching` reads
  `30m of today reserved · 6% of the budget`
- **Then** the same tile reads
  `at 15m a switch · no switch cost +10.4% · at 30m −8.7%` beneath it
- **Then** a tile labelled `Tomorrow` reads `4 tasks · 6h to spend`
- **Then** the same tile reads `3 of them funded` beneath it
- **Then** with no destination reading, no `Tomorrow` tile renders

### Scenario — the descriptor hands the card parts, not sentences

`src/lib/presentation/utils/plan-advice-descriptor.test.ts`

- **Given** the marginal, switch-cost and destination inputs the sentences were
  tested on
- **Then** the marginal is
  `{ label: 'Next 15 minutes', primary: '“Tax return”', secondary: '+2.4% plan value' }`
- **Then** a block nobody takes, or one that nets to +0%, reads
  `Nothing more would get done` with no secondary
- **Then** a null gain reads `N/A` as the secondary
- **Then** the switch cost is
  `{ label: 'Switching', primary: '30m of today reserved · 6% of the budget', secondary: 'at 15m a switch · no switch cost +10.4% · at 30m −8.7%' }`
- **Then** a plan that reserves nothing reads `Pays for no switching`, with
  the bracket kept in the secondary where the numbers carry one
- **Then** a bracket that would say nothing leaves the secondary at
  `at 15m a switch`
- **Then** the destination for 4 tasks, 6h, 3 funded is
  `{ label: 'Tomorrow', primary: '4 tasks · 6h to spend', secondary: '3 of them funded' }`
- **Then** one task reads `1 task · 2h to spend` over `1 funded`
- **Then** an empty day reads `Nothing planned yet · 6h 30m to spend` with no
  secondary
- **Then** no destination, or nothing planned on no hours, is `null` (pin)

### Scenario — each axis's levers sit in one headed table

`src/lib/presentation/component/plan-advice-card.stories.svelte`

- **Given** the Findings fixture
- **When** the card renders
- **Then** each axis renders a headed grid whose column heads read `Lever`,
  `Reading`, `Plan value`
- **Then** the `Plan value` head is a tooltip trigger
- **Then** hovering it shows the plan-value explanation
- **Then** the “Tax return” row's Reading cell reads `82%` then `54%`
- **Then** its Plan value cell reads `−6.2%`
- **Then** the unpriced row's Plan value cell reads
  `costs an extra hour of your day`
- **Then** the description is the one sentence
  `Each option is re-solved by the same optimizer that built your plan, so these are the numbers you would actually get.`
- **Then** `To tomorrow`, `Set 6.5h` and `Add the hour` keep their names and
  callbacks (pin)

### Scenario — on a phone each lever stacks and nothing scrolls sideways

`src/lib/presentation/component/plan-advice-card.stories.svelte`

- **Given** the Findings fixture at a 320px viewport
- **When** the card renders
- **Then** the card's `scrollWidth` is no wider than its `clientWidth`
- **Then** the `Reading` column head is not visible
- **Then** the `Lever` and `Plan value` heads are visible
- **Then** the `Tomorrow` tile sits below the `Switching` tile
- **Then** the “Tax return” row's reading cell sits below its action, in the
  same column

### Scenario — every shipped state stays

`src/lib/presentation/component/plan-advice-card.stories.svelte`

- **Given** the stories for not-calculated, solving, first check failed, stale,
  nothing to fix, an axis nothing improves, shared titles and the unfunded reads
- **Then** each keeps passing (pin), the unfunded sentences still one paragraph
  each, above the axes

## Out of scope

- **What is priced, and which findings surface.** `plan-advice.ts`, `band.ts`
  and `digitsFor` are untouched; every number on the card is the one the model
  already produced.
- **The axis header's own reading.** Kept beside the axis label, as shipped and
  as drawn; each option's Reading cell repeats it as `before → after`.
- **The budget-curve and stop-advisor cards.** Same register, different
  readings; nothing here touches them.
- **Artboards B (Sentences kept) and C (One table).** Drawn, not built.
- **New e2e coverage.** `e2e/plan-advice.e2e.ts` re-points its four text
  assertions at the new copy and stays CI's to run.
- **Copy beyond a faithful split of the existing sentences** in the five
  locales.

## Read before building

- `src/lib/presentation/component/plan-advice-card.svelte` — the card
- `src/lib/presentation/utils/plan-advice-descriptor.ts` — `formatMarginal`,
  `formatSwitchCostPrice`, `describeDeferDestination` become one `AdviceFact`
  shape; `signedPlanValue` loses its unit
- `src/lib/presentation/component/plan-advice-card.stories.svelte` and
  `src/lib/presentation/utils/plan-advice-descriptor.test.ts` — the tests above
- `messages/{en,de,es,fr,zh}.json` — the `advice_*` keys
- `e2e/plan-advice.e2e.ts` — the description, marginal and switch-cost
  assertions after the first check
- `src/routes/(app)/+page.svelte` — passes `destination` to the card
- `src/lib/presentation/AGENTS.md`, **Components** — `class` merged with `cn`;
  a component that owns every tooltip it renders carries its own provider; a
  card whose reading costs a solve renders a prompt line where it will go
- `src/lib/presentation/style/STYLE.md` — tokens only; `surface-inset` for a
  borderless panel inside a card; `rounded-full` is circles only; a repeated
  cluster becomes an `@utility`
- `docs/testing.md` — a story note never goes in an HTML comment; a11y runs in
  error mode

## Decisions

- **The descriptor hands parts — `AdviceFact { label, primary, secondary }`,
  one shape for all three tiles** — so the card renders one loop and the locale
  keeps owning the phrasing. Rejected: splitting the sentences in the card,
  because that is string logic in a component (R2), and the split points differ
  per locale.
- **One CSS grid per axis, with subgrid rows — not a `<table>`.** The axis's
  grid owns the column tracks (`minmax(0,1fr) auto auto auto` from `sm`, two
  tracks below it); the header row and the `<ul>` of options are `col-span-full`
  subgrids, and so is each `<li>`, so auto-sized columns still line up across
  the head and every row while the options stay a real list. Below `sm` each
  option's four cells are placed explicitly — lever over reading on the left,
  plan value over the button on the right — and the `Reading` head is hidden
  because that cell now sits under its lever. Rejected: a `<table>` restyled at
  a breakpoint, which
  [the-table-that-went-back-to-a-row.md](the-table-that-went-back-to-a-row.md)
  already refused for the ledger, and for the same reason here. Rejected: fixed
  column widths as drawn (220/200/124px), because the German copy does not fit
  them.
- **Plan-value cells print the bare signed figure; the unit is the column head,
  and the explanation is its tooltip** — which is what lets the description drop
  to its first sentence. Rejected: `−6.2% plan value` in every cell under a head
  that already says it.
- **A tile with nothing to read is not rendered** — a null destination leaves
  two tiles sharing the strip (`auto-cols-fr`), never an empty third.
- **The unfunded lines stay paragraphs between the tiles and the tables** — the
  artboard left them out, but they are a feature of their own
  ([why-a-task-got-no-hours.md](why-a-task-got-no-hours.md)) and are not
  tabular.
- **The e2e's "unit visible from first paint" check goes** — that sentence is
  now the tooltip on a head that exists only once there is a reading, so the
  check becomes the head itself, after the first check.

## Open questions
