<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { expect } from 'storybook/test';
	import type { TrendSeries } from '$lib/presentation/utils/metric-trend-series';
	import { DASH } from '$lib/presentation/utils/series-runs';
	import MetricTrendChart from '$lib/presentation/component/metric-trend-chart.svelte';

	/** The shape `metricTrendSeries` hands over, spelled out so a story can bend it. */
	const line = (
		label: string,
		values: (number | null)[],
		hue: 'danger' | 'mind' | 'body',
		dash?: string,
	): TrendSeries => ({
		label,
		values,
		// Spelled out in the util for Tailwind's scanner; a story is not scanned
		// for classes it only passes through, so the template is safe here.
		strokeClass: `stroke-${hue}`,
		fillClass: `fill-${hue}`,
		dash,
	});

	const WEEK = ['Jul 25', 'Jul 26', 'Jul 27', 'Jul 28', 'Jul 29', 'Jul 30', 'Jul 31'];

	const threeLines = (burnout: (number | null)[]): TrendSeries[] => [
		line('Burnout Risk', burnout, 'danger'),
		line('Cognitive Load', [40, 55, 62, 48, 51, 70, 66], 'mind', DASH.dotted),
		line('Physical Load', [10, 12, 8, 20, 15, 9, 11], 'body', DASH.dashed),
	];

	const { Story } = defineMeta({
		title: 'Component/Metric Trend Chart',
		component: MetricTrendChart,
		tags: ['autodocs'],
		args: {
			labels: WEEK,
			series: threeLines([12, 18, 25, 21, 30, 44, 38]),
			ariaLabel: 'Burnout risk and load over the last 7 days',
		},
	});
</script>

