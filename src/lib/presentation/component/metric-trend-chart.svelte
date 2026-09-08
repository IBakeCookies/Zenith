<script lang="ts">
	/* The analytics Load trend card: one slot per day of the viewed range, every
	   series on the same 0–100% axis its readings are already given on.

	   Fixed viewBox at `w-full`, like `completion-yield-chart` above it on the same
	   page. Colours are utility classes, not raw `var()` (STYLE.md). */

	import type { TrendSeries } from '$lib/presentation/utils/metric-trend-series';
	import { runsOf } from '$lib/presentation/utils/series-runs';
	import { cn } from '$lib/presentation/utils';

	interface Props {
		/** One per slot; `''` on the slots the axis does not print. The slot count every
		 *  series is drawn against — a value's index is the slot it belongs to. */
		labels: string[];
		series: TrendSeries[];
		/** Names the whole plot — an <svg role="img"> has no other accessible name */
		ariaLabel: string;
		class?: string;
	}

	let { labels, series, ariaLabel, class: className }: Props = $props();

	const CHART = {
		w: 800,
		h: 180,
		top: 12,
		right: 8,
		bottom: 26,
		left: 34,
	};
	const innerW = CHART.w - CHART.left - CHART.right;
	const innerH = CHART.h - CHART.top - CHART.bottom;
	const yTicks = [0, 25, 50, 75, 100];
	const yPos = (value: number) => CHART.top + innerH - (value / 100) * innerH;
	// A single slot has no interval to spread over, so it sits in the middle
	// rather than at a division by zero.
	const xPos = (index: number, count: number) =>
		count <= 1 ? CHART.left + innerW / 2 : CHART.left + (index / (count - 1)) * innerW;

	const plotted = $derived(
		series.map((line) => {
			const runs = runsOf(line.values, (index) => xPos(index, labels.length), yPos);

			return {
				...line,
				paths: runs
					.filter((run) => run.length > 1)
					.map((run) =>
						run.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(''),
					),
				dots: runs.filter((run) => run.length === 1).map((run) => run[0]),
			};
		}),
	);

	// The first and last slots sit ON the plot edges, so a centred label there
	// hangs half outside the viewBox and is clipped — "Jul 31" rendering as
	// "Jul". Turning only the edge labels keeps every tick between them centred
	// on the day it stands for.
	const anchorAt = (x: number) => {
		if (x <= CHART.left) return 'start';

		if (x >= CHART.left + innerW) return 'end';

		return 'middle';
	};

	const ticks = $derived(
		labels
			.map((label, index) => {
				const x = xPos(index, labels.length);

				return {
					label,
					x,
					anchor: anchorAt(x),
				};
			})
			.filter((tick) => tick.label !== ''),
	);
</script>

<svg
	viewBox="0 0 {CHART.w} {CHART.h}"
	class={cn('mt-text-md w-full', className)}
	role="img"
	aria-label={ariaLabel}
>
	{#each yTicks as tick (tick)}
		<line
			x1={CHART.left}
			x2={CHART.w - CHART.right}
			y1={yPos(tick)}
			y2={yPos(tick)}
			class="stroke-line-soft"
			stroke-width="1"
		/>
		<text
			x={CHART.left - 6}
			y={yPos(tick) + 3}
			class="fill-ty-silent"
			font-size="9"
			text-anchor="end">{tick}</text
		>
	{/each}

	{#each ticks as tick (tick.x)}
		<text x={tick.x} y={CHART.h - 8} class="fill-ty-silent" font-size="9" text-anchor={tick.anchor}
			>{tick.label}</text
		>
	{/each}

	{#each plotted as line (line.label)}
		{#each line.paths as path (path)}
			<path
				d={path}
				fill="none"
				stroke-width="1.8"
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-dasharray={line.isDashed ? '5 3' : undefined}
				class={line.strokeClass}
			/>
		{/each}
		{#each line.dots as dot (dot.x)}
			<circle cx={dot.x} cy={dot.y} r="2.2" class={line.fillClass} />
		{/each}
	{/each}
</svg>

{#if series.length > 1}
	<div class="mt-text-2xs flex flex-wrap gap-grid-md text-xs text-ty-silent">
		{#each series as line (line.label)}
			<span class="flex items-center gap-grid-2xs">
				{#if line.isDashed}
					<!-- The dash is what separates this line from the one above it on a
					     theme that gives both the same lightness, so the swatch carries
					     it too — as two segments rather than a raw gradient var(). -->
					<span class="flex w-4 gap-grid-2xs">
						<span class="h-0.5 w-1.5 {line.swatchClass}"></span>
						<span class="h-0.5 w-1.5 {line.swatchClass}"></span>
					</span>
				{:else}
					<span class="h-0.5 w-4 rounded-lg {line.swatchClass}"></span>
				{/if}
				{line.label}
			</span>
		{/each}
	</div>
{/if}
