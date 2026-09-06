# The rename that turned off every check

**Kind:** repair · **Status:** landed 2026-09-06 · **Roadmap:** item 37

Frozen at land: this file says what was decided on the date it carries, never
how the code works today — that is MATH.md and the area `AGENTS.md`. When later
work changes the behaviour, it writes its own feature file; it does not edit
this one. Same status as [zenith.md](../../zenith.md), for the same reason.

## Goal

Two holes, both in the machinery that proves a change rather than in the app.

### The Stop hook silently checked nothing on a rename

`.claude/hooks/verify-before-finish.mjs` built its file list from
`git status --porcelain` with `line.slice(3).trim()`, which is right for exactly
the entries the plain format does not touch. It mangles two it does. A staged
rename arrives as `R  old -> new`, so the slice yields the single string
`old -> new` — neither path, and no such file — and the existence filter drops
it. A path holding a space arrives quoted, `"scratch space.ts"`, and the quotes
fail the same filter. When a rename is the only staged change the list comes
back empty and the hook takes its early exit: prettier, eslint, `check` and the
six doc scripts all skipped, reported as a pass.

`git mv` is allowlisted for agents here, and `git log -200 --diff-filter=R`
carries 97 renames.

A **deletion** reached the same exit by a different road, which item 37 did not
name: the surviving-path filter exists so eslint cannot ENOENT on a file removed
mid-run, but it was also what decided whether anything had changed at all, so
`git rm` as the sole change reported a pass too — and a deleted module is
precisely what breaks `check`. The two questions are now separate: the early
exit asks whether git reported anything, and each path-taking command re-lists
its own survivors and is skipped, alone, when it has none.

`--porcelain -z` fixes both at once: NUL-terminated records, no quoting, and a
rename's two paths as two records rather than one string. `-z` also reverses
their order — destination first, source second — so the record to keep is the
first, and the extra one is skipped by index. The source path is not merely
redundant, it is wrong to check: it no longer exists.

### `scripts/` and `e2e/` were in no type-check program

SvelteKit's generated tsconfig `include`s `src`, `test` and `tests` and nothing
else, so `npm run check` never saw the probes that produce every measured number
in these docs, nor the Playwright specs that drive the app.
`tsconfig.tooling.json` covers both and joins `check`, taking it from 15 s to
17 s — both timed on the same box the same day, which the standing 13 s figure
in `docs/testing.md` was not.

It printed four errors, one of them live:

- **`rv13-terminal-timing.probe.ts` imported `DEFAULT_USER_CONSTANTS` from
  `zenith-energy`**, which imports that name from `zenith` and never re-exports
  it. Under Vite's SSR transform an unexported name is not a link error — it
  reads `undefined`. A throwaway probe printed `from zenith-energy: undefined`
  beside `from zenith: { c1: 0.56, c2: -0.24, c3: 0.5 }`. The probe's printed
  numbers do not move: it passes the value on as the `constants` argument of
  `optimizeSchedule`, whose default parameter is that same object, so
  `undefined` fell through to the right value. The record it re-derives stands;
  what was broken was the guarantee, not the figure.
- **Two probes passed `{ difficulty, enjoyment }` to `calculateTaskParams`**,
  whose `TaskInput` requires a `title`. `title: ''` is the idiom six other probe
  sites already use for a task literal built only to be measured
  (`curve-marginal-facts`, `enb-simpson-error`); the two files' own other
  literals name their tasks, because those are ranked rather than measured.
- **One built a `DailySession` literal without `updatedAt`.**

## Reach

The hook runs on every stop, so its repair reaches every change from here.
`tsconfig.tooling.json` reaches 73 `.ts` files under `scripts/` and 22 under
`e2e/`. Four probes changed; no file under `src/` did, and no printed number
moved.

## Scenarios

The hook has no test harness — nothing under `.claude/` is in a vitest project —
so R6 was satisfied by hand, watching each case fail before the fix and pass
after.

### Scenario — a staged rename is checked, not skipped

- **Given** `README.md` renamed and a badly formatted list appended to it
- **Then** before: the hook exits 0 having printed nothing
- **Then** after: it exits 2, and prettier names the renamed file

### Scenario — a path with a space is checked

- **Given** an unformatted `scratch space.ts`
- **Then** before: the quoted path fails the existence filter and is dropped
- **Then** after: prettier names it

### Scenario — a deletion still runs `check`

- **Given** a deleted `.ts` file as the only change
- **Then** before: the surviving list is empty and the hook exits 0
- **Then** after: the early exit does not fire, `proseOnly` is false so `check`
  runs, and prettier and eslint are each skipped for having no surviving path —
  which is the correct answer for those two and was never the correct answer for
  the hook

### Scenario — `check` sees the probes and the specs

- **Given** `tsc -p tsconfig.tooling.json --noEmit`
- **Then** before the four fixes: 4 errors
- **Then** after: 0, and `npm run check` is 0 errors end to end

## Out of scope

- **`scripts/**/*.mjs`.** `checkJs` is off for this program. Turning it on over
  the thirteen of them prints 160 errors — 85 in the four instruments that drive
  a browser, but 75 in pure-Node scripts, 34 of those in `generate-fixture.mjs`
  alone. That is a finding of its own (M103), not this repair's diff.
- **`.claude/hooks/` and `eval/`.** Still in no program. Item 37 named
  `scripts/` and `e2e/`.
- **Narrowing `calculateTaskParams` to the two fields it reads.** It would make
  both probe errors disappear without a `title: ''`, but it changes a model
  signature to suit a probe, and every other caller in the repo already passes a
  full `TaskInput`.
- **Re-running the records the four probes back.** No printed number moved, so
  none of them is restated.

## Doc routing

- `docs/testing.md` — what `check` covers, and its re-timed cost.
