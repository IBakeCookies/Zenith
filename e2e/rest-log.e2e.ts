import { expect, test } from '@playwright/test';
import { addTask, AUTOSAVE_MS, logRest, taskCard } from './helpers';

/* ☕ is a log of the day, like ⏱ and 🪫 — so it is typed where they are, on the
   ledger's heading row beside Load and Save, and the recovery card is left a
   read-out like the other two. */
test('a rest is logged from the ledger, not from the calibration card', async ({ page }) => {
	await page.goto('/');
	await addTask(page, 'Deep work');
	await page.waitForTimeout(AUTOSAVE_MS);
	await page.goto('/energy');

	await expect(
		taskCard(page).getByRole('button', {
			name: 'Log a rest',
		}),
	).toBeVisible();

	const recovery = page.locator('.card-shell').filter({
		has: page.getByRole('heading', {
			name: 'Recovery Calibration',
		}),
	});

	await expect(
		recovery.getByRole('button', {
			name: 'Log a rest',
		}),
	).toHaveCount(0);

	await logRest(page, 30, 9, 8, 3, 2);

	// r reads pairs dated before today, so what the read-out card can say about a
	// pair logged now is that it holds it.
	await expect(recovery.getByText('Rest pairs · 1')).toBeVisible();
});

/* The day you are most likely to have rested is the day you booked nothing, and the
   card the editor used to live on is inside the page's `hasTasks` gate. */
test('a rest can be logged on a day with no tasks', async ({ page }) => {
	await page.goto('/energy');

	await logRest(page, 30, 9, 8, 3, 2);

	// An empty Lab shows no calibration cards at all, so the task that brings them
	// back is the proof the pair was stored without one.
	await addTask(page, 'Deep work');

	await expect(page.getByText('Rest pairs · 1')).toBeVisible();
});

// The ☕ editor is only ever opened by its own button, so it always takes the caret
test('the rest editor focuses when opened', async ({ page }) => {
	await page.goto('/');
	await addTask(page, 'Deep work');
	await page.waitForTimeout(AUTOSAVE_MS);
	await page.goto('/energy');

	await page
		.getByRole('button', {
			name: 'Log a rest',
		})
		.click();

	const form = page.locator('form').filter({
		hasText: 'rested',
	});

	await expect(form.locator('input[type="number"]').first()).toBeFocused();
});

// The pair is read as a difference, so a missing half is not a zero half — but a
// real 0 is a legitimate rating, which is what separates emptiness from falsiness.
test('the rest editor refuses a half-filled pair but accepts a rating of 0', async ({ page }) => {
	await page.goto('/');
	await addTask(page, 'Deep work');
	await page.waitForTimeout(AUTOSAVE_MS);
	await page.goto('/energy');

	await page
		.getByRole('button', {
			name: 'Log a rest',
		})
		.click();

	const form = page.locator('form').filter({
		hasText: 'rested',
	});

	const fields = form.locator('input[type="number"]');

	const save = form.getByRole('button', {
		name: 'Save',
	});

	// Everything but Body after. Drain falls across the break, as a rest pair must
	// for MATH.md §8.9 to fit an r ≥ 0 from it.
	for (const [index, value] of [30, 8, 7, 3].entries()) {
		await fields.nth(index).fill(String(value));
	}

	await save.click();

	await expect(form).toBeVisible();
	await expect(page.getByText('Rest pairs · 1')).toHaveCount(0);

	await fields.nth(4).fill('0');
	await save.click();

	await expect(page.getByText('Rest pairs · 1')).toBeVisible();
});

/* A break is the one measurement with no row anywhere: it belongs to no task, so
   neither screen's task list can carry its editor, and until 2026-08-10 it could only be
   deleted and re-logged. The analytics ✎ is its only correction, which this crosses two
   screens to prove: the fit the Lab applies has to move with what the list rewrote.

   ☕ is also where a correction re-deriving anything would be least visible — it has no
   covariates to re-derive — so the ⚡/🪫 cases are covered where their covariates are
   (the store specs). */
test('a break is correctable from the analytics history, and the fit follows', async ({ page }) => {
	await page.clock.install();
	await page.goto('/');
	await addTask(page, 'Deep work');
	await page.clock.runFor(AUTOSAVE_MS);
	await page.goto('/energy');

	// A long break off a nearly-full drain recovers slowly; the correction below makes it
	// a short break off the same drain, which is a much faster recovery rate. Carried
	// past midnight, because r only reads pairs dated before today.
	await logRest(page, 120, 9, 8, 8, 7);
	await expect(page.getByText('Rest pairs · 1')).toBeVisible();

	await page.clock.fastForward('25:00:00');
	await page.goto('/energy');
	await addTask(page, 'Deep work');
	await page.clock.runFor(AUTOSAVE_MS);

	const recoveryRate = page.getByLabel('Recovery rate');

	await page
		.getByRole('button', {
			name: 'Apply my fits',
		})
		.click();

	const slowFit = await recoveryRate.inputValue();

	await page.goto('/analytics');

	await page
		.getByRole('button', {
			name: /^Correct Break logged on/,
		})
		.click();

	const form = page.locator('form').filter({
		hasText: 'rested',
	});

	// Seeded from the record: the same five numbers the row prints, so a correction only
	// has to change the one that was wrong.
	await expect(form.locator('input[type="number"]').first()).toHaveValue('120');

	await form.locator('input[type="number"]').first().fill('15');

	await form
		.getByRole('button', {
			name: 'Save',
		})
		.click();

	// The corrected reading, which is also what says the write landed — asserting the
	// count alone would pass on a save that never happened, and navigating into the
	// store's re-read aborts it.
	await expect(
		page.getByRole('listitem').filter({
			hasText: '15m',
		}),
	).toBeVisible();

	// Still ONE row: corrected in place, not appended. A second would fit r off the same
	// recovery twice.
	await expect(page.getByText('1 measurement')).toBeVisible();

	await page.goto('/energy');
	await expect(page.getByText('Rest pairs · 1')).toBeVisible();

	await page
		.getByRole('button', {
			name: 'Apply my fits',
		})
		.click();

	await expect(recoveryRate).not.toHaveValue(slowFit);
});
