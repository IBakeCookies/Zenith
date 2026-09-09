# The measurement the past day refused

**Kind:** feature · **Status:** landed 2026-09-09 · **Roadmap:** none

Frozen at land: this file says what was decided on the date it carries, never
how the code works today — that is MATH.md and the area `AGENTS.md`. When later
work changes the behaviour, it writes its own feature file; it does not edit
this one. Same status as [zenith.md](../../zenith.md), for the same reason.

## Goal

On a past day I can log a ⚡ or a 🪫 on a task the same way I can today, and it
counts as if I had logged it that day. Today a past day lets me correct or
delete a log but never add one, while the analytics log list has let me edit
any log from any date since 2026-08-10 — so a session I forgot to rate stays
unrated forever.

## Scenarios

### Scenario — a ⚡ is logged on a past day

`e2e/flow-log.e2e.ts`

- **Given** a task planned on a day three days ago, with no ⚡ on it
- **When** I open that day and log ⚡ 90 from the row's button
- **Then** the row shows `⚡ 90m`

### Scenario — the ⚡ carries the viewed day, not today

`e2e/flow-log.e2e.ts`

- **Given** the ⚡ logged in the scenario above
- **When** I open `/analytics`'s log history
- **Then** the log is listed under the date three days ago

### Scenario — the ⚡ is not deferred

`e2e/flow-log.e2e.ts`

- **Given** the ⚡ logged in the scenario above, and no other logs
- **When** I open `/analytics`
- **Then** the Flow Calibration card shows no "counted from tomorrow" note

### Scenario — a 🪫 is logged on a past day

`e2e/drain-rating.e2e.ts`

- **Given** a task planned on a day three days ago, with no 🪫 on it
- **When** I open that day and rate it from the row's 🪫 button, typing the hours
- **Then** the row shows the 🪫 chip

### Scenario — the 🪫 carries the viewed day

`e2e/drain-rating.e2e.ts`

- **Given** the 🪫 logged in the scenario above
- **When** I open `/analytics`'s log history
- **Then** the log is listed under the date three days ago

### Scenario — the 🪫 is not deferred

`e2e/drain-rating.e2e.ts`

- **Given** the 🪫 logged in the scenario above, and no other logs
- **When** I open `/analytics`
- **Then** the Drain Calibration card shows no "logged today, counted from tomorrow" note

### Scenario — a past-day 🪫 survives a reload

`e2e/drain-rating.e2e.ts`

- **Given** the 🪫 logged in the scenario above
- **When** I reload the past day
- **Then** the row still shows the 🪫 chip

### Scenario — ticking a task done on a past day asks both questions

`e2e/day-navigation.e2e.ts`

- **Given** a task planned on a day three days ago, unrated and not completed
- **When** I open that day and tick the task done
- **Then** the ⚡ editor opens under the row
- **Then** the 🪫 editor opens under the row

### Scenario — a day ahead still takes no measurement (pin)

`e2e/day-navigation.e2e.ts`

- **Given** a task planned on a day three days ahead
- **When** I open that day
- **Then** the row has no ⚡ button
- **Then** the row has no 🪫 button

### Scenario — the timer stays on today (pin)

`e2e/day-navigation.e2e.ts`

- **Given** any past day
- **When** I open it
- **Then** there is no "Start timer" button

## Out of scope

- **☕ rest logs.** The rest button lives in the day actions and renders on
  today only; it stays so. Asked, decided 2026-09-09.
- **Days ahead of today.** A measurement on a day not yet worked is a
  measurement nobody took; the gate that refuses it today stays.
- **Adding tasks to a past day**, so a session on a task that day never held
  could be rated. The plan of a past day is read-only (`#canEditPlan`), and
  the analytics list has the same gap.
- **The demo day.** `canLog` keeps refusing it; `logFlow`'s own demo guard stays.
- **The Energy Lab.** It is today-only (`energy/+page.ts` redirects a dated
  URL), so nothing there changes.
- **A circadian fit** that reads `createdAt`'s time of day. None exists; the
  sentence added to MATH.md §8.14 is what lets a future one tell a back-dated
  row apart, and nothing more.

## Read before building

- `src/routes/(app)/+page.svelte` — `canLog` gates `onflowopen`/`ondrainopen`
  on `selectedDate === today`; it becomes `selectedDate <= today`. Edit and
  delete callbacks are already unconditional; `isViewingPast` keeps gating the
  plan (`form`, `onupdate`, advice).
- `src/lib/business/store/session-store.svelte.ts` — `logFlow` already stamps
  `#selectedDate` and refuses a **first** measurement when
  `date !== this.#today`; the refusal becomes `date > this.#today`. Its comment
  block above states the today-only rule and is rewritten.
- `src/lib/business/store/energy-observation-store.svelte.ts` — `logDrain`
  stamps `liveToday.value` and reads the task from the `ReadTasks` thunk, which
  the layout wires to `session.tasks` — the **viewed** day's tasks. The stamp
  and the lookup already disagree on a past day; this change makes the stamp
  follow the lookup. `drainLogsOn`'s doc comment ("Writes still stamp
  `liveToday` — this store has no notion of a viewed day and must not") and
  `logDrain`'s ("Today-only because it is a measurement, not a plan") are
  rewritten. `logRest` keeps `liveToday`.
