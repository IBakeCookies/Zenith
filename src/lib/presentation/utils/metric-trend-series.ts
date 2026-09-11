/* The analytics line cards' series, laid onto one slot per day of the viewed
   range — or one per 7-day block on the year range, which is where the
   completion chart above it also stops counting days.

   The gaps are made here: the chart draws a break at a `null`, which is what
   keeps a day with no reading — never opened, or nothing finished on it — from
   reading as a plunge to zero.

   Colours are utility classes, not raw `var()` — STYLE.md's normal path, and
   what `completion-yield-chart` and `energy-chart` already do. The locale tag is
   a parameter for the reason `number-format.ts` gives. */

import * as m from '$lib/paraglide/messages.js';
import { DASH } from '$lib/presentation/utils/series-runs';
import { addDays, fromISO } from '$lib/business/utils/date';
import type { MetricTrendPoint, WeeklyMetricTrend } from '$lib/business/model/metric/history';
import type { AnalyticsRange } from '$lib/business/store/analytics-store.svelte';

export interface TrendSeries {
	label: string;
	/** One per slot; `null` is a slot with no reading, not a zero. */
	values: (number | null)[];
	/** A `stroke-*` token class from tokens.css. */
	strokeClass: string;
	/** The matching `fill-*`, for a day with no neighbour to draw a line to. */
	fillClass: string;
	/** `stroke-dasharray`, or undefined for the solid line. One style per series,
	 *  never two series sharing one — see `DASH`. */
	dash?: string;
}

export interface MetricTrendSeriesInput {
	range: AnalyticsRange;
	trend: MetricTrendPoint[];
	/** Read instead of `trend` on the year range */
	weeklyTrend: WeeklyMetricTrend[];
	rangeStart: string;
	rangeDays: number;
	/** BCP-47 tag — `getDateLocale()` at the call site */
	locale: string;
}

/** What both lay-outs hand `line()`: the three readings, either of which may be absent. */
type TrendSlot = Pick<WeeklyMetricTrend, 'burnoutRisk' | 'cognitiveLoad' | 'physicalLoad'>;

/** About this many x-axis ticks at any range length; 7 slots print all seven. */
const TICK_TARGET = 7;

function layOutDays(
	rows: MetricTrendPoint[],
	rangeStart: string,
	rangeDays: number,
	locale: string,
): { slots: (TrendSlot | null)[]; labels: string[] } {
	const byDate = new Map(rows.map((row) => [row.date, row]));
	const step = Math.ceil(rangeDays / TICK_TARGET);

	const slots = Array.from(
		{
			length: rangeDays,
		},
		(_, index) => byDate.get(addDays(rangeStart, index)) ?? null,
	);

	const labels = slots.map((_, index) =>
		index % step === 0
			? fromISO(addDays(rangeStart, index)).toLocaleDateString(locale, {
					month: 'short',
					day: 'numeric',
				})
			: '',
	);

	return {
		slots,
		labels,
	};
}

// 52 labels do not fit the axis, so only a block that opens a calendar month
// carries one — the density the year view already read at, and the same blocks
// `completionChartPoints` labels.
function layOutWeeks(
	weeks: WeeklyMetricTrend[],
	locale: string,
): { slots: TrendSlot[]; labels: string[] } {
	return {
		slots: weeks,
		labels: weeks.map((week) =>
			week.isMonthStart
				? fromISO(week.start).toLocaleDateString(locale, {
						month: 'short',
					})
				: '',
		),
	};
}

// Every class is spelled out rather than derived from the stroke name:
// Tailwind tree-shakes the @theme aliases down to what its scanner can see
// literally, so `'stroke-' + hue` resolves to nothing (STYLE.md, and the same
// trap `series-color.ts` documents).
function line(
	slots: (TrendSlot | null)[],
	label: string,
	read: (row: TrendSlot) => number | null,
	classes: Pick<TrendSeries, 'strokeClass' | 'fillClass'>,
	dash?: string,
): TrendSeries {
	return {
		label,
		values: slots.map((row) => (row === null ? null : read(row))),
		...classes,
		dash,
	};
}

export function metricTrendSeries(input: MetricTrendSeriesInput): {
	labels: string[];
	series: TrendSeries[];
} {
	const { slots, labels } =
		input.range === 'year'
			? layOutWeeks(input.weeklyTrend, input.locale)
			: layOutDays(input.trend, input.rangeStart, input.rangeDays, input.locale);

	return {
		labels,
		// Three series, three line styles: `danger`/`mind`/`body` are three DECLARED
		// tokens, and STYLE.md's rule is that no pairing of those survives every
		// theme — `terminal` gives --mind and --body two greens of one lightness, and
		// the accents of any one theme share a lightness band, so the hues alone leave
		// some theme drawing two of these three the same. Burnout Risk keeps the solid
		// line because it is the reading the card is named for.
		series: [
			line(slots, m.metric_burnout_risk(), (p) => p.burnoutRisk, {
				strokeClass: 'stroke-danger',
				fillClass: 'fill-danger',
			}),
			line(
				slots,
				m.metric_cognitive_load(),
				(p) => p.cognitiveLoad,
				{
					strokeClass: 'stroke-mind',
					fillClass: 'fill-mind',
				},
				DASH.dotted,
			),
			line(
				slots,
				m.metric_physical_load(),
				(p) => p.physicalLoad,
				{
					strokeClass: 'stroke-body',
					fillClass: 'fill-body',
				},
				DASH.dashed,
			),
		],
	};
}
