import { expect, test, type Page } from '@playwright/test';
import { AUTOSAVE_MS, seedDay } from './helpers';

/* The analytics screen reads a year of stored days through AnalyticsStore, whose
   whole job happens after hydration: load, slice by range, fold. None of it runs
   during SSR, so only a real browser proves it. */

/** The "Active days" fold row — its denominator is the viewed range's length. */
function activeDaysTile(page: Page) {
	return page
		.locator('div', {
			hasText: /^Active days/,
		})
		.last();
}

test('empty profile shows the empty state, not a stuck spinner', async ({ page }) => {
	await page.goto('/analytics');
	await expect(page.getByText('Nothing to analyze in this range yet.')).toBeVisible();
	await expect(page.getByText('Loading…')).not.toBeVisible();

	// The logs card is outside that empty state, because "nothing to analyze" is about day
	// SUMMARIES and the logs come from two other stores. It is also the only place a ☕ can
	// be corrected or dropped from at all — a user whose day summaries failed to load
	// still has to be able to reach their measurements.
	await expect(
		page.getByRole('heading', {
			name: 'Your logs',
		}),
	).toBeVisible();

	await expect(page.getByText('No measurements logged in this range.')).toBeVisible();
});

test('stats and chart come off the stored days', async ({ page }) => {
	await seedDay(page, 0, ['write the calibration section', 'inbox sweep']);

	// Named: the task form's "must do today" checkbox sits above the list, so the
	// first checkbox on the page is no longer a task's completion box.
	await page
		.getByRole('checkbox', {
			name: /^Mark /,
		})
		.first()
		.check();

	await page.waitForTimeout(AUTOSAVE_MS);

	await page.goto('/analytics');

	for (const tile of ['Tasks completed', 'Avg completion rate', 'Current streak', 'Logged hours'])
		await expect(
			page.getByText(tile, {
				exact: true,
			}),
		).toBeVisible();

	// The other five are one click away, not gone.
	const folded = ['Active days', 'Longest streak', 'Planned hours', 'Rest hours', 'Best day'];

	for (const tile of folded)
		await expect(
			page.getByText(tile, {
				exact: true,
			}),
		).not.toBeVisible();

	await page.getByText('5 more metrics').click();

	for (const tile of folded)
		await expect(
			page.getByText(tile, {
				exact: true,
			}),
		).toBeVisible();

	// One of two tasks done, priority-weighted — a real percentage reaches the copy
	await expect(page.getByText(/\d+% of planned tasks/)).toBeVisible();

	// The chart drew the seeded day
	await expect(
		page.getByRole('heading', {
			name: 'Completion & yield',
		}),
	).toBeVisible();

	// One recorded day is a run of one on both series, so each draws a dot rather
	// than a path — the reading a polyline-only chart would drop.
	await expect(page.locator('svg path.stroke-brand, svg circle.fill-brand')).not.toHaveCount(0);

	await expect(
		page.getByRole('heading', {
			name: 'Day profiles',
		}),
	).toBeVisible();
});

/** A day with one of two tasks done, viewed on /analytics. */
async function seedCompletedDay(page: Page) {
	await seedDay(page, 0, ['write the calibration section', 'inbox sweep']);

	await page
		.getByRole('checkbox', {
			name: /^Mark /,
		})
		.first()
		.check();

	await page.waitForTimeout(AUTOSAVE_MS);

	await page.goto('/analytics');
}

test('one card holds both readings', async ({ page }) => {
	await seedCompletedDay(page);

	await expect(
		page.getByRole('heading', {
			name: 'Completion & yield',
		}),
	).toBeVisible();

	// The second card is gone, not renamed around a chart that still draws twice.
	await expect(
		page.getByRole('heading', {
			name: 'Yield and completion',
		}),
	).toHaveCount(0);

	// Its own accessible name: an <svg role="img"> has no other one.
	await expect(
		page.getByRole('img', {
			name: 'Line chart of completion rate and yield index over the last 7 days',
		}),
	).toHaveCount(1);
});

test('the merged card names both series', async ({ page }) => {
	await seedCompletedDay(page);

	// Exact: the card's heading is "Completion & yield", not either label.
	await expect(
		page.getByText('Yield Index', {
			exact: true,
		}),
	).toBeVisible();

	await expect(
		page.getByText('Completion Rate', {
			exact: true,
		}),
	).toBeVisible();
});

test('the year view keeps both series on weekly slots', async ({ page }) => {
	await seedCompletedDay(page);

	await page
		.getByRole('button', {
			name: 'Last 12 months',
		})
		.click();

	await expect(page.getByText(/Weekly average of the priority-weighted/)).toBeVisible();

	// Drawn, not merely legended. One recorded week has no neighbour to draw a
	// line to, so the run of one is a dot — the same reading the trend chart plots.
	await expect(
		page.locator('svg path.stroke-brand-counter, svg circle.fill-brand-counter'),
	).not.toHaveCount(0);
});

test('the range toggle reslices the stats', async ({ page }) => {
	await seedDay(page, 0, ['write the calibration section']);
	await page.goto('/analytics');

	const activeDays = activeDaysTile(page);
	await expect(activeDays).toContainText('/ 7');

	await page
		.getByRole('button', {
			name: 'Last 30 days',
		})
		.click();

	await expect(activeDays).toContainText('/ 30');

	await page
		.getByRole('button', {
			name: 'Last 12 months',
		})
		.click();

	await expect(activeDays).toContainText('/ 365');

	// The year view switches the chart from days to weekly averages
	await expect(page.getByText(/Weekly average of the priority-weighted/)).toBeVisible();

	await page
		.getByRole('button', {
			name: 'Last 7 days',
		})
		.click();

	await expect(activeDays).toContainText('/ 7');

	await expect(page.getByText(/Priority-weighted completion rate per day/)).toBeVisible();
});

test('a planned future day is not counted as an active day', async ({ page }) => {
	await seedDay(page, 0, ['today task']);
	await seedDay(page, 4, ['future task']);

	await page.goto('/analytics');
	// Every range looks backward from today, so only today counts
	await expect(activeDaysTile(page)).toContainText('1 /');
});

test('the calendar reads the same day summaries', async ({ page }) => {
	await seedDay(page, 0, ['write the calibration section']);
	await page.goto('/calendar');

	await expect(
		page.getByRole('heading', {
			name: 'Calendar',
		}),
	).toBeVisible();

	await expect(page.getByText('write the calibration section')).toBeVisible();
});

/* Both fit cards read two client-side stores, so the server cannot know what was logged
   — and must not guess. Guessing zero tells a user with a year of ratings that they have
   never rated anything, which is what every other placeholder on this page exists to
   avoid ("A placeholder, never a claim"). They are absent until the read lands, like the
   drain ranking above them, rather than empty. */
test.describe('server-rendered, before the logs are read', () => {
	test.use({
		javaScriptEnabled: false,
	});

	test('neither fit card claims an empty fit', async ({ page }) => {
		await page.goto('/analytics');

		await expect(page.getByText(/No ratings yet/)).toHaveCount(0);
		await expect(page.getByText(/Model uses default constants/)).toHaveCount(0);

		// …and the card that DOES render before the read says it is waiting.
		await expect(page.getByText('Loading…').first()).toBeVisible();
	});
});
