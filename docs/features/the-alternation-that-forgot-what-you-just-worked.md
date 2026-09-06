# The alternation that forgot what you just worked

**Kind:** model · **Status:** landed 2026-09-06 · **Roadmap:** item 13 (the caveat it left unfixed)

Frozen at land: this file says what was decided on the date it carries, never
how the code works today — that is MATH.md and the area `AGENTS.md`. When later
work changes the behaviour, it writes its own feature file; it does not edit
this one.

Decided 2026-09-06.

## Goal

The **Next** badge stops sending you into a second physical session straight
after a physical one. `calculateInterleavedOrder` alternates cognitive and
physical work so the resting pool recovers on the clock, but it starts from a
clean slate every call — and the mid-day re-plan calls it over a set the
just-finished task has already left, so the one moment the predecessor is a
recorded fact is the one moment it is discarded.

The quantity that moves is `RemainingDay.nextTask`, and only it. Given a day
whose funded remainder still contains a task of the nature just worked, the
re-plan's position 1 changes to the highest-priority funded task that contrasts
with it. Allocations do not move: this change reaches nothing that decides
hours.

Worked reproduction, from the day that found it. Five tasks; the morning plan
funds all five and sequences them `running(P) → piano(C) → gym(P) → guitar(C) →
reading(C)` — gym sits at #3 rather than #2, on raw priority 18.6 > piano's
18.1, purely because the alternation refuses to put it behind running. The user
then logs 1h45m on running, exactly what the plan suggested. Running leaves the
funded set; the re-plan re-sequences `{gym, piano, guitar, reading}` from a null
predecessor; gym's priority wins and **Next** names it. Two physical sessions
back to back, produced by a log that agreed with the plan in every particular.

## Claims

Model work; no click. Test level from [docs/testing.md](../testing.md)'s table: "Math /
model → `*.test.ts` beside it". No probe: every claim here is a bound that
holds, not a number that moves — the sequencer is a heuristic over a finite
candidate list, and there is no fitted quantity in it to measure.

### Claim — the cold order is untouched `(pin)`

`src/lib/business/model/metric/calculation.test.ts`

- **Given** any task list, and `calculateInterleavedOrder` called with no
  predecessor argument
- **Then** the returned sequence is identical to the one it returns today

Phrased through the one-argument call that exists now, so it runs green against
the old code — that is its pass condition, not an R6 failure. Three of the four
consumers (`daily-metrics.ts:132`, `calculation.ts:640`, `draft-impact.ts:130`,
`energy-lab-store.svelte.ts:434`) never pass a predecessor and this is what says
so.

### Claim — a predecessor moves position 1 off its own nature

`src/lib/business/model/metric/calculation.test.ts`

- **Given** three or more funded tasks, mixed natures, and a predecessor of
  nature `physical` whose task id is not among them
- **Then** position 1 is the highest-priority funded task whose nature is not
  `physical`

### Claim — the task you just worked is exempt from its own contrast

`src/lib/business/model/metric/calculation.test.ts`

- **Given** a predecessor `{ nature: 'physical', taskId: X }` where X is itself
  funded and holds the highest priority
- **Then** position 1 is X

Continuing a session is not a context switch. Without this the re-plan would
name a different task the moment it funded more hours on the one in progress.

### Claim — a balanced predecessor changes nothing

`src/lib/business/model/metric/calculation.test.ts`

- **Given** a predecessor of nature `balanced`
- **Then** the sequence equals the unseeded sequence for the same input

`balanced` already contrasts with everything in the existing rule; this pins
that the seed inherits that and does not invent a third behaviour.

### Claim — two funded tasks are sequenced, not short-circuited

`src/lib/business/model/metric/calculation.test.ts`

- **Given** exactly two funded tasks of different natures, and a predecessor
  matching the higher-priority one's nature
- **Then** position 1 is the lower-priority contrasting task

The `remaining.length <= 2` early return at `calculation.ts:1002` is sound with
no predecessor — the first pick is unconditionally the top priority and the
second is forced, so alternation cannot change the answer. With a predecessor
it is no longer sound, and this claim fails today.

### Claim — the re-plan seeds from the day's most recent log

`src/lib/business/model/metric/remaining-day.test.ts`

