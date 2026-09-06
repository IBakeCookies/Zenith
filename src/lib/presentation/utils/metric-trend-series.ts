/* The analytics line cards' series, laid onto one slot per day of the viewed range.

   The gaps are made here: the chart draws a break at a `null`, which is what
   keeps a day with no reading — never opened, or nothing finished on it — from
   reading as a plunge to zero.

   Colours are utility classes, not raw `var()` — STYLE.md's normal path, and
   what `completion-yield-chart` and `energy-chart` already do. The locale tag is
   a parameter for the reason `number-format.ts` gives. */

import * as m from '$lib/paraglide/messages.js';
import { addDays, fromISO } from '$lib/business/utils/date';
import type { MetricTrendPoint } from '$lib/business/model/metric/history';

export interface TrendSeries {
	label: string;
	/** One per slot; `null` is a slot with no reading, not a zero. */
	values: (number | null)[];
	/** A `stroke-*` token class from tokens.css. */
	strokeClass: string;
	/** The matching `fill-*`, for a day with no neighbour to draw a line to. */
	fillClass: string;
	/** A matching `bg-*` for the legend swatch. */
	swatchClass: string;
	isDashed: boolean;
}

export interface MetricTrendSeriesInput {
	trend: MetricTrendPoint[];
	rangeStart: string;
	rangeDays: number;
	/** BCP-47 tag — `getDateLocale()` at the call site */
	locale: string;
}

/** About this many x-axis ticks at any range length; 7 slots print all seven. */
const TICK_TARGET = 7;

function layOutRange<T extends { date: string }>(
	rows: T[],
	rangeStart: string,
	rangeDays: number,
	locale: string,
): { slots: (T | null)[]; labels: string[] } {
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

// Every class is spelled out rather than derived from the stroke name:
// Tailwind tree-shakes the @theme aliases down to what its scanner can see
// literally, so `'stroke-' + hue` resolves to nothing (STYLE.md, and the same
// trap `series-color.ts` documents).
function line<T>(
	slots: (T | null)[],
	label: string,
	read: (row: T) => number | null,
	classes: Pick<TrendSeries, 'strokeClass' | 'fillClass' | 'swatchClass'>,
	isDashed = false,
): TrendSeries {
	return {
		label,
		values: slots.map((row) => (row === null ? null : read(row))),
		...classes,
		isDashed,
	};
}

export function metricTrendSeries(input: MetricTrendSeriesInput): {
	labels: string[];
	series: TrendSeries[];
} {
	const { slots, labels } = layOutRange(
		input.trend,
		input.rangeStart,
		input.rangeDays,
		input.locale,
	);

	return {
		labels,
		series: [
			line(slots, m.metric_burnout_risk(), (p) => p.burnoutRisk, {
				strokeClass: 'stroke-danger',
				fillClass: 'fill-danger',
				swatchClass: 'bg-danger',
			}),
			line(slots, m.metric_cognitive_load(), (p) => p.cognitiveLoad, {
				strokeClass: 'stroke-mind',
				fillClass: 'fill-mind',
				swatchClass: 'bg-mind',
			}),
			line(
				slots,
				m.metric_physical_load(),
				(p) => p.physicalLoad,
				{
					strokeClass: 'stroke-body',
					fillClass: 'fill-body',
					swatchClass: 'bg-body',
				},
				true,
			),
		],
	};
}
