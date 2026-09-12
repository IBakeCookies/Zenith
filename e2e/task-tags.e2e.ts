import { expect, test, type Page } from '@playwright/test';
import {
	addTask,
	AUTOSAVE_MS,
	drainChips,
	isoDate,
	logDrain,
	openRenameEditor,
	openTaskForm,
	tagRows,
	taskRow,
} from './helpers';

/* Tags are typed on the task and read on /analytics, which is two stores and a join
   apart — nothing below the browser exercises the whole path. */

/** A stored day carrying one tagged task, and the 🪫 session logged against it. Both
 *  are written straight into IndexedDB, the way `drain-rating.e2e.ts` seeds its drain
 *  rows: faster than typing them onto a past day. */
async function writeTaggedDay(page: Page, date: string, tag: string, hours: number) {
	await page.evaluate(
		({ date, tag, hours }) =>
			new Promise<void>((resolve, reject) => {
				const request = indexedDB.open('zenith-db');
				request.onerror = () => reject(request.error);

				request.onsuccess = () => {
					const transaction = request.result.transaction(
						['sessions', 'drainObservations'],
						'readwrite',
					);

					transaction.objectStore('sessions').put({
						date,
						tasks: [
							{
								id: 1,
								title: 'Morning run',
								physicalDifficulty: 7,
								mentalDifficulty: 1,
								enjoyment: 6,
								createdAt: date,
								completed: true,
								tags: [tag],
							},
						],
						availableHours: 4,
						switchCost: 0.25,
						updatedAt: 1,
					});

					transaction.objectStore('drainObservations').add({
						date,
						taskId: 1,
						taskTitle: 'Morning run',
						hours,
						cognitiveDemand: 0.1,
						physicalDemand: 0.7,
						mindDrain: 3,
						bodyDrain: 7,
						createdAt: 100,
					});

					transaction.onerror = () => reject(transaction.error);
					transaction.oncomplete = () => resolve();
				};
			}),
		{
			date,
			tag,
			hours,
		},
	);
}

test('the breakdown follows the range the page is on', async ({ page }) => {
	// A day today so the ranged cards render on `week` at all, and the tagged log
	// outside it — the card must answer to the page's own range selector.
	await page.goto('/');
	await addTask(page, 'Deep work');
	await page.waitForTimeout(AUTOSAVE_MS);
	await writeTaggedDay(page, isoDate(-20), 'exercise', 2);

	await page.goto('/analytics');

	await expect(
		page.getByRole('heading', {
			name: 'Logged hours by tag',
		}),
	).toBeVisible();

	// The card's own empty line, not a bare count of nothing: it says the model report
	// landed, so the absent row is the range's answer and not a read still in flight.
	await expect(page.getByText('No hours logged in this range.')).toBeVisible({
		timeout: 15000,
	});

	await expect(
		tagRows(page).filter({
			hasText: 'exercise',
		}),
	).toHaveCount(0);

	await page
		.getByRole('button', {
			name: 'Last 30 days',
		})
		.click();

	await expect(
		tagRows(page).filter({
			hasText: 'exercise',
		}),
	).toHaveCount(1);
});

test('a tag reaches the card from the day it was typed on', async ({ page }) => {
	await page.goto('/');

	const title = await openTaskForm(page);
	await title.fill('Morning run');
	await page.getByLabel('Tags').fill('exercise');
	await page.getByLabel('Tags').press('Enter');

	await page
		.getByRole('button', {
			name: 'Deploy Task',
		})
		.click();

	await page.keyboard.press('Escape');
	await expect(page.getByRole('dialog')).toBeHidden();
	await page.waitForTimeout(AUTOSAVE_MS);

	await logDrain(page, 60, 4, 8);

	// The chip is published by the store's own re-read, so it says the write committed.
	await expect(drainChips(page)).toBeVisible();

	await page.goto('/analytics');

	const row = tagRows(page).filter({
		hasText: 'exercise',
	});

	await expect(row).toContainText('1');
});

/** An empty profile with the planner settled, so a `page.evaluate` seeding IndexedDB
 *  is not raced by the navigation that is still in flight. */
async function openEmptyPlanner(page: Page) {
	await page.goto('/');
	await expect(page.getByText('No tasks deployed yet')).toBeVisible();
	// The empty state paints before the service worker has finished registering, and
	// the reload that follows one destroys the seeding evaluate's execution context.
	await page.waitForLoadState('networkidle');
}

/** Both stored days in view: `week` is 7 days and the fixtures are further apart. */
async function showThirtyDays(page: Page) {
	await page
		.getByRole('button', {
			name: 'Last 30 days',
		})
		.click();
}

