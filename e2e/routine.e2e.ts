import { expect, test, type Page } from '@playwright/test';
import {
	AUTOSAVE_MS,
	addTask,
	closeTaskForm,
	drainChips,
	isoDate,
	logDrain,
	openRenameEditor,
	openTaskForm,
	saveRoutine,
	tagRows,
	taskCard,
	taskRow,
} from './helpers';

/* Routines and day-imports are what the day's two menus exist for, and both cross
   a day boundary: what is saved on one date has to reappear on another, read back
   out of IndexedDB by a store that mounted on a different URL. */

const ROUTINE_NAME = 'Morning block';

test('the day’s Load and Save read on the Plan card', async ({ page }) => {
	await page.goto('/');
	await addTask(page, 'Deep work');

	const card = taskCard(page);

	await expect(
		card.getByRole('button', {
			name: 'Load',
			exact: true,
		}),
	).toBeVisible();

	await expect(
		card.getByRole('button', {
			name: 'Save',
			exact: true,
		}),
	).toBeVisible();

	// One of each on the page: the card is where they read now, not a second copy of
	// the pair the page header used to carry.
	await expect(
		page.getByRole('button', {
			name: 'Load',
			exact: true,
		}),
	).toHaveCount(1);
});

test('a routine saved today loads onto another day', async ({ page }) => {
	await page.goto('/');
	await addTask(page, 'Boxing training');
	await addTask(page, 'Write report');
	await page.waitForTimeout(AUTOSAVE_MS);

	await saveRoutine(page, ROUTINE_NAME);

	await page.goto(`/?date=${isoDate(2)}`);
	await expect(page.getByText('No tasks deployed yet')).toBeVisible();

	await page
		.getByRole('button', {
			name: 'Load',
			exact: true,
		})
		.click();

	await expect(page.getByText('Saved Routines')).toBeVisible();

	await page
		.getByRole('menuitem', {
			name: `${ROUTINE_NAME} (2)`,
		})
		.click();

	await expect(page.getByText('Boxing training').first()).toBeVisible();
	await expect(page.getByText('Write report').first()).toBeVisible();
});

test('a routine is deletable and stops being offered', async ({ page }) => {
	await page.goto('/');
	await addTask(page, 'Boxing training');
	await saveRoutine(page, ROUTINE_NAME);

	await page
		.getByRole('button', {
			name: 'Load',
			exact: true,
		})
		.click();

	// Two presses: the first only arms the delete, since it cannot be undone.
	await page
		.getByRole('menuitem', {
			name: `Delete routine ${ROUTINE_NAME}`,
		})
		.click();

	await page
		.getByRole('menuitem', {
			name: `Delete ${ROUTINE_NAME}?`,
		})
		.click();

	await expect(page.getByText('Saved Routines')).not.toBeVisible();

	// The delete is persisted, not just dropped from the in-memory list.
	await page.reload();

	await page
		.getByRole('button', {
			name: 'Load',
			exact: true,
		})
		.click();

	await expect(page.getByText('Saved Routines')).not.toBeVisible();
});

test('loading from a day copies that day’s tasks into the viewed day', async ({ page }) => {
	await page.goto('/');
	await addTask(page, 'Boxing training');
	await page.waitForTimeout(AUTOSAVE_MS);

	await page.goto(`/?date=${isoDate(2)}`);

	await page
		.getByRole('button', {
			name: 'Load',
			exact: true,
		})
		.click();

	await page.getByLabel('Load from a day').fill(isoDate(0));

	await expect(page.getByText('Boxing training').first()).toBeVisible();
});

// importFromDate returns 0 for a day with no session, and the menu has to say so
// rather than close as though it had imported something.
test('loading from a day with nothing on it reports the empty day', async ({ page }) => {
	await page.goto('/');
	await addTask(page, 'Boxing training');
	await page.waitForTimeout(AUTOSAVE_MS);

	await page.goto(`/?date=${isoDate(2)}`);

	await page
		.getByRole('button', {
			name: 'Load',
			exact: true,
		})
		.click();

	await page.getByLabel('Load from a day').fill(isoDate(-40));

	await expect(page.getByText('No tasks on that day')).toBeVisible();
});

/* Importance travels, and `mustDoToday` does not — the two sit beside each other in
   the same form, so which one a routine carries is the distinction worth proving.
   The level is a property of the task ("the invoice is always high"); the flag is a
   statement about today, and `sanitizeTask` drops it on purpose. */
test('a routine carries the importance its tasks were saved with', async ({ page }) => {
	await page.goto('/');
	await addTask(page, 'Send the invoice');

	const row = taskRow(page, 'Send the invoice');

	await row
		.getByRole('button', {
			name: 'Edit task',
		})
		.click();

	await row
		.getByRole('group', {
			name: 'Importance',
		})
		.getByRole('radio', {
			name: 'High',
			exact: true,
		})
		.check();

	await row
		.getByRole('button', {
			name: 'Save',
		})
		.click();

	await page.waitForTimeout(AUTOSAVE_MS);
	await saveRoutine(page, 'Invoice day');

	await page.goto(`/?date=${isoDate(3)}`);
	await expect(page.getByText('No tasks deployed yet')).toBeVisible();

	await page
		.getByRole('button', {
			name: 'Load',
			exact: true,
		})
		.click();

	await page
		.getByRole('menuitem', {
			name: 'Invoice day (1)',
		})
		.click();

	await expect(taskRow(page, 'Send the invoice').getByText('High importance')).toBeVisible();
});

