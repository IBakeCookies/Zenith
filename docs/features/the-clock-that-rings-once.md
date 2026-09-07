# The clock that rings once

**Kind:** feature · **Status:** landed 2026-09-07 · **Roadmap:** item `none` (a second
follow-on to the timer bullet already dated in ROADMAP's not-proposed list —
nothing re-opens, and no plan-value number is claimed)

Frozen at land: this file says what was decided on the date it carries, never
how the code works today — that is MATH.md and the area `AGENTS.md`. When later
work changes the behaviour, it writes its own feature file; it does not edit
this one. Same status as [zenith.md](../../zenith.md), for the same reason.

## Goal

The session clock takes a length. The user says how long they mean to work —
prefilled with the length the stop advisor already recommends — starts it,
pauses and resumes it as they always could, and when the time runs out the app
says so: a toast and three short beeps. **The clock keeps counting.** Today the clock
only counts up and says nothing, so a user who means to work 45 minutes has to
watch it, and a user who looks away gets no signal at all.

## Scenarios

Scenarios marked **(pin)** assert behaviour that already ships. They go green on
their first run, which is their pass condition — the reading a stop hands the 🪫
editor must stay the minutes actually worked, and these say the countdown did
not touch it.

### Scenario — the length field prefills from the stop advisor

`e2e/session-countdown.e2e.ts`

- **Given** today, one task, today's 🪫 log written, no stored timer
- **When** the day's strip renders
- **Then** the session-length field holds the advisor's recommended session
  length in minutes

### Scenario — a day the advisor cannot price prefills 45 minutes

`e2e/session-countdown.e2e.ts`

- **Given** a fresh profile, no tasks, no logs
- **When** the day's strip renders
- **Then** the session-length field holds `45`

### Scenario — a started countdown reads the time left

`e2e/session-countdown.e2e.ts`

- **Given** today, one task, no stored timer, the length field set to `45`
- **When** `Start timer` is clicked
- **Then** the strip reads `45m left`

### Scenario — the elapsed reading is still there beside it

`e2e/session-countdown.e2e.ts`

- **Given** today, one task, a running timer with 20 minutes on it and a 45-minute target
- **When** the day's strip renders
- **Then** the strip reads `20m`

### Scenario — pausing holds the time left

`e2e/session-countdown.e2e.ts`

- **Given** today, one task, a running timer with 20 minutes on it and a 45-minute target
- **When** `Pause timer` is clicked
- **Then** the strip reads `25m left`

### Scenario — the length survives a reload

`e2e/session-countdown.e2e.ts`

- **Given** today, one task, a running timer with 20 minutes on it and a 45-minute target
- **When** the page is reloaded
- **Then** the strip reads `25m left`

### Scenario — the countdown reads on the Energy Lab too

`e2e/session-countdown.e2e.ts`

- **Given** today, one task, a running timer with 20 minutes on it and a 45-minute target
- **When** the Lab is navigated to
- **Then** the strip reads `25m left`

### Scenario — a past day offers no length field (pin)

`e2e/session-countdown.e2e.ts`

- **Given** a past day loaded by date
- **When** the Tasks card renders
- **Then** it has no session-length field

### Scenario — the alarm raises a toast

`src/lib/presentation/component/day-actions.svelte.spec.ts`

- **Given** a running timer whose accumulated minutes already reach its target
- **When** one tick of the clock elapses
- **Then** `toast.info` was called once

### Scenario — the alarm sounds once

`src/lib/presentation/component/day-actions.svelte.spec.ts`

- **Given** a running timer whose accumulated minutes already reach its target
- **When** three ticks of the clock elapse
- **Then** the mocked alarm sound was played exactly once

### Scenario — the clock is still running after the alarm

`src/lib/presentation/component/day-actions.svelte.spec.ts`

- **Given** a running timer whose accumulated minutes already reach its target
- **When** one tick of the clock elapses
- **Then** a `Pause timer` button is present

### Scenario — the time-left reading is gone after the alarm

`src/lib/presentation/component/day-actions.svelte.spec.ts`

- **Given** a running timer whose accumulated minutes already reach its target
- **When** one tick of the clock elapses
- **Then** no `left` reading is in the document

### Scenario — a stop still seeds the 🪫 editor with the minutes worked (pin)

`e2e/session-countdown.e2e.ts`

- **Given** today, one task, a running timer with 20 minutes on it and a 45-minute target
- **When** `Stop timer` is clicked and that task's `Log end-of-session drain` is
  clicked
