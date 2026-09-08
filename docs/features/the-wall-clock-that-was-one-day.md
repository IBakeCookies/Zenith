# The wall clock that was one day

**Kind:** repair · **Status:** landed 2026-09-08 · **Roadmap:** item 36

Frozen at land: this file says what was decided on the date it carries, never
how the code works today — that is MATH.md and the area `AGENTS.md`. When later
work changes the behaviour, it writes its own feature file; it does not edit
this one. Same status as [zenith.md](../../zenith.md), for the same reason.

## Goal

Nothing the user sees changes. `plan-advice.probe.ts` timed one generated day
per n at a hardcoded 8 h budget, and six live sites quoted that draw as the
advisor's cost — one of them as "its worst case". The budget the range input
drags was never on the instrument. One sweep arm now times 40 seeded days per
cell over the budget axis at n = 12 and over n at 8 h, and the six sites quote
its bands instead of the draw.

## Claims

Both probe-backed, so written after the run: a probe prints a number and there
is no red to watch.

### Claim — the budget axis, not n, sets the advisor's cost

`scripts/plan-advice.probe.ts`, the `[sweep]` arm

- **Given** 40 seeded 12-task days at each of 2, 4, 8, 12, 16 and 24 h, one
  timed `suggestPlanAdjustments` and one `calculateDailyMetrics` per day, on an
  AMD Ryzen 7 7800X3D (4 cores, node v22.14.0) with nothing else running
- **Then** the advice run's median reads 15.6–16.4 ms at 2 h, 73.7–80.2 ms at
  8 h, 308–326 ms at 12 h, 966–996 ms at 16 h and 1350–1414 ms at the slider's
  24 h, across three idle runs
- **Then** its max reads 166.6–219.9 ms at 8 h and 2216–2358 ms at 24 h
- **Then** one solve reads 6.7–7.2 ms median at 8 h and 126.5–131.1 ms median
  (215–222 ms max) at 24 h

### Claim — past `EXACT_SUBSET_LIMIT` the solve gets cheaper before the run does

Same arm

- **Given** 40 seeded days at 8 h for n = 9, 10, 11, 12, 13 and 15
- **Then** the advice run's median climbs 10.1–10.4 → 20.6–21.3 → 39.3–39.7 →
  77.6–81.5 → **97.7–102.6** ms from n = 9 to n = 13, and falls to 14.0–15.2 ms
  at n = 15
- **Then** one solve at n = 13 reads 0.6–0.7 ms median — the fallback — while
  the run does not fall, because a 13-task day's defer levers are twelve-task
  exact solves

## Out of scope

- **Any executable change.** No expression in `src/` moves; the four `src/`
  edits are comments and one rules table.
- **Making the advisor cheaper at high budgets.** The 24 h cell is a real
  finding — the whole run holds the thread for over a second on a median day —
  and a separate item. This change measures; it does not optimise.
- **The `#remainingDay`, `draftImpact` and `computeDraftImpact` rows** of the
  business `AGENTS.md` table. Not re-run, not touched.
- **`next-task-shape.probe.ts`'s own `[D cost]` figures.** Its header quoted the
  advisor's draw, and only that quote moves. Its per-candidate cells are its own
  instrument's and were not re-run here — one instrument per commit.
- **`history.test.ts`'s "~55 ms per 12-task day".** A comment on a deliberately
  loose bound, not one of the six sites; left as is.
- **A per-n × per-budget matrix.** Two axes through the n = 12, 8 h cell answer
  what the six sites claimed. The full grid is minutes per run for no site that
  would quote it.
- **Re-quoting the frozen feature files** that carry 109–124 ms or 64.93 ms.
  They say what was believed on their date.

## Read before building

- `scripts/plan-advice.probe.ts` — `timingDay`, `timeMs`, the `[cost]` arm
- `src/lib/presentation/utils/budget-bounds.ts` — `BUDGET_BOUNDS`, the axis the
  sweep walks
- The six sites: `src/lib/business/AGENTS.md` (the reading/shape/cost table row
  and the frozen-thread paragraph under it),
  `src/lib/business/model/metric/plan-advice.ts` (`suggestPlanAdjustments`'s
  docblock), `src/lib/business/store/daily-plan-store.svelte.ts`
  (`computeAdvice`'s docblock), `src/lib/business/model/metric/next-task-suggestion.ts`
  (`NEXT_TASK_CANDIDATE_LIMIT`), `scripts/next-task-shape.probe.ts` (header)
- `scripts/PROBES.md` — the `plan-advice.probe.ts` row
- `docs/testing.md`, "A wall clock is a range, not a figure"
- `ROADMAP.md`, item 36

## Decisions

- **One timed call per seeded day, not eleven reps.** The quantity is the
  spread across days; the existing single-draw arm already reads its rep-to-rep
  spread at a few percent. Rejected: `REPS = 11` per cell, because 40 × 11 runs
  of a 1.4 s cell is a probe nobody re-runs.
- **The six sites quote the 8 h and 24 h medians, rounded to the digits three
  runs share.** 109–124 ms was the pre-prune figure of one day; 65 ms was the
  post-prune figure of the same one day. Neither is the population: the 8 h
  median band is 73.7–80.2 ms and its max 166.6–219.9 ms.
- **"Its worst case" is deleted, not corrected.** No single cell is the worst
  case. A 12-task day costs more at every higher budget, and a 13-task day
  costs more than a 12-task one at 8 h. Rejected: naming 24 h the worst case,
  because the sweep did not walk n at 24 h.
- **The n = 13 mechanism is recorded because the rule got it wrong.** The
  business `AGENTS.md` said the fallback "gets cheaper"; it does for one solve
  (0.6–0.7 ms) and not for the advice run (97.7–102.6 ms median), since each
  defer lever removes one task and lands back on the 12-task exact path.
- **A fourth run was discarded, and that is the idle rule working.** Taken
  while the load average rose to 4.4, it read 91.3 ms median and 434.5 ms max
  on the n = 12, 8 h cell against 73.7–81.5 and 166.6–219.9 on the three idle
  runs; the 24 h cell's max read 4168 ms. The bands above are the idle runs.
- **The item's own reported figures (median ~465–514 ms, max ~1.08–1.16 s) are
  not reproduced and not contradicted.** They were pre-prune and their budget
  draw is unknown; nothing in this change reads them.

## Open questions

None.
