# The day you could not correct

**Kind:** feature · **Status:** landed 2026-09-12 · **Roadmap:** none

Frozen at land: this file says what was decided on the date it carries, never
how the code works today — that is MATH.md and the area `AGENTS.md`. When later
work changes the behaviour, it writes its own feature file; it does not edit
this one.

## Goal

"I set yesterday to 3 hours, but I only had 2, and I noticed this morning.
Today that number is stuck there forever, and so is every reading drawn from
it." After this, a past day is an ordinary day: its tasks can be added, edited
and deleted, and the hours, switch cost and capacity pools it was declared with
can be corrected — the same controls today has, on the day the user got wrong.

The one thing a past day still cannot do is act on a future: **move to
tomorrow** and the plan-advice card stay withheld, because a past day's
"tomorrow" is another day that already happened.

## Scenarios

### Scenario — a past task's ratings can be corrected

`e2e/day-navigation.e2e.ts`

- **Given** a stored day one week back holding one task rated 3 mental / 3
  physical, viewed at `/?date=<that day>`, with the ✎ editor open on its row
- **When** the user raises mental difficulty to 8 and submits
- **Then** the row's readings re-draw against 8
- **Then** a reload of the same `?date=` still shows 8

### Scenario — a past task can be deleted

`e2e/day-navigation.e2e.ts`

- **Given** that same day, with two tasks
- **When** the user presses ✕ on the first row
- **Then** the row is gone
- **Then** a reload of the same `?date=` still shows one task

### Scenario — a past deletion is undone from its toast

`e2e/day-navigation.e2e.ts`

The house rule for every delete but a routine's
(`presentation/AGENTS.md` — _A deleted task is undone from its toast_): no
confirm step is added for a past day.

- **Given** the ✕ above has just been pressed and its toast is on screen
- **When** the user presses the toast's undo
- **Then** the row is back in the position it held

### Scenario — a task can be added to a past day

`e2e/day-navigation.e2e.ts`

- **Given** a stored day one week back, viewed at `/?date=<that day>`, with the
  add-task dialog open
- **When** the user deploys a task titled "what I forgot to write down"
- **Then** the row appears in the list
- **Then** a reload of the same `?date=` still shows it

### Scenario — a past day's declared hours can be corrected

The Goal's own case, and the reason full parity was chosen over edit-and-delete.

`e2e/day-navigation.e2e.ts`

- **Given** a stored day one week back declaring 3 available hours, viewed at
  `/?date=<that day>`
- **When** the user sets the hours field to 2 and blurs it
- **Then** a reload of the same `?date=` shows 2

### Scenario — a past day still offers no defer

`e2e/day-navigation.e2e.ts`

- **Given** a stored day one week back holding one active task
- **When** the user opens that row's actions
- **Then** no move-to-tomorrow control is present

### Scenario — a past day still offers no plan advice

`e2e/day-navigation.e2e.ts`

- **Given** a stored day one week back holding tasks and a budget
- **When** the page has settled
- **Then** the plan-advice card is absent

### Scenario — the banner says what is now true

`e2e/day-navigation.e2e.ts`

This rewrites the existing `past day is read-only with a banner` test, whose
name and body both assert the behaviour this change removes.

- **Given** a past day viewed at `/?date=<that day>`
- **When** the page has settled
- **Then** the past-day banner is visible
- **Then** its body does not claim that adding or editing tasks is only
  possible on today

### Scenario — the four structural writers land on a past day

`src/lib/business/store/session-store.svelte.spec.ts`

The inverse of `refuses a structural edit on a past day`, which is rewritten
rather than deleted: the same fixture, the same four calls, the opposite
assertion.

- **Given** a loaded past day holding one task
- **When** `addTask`, `updateTask`, `removeTask` and `importTasks` are each
  called once
- **Then** each one's effect is present in `tasks`

### Scenario — a past day's edit reaches storage (pin on the pristine half)

