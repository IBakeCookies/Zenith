# The window that lit the labels under it

**Kind:** feature · **Status:** landed 2026-09-08 · **Roadmap:** the 2026-08-26 `cathedral` finding

Frozen at land: this file says what was decided on the date it carries, never
how the code works today — that is MATH.md and the area `AGENTS.md`. When later
work changes the behaviour, it writes its own feature file; it does not edit
this one. Same status as [zenith.md](../../zenith.md), for the same reason.

## Goal

On `cathedral`, the day-setup labels are readable: the rose window no longer
sits behind the first card. On a wide screen it is drawn whole in the gutter
beside the column, the way `moonphase`'s moon is; below the width where the
gutter fits it, it is not drawn, and the nave keeps its candle glow, god rays
and floor pools.

## What the three-arm run read

[The moon that lost its sky](the-moon-that-lost-its-sky.md) left `cathedral`
out as a redraw, and the roadmap finding priced it from a run that put five
labels at 1.00:1. The 2026-09-04 re-read asked for three arms before choosing,
with the kill criterion fixed first: if deleting the window clears every label,
build that and drop the redraw.

Run 2026-09-08 on `/` with a fresh profile, dev server, viewport 900 tall, text
hidden and every pixel under each text node's box scored against its composited
ink (alpha inks composited over the pixel first; rays frozen at their brightest).
Eleven labels intersect the window's box at HEAD, identical at both widths.

| arm                             | 1440px                                 | 1888px                         |
| ------------------------------- | -------------------------------------- | ------------------------------ |
| A — HEAD                        | 10 of 11 under 4.5, worst 2.21 (`hrs`) | 10 of 11 under 4.5, worst 2.21 |
| B — `.theme-helper-1` not drawn | 0 of 11, worst 5.17                    | 0 of 11, worst 5.17            |
| C — window in the gutter, 14rem | = B (not drawn)                        | no label within 2.5rem of it   |

**The 1.00:1 readings do not reproduce.** The closest at HEAD is 2.21, and no
label's box holds a pixel of its own ink colour. The instrument that read 1.00
was never committed; the most likely cause is that it sampled the text's own
glyph pixels. The failure it pointed at is real all the same — ten labels, not
seven, and the worst of them at half the bound.

B clears, so the redraw is dropped. C is B plus the window kept where the
gutter fits it, and STYLE.md's gutter rule already says which.

## Scenarios

### Scenario — the window clears both occluders

`e2e/scenery.e2e.ts`

- **Given** the `theme` cookie is `cathedral` and the viewport is 1888×900
- **When** `/` loads
- **Then** `.theme-helper-1`'s box does not intersect the `<header>`'s box
- **Then** `.theme-helper-1`'s box lies right of every `.card-shell`'s right edge
- **Then** `.theme-helper-1`'s box lies entirely inside the viewport

### Scenario — below the breakpoint the window is not drawn

`e2e/scenery.e2e.ts`

- **Given** the `theme` cookie is `cathedral` and the viewport is 1440×900
- **When** `/` loads
- **Then** `.theme-helper-1` is not visible

### Claim — every label over the window's old box clears AA

The scratchpad instrument above, scoring HEAD's eleven label boxes against the
landed CSS: 0 of 11 under 4.5, worst 5.17 at 1440px and 6.29 at 1888px, where
the halo and rays now sit in the gutter with the window. Not committed — the moon spec refused a second
permanent mechanism for this one fact, and the two scenarios gate the geometry
that produces the reading.

## Out of scope

- **The redraw.** Fewer, larger elements at 11rem. Killed by arm B: the price
  was design work and the labels clear without it.
- **Drawing it at 11rem from 110rem**, the moon's second step. The moon spec's
  objection to `cathedral` in the gutter was detail at 11rem (petals ~30px);
  one gate at the width that fits 14rem keeps the petals at ~53px and the
  jewels at 17px, which the arm C screenshot showed legible.
- **A narrow-viewport composition.** Below the gate the nave is candle glow,
  rays and pools with the light source above the frame — arm B's screenshot,
  which reads as a nave.
- **The card glass.** `--surface-card` at 5% is what let the window through;
  it is the theme, and the eclipse decision in the moon spec already declined
  to darken a card for its focal object.
- **A committed occlusion or label-contrast sweep.** Settled in the moon spec.

## Read before building

- `src/lib/presentation/style/scenery/cathedral.css` — `.theme-helper-1`'s
  `top`/`left`/`translate`; the rays' conic origin at `50%`
- `src/lib/presentation/style/themes.css`, `.cathedral` — the three
  `--cathedral-window-*` properties and the comment on why they live there;
  the halo gradient `at 50% var(--cathedral-window-mid)`
- `src/lib/presentation/style/scenery/moonphase.css` — the gate's shape:
  `display: none` by default, one `@media (min-width)` that draws it,
  `left: var(--spacer-gutter)`, `top: 10rem`
- `src/lib/presentation/style/base.css` — `--spacer-gutter`
- `src/lib/presentation/style/STYLE.md` — the scenery-gutter bullet, which
  names `moonphase` as the theme that degrades; it is at its line budget
- `e2e/scenery.e2e.ts` — the two moon scenarios the cathedral ones mirror
- `ROADMAP.md` — the 2026-08-26 scenery-gutter finding and its 2026-09-04
  re-read: collapse both to a date and this file

## Decisions

- **One gate at `116rem`, 14rem.** `50vw − 43rem − 1rem ≥ 14rem` gives
  `116rem` (1856px). Rejected two steps (see Out of scope). Rejected 15rem at
  1888's exact fit: 1920px is the common width and 14rem leaves it 3rem of
  air rather than one.
- **The window's x becomes a property, `--cathedral-window-x`, declared on
  `.cathedral` like its y and size, defaulting to `50%`.** The halo and the
  rays read it, so above the gate all three move to the gutter together —
  "a halo that does not follow the window is a bloom around nothing" is the
  theme's own comment. Below the gate the three keep today's geometry: the
  window is not drawn, and halo and rays fall from where it would be, above
  the bar. Rejected a gutter-mode block in the scenery file alone: the halo is
  painted by the page gradient in `themes.css`, which the scenery layer cannot
  reach (custom properties inherit downward only; the moon spec's decision).
- **The gate is a top-level `@media` block on `.cathedral` in `themes.css`**,
  not nested in the rule, so `--cathedral-window-x/y/size` switch together and
  the scenery file only reads them. The scenery file carries the matching
  `display` gate, since `display` is not a property the page gradient shares.
- **Kind `feature`, like the moon spec** — what changes is what the user sees
  on `/`, and it can be said in their words.

## Open questions

None.
