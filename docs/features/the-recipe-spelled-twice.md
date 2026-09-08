# The recipe spelled twice

**Kind:** repair · **Status:** landed 2026-09-08 · **Roadmap:** `M102`, the reported residue

Frozen at land: this file says what was decided on the date it carries, never
how the code works today — that is MATH.md and the area `AGENTS.md`. When later
work changes the behaviour, it writes its own feature file; it does not edit
this one. Same status as [zenith.md](../../zenith.md), for the same reason.

## Goal

The ☕ editor's length field spelled its class inline: `MEASUREMENT_MINUTES_CLASS`
with `flow` replaced by `info`. [The ring the plugin painted blue](the-ring-the-plugin-painted-blue.md)
added a ring to both copies and reported the mirror rather than fixing it — R3's
"a second copy is a defect the moment it exists", and the one of the four
instrument recipes with no drift test where the rating pair has one. Nothing the
user sees changes: the rendered class strings are the same characters.

## Claims

### Claim — the two tints are one recipe

`src/lib/presentation/utils/measurement-prompt.test.ts`

- **Given** `MEASUREMENT_MINUTES_CLASS.flow` and `.info`
- **Then** they are identical once the channel token is masked

Red first: against the shipped string export, `.flow` is undefined.

## Out of scope

- **Folding the minutes and rating records into one keyed by width.** Three
  widths and four channels is a matrix nobody reads; two records each with a
  drift test is the shape the rating pair settled.
- **The stories.** The ⚡ story already asserts the `flow` ring and says why the
  ☕ story cannot; only its comment's "inline" clause was false.

## Read before building

- `src/lib/presentation/utils/measurement-prompt.ts` — `RATING_INPUT_CLASS`,
  the record-by-channel shape and its scanner comment
- `src/lib/presentation/utils/measurement-prompt.test.ts` — the rating drift
  test to mirror
- `src/lib/presentation/component/rest-log-form.svelte` — the inline literal
- `src/lib/presentation/component/{drain,flow}-log-form.svelte` — the two
  `flow` callers
- `src/lib/presentation/component/flow-log-form.stories.svelte` — the play
  comment naming the inline field
- `src/lib/presentation/style/STYLE.md` — the raw-instrument-field rule's
  "the ☕ length field is inline" sentence
- `ROADMAP.md` — M102's "Reported and not fixed" sentence

## Decisions

- **A record keyed by tint, `RATING_INPUT_CLASS`'s shape.** Full literals,
  because Tailwind's scanner cannot see an interpolated class. Rejected: a
  function taking the channel, for the same reason.

## Open questions

None.
