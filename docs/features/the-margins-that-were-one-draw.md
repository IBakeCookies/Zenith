# The margins that were one draw

**Kind:** audit · **Status:** landed 2026-09-06 · **Roadmap:** item 18 (its
2026-09-04 lead, first step only)

Frozen at land: this file says what was decided on the date it carries, never
how the code works today — that is MATH.md and the area `AGENTS.md`. When later
work changes the behaviour, it writes its own feature file; it does not edit
this one. Same status as [zenith.md](../../zenith.md), for the same reason.

## What was asked

ROADMAP item 18 carried a lead raised 2026-09-04 and not run: an **uncommitted**
perturbed generator was reported to flip the sign of the derived-vs-4/6
`classicOverlap` Δ at α 0.7/0.45, and to collapse the "+0.0116, derived beats
the truth itself" headline to a ~0.0035 margin. Item 29's rule makes that a
lead, not a result, so the first step it named was the only step taken here: a
**seed sweep of arm A at today's constants**, reporting the spread of the Δ per
grid point against the margins
[the-pool-the-drain-logs-might-know](the-pool-the-drain-logs-might-know.md)
quotes.

This is a measurement. Nothing entered `src/`, no allocation reads the §8.13
map, and neither the gate nor the floor constant was re-parameterized — item 18
says that is premature and blocked on the misspecified arm, which is untouched.

## The instrument

`scripts/capacity-from-drain.probe.ts`, arm A. It generated at
`--seed 42` only; `generate` now takes a seed (**default 42**, so every earlier
quoted run of every arm reproduces byte-for-byte) and arm A sweeps
**seeds 42–53**, twelve fixtures per grid point. `report` returns the two Δ it
already printed so the sweep can read them rather than re-scoring. Arms B, C and
D are unchanged and still run at seed 42.

The blocks arm A prints above the spread table are still seed 42's, so the
reference run the earlier quotes were read off stays visible beside what the
sweep says about it.

```sh
npx vitest run --config vitest.probe.config.ts --disableConsoleIntercept \
  scripts/capacity-from-drain.probe.ts -t 'A — self-consistent'
```

## What the sweep found

Run 2026-09-06, twelve seeds, today's constants. Every figure below is printed
by the probe.

| α true (cog/phys) | Δ             | seed-42 cell | min     | max     | range  | mean    | Δ > 0   |
| ----------------- | ------------- | ------------ | ------- | ------- | ------ | ------- | ------- |
| 0.4 / 0.3         | truth − 4/6   | +0.0000      | +0.0000 | +0.0000 | 0.0000 | +0.0000 | 0 of 12 |
| 0.4 / 0.3         | derived − 4/6 | −0.0018      | −0.0021 | +0.0009 | 0.0030 | −0.0006 | 4 of 12 |
| 0.52 / 0.35       | truth − 4/6   | −0.0035      | −0.0035 | +0.0009 | 0.0044 | −0.0004 | 2 of 12 |
| 0.52 / 0.35       | derived − 4/6 | −0.0071      | −0.0077 | +0.0049 | 0.0126 | −0.0013 | 4 of 12 |
| 0.7 / 0.45        | truth − 4/6   | −0.0024      | −0.0080 | +0.0049 | 0.0129 | −0.0001 | 6 of 12 |
| 0.7 / 0.45        | derived − 4/6 | −0.0064      | −0.0117 | +0.0108 | 0.0225 | +0.0001 | 5 of 12 |
| 0.95 / 0.6        | truth − 4/6   | +0.0116      | −0.0170 | +0.0232 | 0.0403 | +0.0071 | 9 of 12 |
| 0.95 / 0.6        | derived − 4/6 | +0.0341      | −0.0283 | +0.0389 | 0.0673 | +0.0093 | 8 of 12 |

The fifth grid point, α 0.3/0.25, is skipped at every seed: it is inside the
§8.13 pole margin at the generator's own recovery, so the map defines no true
pool to generate a day from. That is unchanged and not a seed effect.

## Verdict: the spread swamps the margins

