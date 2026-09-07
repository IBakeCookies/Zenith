import { page } from 'vitest/browser';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { toast } from 'svelte-sonner';
import { playAlarmSound } from '$lib/presentation/utils/alarm-sound';
import SessionClock from '$lib/presentation/component/session-clock.svelte';

vi.mock('$lib/presentation/utils/alarm-sound', () => ({
	playAlarmSound: vi.fn(),
}));

/** A spec and not a story `play`: the undo lives on a toast, and the `Toaster`
 *  the story would need is the layout's (docs/testing.md). */
describe('session-clock.svelte', () => {
	const props = {
		today: '2026-09-07',
		timer: {
			phase: 'stopped' as const,
			startedOn: '2026-09-07',
			runningSince: null,
			accumulatedMs: 45 * 60_000,
			targetMs: null,
		},
		getSuggestedMinutes: () => 45,
	};

	// Both the mocked alarm and any leaked `toast` spy count calls across tests, and
	// three of the tests below assert a call COUNT.
	beforeEach(() => vi.clearAllMocks());

	/** The undo the discard offers, taken off the toast the component raised. */
	const undoOf = (info: ReturnType<typeof vi.spyOn>) =>
		info.mock.calls[0][1]?.action as {
			label: string;
			onClick: (event: MouseEvent) => void;
		};

	it('offers a discarded session reading back', async () => {
		const info = vi.spyOn(toast, 'info').mockImplementation(() => '');

		render(SessionClock, props);

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

		render(SessionClock, props);

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

		// Exact: the fresh clock's own countdown reads "45m left", which a substring
		// match would take for the discarded reading coming back.
		await expect
			.element(
				page.getByText('45m', {
					exact: true,
				}),
			)
			.not.toBeInTheDocument();

		await expect
			.element(
				page.getByRole('button', {
					name: 'Pause timer',
				}),
			)
			.toBeVisible();

		info.mockRestore();
	});

	/** A clock already at its target, so the very next tick is the one that rings.
	 *  Only `setInterval` is faked: the browser assertions below retry on real
	 *  timers, and `Date.now()` has to keep moving for the reading itself. */
	const atTarget = (accumulatedMs = 45 * 60_000) => ({
		...props,
		timer: {
			phase: 'running' as const,
			startedOn: '2026-09-07',
			runningSince: Date.now(),
			accumulatedMs,
			targetMs: 45 * 60_000,
		},
	});

	const withFakeTicks = () => {
		vi.useFakeTimers({
			toFake: ['setInterval', 'clearInterval'],
		});

		return () => vi.useRealTimers();
	};

	it('announces a session that has run out of time', async () => {
		const restoreTimers = withFakeTicks();
		const info = vi.spyOn(toast, 'info').mockImplementation(() => '');

		render(SessionClock, atTarget());
		vi.advanceTimersByTime(1000);

		expect(info).toHaveBeenCalledTimes(1);

		info.mockRestore();
		restoreTimers();
	});

	// The target is the flag: cleared when it rings, so there is no phase in which a
	// countdown both exists and has already been announced.
	it('sounds the alarm once however long the session runs on', async () => {
		const restoreTimers = withFakeTicks();
		const info = vi.spyOn(toast, 'info').mockImplementation(() => '');

		render(SessionClock, atTarget());
		vi.advanceTimersByTime(3000);

		expect(playAlarmSound).toHaveBeenCalledTimes(1);

		info.mockRestore();
		restoreTimers();
	});

	// The clock's one downstream job is seeding a 🪫 log, and a session stopped at the
	// number the user typed would feed the stopping fit its own prior (MATH.md §8.10).
	it('leaves the clock running after the alarm', async () => {
		const restoreTimers = withFakeTicks();
		const info = vi.spyOn(toast, 'info').mockImplementation(() => '');

		render(SessionClock, atTarget());
		vi.advanceTimersByTime(1000);
		restoreTimers();

		// The ring has to have happened, or a clock that simply never rang would pass.
		expect(info).toHaveBeenCalledTimes(1);

		await expect
			.element(
				page.getByRole('button', {
					name: 'Pause timer',
				}),
			)
			.toBeVisible();

		info.mockRestore();
	});

	// Read from the target itself, so clearing the target is the whole of what the
	// alarm has to do: nothing else has to be told the countdown is over.
	it('drops the time-left reading once it has rung', async () => {
		const restoreTimers = withFakeTicks();
		const info = vi.spyOn(toast, 'info').mockImplementation(() => '');

		render(SessionClock, atTarget(45 * 60_000 - 200));

		await expect.element(page.getByText('1m left')).toBeVisible();

		// Real time, because `Date.now()` is what the reading is computed against —
		// only the tick that samples it is faked.
		await new Promise((resolve) => setTimeout(resolve, 300));
		vi.advanceTimersByTime(1000);
		restoreTimers();

		await expect.element(page.getByText(/left/)).not.toBeInTheDocument();

		info.mockRestore();
	});

	// The field is not clamped while it is being typed into, so a `0` on its way to
	// `15` must not re-aim a running session at zero and ring it a second later.
	it('does not ring a running session re-aimed mid-typing', async () => {
		const restoreTimers = withFakeTicks();
		const info = vi.spyOn(toast, 'info').mockImplementation(() => '');

		render(SessionClock, atTarget(20 * 60_000));

		await page.getByLabelText('Session length in minutes').fill('0');
		vi.advanceTimersByTime(1000);
		restoreTimers();

		expect(info).not.toHaveBeenCalled();

		info.mockRestore();
	});
});
