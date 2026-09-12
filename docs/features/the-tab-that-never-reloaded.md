# The tab that never reloaded

**Kind:** feature · **Status:** landed 2026-09-12 · **Roadmap:** none

## Goal

A tab left open for days is still running the build it was loaded with, and
nothing in the app says so. After this, returning to that tab raises a toast
saying a new version of Fallow is available, with one button that loads it.

## Scenarios

### Scenario — returning to a stale tab offers the new version

`e2e/version-update.e2e.ts`

- **Given** a loaded page, and `/_app/version.json` now answering with a
  version string different from the running build's
- **When** the tab is refocused (a `visibilitychange` with
  `document.visibilityState === 'visible'`)
- **Then** a toast reads that a new version is available
- **Then** the toast carries a reload action

### Scenario — the reload action loads the new build

`e2e/version-update.e2e.ts`

- **Given** the update toast is showing
- **When** the reload action is clicked
- **Then** the page performs a full load

### Scenario — refocusing on the current build says nothing

`e2e/version-update.e2e.ts`

- **Given** a loaded page, and `/_app/version.json` unchanged
- **When** the tab is refocused
- **Then** no toast appears

### Scenario — refocusing twice does not stack two toasts

`e2e/version-update.e2e.ts`

- **Given** the update toast is showing after one refocus
- **When** the tab is refocused again
- **Then** exactly one toast is showing

## Out of scope

- **Polling on a timer.** `kit.version.pollInterval` stays unset. A tab open all
  week would fire thousands of requests to learn something only relevant the
  moment the user looks at it.
- **Reloading automatically.** The button is the whole point: a reload during an
  open task editor throws away the draft, which is UI-only state no repository
  holds.
- **Dismiss-and-remind, snooze, or a version number in the message.** Sonner's
  own dismiss is already there; nothing else was asked for.
- **The service worker's own update lifecycle.** It already `skipWaiting()`s and
  claims clients; this change reads `_app/version.json` and does not touch
  `src/service-worker.ts`.
- **Telling the user what changed.** No changelog, no release notes surface.

## Read before building

- `src/lib/presentation/utils/toast.ts` — the sonner wrapper every toast goes
  through (a caller picks the severity, never the colours). `showUndoToast` is
  the precedent for an action toast; the new one differs in living forever and
  in carrying an id.
- `src/routes/(app)/+layout.svelte` — mounts `<Toaster>` and already calls
  `onMount(flushPendingToasts)`; that mount is where the listener is registered
  and torn down.
- `node_modules/@sveltejs/kit/src/runtime/client/utils.js`, `create_updated_store`
  — three facts the implementation depends on: `check()` **always resolves
  `false` in dev**, so this is only verifiable against `npm run preview`; it
  never throws (a failed fetch resolves `false`, which is the offline case); and
  it re-reads the file on every call, so it keeps resolving `true` after the
  first detection — hence the stacking scenario.
- `src/service-worker.ts` — `_app/version.json` is in neither `build` nor
  `files`, so it takes the network-first page path and is cached under its
  pathname. Online the live answer always wins; offline the cached copy is this
  build's own version, so `check()` resolves `false`. Nothing to change.
- `docs/deployment.md` — the settled-decisions file for how pages are served.
  This change adds a section there — 109 of its 125 budgeted lines are used, so
  it has to fit in 16 (`scripts/brief-size.mjs`).
- `docs/testing.md` — the level table (user-visible flow → e2e) and the
  `serviceWorkers: 'block'` default in `playwright.config.ts` that makes
  `page.route('**/_app/version.json', …)` reach the page's own fetch.
- `messages/en.json` and its four siblings — key-for-key; `error_reload` sits
  near where the new keys go.

## Decisions

- **Check on `visibilitychange`, not on a timer** — the answer only matters when
  the user is looking at the tab, and a backgrounded tab then costs nothing.
  Rejected: `kit.version.pollInterval`, which is one line of config and no code,
  because a week-long tab pays thousands of requests for a fact it needs once.
- **A toast, not a banner in the app chrome** — reuses the toaster that is
  already mounted, so the change is one util, one wiring line and two message
  keys. Rejected: a strip above the nav, which is new markup, new tokens, a
  story and a layout shift for something that fires once a deploy; and a dot on
  the nav, which is quiet enough to miss for days, which is the thing this
  feature exists to stop.
- **The toast lives until acted on** (`duration: Number.POSITIVE_INFINITY`) and
  carries a fixed sonner `id`, so a second refocus replaces it rather than
  stacking. Rejected: a long finite duration, because the tab may be refocused
  and left again.
- **The logic lives in `presentation/utils/`, not in the layout** — `updated`
  comes from `$app/state`, which R5 keeps out of the business layer, and R2
  keeps the `await` out of the route. The util owns the listener and returns its
  teardown; the layout's `onMount` returns that.
- **Two new message keys rather than reusing `error_reload`** — the error page's
  "Reload page" is a full-width button on a dead page; the toast's action sits
  beside a sentence and wants to be short. They are two strings that happen to
  agree in English today, not one fact mirrored (R3).
- **e2e is the only level** — the behaviour is a fetch, a listener and a
  rendered toast, and `check()` is stubbed out in dev, so a unit test would
  assert against kit's dev no-op. `page.route` on `_app/version.json` reaches
  the real one in the preview build.

## Open questions

None.