`src/lib/business/store/session-store.svelte.spec.ts`

The auto-save `$effect` reaches past days for the first time, so both halves of
its `dirty` guard need saying.

- **Given** a loaded past day holding a stored session
- **When** a task is added and the debounce flushes
- **Then** one session write lands under that past date
- **Given** a past day with no stored session and nothing typed into it
- **When** the debounce flushes
- **Then** no session write lands _(pin)_

### Scenario — one past-day toggle is one write

`src/lib/business/store/session-store.svelte.spec.ts`

The hazard this change creates. `toggleTask`'s past-day branch persists
explicitly _because_ the auto-save did not reach past days; once it does, both
fire on the same toggle — two writes and two generation bumps on one click. The
existing `counts a past-day completion toggle on the whole-past generation`
test is the pin that catches it.

- **Given** a loaded past day holding one task
- **When** that task is toggled and the debounce flushes
- **Then** `pastWriteGeneration` has advanced by exactly 1 _(pin)_

### Scenario — the mid-navigation guard still refuses

`src/lib/business/store/session-store.svelte.spec.ts`

`#canEditPlan` loses its past-day half and keeps this one, which is the half
that prevents a real corruption: mid-load the in-memory tasks still belong to
the day being left.

- **Given** a date change to another day whose read has not settled
- **When** `addTask` is called
- **Then** `tasks` is unchanged _(pin)_

### Scenario — the defer path still refuses on a past day

`src/lib/business/store/session-store.svelte.spec.ts`

Two pins that currently pass _through_ `#canEditPlan` and must survive it
losing its past-day half — so the defer path grows its own guard.

- **Given** a loaded past day holding one active task
- **When** `moveTaskToTomorrow` is called
- **Then** it resolves `false` _(pin)_
- **Then** no write lands under the following day _(pin)_
- **When** `readDeferDestination` is called
- **Then** it resolves `null` _(pin)_

### Scenario — correcting a past task does not re-price what it measured

`src/lib/business/store/session-store.svelte.spec.ts`

The reason the model objection to this feature does not hold, asserted rather
than assumed. `logFlow` freezes `taskTitle`, `difficulty`, `enjoyment`, `E` and
`beta` into the record at measurement time, on purpose.

**This pin is vacuously green before the change** — `updateTask` is refused on a
past day today, so the record is unchanged because the edit never happens. It
only starts testing anything once the guard opens, which is exactly when it is
needed. Do not mistake its first green run for pre-existing coverage.

- **Given** a loaded past day holding one task with a stored ⚡ observation
- **When** `updateTask` raises that task's mental difficulty
- **Then** the ⚡ record's `difficulty` is unchanged _(pin)_
- **Then** the ⚡ record's `E` is unchanged _(pin)_

## Out of scope

- **Deferring from a past day, and the plan-advice card on one.** A past day's
  `deferDestinationDate` is another finished day; ranking advice for a day that
  is over advises nobody. These are the one asymmetry with today, and they are
  deliberate.
- **Cascading a task delete into its ⚡ / 🪫 records.** Deleting a past task
  drops the row and keeps the measurement — what `removeTask` already does on
  today, and what the observation stores are already built for (a drain log
  outlives the task it rated; `business/AGENTS.md` — _Task ids come from
  `nextTaskId`_). The orphaned log keeps showing in `/analytics`' history under
  the title it was logged with.
- **Any bound on how far back.** Every day the calendar can reach is editable.
- **A confirm step before a past-day delete.** Settled in
  `presentation/AGENTS.md`: only routines get one, everything else gets an undo
  toast.
- **Re-running a past day's fit.** `fitSnapshots` stays frozen — a past day's
  fitted params are what the user had (`data/AGENTS.md` — _A day's fitted
  params are stored, not recomputed from the logs_; ROADMAP item 5 priced
  recomputation and declined it). A corrected past day therefore keeps the fit
  it ran under, and the correction accrues forward.
