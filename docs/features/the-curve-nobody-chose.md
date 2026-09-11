# The curve nobody chose

**Kind:** model · **Status:** landed 2026-09-11 — one claim falsified, see
"Where it landed" · **Roadmap:** none

Frozen at land: this file says what was decided on the date it carries, never
how the code works today — that is MATH.md and the area `AGENTS.md`. When later
work changes the behaviour, it writes its own feature file; it does not edit
this one. Same status as [zenith.md](../../zenith.md), for the same reason.

## Goal

The `/energy` day, the stop advisor's verdict and the fitted leisure value λ₀
are computed on the v2 productivity curve — the one the main planner already
runs — instead of the v1 shape MATH.md §7 recorded as a deferral. A task
started cold produces from its first minute at `p₀` rather than nothing, so
short sessions, restarts after a long break and unstarted tasks are all worth
more than they were; every block length, break placement and λ₀ reading moves.

The energy model landed 2026-07-11 on `(a+p₀)·k·s·e^(−ks)`; v2 landed two days
later and changed only the planner; §7's "intentionally still uses the v1
curve" was a deferral, and the 2026-09-11 provenance repair established that
v1 was never the article's curve either. Nobody picked the shape. This picks
one.

## Scenarios

A `model` has no click. The claims below are the acceptance criteria.

### Claim — one curve in the repo

`src/lib/business/model/zenith-energy.test.ts` → MATH.md §2, §8.2

- **Given** any task and any session phase `s ≥ 0`
- **Then** the energy integrand at `s` equals `productivity(s, a, p0, k)` from
  `zenith.ts` with `(a, p0, k)` from `calculateTaskParams` for the same
  sliders (the existing independent replica of the integrand is rewritten to
  the v2 form and holds to its current tolerance)

### Claim — a cold start produces from the first minute

`src/lib/business/model/zenith-energy.test.ts` → MATH.md §8.2

- **Given** a task with no phase memory, full reservoirs
- **Then** `sampleTrajectory`'s first rate sample on it is `p₀`, not 0

### Claim — the resume rule needs no new mapping

`src/lib/business/model/zenith-energy.test.ts` → MATH.md §8.2

- **Given** a task left at phase `s_end` and resumed after gap `g`
- **Then** the resumed block integrates `p(s_end·e^(−g/τ) + u)` — phase is
  time on task, so `p(0) = p₀` falls out with no change to `resumePhase`
- **Then** `(pin)` the §8.2 survival figures — 84.648% of warm-up after
  5 min away, 1.832% after 2 h — hold unchanged; they are `e^(−g/τ)` and
  never read the curve

### Claim — the hump still does double duty

`src/lib/business/model/zenith-energy.test.ts` → MATH.md §8.2

- **Given** one contiguous session against the same worked hours split around
  a break, at equal reservoirs
- **Then** the split loses when the break falls below the peak
- **Then** the split gains when the break falls past the peak

### Claim — the yardstick and the T\*-insert run the curve's own optimum

`src/lib/business/model/zenith-energy.test.ts` → MATH.md §3, §8.4, §8.6

- **Given** any task
- **Then** the session length the T\*-session insert snaps to the lattice is
  `findOptimalSingleTaskTime` for that task, `ϕ·x*(r)/(1−r)`, no longer
  `1.7933·ϕ`
- **Then** `refOutput` integrates one contiguous run of that same length from
  full reservoirs

### Claim — the α and r fits do not move `(pin)`

`src/lib/business/model/energy-calibration.test.ts` → MATH.md §8.7, §8.9

- **Given** any set of 🪫 drain observations and ☕ rest pairs
- **Then** `fitDrainRate` and `fitRecoveryRate` return the values the current
  suite pins — both are drain-law only and read no curve

### Claim — the canonical task order does not move `(pin)`

`src/lib/business/model/zenith-energy.test.ts` → MATH.md §8.10

- **Given** the declared probe day (boxing / guitar / reading)
- **Then** its canonical amplitudes read 10.4 / 6.67 / 4.60 as today —
  `taskAmplitude` stays `a + p₀`, an ordering convention, not a curve value

