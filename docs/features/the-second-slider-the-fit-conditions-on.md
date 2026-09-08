# The second slider the fit conditions on

**Kind:** repair · **Status:** landed 2026-09-08 · **Roadmap:** item 38

Frozen at land: this file says what was decided on the date it carries, never
how the code works today — that is MATH.md and the area `AGENTS.md`. When later
work changes the behaviour, it writes its own feature file; it does not edit
this one. Same status as [zenith.md](../../zenith.md), for the same reason.

## Goal

Nothing the user sees changes. MATH.md §8.10 listed `satietyScale` in the λ₀
fit's conditioning set and then dropped it from the common-mode bullet, the
one place the section says which mis-set sliders the printed ± cannot see. The
bullet now names both user-owned sliders, and the probe that priced V_T's
error prices `satietyScale`'s on the same days, so the sentence rests on a
number the probe prints rather than on the list above it.

## Claims

Probe-backed, so written after the run: a probe prints a number and there is no
red to watch.

### Claim — a mis-set `satietyScale` moves the λ₀ fit, and the ± cannot see it

`scripts/stp-stopping-identifiability.probe.ts`, the `[§8.10 κ fit]` arm →
MATH.md §8.10

- **Given** the V_T arm's own population — seed 824, twelve slider-reachable
  days per true λ₀ ∈ {0.5, 0.7, 0.9, 1.1}, each planned by `optimizeSchedule`
  at the default `satietyScale`
- **Given** the reader's `satietyScale` at 0 (the documented disabled mode) and
  at 5 (the Energy Lab input's max)
- **Then** λ̂₀ and its `valueStd` are printed per reading beside the honest fit,
  with the shift in λ₀ and as a multiple of the honest std
- **Then** `usedCount` is printed per reading, so whether the censors react to
  the slider is read and not assumed

### Claim — the V_T arm is unchanged by sharing its generator _(pin)_

`scripts/stp-stopping-identifiability.probe.ts`, the `[§8.10 V_T fit]` arm

- **Given** the V_T arm re-run after the population and pricing moved into the
  helper both sliders call
- **Then** every printed cell equals the pre-change run digit for digit

## Out of scope

- **Fitting `satietyScale`, clamping it, or widening `valueStd`.** Settled where
  V_T's were: the slider is user-owned, κ ≤ 0 is a documented mode (MATH.md
  §8.4), and a ± that priced a mis-set slider would be a different estimator.
  Nothing enters `src/`.
- **The live advisor (§8.11).** It conditions on the same slider, and the
  bracket it reads is the fit's; pricing it separately would restate this arm
  at one day.
- **`fitStoppingValue`'s docblock.** It quotes V_T's figure with a date, which
  the probe policy in `docs/testing.md` now routes to the probe header. A
  `src/` edit, and a separate repair.

## Read before building

- MATH.md §8.10 — feasibility 2 (the conditioning set) and the **posterior
  std** bullet (the common-mode tuple), the two lists that disagreed.
- `scripts/stp-stopping-identifiability.probe.ts` — the V_T fit arm, which the
  new arm mirrors on the same seed.
- `src/lib/business/store/energy-lab-store.svelte.ts` and the Energy page's
  satiety input — the reachable range, which fixes the two mis-set readings.
- `scripts/PROBES.md` — the probe's row.

## Decisions

- **One helper, two arms, one seed.** The two sliders are priced on identical
  days, so the ratio between them is a property of the sliders and not of the
  draw. Rejected: a second copy of the V_T arm, which would have been the
  mirrored definition R3 bans; a second seed, which would have made the
  comparison the item asks for a comparison of two populations.
- **The endpoints are the input's, not the store's.** The store accepts
  [0, ∞); the input stops at 5. A reader's slider can only reach what the input
  offers, so 5 is the reachable worst case. Rejected: an absurd upper value,
  which prices a mode no user can enter.
- **MATH.md names the direction of the difference, not its size.** "Satiety
  reshapes every marginal, V_T adds a constant at the day's end" is why one is
  larger, and it re-derives; the multiple does not (R7).

## Open questions

None.
