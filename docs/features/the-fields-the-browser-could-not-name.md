# The fields the browser could not name

**Kind:** repair · **Status:** landed 2026-09-07

Frozen at land: this file says what was decided on the date it carries, never
how the code works today — that is MATH.md and the area `AGENTS.md`. When later
work changes the behaviour, it writes its own feature file; it does not edit
this one. Same status as [zenith.md](../../zenith.md), for the same reason.

## Goal

DevTools logs `A form field element should have an id or name attribute` for
every control it cannot key autofill or session restore against. A sweep of
every `<input>`, `<select>` and `<textarea>` under `src/` found **23 controls,
of which 21 carried neither.** The two that did are the reason the rule is
worth writing down rather than hand-applying: `number-input.svelte` took an
`id` prop, and `task-importance-select.svelte` derived a `name` from
`$props.id()` — the right answer, arrived at twice, for two different reasons,
and copied by nothing.

Every control now carries one. The warning is the visible half; the durable
half is that a control with no stable name is a control the browser cannot
restore, and nothing in the repo said so.

## Reach

**`$props.id()` wherever the component can mount twice**, which is most of
them: the add dialog and a row's inline editor hold the same fields at once
(`task-form-fields.svelte`, `task-edit-form.svelte`), and the three log editors
and `task-row-shell.svelte` render once per task row. A literal there is a
duplicate id the moment a second row opens.

**A literal only where one instance exists**, which is two places:
`day-constraints-bar.svelte`'s budget slider and the dialog story's demo field.
Neither is `<label for>`-bound — the slider is named by `aria-label`, and the
four `for`-bound literals in that file are its `NumberInput`s and predate this
change.

`NumberInput` keeps its `id` prop optional and falls back to its own
`$props.id()`. Required would have been the tidier signature and the wrong one:
the prop exists so a visible `<label for>` can point at the field, and a caller
that needs no label should not have to invent a name to stay warning-free.

`$props.id()` may be called **once per component**. Two files here wanted two
ids and called it twice; the second is suffixed off the first
(`${id}-tag-list`, `${id}-suggestions`), which keeps the per-instance
uniqueness the ids exist for.

## The styling half

The same sweep read the controls' classes, and found four recipes shared by
copy rather than by name:

- **The two fields in `day-actions.svelte` were off-system** — `bg-surface-card`
  against `bg-input`, `rounded-sm` against `rounded-lg`, `text-ty-secondary`
  against `text-ty-primary`, and a **bare `border`** taking its colour from the
  text beside it. Both are `field-input` now, which is the recipe they were
  approximating. The routine-name field shares its row with a button, and the
  row aligns them with `items-end` rather than dropping `field-input`'s top
  margin — the margin is the utility's layout, not a call-site choice.
- **`range-track`** (`tokens.css`) — the cluster both `type="range"` inputs
  spelled by hand. The `accent-*` stays at the call site: the three task
  sliders each carry the capacity they set, and the utility sets no
  `accent-color`, so neither call site's paint changed.
- **`input-overlay`** (`tokens.css`) — the transparent full-size control under
  `must-do-toggle.svelte`'s and `task-importance-select.svelte`'s button
  recipes, which is STYLE.md's `appearance-auto` carve-out and was spelled
  identically in both.
- **`task-row-shell.svelte`'s completion box rang at `brand/40`**, the one
  focus ring in the app at that alpha; `field-input` and the composite-field
  rule both ship `/50`.

`must-do-toggle.svelte` also spelled `has-[:focus-visible]:` where its sibling
had the canonical `has-focus-visible:`. Same output, and the lint warning was
already firing.

## Out of scope

- **Dropping `@tailwindcss/forms`.** STYLE.md recorded the two bare-`border`
  inputs in `day-actions.svelte` as the blocker, and this change clears it —
  nothing else leans on the plugin's base layer. It stays loaded anyway: the
  instrument fields' rings **displace** its focus ring rather than replacing
  it, so removing it is a change to all nine of those, not a deletion. The
  recorded blocker was corrected; the removal was not taken.
- **`task-importance-select.svelte`'s radios keep `name` and take no `id`.**
  A `name` is what makes three inputs one radio group, and the browser asks for
  either.
- **Label association.** No `for` was introduced. Every field here already sits
  inside the `<label>` that names it, which is the association; adding `for` as
  well would be a second statement of it.

## Doc routing

- `style/STYLE.md` — the id rule, in the form the code takes it: `$props.id()`
  where a component can mount twice, a literal where one instance exists or a
  visible `<label for>` has to name it. The `@utility` list gains `range-track`
  and `input-overlay`, and the forms-plugin blocker above was corrected in the
  same edit. Paid for by compressing the checkbox bullet — the file was at its
  490-line budget, and `brief-size.mjs` says raising a budget is a decision,
  not a fix.
- `tokens.css` — the two new utilities, and `field-input`'s comment relisting
  its call sites.
