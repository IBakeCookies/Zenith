import { expect, test } from '@playwright/test';
import { addTask, AUTOSAVE_MS, setBudget, taskCard, taskRow } from './helpers';

// The session store's date reader belongs to the (app) layout and is route-blind,
// so `?date=` reached the Lab too — loading another day's tasks with live sliders
// under copy that promises today's session, while 🪫 logs still stamp today.
test('a dated URL collapses to the canonical Lab', async ({ page }) => {
	await page.goto('/');
	await addTask(page, 'Deep work');
	await setBudget(page, 8);
	await page.waitForTimeout(AUTOSAVE_MS);

	await page.goto('/energy?date=2026-01-15');

	await expect(page).toHaveURL(/\/energy$/);
	// Today's task is what the Lab plans — the dated day has none at all.
	await expect(page.getByText('Deep work').first()).toBeVisible();
});

/* The Lab's page order: the plan is the screen's answer, so it reads first and full
   width. The ledger's adjacency to the parameters is not paid for by that — both sit
   in the wide column under it, the list directly above the rows that move it. */
test('the plan reads above the ledger', async ({ page }) => {
	await page.goto('/');

	for (const title of ['Deep work', 'Emails', 'Errand', 'Reading']) await addTask(page, title);

	await setBudget(page, 8);
	await page.waitForTimeout(AUTOSAVE_MS);

	await page.goto('/energy');

	const chart = page.getByRole('img', {
		name: 'Energy levels and output rate over the day',
	});

	await expect(chart).toBeVisible();

	const row = await taskRow(page, 'Deep work').boundingBox();
	const plot = await chart.boundingBox();

	expect(plot!.y).toBeLessThan(row!.y);
});

/* One grid under the plan, not two: the ledger and the parameters share the wide
   column so the row being edited and the parameter that moves it are one scroll
   apart, and the four read-outs stack beside them rather than under. */
test('the ledger and the parameters read beside the calibration boxes', async ({ page }) => {
	await page.goto('/');
	await addTask(page, 'Deep work');
	await setBudget(page, 8);
	await page.waitForTimeout(AUTOSAVE_MS);

	await page.goto('/energy');

	const params = page.locator('.card-shell').filter({
		has: page.getByRole('heading', {
			name: 'Model Parameters',
		}),
	});

	const recovery = page.locator('.card-shell').filter({
		has: page.getByRole('heading', {
			name: 'Recovery Calibration',
		}),
	});

	const listBox = (await taskCard(page).boundingBox())!;
	const paramsBox = (await params.boundingBox())!;
	const recoveryBox = (await recovery.boundingBox())!;

	// The wide column: one left edge and one width for both of its cards.
	expect(paramsBox.x).toBeCloseTo(listBox.x, 0);
	expect(paramsBox.width).toBeCloseTo(listBox.width, 0);

	// The narrow column starts where the wide one ends, and the parameters are
	// directly under the list rather than beside it.
	expect(recoveryBox.x).toBeGreaterThan(paramsBox.x + paramsBox.width - 1);
	expect(paramsBox.y).toBeGreaterThan(listBox.y + listBox.height - 1);
});

// One control in one place: the card is on screen before the first click, so the
// sweep is asked for from the card's own header and the parameters card holds no
// second button for it (presentation/AGENTS.md).
test('the Lab opens with the curve card already on screen', async ({ page }) => {
	await page.goto('/');
	await addTask(page, 'Deep work');
	await setBudget(page, 8);
	await page.waitForTimeout(AUTOSAVE_MS);

	await page.goto('/energy');

	const curve = page.locator('.card-shell').filter({
		has: page.getByRole('heading', {
			name: 'How long should today be?',
		}),
	});

	const recovery = page.locator('.card-shell').filter({
		has: page.getByRole('heading', {
			name: 'Recovery Calibration',
		}),
	});

	await expect(page.getByText('No window has been priced for this day yet.')).toBeVisible();

	const curveBox = (await curve.boundingBox())!;
	const recoveryBox = (await recovery.boundingBox())!;

	expect(curveBox.y).toBeGreaterThan(recoveryBox.y + recoveryBox.height);

	const params = page.locator('.card-shell').filter({
		has: page.getByRole('heading', {
			name: 'Model Parameters',
		}),
	});

	await expect(
		params.getByRole('button', {
			name: 'Check the window',
		}),
	).toHaveCount(0);

	// One control, and one only: the defect being fixed was two buttons for one sweep.
	await expect(
		page.getByRole('button', {
			name: 'Check the window',
		}),
	).toHaveCount(1);

	await curve
		.getByRole('button', {
			name: 'Check the window',
		})
		.click();

	await expect(page.getByText('No window has been priced for this day yet.')).toBeHidden();
	await expect(curve.getByRole('img')).toBeVisible();
});

// The card offers a sweep, so it sits behind the same gate as everything else that
// describes a plan: a day with nothing to sweep stops at the task form.
test('an empty day stops before the curve card', async ({ page }) => {
	await page.goto('/energy');

	await expect(page.getByText('No tasks deployed yet')).toBeVisible();

	await expect(
		page.getByRole('heading', {
			name: 'How long should today be?',
		}),
	).toHaveCount(0);
});

/* The nav's active link already draws the page's name, so the `<h1>` is the
   document's and not the design's — it stays for the outline and takes no height. */
test('the Lab draws no page title', async ({ page }) => {
	await page.goto('/');
	await addTask(page, 'Deep work');
	await page.waitForTimeout(AUTOSAVE_MS);

	await page.goto('/energy');

	const heading = page.getByRole('heading', {
		name: 'Energy Lab',
		exact: true,
	});

	await expect(heading).toBeAttached();

	const box = await heading.boundingBox();

	expect(box!.height).toBeLessThanOrEqual(1);
});

/* The route's only prose. In the heading tooltip it reached no crawler at all —
   bits-ui mounts `Tooltip.Content` on open — under a meta description that promises
   a day-value scheduler. Only the server response can catch that (`e2e/nav.e2e.ts`
   makes the same argument for the nav). */
test('the Lab’s explanation is server-rendered', async ({ request }) => {
	const html = await (await request.get('/energy')).text();

	expect(html).toContain('A different engine than the main page');
});

test('the Lab’s explanation reads with nothing hovered', async ({ page }) => {
	await page.goto('/energy');

	const intro = page.getByText(/A different engine than the main page/);

	await intro.scrollIntoViewIfNeeded();
	await expect(intro).toBeVisible();
});