- `src/routes/(app)/+layout.svelte` — where the `ReadTasks` thunk is built;
  the thunk grows to hand the store the loaded day's date with its tasks.
- `src/lib/business/store/energy-observation-store.svelte.spec.ts` — the test
  near "browsing to another date must not be able to misdate one" pins the old
  stamp and flips to pin the new one.
- `src/lib/business/store/session-store.svelte.spec.ts` — the past-day ⚡
  block (`pastDay`, "corrects a past day's ⚡ reading") is where a
  first-measurement-on-a-past-day unit test lands beside the correction one.
- `src/lib/business/AGENTS.md`, settled decision "Drain and rest observations
  live in `EnergyObservationStore`" — its reason reads "a measurement is
  stamped with the live clock's today, never the viewed day". The verdict (the
  store stays separate) stands; the sentence is corrected to say the store is
  handed the day with the tasks, and still owns no date routing.
- `src/lib/presentation/AGENTS.md`, "Both corrections are offered on any day
  the page shows, a new measurement only today" — the heading and body are
  rewritten: both writers on any day up to today, a first measurement stamps
  the viewed day, the timer stays on today. The paragraph above `onflowopen` /
  `onflowedit` ("a past day passes the second and withholds the first") goes
  with it.
- `src/lib/data/repository/drain-observation-repository.ts` — no change;
  `$createDrainObservation` already takes `date` and stamps `createdAt: Date.now()`.
- `e2e/day-navigation.e2e.ts` — "past day is read-only with a banner" asserts
  the old gate; `e2e/helpers.ts` (`seedDay`, `copyFlowLogToDate`) and
  `e2e/drain-rating.e2e.ts` (`writeDrainLog`) carry comments saying "No UI
  path dates a … log in the past — past days are read-only". The direct-write
  fixtures stay (they are faster and set `createdAt`); the comments are
  corrected. `e2e/flow-log.e2e.ts`'s header says "⚡ is today-only and no UI
  path produces a log dated yesterday" — same correction.
- `messages/en.json` (and the other locales) — only if a new string is needed;
  none is expected.
- MATH.md §8.14 — one sentence under "Only each day's earliest 🪫 row is
  eligible": a row logged onto a past day carries a `createdAt` later than any
  row logged live that day, so it never displaces a live first row; its
  calendar day differs from `date`, which is how a time-of-day reading would
  exclude it. No formula moves.
- `docs/testing.md` table — e2e for the flows above; store specs for the two
  stamp rules.

## Decisions

- **A measurement added to a past day is stamped with the viewed day, and
  `createdAt` stays the live clock** — the fits and the causal window filter on
  `date`, so the log enters every plan dated after it at once, exactly as a
  log made that day would have; `createdAt` only orders sessions within a day
  and records honestly when the row was written. Rejected: stamping today's
  date (the current code), because the log would credit hours to a day nobody
  worked them and defer until tomorrow. Rejected: back-dating `createdAt` to
  the viewed day, because it would forge the one time-of-day signal the data
  carries and make a back-dated row indistinguishable from a live one.
- **The gate moves from "today only" to "not ahead of today"** — a day ahead
  has not been worked. Rejected: dropping the gate, because `logFlow` would
  then write a first measurement onto a day the user is only planning.
- **The observation store learns the day from the same thunk that gives it the
  tasks** — the tasks it captures demands from are already the viewed day's,
  so one read yields a date and a task list that agree by construction, and
  no mid-navigation guard is needed (a `null` loaded date is nothing to log).
  Rejected: a `date` parameter on `logDrain`, because both call sites would
  pass `session.selectedDate`, which mid-navigation is not the day the tasks
  belong to — the very race `logFlow` guards against.
- **The completion prompt on a past day opens both editors, as on today** —
  it falls out of the gate change; suppressing it would add a branch for a
  behaviour nobody asked to lose. Asked, decided 2026-09-09.
- **☕ stays today-only** — asked, decided 2026-09-09; a later spec can lift
  it with the same rule.
- **The `EnergyObservationStore` extraction verdict stands** — its stated
  reason ("stamped with the live clock, never the viewed day") becomes false,
  but what mattered was needing no date routing, load or autosave state, which
  is still true: the store is handed a day, it does not route one.

- **`logDrain` refuses a day ahead in-store, as `logFlow` does** — found in
  review: a 🪫 editor opened on today outlives a navigation onto a day ahead
  whose task reuses the id, and the page's gate cannot see that. One comparison
  against the live clock; nothing else.
- **A past day's 🪫 editor takes no stopped reading** — found in review: the
  timer's minutes were counted today, so a past day's editor opens empty and
  its save spends nothing.
- **The past-day banner says a ⚡ or 🪫 may be logged** — first left alone
  because it speaks about tasks, then found to imply that check-offs are all a
  past day takes. One clause in each locale; no new key.

## Open questions

None.
