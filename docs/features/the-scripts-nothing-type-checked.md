# The scripts nothing type-checked

**Kind:** repair · **Status:** landed 2026-09-06 · **Roadmap:** item `M103`

Frozen at land: this file says what was decided on the date it carries, never
how the code works today — that is MATH.md and the area `AGENTS.md`. When later
work changes the behaviour, it writes its own feature file; it does not edit
this one. Same status as [zenith.md](../../zenith.md), for the same reason.

## Goal

[`the-rename-that-turned-off-every-check`](the-rename-that-turned-off-every-check.md)
put `scripts/**/*.ts` and `e2e/**/*.ts` into `npm run check` and set
`checkJs: false`, because turning it on printed 160 errors that change had not
priced. This is the other half: `scripts/**/*.mjs` joins the include, the
`checkJs: false` line goes, and the 160 are fixed.

Those thirteen files are the six doc scripts `npm run lint` runs on every
commit, the four contrast instruments, the two screenshot scripts, and
`generate-fixture.mjs`. Eleven of the thirteen carried errors — `brief-size.mjs`
and `theme-screenshots.mjs` were already clean.

**None of the 160 was live.** M103 recorded that nobody had looked; someone has
now, and the answer is that every one was a missing annotation, an unreachable
null, or a shape the code never read. The two that describe a real crash path
are `boundingBox()` returning null in `hover-contrast.mjs` and
`inset-contrast.mjs`, where the script previously died on a null dereference
naming neither the theme nor the element. Note what that null is **not**: a
locator matching nothing times out rather than returning null, so a moved story
id throws on its own. Null is the attached-but-invisible case — a zero-size box,
a hidden ancestor — and those two now throw saying which element. Every other
null in the set is a `getContext('2d')` or a `getElementById` on a node created
three lines above, and takes a cast rather than a branch (AGENTS.md §0 — a guard
against an unreachable failure is a lie about what can happen).

## Reach

160 errors, 11 files. By file: `generate-fixture` 34, `series-ink-contrast` 24,
`math-index` 24, `inset-contrast` 24, `ink-contrast` 18, `hover-contrast` 18,
`math-citations` 10, `comment-density` 5, and one each in `readme-screenshot`,
`probe-registry` and `file-names`. By code: 84 `TS7006` and 10 `TS7031`
(implicit-`any` parameters and binding elements), 39 `TS18047` and 2 `TS2532`
(possibly null or undefined), 9 `TS7005` and 2 `TS7034` (implicit `any[]`), 5
`TS2345`, 5 `TS2339`, 4 `TS7053`.

One error landed **outside** `scripts/`: `src/lib/paraglide/runtime.js` reads
`import.meta.env`, which is Vite's and not Node's. It is generated code, pulled
in because the instruments import the app through `$lib` — and it is there only
sometimes. Paraglide's **Vite plugin** emits that line; its **CLI** emits a
runtime without it, and `npm run check` runs the CLI first, so `check` never
sees the error and a bare `tsc` after the dev server always does. The config
takes `vite/client` alongside `node` for the second case: a type error inside
generated code, reachable by a plain command, costs more to rediscover than the
word costs to carry.

Five changes are more than an annotation:

- **`ink-contrast.mjs`** computed `dark` and `light` inside `page.evaluate` and
  then bolted `best` onto every row afterwards, outside the browser. `best` is
  `Math.max` of two fields that already exist at the push site, so it moves
  there and the mutation loop goes. Four reads of `.best` stop being reads of a
  property the row's type never had.
- **`generate-fixture.mjs`'s `arg`** takes `@template T` — it is called with
  number fallbacks and string ones, five of its eight callers wrap the result in
  `Number()` and three take the string as it comes. A single return type would
  have to be wrong for one group or the other.
- **`chosen`** in the same file is declared without `frequency`: the catalogue
  entries carry it as their draw weight, the one-off pushed beside them does
  not, and nothing past that line reads it.
- **`probe-registry.mjs` and `math-citations.mjs`** replace three
  `.filter(Boolean)` calls, which do not narrow. `math-citations.mjs`'s two
  filter whole `RegExpExecArray`s, and an array is always truthy, so
  `!== null` is exactly what `Boolean` was doing. `probe-registry.mjs` filters a
  capture group, so it is `!== undefined`, and there the equivalence rests on the
  group being `+`-quantified: it cannot be the empty string `Boolean` would have
  dropped.
- **`math-citations.mjs`'s `headings`** is `Record<string, Set<string> |
undefined>` — a document that is neither MATH.md nor AGENTS.md genuinely has no
  heading set, which is what the citation loop's `target?.has(...)` already
  assumed. The summary line reads the two sets through their own names instead of
  through the record, so nothing has to be re-narrowed to print a count.

## Scenarios

### Scenario — `npm run check` reads the thirteen scripts

`tsconfig.tooling.json`

- **Given** `checkJs` inherited `true` and `scripts/**/*.mjs` in the include
- **When** `npm run check` runs
- **Then** it reports 0 errors, and a new implicit `any` in any script fails it
- **Then** the tooling program reads 392 files, 108 of them under `scripts/` and
  `e2e/` — the 73 `.ts` probes, the 13 `.mjs`, and 22 specs. The 2355 files
  `check` prints is svelte-check's count for the app, a separate program

### Scenario — every instrument still prints what it printed

R6 is satisfied by hand here: no `.mjs` script is in a vitest project, and the
four browser instruments are run against a live server rather than a fixture.
Each was run before and after.

- The six doc scripts pass `--check`.
- `generate-fixture.mjs --days 3` writes its fixture.
- `ink-contrast.mjs` prints **byte-identical** output across the change — 46
  themes × 9 fills = 414 pairs, worst 4.21:1, median 6.74:1, 0 on the worse
  pole, 0 below 3.0:1, 8 capped below 4.5:1 — which is what establishes that
  moving `best` inside the evaluate changed nothing. The old file was run from
  `git show HEAD:` for that comparison.
- `series-ink-contrast.mjs`, `hover-contrast.mjs` and `inset-contrast.mjs` run
  and print their tables.

## Out of scope

- **`.claude/hooks/` and `eval/`.** Still in no type-check program. Item 37
  named `scripts/` and `e2e/`; neither it nor this change reaches these two, and
  no finding has been raised for them.
- **Turning `strict` up further on the scripts.** They inherit the app's
  `strict`; `noUncheckedIndexedAccess` is not on for the app and is not turned
  on for a corner of it.
- **The three `page.evaluate` bodies that read untyped browser globals.** They
  are typed through `lib.dom`, which the app's config already provides; nothing
  here declares a new ambient.
- **Re-running the frozen contrast records.** The instruments print the same
  numbers; no dated record moves.

## Doc routing

- `docs/testing.md` — what `npm run check` covers, and its re-timed cost.
