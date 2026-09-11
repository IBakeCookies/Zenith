<script lang="ts">
	/* The analytics Load trend card: one slot per label, every series on the same
	   0–100% axis its readings are already given on. What a slot stands for is
	   `metricTrendSeries`' to decide — a day, or a calendar month on the year range.

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
	// on the slot it stands for.
	const anchorAt = (x: number) => {
		if (x <= CHART.left) return 'start';

		if (x >= CHART.left + innerW) return 'end';

		return 'middle';
	};

	// The LAST line drawn is the one in front, and a SOLID line in front hides
	// whatever it crosses outright. So the plot keeps `series` order — solid first,
	// at the bottom — and the dotted and dashed lines over it cut only where their
	// own strokes land, letting it show through their gaps.
	// `completion-yield-chart` stacks its pair the same way.
	const drawn = $derived(plotted);

	// Per-instance, because a document can hold more than one plot — the autodocs
	// page mounts every story of this file at once — and a shared mask id would have
	// the second plot cut against the first one's lines (STYLE.md on `$props.id()`).
	const maskId = $props.id();

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

	<!-- Each line is cut by a fat copy of every line ABOVE it, so a crossing shows
	     which of the three is in front (STYLE.md, "mask out the lower one"). Each cut
	     repeats its own line's dasharray, which is what keeps two readings that
	     coincide both visible: the gaps cut nothing, so the line underneath shows
	     through them. With the solid line at the bottom no cut is solid, so no
	     crossing hides a reading. The topmost series is cut by nothing. -->
	{#each drawn as line, i (line.label)}
		{@const above = drawn.slice(i + 1)}
		{#if above.length > 0}
			<mask
				id="{maskId}-{i}"
				maskUnits="userSpaceOnUse"
				x="0"
				y="0"
				width={CHART.w}
				height={CHART.h}
			>
				<!-- `white`/`black` are the mask's keep/cut channel, not colours to tokenise. -->
				<path d="M0,0H{CHART.w}V{CHART.h}H0Z" fill="white" />
				{#each above as over (over.label)}
					{#each over.paths as path (path)}
						<path
							d={path}
							fill="none"
							stroke="black"
							stroke-width="4.4"
							stroke-linejoin="round"
							stroke-dasharray={over.dash}
						/>
					{/each}
				{/each}
			</mask>
		{/if}

		<g mask={above.length > 0 ? `url(#${maskId}-${i})` : undefined}>
			{#each line.paths as path (path)}
				<path
					d={path}
					fill="none"
					stroke-width="1.8"
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-dasharray={line.dash}
					class={line.strokeClass}
				/>
			{/each}
			{#each line.dots as dot (dot.x)}
				<circle cx={dot.x} cy={dot.y} r="2.2" class={line.fillClass} />
			{/each}
		</g>
	{/each}
</svg>

{#if series.length > 1}
	<div class="mt-text-2xs flex flex-wrap gap-grid-md text-xs text-ty-silent">
		{#each series as line (line.label)}
			<span class="flex items-center gap-grid-2xs">
				<!-- The same stroke with the same dasharray — the pair of `bg-*` spans this
				     replaced could not draw a dotted line at all. 20 wide so `dashed` reads
				     as dash-gap-dash. -->
				<svg width="20" height="4" aria-hidden="true" class="shrink-0">
					<line
						x1="0"
						y1="2"
						x2="20"
						y2="2"
						stroke-width="2"
						stroke-linecap="round"
						stroke-dasharray={line.dash}
						class={line.strokeClass}
					/>
				</svg>
				{line.label}
			</span>
		{/each}
	</div>
{/if}