### Claim — the §8.10 inversion stays well-posed on the new curve

`src/lib/business/model/zenith-energy.test.ts` (the W\*(λ₀) test on the
12-hour probe day) and `scripts/stop-margin-fit-error.probe.ts` → MATH.md
§8.3, §8.10

- **Given** the 12-hour probe day swept over λ₀
- **Then** W\*(λ₀) is monotone and graded — the figures are re-read from the
  run, not kept
- **Given** the probe's 90 seeded users × 12 days, honest arm
- **Then** λ₀ fit RMSE at n = 12 stays inside the bracket half-width the
  instrument already concedes (0.110 on v1; the v2 half-width is read from
  the run)

### Claim — the search still reaches the enumerated optimum

`scripts/energy-search-gap.probe.ts` → MATH.md §8.6

- **Given** the probe's ENUMERATED and FRONTIER tiers on the new curve
- **Then** the residual gap against the enumerated optimum and the uphill
  audit are re-read and stay within what §8.6 claims — a cheaper cold start
  reshapes the basins the compound moves and pair seeds were built for, and
  this is the instrument that says whether they still hold

## Out of scope

- **`c₃ = 0.5`** (MATH.md §1). A separate unmeasured prior; a fitted `c₃` from
  real ⚡ logs decides it, not this change.
- **The `a = E·β` and `p₀ = β/E` mappings.** §7's last bullet keeps them;
  v2 in the classic model runs them, so the energy model inherits them
  unchanged.
- **The article's curve.** Rejected below, not deferred.
- **A curve with no within-session decline.** Considered as the brief's first
  question; rejected below. Not built, not switched in.
- **A parameter to switch curves.** The build lands v2 directly; no
  `curveVersion` on `EnergyParams`, no dual-run probe.
