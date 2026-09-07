import { expect, test, type Page } from '@playwright/test';
import { addTask, AUTOSAVE_MS, copyFlowLogToDate, isoDate, logDrain, logFlow } from './helpers';

/* The ✕ has no confirmation step, so the toast is the whole of the safety net — and a
   measurement is not a task: putting it back means the same record under the same id and
   stamp, written into IndexedDB by a second write (`$restoreDrainObservation`). The
   reload is what makes this worth an e2e: a restore that only patched the store's array
   would look identical until the next visit, and the fits would have refit off the
   dropped record in the meantime. */
test('undo brings a dropped measurement back, past a reload', async ({ page }) => {
	await page.goto('/');
	await addTask(page, 'Deep work');
	await page.waitForTimeout(AUTOSAVE_MS);

	await logDrain(page, 120, 9, 5);

	// The row's chip is drawn from the store's re-read, which lands only once the write
	// committed — so it is what says the rating is in IndexedDB. A `goto` fired before
	// it aborts that transaction, and the measurement never reaches the list.
	await expect(
		page.getByRole('button', {
			name: 'Correct this drain rating',
		}),
	).toBeVisible();

	await page.goto('/analytics');

	const row = page.getByRole('button', {
		name: /^Correct Session rating logged on/,
	});

	await expect(row).toBeVisible();

	await page
		.getByRole('button', {
			name: /^Delete Session rating logged on/,
		})
		.click();

	await expect(page.getByText('No measurements logged in this range.')).toBeVisible();

	await page
		.getByRole('button', {
			name: 'Undo',
		})
		.click();

	await expect(row).toBeVisible();

	await page.reload();

	await expect(row).toBeVisible();
});

/* The all-time resets on the log card. Three kinds, three rows, each deleting every
   record of its kind — the same store calls the root page's and the Lab's buttons make,
   pressed from the screen that prints the ratings. Only a browser proves it: the counts
   come from two stores that answer after hydration, and the delete is IndexedDB's. */

/** One ⚡ dated today and one dated 90 days ago — outside every range but `year`, and
 *  outside `week`, which is what the page opens on. */
async function seedTwoFlowLogs(page: Page) {
	await page.goto('/');
	await addTask(page, 'Deep work');
	await page.waitForTimeout(AUTOSAVE_MS);
	await logFlow(page, 90);

	await expect(page.getByText('⚡ 90m').first()).toBeVisible();

	await copyFlowLogToDate(page, isoDate(-90));
	await page.goto('/analytics');
}

const flowRow = (page: Page) =>
	page.getByRole('button', {
		name: /^Delete Time to flow logged on/,
	});

const drainRow = (page: Page) =>
	page.getByRole('button', {
		name: /^Delete Session rating logged on/,
	});

test('the log card resets one kind and leaves the others', async ({ page }) => {
	await page.goto('/');
	await addTask(page, 'Deep work');
	await page.waitForTimeout(AUTOSAVE_MS);
	await logFlow(page, 90);

	await expect(page.getByText('⚡ 90m').first()).toBeVisible();

	await logDrain(page, 120, 9, 5);

	await expect(
		page.getByRole('button', {
			name: 'Correct this drain rating',
		}),
	).toBeVisible();

	await page.goto('/analytics');
	await expect(flowRow(page)).toBeVisible();
	await expect(drainRow(page)).toBeVisible();

	await page
		.getByRole('button', {
			name: 'Delete all logs',
		})
		.click();

	await page
		.getByRole('button', {
			name: 'Reset',
			exact: true,
		})
		.click();

	await expect(flowRow(page)).toHaveCount(0);

	// The 🪫 is a different store and a different button; wiping ⚡ must not reach it.
	await expect(drainRow(page)).toBeVisible();
});

test('a refused confirm leaves the ratings alone', async ({ page }) => {
	await page.goto('/');
	await addTask(page, 'Deep work');
	await page.waitForTimeout(AUTOSAVE_MS);
	await logDrain(page, 120, 9, 5);

	await expect(
		page.getByRole('button', {
			name: 'Correct this drain rating',
		}),
	).toBeVisible();

	await page.goto('/analytics');
	await expect(drainRow(page)).toBeVisible();

	await page
		.getByRole('button', {
			name: 'Delete all ratings',
		})
		.click();

	await page
		.getByRole('button', {
			name: 'Cancel',
		})
		.click();

	await expect(drainRow(page)).toBeVisible();
});

test('the ⚡ row counts every log, not the viewed range', async ({ page }) => {
	await seedTwoFlowLogs(page);

	// The list is on `week`, so it prints one of the two…
	await expect(flowRow(page)).toHaveCount(1);

	// …and the row still names what the button would delete.
	await expect(page.getByText('Time to flow · 2 logs')).toBeVisible();
});

test('the ⚡ reset ignores the viewed range', async ({ page }) => {
	await seedTwoFlowLogs(page);

	await expect(flowRow(page)).toHaveCount(1);

	await page
		.getByRole('button', {
			name: 'Delete all logs',
		})
		.click();

	await page
		.getByRole('button', {
			name: 'Reset',
			exact: true,
		})
		.click();

	await page
		.getByRole('button', {
			name: 'Show all time',
		})
		.click();

	await expect(page.getByText('No measurements logged yet.')).toBeVisible();
	await expect(flowRow(page)).toHaveCount(0);
});

test('a wipe closes an open correction', async ({ page }) => {
	await page.goto('/');
	await addTask(page, 'Deep work');
	await page.waitForTimeout(AUTOSAVE_MS);
	await logDrain(page, 120, 9, 5);

	await expect(
		page.getByRole('button', {
			name: 'Correct this drain rating',
		}),
	).toBeVisible();

	await page.goto('/analytics');

	await page
		.getByRole('button', {
			name: /^Correct Session rating logged on/,
		})
		.click();

	const save = page.getByRole('button', {
		name: 'Save',
	});

	await expect(save).toBeVisible();

	await page
		.getByRole('button', {
			name: 'Delete all ratings',
		})
		.click();

	await page
		.getByRole('button', {
			name: 'Reset',
			exact: true,
		})
		.click();

	await expect(save).toHaveCount(0);
});

test('a fresh profile offers nothing to reset', async ({ page }) => {
	await page.goto('/analytics');

	// The loaded branch, not the pending one: three rows are absent while the card is
	// still saying "Loading…" too, and that would pass for the wrong reason.
	await expect(page.getByText('No measurements logged in this range.')).toBeVisible();

	for (const name of ['Delete all logs', 'Delete all ratings', 'Delete all pairs'])
		await expect(
			page.getByRole('button', {
				name,
			}),
		).toHaveCount(0);
});
