# The field that answered a tab with a border

**Kind:** repair · **Status:** landed 2026-09-06 · **Roadmap:** item `M101`

Frozen at land: this file says what was decided on the date it carries, never
how the code works today — that is MATH.md and the area `AGENTS.md`. When later
work changes the behaviour, it writes its own feature file; it does not edit
this one. Same status as [zenith.md](../../zenith.md), for the same reason.

## Goal

`number-input.svelte` suppressed the UA outline (`outline-none focus:ring-0` on
its `<input>`) and put nothing back, so a tab into any of the fields it draws
moved a 1px border tint and nothing else. Every button, badge and tab in the app
answers a keyboard focus with `focus-visible:ring-3 ring-ring/50`; this was the
one focused control that did not.

The wrapper — the row holding the two `tabindex={-1}` steppers and the field —
takes `has-focus-visible:ring-2 has-focus-visible:ring-ring/50`. It is the
wrapper because that is the box a reader sees as the control, and `ring-2`
rather than `ring-3` because the ring traces a border the caller may already be
tinting through `accent`.

The field keeps `outline-none focus:ring-0`. Neither half is redundant:
`outline-none` drops the outline the wrapper now replaces, and `ring-0` zeroes
the ring `@tailwindcss/forms` gives every focused input, whose colour is the
plugin's blue and not a theme token.

## Reach

One component, ~15 fields: the four day-constraint inputs
(`day-constraints-bar.svelte`), the nine Energy Lab parameter rows and two
accented Lab fields (`param-row.svelte`).

## Scenarios

### Scenario — the ring is drawn on the tab, and only on the tab

`src/lib/presentation/component/ui/number-input/number-input.stories.svelte`

- **Given** the field at rest
- **Then** the wrapper's computed `box-shadow` carries no `0px 0px 0px 2px` ring
- **When** the field is reached with the keyboard (the steppers are
  `tabindex={-1}`, so it takes the first tab)
- **Then** the field matches `:focus-visible`
- **Then** the wrapper's computed `box-shadow` carries the 2px ring
- **Then** the field's own shadow chain is still all-zero — the forms plugin's
  ring stays suppressed

The assertion is on the focused state on purpose. axe reads a story at rest and
has no rule for a suppressed outline, which is why the addon was green over this
control for its whole life — the same blindness
[`the-ink-the-instrument-read-as-opaque`](the-ink-the-instrument-read-as-opaque.md)
documents.

## Out of scope

- **`has-focus-visible:z-10` on the 4-up bar.** M101 asks for the geometry to be
  checked against the recipe `task-importance-select.svelte` needs. It is not
  needed here: that control joins its three options with `-ms-px` so neighbours
  share one border, while the bar's grid is `gap-x-grid-xl` / `gap-y-text-lg` —
  32px and 20px — with no negative margin anywhere and no `overflow-hidden`
  between the field and the page (`card-shell` sets none). A 2px ring has
  nothing to be clipped by. A `z-10` that guards against no overlap is a branch
  with no reachable failure (AGENTS.md §0).
- **The instrument fields in `rest-log-form.svelte` and
  `measurement-prompt.ts`.** They are raw `<input type="number">` elements with
  their own `outline-none focus:border-…` recipe, not this component, so they
  are a second finding and not this repair's diff.
- **Moving the app's ring to `ring-2`, or this one to `ring-3`.** The two widths
  are deliberate and stated in STYLE.md.

## Doc routing

- `style/STYLE.md` — the composite-field rule: which box rings, at which width,
  and why the input's two suppressions both stay.
