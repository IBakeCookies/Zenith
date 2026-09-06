# The tag that could only be respelled

**Kind:** feature · **Status:** landed 2026-09-07 · **Roadmap:** item `none`

Frozen at land: this file says what was decided on the date it carries, never
how the code works today — that is MATH.md and the area `AGENTS.md`. When later
work changes the behaviour, it writes its own feature file; it does not edit
this one. Same status as [zenith.md](../../zenith.md), for the same reason.

## Goal

A tag the user is done with can be taken off every task it was ever put on,
from the same card that respells one — and the ✎ that opened the rename editor
closes it again, the way the log rows' ✎ already does.
[The tag that could never be respelled](the-tag-that-could-never-be-respelled.md)
put delete out of scope; this is the ask arriving.

## Scenarios

### Scenario — a tag is dropped from every day it appears on

`e2e/task-tags.e2e.ts`

- **Given** two stored days a week apart, each with one task tagged `errand`
  and a 🪫 session logged against it
- **When** the user deletes `errand` on the tag card and confirms
- **Then** the card lists no row labelled `errand`
- **And** _(own line)_ both days' hours are now under the untagged row

### Scenario — the delete asks before it runs

`src/lib/presentation/component/tag-hours-card.stories.svelte`

- **Given** the card showing a tag row
- **When** the user presses ✕ once
- **Then** the card has not called `ondelete`
- **And** _(own line)_ the row offers a confirm and a cancel

### Scenario — the ✎ closes the editor it opened

`src/lib/presentation/component/tag-hours-card.stories.svelte`

- **Given** the rename editor open on a row
- **When** the user presses that row's ✎ again
- **Then** the field is gone

### Claim — the fold takes the tag off and leaves everything else alone

`src/lib/business/model/tags.test.ts`

- **Given** any task list and a tag
- **Then** a list carrying it comes back without it, and a task left with no tag
  carries no `tags` field at all
- **And** _(own line)_ a list carrying none is returned by identity, so its day
  is not written

### Claim — the example day refuses the delete

`src/lib/business/store/session-store.svelte.spec.ts`

- **Given** the store showing the demo fixture (`#isShowingDemo`)
- **Then** `deleteTag` writes no session record

## Out of scope

- **Undoing a delete.** Same argument the rename made: undo is a second
  full-history write, and the confirmation is what this feature spends instead.
- **Deleting a tag from one day.** The task form already does that.
- **A tag entering any formula.** It does not, and this change must not start.

## Read before building

- [`src/lib/business/model/tags.ts`](../../src/lib/business/model/tags.ts) —
  `renameTagInTasks`, whose identity-return contract the delete fold copies.
  `toStoredTags` says a tagless task carries no `tags` field, not `[]`.
- [`src/lib/business/store/session-store.svelte.ts`](../../src/lib/business/store/session-store.svelte.ts)
  — `renameTag`: the demo guard, the unbounded raw read, the per-day write, the
  loaded day's `#tasks`, and `#tagVocabulary`. The delete is the second caller
  of all of it (R3).
- [`src/lib/business/store/analytics-store.svelte.ts`](../../src/lib/business/store/analytics-store.svelte.ts)
  — `renameTag`, the in-memory refresh the delete needs too.
- [`src/lib/presentation/component/tag-hours-card.svelte`](../../src/lib/presentation/component/tag-hours-card.svelte)
  and its `.stories.svelte`.
- [`src/lib/presentation/component/fit-log-summary.svelte`](../../src/lib/presentation/component/fit-log-summary.svelte)
  and [`day-actions.svelte`](../../src/lib/presentation/component/day-actions.svelte)
  — the repo's two inline arm-then-confirm deletes, and why the confirm focuses
  cancel.
- [`src/lib/presentation/component/log-history-list.svelte`](../../src/lib/presentation/component/log-history-list.svelte)
  — the ✎ that toggles, which this card's does not.
- [`src/lib/business/AGENTS.md`](../../src/lib/business/AGENTS.md) §"Four write
  sites carry the whole day" and the `#isShowingDemo` write list — both name
  `renameTag` and gain its second verb.

**No MATH.md section.** A tag enters no formula.

## Decisions

- **A second fold, not a rename onto the empty string.** `renameTagInTasks`
  would have to learn that an empty `to` means removal, which is a branch the
  name denies. `removeTagFromTasks` is eight lines and says what it does.
- **One private history-write in `SessionStore`, taking the fold.** Rename and
  delete differ only in the fold and in what they do to `#tagVocabulary`; the
  read, the corrupt-record skip, the per-day write, the loaded day and the
  error path are one definition (R3) at the second real caller (§0).
- **Arm-then-confirm on the row, no toast undo.** The repo's existing inline
  pattern, and the confirm focuses cancel so a stray Enter cannot drop a tag —
  `fit-log-summary` settled that argument.

## What landed, and what moved that this file did not plan

- **The shared write is `SessionStore.#rewriteTagInHistory`, and it is what
  `business/AGENTS.md` now names** — the "four write sites" paragraph and the
  `#isShowingDemo` write list said `renameTag`, which is no longer the site that
  writes.
- **The confirm is two word-buttons, not two glyphs.** ✕ arms; the armed row
  reads `Delete?` in danger ink beside `Cancel`, which is `fit-log-summary`'s
  shape. The ✕ that armed it is the glyph the log rows delete with, so the row
  keeps one meaning per symbol.
- **Both row states have to be dropped when the range drops the row.** The
  review found the editor already outliving its row from the rename change: a
  90-day row armed or opened, the range narrowed past it and widened back, comes
  back armed — focused, because the confirm's cancel attaches focus. One
  `$effect` clears both, which is `fit-log-summary`'s shape and what the page
  does for the log rows. `tag-hours-card.svelte.spec.ts` is new for it: the range
  switch is a rerender, which a story `play` cannot drive.
- **A `{@attach}` on a `Button` needs its parameter typed** (`node: HTMLElement`)
  where the same attachment on a bare `<input>` does not — the component's
  attachment slot carries no element type, and `npm run check` fails otherwise.

## Open questions

None.
