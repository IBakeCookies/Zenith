import { describe, expect, it } from 'vitest';
import type { MetricTrendPoint, WeeklyMetricTrend } from '$lib/business/model/metric/history';
import {
	metricTrendSeries,
	type MetricTrendSeriesInput,
} from '$lib/presentation/utils/metric-trend-series';

const point = (date: string, burnoutRisk: number): MetricTrendPoint => ({
	date,
	burnoutRisk,
	cognitiveLoad: burnoutRisk + 1,
	physicalLoad: burnoutRisk + 2,
});

const input = (over: Partial<MetricTrendSeriesInput> = {}): MetricTrendSeriesInput => ({
	range: 'week',
	trend: [],
	weeklyTrend: [],
	rangeStart: '2026-07-25',
	rangeDays: 7,
	locale: 'en-US',
	...over,
});

describe('metricTrendSeries', () => {
	it('gives every day in the range a slot, recorded or not', () => {
		const { series, labels } = metricTrendSeries(
			input({
				trend: [point('2026-07-27', 40)],
			}),
		);

		expect(labels).toHaveLength(7);
		expect(series.map((s) => s.values.length)).toEqual([7, 7, 7]);
	});

	// The chart breaks its line at a null, so an unrecorded day must not arrive
	// as a 0 — which would draw a plunge to the floor and back on a day the user
	// simply did not open the app.
	it('leaves an unrecorded day null rather than zero', () => {
		const { series } = metricTrendSeries(
			input({
				trend: [point('2026-07-25', 0), point('2026-07-27', 40)],
			}),
		);

		expect(series[0].values).toEqual([0, null, 40, null, null, null, null]);
	});

	it('carries the three readings in the order the legend names them', () => {
		const { series } = metricTrendSeries(
			input({
				rangeDays: 1,
				rangeStart: '2026-07-25',
				trend: [point('2026-07-25', 10)],
			}),
		);

		expect(series.map((s) => s.values[0])).toEqual([10, 11, 12]);
	});

	// One line style per series, because hue does not separate them on every theme:
	// `terminal` maps --mind and --body to two greens of the same lightness, and
	// STYLE.md's rule is stronger than that — NO pairing of two declared tokens
	// survives all of `themes.css`, so danger/mind is no safer than mind/body.
	// Three tokens therefore need three styles, not one dash on the odd one out.
	it('separates every series by more than hue', () => {
		const { series } = metricTrendSeries(input());

		expect(new Set(series.map((s) => s.dash)).size).toBe(series.length);
		expect(new Set(series.map((s) => s.strokeClass)).size).toBe(3);
	});

	it('thins the axis to a handful of ticks however long the range is', () => {
		const printed = (rangeDays: number) =>
			metricTrendSeries(
				input({
					rangeDays,
				}),
			).labels.filter((label) => label !== '');

		expect(printed(7)).toHaveLength(7);
		expect(printed(30)).toHaveLength(6);
		expect(printed(365)).toHaveLength(7);
	});

	it('labels a tick with the day it stands on', () => {
		const { labels } = metricTrendSeries(input());

		expect(labels[0]).toBe('Jul 25');
		expect(labels[6]).toBe('Jul 31');
	});

	// One point per 7-day block, like the completion chart above it: 365 daily
	// points at this width read as noise, and the two year charts must line up
	// slot for slot.
	it('gives the year view one slot per 7-day block, labelled once a month', () => {
		const weeklyTrend: WeeklyMetricTrend[] = [
			{
				start: '2026-06-24',
				isMonthStart: true,
				burnoutRisk: 30,
				cognitiveLoad: 31,
				physicalLoad: 32,
			},
			{
				start: '2026-07-01',
				isMonthStart: true,
				burnoutRisk: null,
				cognitiveLoad: null,
				physicalLoad: null,
			},
			{
				start: '2026-07-08',
				isMonthStart: false,
				burnoutRisk: 50,
				cognitiveLoad: 51,
				physicalLoad: 52,
			},
		];

		const { labels, series } = metricTrendSeries(
			input({
				range: 'year',
				rangeDays: 365,
				weeklyTrend,
			}),
		);

		// 52 labels do not fit the axis; only the block opening a month prints one.
		expect(labels).toEqual(['Jun', 'Jul', '']);

		expect(series.map((s) => s.values)).toEqual([
			[30, null, 50],
			[31, null, 51],
			[32, null, 52],
		]);
	});
});
