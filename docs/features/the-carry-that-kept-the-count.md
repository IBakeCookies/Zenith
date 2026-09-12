# The carry that kept the count

**Kind:** feature · **Status:** planning · **Roadmap:** none

## Goal

At the end of a day, the user can send everything they did not finish to
tomorrow in one press, instead of waiting for the advice card to offer each
task as a defer lever. Tasks that travel keep their **day N** badge counting,
so work that has been sliding for a week still says so.

## Scenarios

### Scenario — Sending the day's unfinished work to tomorrow

`e2e/carry-unfinished.e2e.ts`

- **Given** today holds three tasks, one of them ticked off, none flagged must-do-today
- **When** the user presses the carry control in the day-actions header
- **Then** today's list holds only the completed task
- **Then** navigating to tomorrow shows the two tasks that were carried
- **Then** each carried task keeps the title, sliders, importance and tags it had

### Scenario — A must-do-today task does not travel

`e2e/carry-unfinished.e2e.ts`

- **Given** today holds two unfinished tasks, one flagged must-do-today
- **Then** the carry control's count reads 1
- **When** the user presses it
- **Then** the flagged task is still on today's list

### Scenario — The day count keeps running across a carry

`e2e/carry-unfinished.e2e.ts`

- **Given** an unfinished task whose `createdAt` is four days before today, so its row reads `day 5`
- **When** the user carries it to tomorrow
- **Then** the row on tomorrow reads `day 6`

### Scenario — Nothing to carry

`src/lib/presentation/component/day-actions.stories.svelte`

- **Given** a day whose every task is completed
- **Then** the carry control is not rendered

### Scenario — A finished day sends nothing on

`e2e/carry-unfinished.e2e.ts`

- **Given** the user is viewing a past day that holds unfinished tasks
- **Then** the carry control is not rendered

### Scenario — The example day sends nothing on

`e2e/carry-unfinished.e2e.ts`

- **Given** the shared-link example day is on screen
- **Then** the carry control is not rendered

### Scenario — Tomorrow's write fails

`src/lib/business/store/session-store.svelte.spec.ts`

- **Given** a day with two unfinished tasks and a session write that rejects
- **When** the carry runs
- **Then** both tasks are still on today's list
- **Then** the store reports `save-failed`

### Scenario — Two tasks landing in one write

`src/lib/business/store/session-store.svelte.spec.ts`

- **Given** a day with three unfinished tasks and an empty tomorrow
- **When** the carry runs
- **Then** exactly one session write targets tomorrow
- **Then** the three tasks that land there hold three distinct ids

## Out of scope

- **An automatic sweep on opening a new day.** It needs a setting, a marker
  saying a task was carried rather than typed, an undo, and an answer for
  opening the app after a five-day gap — four things nobody asked for, and it
  rewrites a day the user has already left. Revisit only once the manual press
  proves it is always wanted.
- **A per-task carry flag in the add form.** The decision belongs at day's end,
  when it is known whether the task got done; at creation it is a guess.
- **A per-task "To tomorrow" button on the task row.** A separate want. This
  spec adds one whole-day control, not a second surface on every row.
- **Moving to an arbitrary date.** The destination stays `selectedDate + 1`
  (business/AGENTS.md).
- **Carrying completed tasks.** A completed task is history — it was worked on
  this day, and there is nothing to send on.
- **Any change to the badge itself** — no confirmation step for a stale task,
  no second threshold above `CHRONIC_SLIDE_MIN_DAYS`. The badge already
  escalates by counting; this spec only pins that it survives the carry.
- **`/energy`.** It does not carry the slide badge and gains no control here.
- **Undo.** Carrying back is a day-navigation away, and the inverse gesture
  does not exist yet in either direction.

## Read before building

