# The clock that stopped moving

**Kind:** feature · **Status:** landed 2026-09-07 · **Roadmap:** item `none`
(a redesign of the session strip, drawn on the "Session Clock" canvas and
handed over the day [the clock that counted in halves](the-clock-that-counted-in-halves.md)
landed)

Frozen at land: this file says what was decided on the date it carries, never
how the code works today — that is MATH.md and the area `AGENTS.md`. When later
work changes the behaviour, it writes its own feature file; it does not edit
this one. Same status as [zenith.md](../../zenith.md), for the same reason.

## Goal

The day's session timer is one bounded object whose outline does not move
between phases, in `session-clock.svelte` of its own. Starting a session no
longer makes a labelled button disappear and a smaller glyph appear somewhere
else, and how far along the countdown is has a picture instead of a third
number.

Before this the strip was five siblings in a row on `day-actions.svelte`, and
four things made a running session read as a mistake:

1. The length field kept full ink and a full border after it had done its job,
   so the loudest element in the row was the least useful one.
2. Two readings at the same size, six pixels apart, with nothing saying which
   was elapsed and which remaining.
3. Start collapsed — a 32px labelled `outline` button became a 24px bare
   `ghost` glyph in a different place, which is the "the button went away"
   feeling.
4. No sense of progress: a countdown with a mark and no picture of how far
   along it was.

## Scenarios

### Scenario — the invitation stands out and the mark steps back

`src/lib/presentation/component/session-clock.stories.svelte`

- **Given** a clock nobody has started
- **When** the length field is read, then Start is pressed
- **Then** the field is at full opacity before and `0.7` after, and is still
  enabled — re-aiming is the only way to set a second countdown

### Scenario — a stopped reading has nothing left to aim

`src/lib/presentation/component/session-clock.stories.svelte`

- **Given** a stopped reading of 45 minutes
- **When** the object is read, and then discarded
- **Then** it carries no length field while stopped and the field is back on
  the fresh clock the discard leaves

### Scenario — every phase change keeps the keyboard

`src/lib/presentation/component/session-clock.stories.svelte`

- **Given** focus on Start
- **When** Enter runs, pauses and resumes the session
- **Then** focus is on the same button each time — Start, Pause and Resume are
  one element whose variant changes, not three that mount and unmount

### Scenario — the alarm, the undo and the countdown are unchanged

`src/lib/presentation/component/session-clock.svelte.spec.ts`

- **Given** the suite that stood on `day-actions.svelte`
- **When** it is pointed at `session-clock.svelte` with the clock's three props
- **Then** all seven assertions hold unedited: one ring per length, the reading
  survives the ring, the countdown goes with the mark, a `0` typed on the way
  to `15` re-aims nothing, and a discard is offered back until the clock is
  occupied

## Out of scope

- **The timer's behaviour.** Every transition, the alarm, the 🪫 seed and the
  countdown's arithmetic moved unedited. This change is where the controls sit
  and what they weigh. The one line that did change is `onLengthChange`'s
  guard: it dropped `!isStopped`, because a stopped clock no longer renders the
  field, so the clause had no reachable input left (AGENTS.md §0).
- **Seconds, and a second reading.** Unchanged from
  [the clock that counted in halves](the-clock-that-counted-in-halves.md): the
  strip reads in minutes, and the track is a picture rather than a number
  precisely so the row does not grow a third one.
- **`day-actions.svelte`'s two menus.** Load and Save sit beside the clock and
  were not touched; only the timer block left the file.

## Decisions

- **A component, not a cluster of siblings.** The object owns a phase in five
  states and a fixed outline across all of them, which is a shape a row of
  `{#if}`-ed siblings in a 200-line file cannot hold. `day-actions.svelte` is
  left with the two menus and the today gate.
- **The length field is `NumberInput`, not a second copy of it.** The clock IS
  the bordered, filled, ringed object, so the field is passed a `class` that
  drops its own border, fill, radius and ring rather than nesting a second box
  inside the first — the `cn` merge every other `ui/` component already offers,
  added to this one here.
  Rejected: hand-rolling the field, which duplicated the clamp rules (no clamp
  mid-type, clamp on blur and on step) that `number-input.svelte` already owns
  (R3). The demotion under a running session is `opacity-70` on that same
  wrapper, so it needs no reach inside the component.
- **The steppers became `number-step` (tokens.css).** Radius and padding stay
  at the call site, per STYLE.md's "a repeated cluster becomes an `@utility`".
- **The elapsed reading is the one number at full weight.** It goes from
  `text-xs text-ty-silent` beside its countdown to `text-sm font-semibold`, and
  to `text-ty-secondary` once the clock is not counting — which is what stops
  the pair reading as two numbers of equal standing.
- **The mark's absence is the rung state.** `targetMs` is already cleared as
  the alarm rings, so nothing new is stored: an object with a reading and no
  mark is one that has rung, and the full amber track is what is left of it.
  Rejected: a `hasRung` flag on `SessionTimer`, which would be a second answer
  to a question the target already settles (R3).
- **The object clips its own children, so the controls ring inward.**
  `overflow-hidden` is what keeps the progress track inside the corner radius
  on a theme that sets `--radius` high; an outward `focus-visible:ring-3` on a
  control inside it loses its top and bottom edge, so the in-clock buttons
  take `inset-ring-2` instead.
- **The pip pulses only while running, and not under
  `prefers-reduced-motion`.** It is the app's first component animation; the
  low-motion rule it sits beside is a theme rule, and a 6px dot at a two-second
  period is what lets a paused clock need no word.

## Doc routing

- `presentation/AGENTS.md`'s timer paragraph names the new component and the
  two rules the design turns on — the fixed outline, and phase read off ink and
  the track rather than off which controls exist.
- STYLE.md unchanged: `number-step` is the utility rule it already states,
  applied.
- MATH.md unchanged — no formula, constant, bound or fit is involved.
