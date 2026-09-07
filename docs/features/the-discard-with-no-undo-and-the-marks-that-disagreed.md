# The discard with no undo and the marks that disagreed

**Kind:** feature · **Status:** landed 2026-09-07 · **Roadmap:** none — found by
an audit of every inline delete in the app

Frozen at land: this file says what was decided on the date it carries, never
how the code works today — that is MATH.md and the area `AGENTS.md`. When later
work changes the behaviour, it writes its own feature file; it does not edit
this one. Same status as [zenith.md](../../zenith.md), for the same reason.

## Goal

A discarded timed session can be taken back. `Discard timed session` was the
one control in the app that destroyed a reading the user gave with no way back
— every other delete already offers eight seconds of undo — and the reading it
destroyed is the one a 🪫 log gets seeded from.

Every inline control that corrects or drops a row now also looks like the same
control. The audit that found the discard found four vocabularies for the same
two jobs: a hover-revealed plated button on the task rows, a bare glyph on the
analytics log rows, an emoji `🗑` in the measurement editors, and a plated
`variant="destructive"` menu item for a routine. A user who learned one did not
recognise the next.

## Scenarios

### Scenario — a discarded session reading comes back

`src/lib/presentation/component/day-actions.svelte.spec.ts`

- **Given** a stopped timer holding 45 minutes
- **When** `Discard timed session` is clicked and the toast's `Undo` is invoked
- **Then** the strip reads `45m` again

A spec and not a story `play`: the undo lives on a toast and the `Toaster` a
story would need is the layout's ([docs/testing.md](../testing.md)).

### Scenario — the undo refuses onto a clock that is running again

`src/lib/presentation/component/day-actions.svelte.spec.ts`

- **Given** a stopped timer holding 45 minutes, discarded, and a new session
  started inside the undo window
- **When** the toast's `Undo` is invoked
- **Then** the strip still does not read `45m`, and the new session is still
  running

### Scenario — the discard is announced (pin)

`src/lib/presentation/component/day-actions.svelte.spec.ts`

- **Given** a stopped timer holding 45 minutes
- **When** `Discard timed session` is clicked
- **Then** the strip no longer reads `45m`

### Claim — every control the unification renamed is still named

The 32 test queries that asked for `✓`, `✕` and `🗑` by their glyph now ask for
`Save`, `Cancel` and `Delete this drain rating`, because an icon-only button's
accessible name is its `aria-label` and a glyph-only button's was its text.

- **Given** the six story files and five e2e files that drive these controls
- **Then** all of them still resolve their control, and the suites pass
  unchanged otherwise — the rewrite is the assertion

No new test for the treatment itself. A plate, a colour and a box are what
`STYLE.md` and a story's `toHaveClass` already govern, and the reason the
change was made is a reading of the screen that no assertion can hold.

## Out of scope

- **The routine delete warming from grey.** It keeps
  `DropdownMenu.Item variant="destructive"`, so it is red the moment it
  appears rather than reddening on hover like the row pairs. Removing the
  variant repaints the icon dark — the item's base carries
  `not-data-[variant=destructive]:focus:**:text-accent-foreground`, which
  paints descendants — so matching the rows here is a change to the vendored
  primitive, not to a call site.
- **The nine other dead `class="h-4 w-4"` icons** in the presentation layer.
  `icon-xs` carries `[&_svg:not([class*='size-'])]:size-3`, so an `h-4 w-4`
  inside one renders at 12px and the class does nothing. The three this change
  authored were removed; the rest render correctly by accident and are a sweep
  of their own (AGENTS.md §0 — say it, do not fix it).
- **The rename form's `p-box-lg`.** Byte-identical to `task-edit-form`'s frame,
  so which editor family a one-input form belongs to is a design call and not a
  defect.
- **`component/ui/`'s own marks** — the dialog's close `✕` and the footers in
  `task-edit-form` / `task-form`. `shadcn add` rewrites that directory
  (presentation/AGENTS.md), so a mark changed there is a mark changed until the
  next upgrade.
- **A confirm step on the discard.** The undo window is the app's settled
  answer to a destructive click and a second one would be the only place that
  asks twice.

## Read before building

- `src/lib/presentation/style/tokens.css` — `@utility row-action`, new, and
  where the whole argument for the treatment lives: a 24px band, colour-only
  hover left to the call site, `size-3` on the icon. It carries the reasoning
  because it is not a budgeted rules file.
- `src/lib/presentation/style/STYLE.md` — the `@utility`-over-wrapper rule that
  says a repeated class cluster becomes a utility, which is what `row-action`
  is; it lists it.
- `src/lib/presentation/AGENTS.md` — the icon vocabulary is stated there, and
  the discard is recorded in the undo-window section beside the task and log
  deletes. Its budget in `scripts/brief-size.mjs` rose by the 8 lines this
  spent, after the argument moved to `tokens.css`.
