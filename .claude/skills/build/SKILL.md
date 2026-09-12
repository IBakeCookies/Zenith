---
name: build
description: Make a planned Fallow change's failing tests green — red once, dispatch, review, land. Takes the test file `/plan` wrote. Not for `npm run build`.
---

# Building a planned change

Takes the test file `/plan` wrote; its header comment is the brief. Read
AGENTS.md §0–§4, the brief, and **only the files its Read before building
names**. If that list is thin, the plan is not ready — go back to `/plan`
rather than starting a search here.

A spec still at `planning` in `docs/features/` is the same input in prose:
transcribe its scenarios into the test files it names, then continue from
step 1.

**This phase writes no test.** The one edit it makes to one is fixing a red
that is not the behaviour's absence — a typo, a wrong locator, a fixture the
tree moved under — and every such edit is named in the report.

## 1. Red, once

Run the brief's test files (the commands, and what may not run alongside them:
testing.md's five commands). Every test is red for the reason the brief states,
and the Pins pass. Anything else is the test's bug or a tree that moved under
it: fix the test, and say so.

## 2. Dispatch

One implementer subagent. Give it the test paths, the run command, the Read
before building list, **Out of scope** verbatim, and this line:

> **Do not edit a test.** If one has to change to pass, stop and report — the
> plan or the code is wrong, and that call is not yours.

Check it mechanically when it returns: `git diff --stat` over the test files is
empty. Its job is every test green without touching anything the brief did not
route to. A probe the brief names is the one test-shaped file it writes, with
its `scripts/PROBES.md` row (docs/testing.md, Writing a probe). Tell it each
e2e run rebuilds the app, so it batches edits before a run. It reports a change
manifest — files and what changed — not a narrated diff.

Subagents do not inherit this session's Honey hook, so paste the worker
directive from `honey:honey-superpowers` into the prompt.

## 3. Review

Follow **The reviewer pass** in [docs/testing.md](../../../docs/testing.md):
the blast-radius table, the brief that stops a reviewer padding, the root
`AGENTS.md` plus the layer file for what the diff touches, and the triage on
the way back — verify every claim against the code, fix bugs, decline the rest
out loud in one line each.

Two things this phase adds:

- give the reviewer the test titles, so it can report a test the diff passes
  without the behaviour — an assertion on the implementation — or a behaviour
  the diff does not deliver
- **one pass.** If it shows the plan was wrong rather than the code, stop and
  surface that; no code review fixes a plan.

## 4. Land

Nothing here is optional, and the docs move in the same commit as the code:

- the brief's test files pass; `npx prettier --write` on touched files only —
  never the tree
- whatever the change puts in doubt: `npm run check` after a type-level change,
  `npm run depcheck` after crossing a layer
- a user-visible change is driven in a browser — the `verify` skill
- MATH.md updated in **this** commit if a formula, constant, bound or fit moved
- a changed convention written into the area's `AGENTS.md`
- **the brief is consumed.** The Goal stays as the file's header; Tests, Pins,
  Out of scope, Read before building and Roadmap are deleted. Decisions go to
  the landing commit's body, and one that closes a question someone would
  re-open goes to the area `AGENTS.md`'s settled decisions (§4)
- ROADMAP.md: collapse the item to its date and a link to the test file. Never
  renumber, and re-run `npx prettier --write ROADMAP.md` after (it renumbers
  lists)

The five-command gate is the user's to run, not yours. Report what shipped,
which tests are green, which were pins, and **what you ran and what you did
not**.