<Story
	name="Week"
	play={async ({ args, canvas, canvasElement }) => {
		// The ordinary week: three unbroken lines and a legend that names them
		// The aria-label is the plot's only accessible name
		await expect(
			canvas.getByRole('img', {
				name: args.ariaLabel,
			}),
		).toBeInTheDocument();

		// One unbroken segment per series
		for (const stroke of ['stroke-danger', 'stroke-mind', 'stroke-body'])
			await expect(canvasElement.querySelectorAll(`path.${stroke}`)).toHaveLength(1);

		// One line style per series, never two series sharing one: --mind and --body
		// are two greens of the same lightness on `terminal`, and STYLE.md's rule is
		// that NO pairing of declared tokens survives every theme, so this holds for
		// the danger/mind pair too. Solid is Burnout Risk's, the reading the card is
		// named for.
		const styleOf = (stroke: string) =>
			canvasElement.querySelector(`path.${stroke}`)?.getAttribute('stroke-dasharray');

		await expect(styleOf('stroke-danger')).toBe(null);
		await expect(styleOf('stroke-mind')).toBe(DASH.dotted);
		await expect(styleOf('stroke-body')).toBe(DASH.dashed);

		// Draw order is the legend's, which puts the SOLID line at the BOTTOM. A solid
		// line in front hides whatever it crosses outright; the dotted and dashed ones
		// over it cut only where their own strokes land, so the reading underneath
		// shows through the gaps. `completion-yield-chart` draws its dashed rate over
		// its solid yield for the same reason.
		const drawOrder = [...canvasElement.querySelectorAll('svg > g')].map((group) =>
			group.querySelector('path[stroke-width]')?.getAttribute('class'),
		);

		await expect(drawOrder).toEqual(['stroke-danger', 'stroke-mind', 'stroke-body']);

		// Each line is cut out of the ones over it, so a crossing shows which is in
		// front. The dashed Physical line is drawn last, cut by nothing and needing no
		// mask; Burnout, drawn first, is cut by the two above it.
		const cutsPerMask = [...canvasElement.querySelectorAll('mask')].map(
			(mask) => mask.querySelectorAll('path[stroke=black]').length,
		);

		await expect(cutsPerMask).toEqual([2, 1]);

		await expect([...canvasElement.querySelectorAll('svg > g')].at(-1)).not.toHaveAttribute('mask');

		// Each plot's masks are its own — `$props.id()` per instance, which is what
		// lets the autodocs page hold every story of this file at once.
		const maskIds = [...canvasElement.querySelectorAll('mask')].map((mask) => mask.id);

		await expect(new Set(maskIds).size).toBe(2);

		await expect(
			[...canvasElement.querySelectorAll('g[mask]')].map((g) => g.getAttribute('mask')),
		).toEqual(maskIds.map((id) => `url(#${id})`));

		// The cut repeats its own line's dasharray, or a coinciding line underneath is
		// cut away whole rather than showing through the gaps. With the solid line at
		// the bottom, NO cut is solid — so no crossing can hide a reading completely.
		await expect(
			[...canvasElement.querySelectorAll('mask path[stroke=black]')].map((cut) =>
				cut.getAttribute('stroke-dasharray'),
			),
		).toEqual([DASH.dotted, DASH.dashed, DASH.dashed]);

		// The legend swatch is the line, not a bar in its colour — same stroke, same
		// dasharray, so a dotted series cannot show up solid in the key.
		// Each key wraps its swatch in a <span>; the plot's own <line>s (the gridlines)
		// sit directly under the plot <svg>, so this reaches only the swatches.
		const swatches = [...canvasElement.querySelectorAll('span svg line')];

		await expect(swatches.map((swatch) => swatch.getAttribute('stroke-dasharray'))).toEqual([
			null,
			DASH.dotted,
			DASH.dashed,
		]);

		// The first day reads 12%, which sits at 12 + 142·(1 − 0.12) = 137.0
		const first = canvasElement
			.querySelector('path.stroke-danger')
			?.getAttribute('d')
			?.match(/^M[\d.]+,([\d.]+)/)?.[1];

		await expect(Number(first)).toBeCloseTo(137, 0);

		// The first and last days sit ON the plot edges, so a centred label there
		// hangs half outside the viewBox and is clipped — "Jul 31" rendered as
		// "Jul". Only the edge labels turn; the ones between stay centred.
		const dayLabels = [...canvasElement.querySelectorAll('text')].filter((node) =>
			node.textContent?.startsWith('Jul'),
		);

		await expect(dayLabels[0]).toHaveAttribute('text-anchor', 'start');
		await expect(dayLabels.at(-1)).toHaveAttribute('text-anchor', 'end');
		await expect(dayLabels[3]).toHaveAttribute('text-anchor', 'middle');

		await expect(canvas.getByText('Cognitive Load')).toBeInTheDocument();
	}}