- **Then** the drain form's length field holds `20`

### Scenario — a discarded session takes its length with it (pin)

`e2e/session-countdown.e2e.ts`

- **Given** today, one task, and a timer stopped at a nonzero reading
- **When** `Discard timed session` is clicked
- **Then** a `Start timer` button is present

### Scenario — resuming keeps the target

`src/lib/business/utils/session-timer.test.ts`

- **Given** a paused timer with a `targetMs` and no target passed to `runTimer`
- **When** it is resumed
- **Then** its `targetMs` is unchanged

### Scenario — the alarm is due only while running

`src/lib/business/utils/session-timer.test.ts`

- **Given** a paused timer whose accumulated milliseconds exceed its `targetMs`
- **When** `isAlarmDue` is read
- **Then** it is `false`

### Scenario — a timer with no target never rings

`src/lib/business/utils/session-timer.test.ts`

- **Given** a running timer whose `targetMs` is `null`
- **When** `isAlarmDue` is read at any `now`
- **Then** it is `false`

### Scenario — the time left rounds up

`src/lib/business/utils/session-timer.test.ts`

- **Given** a running timer 10 seconds into a 45-minute target
- **When** `getRemainingMinutes` is read
- **Then** it is `45`

### Scenario — an unreadable target loses the target, not the session

`src/lib/business/utils/session-timer.test.ts`

- **Given** a stored timer of today whose `targetMs` is a string
- **When** it is sanitized
- **Then** the timer is returned with `targetMs` `null` and its `accumulatedMs`
  intact

### Scenario — a non-positive target is no target

`src/lib/business/utils/session-timer.test.ts`

- **Given** a stored timer of today whose `targetMs` is `0`
- **When** it is sanitized
- **Then** its `targetMs` is `null`

### Scenario — the suggested length comes from the advisor

`src/lib/business/utils/session-timer.test.ts`

- **Given** a `StopAdvice` with `sessionHours` `1.5`
- **When** `suggestTargetMinutes` is read
- **Then** it is `90`

### Scenario — no advice suggests one model step

`src/lib/business/utils/session-timer.test.ts`

- **Given** `null` advice, and separately the `window-full` verdict
- **When** `suggestTargetMinutes` is read
- **Then** it is `45` for both

## Out of scope

- **Exact-time delivery in a hidden tab.** The alarm fires from the clock's
  existing one-second tick, and a browser throttles a hidden tab's timers to
  roughly one wake per minute — so a countdown that runs out while the tab is
  in the background can be announced up to a minute late. Accepted: the toast is
  waiting when the tab is returned to, and the two ways to make it exact are
  both larger than this feature — pre-scheduling the beep on the WebAudio clock
  (which does not throttle, but needs a scheduled node cancelled on every pause,
  stop, discard and length change) or a service-worker notification (a
  permission prompt and a second delivery path). Ask for it as its own change.
- **The `Notification` API.** No permission prompt, no system notification, no
  service-worker message. A toast and a beep, both in the page. This app is used
  with its tab open; the settled decisions in
  [the-clock-that-only-one-screen-could-start.md](the-clock-that-only-one-screen-could-start.md)
  already put notifications out of the timer's scope and this change does not
  collect them.
- **A mute setting, a volume, or a choice of sound.** The same three beeps,
  always, at a fixed level. Per the user. No preference, no storage key, no
  settings surface.
- **Auto-pausing or auto-stopping at zero.** Deliberate, and the load-bearing
  decision in this file — see Decisions. The clock counts on, and only the user
  stops it.
- **A repeating or snoozeable alarm.** The target is cleared when it rings, so
  it rings exactly once per length the user sets. Setting another one is typing
  another length.
- **Showing how far past the target the session has run.** The time-left reading
  disappears at zero; the elapsed reading, which was always there, is what says
  how long the session has been. No "12m over".
- **A finish time of day.** The strip reads a remaining duration and never
  `ends at 15:20`. `availableHours` is intended work, not a span of the clock —
  the same rule that keeps the day's strip free of any time of day
  (presentation/AGENTS.md, "The day's strip reads inside the Plan card, and
  carries no clock", and
  [the-anchor-that-held-only-itself.md](the-anchor-that-held-only-itself.md)).