- **Given** today's logs on two tasks of opposite natures, where the task with
  the LARGER `hours` is not the task with the LARGER `createdAt`
- **Then** `nextTask` contrasts with the `createdAt`-latest task's nature

Recency, not volume. `createdAt` is already what orders a day's sessions
(`energy-calibration.ts:234`), so this adopts an instrument rather than adding
one.

### Claim — funding is bit-identical with and without the seed

`src/lib/business/model/metric/remaining-day.test.ts`

- **Given** any `RemainingDayInput`, solved with and without a predecessor
- **Then** `hoursByTask`, `plannedHours`, `remainingHours`, `workedHours` and
  `capacity` are equal in both

The seed reaches sequencing and nothing else. This is the claim that keeps the
change from being an allocation change wearing a sequencing name.

### Claim — a predecessor no longer in the day yields no seed

`src/lib/business/model/metric/remaining-day.test.ts`

- **Given** the day's latest log names a task that has since been deleted from
  the day's task list
- **Then** `nextTask` equals the unseeded answer

Nature is read off the day's tasks; a task that left the day cannot supply one.
`workedHoursByTask` already drops such rows for hours, and this keeps the two
agreeing about which logs count.

### Claim — the reported day resolves to piano

`src/lib/business/model/metric/remaining-day.test.ts`

- **Given** the five tasks of the Goal's reproduction, budget 6h45m, and one
  log of 1h45m against running
- **Then** `nextTask` is piano

The regression, transcribed. It fails today with gym.

### Claim — the store hands the re-plan today's latest log only

`src/lib/business/store/daily-plan-store.svelte.spec.ts`

- **Given** drain logs on today AND on an earlier date, the earlier one carrying
  the larger `createdAt`
- **Then** the predicate the re-plan is seeded with comes from the today row

Today's logs are already filtered at `daily-plan-store.svelte.ts:111`; this pins
that the seed reads the same filtered set and not the whole store, so a restored
backup cannot seed today from last month.

## Out of scope

- **The `#N` badges.** They are the whole-day plan's order and stay the answer
  they were this morning — `next_up_tooltip` promises exactly that. Their
  sequence is self-consistent, each row's predecessor being the row above, so
  they have no missing predecessor to supply. `daily-metrics.ts:132` keeps
  calling the one-argument form.
- **Burnout's block sequence and the Energy Lab's classic schedule.**
  `calculation.ts:640` and `energy-lab-store.svelte.ts:434` model a whole day
  from its start; there is no "just worked" for them either.
- **Staleness.** A seed never expires: the day's latest log seeds the re-plan
  whether it was ten minutes or six hours ago. The alternative is a decay window,
  which is a constant with no measurement behind it — and the failure it would
  prevent (a 9am log still steering position 1 at 6pm) costs one contrast step
  on one badge. AGENTS.md §0 settles this.
- **Batch-logging order.** `createdAt` is the LOG moment, not the session end,
  so three sessions typed at 6pm order by typing order. Recorded as a known
  approximation, not defended against: a branch that abstains when two logs are
  near-simultaneous is a second constant guarding a case where the two orders
  usually agree.
- **The ~100 citations of MATH.md §11–§36 repo-wide.** Those sections do not
  exist (the file is §0–§10). A real defect, found while routing this one, and
  an audit of its own — AGENTS.md §0's "say it, do not fix it". The two
  instances inside the ROADMAP line this spec rewrites are the exception below.

## Read before building

- `src/lib/business/model/metric/calculation.ts:997` — `calculateInterleavedOrder`,
  the greedy alternation itself. Its doc comment at `:992-995` **states the
  behaviour this change removes** ("no memory of what was just worked") and must
  be rewritten in the same commit — including its second sentence about the
  morning badges, which stays true and now needs to say why the two differ.
- `src/lib/business/model/metric/calculation.ts:145` — `OrderableTask`, which
  gains `id` so the exemption can name a task. All four consumers already pass
  `SuggestedTask`-shaped values carrying one; `daily-metrics.ts:132` reads
  `task.id` off the result today.
- `src/lib/business/model/metric/calculation.ts:70` — `getTaskNature`, the one
  ±3 definition the seed must be read through.
