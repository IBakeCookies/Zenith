# The light the window left on the sill

**Kind:** feature · **Status:** landed 2026-09-09 · **Roadmap:** the 2026-08-26 `cathedral` finding

Frozen at land: this file says what was decided on the date it carries, never
how the code works today — that is MATH.md and the area `AGENTS.md`. When later
work changes the behaviour, it writes its own feature file; it does not edit
this one. Same status as [zenith.md](../../zenith.md), for the same reason.

## Goal

On `cathedral` the rose window is no longer drawn at any width. In its place a
thin band of its light — the four floor-pool colours, red, blue, gold and green
in the order the pools lie across the nave — runs along the underside of the
app bar, and the god rays and halo fall from it. The day-setup labels stay
readable everywhere, and the theme keeps a sign of the window on every screen,
where [the previous change](the-window-that-lit-the-labels-under-it.md) only
showed it from 1856px.

## What was tried

Same day as the gutter change, on the dev server at 1440px, injected CSS:

- **A 100×10 strip behind the bar**, at the bar's top and at its middle. The
  bar is `surface-float` with a 2rem `backdrop-blur`, so both smear into a
  faint warm haze indistinguishable from the halo already there. At the bar's
  bottom edge it peeks out crisp, which is the only place it reads.
- **Hard four-colour segments**, 100×3 and 160×6, below the bar. Legible, and
  they read as a brand stripe, not as glass.
- **A soft four-colour band the column's width, 3px, below the bar.** Reads
  as light from above the frame landing on a sill; the colours sit where the
  pools sit. Chosen, widened to the viewport so the stops align with the pools
  at every width.
- **The same band at the viewport's top edge**, behind the bar: invisible.

## Scenarios

### Scenario — the light lies in the gap between the bar and the first card

`e2e/scenery.e2e.ts`

- **Given** the `theme` cookie is `cathedral`, any viewport
- **When** `/` loads
- **Then** `.theme-helper-1`'s box starts at or below the `<header>`'s bottom
- **Then** `.theme-helper-1`'s box ends at or above the first `.card-shell`'s top

### Claim — the eleven labels the window used to cover still clear AA

The scratchpad instrument from the previous spec, scoring the same eleven
label boxes against the landed CSS at 1440px and 1888px. Not committed, for
the reason that spec gives.

## Out of scope

- **Keeping the window in the gutter above 116rem.** Asked to go: one theme,
  one light source, and the band already says where the window is.
- **A band behind the bar.** Measured invisible (above). The band is under the
  bar's border, in the gap the layout already leaves.
- **Matching the band to the column's width.** The pools are placed in viewport
  percentages, so a viewport-wide band with transparent ends is the one whose
  colours land over their pools everywhere.

## Read before building

- `src/lib/presentation/style/scenery/cathedral.css` — `.theme-helper-1`, the
  window; `.theme-helper-3`, the four pools whose colours and positions the band
  takes; the rays' origin
- `src/lib/presentation/style/themes.css`, `.cathedral` and the `116rem` gate
  after it — the `--cathedral-window-*` properties, of which `x` and the gate go
- `src/lib/presentation/component/nav.svelte` — the bar has no height class;
  it is `py-box-md` around its controls and renders 4rem tall
- `src/lib/presentation/style/STYLE.md` — the scenery-gutter bullet names
  `cathedral`; it no longer belongs there
- `e2e/scenery.e2e.ts` — the two gutter scenarios from the previous spec are
  replaced by the one above

## Decisions

- **Full viewport width, transparent at both ends, 3px, at `4rem`.** The
  width the pools' positions demand (above); `4rem` is the bar as it renders,
  and the band sits directly under its border — the e2e scenario is what holds
  the two together, since the bar has no height token to share. Rejected 100px as asked: at 3px it
  is a hairline logo; the length is what makes it read as light rather than
  a mark.
- **The four pool colours, at the pools' x positions (22 / 42 / 62 / 81%).**
  One source of truth would be a shared property per pool; four colours read
  twice in one file is the mirror R3 names, so the band reads
  `--cathedral-pool-*` properties the pools also read.
- **`--cathedral-window-y` and `-size` stay and describe the band** — the
  halo and rays still derive `--cathedral-window-mid` from them, so the light
  source is the band. `--cathedral-window-x` and the gutter gate are removed;
  there is nothing to move.
- **Kind `feature`** — the theme shows something at 1440px that it did not
  this morning.

## Open questions

None.
