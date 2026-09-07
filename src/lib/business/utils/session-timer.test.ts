import { describe, expect, it } from 'vitest';
import {
	getElapsedMinutes,
	getPendingMinutes,
	getRemainingMinutes,
	isAlarmDue,
	pauseTimer,
	runTimer,
	sanitizeSessionTimer,
	stopTimer,
	suggestTargetMinutes,
} from '$lib/business/utils/session-timer';

const TODAY = '2026-08-22';
const START = 1_800_000_000_000;
const at = (minutes: number) => START + minutes * 60_000;

describe('getElapsedMinutes', () => {
	// Milliseconds accumulate and minutes are cut once, at read: cutting each
	// segment would let a run of short pauses drift the reading off the clock.
	it('sums the running segments and leaves out the pause', () => {
		const started = runTimer(null, TODAY, START);
		const paused = pauseTimer(started, at(10));
		const resumed = runTimer(paused, TODAY, at(40));

		expect(getElapsedMinutes(resumed, at(45))).toBe(15);
	});

	// A clock, not a rounding: a minute appears when it has passed, and then stands
	// for the whole of the next one. Rounding to nearest showed every reading for
	// thirty seconds and named the first minute halfway through it.
	it('reads the minute that has passed, not the nearest one', () => {
		const started = runTimer(null, TODAY, START);

		expect(getElapsedMinutes(started, START + 59_999)).toBe(0);
		expect(getElapsedMinutes(started, START + 60_000)).toBe(1);
		expect(getElapsedMinutes(started, START + 119_999)).toBe(1);
	});

	// The two readings stand side by side, so they have to change on the same second
	// and add up to the length that was set — one flooring against the other's ceiling.
	it('moves in step with the countdown beside it', () => {
		const started = runTimer(null, TODAY, START, 45 * 60_000);

		expect(getElapsedMinutes(started, START + 30_000)).toBe(0);
		expect(getRemainingMinutes(started, START + 30_000)).toBe(45);
		expect(getElapsedMinutes(started, START + 90_000)).toBe(1);
		expect(getRemainingMinutes(started, START + 90_000)).toBe(44);
	});
});

describe('stopTimer', () => {
	// Start then Stop is the only path the 🪫 editor is seeded from, so the segment
	// still running when Stop is pressed has to land in the reading.
	it('keeps the segment that was running when it stopped', () => {
		expect(getPendingMinutes(stopTimer(runTimer(null, TODAY, START), at(45)))).toBe(45);
	});

	it('sums two running segments and leaves out the pause', () => {
		const paused = pauseTimer(runTimer(null, TODAY, START), at(10));
		const resumed = runTimer(paused, TODAY, at(40));

		expect(getPendingMinutes(stopTimer(resumed, at(45)))).toBe(15);
	});

	// A clock corrected backwards mid-segment would otherwise store a negative total,
	// which `formatDuration` renders as "-1h -5m".
	it('floors a backwards clock correction at zero', () => {
		const stopped = stopTimer(runTimer(null, TODAY, START), at(-5));

		expect(getElapsedMinutes(stopped, at(-5))).toBe(0);
	});
});

describe('getPendingMinutes', () => {
	const stopped = (accumulatedMs: number) => ({
		phase: 'stopped' as const,
		startedOn: TODAY,
		runningSince: null,
		accumulatedMs,
		targetMs: null,
	});

	it("offers a stopped timer's whole minutes", () => {
		expect(getPendingMinutes(stopped(45 * 60_000))).toBe(45);
	});

	// A clock still counting would fund a second log from the same minutes,
	// and the first log would take the rest of the session with it.
	it('offers nothing while the timer is still running', () => {
		expect(getPendingMinutes(runTimer(null, TODAY, START))).toBeNull();
	});

	it('offers nothing for a session shorter than a minute', () => {
		expect(getPendingMinutes(stopped(50_000))).toBeNull();
	});

	// The same cut as the readout: the editor opens on the number the strip was
	// showing when Stop was pressed, never a minute the clock never reached.
	it('seeds the minutes the readout showed', () => {
		expect(getPendingMinutes(stopped(20 * 60_000 + 40_000))).toBe(20);
	});
});

