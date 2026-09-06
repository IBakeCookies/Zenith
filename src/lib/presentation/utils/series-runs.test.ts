import { describe, expect, it } from 'vitest';
import { runsOf } from '$lib/presentation/utils/series-runs';

const xPos = (index: number) => index * 10;
const yPos = (value: number) => value;
const runs = (values: (number | null)[]) => runsOf(values, xPos, yPos);

describe('runsOf', () => {
	it('joins consecutive readings into one run', () => {
		expect(runs([10, 20, 30])).toEqual([
			[
				{
					x: 0,
					y: 10,
				},
				{
					x: 10,
					y: 20,
				},
				{
					x: 20,
					y: 30,
				},
			],
		]);
	});

	// The whole point: the chart draws two lines, not one crossing the gap.
	it('splits the run at an unrecorded slot', () => {
		expect(runs([10, 20, null, 30, 40]).map((run) => run.map((point) => point.y))).toEqual([
			[10, 20],
			[30, 40],
		]);
	});

	it('keeps a lone reading as a run of one, which the chart draws as a dot', () => {
		expect(runs([null, 10, null])).toEqual([
			[
				{
					x: 10,
					y: 10,
				},
			],
		]);
	});

	it('opens no run for a leading or trailing null', () => {
		expect(runs([null, null, 10, 20, null]).map((run) => run.length)).toEqual([2]);
	});

	it('reads no run at all from a series with nothing recorded', () => {
		expect(runs([null, null, null])).toEqual([]);
	});
});