- **Any change to what the 🪫 reading means.** One stop funds one log,
  `getPendingMinutes` / `claimPendingMinutes` / `spendsPendingMinutes`
  unchanged, and the seeded minutes stay the minutes the clock counted — never
  the target. Two of the pins above exist to say so. No MATH.md change.
- **Per-task countdowns.** The timer belongs to the person, not the row —
  settled in [the-session-nobody-was-timing.md](the-session-nobody-was-timing.md)
  and not re-opened. One length for the session, whichever tasks it covers.
- **Making the stop advisor read on `/`.** `/` gains one untracked call for the
  prefill and nothing visible: no advisor card, no verdict, no marginal value on
  the main page. Those stay the Lab's.
- **Cross-tab sync.** Unchanged: two tabs are two clocks, and now two
  countdowns. Whichever writes `localStorage` last wins on the other tab's next
  load.

## Read before building

- `src/lib/business/utils/session-timer.ts` — owns the shape and every
  transition, and takes all of this change's logic. `SessionTimer` gains
  **one** field, `targetMs: number | null`; `runTimer` gains a fourth parameter
  (the target, `timer?.targetMs ?? null` when the caller passes nothing, so a
  resume keeps it); new `setTarget`, `getRemainingMinutes`, `isAlarmDue` and
  `suggestTargetMinutes`. `sanitizeSessionTimer` gains one clause. Note its
  existing floor comment: the same hand-reachable-storage argument is why a bad
  `targetMs` degrades to `null` instead of dropping the timer.
- `src/lib/business/utils/session-timer.test.ts` — eight of the scenarios above.
  It is docs/testing.md's level for a pure transition and a validate-on-read.
- `src/lib/business/model/zenith-energy.ts` — `StopAdvice` (the exported union
  near the end, above `adviseStop`) is what `suggestTargetMinutes` takes:
  `sessionHours` on the two priced verdicts, nothing on `window-full`. Read the
  type, not the solver. This is a business-to-business import and R1-clean.
- `src/lib/business/store/energy-lab-store.svelte.ts` — `stopAdvice`, the
  `$derived.by` the prefill reads through. Read it to see what it depends on
  (`#energyTasks`, `#params`, `#windowHours`) — that is the whole reason the
  prefill is a thunk and not a reactive prop.
- `src/lib/business/AGENTS.md` — **"Plan advice is computed on demand, never in
  a `$derived`"** and its cost table. It is the rule that decides the prefill's
  shape, and the only rule this change turns on. Nothing in it becomes false.
- `src/lib/presentation/component/day-actions.svelte` — the whole UI change, and
  it is small. The existing tick `$effect` (the `setInterval` that moves `now`
  while running) gains **one branch**: when `isAlarmDue`, raise the toast, play
  the sound, and write the target away with `setTarget(timer, null)`. The
  timer strip gains a length field and a `left` reading beside the elapsed one.
  `Props` gains `getSuggestedMinutes: () => number`. Read the strip's wrapping
  comment before adding to it — the row already wraps at 375px and this makes it
  wider.
- `src/lib/presentation/utils/alarm-sound.ts` — **new**, and one export. A short
  WebAudio oscillator, no audio asset (the CSP and the no-CDN stance aside, a
  file is a request for a 200 ms beep). The `AudioContext` is created lazily on
  first use, which is inside a click-descended path the first time — `Start
timer` — so autoplay policy is satisfied without a gesture argument in the
  component.
- `src/lib/presentation/utils/toast.ts` — `showToast.info`, the alarm's toast.
  This is also why the alarm's tests are a spec and not a story play: the
  `Toaster` a story would need is the layout's (docs/testing.md).
- `src/lib/presentation/component/day-actions.svelte.spec.ts` — four of the
  scenarios above. **Currently untracked in git** — it already holds the discard
  test and is the established home for this component's toast-dependent
  behaviour; extend it, and mock `alarm-sound.ts` with `vi.mock` there for the
  played-once scenario. Its existing spy-on-`toast` shape is the pattern.
- `src/lib/presentation/component/day-actions.stories.svelte` — its five timer
  plays and its `whenClickable` / "close every menu before returning" rules stay
  as they are, but every story needs the new `getSuggestedMinutes` prop. The
  stories are also where the length field's presence on today and absence on a
  past day would naturally live; the scenarios above put both in e2e instead,
  because the prefill is only meaningful with a real advisor behind it.