describe('sanitizeSessionTimer', () => {
	// A new 🪫 measurement is today-only, and forgetting to stop overnight is the
	// commonest way a timer goes wrong — one check disposes of both.
	it('drops a timer that did not start today', () => {
		expect(
			sanitizeSessionTimer(
				{
					phase: 'running',
					startedOn: '2026-08-21',
					runningSince: START,
					accumulatedMs: 0,
				},
				TODAY,
			),
		).toBeNull();
	});

	it('drops a timer whose accumulated time is not a finite number', () => {
		expect(
			sanitizeSessionTimer(
				{
					phase: 'paused',
					startedOn: TODAY,
					runningSince: null,
					accumulatedMs: 'a while',
				},
				TODAY,
			),
		).toBeNull();
	});

	// The same floor as the write path: storage is hand-reachable, so a negative
	// total can arrive from outside the timer's own transitions.
	it('floors a negative accumulated time at zero', () => {
		expect(
			sanitizeSessionTimer(
				{
					phase: 'paused',
					startedOn: TODAY,
					runningSince: null,
					accumulatedMs: -300_000,
				},
				TODAY,
			)?.accumulatedMs,
		).toBe(0);
	});

	// The target is a user's intention, not a measurement, so an unreadable one
	// costs the countdown and never the minutes the session actually counted.
	it('drops an unreadable target and keeps the session', () => {
		const sanitized = sanitizeSessionTimer(
			{
				phase: 'paused',
				startedOn: TODAY,
				runningSince: null,
				accumulatedMs: 20 * 60_000,
				targetMs: '45m',
			},
			TODAY,
		);

		expect(sanitized?.targetMs).toBeNull();
		expect(sanitized?.accumulatedMs).toBe(20 * 60_000);
	});

	it('reads a non-positive target as no target', () => {
		expect(
			sanitizeSessionTimer(
				{
					phase: 'paused',
					startedOn: TODAY,
					runningSince: null,
					accumulatedMs: 0,
					targetMs: 0,
				},
				TODAY,
			)?.targetMs,
		).toBeNull();
	});
});

describe('runTimer', () => {
	// A resume is the same transition as a start, so the target has to survive it or
	// pausing would silently turn a countdown back into the plain clock.
	it('keeps a paused target when none is passed', () => {
		const paused = pauseTimer(runTimer(null, TODAY, START, 45 * 60_000), at(20));

		expect(runTimer(paused, TODAY, at(30)).targetMs).toBe(45 * 60_000);
	});
});

describe('getRemainingMinutes', () => {
	// Ceiled where the elapsed reading floors: "0m left" with seconds still on the
	// clock reads as an alarm that failed.
	it('rounds a part-minute up', () => {
		expect(getRemainingMinutes(runTimer(null, TODAY, START, 45 * 60_000), START + 10_000)).toBe(45);
	});

	it('still reads on a paused clock', () => {
		const paused = pauseTimer(runTimer(null, TODAY, START, 45 * 60_000), at(20));

		expect(getRemainingMinutes(paused, at(90))).toBe(25);
	});

	// A stopped session is over, and the reading beside it is the minutes a 🪫 log is
	// waiting for — a countdown there would say the clock was still going.
	it('reads nothing on a stopped clock', () => {
		const stopped = stopTimer(runTimer(null, TODAY, START, 45 * 60_000), at(20));

		expect(getRemainingMinutes(stopped, at(20))).toBeNull();
	});
});

describe('isAlarmDue', () => {
	// The alarm belongs to a clock that is counting: a paused session is not running
	// out of time, however long it has been paused for.
	it('is false on a paused timer past its target', () => {
		const paused = pauseTimer(runTimer(null, TODAY, START, 45 * 60_000), at(50));

		expect(isAlarmDue(paused, at(90))).toBe(false);
	});

	it('is false for a timer with no target', () => {
		expect(isAlarmDue(runTimer(null, TODAY, START), at(600))).toBe(false);
	});
});

describe('suggestTargetMinutes', () => {
	it('takes the advised session length', () => {
		expect(
			suggestTargetMinutes({
				verdict: 'continue',
				taskId: 1,
				sessionHours: 1.5,
				marginalValue: 2,
			}),
		).toBe(90);
	});

	// One model step (MATH.md §8.8) is the one duration the rest of the app already
	// speaks in, so an unpriced day starts there rather than at an invented number.
	it('falls back to one step with nothing to price', () => {
		expect(suggestTargetMinutes(null)).toBe(45);

		expect(
			suggestTargetMinutes({
				verdict: 'window-full',
			}),
		).toBe(45);
	});
});