>
	{#snippet template(args)}
		<div class="card-shell max-w-3xl rounded-xl p-box-lg">
			<MetricTrendChart {...args} />
		</div>
	{/snippet}
</Story>

<Story
	name="Unrecorded days"
	args={{
		series: threeLines([12, null, null, 21, 30, null, 38]),
		ariaLabel: 'Burnout risk and load over the last 7 days',
	}}
	play={async ({ canvasElement }) => {
		// Days the user never opened the app. The line has to BREAK there: joining across the gap
		// invents a reading, and drawing a 0 invents a good day.
		// Three runs — [12], [21, 30], [38] — so two paths and one lone dot
		await expect(canvasElement.querySelectorAll('path.stroke-danger')).toHaveLength(1);
		await expect(canvasElement.querySelectorAll('circle.fill-danger')).toHaveLength(2);

		// The series that HAS every day is still one unbroken line
		await expect(canvasElement.querySelectorAll('path.stroke-mind')).toHaveLength(1);
		await expect(canvasElement.querySelectorAll('circle.fill-mind')).toHaveLength(0);
	}}
>
	{#snippet template(args)}
		<div class="card-shell max-w-3xl rounded-xl p-box-lg">
			<MetricTrendChart {...args} />
		</div>
	{/snippet}
</Story>

<Story
	name="Month"
	args={{
		labels: Array.from(
			{
				length: 30,
			},
			(_, i) => (i % 5 === 0 ? `Jul ${i + 1}` : ''),
		),
		series: [
			line(
				'Burnout Risk',
				Array.from(
					{
						length: 30,
					},
					(_, i) => 20 + ((i * 13) % 60),
				),
				'danger',
			),
		],
		ariaLabel: 'Burnout risk over the last 30 days',
	}}
	play={async ({ canvasElement }) => {
		// The month axis: 30 slots, and only the ticks the util asked for are printed
		const printed = [...canvasElement.querySelectorAll('text')].map((node) =>
			node.textContent?.trim(),
		);

		await expect(printed).toContain('Jul 1');
		await expect(printed).toContain('Jul 6');
		await expect(printed).not.toContain('Jul 2');

		// A single series draws no legend — its name is the card heading above it.
		// The plot is then the only <svg> on the card; each legend key adds one.
		await expect(canvasElement.querySelectorAll('svg')).toHaveLength(1);
	}}
>
	{#snippet template(args)}
		<div class="card-shell max-w-3xl rounded-xl p-box-lg">
			<MetricTrendChart {...args} />
		</div>
	{/snippet}
</Story>

<Story
	name="No data in any slot"
	args={{
		series: threeLines([null, null, null, null, null, null, null]).map((s) => ({
			...s,
			values: s.values.map(() => null),
		})),
		ariaLabel: 'Burnout risk and load over the last 7 days',
	}}
	play={async ({ canvasElement }) => {
		// Nothing recorded anywhere in the range: the axis stays, so the plot reads as empty rather
		// than broken
		await expect(canvasElement.querySelectorAll('path[stroke-width]')).toHaveLength(0);
		await expect(canvasElement.querySelectorAll('circle')).toHaveLength(0);

		const ticks = [...canvasElement.querySelectorAll('text')].map((node) =>
			node.textContent?.trim(),
		);

		await expect(ticks).toContain('0');
		await expect(ticks).toContain('100');
	}}
>
	{#snippet template(args)}
		<div class="card-shell max-w-3xl rounded-xl p-box-lg">
			<MetricTrendChart {...args} />
		</div>
	{/snippet}
</Story>

<Story
	name="Single day"
	args={{
		labels: ['Jul 31'],
		series: [line('Burnout Risk', [44], 'danger')],
		ariaLabel: 'Burnout risk',
	}}
	play={async ({ canvasElement }) => {
		// One recorded day. There is no line to draw, so the reading has to survive as a dot — the case
		// a polyline-only chart renders as an empty plot.
		await expect(canvasElement.querySelectorAll('path.stroke-danger')).toHaveLength(0);

		const dot = canvasElement.querySelector('circle.fill-danger');

		// Centred, not pinned to the left edge where a (i / (n − 1)) axis puts a
		// division by zero
		await expect(Number(dot?.getAttribute('cx'))).toBeCloseTo(413, 0);
	}}
>
	{#snippet template(args)}
		<div class="card-shell max-w-3xl rounded-xl p-box-lg">
			<MetricTrendChart {...args} />
		</div>
	{/snippet}
</Story>

<Story
	name="A series shorter than the axis"
	args={{
		labels: Array.from(
			{
				length: 14,
			},
			(_, i) => `Jul ${18 + i}`,
		),
		series: [line('Burnout Risk', [12, 18, 25, 21, 30, 44, 38], 'danger')],
		ariaLabel: 'Burnout risk over the last 14 days',
	}}
	play={async ({ canvasElement }) => {
		// One slot per LABEL, so seven readings under a fortnight's axis stop at the seventh
		// day rather than stretching to the right edge and standing over the wrong labels.
		const last = canvasElement
			.querySelector('path.stroke-danger')
			?.getAttribute('d')
			?.match(/L([\d.]+),[\d.]+$/)?.[1];

		await expect(Number(last)).toBeCloseTo(383.8, 1);
	}}
>
	{#snippet template(args)}
		<div class="card-shell max-w-3xl rounded-xl p-box-lg">
			<MetricTrendChart {...args} />
		</div>
	{/snippet}
</Story>
