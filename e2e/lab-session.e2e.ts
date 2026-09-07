import { expect, test } from '@playwright/test';
import { addTask, AUTOSAVE_MS, taskCard } from './helpers';

/* The session clock is one clock across both screens: the Lab is where a session is
   actually worked from, and the reading a stop leaves funds the 🪫 editor on whichever
   screen opens one first. Only an e2e sees the navigation, which is the whole point. */
test('the Lab’s Plan card offers the timer', async ({ page }) => {
	await page.goto('/energy');
	await addTask(page, 'Deep work');

	await expect(
		taskCard(page).getByRole('button', {
			name: 'Start timer',
		}),
	).toBeVisible();
});

test('a session started on / is still counting on the Lab', async ({ page }) => {
	await page.goto('/');
	await addTask(page, 'Deep work');
	await page.waitForTimeout(AUTOSAVE_MS);

	await page
		.getByRole('button', {
			name: 'Start timer',
		})
		.click();

	await page.goto('/energy');

	await expect(
		page.getByRole('button', {
			name: 'Pause timer',
		}),
	).toBeVisible();

	// Not merely "a control is there": a fresh clock would offer this one instead.
	await expect(
		page.getByRole('button', {
			name: 'Start timer',
		}),
	).toHaveCount(0);
});

test('a session started on the Lab is still counting on /', async ({ page }) => {
	await page.goto('/energy');
	await addTask(page, 'Deep work');
	await page.waitForTimeout(AUTOSAVE_MS);

	await page
		.getByRole('button', {
			name: 'Start timer',
		})
		.click();

	// The nav link, not a fresh load: a client-side navigation keeps the layout — and
	// so the store — mounted, which is the path a person actually takes between the
	// two screens, and the one no re-read of storage covers.
	await page
		.getByRole('link', {
			name: 'Today',
		})
		.click();

	await expect(
		page.getByRole('button', {
			name: 'Pause timer',
		}),
	).toBeVisible();
});
