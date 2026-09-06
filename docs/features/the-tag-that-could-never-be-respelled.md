# The tag that could never be respelled

**Kind:** feature · **Status:** planning 2026-09-06 · **Roadmap:** item `none`

Frozen at land: this file says what was decided on the date it carries, never
how the code works today — that is MATH.md and the area `AGENTS.md`. When later
work changes the behaviour, it writes its own feature file; it does not edit
this one. Same status as [zenith.md](../../zenith.md), for the same reason.

## Goal

A tag typed wrong on twenty days can be respelled once, from the card that
shows the damage. Today it cannot be respelled at all: the only writer is
`SessionStore.updateTask`, one task at a time, and the planner passes it as
`undefined` on any day but today — so a tag on a past day is frozen the moment
the day is, and "Logged hours by tag" prints one label as two rows forever.

## Scenarios

The e2e file and its `writeTaggedDay` helper already exist
([`e2e/task-tags.e2e.ts`](../../e2e/task-tags.e2e.ts)) — these are added to it.

### Scenario — a mistyped tag is respelled on every day it appears

`e2e/task-tags.e2e.ts`

- **Given** two stored days a week apart, each with one task tagged `dep work`
  and a 🪫 session logged against it
- **When** the user renames `dep work` to `deep work` on the tag card
- **Then** the card lists one row labelled `deep work`
- **And** _(own line)_ that row's hours are both days' logged hours

### Scenario — a rename onto a tag already in use says so before it runs

`e2e/task-tags.e2e.ts`

- **Given** a stored history carrying both `deep work` and `dep work`
- **When** the user opens the rename editor on `dep work` and types `deep work`
- **Then** the editor shows that saving merges the two

### Scenario — the merge folds the two rows into one

`e2e/task-tags.e2e.ts`

- **Given** the state of the scenario above
- **When** the user saves the rename
- **Then** the card lists no row labelled `dep work`
- **And** _(own line)_ the `deep work` row's hours are the two rows' hours added

### Scenario — the planner's tag suggestions offer the new spelling

`e2e/task-tags.e2e.ts`

- **Given** a rename of `dep work` to `deep work` just saved on the tag card
- **When** the user opens the planner's add-task form and focuses the tag field
- **Then** the suggestions offer `deep work`
- **And** _(own line)_ the suggestions do not offer `dep work`

### Scenario — the live day keeps the new spelling through the next autosave

The corruption path this feature has to close: `SessionStore` is built in the
`(app)` layout, so it holds today's tasks in memory the whole time `/analytics`
is open, and its auto-save effect writes the whole day. A rename that reaches
storage without reaching those in-memory tasks is undone by the next edit the
user makes on the planner.

`e2e/task-tags.e2e.ts`

- **Given** today's day carries a task tagged `dep work`, renamed to
  `deep work` on the tag card
- **When** the user returns to the planner, edits an unrelated task, and comes
  back to the tag card
- **Then** the card still lists one row labelled `deep work`

### Claim — the fold is exact on the two cases a task can be in

`src/lib/business/model/tags.test.ts` (a `.test.ts`, not a probe — a bound that
holds, not a number that moves)

- **Given** any task list and any two normalized tags `from` and `to`
- **Then** a task carrying both `from` and `to` ends with `to` exactly once
- **And** _(own line)_ a task list carrying no `from` is returned unchanged, so
  its day is not written

### Claim — the example day refuses the rename

`src/lib/business/store/session-store.svelte.spec.ts`

- **Given** the store showing the demo fixture (`#isShowingDemo`)
- **Then** `renameTag` writes no session record

## Out of scope

- **Deleting a tag.** Same store method, one more button, one more scenario —
  and not the ask (AGENTS.md §0). Rename is what unbreaks the card.
- **Undoing a rename.** `offerBack` exists, but a rename is not a deletion with
  a record to hand back; undo means a second full-history write.
- **Editing anything else on a past day.** Plan immutability holds. A tag is
  the one field that can be rewritten across frozen days without touching a
  measurement, because no formula reads one — that is the whole argument for
  this feature, and it does not extend to a second field.
- **Renaming from the calendar or the task form.** One surface, the one where
  the split is visible.
- **A tag entering any formula.** It does not, and this change must not start.

## Read before building

- [`src/lib/business/model/tags.ts`](../../src/lib/business/model/tags.ts) —
  `normalizeTag`, `toStoredTags`, `collectTags`, `tagHours`. The pure fold
  lands here, beside the fold that reads it.
- [`src/lib/business/model/persisted.ts`](../../src/lib/business/model/persisted.ts)
  — `sanitizeSession` rebuilds a record field by field. It is a read validator;
  a session that went through it must never be written back.
- [`src/lib/data/repository/session-repository.ts`](../../src/lib/data/repository/session-repository.ts)
  — `$updateSession` is a whole-record `put()`, and `$readSessionsByDateRange`
  is the only ranged read.
- [`src/lib/business/session-history.ts`](../../src/lib/business/session-history.ts)
  — `BEFORE_ANY_DATE`, currently file-private, is the open lower bound a
  full-history read needs. A second spelling of it is R3.
