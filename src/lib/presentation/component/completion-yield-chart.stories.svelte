<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { expect } from 'storybook/test';
	import type { ChartPoint } from '$lib/presentation/utils/completion-chart-points';
	import CompletionYieldChart from '$lib/presentation/component/completion-yield-chart.svelte';

	// The axis prints the date and the tooltip names the weekday, as
	// `completionChartPoints` builds them.
	const WEEKDAYS = ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

	/** `null` is an unrecorded slot; 0 is a day that was planned and went nowhere. */
	const week = (rates: (number | null)[], yields?: (number | null)[]): ChartPoint[] =>
		rates.map((value, i) => ({
			label: `Jul ${25 + i}`,
			full: `${WEEKDAYS[i]}, Jul ${25 + i}`,
			value,
			line: yields ? yields[i] : null,
			sub: value === null ? 'no data' : `${Math.round(value / 25)}/4 tasks done`,
			showLabel: true,
		}));

	const days = (count: number): ChartPoint[] =>
		Array.from(
			{
				length: count,
			},
			(_, i) => ({
				label: `Jul ${i + 1}`,
				full: `Jul ${i + 1}`,
				value: 30 + ((i * 17) % 70),
				line: 40 + ((i * 11) % 55),
				sub: '2/4 tasks done',
				showLabel: i % 5 === 0,
			}),
		);

	const { Story } = defineMeta({
		title: 'Component/Completion & Yield Chart',
		component: CompletionYieldChart,
		tags: ['autodocs'],
		args: {
			points: week([80, 0, 55, null, 100, 40, 65], [90, null, 70, null, 95, 60, 75]),
			ariaLabel: 'Completion rate and yield over the last 7 days',
		},
	});
</script>

<Story
	name="Week"
	play={async ({ args, canvas, canvasElement }) => {
		// The week view, with both of the cases that read alike if the geometry is wrong: Sunday is a
		// recorded 0% (a point on the baseline) and Tuesday is unrecorded (a gap)
		// The aria-label is the plot's only accessible name
		await expect(
			canvas.getByRole('img', {
				name: args.ariaLabel,
			}),
		).toBeInTheDocument();

		// Both readings are lines on one axis. Completion breaks only at Tuesday
		// (no data), so it is two paths; Sunday is a recorded 0% and plots ON the
		// baseline at 12 + 142 = 154, which is what separates it from the gap.
		const rate = canvasElement.querySelectorAll('path.stroke-brand');
		await expect(rate).toHaveLength(2);
		await expect(rate[0].getAttribute('d')).toContain(',154.0');

		// Dashed, which is the second channel separating it from Yield on a theme
		// that gives both hues the same lightness.
		await expect(rate[0].getAttribute('stroke-dasharray')).toBe('10 5');

		// The third channel: the yield line is masked by a fat copy of the rate line,
		// so a crossing cuts the line underneath instead of blending with it. The mask
		// has to repeat the dasharray, or a coinciding yield line is cut away whole
		// rather than showing through the gaps.
		const mask = canvasElement.querySelector('mask');
		const cuts = mask?.querySelectorAll('path[stroke=black]');

		// Asserted before it is compared below, or `url(#undefined)` would match
		// `url(#undefined)` and prove nothing. `$props.id()` mints one per instance,
		// which is what lets the autodocs page hold every story at once.
		await expect(mask?.id).toBeTruthy();

		await expect(cuts).toHaveLength(2);
		await expect(cuts?.[0].getAttribute('stroke-dasharray')).toBe('10 5');
		await expect(cuts?.[0].getAttribute('d')).toBe(rate[0].getAttribute('d'));

		await expect(
			canvasElement.querySelector('path.stroke-brand-counter')?.parentElement?.getAttribute('mask'),
		).toBe(`url(#${mask?.id})`);

		// Yield is recorded on Sat, Mon and Wed–Fri: one path and two lone dots.
		await expect(canvasElement.querySelectorAll('path.stroke-brand-counter')).toHaveLength(1);
		await expect(canvasElement.querySelectorAll('circle.fill-brand-counter')).toHaveLength(2);

		// Every slot is a full-height hover target, data or not
		const slots = canvasElement.querySelectorAll('rect');
		await expect(slots).toHaveLength(7);
		await expect(slots[0].getAttribute('height')).toBe('142');

		// The tooltip carries the rate where there is one and "no data" where not
		await expect(slots[0].querySelector('title')?.textContent).toBe(
			'Sat, Jul 25 — 80% · 3/4 tasks done',
		);

		await expect(slots[3].querySelector('title')?.textContent).toBe('Tue, Jul 28 — no data');
	}}