- **Persisted state.** The Energy Lab's `freeTimeValue` stays whatever the
  user last applied (user-owned by §8.7/§8.9/§8.10's Apply semantics); fit
  snapshots stay frozen records; the λ₀ fit is a `$derived` over finished
  days and re-reads history on load. Nothing is migrated.
- **Retiring the T\*-session insert or the pair seeds** because slivers now
  pay something. `energy-search-gap.probe.ts` measures; a later change
  decides.
- **Re-running the probes whose claims the curve cannot falsify** —
  `stop-block-structure`, `stop-inversion-margin`, `stop-obligation-bias`,
  `censored-stopping-fit`, `stp-stopping-identifiability`, `stop-advisor`,
  `enb-simpson-error`, `curve-shape`, `energy-draft-price`,
  `rv13-stop-insertion`, `advisor-curve-agreement`, `satiety-gaming`. Their
  headers keep v1 figures under their run dates until each is re-run in its
  own commit, one instrument per commit.
- **Satiety across days** (ROADMAP item 7) and anything in the UI. The Energy
  Lab exposes no curve parameter; nothing on screen changes shape, only
  numbers.

## Read before building

- MATH.md §2 — the v2 curve, `k = (1−r)/ϕ`, the amplitude cap; the argument
  against the article's form that this spec adopts for the energy model.
- MATH.md §3 — `x*(r)`, the per-task optimum the yardstick and insert move to.
- MATH.md §7 — the "intentionally still uses the v1 curve" bullet: delete it.
- MATH.md §8 intro, §8.2, §8.4 (the `T* = 1.7933·ϕ` yardstick sentence), §8.6
  (the cold-start sliver bullet), §8.10 (the sliver-day remark), §8.11 (the
  "mostly warm-up ramp" sentence) — every sentence that leans on `p(0) = 0`
  or the universal multiplier. Prose repair is deletion-first: cut what the
  run falsifies, write only what the run shows. Then
  `node scripts/math-index.mjs`.
- `src/lib/business/model/zenith.ts` — `calculateTaskParams`, `productivity`,
  `findOptimalSingleTaskTime`, `optimalStoppingX`; `amplitudeRatio` and
  `AMPLITUDE_RATIO_CAP` are private and stay so — the energy model gets the
  cap through `calculateTaskParams`, never by re-deriving `r`.
- `src/lib/business/model/zenith-energy.ts` — the header docblock's warm-up
  paragraph; `TaskCurve` and `buildCurves` (drop `amp`, carry `a`, `p0`, `k`,
  `phi`, per-task `tStar`); the integrand in `blockOutput` and in
  `sampleTrajectory`'s `sampleSegment`; the two `OPTIMAL_PHI_MULTIPLIER`
  sites in the seeds; `resumePhase` (unchanged); `taskAmplitude` (unchanged);
  `adviseStop`'s docblock ramp sentence.
- `src/lib/business/model/zenith-energy.test.ts` — the independent integrand
  replica; `PROBE_DAY`; the §8.2 survival test; the W\*(λ₀) sweep; the §8.11
  "looks ahead past the warm-up ramp" witness, whose fixture may stop
  discriminating under v2 — then the run finds a new fixture, the assertion
  is never loosened.
- `src/lib/business/model/energy-calibration.ts` and its test — the pin: no
  curve import, nothing to change.
- `src/lib/business/model/plan-audit.test.ts`,
  `src/lib/business/model/metric/energy-draft-impact.test.ts`,
  `src/lib/business/session-history.test.ts`,
  `src/lib/business/model/metric/daily-metrics.test.ts` — every energy figure
  pinned there is re-read from a run.
- `scripts/energy-search-gap.probe.ts`, `scripts/stop-margin-fit-error.probe.ts`
  — re-run on an idle box; header figures re-read; wall clocks as ranges
  (docs/testing.md, figures).
- `src/lib/business/model/AGENTS.md` — the energy-model warm-up bullet and
  "Fragmentation stays costly (probe-verified)": re-verify against the run;
  the settled decision "the curve deviates from the article on purpose" stays
  true and gains the energy model.
- `docs/testing.md` — the figure rules the re-reads follow.

## Where it landed

- `src/lib/business/model/zenith-energy.ts` — `TaskCurve` carries `a`, `p0`,
  `k`, `phi` and a per-task `tStar`; `blockOutput` and `sampleSegment` call
  `productivity` from `zenith.ts`; one `sessionHours` map, each task's
  `findOptimalSingleTaskTime` snapped to the lattice, feeds both the classic
  seed and the T\*-insert. `OPTIMAL_PHI_MULTIPLIER` is no longer imported.
- MATH.md — §7's v1 bullet deleted; §8 intro, §8.2, §8.4, §8.6, §8.10 and
  §8.11 repaired by deletion; index regenerated.
- `src/lib/business/model/AGENTS.md` — the warm-up bullet, the
  `OPTIMAL_PHI_MULTIPLIER` line, the settled decision on the curve, and the
  margin bullet's flatness sentence.
- Tests: the replica, cold-start, yardstick and T\*-session scenarios went red
  for the intended reason and are green. The pins — §8.2 survival, the α and r
  fits, the canonical order, double duty, W\*(λ₀) monotone and graded — passed
  on the first run and were not edited. Every moved figure in
  `zenith-energy.test.ts`, `energy-draft-impact.test.ts` (whose 4.5 h draft
  became 3 h to keep discriminating) and the other named suites was re-read
  from a run.
- `scripts/energy-search-gap.probe.ts`, run twice in full and its timing arms
  three times: ENUMERATED 60/60 and 6/6 exact; FRONTIER 4 tasks × 6.75 h funds
  {1,2} against the optimum's {1,2,3} on 1 of 3 days (0.0609%), 5 and 6 tasks
  exact; APPROX 8 of 12 exact, worst 0.6328%; the uphill audit finds SHRINK-ONE
  - INSERT-ONE uphill on 2 of 21 days where v1 read 0 (M104); a cap of 4
    reaches two of three forfeited days and the third needs 5; cap 4 beats cap 3
    on 7 of 2000 days over five seeds, changing the funded set on five. The cap-4
    cost band is unchanged at roughly 1.2×–1.7×; one solve reads ~73–76 ms
    against ~55–59 on v1. The header carries every figure.
- `scripts/stop-margin-fit-error.probe.ts`, run once: replica valid to
  0.000e+0. **The claim "λ₀ fit RMSE at n = 12 stays inside the bracket
  half-width the instrument already concedes" did not hold**: honest n = 12
  RMSE 0.1700, bias +0.0917, 73.5% of days kept, against the 0.134 half-width
  the probe hard-codes from the 2026-08-06 instrument. The claim also assumed a
  v2 half-width would be read from the run, and the probe measures none.
  Recorded as M105; nothing is re-fitted on it. The margin sweep is flat in
  three arms and moves 0.0185 in the 30%-interrupted n = 3 arm (13.8% of the
  half-width; the kill criterion fired in 3 of 4 arms against 4 of 4 on v1), so
  the margin decision stands under its own rule. The scope kill line still
  fires (best gain 0.0198).
- Browser (`npm run build`, `vite preview` on 4173, Playwright): three tasks at
  default sliders on an 8 h day render a 2h 15m + 2h 15m + 3h plan with 30 m
  free, total output 9.8, no NaN, no console errors. The output-rate trace
  drops to a nonzero rate at every task switch instead of to zero — `p(0) = p₀`
  on screen — and the stop advisor prices the next session at ≈ 1.08/h against
  the 0.50/h free-time value.

## Decisions

- **v2, now.** One curve in the repo: the classic model exports it with its
  parameter map and cap, so the migration deletes a formula at three sites
  rather than adding one (R3). Rejected: keeping v1 with a written reason —
  no reason survives the R3 objection, and v1's `p(0) = 0` makes "initial
  productivity" false in the energy model exactly as §2 says it was in the
  planner. Rejected: building v2 behind a switch and measuring first — a
  switch that must be deleted either way, and every consumer of the model
  would carry two shapes in the meantime.
- **Decay to zero stays.** The brief's first question was whether total
  output wants a within-session decline at all, given the reservoirs price
  day-level fatigue and satiety prices per-task daily value. All three
  candidate curves carry the decline; a curve without one is a fourth curve
  nobody has written, and §8.2's break-value story (a break past the peak
  pays) rests on it. Rejected: a saturating ramp, as out of this change's
  scope, not as wrong — re-open only with a measurement that the three
  mechanisms double-count.