- [`src/lib/business/store/session-store.svelte.ts`](../../src/lib/business/store/session-store.svelte.ts)
  — `updateTask`'s `#canEditPlan` guard (why the typo is stuck), `#tagVocabulary`
  (set once from `readHistoryPrefills`, so a rename must fix it), `#isShowingDemo`,
  and the auto-save effect that watches `#tasks`.
- [`src/lib/business/AGENTS.md`](../../src/lib/business/AGENTS.md) §"Three write
  sites carry the whole day, so a new field lands in all three" — this change
  makes it four. Correct that section in the landing commit (AGENTS.md §0:
  documentation a change makes false is fixed in the diff that found it).
- [`src/lib/business/AGENTS.md`](../../src/lib/business/AGENTS.md) §"`SessionStore`
  has a second day source, and it reaches no storage" — the demo guard is
  `#isShowingDemo`, refused in the store and never at the call site.
- [`src/lib/business/store/analytics-store.svelte.ts`](../../src/lib/business/store/analytics-store.svelte.ts)
  — `#all` (`DaySummary[]`, which carries `tasks`), `#tagHours`, and the
  `setAnalyticsStore` doc comment explaining why there is deliberately no
  route-called `load()`.
- [`src/lib/business/model/metric/history.ts`](../../src/lib/business/model/metric/history.ts)
  — `DaySummary` holds `tasks: Task[]`, and every other field on it is
  tag-independent. That is what lets the card refresh without a re-read.
- [`src/lib/presentation/component/tag-hours-card.svelte`](../../src/lib/presentation/component/tag-hours-card.svelte)
  and its `.stories.svelte` — the card gains one prop and an inline editor.
- [`src/routes/(app)/analytics/+page.svelte`](<../../src/routes/(app)/analytics/+page.svelte>)
  — already holds `analytics`, `session` and `observations`, and already wires
  multi-store handlers (`saveFlowLog`, `saveDrainLog`). The rename handler is
  one more of those, not new orchestration.
- [`src/lib/presentation/AGENTS.md`](../../src/lib/presentation/AGENTS.md) —
  R2's line on what a route may hold, and where a component's props come from.
- [STYLE.md](../../src/lib/presentation/style/STYLE.md) — the inline editor's
  classes; reach for an existing `@utility` before a new cluster.
- `src/lib/paraglide/messages/*.json` — five locales, and the card's existing
  keys are `ana_tag_hours*`.
- [docs/testing.md](../testing.md) — the level table these tests were picked
  from, and the reviewer rule (this diff touches `business/store` and a
  persisted shape: full pass).

**No MATH.md section.** A tag enters no formula — not the allocator, not the
energy mode, not the plan advice — which is precisely why rewriting one across
frozen days changes no fit, no plan and no metric.

## Decisions

- **Kind is `feature`.** The Goal says what the user can do — respell a tag
  everywhere they used it — in their own words. It is not a repair: nothing
  disagreed with anything, the capability was simply absent.
- **One pure fold over `Task[]`, shared by the write and the refresh** — the
  stored `DailySession` and the in-memory `DaySummary` both carry `tasks`, so
  the function takes the array, not the day. Returning the unchanged array
  (identity) when no task carries the old tag is what tells the caller which
  days to write. Rejected: a fold per shape, which is R3 the moment it exists.
- **Read raw, write raw.** The write path reads through
  `$readSessionsByDateRange` and rewrites only the `tags` arrays. Rejected:
  reusing `sanitizeSessions`, because it rebuilds each record field by field —
  writing its output back would silently drop whatever a future field adds, the
  same failure mode as the three write sites that erase what they do not carry.
- **`SessionStore` owns the write.** It holds the loaded day's `#tasks`, the
  demo write-guard and `#tagVocabulary` — the three things a rename invalidates.
  Rejected: `AnalyticsStore` writing sessions itself, which reaches storage
  behind the live day's back and loses the next autosave race (the fifth
  scenario), skips the demo guard, and leaves the planner's tag suggestions
  offering a spelling that no longer exists.
- **`AnalyticsStore` re-applies the fold to `#all` instead of re-reading.**
  Every `DaySummary` field but `tasks` is tag-independent, so the in-memory
  rewrite is exact. Rejected: re-reading the range, which costs a year of
  summaries plus the 30-day audit's two planner runs per day; and a public
  `load()` the route calls, which the store's own doc comment rules out.
- **Unbounded range in both directions.** `BEFORE_ANY_DATE` to a bound above
  any ISO date. Rejected: reading up to today, because `moveTaskToTomorrow`
  puts tagged tasks on future days, and they would keep the old spelling.
- **An inline editor on the row, not a dialog.** The repo has no dialog or
  confirm component, and the merge warning is one line of copy that belongs
  beside the input the user is typing into. Rejected: a modal confirm, which is
  a new component family for one caller (§0).
- **Merge is allowed and announced, not refused.** Refusing on collision leaves
  the typo case — `dep work` next to `deep work` — with no way out, which is
  the case this feature exists for.
- **Rename only.** Delete is a second verb on the same method; §0 says ship the
  ask.

## Open questions

None.