- **Prefilling a past day's hours.** `#prefilledHours` stays 0 on a past day:
  the user may now type a budget in, but the app still never invents one for a
  day they did not plan.
- **The session clock.** `day-actions.svelte` renders it on today alone, and a
  live countdown for a finished day is not a correction. `+page.svelte`'s
  `pendingMinutes` stays `null` on a past day for the same reason.
- **The example-day link on a past day.** `exampleDayHref` stays withheld. It is
  an onboarding affordance, not a way to correct data, and opening it is the
  kind of helpful extra §0 exists to refuse.

## Read before building

**The guard and everything hanging off it**

- `src/lib/business/store/session-store.svelte.ts` — `#canEditPlan` drops
  `&& !this.#isViewingPast` and becomes the mid-navigation guard alone. Then:
  `moveTaskToTomorrow` and `readDeferDestination` grow their own
  `!this.#isViewingPast`; `toggleTask`'s explicit past-day persist is deleted
  (the auto-save now covers it — see the one-toggle-one-write scenario); the
  doc comments on `#canEditPlan`, on `toggleTask` ("past days stay read-only")
  and on `#dateParam` ("a past day is read-only") all assert the behaviour
  being removed.
- `src/routes/(app)/+page.svelte` — ten sites read the day's tense, and **four
  of them open**: the `DayConstraintsBar` block, `onremove`, `onupdate` and
  `form`. The other six stay exactly as they are, and each for its own reason —
  the `isViewingPast` alias itself; `canLog` (`selectedDate <= today`, which
  already lets a past day log); `pendingMinutes` (the session clock, out of
  scope); the banner block (kept, copy rewritten); `exampleDayHref` (nothing to
  do with correcting data — §0); and the `PlanAdviceCard` block (deliberate).
  Grep `isViewingPast` there and account for all ten before changing any.
- `src/lib/presentation/component/task-list.svelte` — read it to confirm it
  holds no tense of its own. It does not: ✎ and ✕ appear because their callbacks
  do (`presentation/AGENTS.md` — _An action is present when its callback is_),
  so the page passing them is the whole UI change for the row.
- `src/lib/presentation/component/day-actions.svelte` — the
  `{#if !isViewingPast}` spans **lines 127–267 and wraps two menus, not one**:
  Load (import-from-date, import a routine) and Save-as-routine. Opening the
  block opens both, and that is the call — Load is how tasks get into a past day
  being corrected, and saving a finished day as a routine reads that day rather
  than rewriting it. Splitting them would need a second `{#if}` for no gain.
  `SessionClock`'s own `{#if isToday}` above it does not move.

**Docs this change makes false (AGENTS.md §0 — fixed in the same diff, not
reported)**

- `src/lib/business/AGENTS.md`, _Four write sites carry the whole day_ — becomes
  three when `toggleTask`'s past-day branch goes.
- `src/lib/business/AGENTS.md`, _An unseen day's budget is prefilled, and that
  is not the Lab's `|| 8`_ — its "There is **no past-day rule** here: an unseen
  past day is read-only, saves nothing" is false afterwards. The rule it guards
  still holds (a blur that changes nothing stores nothing, via
  `#declare(value, prefilled)`), so the sentence is corrected, not the rule.
  `#prefilledHours` is 0 on a past day, so that is the baseline `#declare`
  compares against there — a stored past day still shows its own hours, because
  `#loadSession` assigns `#availableHours` from the record.
- `src/lib/business/AGENTS.md`, the `EnergyLabStore` bullet — "a completion
  toggle on a past day moves them" is now any past-day write.
- `src/lib/presentation/AGENTS.md`, _Both writers are offered on any day up to
  today, the timer only today_ — the heading stays true (this change does not
  touch logging), but inside it "the autosave never rewrites a past day" is
  false afterwards. The paragraph's conclusion (two callbacks on the row, not
  one) is unaffected.