- **v2 over the article's form.** §2's argument holds here too: the
  article's constant sits outside the exponential, so it never decays, and
  its peak grows with ϕ. Rejected: two curves in the repo on purpose.
- **The resume rule is unchanged.** `s` is time on task; `p(s)` is whatever
  the curve says at that phase. A cold start reads `p₀·gate` instead of 0
  with no new mapping. Rejected: mapping a nonzero start into a phase offset
  — that would double-count `p₀`.
- **The yardstick and the T\*-insert move to the per-task optimum.** "A good
  session on this task" means the curve's own T\*; `1.7933·ϕ` is v1's
  universal value and overstates it by up to 18% on easy tasks. Rejected:
  keeping the constant as a documented approximation — one more v1 residue.
- **Canonical order stays `a + p₀`.** It ranks, it does not value; changing
  it would move every §8.10 reading for a second reason in the same change
  and shift the declared probe day's amplitudes. Rejected: ranking by the v2
  peak `a·e^(r−1)`.
- **Only λ₀ is disturbed, and it re-reads itself.** The brief listed α, r,
  satiety scale and λ₀ as calibrated against v1; α and r fits are drain-law
  only, satiety's κ rescales through `refOutput`, and the λ₀ fit is derived
  from finished days on every load. Nothing is re-fitted by hand and nothing
  persisted is migrated.
- **Every pinned figure is re-read from a run, never derived** — and a
  fixture the curve stops discriminating gets a new fixture, not a looser
  assertion. Two probes re-run now because the change can falsify their
  claims, not merely their figures: `energy-search-gap` (the search
  landscape) and `stop-margin-fit-error` (§8.10's well-posedness). The rest
  wait, one instrument per commit. Rejected: re-running every energy probe in
  this change.
- **No ROADMAP item.** §7 was the record, and it closes by deletion.

## Open questions

None.
