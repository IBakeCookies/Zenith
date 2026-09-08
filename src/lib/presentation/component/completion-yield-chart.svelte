<script lang="ts">
	/* The analytics Completion & yield card: one slot per day, or per month in the
	   year view, with both readings drawn the same way on the same 0–100 axis.

	   The same mark for both is the point — the card asks whether a day's yield
	   tracked what was finished, and that comparison is what two lines make cheap
	   and a bar against a line makes work. They are told apart by hue AND by the
	   dash, because several themes give the pair the same lightness.

	   Every slot keeps a full-height transparent hover target, so the tooltip does
	   not need pixel-perfect aim at a 2px line, and it is the only place the
	   tasks-done reading is printed.

	   Colours are utility classes, not raw `var()`: STYLE.md's normal path, and the
	   same mechanism `energy-chart.svelte` uses. */

	import type { ChartPoint } from '$lib/presentation/utils/completion-chart-points';
	import { runsOf } from '$lib/presentation/utils/series-runs';
	import { cn } from '$lib/presentation/utils';
	import * as m from '$lib/paraglide/messages.js';

	interface Props {
		points: ChartPoint[];
		/** Names the whole plot — an <svg role="img"> has no other accessible name */
		ariaLabel: string;
		class?: string;
	}

	let { points, ariaLabel, class: className }: Props = $props();

	// Fixed viewBox, responsive via width: 100%
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
	const yPos = (v: number) => CHART.top + innerH - (v / 100) * innerH;

	const slots = $derived.by(() => {
		const n = points.length;

		if (n === 0) return [];

		const width = innerW / n;

		return points.map((point, i) => ({
			...point,
			x: CHART.left + i * width,
			width,
		}));
	});

	// Centred on its slot, so a reading sits over the label it belongs to — unlike
	// `metric-trend-chart`, which spreads its points edge to edge.
	function plot(read: (point: ChartPoint) => number | null) {
		const runs = runsOf(slots.map(read), (index) => slots[index].x + slots[index].width / 2, yPos);

		return {
			paths: runs
				.filter((run) => run.length > 1)
				.map((run) =>
					run.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(''),
				),
			dots: runs.filter((run) => run.length === 1).map((run) => run[0]),
		};
	}

	const rate = $derived(plot((point) => point.value));
	const yield_ = $derived(plot((point) => point.line));

	const readingOf = (point: ChartPoint) =>
		`${point.full} — ${point.value === null ? m.ana_no_data() : `${point.value}% · ${point.sub}`}`;
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
			x={CHART.left - 8}
			y={yPos(tick) + 3}
			text-anchor="end"
			class="fill-ty-silent tabular-nums"
			font-size="10"
		>
			{tick}
		</text>
	{/each}

	{#each slots as slot, i (i)}
		{#if slot.showLabel}
			<text
				x={slot.x + slot.width / 2}
				y={CHART.h - 8}
				text-anchor="middle"
				class="fill-ty-silent"
				font-size="10"
			>
				{slot.label}
			</text>
		{/if}
	{/each}

	{#each rate.paths as path (path)}
		<path
			d={path}
			fill="none"
			stroke-width="1.8"
			stroke-linecap="round"
			stroke-linejoin="round"
			stroke-dasharray="5 3"
			class="stroke-brand"
		/>
	{/each}
	{#each rate.dots as dot (dot.x)}
		<circle cx={dot.x} cy={dot.y} r="2.2" class="fill-brand" />
	{/each}

	{#each yield_.paths as path (path)}
		<path
			d={path}
			fill="none"
			stroke-width="1.8"
			stroke-linecap="round"
			stroke-linejoin="round"
			class="stroke-brand-counter"
		/>
	{/each}
	{#each yield_.dots as dot (dot.x)}
		<circle cx={dot.x} cy={dot.y} r="2.2" class="fill-brand-counter" />
	{/each}

	<!-- Last, so the hover targets stay above both lines. The empty case says "no
	     data" from here rather than reusing `sub`, which happens to hold the same
	     words: a caller passing an empty `sub` would otherwise leave a slot whose
	     only tooltip is a dangling dash. -->
	{#each slots as slot, i (i)}
		<rect x={slot.x} y={CHART.top} width={slot.width} height={innerH} fill="transparent">
			<title>{readingOf(slot)}</title>
		</rect>
	{/each}
</svg>

<!-- `role="img"` prunes the plot's own subtree, tooltips included, so the per-slot
     readings are announced here or nowhere. -->
<div class="sr-only">
	{#each points as point, i (i)}
		<p>{readingOf(point)}</p>
	{/each}
</div>

<div class="mt-text-2xs flex flex-wrap gap-grid-md text-xs text-ty-silent">
	<span class="flex items-center gap-grid-2xs">
		<!-- The dash is the second channel, so the swatch carries it too — as two
		     segments rather than a raw gradient var(). -->
		<span class="flex w-4 gap-grid-2xs">
			<span class="h-0.5 w-1.5 bg-brand"></span>
			<span class="h-0.5 w-1.5 bg-brand"></span>
		</span>
		{m.metric_completion_rate()}
	</span>
	<span class="flex items-center gap-grid-2xs">
		<span class="h-0.5 w-4 rounded-lg bg-brand-counter"></span>
		{m.metric_yield_index()}
	</span>
</div>
