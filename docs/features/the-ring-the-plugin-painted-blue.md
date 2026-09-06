# The ring the plugin painted blue

**Kind:** repair · **Status:** landed 2026-09-06 · **Roadmap:** item `M102`

Frozen at land: this file says what was decided on the date it carries, never
how the code works today — that is MATH.md and the area `AGENTS.md`. When later
work changes the behaviour, it writes its own feature file; it does not edit
this one. Same status as [zenith.md](../../zenith.md), for the same reason.

## Goal

The 🪫, ☕ and ⚡ editors spell their fields as bare `<input type="number">`
carrying `outline-none focus:border-<channel>/60`. M102 read that as "the whole
focus indicator is a 1px border colour change".

**It is not, and the measurement is the point of this repair.** A focused field
already carried a ring: `oklch(0.546 0.245 262.881)` at `0px 0px 0px 1px` —
`@tailwindcss/forms`' hardcoded blue-600, the same off-token blue
[`the-field-that-answered-a-tab-with-a-border`](the-field-that-answered-a-tab-with-a-border.md)
zeroed on `number-input.svelte` with `focus:ring-0`. `outline-none` drops the UA
outline; it does nothing to the plugin's ring. So the defect was never a missing
indicator. It was an indicator in a colour no theme declares, on nine fields, in
a 46-theme catalogue.

Each recipe therefore takes `focus:ring-1 focus:ring-<channel>/60` beside the
border it already tinted — `field-input`'s shape, which exists for this reason,
at the border's own alpha so the ring reads as the border it traces rather than
as a second edge. The token ring **displaces** the plugin's; it does not stack
with it.

`ring-1` and not the `ring-2` that repair chose for `number-input`: that one
rings a wrapper standing off a field, where 1px would be lost against the
steppers' own edges. These ring themselves, at their own border's width.

## Reach

Nine fields, four recipes. `MEASUREMENT_MINUTES_CLASS` (⚡ and 🪫 length),
`RATING_INPUT_CLASS.mind` and `.body` (the 🪫 pair and the ☕ pre/post four) —
all three in `presentation/utils/measurement-prompt.ts` — and the ☕ length
field, whose `info` tint is spelled inline in `rest-log-form.svelte`.

The catalogue scan behind that count: every remaining `outline-none` in
`presentation/` and `routes/` is on a non-input (`tabs-content`,
`dropdown-menu-content`, `button`, the dialog close) or already rings.

## Scenarios

### Scenario — the ring is the field's own channel, not the plugin's blue

`src/lib/presentation/component/rest-log-form.stories.svelte`

- **Given** the ☕ editor open, which focuses its length field on mount
- **Then** an unfocused rating field's `box-shadow` is `none`
- **Then** the focused length field's `box-shadow` carries
  `<its own borderColor> 0px 0px 0px 1px`
- **When** the keyboard walks to Mind, and then to Body
- **Then** each carries the same 1px ring in its own computed border colour

Asserting ring **equals border** rather than "a ring exists" is deliberate: a
ring existed before this change, and the pre-fix run fails with
`oklch(0.546 0.245 262.881)` where the `info` token was expected. Each field
also asserts that blue is **absent** by name, because ring-equals-border alone
would pass if the plugin painted both — it does set `border-color` on a focused
input too, and only loses here to the `border-<channel>/30` the field already
carries. Stripping the fix entirely was run; the story fails.

The story is one theme, so this is the recipe's shape and not a catalogue sweep:
the ring is a token by construction once the class is right.

### Scenario — the `flow` recipe, which the ☕ editor cannot reach

`src/lib/presentation/component/flow-log-form.stories.svelte`

- **Given** the ⚡ editor opened by a row's own button, which takes the caret
- **Then** its length field carries the 1px ring in its own border colour, and
  not the plugin's blue

`MEASUREMENT_MINUTES_CLASS` is the one recipe of the four no rest-log story can
assert — the ☕ length field is the `info` tint, spelled inline. Without this the
two fields carrying the `flow` tint would be covered by nothing.

axe reads a story at rest and has no rule for the colour of a focus ring, which
is why the addon was green over all nine fields for their whole life — the same
blindness [`the-ink-the-instrument-read-as-opaque`](the-ink-the-instrument-read-as-opaque.md)
documents.

## Out of scope

- **The ☕ length field's inline literal.** It is
  `MEASUREMENT_MINUTES_CLASS` modulo the tint (`info` against `flow`), and
  `measurement-prompt.ts`'s own comment says the rating pair was centralized
  because six hand-kept copies drifted. So the minutes recipe has two
  definitions where the rating pair has one — a mirror, and the only one of the
  four with no drift test. That is a finding of its own, not this repair's diff:
  the repair adds one class to it and leaves it where it is.
- **Whether `ring-1` is enough at this size.** `field-input` ships it on the
  app's own text field, so this change matches a shipped decision rather than
  taking a new one. A catalogue contrast run over focus rings would be its own
  instrument; none exists.
- **The `--ring` token.** These rings are channel-tinted, like the borders they
  trace, not `ring-ring/50` — a Mind field ringed in `--ring` would say nothing
  about which capacity it collects.

## Doc routing

- `style/STYLE.md` — the raw-instrument-field rule, beside the composite-field
  one: which box rings, at which width and alpha, and that `outline-none` alone
  does not leave a field unringed.