- `src/lib/presentation/AGENTS.md`, the task-row bullet — "a past day none of
  the **logging** ones" already scopes itself to the logging callbacks; confirm
  it reads true once ✎ and ✕ are passed, and leave it alone if so.
- `messages/{en,de,es,fr,zh}.json` — `banner_past_body` currently ends "adding
  or editing tasks is only possible on today". All five locales.
- `ROADMAP.md` — this is on neither the item list nor the 2026-08-04
  not-proposed list. Nothing to renumber; the landing commit adds an item in
  its own list if one is wanted.

**What moves, so the reviewer is not surprised by it**

- `src/lib/business/model/metric/history.ts` — `summarizeSession` re-solves each
  past day from its stored tasks and budget, and `calculateMetricTrend`
  recomputes `burnoutRisk`, `cognitiveLoad` and `physicalLoad` from that solve.
  So a difficulty raised on a past day moves that day's point on every analytics
  trend, not only its completion counts — which is the same recomputation the
  day's own readings on `/` do, reached by a second path.
- `src/lib/business/model/plan-audit.ts` and MATH.md §9 — the plan-adherence
  audit re-runs the planner per past day against that day's stored tasks and
  budget.
- `src/lib/business/model/constraint-memory.ts` — the last day that declared a
  switch cost and pools is what an unplanned future day opens on. Correcting a
  past day's declaration is how the Goal's 3→2 fix reaches tomorrow.
- `src/lib/business/model/title-memory.ts`, `src/lib/business/model/tags.ts` —
  title ratings and the tag vocabulary fold over every stored day. Both are boot
  snapshots, so they move on the next load.
- MATH.md §5 (the causal fit window: a plan for day `d` reads logs dated
  strictly before `d`) — read it to confirm nothing moves. No formula, constant,
  bound or fit changes in this feature, so MATH.md is not edited.

**Tests**

- `src/lib/business/store/session-store.svelte.spec.ts` — `refuses a structural
edit on a past day` (rewritten), `refuses a structural edit while a date
change is still loading` (pin), `previews no destination on a past day` (pin),
  `counts a past-day completion toggle on the whole-past generation` (pin),
  `refuses to move a completed or must-do-today task` (read it: the past-day
  refusal joins it).
- `e2e/day-navigation.e2e.ts` — `past day is read-only with a banner` is
  rewritten; `a past day draws the rails it was planned under` and `ticking a
task done on a past day asks both questions` are pins that must stay green.
- `docs/testing.md` — the level table and the reviewer pass. This diff touches
  `business/store` and user-visible behaviour, so it gets a full reviewer pass.

## Decisions

- **Full parity, not edit-and-delete** — the ask opened with ✎ / ✕, but the case
  that motivated it is a wrong budget, which neither reaches. A day whose hours
  are stuck at 3 poisons its own readings, the §9 adherence audit, and (through
  `constraint-memory`) what every unplanned future day opens on. Rejected:
  unlocking only the two row actions, because it would have left the Goal's own
  example unfixable and invited a second feature for the same reason.
- **`#canEditPlan` keeps only its mid-navigation half** — that half prevents a
  real corruption (writing the previous day's in-memory tasks under the incoming
  date) and is measured by a shipped test; the past-day half prevented nothing
  but the user. Rejected: a second getter such as `#canEditPast` gated on a
  setting or an unlock gesture, because nothing asked for a lock and a mode is
  state to reason about (§0).
- **The defer path grows its own guard rather than borrowing the collapsed one**
  — `moveTaskToTomorrow` and `readDeferDestination` currently refuse a past day
  only as a side effect of `#canEditPlan`, and that side effect is what this
  change removes. Naming `!this.#isViewingPast` at both sites is the honest
  spelling: they refuse for their own reason, which is that a past day's
  destination is another finished day.