>
	{#snippet template(args)}
		<div class="card-shell max-w-3xl rounded-xl p-box-lg">
			<CompletionYieldChart {...args} />
		</div>
	{/snippet}
</Story>

<Story
	name="Month"
	args={{
		points: days(30),
		ariaLabel: 'Completion rate and yield over the last 30 days',
	}}
	play={async ({ canvasElement }) => {
		// 30 slots: only every fifth label is drawn, which is the width this axis was
		// tuned for
		// Only the labels the axis asked for are printed
		const labels = [...canvasElement.querySelectorAll('text')].map((node) =>
			node.textContent?.trim(),
		);

		await expect(labels).toContain('Jul 1');
		await expect(labels).toContain('Jul 6');
		await expect(labels).not.toContain('Jul 2');
	}}
>
	{#snippet template(args)}
		<div class="card-shell max-w-3xl rounded-xl p-box-lg">
			<CompletionYieldChart {...args} />
		</div>
	{/snippet}
</Story>

<Story
	name="Two slots"
	args={{
		// Two slots: each reading is centred on its own half of the plot
		points: week([80, 45], [90, 60]),
		ariaLabel: 'Completion rate',
	}}
>
	{#snippet template(args)}
		<div class="card-shell max-w-3xl rounded-xl p-box-lg">
			<CompletionYieldChart {...args} />
		</div>
	{/snippet}
</Story>

<Story
	name="No data in any slot"
	args={{
		// Nothing recorded anywhere: the axis stays, so the plot reads as empty rather than broken
		points: week([null, null, null, null, null, null, null]),
		ariaLabel: 'Completion rate and yield over the last 7 days',
	}}
>
	{#snippet template(args)}
		<div class="card-shell max-w-3xl rounded-xl p-box-lg">
			<CompletionYieldChart {...args} />
		</div>
	{/snippet}
</Story>

<Story
	name="Empty"
	args={{
		points: [],
		ariaLabel: 'Completion rate',
	}}
	play={async ({ canvasElement }) => {
		// No slots at all — the range has not resolved yet
		await expect(canvasElement.querySelectorAll('path.stroke-brand')).toHaveLength(0);
		await expect(canvasElement.querySelectorAll('rect')).toHaveLength(0);

		// The percentage axis stays, so the plot reads as empty rather than broken
		const ticks = [...canvasElement.querySelectorAll('text')].map((node) =>
			node.textContent?.trim(),
		);

		await expect(ticks).toEqual(['0', '25', '50', '75', '100']);
	}}
>
	{#snippet template(args)}
		<div class="card-shell max-w-3xl rounded-xl p-box-lg">
			<CompletionYieldChart {...args} />
		</div>
	{/snippet}
</Story>

<Story
	name="Yield gap"
	args={{
		// A slot the completion line records and the yield line does not: a day that
		// finished nothing has no yield reading, so the line breaks rather than
		// crossing it
		points: week([80, 0, 55, 90, 100], [90, 85, null, 70, 75]),
		ariaLabel: 'Completion rate and yield',
	}}
	play={async ({ canvasElement }) => {
		const paths = canvasElement.querySelectorAll('path.stroke-brand-counter');
		await expect(paths).toHaveLength(2);
	}}
>
	{#snippet template(args)}
		<div class="card-shell max-w-3xl rounded-xl p-box-lg">
			<CompletionYieldChart {...args} />
		</div>
	{/snippet}
</Story>

<Story
	name="One yield reading"
	args={{
		// One recorded slot has no neighbour to draw a line to, so it is a dot —
		// the reading a polyline-only chart would drop entirely
		points: week([80, 0, 55], [null, null, 70]),
		ariaLabel: 'Completion rate and yield',
	}}
	play={async ({ canvasElement }) => {
		await expect(canvasElement.querySelectorAll('path.stroke-brand-counter')).toHaveLength(0);
		await expect(canvasElement.querySelectorAll('circle.fill-brand-counter')).toHaveLength(1);
	}}
>
	{#snippet template(args)}
		<div class="card-shell max-w-3xl rounded-xl p-box-lg">
			<CompletionYieldChart {...args} />
		</div>
	{/snippet}
</Story>
