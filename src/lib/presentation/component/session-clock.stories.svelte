<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { expect, waitFor } from 'storybook/test';
	import type { SessionTimer } from '$lib/business/utils/session-timer';
	import SessionClock from '$lib/presentation/component/session-clock.svelte';

	// Stopped with time on it, as the page reads it back after a reload: the reading
	// is waiting for a 🪫 editor and nothing has been logged.
	const stoppedTimer: SessionTimer = {
		phase: 'stopped',
		startedOn: '2026-07-20',
		runningSince: null,
		accumulatedMs: 45 * 60_000,
		targetMs: null,
	};

	const pendingLine = 'waiting for a 🪫 drain rating';
	const underMinute = '<1m';

	const { Story } = defineMeta({
		title: 'Component/Session Clock',
		component: SessionClock,
		tags: ['autodocs'],
		args: {
			today: '2026-07-20',
			timer: null,
			getSuggestedMinutes: () => 45,
		},
	});
</script>

<Story
	name="Timer, not started"
	play={async ({ canvas, userEvent }) => {
		// The day's timer: start, pause, stop. Stopping logs nothing — it leaves the minutes for the
		// next 🪫 editor to open with.
		// Nothing is waiting on an idle or a running clock, so the line that says
		// what a reading waits for belongs to neither.
		await expect(canvas.queryByText(pendingLine)).not.toBeInTheDocument();

		// A clock nobody has started reads as a word, beside the length that is the
		// whole invitation to measure a session.
		const start = canvas.getByRole('button', {
			name: 'Start timer',
		});

		await expect(start).toHaveTextContent('Start timer');

		const length = canvas.getByLabelText('Session length in minutes');

		await expect(length).toHaveValue(45);

		await userEvent.click(start);

		// The first minute has nothing to count, and "0m" reads as a clock that did
		// not start.
		await expect(canvas.getByText(underMinute)).toBeVisible();
		await expect(canvas.getByText(underMinute)).toHaveClass('text-ty-primary');
		await expect(canvas.getByText('45m left')).toBeVisible();

		// The mark is still typeable under a running session: re-aiming it is the only
		// way to set a second countdown once the first has rung and cleared itself. The
		// `3` on the way to `30` is below the minimum and re-aims nothing.
		await userEvent.clear(length);
		await userEvent.type(length, '30');

		await waitFor(() => expect(canvas.getByText('30m left')).toBeVisible());

		const pause = canvas.getByRole('button', {
			name: 'Pause timer',
		});

		await expect(pause).toBeInTheDocument();
		await expect(pause).toHaveTextContent('');

		await expect(
			canvas.getByRole('button', {
				name: 'Stop timer',
			}),
		).toBeInTheDocument();

		await expect(
			canvas.queryByRole('button', {
				name: 'Start timer',
			}),
		).not.toBeInTheDocument();

		await userEvent.click(pause);

		await expect(
			canvas.getByRole('button', {
				name: 'Resume timer',
			}),
		).toBeInTheDocument();

		// A paused clock counts nothing, and the readout says so on its own.
		await expect(canvas.getByText(underMinute)).toHaveClass('text-ty-secondary');

		await expect(canvas.queryByText(pendingLine)).not.toBeInTheDocument();
	}}
/>

<Story
	name="A stopped reading"
	args={{
		timer: stoppedTimer,
	}}
	play={async ({ canvas, userEvent }) => {
		// A reading nobody wants: discarding it is the way back to a fresh timer, and the only way — a
		// stopped timer offers no Start of its own.
		await expect(canvas.getByText('45m')).toHaveClass('text-ty-secondary');

		// The minutes alone say nothing about what holds them here.
		await expect(canvas.getByText(pendingLine)).toBeVisible();

		// Nothing left to aim, either: the length field goes with the phase that
		// could still have used it.
		await expect(canvas.queryByLabelText('Session length in minutes')).not.toBeInTheDocument();

		await userEvent.click(
			canvas.getByRole('button', {
				name: 'Discard timed session',
			}),
		);

		await expect(
			canvas.getByRole('button', {
				name: 'Start timer',
			}),
		).toBeInTheDocument();

		await expect(canvas.queryByText(pendingLine)).not.toBeInTheDocument();
		await expect(canvas.getByLabelText('Session length in minutes')).toBeVisible();
	}}
/>

<Story
	name="The timer keeps the keyboard"
	play={async ({ canvas, canvasElement, userEvent }) => {
		// Every phase change keeps the keyboard on the control that made it: both buttons outlive the
		// transition they trigger, so Enter on Start does not drop focus to <body> and send the next
		// Tab back to the top of the document.
		canvas
			.getByRole('button', {
				name: 'Start timer',
			})
			.focus();

		await userEvent.keyboard('{Enter}');

		const pause = await waitFor(() =>
			canvas.getByRole('button', {
				name: 'Pause timer',
			}),
		);

		await expect(canvasElement.ownerDocument.activeElement).toBe(pause);

		await userEvent.keyboard('{Enter}');

		await expect(canvasElement.ownerDocument.activeElement).toBe(
			await waitFor(() =>
				canvas.getByRole('button', {
					name: 'Resume timer',
				}),
			),
		);

		// The terminal control is one button too: stopping leaves the keyboard on
		// the Discard the same press produced.
		canvas
			.getByRole('button', {
				name: 'Stop timer',
			})
			.focus();

		await userEvent.keyboard('{Enter}');

		await expect(canvasElement.ownerDocument.activeElement).toBe(
			await waitFor(() =>
				canvas.getByRole('button', {
					name: 'Discard timed session',
				}),
			),
		);
	}}
/>
