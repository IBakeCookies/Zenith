# The pool the drain logs offer

**Kind:** feature · **Status:** planning · **Roadmap:** item 18 (its payload)

Frozen at land: this file says what was decided on the date it carries, never
how the code works today — that is MATH.md and the area `AGENTS.md`. When later
work changes the behaviour, it writes its own feature file; it does not edit
this one. Same status as [zenith.md](../../zenith.md), for the same reason.

## Goal

Beside each capacity field in Day Setup I can see the pool my own 🪫 ratings
say I have — "Use fitted 4.4 h" — and adopt it with one press, instead of
guessing 4 h and 6 h. Nothing changes until I press.

The map that turns a fitted drain rate into hours already exists
(`capacityFromDrainRate`, MATH.md §8.13,
[the-pool-the-drain-logs-might-know](the-pool-the-drain-logs-might-know.md));
nothing in the app reads it. This is the reader: a per-reservoir offer under
each pool input that declares the pool through the setter the field already
uses, so the day stores it and item 32's carry-over takes it to the days after.

## Scenarios

### Scenario — an offer sits under the field it is for, and only that one

`src/lib/presentation/component/day-constraints-bar.stories.svelte`

- **Given** the bar opened with a cognitive pool of 8 h, a fitted cognitive
  offer of 4.4 h and no physical offer
- **When** it renders
- **Then** the cognitive field's hint line carries a button named
  "Use fitted 4.4 h"
- **Then** the physical field's hint line carries no such button

### Scenario — pressing adopts the number the button showed

`src/lib/presentation/component/day-constraints-bar.stories.svelte`, same story

- **Given** the offer above
- **When** the button is pressed
- **Then** the cognitive field reads 4.4
- **Then** the button is gone

### Scenario — a field already reading the fitted value is offered nothing

`src/lib/presentation/component/day-constraints-bar.stories.svelte`

- **Given** a cognitive pool of 4.4 h and a fitted cognitive offer of 4.4 h
- **When** the bar renders
- **Then** there is no "Use fitted" button

### Scenario — no fit, no button

`src/lib/presentation/component/day-constraints-bar.stories.svelte`, the
existing `Open` story

- **Given** both offers `null`
- **When** the bar renders
- **Then** there is no button whose name starts "Use fitted"

### Scenario — the offer reads the viewed day's own causal fit

`src/lib/business/store/daily-plan-store.svelte.spec.ts`

- **Given** 🪫 rows dated before the viewed day, rated so α fits inside §8.13's
  domain
- **When** the store derives
- **Then** both offers are numbers
- **Given** instead a single 🪫 row dated the viewed day itself
- **Then** both offers are `null`

### Scenario — a rating with a day behind it offers a pool on `/`, and the press outlives the day

`e2e/time-budget.e2e.ts`

