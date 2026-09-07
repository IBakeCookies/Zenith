import { page } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { toast } from 'svelte-sonner';
import DayActions from '$lib/presentation/component/day-actions.svelte';

/** A spec and not a story `play`: the undo lives on a toast, and the `Toaster`
 *  the story would need is the layout's (docs/testing.md). */
describe('day-actions.svelte', () => {
	const props = {
		selectedDate: '2026-09-07',
		today: '2026-09-07',
		yesterdaySession: null,
		routines: [],
		currentTasks: [],
		timer: {
			phase: 'stopped' as const,
			startedOn: '2026-09-07',
			runningSince: null,
			accumulatedMs: 45 * 60_000,
		},
		onimport: () => {},
		onimportdate: () => Promise.resolve(0),
		onsaveroutine: () => {},
		ondeleteroutine: () => {},
	};

	/** The undo the discard offers, taken off the toast the component raised. */
	const undoOf = (info: ReturnType<typeof vi.spyOn>) =>
		info.mock.calls[0][1]?.action as {
			label: string;
			onClick: (event: MouseEvent) => void;
		};

	it('offers a discarded session reading back', async () => {
		const info = vi.spyOn(toast, 'info').mockImplementation(() => '');

		render(DayActions, props);

		await expect.element(page.getByText('45m')).toBeVisible();

		await page
			.getByRole('button', {
				name: 'Discard timed session',
			})
			.click();

		await expect.element(page.getByText('45m')).not.toBeInTheDocument();

		undoOf(info).onClick(new MouseEvent('click'));

		await expect.element(page.getByText('45m')).toBeVisible();

		info.mockRestore();
	});

	// A stopped reading is what `getPendingMinutes` hands the 🪫 editor, so putting
	// one back over a running clock would seed a log with minutes nobody worked.
	it('refuses the undo once a new session is running', async () => {
		const info = vi.spyOn(toast, 'info').mockImplementation(() => '');

		render(DayActions, props);

		await page
			.getByRole('button', {
				name: 'Discard timed session',
			})
			.click();

		await page
			.getByRole('button', {
				name: 'Start timer',
			})
			.click();

		undoOf(info).onClick(new MouseEvent('click'));

		await expect.element(page.getByText('45m')).not.toBeInTheDocument();

		await expect
			.element(
				page.getByRole('button', {
					name: 'Pause timer',
				}),
			)
			.toBeVisible();

		info.mockRestore();
	});
});
