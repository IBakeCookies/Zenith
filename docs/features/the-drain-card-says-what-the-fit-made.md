# The drain card says what the fit made

**Kind:** feature · **Status:** landed 2026-09-12 · **Roadmap:** none

Frozen at land: this file says what was decided on the date it carries, never
how the code works today — that is MATH.md and the area `AGENTS.md`. When later
work changes the behaviour, it writes its own feature file; it does not edit
this one.

## Goal

On `/analytics`, Flow Calibration prints a count and, under it, what the fit
made of those logs. Drain Calibration printed the count alone: the sentence
under it had been a how-to-rate prompt, shown to users who had already rated,
and was cut to the empty state. After this, the drain card carries the same
kind of sentence the flow card does — a status read off the two α fits, never a
prompt: personalized from N ratings, or N ratings the fit could not read and
the defaults in use. The count is every rating on record; the status counts
only the ratings dated before today, which is what α reads.

The status is the analytics snapshot's answer, and that store lands after the
ratings' own store does. Until it lands the card is the count and nothing
else — a status in the gap would call a personalized model default.

## Scenarios

### Scenario — A fitted user reads the status under the count

`e2e/calibration-fits.e2e.ts`

- **Given** a profile with one 🪫 rating carried past midnight
- **When** the user opens `/analytics`
- **Then** the Drain Calibration card prints `1` and `drain rating`
- **Then** it shows `Drain rates personalized from 1 rating`

### Scenario — The status counts what the fit read, the headline what exists

`drain-calibration-card.stories.svelte` — _A rating the fit defers_

- **Given** four ratings, one of them dated today
- **Then** the headline reads `4`
- **Then** the status reads `Drain rates personalized from 3 ratings`
- **Then** `1 rating logged today, counted from tomorrow` still stands on its own line

### Scenario — Ratings the fit could not read say so

`drain-calibration-card.stories.svelte` — _Ratings the fit could not read_

- **Given** two ratings on record and both α at their defaults
- **Then** the card reads `Your 2 ratings gave the fit nothing to read`

### Scenario — No status before the fit answers

`drain-calibration-card.stories.svelte` — _Before the fit answers_

- **Given** two ratings on record and no fit answer yet
- **Then** the headline reads `2` and no status line is shown

### Scenario — No status where there is nothing to answer about

`drain-calibration-card.stories.svelte` — _Nothing rated_

- **Given** no ratings
- **Then** the empty-state sentence shows and no status line does

## Out of scope

- A per-reservoir status. The two α fits read the same rows, and the "Your
  model" card already prints each reservoir's fit; the card says one thing.
- Restoring the how-to-rate sentence for rated users — it was cut on purpose
  on 2026-09-03.

## Docs

- `src/lib/presentation/AGENTS.md` — the calibration-cards section names the
  🪫 body as headline, status and pending line.