test('a mistyped tag is respelled on every day it appears', async ({ page }) => {
	await openEmptyPlanner(page);
	await writeTaggedDay(page, isoDate(-3), 'dep work', 2);
	await writeTaggedDay(page, isoDate(-10), 'dep work', 3);

	await page.goto('/analytics');
	await showThirtyDays(page);

	await expect(
		tagRows(page).filter({
			hasText: 'dep work',
		}),
	).toHaveCount(1);

	const field = await openRenameEditor(page, 'dep work');

	await field.fill('deep work');
	await field.press('Enter');

	const renamed = tagRows(page).filter({
		hasText: 'deep work',
	});

	await expect(renamed).toHaveCount(1);
	// Both days' logged hours, or the rename only reached the day in the week view.
	await expect(renamed).toContainText('5');
});

test('a rename onto a tag already in use says so before it runs', async ({ page }) => {
	await openEmptyPlanner(page);
	await writeTaggedDay(page, isoDate(-3), 'deep work', 2);
	await writeTaggedDay(page, isoDate(-10), 'dep work', 3);

	await page.goto('/analytics');
	await showThirtyDays(page);

	const field = await openRenameEditor(page, 'dep work');

	await field.fill('deep work');

	await expect(page.getByText('Saving merges these two tags into one.')).toBeVisible();
});

test('the merge folds the two rows into one', async ({ page }) => {
	await openEmptyPlanner(page);
	await writeTaggedDay(page, isoDate(-3), 'deep work', 2);
	await writeTaggedDay(page, isoDate(-10), 'dep work', 3);

	await page.goto('/analytics');
	await showThirtyDays(page);

	const field = await openRenameEditor(page, 'dep work');

	await field.fill('deep work');
	await field.press('Enter');

	await expect(
		tagRows(page).filter({
			hasText: 'dep work',
		}),
	).toHaveCount(0);

	await expect(
		tagRows(page).filter({
			hasText: 'deep work',
		}),
	).toContainText('5');
});

test('the planner’s tag suggestions offer the new spelling', async ({ page }) => {
	await openEmptyPlanner(page);
	await writeTaggedDay(page, isoDate(-3), 'dep work', 2);

	await page.goto('/analytics');

	const field = await openRenameEditor(page, 'dep work');

	await field.fill('deep work');
	await field.press('Enter');

	await expect(
		tagRows(page).filter({
			hasText: 'deep work',
		}),
	).toHaveCount(1);

	// Client-side back to the planner: the vocabulary the form offers is the one the
	// live store holds, which a reload would rebuild from storage instead.
	await page
		.getByRole('link', {
			name: 'Today',
		})
		.click();

	await openTaskForm(page);
	await page.getByLabel('Tags').focus();

	const offered = await page
		.locator('datalist option')
		.evaluateAll((options) => options.map((option) => (option as HTMLOptionElement).value));

	expect(offered).toContain('deep work');
	expect(offered).not.toContain('dep work');
});

test('the live day keeps the new spelling through the next autosave', async ({ page }) => {
	await openEmptyPlanner(page);
	await writeTaggedDay(page, isoDate(0), 'dep work', 2);

	// Reloaded so the store holds today's stored task in memory — the tasks the
	// autosave writes back over the rename if it never reached them.
	await page.goto('/');
	await expect(taskRow(page, 'Morning run')).toBeVisible();

	await page
		.getByRole('link', {
			name: 'Analytics',
		})
		.click();

	const field = await openRenameEditor(page, 'dep work');

	await field.fill('deep work');
	await field.press('Enter');

	await expect(
		tagRows(page).filter({
			hasText: 'deep work',
		}),
	).toHaveCount(1);

	await page
		.getByRole('link', {
			name: 'Today',
		})
		.click();

	await addTask(page, 'Unrelated');
	await page.waitForTimeout(AUTOSAVE_MS);

	await page
		.getByRole('link', {
			name: 'Analytics',
		})
		.click();

	const renamed = tagRows(page).filter({
		hasText: 'deep work',
	});

	await expect(renamed).toHaveCount(1);

	await expect(
		tagRows(page).filter({
			hasText: 'dep work',
		}),
	).toHaveCount(0);
});

test('a tag is dropped from every day it appears on', async ({ page }) => {
	await openEmptyPlanner(page);
	await writeTaggedDay(page, isoDate(-3), 'errand', 2);
	await writeTaggedDay(page, isoDate(-10), 'errand', 3);

	await page.goto('/analytics');
	await showThirtyDays(page);

	const row = tagRows(page).filter({
		hasText: 'errand',
	});

	await expect(row).toHaveCount(1);

	await row
		.getByRole('button', {
			name: 'Delete errand',
		})
		.click();

	await row
		.getByRole('button', {
			name: 'Delete errand everywhere',
		})
		.click();

	await expect(row).toHaveCount(0);

	// The hours are not gone with the tag: both days' logs now answer to nothing,
	// which is the untagged row's whole job.
	await expect(
		tagRows(page).filter({
			hasText: 'Untagged',
		}),
	).toContainText('5');
});
