# The routine that remembered a deleted tag

**Kind:** feature · **Status:** landed 2026-09-12 · **Roadmap:** item `none`

Frozen at land: this file says what was decided on the date it carries, never
how the code works today — that is MATH.md and the area `AGENTS.md`. When later
work changes the behaviour, it writes its own feature file; it does not edit
this one. Same status as [zenith.md](../../zenith.md), for the same reason.

## Goal

A tag the user deleted stays deleted, and a tag they respelled stays respelled,
even when they load a saved routine that was written before either. Today a
routine hands the old tag straight back: the row reappears on "Logged hours by
tag" as soon as an hour is logged against the imported task, and the old
spelling is offered again in the task form. That makes the delete's own
confirmation false — it says `Delete errand everywhere`, and the arm-then-confirm
it asks for was justified by "nothing hands it back"
([the tag that could only be respelled](the-tag-that-could-only-be-respelled.md)).

`SessionStore.#rewriteTagInHistory` walks the `sessions` store. `Task.tags` is
carried by two stores, and `routines` is the other one.

## Scenarios

### Scenario — a deleted tag does not come back with the routine that carried it

`e2e/routine.e2e.ts`

- **Given** a day whose one task is tagged `errand`, saved as a routine named
  `Errands`
- **When** the user deletes `errand` on the tag card, then returns to the
  planner without reloading and loads `Errands`
- **Then** the imported task carries no tag

### Scenario — a respelled tag comes back in its new spelling

`e2e/routine.e2e.ts`

- **Given** a day whose one task is tagged `dep work`, saved as a routine named
  `Focus`
- **When** the user renames `dep work` to `deep work` on the tag card, then
  returns to the planner without reloading and loads `Focus`
- **Then** the imported task carries `deep work`

### Scenario — the routine on screen is rewritten, not only the record

`src/lib/business/store/session-store.svelte.spec.ts`

- **Given** a store holding one stored routine whose task carries `errand`
- **When** `deleteTag('errand')` resolves
- **Then** `store.routines` carries that task with no `tags` field, with no
  second read of the store

### Scenario — a profile with no saved routines still completes the rename

`src/lib/business/store/session-store.svelte.spec.ts`

- **Given** a store with stored days carrying `dep work` and no routines at all
- **When** `renameTag('dep work', 'deep work')` resolves
- **Then** it reports success

### Claim — the folds leave a routine that never carried the tag alone

`src/lib/business/model/tags.test.ts`

- **Given** a list of routine tasks (no `id`, no `createdAt`, no `completed`), no
  member of which carries the tag
- **Then** `renameTagInTasks` and `removeTagFromTasks` both return that list by
  identity, which is what tells the caller not to write that routine

## Out of scope

- **A third carrier.** `STORE_NAMES` has seven stores and `Task.tags` reaches
  two of them, `sessions` and `routines`. There is nothing else to chase, and
  this change must not go looking.
- **Editing one routine's tags.** The task form already edits a tag on a task;
  a routine editor is a different feature nobody has asked for.
- **Undoing a delete.** Both prior specs spent the confirmation instead, for the
  same reason: undo is a second full-history write.
- **New copy.** `Delete {tag} everywhere` becomes true rather than needing a
  caveat, so no message key moves and no locale catalogue is touched.
- **A tag entering any formula.** It does not, and this change must not start.

## Read before building

- [`src/lib/business/store/session-store.svelte.ts`](../../src/lib/business/store/session-store.svelte.ts)
  — `#rewriteTagInHistory` is the write that gains the second store: its demo
  guard, its raw unbounded read, its per-record skip, its one `try`/`catch`, and
  the `this.#tasks = fold(this.#tasks)` line that says why an in-memory copy has
  to be folded too. `#readRoutines` sanitizes and `saveCurrentAsRoutine` shows
  the refresh-after-write shape.
- [`src/lib/business/model/tags.ts`](../../src/lib/business/model/tags.ts) —
  `renameTagInTasks` and `removeTagFromTasks`, whose parameter is the only thing
  this change alters about them. `toStoredTags` says a tagless task carries no
  `tags` field, not `[]`.
- [`src/lib/data/type/index.ts`](../../src/lib/data/type/index.ts) —
  `SavedRoutine.tasks` is `Omit<Task, 'id' | 'createdAt' | 'completed'>[]`, which
  is why the folds cannot take it today.
- [`src/lib/data/repository/routine-repository.ts`](../../src/lib/data/repository/routine-repository.ts)
  — `$readAllRoutines` and `$updateRoutine` (a `put`, so an upsert on the same
  `id`).
- [`src/lib/business/model/persisted.ts`](../../src/lib/business/model/persisted.ts)
  — `sanitizeRoutines` rebuilds a record field by field, which is what the raw
  read exists to avoid writing back.
- [`src/lib/business/AGENTS.md`](../../src/lib/business/AGENTS.md) §"Four write
  sites carry the whole day" — it names `#rewriteTagInHistory` and says it
  carries every field for free because it spreads a RAW record; that argument
  now covers a second store and the section says so.
- [`e2e/routine.e2e.ts`](../../e2e/routine.e2e.ts) — the existing test that a
  routine carries the importance its tasks were saved with is the same shape as
  both scenarios above.
- [`e2e/task-tags.e2e.ts`](../../e2e/task-tags.e2e.ts) — `writeTaggedDay`, the
  IndexedDB seeding helper, and `tagRows`.
- [the tag that could only be respelled](the-tag-that-could-only-be-respelled.md)
  and [the tag that could never be respelled](the-tag-that-could-never-be-respelled.md)
  — the two frozen specs whose "everywhere" this one makes true.

**No MATH.md section.** A tag enters no formula.

## Decisions

- **The routines are rewritten in the same write, not stripped on import.** One
  write site keeps one meaning of "everywhere", and a routine the user opens
  later already reads right. Rejected: dropping unknown tags in `importTasks`,
  because the record stays wrong on disk, a backup carries the stale spelling
  forward, and a rename would silently drop the tag instead of respelling it.
  Rejected too: a second method beside the day rewrite, because the fold, the
  demo guard and the error path would then exist twice (R3).
- **Both verbs reach routines.** The gap is identical under each — a routine
  keeps `dep work` forever after the respell, and hands `errand` back after the
  delete — and `#rewriteTagInHistory` already takes the fold as a parameter, so
  the two are one diff.
- **Both folds widen to `<T extends { tags?: string[] }>` rather than gaining a
  routine-shaped twin.** This is the second real caller, which is when §0 allows
  the generality; the fold reads and writes exactly one field and never needed
  the rest of `Task`. Rejected: a `routine-tags.ts` pair, which is R3's mirror.
- **The routine read is RAW, like the day read.** `sanitizeRoutines` rebuilds a
  record field by field, so writing its output back would drop whatever a future
  field adds — the argument `business/AGENTS.md` already makes for the whole-day
  writes.
- **`#routines` is re-read after the write, the way `saveCurrentAsRoutine` does
  it.** The in-memory list is what the routine menu renders and what
  `importRoutine` passes to `onimport`, so a rewrite that stopped at storage
  hands the old tag back until the next reload — the same failure the loaded
  day's `#tasks` line already guards against.
- **A routine whose write fails gets no test of its own.** It is inside the one
  `try` the day rewrite already uses, so it raises the same `save-failed` banner
  through the same `catch`; a second test would pin the same line twice.

## Open questions

None.
