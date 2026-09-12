import { expect, test, type Page } from '@playwright/test';
import {
	AUTOSAVE_MS,
	expectTaskInputs,
	isoDate,
	taskCard,
	taskRow,
	timeBudgetBar,
} from './helpers';

/* One press sends every unfinished task to tomorrow, keeping its `createdAt` so the
   slide badge keeps counting — the whole reason this is a move and not an import
   (docs/features/the-carry-that-kept-the-count.md). */

type SeededTask = {
	id: number;
	title: string;
	physicalDifficulty: number;
	mentalDifficulty: number;
	enjoyment: number;
	createdAt: string;
	completed: boolean;
	mustDoToday?: boolean;
	importance?: 'low' | 'normal' | 'high';
	tags?: string[];
};

const seeded = (id: number, title: string, extra: Partial<SeededTask> = {}): SeededTask => ({
	id,
	title,
	physicalDifficulty: 3,
	mentalDifficulty: 6,
	enjoyment: 4,
	createdAt: isoDate(0),
	completed: false,
	...extra,
});

/** A day's record written straight into IndexedDB: importance, tags and a back-dated
 *  `createdAt` are slower to type than to seed. The app's own boot must have landed
 *  first — the Day Setup bar opens only once it has — or a bare `indexedDB.open` racing
 *  the app's first open creates a database with no `sessions` store, and the data layer
 *  reads the version it finds as a newer build's and reloads the page. */
async function seedDay(page: Page, date: string, tasks: SeededTask[]) {
	await page.goto('/');
	await expect(timeBudgetBar(page)).toHaveAttribute('open', '');

	await page.evaluate(
		({ date, tasks }) =>
			new Promise<void>((resolve, reject) => {
				const request = indexedDB.open('zenith-db');
				request.onerror = () => reject(request.error);

				request.onsuccess = () => {
					const transaction = request.result.transaction('sessions', 'readwrite');

					transaction.objectStore('sessions').put({
						date,
						tasks,
						availableHours: 6,
						switchCost: 0.25,
						updatedAt: 1,
					});

					transaction.onerror = () => reject(transaction.error);
					transaction.oncomplete = () => resolve();
				};
			}),
		{
			date,
			tasks,
		},
	);

	await page.goto(date === isoDate(0) ? '/' : `/?date=${date}`);
}

/** Tomorrow's stored tasks, read back out: the row prints no tag, so what travelled
 *  is checked on the record. */
async function readTasks(page: Page, date: string): Promise<SeededTask[]> {
	return page.evaluate(
		(date) =>
			new Promise((resolve, reject) => {
				const request = indexedDB.open('zenith-db');
				request.onerror = () => reject(request.error);

				request.onsuccess = () => {
					const read = request.result.transaction('sessions').objectStore('sessions').get(date);
					read.onerror = () => reject(read.error);
					read.onsuccess = () => resolve(read.result?.tasks ?? []);
				};
			}),
		date,
	);
}

const carryControl = (page: Page, count: number) =>
	taskCard(page).getByRole('button', {
		name: `Carry ${count} to tomorrow`,
	});

const anyCarryControl = (page: Page) =>
	page.getByRole('button', {
		name: /Carry \d+ to tomorrow/,
	});

test('one press sends the day’s unfinished work to tomorrow, whole', async ({ page }) => {
	await seedDay(page, isoDate(0), [
		seeded(1, 'Write the spec', {
			importance: 'high',
			tags: ['writing'],
		}),
		seeded(2, 'Boxing training', {
			physicalDifficulty: 8,
			mentalDifficulty: 2,
			enjoyment: 7,
		}),
		seeded(3, 'Inbox sweep', {
			completed: true,
		}),
	]);

	await carryControl(page, 2).click();

	await expect(taskRow(page, 'Write the spec')).toHaveCount(0);
	await expect(taskRow(page, 'Boxing training')).toHaveCount(0);
	await expect(taskRow(page, 'Inbox sweep')).toBeVisible();

	// The removal is a debounced autosave; let it land before navigating.
	await page.waitForTimeout(AUTOSAVE_MS);
	await page.goto(`/?date=${isoDate(1)}`);

	await expect(taskRow(page, 'Write the spec')).toBeVisible();
	await expect(taskRow(page, 'Write the spec').getByText('High importance')).toBeVisible();
	await expectTaskInputs(page, 'Boxing training', [8, 2, 7]);

	const tomorrow = await readTasks(page, isoDate(1));

	expect(tomorrow.map((t) => t.title)).toEqual(['Write the spec', 'Boxing training']);

	expect(tomorrow[0]).toMatchObject({
		importance: 'high',
		tags: ['writing'],
		completed: false,
	});
});

test('a must-do-today task stays, and the count never promised it', async ({ page }) => {
	await seedDay(page, isoDate(0), [
		seeded(1, 'Tax return', {
			mustDoToday: true,
		}),
		seeded(2, 'Boxing training'),
	]);

	await carryControl(page, 1).click();

	await expect(taskRow(page, 'Boxing training')).toHaveCount(0);
	await expect(taskRow(page, 'Tax return')).toBeVisible();
});

test('the day count keeps running across a carry', async ({ page }) => {
	await seedDay(page, isoDate(0), [
		seeded(1, 'Fix the shed', {
			createdAt: isoDate(-4),
		}),
	]);

	await expect(taskRow(page, 'Fix the shed').getByText('day 5')).toBeVisible();

	await carryControl(page, 1).click();
	await expect(taskRow(page, 'Fix the shed')).toHaveCount(0);
	await page.waitForTimeout(AUTOSAVE_MS);
	await page.goto(`/?date=${isoDate(1)}`);

	await expect(taskRow(page, 'Fix the shed').getByText('day 6')).toBeVisible();
});

test('a finished day sends nothing on', async ({ page }) => {
	const lastWeek = isoDate(-7);

	await seedDay(page, lastWeek, [seeded(1, 'Fix the shed'), seeded(2, 'Inbox sweep')]);

	await expect(page.getByText('Viewing a past day:')).toBeVisible();
	await expect(taskRow(page, 'Fix the shed')).toBeVisible();
	await expect(anyCarryControl(page)).toHaveCount(0);
});

test('the example day sends nothing on', async ({ page }) => {
	await page.goto('/?demo');

	await expect(taskCard(page).getByRole('listitem').first()).toBeVisible();
	await expect(anyCarryControl(page)).toHaveCount(0);
});