- **Given** a task, a 🪫 rating logged from `/` at 120 min with mind 9 and body
  5, and the clock carried past midnight (`page.clock`, as
  `e2e/calibration-fits.e2e.ts` "that same rating fits once the clock has
  passed midnight" does)
- **When** `/` is opened and Day Setup expanded
- **Then** the cognitive hint line carries a button matching
  `/Use fitted [\d.]+ h/`
- **When** it is pressed
- **Then** the cognitive field reads the number the button printed
- **Then** after the autosave and a reload, the field still reads it
- **Then** tomorrow's collapsed summary reads it beside "mind"

### Claim — an offer exists only for a fitted α inside the map's domain, rounded to 0.1 h

`src/lib/business/model/energy-calibration.test.ts`

- **Given** a calibration whose `cognitiveDrain.fitted` is `false`
- **Then** the cognitive offer is `null`, whatever `params.alphaCog` is
- **Given** `fitted: true` with α below `CAPACITY_MAP_POLE_MARGIN` × the
  params' pole
- **Then** that reservoir's offer is `null`
- **Given** `fitted: true`, α_cog 0.35 and α_phys 0.30 at default recovery
- **Then** the offers are 4.4 and 5.3 — `capacityFromDrainRate`'s 4.373 and
  5.307 rounded to one decimal

## Out of scope

- **A prefill.** The 2026-08-30 spec sketched both endings — "a prefill the
  user overrides" and "a text button beside the inputs" — and the interview
  chose the button. A prefill re-derives silently as logs accrue, so the
  constraint the plan is solved under would move with nothing on screen saying
  so; it would also need a precedence rule against item 32's carry-over, which
  is itself a prefill. An offer moves nothing until pressed.
- **The pair or nothing.** The domain gate is per reservoir, and arms B and C
  of `capacity-from-drain.probe.ts` put α̂_phys under it at most of their points
  — pair-or-nothing would hide the cognitive offer from exactly the users the
  probes describe. Storage's pair invariant (`constraint-memory.ts`) is
  untouched: a press goes through the field's setter, and the write records
  both effective values as it does for a typed field.
- **Finishing the gate.** Arm D's 1.757% / 0.970% is one seed
  ([the-margins-that-were-one-draw](the-margins-that-were-one-draw.md) says a
  sweep is the obvious next measurement), and arm B never produced a pool
  because the gate scales with the fitted recovery rate — a MATH.md
  re-parameterization question. Neither is bought here. An offer the user reads
  and declares is bounded by the user; what the gate would protect is a number
  spent silently, which nothing here does.
- **`DEFAULT_CAPACITY_POOLS`.** Stays 4/6 — the fallback every stored day with
  no pools reads (`metric/history.ts`, `session-history.ts`), settled in
  [data/AGENTS.md](../../src/lib/data/AGENTS.md).
- **The hint copy.** "Intense mental work you sustain per day (~4h)" keeps its
  "(~4h)": the offer sits beside it as the user's own number. A variant key
  without the parenthesis is a second message for one line.
- **A button on the switch cost.** Settled: instrumented, never advised.
- **The Energy Lab.** It shows no pools and gets none. The `applyFits` button
  there writes Lab params; this writes a session field, on the page that owns
  it.
- **A disabled "applied" state.** The Lab's `fitsApplied` pattern — a disabled
  button reading "Fits applied" — is a second message key and a control that
  says nothing the field beside it does not. The button hides instead.
- **A past-day rule.** The bar is not rendered on a past day
  (`+page.svelte`, `{#if !isViewingPast}`), so there is nothing to guard.
- **MATH.md.** No formula, constant, bound or conditioning moves; §8.13 stands
  as written. Rounding to 0.1 h is declaration precision, the Lab's `round2`
  for α, not a model constant.

## Read before building

- `src/lib/business/model/energy-calibration.ts` — `calibrateEnergyParams`
  returns `EnergyCalibration` with per-fit `fitted` flags; the offer is a pure
  function of it and goes beside it. `fitEnergyParams` (the params-only
  wrapper) has one caller, the store below, which switches to the full
  calibration — delete the wrapper in the same change (AGENTS.md §0); its only
  other mention is ROADMAP item 18's paragraph, which collapses.
  `energy-calibration.test.ts` `describe('calibrateEnergyParams')` is where the
  Claim lands.
- `src/lib/business/model/zenith-energy.ts` — `capacityFromDrainRate`,
  `CAPACITY_MAP_POLE_MARGIN`, `DrainRateFit.fitted`, `DEFAULT_ENERGY_PARAMS`
  (α 0.35 / 0.30, r 0.7, m 1.5, b 0.05). MATH.md §8.13 for the map and its
  gate; nothing there changes.
- `src/lib/business/store/daily-plan-store.svelte.ts` — `#fitObservations`
  (logs dated `< selectedDate`) and `#calibratedParams`, the fit the offer
  reads; the getters block is where `fittedPools` (two `number | null`) is
  exposed. `daily-plan-store.svelte.spec.ts` "refits the energy params from the
  calibration logs" and "leaves the viewed day's own 🪫/☕ logs out of its
  parameter fit" show the arrangement (`mockObservations.drainObservations`);
  `daily-plan-store.test-harness.svelte` is the harness.
- `src/lib/business/store/session-store.svelte.ts` — `#declare`,
  `#openingPools`, `#declaredPools` and the `cognitivePool` / `physicalPool`
  setters. The press writes through the page's `bind:` into these; no change
  here. business/AGENTS.md "An unseen day's budget is prefilled" holds the
  prefill and blur rules the press must not re-open — add one line there: the
  fitted offer is a declaration through the setter, never a prefill.
- `src/lib/presentation/component/day-constraints-bar.svelte` — the two pool
  `NumberInput`s and the hint `<p>` under each, where the button goes after a
  " · ". Two `number | null` props beside the two bindables. Components take
  props, never stores (presentation/AGENTS.md).
- `src/routes/(app)/energy/+page.svelte` — the `applyFits` text button: the
  enabled recipe to reuse (`text-xs text-brand hover:text-brand-strong`).
- `src/routes/(app)/+page.svelte` — the `DayConstraintsBar` block under
  `{#if !isViewingPast}` / `{#key session.loadedDate}`; the plan store is
  `plan`.
- `src/lib/presentation/component/day-constraints-bar.stories.svelte` —
  top-level `args` gain the two offers as `null`; the `Open` play gains the
  absence assertion; two new stories carry the offer and the equal-value case.
- `e2e/time-budget.e2e.ts` — the bar's feature file; "an unseen day opens on
  the last declared switch cost and pools" is the carry-over assertion shape.
  `e2e/helpers.ts`: `logDrain`, `setBudget`, `openTimeBudget`, `AUTOSAVE_MS`,
  `isoDate`. `e2e/calibration-fits.e2e.ts` "that same rating fits once the
  clock has passed midnight" — the `page.clock.install()` /
  `fastForward('25:00:00')` gesture that gives a rating a day behind it.
- `messages/en.json` and de/es/fr/zh — one key, `budget_use_fitted_pool` with
  `{hours}`; all five locales hold every key.
- `src/lib/business/model/AGENTS.md` — the `capacityFromDrainRate` bullet says
  "an instrument, not a planner input: no allocation reads it, the pools stay
  declared, and what would have promoted it is a gate that `classicOverlap`
  cannot run" — false once this lands. Rewrite: the map reaches the day only
  as an offer the user declares; no allocation reads it directly; the pools
  stay declared. Add the new export beside it.
- ROADMAP.md — item 18 collapses to its date and this file; its α-bias
  paragraph goes with it (see Decisions). "Where the headroom actually is",
  third bullet, "Nothing fits `switchCost` …, the capacity pools, or the
  difficulty sliders" — drop the pools. Re-run `npx prettier --write ROADMAP.md`
  and check the numbering.

## Decisions

- **A button, not a prefill** — the user declares the number; the plan's
  constraint never moves under them. Rejected: prefilling unseen days with the
  derived pool, because it re-derives silently as logs land, needs a precedence
  rule against item 32's carry-over, and §8.13's own argument for `null` over a
  clamp — a wrong pool is spent silently by the planner, a missing one is
  visibly missing — applies to a prefill and not to an offer.
- **Per reservoir** — the gate is per reservoir and the physical one is often
  outside it. Rejected: the pair or nothing, which would show the offer to
  almost nobody the probes describe.
- **Only a fitted α is offered** — at default α the map returns 4.37 h / 5.31 h,
  which are the constants in different clothes; `fitted: false` → `null`. A
  fresh profile sees no button.
- **The day's own causal fit, anchored to defaults** — the store's
  `#fitObservations`, the same fit Burnout Risk reads. Never the Lab's sliders
  (settled: nothing outside `/energy` reads them), and a rating logged today
  cannot move the offer under a plan the user is running.
- **Rounded to 0.1 h in the pure function** — the label, the field and the
  stored value are one number, the Lab's `round2` rule for α. The field's
  `step` of 0.5 is what its stepper moves by, not what a pool must be
  (`BUDGET_BOUNDS`' rule for the budget). Rejected: rounding to the step,
  which costs up to 0.25 h of a fit that can resolve finer.
- **Hidden when the field already reads the value** — the "applied" state
  with no state: pressing makes the two equal, and a value typed by hand that
  happens to match has nothing to adopt either. Rejected: the Lab's disabled
  "Fits applied" button.
- **The composition is a model function** — `EnergyCalibration → { cognitiveHours, physicalHours }`
  with `null`s, in `energy-calibration.ts`: pure, testable at the `*.test.ts`
  level, and the store only maps. Rejected: composing in the store, where the
  gate case (an α under the pole) is hard to arrange and R2 says hard to arrange
  is a design report.
- **The gate ships as recorded** — arm D favourable at one seed, arm A void,
  arm B a domain finding. An offer bounded by the user's own reading does not
  need what the gate would have protected. The unbought measurements are named
  above, not hidden.
- **The roadmap's α-bias claim was unsupported** — item 18 recorded, from an
  uncommitted 2026-08-04 run, that α̂ drifts upward with the 🪫 logging rate so
  the derived pool shrinks with diligence. The committed arm C (run
  2026-08-30) sweeps 0.15–1.56 logs per day and finds α̂_cog wandering
  0.59–0.72 with no trend. The item's collapse drops the paragraph; this is
  where the correction is recorded, and
  [the-pool-the-drain-logs-might-know](the-pool-the-drain-logs-might-know.md)'s
  Claim 3 sentence stays as the frozen record of what was believed when it was
  written.
- **`fitEnergyParams` goes** — its one caller now needs the flags the full
  calibration carries; a wrapper with no caller is code to read for nothing.

## Open questions

None.