- `src/routes/(app)/+page.svelte` — passes
  `getSuggestedMinutes={() => suggestTargetMinutes(lab.stopAdvice)}`, which
  needs `getEnergyLabStore()` on this route for the first time. That is the
  one line in this change with a cost behind it; the Decisions entry says why it
  is a thunk.
- `src/routes/(app)/energy/+page.svelte` — the same prop on its `DayActions`.
  It already holds `lab`.
- `src/lib/presentation/utils/session-timer.ts` — read, almost certainly
  unchanged: it is the `localStorage` call and the key, and `targetMs` rides
  along inside the JSON it already writes whole.
- `src/lib/presentation/style/STYLE.md` — the length field's classes. **Not the
  repo root** — this is the styling rulebook. It shipped as the shared
  `ui/number-input` primitive, which that file's composite-field bullet already
  documents, so no styling rule moved and STYLE.md is unchanged.
- `messages/en.json` and the four other locales — three new keys around the
  existing `timer_*` block (an accessible name for the length field, its unit
  suffix, the `left` reading, and the alarm's toast — four, once the field
  became a `NumberInput`). All five files, or the build fails.
- `docs/testing.md` — the level table for the mix above, and the reviewer table:
  this diff touches user-visible behaviour, so it is a full reviewer pass.
- `src/lib/presentation/AGENTS.md` — two sections state what this change moves,
  and AGENTS.md §0's documentation clause makes fixing them part of this diff.
  The 🪫-editor section says the timer "is the third opening of the 🪫 APPEND
  editor, and the only one that arrives with a value" — still true, and the new
  sentence worth having is that the value is the minutes counted and never the
  target. The gating section describes what
  `business/utils/session-timer.ts` owns ("the shape, the transitions and
  `getPendingMinutes`") and should name the countdown among them, plus the
  one-tick alarm and its clear-on-ring. Cite by section, never `file:line`.
- `scripts/brief-size.mjs` and `scripts/comment-density.mjs` — both are `npm run
lint` gates. The first budgets every rule file, and `presentation/AGENTS.md`
  stands at 857 of its 859 lines (measured 2026-09-07), so the edit above has to
  be paid for by tightening prose there — two spare lines is the whole budget. The
  second budgets **components only**, and `day-actions.svelte` is already
  comment-dense — the new branch and the new field get one line each at most.
- `e2e/helpers.ts` — `plantRunningTimer(page, minutes)`, which every "a running
  timer with 20 minutes on it" Given needs. It **must gain the target**: the
  helper writes the stored shape directly as an independent oracle
  (data/AGENTS.md's note on R8 step 4), so `targetMs` is spelled there too.
  `drainForm` is the other helper the seeding pin uses.
- `e2e/day-navigation.e2e.ts` and `e2e/energy-lab.e2e.ts` — read, not
  necessarily edited. They hold every existing timer flow, including the
  overnight-rollover test; the rollover needs no new case, because the target
  lives inside the timer the sanitizer already drops whole.
- `ROADMAP.md` — read, **not edited**, and nothing renumbered. Its timer bullet
  carries the 2026-08-22 build and a verdict about plan value; this change
  claims no plan-value number and does not touch that argument.
- MATH.md — **no change in this commit.** No formula, constant, bound or fit
  moves: the target is a user's intention, it never reaches the model, and
  §8.11's `sessionHours` is read as a suggestion and written nowhere.

## Decisions

- **The alarm does not stop the clock, and this is the point of the design** —
  the session clock's one downstream job is seeding a 🪫 log
  (`getPendingMinutes`), and that log is the only route by which a day reaches
  λ₀ (MATH.md §8.10), the §12 plan-adherence audit and §11.9's overnight
  carry-over. Stopping at zero would make the logged hours equal the number the
  user typed, which feeds three fitted quantities their own prior — a
  circularity of exactly the kind ROADMAP's not-proposed list rejects elsewhere.
  Rejected: auto-stop, for that reason. Rejected: auto-pause, which keeps the
  reading honest but silently under-counts a session the user kept working
  through, and buys nothing the user cannot do by pressing Pause themselves.
- **One field, cleared when it rings** — `targetMs: number | null`, and the
  alarm's own write is `setTarget(timer, null)`. That is what makes the alarm
  fire once: there is no `hasAlarmed` flag to persist, no second field to keep
  consistent with the first, and no state in which a target both exists and has
  already been announced. Rejected: a persisted `hasAlarmed` boolean, which is
  the obvious shape and one field more; component-local `$state` for it, which
  re-announces on every reload and on every navigation between `/` and the Lab,
  since both mount `day-actions.svelte`.
- **It rings from the tick that already exists** — the component's
  `setInterval` runs only while the timer runs and already moves `now` every
  second; the alarm is one `if` inside that callback. Rejected: a `setTimeout`
  armed at the deadline, which was the first proposal in planning and is
  strictly more code for no accuracy — a hidden tab throttles a one-shot timeout
  and a repeating interval alike, so both land within about a minute, and the
  timeout additionally has to be armed, cancelled and re-armed on every pause,
  resume, discard and length change. Rejected: WebAudio pre-scheduling, which
  genuinely is exact in a hidden tab because the audio clock does not throttle —
  and is out of scope above rather than here, because it needs a scheduled node
  tracked and cancelled across four transitions to buy under a minute.
- **A stale ring is delivered, not suppressed** — a tab closed across zero, or a
  target passed while another route was mounted, rings on the first tick after
  the clock is running and visible again. The user asked to be told; a late
  toast is a truer answer than silence, and suppressing it needs a staleness
  threshold nobody can pick. A timer left overnight raises nothing at all,
  because the day rollover drops it before any of this runs.
- **The prefill is a thunk, not a reactive prop** — `getSuggestedMinutes: () =>
number`, called once when the component initializes its own length state.
  `EnergyLabStore.stopAdvice` is a `$derived.by` over the energy tasks and
  params, and business/AGENTS.md's cost rule prices that class of reading at one
  solve; passing it reactively into `/` would put that solve behind every task
  edit on the main page, where it has never been. A thunk read in a `$state`
  initializer registers no dependency, so the cost is one solve per mount of the
  strip. Rejected: `lab.stopAdvice` as a plain prop. Rejected: computing it in
  the component, which would be a route-level store read inside a component and
  is what the presentation layer's snippets-and-props convention forbids.
- **45 minutes when the advisor has nothing to say** — a fresh profile, no
  tasks, or the `window-full` verdict. 45 is the model's own step granularity
  (MATH.md §8.8), so the fallback is the one duration the rest of the app
  already speaks in rather than a number invented for this field. Rejected: an
  empty field, which makes Start ambiguous; rejected: 25, which imports a method
  this app has no other trace of.
- **The remaining reading rounds up; the elapsed reading keeps rounding to
  nearest** — a countdown that shows `0m` while seconds remain reads as an alarm
  that failed, so `getRemainingMinutes` ceils. The elapsed readout is the value
  a 🪫 log is seeded from and its rounding is settled where it stands; the two
  numbers are allowed to disagree by a minute because they answer different
  questions.
- **Both readings show, side by side** — `20m` and `25m left`. Replacing the
  elapsed count with the remaining one would hide the number that fills the 🪫
  editor at exactly the moment the user is deciding whether to stop. Rejected:
  swapping the readout while a countdown is set, which is less markup and
  strictly worse information.
- **Three beeps, no setting** — per the user, during the build; one tone alone
  is easily taken for a notification from something else. A WebAudio oscillator
  rather than an audio file: nothing to fetch, nothing to add to the service
  worker's precache, and no asset to keep in the repo for under a second of
  sound, and the three are scheduled from one call so the alarm stays one
  `playAlarmSound()`. Rejected: a mute preference, which is a storage key, a
  settings surface and a migration question for one boolean nobody has asked
  for.
- **The length is the shared `NumberInput`, stepping 15 minutes** — per the
  user, during the build. Its steppers and its clamp-on-blur are what make a
  non-positive length unreachable, so the field cannot arm a countdown the
  sanitizer would refuse; 15 is a third of the model's own 45-minute step
  (MATH.md §8.8). Rejected: the bare `<input type="number">` this file first
  planned, whose `min` is advisory outside a form.
- **A length typed over a running session re-aims it** — the field is the only
  way to set a second countdown once the first has rung and cleared itself, so
  a change while the clock runs writes `setTarget` rather than waiting for the
  next fresh start. Floored at one step, because the field is not clamped until
  it is left and the `0` on the way to `15` would ring on the next tick.
- **Both screens, in `day-actions.svelte`** — per the user, during planning. The
  component is already shared by `/` and the Lab and the state is already
  `SessionTimerStore`'s, so a countdown set on one screen counts on the other
  for free. Rejected: `/` only, which would branch the component's behaviour by
  route for no reason a user could name.

## Open questions

None.