- **`toggleTask`'s explicit past-day persist is deleted, not left in place** —
  it exists only because the auto-save did not reach past days. Leaving it would
  double-write every past-day toggle and bump `pastWriteGeneration` twice,
  withdrawing the Lab's stop observations on a schedule nothing predicts. The
  cost is that a past-day toggle becomes debounced like every other write, which
  is the guarantee today already has.
- **Measurements survive a past-task delete** — the observation stores are
  already built for a log that outlives its task, and the ⚡/🪫 record carries
  the title it was logged under, so `/analytics` still reads. Cascading would
  make ✕ mean two different things on two different days and would change the
  fit inputs. Rejected on both counts.
- **Correcting a past task cannot re-price what it measured, and that was
  already true** — `logFlow` freezes the covariates into the record at
  measurement time ("a difficulty raised on Friday re-pricing what Monday
  measured" is the comment that says why). This feature therefore needs no
  change to any fit, and the scenario that pins it exists to keep that property
  from being optimized away later.
- **No bound on how far back** — a window would be a constant nobody measured,
  a second read-only state, and a banner to explain it. The calendar already
  deep-links any date.
- **Past days are not a settled decision** — checked before planning. Neither
  AGENTS.md §4's index, the four layer files' _Settled decisions_ sections, nor
  ROADMAP's 2026-08-04 not-proposed list holds it. What exists is ROADMAP's
  closed S1, which made the invariant _consistent_ across seven writers without
  ever arguing for it, and two places where the codebase already breaks it:
  `#rewriteTagInHistory` rewrites tasks on every past day a tag was used on, and
  `toggleTask` writes past sessions.

## What landed, and what moved that this file did not plan

- **A story asserted the removed behaviour, and this file did not name it.**
  `day-actions.stories.svelte`'s _Viewing a past day_ play expected both menus
  absent. Flipped to the inverse — both present — red first, the way the store
  test was.
- **Two README sentences and five e2e comments called past days read-only.**
  README's feature list and its `/?date=` line, the seeding comments in
  `analytics-stats`, `next-task-suggestions`, `task-tags` and `plan-advice`,
  which justified writing straight into IndexedDB with a rule that no longer
  holds, and the rails test's "only way onto a read-only day" in
  `day-navigation`. Corrected in the same diff (AGENTS.md §0); the seeding
  stays, for speed.
- **The task-row bullet did not read true, so it was rewritten.**
  `presentation/AGENTS.md` had a past day passing none of the logging
  callbacks. A past day has passed them since 2026-08-10; it is a day ahead that
  withholds them (_a day ahead offers neither measurement_). The bullet now says
  so, and that no row carries a read-only flag.
- **The two "still offers no …" scenarios are one e2e test.** A row has no
  actions menu to open, and the move-to-tomorrow control's only home is the
  advice card — so one seeded past day pins both absences, and both are pins.
- **The covariate pin is not vacuous after all.** The test asserts the edit
  landed (`mentalDifficulty` reads 10) before asserting the ⚡ record did not
  move, so it went red on the edit rather than green from birth.
- **Tied rows draw newest-first.** Two 5/5/5 tasks on a day with no budget
  render Inbox above Deep work; the undo scenario's "position it held" is
  asserted as the order the page drew before the ✕, whatever that order is.
- **A stored past day is written back once on view, as today already was.**
  The autosave `$effect` re-runs when a day lands and schedules a write of what
  it read — identical content, a fresh `updatedAt`. HEAD already did that for
  today and future days; opening the guard extends it to past days, so every
  visit to a stored past day is one write and one `pastWriteGeneration` bump.
  Pre-existing and benign, so not fixed here: ROADMAP S7.
- **The ratings fixture is the form's 5/5/5, not 3/3.** The add dialog deploys
  its defaults and the assertion is against the 8 the ✎ raises mental to; the
  fixture's starting rating carried no assertion.

## Open questions

None.