/* The Lab is where the day is actually tuned, so the day's two menus read on its
   Plan card as well — a routine saved on the main page had no way in here. */
test('the day’s Load and Save read on the Lab’s Plan card', async ({ page }) => {
	await page.goto('/energy');
	await addTask(page, 'Deep work');

	const card = taskCard(page);

	await expect(
		card.getByRole('button', {
			name: 'Load',
			exact: true,
		}),
	).toBeVisible();

	await expect(
		card.getByRole('button', {
			name: 'Save',
			exact: true,
		}),
	).toBeVisible();
});

test('a routine loads onto the Lab’s list', async ({ page }) => {
	// Saved from a future day so today stays empty: routines are global, and loading
	// tasks onto a day that already holds them would assert nothing.
	await page.goto(`/?date=${isoDate(2)}`);
	await addTask(page, 'Boxing training');
	await addTask(page, 'Write report');

	await saveRoutine(page, 'Morning block');

	await page.goto('/energy');
	await expect(page.getByText('No tasks deployed yet')).toBeVisible();

	await taskCard(page)
		.getByRole('button', {
			name: 'Load',
			exact: true,
		})
		.click();

	await page
		.getByRole('menuitem', {
			name: 'Morning block (2)',
		})
		.click();

	await expect(taskRow(page, 'Boxing training')).toBeVisible();
	await expect(taskRow(page, 'Write report')).toBeVisible();
});

// Load with nothing loaded yet is the whole point of the pair being here; Save is
// what an empty day has nothing to offer.
test('an empty Lab day offers Load and nothing to save', async ({ page }) => {
	await page.goto('/energy');

	await expect(
		taskCard(page).getByRole('button', {
			name: 'Load',
			exact: true,
		}),
	).toBeVisible();

	await expect(
		page.getByRole('button', {
			name: 'Save',
			exact: true,
		}),
	).toHaveCount(0);
});

/* `Task.tags` is carried by two stores, and a tag rewrite that stopped at `sessions`
   handed the old spelling back the moment a routine was loaded — which made the
   delete's own "everywhere" false. Both below stay client-side after the rewrite: a
   reload would rebuild the routine menu from storage and hide a stale `#routines`. */

/** Deploy one tagged task and settle the autosave — the day both tests save as a routine. */
async function addTaggedTask(page: Page, title: string, tag: string) {
	const field = await openTaskForm(page);

	await field.fill(title);
	await page.getByLabel('Tags').fill(tag);
	await page.getByLabel('Tags').press('Enter');

	await page
		.getByRole('button', {
			name: 'Deploy Task',
		})
		.click();

	await closeTaskForm(page);
	await page.waitForTimeout(AUTOSAVE_MS);
}

/** The tags one row's ✎ editor shows: the chip's ✕ carries the name, the chip's own
 *  text being the tag beside an icon button that has none. */
async function openTagChips(page: Page, title: string) {
	await taskRow(page, title)
		.getByRole('button', {
			name: 'Edit task',
		})
		.click();

	await expect(page.getByLabel('Tags')).toBeVisible();

	return page.getByRole('button', {
		name: /^Remove tag /,
	});
}

test('a deleted tag does not come back with the routine that carried it', async ({ page }) => {
	await page.goto('/');
	await addTaggedTask(page, 'Post the parcel', 'errand');
	await saveRoutine(page, 'Errands');

	// The card lists a tag only against logged hours, and the ✕ is on that row.
	await logDrain(page, 60, 4, 8);
	await expect(drainChips(page)).toBeVisible();

	await page
		.getByRole('link', {
			name: 'Analytics',
		})
		.click();

	const tagRow = tagRows(page).filter({
		hasText: 'errand',
	});

	await tagRow
		.getByRole('button', {
			name: 'Delete errand',
		})
		.click();

	await tagRow
		.getByRole('button', {
			name: 'Delete errand everywhere',
		})
		.click();

	await expect(tagRow).toHaveCount(0);

	await page
		.getByRole('link', {
			name: 'Today',
		})
		.click();

	// The day's own copy goes, so the imported row is the only one carrying the title.
	await taskRow(page, 'Post the parcel')
		.getByRole('button', {
			name: 'Delete task',
		})
		.click();

	await expect(page.getByText('No tasks deployed yet')).toBeVisible();

	await page
		.getByRole('button', {
			name: 'Load',
			exact: true,
		})
		.click();

	await page
		.getByRole('menuitem', {
			name: 'Errands (1)',
		})
		.click();

	await expect(await openTagChips(page, 'Post the parcel')).toHaveCount(0);
});

test('a respelled tag comes back with the routine in its new spelling', async ({ page }) => {
	await page.goto('/');
	await addTaggedTask(page, 'Write the report', 'dep work');
	await saveRoutine(page, 'Focus');

	await logDrain(page, 60, 4, 8);
	await expect(drainChips(page)).toBeVisible();

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

	await taskRow(page, 'Write the report')
		.getByRole('button', {
			name: 'Delete task',
		})
		.click();

	await expect(page.getByText('No tasks deployed yet')).toBeVisible();

	await page
		.getByRole('button', {
			name: 'Load',
			exact: true,
		})
		.click();

	await page
		.getByRole('menuitem', {
			name: 'Focus (1)',
		})
		.click();

	const chips = await openTagChips(page, 'Write the report');

	await expect(chips).toHaveCount(1);
	await expect(chips).toHaveAccessibleName('Remove tag deep work');
});
