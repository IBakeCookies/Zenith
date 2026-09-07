import { expect, test } from '@playwright/test';
import { addTask, closeTaskForm, openTaskForm, setSlider } from './helpers';

/* The Lab's form carries its own reading, and it is the OPTIMIZER's: a
   classic-allocator panel here would describe a day this screen does not show.
   One press, one solve — the reason it is a button and not a `$derived`. */
test('the Lab’s form prices a typed task into the optimized day', async ({ page }) => {
	await page.goto('/energy');
	await addTask(page, 'Deep work');

	await page.getByLabel('Day window').fill('8');
	await page.getByLabel('Day window').blur();

	const form = page.getByRole('dialog');
	const field = await openTaskForm(page);

	await field.fill('Boxing training');
	await setSlider(form.getByLabel('Physical Diff'), 9);

	// Nothing is priced until the press: the prompt line stands where the reading
	// will go, and it names the press rather than asking for a title the field
	// above it already holds.
	await expect(form.getByText(/Price this day to read/)).toBeVisible();

	await form
		.getByRole('button', {
			name: 'Price this day',
		})
		.click();

	// A StatTile is <p>label</p><p>value</p><p>note</p>, so the hours are the
	// label's next sibling — the only way to read one without a test id.
	await expect(
		form
			.getByText('Suggested hours', {
				exact: true,
			})
			.locator('xpath=following-sibling::p[1]'),
	).toHaveText(/\d/);

	await closeTaskForm(page);
});

// The page refuses to draw a plan without a window, and the panel agrees with it
// rather than printing zeroes off a plan the optimizer never made.
test('the Lab’s form says a windowless day cannot be priced', async ({ page }) => {
	await page.goto('/energy');
	await addTask(page, 'Deep work');

	await expect(page.getByLabel('Day window')).toHaveValue('0');

	const form = page.getByRole('dialog');

	await openTaskForm(page);

	await expect(form.getByText('Set a day window above 0 hours.')).toBeVisible();

	await expect(
		form.getByRole('button', {
			name: 'Price this day',
		}),
	).toHaveCount(0);

	await closeTaskForm(page);
});