- `src/lib/business/store/session-store.svelte.ts` — `moveTaskToTomorrow` is the
  shape to follow: its guards (`#canEditPlan`, `#isViewingPast`,
  `#isShowingDemo`, the `#moving` latch), its write order, and what a moved task
  carries. `#readDestination` supplies tomorrow's record; `importTasks` shows the
  `let id = nextTaskId(...); id++` pattern for minting several ids in one pass.
- `src/lib/business/AGENTS.md`, "A task moves between days only via
  `moveTaskToTomorrow`" — **this change makes that section false and must fix it
  in the same commit** (AGENTS.md §0). It asserts the advice card's button is the
  only caller and calls an arbitrary-date move YAGNI; the first half stops being
  true here, the second half still holds.
- `src/lib/business/model/metric/calculation.ts` — `isPinned`, the one definition
  of must-do-today (R3). The count the control shows and the set it moves read
  the same predicate.
- `src/lib/presentation/utils/slide-age.ts` — `getSlideDay` and
  `CHRONIC_SLIDE_MIN_DAYS`. The badge counts from `createdAt` against the viewed
  day, which is why the carry must copy `createdAt` and never re-stamp it.
- `messages/en.json`, `task_slide_tooltip` — reads _"Only 'To tomorrow' carries a
  task across the boundary"_. Still true in substance, but it now names one of
  two controls; correct the wording in the same commit, in all five locales.
- `src/lib/presentation/component/day-actions.svelte` and its stories — where the
  control goes, and the props/`on*` convention the page wires it through.
- `src/lib/presentation/AGENTS.md`, "Slide age is a `/` reading, computed above
  the row" — the R2 split the badge already follows.
- `src/routes/(app)/+page.svelte` — where `day-actions` gets its props and where
  `session.moveTaskToTomorrow` is currently called from the advice card.
- `messages/*.json` — five locales; the new label and its plural.
- `docs/testing.md` — the level table, and the rule that a feature ships with
  its empty and failed cases.
- No MATH.md section changes: this moves records between days and computes
  nothing.

## Decisions

- **A bulk press on today, not a sweep on opening tomorrow.** Push, not pull.
  Rejected: an automatic carry, because the app has no background job — it could
  only fire on next open, which makes it a sweep wearing a per-task costume, and
  it would put tasks on a day the user did not type them into.
- **A move, not an import.** Rejected: filtering the existing "Load → Yesterday"
  path to unfinished tasks, which reads as the obvious cheap answer and is
  wrong — `importTasks` stamps `createdAt` with the viewed day, so every carried
  task would restart at day 1 and the badge would never fire. `task_slide_tooltip`
  already documents that difference.
- **One read-modify-write against tomorrow, for all carried tasks.** Rejected:
  looping `moveTaskToTomorrow`, which cannot work — its `#moving` latch returns
  `false` for every call after the first, and business/AGENTS.md already records
  that two overlapping read-modify-writes on tomorrow drop a task.
- **Same write order as the single move: append to tomorrow, then drop from
  today.** So the failure mode stays a visible duplicate, never a vanished task.
  A failed destination write leaves today untouched.
- **Must-do-today tasks stay.** They are already refused by the single move, and
  the flag is a claim about today. Rejected: carrying them with the flag
  stripped, which would silently discard a thing the user set.
- **One store field gates the control — the number of tasks the press would
  actually move.** It is 0 on a past day, on the example day, and mid-navigation,
  so the three refusals and the empty case are one mechanism rather than four
  branches in the markup, and the count on the label can never overstate what
  will happen.
- **Its own label, not `advice_apply`'s "To tomorrow".** Two controls sharing an
  accessible name is a coin flip for a screen reader (AGENTS.md §2).
- **Carried tasks are prepended to tomorrow, keeping their order among
  themselves** — what the single move and `importTasks` both already do.
- **The badge is untouched.** Rejected: a confirmation when a carried task is
  already past the three-day gate, because the whole value of the control is
  being one press; and a second, louder threshold, because it is a policy
  invented for a user who has not appeared.

## Open questions

None.