**Yes — swamped, on three of the four evaluable points, and the fourth is not
evidence of anything either.**

- **α 0.52/0.35 and α 0.7/0.45.** The quoted margins are −0.0035 and −0.0024;
  their own ranges across seeds are 0.0044 and 0.0129, each larger than the
  margin it contains, and each straddles zero. At α 0.7/0.45 the truth−4/6 Δ is
  positive at 6 of 12 seeds — a coin flip. The sign the kill/keep reading rests
  on is a property of seed 42, not of the instrument.
- **α 0.95/0.6, the one favourable point.** The "+0.0116, derived beats the
  truth itself" headline runs −0.0170 to +0.0232 across seeds, positive at 9 of
  12, and the +0.0341 derived-vs-4/6 figure beside it runs −0.0283 to +0.0389,
  positive at 8 of 12. A reading that fails to reproduce on a quarter to a third
  of the fixtures is not a favourable reading; it is an unresolved one.
- **α 0.4/0.3 is the exception, and for a reason that is not reassurance.** Its
  truth−4/6 Δ is +0.0000 at all twelve seeds with a range of 0.0000 — because
  the true pool there is 4.00/5.97 h, which _is_ declared 4/6 to two decimals,
  and at seed 42 both bind on 9 of 60 scored days. The cell is stable because
  the two pools being compared are the same pool, scored on days almost none of
  them reach. It confirms the structural cause and decides nothing about the
  map. Its derived−4/6 Δ, where the two pools genuinely differ, moves over a
  range of 0.0030 against a −0.0018 quote and flips sign at 4 of 12 seeds.

**Both halves of the 2026-09-04 lead reproduce under a committed run**, though
not through the lead's own mechanism — this is a seed sweep, the lead was a
perturbed generator. The derived-vs-4/6 Δ at α 0.7/0.45 does flip sign, and the
+0.0116 headline does not survive its own fixture; a ~0.0035-scale collapse of
it is well inside the range printed here.

## What this does and does not close

- **It does not change the void verdict.** The gate in
  [the-pool-the-drain-logs-might-know](the-pool-the-drain-logs-might-know.md)
  was already **void, not failed** — no verdict about the map was readable from
  `classicOverlap` in either direction. This sweep makes the reason stronger and
  differently shaped: not only does the control rank the known-correct pool
  below 4/6, the ranking is drawn from a distribution centred near zero, so
  three of the four cells that argued it would have argued the opposite on
  another seed.
- **That spec needs its own correction, and this file is not it.** Its Δ table
  is quoted to four decimals as if the cells were stable, and they are not. The
  file is a frozen dated record, so the correction is a separate change; it is
  not written here. **Until it has one, no four-decimal cell from that table may
  be re-quoted as a result** — only, as in the table above, with the spread that
  decides it beside it. That includes the cells the roadmap and the probe header
  carry.
- **Nothing about item 18's remaining blocker moved.** The misspecified arm
  still returns no derived pool at any point, because §8.13's gate scales with
  the fitted recovery rate. That is a question about the floor's
  parameterization and it is untouched here, deliberately.
- **Arm D is not swept.** It scores on the objective rather than on adherence
  and is not exposed to the pathology this sweep prices, but "not exposed to
  that one" is not "stable". Whether its 1.757% / 0.970% is one draw is the
  obvious next measurement and it was not bought here.

## What was deliberately not done

- **No re-parameterization of the §8.13 gate or the floor constant.** Item 18's
  own text says that is premature and blocked on the misspecified arm.
- **No change to `src/`, `MATH.md` or `DEFAULT_CAPACITY_POOLS`.** The map stays
  an instrument; the pools stay declared. A seed sweep of a probe is not a model
  change and MATH.md holds no measurement to move (R7).
- **No correction written into
  [the-pool-the-drain-logs-might-know](the-pool-the-drain-logs-might-know.md).**
  One instrument per commit, and a frozen record's repair is its own change.
- **No suite fixture pinning the spread.** What the sweep pins is that a cell
  moves, which is the absence of a stable number to pin; the arm's own printed
  blocks at seed 42 are already the reproducible half.