- `src/lib/business/model/metric/remaining-day.ts:166` — the seeded call site,
  and `:31-40` for `RemainingDayInput`, which gains the predecessor field.
- `src/lib/business/store/daily-plan-store.svelte.ts:101-125` — `#remainingDay`,
  which already filters today's drain observations and is where the argmax
  `createdAt` is taken. Gated `$derived`; the scan is O(today's logs).
- `src/lib/data/type/index.ts:93-106` — `DrainObservationRecord`, and `:103-105`
  for what `createdAt` is and is not.
- `src/lib/business/model/energy-calibration.ts:234` — the existing precedent for
  ordering a day's sessions by `createdAt`.
- `src/lib/business/model/AGENTS.md`, Settled decisions → **Run order stays
  `calculateInterleavedOrder`'s nature alternation** — the settled decision this
  change deliberately does not re-open, and the file that prices the widened
  public export. It needs a line saying the alternation now takes a predecessor.
- `src/lib/business/model/AGENTS.md`, the model-invariants list → the **"A plan
  may be solved from a PREFIX of hours already worked"** bullet, whose "feeds ONE
  next-up reading" sentence is what keeps this out of `calculateDailyMetrics`.
- `ROADMAP.md`, item 13 — its caveat sentence, which this change makes false.
  Rewrite it to the shipped-item form: a date and a link to this file. Its two
  dangling citations (`MATH.md §35`, `§16`) go with it — §16 is the settled
  decision in `model/AGENTS.md`, not a MATH.md section. Do not renumber anything.
- `messages/en.json`, key `next_up_tooltip` — re-read it after the change: it
  still holds, and the build phase should confirm rather than assume, because it
  is the sentence that told the user their logged hours caused the disagreement.
- `docs/testing.md`, the change/test level table the Claims above were picked from.

No MATH.md section. The alternation is a heuristic with no derivation in that
file; `model/AGENTS.md` owns it, and R7 does not fire.

## Decisions

- **Seed the heuristic's initial condition; do not replace the heuristic** —
  `model/AGENTS.md`'s run-order decision closed "swap the alternation for an
  order optimizer" on
  a 2026-07-29 measurement, and this is not that: the greedy rule, its priority
  sort and its fallback are untouched, and only `prevNature`'s starting value
  changes. ROADMAP item 13 records this exact change as the caveat it left
  unfixed, which is the roadmap's own account of it being open. Rejected:
  treating it as settled and closing the report, because the settled text
  forbids a reason ("the optimizer should beat the heuristic") this change does
  not use.
- **The predecessor is the day's `createdAt`-latest drain log** — it is the only
  instrument that orders a day's sessions, it is edit-stable, and
  `energy-calibration.ts:234` already reads it for exactly this. Rejected:
  inferring the predecessor from the plan's own order, because the whole point
  of the re-plan is that the day may not have been worked in that order.
- **A completed-and-logged task still seeds** — `remaining-day.ts` drops such a
  task from the candidate set as spent, and that is right for funding; but what
  it seeds is what was _worked_, which a finished task is. Rejected: seeding only
  from still-open tasks, because finishing a task is the most common way to
  arrive at this reading and would disable the fix in its main case.
- **The seed exempts its own task** — contrast fires against switching, and
  continuing is not switching. Rejected: uniform treatment, because a re-plan
  that funds another 45m on the task in progress would then refuse to name it.
- **No staleness window** — argued in Out of scope. Rejected: a fixed window
  (an unmeasured constant) and `switchCost` as the window (an hours charge on
  the budget, not a decay time — the same number would be doing two unrelated
  jobs).
- **`RemainingDayInput` takes a task id, not a nature** — the nature is derived
  inside through `getTaskNature`, so there is one ±3 definition and a caller
  cannot pass a nature that disagrees with the task's sliders (AGENTS.md R3). It
  also gives the deleted-task case its answer for free: no task, no nature, no
  seed. Rejected: passing the nature from the store, which would put a second
  reading of the ±3 threshold at a call site.
- **The `<= 2` shortcut is conditioned, not deleted** — it stays exactly as it is
  when there is no predecessor, where it provably cannot change an answer, so the
  pin above holds bit-identically.
