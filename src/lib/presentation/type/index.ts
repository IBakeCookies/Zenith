/**
 * UI-only types: shapes that exist for rendering, not for the model or
 * persistence.
 */

import type { Band } from '$lib/presentation/utils/band';

/**
 * Which of the fold's four questions a reading answers. Every reading has one,
 * headline included — a tile is repeated under its question rather than missing
 * from the column that would otherwise be short an answer.
 */
export type MetricGroup = 'fit' | 'worth' | 'cost' | 'endurance';

/** One row/tile in the metrics dashboard. */
export interface Metric {
	/** promoted out of the list to a large tile — the day's headline readings */
	headline?: boolean;
	group: MetricGroup;
	label: string;
	value: string;
	description: string;
	/** How the reading judges; the component owns the colour and the wording. */
	band: Band;
}