- `src/lib/presentation/component/task-row-shell.svelte` — held
  `ROW_ACTION_CLASS = buttonVariants({ variant: 'ghost', size: 'icon-xs' })`, a
  local mirror of a treatment three other files inlined by hand. Deleting it is
  the R3 half of this change.
- `src/lib/presentation/component/day-actions.svelte` — `onTerminalClick`, the
  discard, and the only behaviour change in the diff.
- `src/lib/presentation/component/measurement-form-actions.svelte` — the ⚡/🪫/☕
  editors' one action bar, and the last plate to come off. It was extracted to
  end exactly this drift (presentation/AGENTS.md) and was the file still holding
  `Button variant="ghost"`, so the tag card's rename footer and this one — the
  same three controls — did not match until it moved too.
- `src/lib/presentation/component/fit-log-summary.svelte` — the reference
  two-step confirm, and the proof that a word confirm needs no plate.
- `src/lib/presentation/component/ui/button/button.svelte` — read for
  `ghost`'s `hover:bg-surface-hover` and `icon-xs`'s descendant `size-3`. Both
  are why the row controls left `Button` rather than configuring it.
- `e2e/helpers.ts` — `logFlow`'s save click had to become form-scoped: on `/`
  the routine trigger is a second `Save`, and Playwright's strict mode fails on
  the second match.
- MATH.md — **no change.** A discarded reading was never fitted; nothing
  restored by the undo reaches the model differently from a reading that was
  never discarded.

## Decisions

- **One `@utility`, not one component** — `row-action` is applied by 15 call
  sites across four files, each of which owns its own colour. A wrapper would
  have to take the colour, the icon and the label as props and would still not
  fit the armed confirm, which is two words in the same band. Rejected: a
  `RowAction.svelte`; rejected: configuring `Button`, whose `ghost` variant
  exists to paint a plate on hover.
- **The hover is in the colour and never a fill** — per the user, who named the
  analytics log rows as the treatment to converge on. A row that already lifts
  on hover puts a second surface under the mark, and the two read as a button
  landing on the row rather than belonging to it.
- **`h-6 min-w-6`, not `size-6`** — the fixed square silently made the utility
  icon-only, so the armed confirm's two words fell back to their own metrics and
  the row's height dropped from 24px to 20px when it armed. A band with a 24px
  width floor holds an icon at 24×24 and a word at its natural width, and every
  control then centres against the same box. This is also the answer to the
  apparent `items-center` failure: `items-center` was working, and centring
  boxes of different heights around different font sizes is what read as
  misaligned text.
- **Lucide everywhere a control is a control** — the emoji `🗑` and the text
  glyphs `✓ ✕` became `Trash2`, `Check` and `X`. An emoji renders in the
  platform's font at the platform's weight and cannot be given a hover colour;
  a text glyph has no consistent size beside an icon. Rejected: emoji
  throughout, which is what three of the four vocabularies already were and is
  why they disagreed.
- **The undo, not a confirm, on the discard** — it is the pattern the task and
  log deletes already use (`removeLogWithUndo`), and it costs the user nothing
  on the mis-click they will not make. The undo is a closure over the timer the
  component held, because the timer is component-and-`localStorage` state and
  not a store record with a restore.
- **The undo refuses onto an occupied clock** — `if (timer === null)`, and it is
  load-bearing rather than defensive. Discarding is the documented way to reach
  a fresh timer, so Discard → Start → Undo is a path a user walks, and an
  unguarded restore does two wrong things at once: it drops the live session,
  and because the restored timer is `stopped`, `getPendingMinutes` then seeds
  the next 🪫 editor 45 minutes nobody worked — a measurement the user never
  gave. Both sibling undos already refuse for the same class of reason, a moved
  day and a record the store no longer holds. Rejected: restoring
  unconditionally, which is how it was first written and what the reviewer
  caught; rejected: re-arming a confirm instead, which would make this the only
  destructive click in the app that asks twice.
- **The two tooltips came off rather than a third going on** — the audit's plan
  was to give the analytics rows the tooltips the task rows had.
  presentation/AGENTS.md already settles the opposite ("✎ and ✕ carry an
  `aria-label` and no tooltip"), so `ana_logs_edit_title` and
  `ana_logs_delete_title` were deleted from all five locales instead. A settled
  decision outranks a plan written without reading it.
- **The routine's plate came off, and its focus ring went on** — dropping
  `focus:bg-destructive/10` took the only keyboard cue with it, so the item
  carries `focus-visible:ring-2`. `focus-visible` and not `focus`, because
  bits-ui focuses a menu item on hover and `focus` would ring it under the
  mouse. `focus:bg-transparent!` needs the important suffix: the plate is
  applied by `data-[variant=destructive]:focus:bg-destructive/10` and loses to
  nothing weaker.

## Open questions

None.
