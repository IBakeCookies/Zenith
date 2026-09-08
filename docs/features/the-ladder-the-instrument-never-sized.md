# The ladder the instrument never sized

**Kind:** repair · **Status:** landed 2026-09-08 · **Roadmap:** item 35

Frozen at land: this file says what was decided on the date it carries, never
how the code works today — that is MATH.md and the area `AGENTS.md`. When later
work changes the behaviour, it writes its own feature file; it does not edit
this one. Same status as [zenith.md](../../zenith.md), for the same reason.

## Goal

The text ladder is one derivation for all 46 themes — `--ty-secondary`,
`--ty-silent`, `--ty-ghost` are `--ty-primary` at 70/55/40% over transparent
(`base.css`) — and the ink note in STYLE.md claims AA for the log-row label.
Composited, five themes disagree: the label reads 3.19–4.44:1, under the 4.5
bound the instrument itself carries. The instrument that shows this was
corrected on 2026-09-04
([the-ink-the-instrument-read-as-opaque](the-ink-the-instrument-read-as-opaque.md))
and deliberately left the repair for a run that did not yet exist; it also
reads one rung on one well, so the silent rung — 173 sites — has never been
measured at all.

Two steps, in order. First the instrument reads both content rungs over the
three surfaces they are drawn on, in every theme. Then the light side's alphas
are sized from that printout, with a named exception where a lift would
collapse the rungs. What the user sees: on the failing themes, quiet text
(durations, timestamps, the log row's labels) gets darker. Nothing else moves.

## What the instrument read

Storybook on :6006, all 46 themes, `node scripts/inset-contrast.mjs`, before
and after the token change. The step readings did not move (no theme by more
than 0.01).

| reading                | 70/55 ladder: min / median / under 4.5 | 80/75 light, 70/65 dark: min / median / under 4.5 |
| ---------------------- | -------------------------------------- | ------------------------------------------------- |
| secondary on the card  | 4.48 / 7.27 / `blueprint`              | 4.48 / 7.86 / `blueprint`                         |
| secondary on the inset | 3.19 / 5.78 / 5 themes                 | 3.19 / 6.28 / `blueprint`                         |
| silent on the card     | 3.13 / 4.76 / 20 themes                | 4.07 / 6.92 / `blueprint`                         |
| silent on the inset    | 2.55 / 4.05 / 35 themes                | 2.97 / 5.61 / `blueprint`                         |
| faintest rung step     | 1.249                                  | 1.074                                             |

The alphas were picked by a scratch sweep that re-sampled the same inks and
wells and mixed them analytically (canvas composites linearly in sRGB bytes; it
reproduced the script's readings to ±0.02). What it found: on the light side
`parchment` needs 0.74 for either rung to clear the inset, `solarized-light`
0.73, `bubblegum` 0.72, `ukiyo` 0.71, `fallow` and `riso` 0.70; on the dark side
`verdigris` needs 0.64 and every other dark theme less. `blueprint` needs 0.97
for secondary alone, and its opaque primary reads 4.68 on the inset, so no rung
under primary can clear it. Only the committed script's figures above are
quoted anywhere else.

## Claims

### Claim — the instrument prints the ladder, not one rung

`scripts/inset-contrast.mjs`, `src/lib/presentation/theme.stories.svelte`

- **Given** the Theme > Inset on card story in every theme
- **Then** each theme's line carries, beside `step` and `cr`, the composited
  ratio of `--ty-secondary` and of `--ty-silent` on the inset, on the card
  and on the page — six readings, `cr` being one of them
- **Then** a reading under `MIN_CR` on the inset or the card is a finding; a
  page reading is printed and never a finding (no content rung sits on the
  bare page)

### Claim — no figure from the uncommitted sweep survives the committed run

`src/lib/presentation/style/STYLE.md`, `ROADMAP.md`

- **Given** item 35's "19 of 19", "3.17–4.25:1", "167 sites" and "collapses
  the top two rungs", all read from a run nobody committed
- **Then** the ink note quotes only what the extended script prints on this
  branch — min, median and the failing set per rung × well — and the
  roadmap line is closed with the same numbers or none

### Claim — every theme's log-row label clears AA

`scripts/inset-contrast.mjs`

- **Given** all 46 themes after the token change
- **Then** the script exits with no `log-row label` finding
- **Then** every `--ty-silent` reading on the inset and the card is either
  ≥ 4.5 or named in the ink note as residue, with the theme and the reason
  the rule below could not carry it

### Claim — the rungs stay three rungs

`scripts/inset-contrast.mjs`

- **Given** every theme after the token change
- **Then** on the same well, `--ty-primary` against `--ty-secondary` and
  `--ty-secondary` against `--ty-silent` each read ≥ `MIN_STEP` (1.03), the
  script's existing bound for "reads as distinct"

### Claim — the step readings do not move (pin)

`scripts/inset-contrast.mjs`

- **Given** all 46 themes before and after
- **Then** no theme's `step` moves beyond scenery noise — the ink change
  touches no surface

## Out of scope

- **Widening the a11y gate past `fallow`.** Settled in the 2026-09-04 spec:
  axe cannot composite over `--background-image`, and the CI cost is unpriced.
- **`MIN_CR`.** 4.5 is AA. Moving it is not a repair.
- **`--ty-ghost`.** 40% carries no content — disabled states and decoration —
  and no site reads a figure from it. It is neither measured nor moved.
- **Moving a theme's `--ty-primary`.** Every border, input, hover and line
  token derives from it; a per-theme fix lands on the rung, never the seed.
- **Rewriting `text-ty-silent` sites to `text-ty-secondary`.** That is 173
  edits to dodge one alpha, and it deletes the rung the ladder exists for.
- **A per-site census.** Every text site sits on the page, a card or an inset,
  so the three wells are the census; the roadmap's "167 sites" is not a
  measurement anyone needs to repeat.
- **A second script.** `inset-contrast.mjs` already owns the composited-ink
  reading and the story built for it (settled 2026-09-04).
- **Re-measuring `blueprint`'s historical 3.95:1.** Frozen with the method
  that read it (settled 2026-09-04).

## Read before building

- `scripts/inset-contrast.mjs` — `composite` (takes any CSS colour and a
  sampled background), `sample`, the `inset` and `around` clips, `MIN_STEP`,
  `MIN_CR`, and the `orbit` warning in the docblock
- `src/lib/presentation/theme.stories.svelte` — the Inset on card story: the
  `p-page` wrapper is the page well, `inset-card` the card, `inset-well` the
  inset; the silent rung needs a `text-ty-silent` span the script can read
  `color` from, because Tailwind's scanner is textual and a `color-mix` string
  read off `:root` is not a colour a canvas will paint
- `src/lib/presentation/style/base.css` — the `/* derived from seeds */`
  ladder in `:root`, and `.dark`, which today re-derives none of it
- `src/lib/presentation/style/themes.css` — `.ukiyo`'s `--surface-inset`: the
  shape of a per-theme exception on a derived token and the comment it
  carries; `.solarized-light`'s header, which already says the ladder "puts
  body copy under AA" from its palette tone; `.blueprint` is a `dark` theme
  (`css: ['blueprint', 'dark']` in `business/model/theme.ts`)
- `src/lib/presentation/style/STYLE.md` — the ink note under the
  `--surface-inset` bullet: the five-theme sentence, "five light themes", and
  the "sizing the ink repair is the corrected run's job" sentence this spec
  discharges
- `docs/testing.md` — the a11y paragraph's "five light themes ship a log-row
  label under 4.5:1"
- `ROADMAP.md` item 35 — close it; correct "five light themes" (see Decisions)
- `src/lib/presentation/style/tokens.css` — `--color-ty-*` and the `log-row`
  utility (`text-ty-secondary`), for what the label actually is

## Decisions

- **Kind `repair`, with a visible change** — a constant disagreed with the
  bound its own doc claims; the fix moves five themes' quiet text darker. Said
  outright rather than dressed as a feature: no user asked for it in their
  words, the instrument did.
- **`blueprint` is a dark theme, and the roadmap, STYLE.md and testing.md
  all call the failing five "light".** Four are light. `blueprint`'s ink is
  L 0.98 over a lightened inset — the risk the script's docblock names for the
  dark side. Correct the three live sites in the landing commit; the frozen
  2026-09-04 spec keeps its sentence. Rejected: planning a light-only lift and
  leaving `blueprint` at 3.19, because the item's title says "light side" —
  the finding is the five, the title was written from a wrong count.
- **Per-side lift first, named exceptions second, residue last.** Raise the
  light `:root` alphas (secondary, silent) to the smallest values at which
  every light theme clears `MIN_CR` on the inset and the card **and** the
  rung-distinctness claim still holds on every light theme. A theme the lift
  cannot carry without collapsing a rung gets its own `--ty-secondary` /
  `--ty-silent` in `themes.css`, `ukiyo`-style; a theme no exception carries
  either is residue, named in the ink note. `blueprint` follows the same
  ladder on the dark side: a `.dark` re-derivation only if the run shows a
  second dark theme failing, otherwise one exception. Rejected: exceptions
  only, because 19 light themes declaring `--ty-primary` at L 0.15–0.35 all
  sit in one band and one number is fewer to hold than nineteen. Rejected:
  a lift with no rung bound, because "one alpha per rung, or roles drift"
  (STYLE.md) — and the roadmap's lead is exactly that `bubblegum`'s lift
  reaches secondary's own value.
- **Rung distinctness reuses `MIN_STEP`** — the script's bound for two
  fills reading as distinct is the same question asked of two inks on one
  fill. Rejected: a fresh alpha-gap constant, because it would be a second
  calibration nobody measured.
- **Six readings on three wells, not a site census** — `composite` already
  takes any ink over any sampled patch; the page patch is the one addition.
  Rejected: reading `--ty-silent` off `:root`, because the computed value is
  the `color-mix` string and the canvas paint that composites it is not
  guaranteed to parse it — the story span is the resolved colour.
- **The dark side re-derives both rungs, though only silent moved** — `:root`
  went to 80/75 for the light side, so `.dark` has to say 70 for secondary to
  keep it; the rule's smallest dark values are 70/65 (secondary/silent step
  1.074 on `verdigris`'s inset). Rejected: one 80/75 for both sides, because
  the dark side clears 4.5 at 70/65 and a brighter quiet text there is a change
  nothing asked for.
- **`blueprint` is residue, not an exception** — an exception on its rung would
  have to be alpha 0.97, which is primary, and the rung claim fails at 1.00.
  Its inset is the cause: an opaque card at L 0.445 climbing 0.1 under near-white
  ink. A well exception is the fix and is a surface change, which the pin above
  forbids this repair from making; it is named in the ink note as the lead.
- **Item 29's rule governs every number** — the roadmap's figures are leads
  in this spec and are not carried into STYLE.md, testing.md or the closed
  roadmap line unless the committed run reprints them.

## Open questions

None.
