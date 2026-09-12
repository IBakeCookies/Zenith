import { expect, test, type Page } from '@playwright/test';

/* A tab left open across a deploy is still running the build it loaded with, and
   the only thing that knows better is `_app/version.json`. `updated.check()` is a
   dev no-op, so this is only ever true against the preview build the config
   builds — and `serviceWorkers: 'block'` is what lets `page.route` reach the
   page's own fetch rather than the worker's. */

const VERSION_FILE = '**/_app/version.json';
const UPDATE_MESSAGE = 'A new version of Fallow is available.';
/* The version file answering is not the toast: the response is parsed, compared and
   only then rendered, measured at 30-68 ms behind it. Both assertions that a toast
   is ABSENT — or has not gained a second — would otherwise sample inside that gap
   and pass on a toaster that was about to paint. */
const TOAST_RENDER_MS = 1000;

/** Answer the version file with a build this page is not running. */
const serveNewerVersion = (page: Page) =>
	page.route(VERSION_FILE, (route) =>
		route.fulfill({
			json: {
				version: 'a-build-from-the-future',
			},
		}),
	);

/** Come back to the tab. Playwright's page is already `visible`, so the event is
 *  the whole gesture. */
const refocus = (page: Page) =>
	page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));

/** The first refocus of a test, retried until the check it must trigger lands.
 *  `page.goto` resolves on `load`, but the layout's `onMount` — and so the listener —
 *  runs a hydration turn later, and `visibilitychange` is one-shot: an event
 *  dispatched before then is not replayed, and every assertion after it waits out
 *  its own timeout on a tab nothing ever checked. */
const refocusUntilChecked = (page: Page) =>
	expect(async () => {
		const checked = page.waitForResponse(VERSION_FILE, {
			timeout: 1000,
		});

		await refocus(page);
		await checked;
	}).toPass();

const updateToast = (page: Page) => page.getByText(UPDATE_MESSAGE);

const reloadAction = (page: Page) =>
	page.getByRole('button', {
		name: 'Reload',
		exact: true,
	});

test('returning to a stale tab offers the new version', async ({ page }) => {
	await page.goto('/');
	await serveNewerVersion(page);
	await refocusUntilChecked(page);

	await expect(updateToast(page)).toBeVisible();
	await expect(reloadAction(page)).toBeVisible();
});

test('the reload action loads the new build', async ({ page }) => {
	await page.goto('/');
	await serveNewerVersion(page);
	await refocusUntilChecked(page);
	await expect(reloadAction(page)).toBeVisible();

	// Nothing in the app survives a full load; a marker on `window` is how the
	// test tells one from a client-side navigation that merely dismissed the toast.
	await page.evaluate(() => {
		(window as Window & { staleBuildMarker?: boolean }).staleBuildMarker = true;
	});

	const reloaded = page.waitForEvent('load');

	await reloadAction(page).click();
	await reloaded;

	expect(await page.evaluate(() => 'staleBuildMarker' in window)).toBe(false);
});

test('refocusing on the current build says nothing', async ({ page }) => {
	await page.goto('/');

	// The real version file, answering with this build's own version. Waited on and
	// not merely absent: the request landing is what proves the check ran at all, so
	// the silence below is a verdict and not a race.
	await refocusUntilChecked(page);
	await page.waitForTimeout(TOAST_RENDER_MS);

	await expect(updateToast(page)).toHaveCount(0);
});

test('refocusing twice does not stack two toasts', async ({ page }) => {
	await page.goto('/');
	await serveNewerVersion(page);
	await refocusUntilChecked(page);
	await expect(updateToast(page)).toBeVisible();

	// `check()` re-reads the file every call, so this second refocus detects the same
	// new build again — the toast's fixed id is what keeps it to one. Awaited through
	// that second answer AND the render behind it: a plain count passes off the toast
	// the first refocus already put there, whether or not the id does anything.
	const checkedAgain = page.waitForResponse(VERSION_FILE);

	await refocus(page);
	await checkedAgain;
	await page.waitForTimeout(TOAST_RENDER_MS);

	await expect(updateToast(page)).toHaveCount(1);
});
