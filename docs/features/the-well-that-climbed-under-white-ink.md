# The well that climbed under white ink

**Kind:** repair · **Status:** landed 2026-09-08 · **Roadmap:** item 35, the residue

Frozen at land: this file says what was decided on the date it carries, never
how the code works today — that is MATH.md and the area `AGENTS.md`. When later
work changes the behaviour, it writes its own feature file; it does not edit
this one. Same status as [zenith.md](../../zenith.md), for the same reason.

## Goal

[The ladder the instrument never sized](the-ladder-the-instrument-never-sized.md)
left one theme under AA and named the cause: `blueprint`'s inset. The dark rule
lifts a well 0.1 above its card, and under a near-white primary on an opaque
card at L 0.445 the lifted well holds even opaque ink at 4.68:1, so no rung
alpha under primary can clear it. That spec's pin forbade a surface change, so
the theme shipped as residue with four findings on the committed run: the row
label 3.19:1 on the inset, secondary 4.48:1 and silent 4.07:1 on the card,
silent 2.97:1 on the inset.

Nothing outside `blueprint` moves. On it, the recessed surfaces (the log rows,
the range track, the nested panel) go darker instead of lighter, and quiet text
goes brighter.

## Claims

### Claim — `blueprint` clears every reading

`scripts/inset-contrast.mjs blueprint`

- **Given** the Inset on card story in `blueprint`
- **Then** the script exits with no findings
- **Then** every rung step on every well is ≥ `MIN_STEP`

As printed after the change: step 1.511, cr 7.51, secondary 5.92 / 5.27 on
page / card, silent 5.45 / 4.86 / 6.85 on page / card / inset, rungs 1.39/1.08
page, 1.36/1.09 card, 1.45/1.10 inset.

### Claim — the other 45 do not move (pin)

`scripts/inset-contrast.mjs`

- **Given** all 46 themes
- **Then** no theme other than `blueprint` changes any reading beyond scenery
  noise, and the run ends with no findings

## Out of scope

- **Darkening `--surface-card`.** It would fix the card readings without a
  ladder exception, but the value is a rendered composite the theme's block
  matched on purpose so that going opaque shifted no colour; and silent needs
  the card near L 0.41, on a page at 0.40, where only the border separates
  them.
- **A dark-rule change.** The other dark themes clear at 70/65 with a climbing
  well; this is one palette's inversion, not the rule's.
- **The historical 3.95:1 and 4.68:1 in STYLE.md and base.css.** They record
  why the step is 0.1 and are frozen with the runs that read them.

## Read before building

- `src/lib/presentation/style/themes.css` — `.blueprint`: `--surface-card`,
  `--ty-primary`, and the `--secondary-hover` comment that already flips the
  dark hover direction for this ink; `.ukiyo`'s `--surface-inset` for the shape
  of a per-theme exception on a derived token
- `src/lib/presentation/style/base.css` — the `.dark` well rule and ladder;
  the `:root` ladder comment naming `blueprint` as residue
- `src/lib/presentation/style/STYLE.md` — the `--surface-inset` bullet's ink
  note: "Every minimum is `blueprint` … the lead is its well"
- `docs/testing.md` — the a11y paragraph's "`blueprint` ships a sub-AA log-row
  label only its well can fix"
- `ROADMAP.md` item 35 — the residue sentence
- `scripts/inset-contrast.mjs` — `MIN_CR`, `MIN_STEP`, and the one-theme
  invocation

## Decisions

- **The well recedes, by the light side's step.** `l - 0.1` on the card,
  alpha untouched since the card is opaque. The theme's own block already
  inverts the dark hover for the same reason: near-white ink wants its fill to
  go down. Rejected: a smaller climb, because the card at +0 already fails
  secondary at 4.48.
- **The ladder is the light side's pair, 80/75.** With the well receding the
  card is the binding surface, and 70/65 reads 4.48 / 4.07 there. Rejected: the
  smallest pair that clears (about 76/71), because for one exception a pair the
  catalogue already holds is one fewer number to size than a bespoke one, and
  the smallest-values rule exists to move the fewest themes, which here is one
  either way.
- **Both halves, not one.** A receding well alone leaves the two card findings;
  a ladder alone needs 0.97 on the climbing well and collapses the rungs.

## Open questions

None.
