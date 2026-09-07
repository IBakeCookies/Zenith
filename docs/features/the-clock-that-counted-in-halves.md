# The clock that counted in halves

**Kind:** feature · **Status:** landed 2026-09-07 · **Roadmap:** item `none`
(a defect in [the clock that rings once](the-clock-that-rings-once.md),
reported by the user the day it landed)

Frozen at land: this file says what was decided on the date it carries, never
how the code works today — that is MATH.md and the area `AGENTS.md`. When later
work changes the behaviour, it writes its own feature file; it does not edit
this one. Same status as [zenith.md](../../zenith.md), for the same reason.

## Goal

The strip's two numbers now change on the same second and add up to the length
that was set. The elapsed reading counts the way a clock counts: `<1m` for the
whole first minute, `1m` for the whole second one.

Before this, the elapsed reading rounded to nearest while the countdown beside
it ceiled. So `<1m` showed for thirty seconds and `1m` for the next sixty,
each number jumped half a minute out of step with its neighbour, and the pair
read `1m` + `45m left` on a 45-minute session — a minute that existed in
neither direction.

## Scenarios

### Scenario — the reading names the minute that has passed

`src/lib/business/utils/session-timer.test.ts`

- **Given** a timer started at `START`
- **When** `getElapsedMinutes` is read at `START + 59_999`, `START + 60_000`
  and `START + 119_999`
- **Then** it is `0`, `1` and `1`

### Scenario — the two readings move together

`src/lib/business/utils/session-timer.test.ts`

- **Given** a running timer with a 45-minute target
- **When** both readings are taken at 30 and at 90 seconds
- **Then** they are `0` + `45` and `1` + `44` — one step per whole minute, and
  each pair sums to the length set

### Scenario — a stop seeds the minutes the readout showed

`src/lib/business/utils/session-timer.test.ts`

- **Given** a stopped timer holding 20 minutes and 40 seconds
- **When** `getPendingMinutes` is read
- **Then** it is `20`

### Scenario — a session under a minute is still no session

`src/lib/business/utils/session-timer.test.ts`

- **Given** a stopped timer holding 50 seconds
- **When** `getPendingMinutes` is read
- **Then** it is `null`

## Out of scope

- **Showing seconds.** The strip reads in minutes because that is what a 🪫 log
  is written in; a ticking second would also make the readout a live region
  the screen reader reads out once per second, which is the reason the status
  line beside it announces phases and not the count.
- **The countdown's own rounding.** `getRemainingMinutes` already ceiled, and
  ceiling is what makes the pair sum to the target now that its neighbour
  floors. It was not touched.
- **The two `toMinutes` helpers.** `day-actions.svelte` keeps a local one for
  turning a stored `targetMs` back into the field's value. A target is always a
  whole number of minutes, so no rounding rule can move it.

## Decisions

- **One cut, at one place** — `session-timer.ts`'s private `toMinutes`, which
  both the readout and the 🪫 seed already went through. Flooring it moves both
  together, which is the point: the number the strip showed when Stop was
  pressed is the number the editor opens on. Rejected: flooring the readout
  alone, which would have made a 20m40s session display `20m` and seed `21`.
- **The 🪫 seed loses up to 59 seconds instead of up to 30.** Half a minute of
  a session that is 20 to 90 minutes long, against a reading that disagrees
  with the field it fills — the model reads these minutes as a duration
  (MATH.md §8.10), not as a count, and the extra half minute is well inside
  what the rating beside it resolves.
- **"Under a minute is not a session" replaces "under half a minute."** Same
  clause, unchanged: `getPendingMinutes` returns `null` on a zero reading. The
  floor moved the boundary rather than the rule.

## Doc routing

- Nothing in `presentation/AGENTS.md` moved: it says the seeded value is what a
  stopped timer counted, which is still true and is the sentence that made the
  displayed and seeded numbers have to agree.
- MATH.md unchanged — no formula, constant, bound or fit is involved.
