/* The gap the two analytics charts share.

   A slot with no reading arrives as `null`, and neither obvious drawing of it is
   honest: joining across it invents a reading, and plotting a 0 invents a day
   that went well. So a series is split into runs of consecutive recorded slots —
   a run of two or more is a line, a run of one is a dot, which is the reading a
   polyline-only chart would drop entirely.

   `xPos` is a callback because the two charts space their slots differently:
   `completion-yield-chart` centres on a slot, `metric-trend-chart` spreads edge
   to edge. */

/* Here rather than in either chart because the two cards sit one above the other
   on the analytics page: a dash 10 long in one and 5 in the other reads as two
   unrelated encodings of the same idea. Why every series needs one at all is
   STYLE.md's. `dotted` is short enough that the round linecap makes it a dot. */
export const DASH = {
	dotted: '1 4',
	dashed: '10 5',
};

/** Consecutive recorded slots, split at every unrecorded one. */
export function runsOf(
	values: (number | null)[],
	xPos: (index: number) => number,
	yPos: (value: number) => number,
): { x: number; y: number }[][] {
	const runs: { x: number; y: number }[][] = [];
	let run: { x: number; y: number }[] = [];

	values.forEach((value, index) => {
		if (value === null) {
			if (run.length) runs.push(run);

			run = [];

			return;
		}

		run.push({
			x: xPos(index),
			y: yPos(value),
		});
	});

	if (run.length) runs.push(run);

	return runs;
}
