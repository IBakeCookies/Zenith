import { expect, test } from '@playwright/test';
import { addTask, AUTOSAVE_MS, logDrain, setBudget } from './helpers';

/* The live stop advisor (MATH.md §8.11) is the one surface where today's 🪫
   logs meet the params mid-day, so this pins the page wiring end to end: a
   fresh day with hours to spare prices a session of the task by name, and
   logging hours that fill the window flips the verdict. */
test('the stop advisor prices the fresh day and flips when logged hours fill the window', async ({
	page,
}) => {
	await page.goto('/');
	await addTask(page, 'Deep work');
	await setBudget(page, 8);
	await page.waitForTimeout(AUTOSAVE_MS);

	await page.goto('/energy');

	// Fresh morning at the default free-time value: continuing wins, and the
	// recommendation names the task it priced.
	await expect(page.getByText('Worth continuing')).toBeVisible();
	// "next session", not just a duration: the budget curve beside this card prices
	// the whole WINDOW, so a bare "2h 15m of Deep work" reads as a rival day total.
	await expect(page.getByText(/Your next session — .*of Deep work/)).toBeVisible();

	// 7h45m logged: no whole 45-min block fits an 8-hour window any more.
	await logDrain(page, 465, 5, 5);
	await expect(page.getByText(/No whole work session fits/)).toBeVisible();
	await expect(page.getByText('Worth continuing')).not.toBeVisible();
});

// The budget curve costs a solve per step, so it is a click and not a `$derived`
// (MATH.md §8.12). What e2e can see that the store spec cannot: the button really
// reaches the sweep, and the recommendation it prints writes the SHARED budget.
// This fixture is ONE task, which satiates and so does cross — the multi-task
// "no crossing" branch and the "no window is worth working" branch are covered by
// budget-curve-card.stories.svelte, which can hand the card a curve directly.
test('the budget curve stays unasked until clicked, then prices the day’s length', async ({
	page,
}) => {
	await page.goto('/');
	await addTask(page, 'Deep work');
	await setBudget(page, 8);
	await page.waitForTimeout(AUTOSAVE_MS);

	await page.goto('/energy');

	const check = page.getByRole('button', {
		name: 'Check the window',
	});

	// The card is on screen from the first paint; what waits is the reading.
	await expect(check).toBeVisible();
	await expect(page.getByText(/re-solved by the same optimizer/)).toBeVisible();

	await check.click();

	// ONE task satiates, so this day's curve really does reach break-even — zero,
	// NOT the λ₀ line, which `valuePerHour` already has charged out of it
	// (MATH.md §8.12). Unlike the 2–6 task days of §8.12's probe, which mostly run
	// to the cap.
	// The recommendation names the window AND what that window books, because a
	// window is not advice on its own.
	await expect(page.getByText(/another hour of your day adds nothing/)).toBeVisible();

	// The chart is too wide for the parameters card, so its card lands full width
	// under everything.
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

	const curveBox = (await curve.boundingBox())!;
	const recoveryBox = (await recovery.boundingBox())!;

	expect(curveBox.y).toBeGreaterThan(recoveryBox.y + recoveryBox.height);

	// The seam worth an e2e: the recommendation writes the SHARED budget, the same
	// value the main page's Available Hours holds (settled 2026-07-29).
	await page
		.getByRole('button', {
			name: /Set the day window/,
		})
		.click();

	const window = page.locator('#window-hours');
	await expect(window).not.toHaveValue('8');

	const applied = await window.inputValue();
	await page.waitForTimeout(AUTOSAVE_MS);

	await page.goto('/');
	await expect(page.getByText(new RegExp(`${applied}h budget`))).toBeVisible();
});
