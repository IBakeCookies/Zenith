<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { expect } from 'storybook/test';
	import { BAND_HATCH_CLASS } from '$lib/presentation/utils/band';
	import DayLegend from '$lib/presentation/component/day-legend.svelte';

	const { Story } = defineMeta({
		title: 'Component/Day Legend',
		component: DayLegend,
		tags: ['autodocs'],
		args: {
			switchHours: 0.75,
		},
	});
</script>

<Story
	name="Default"
	play={async ({ canvas }) => {
		// The switch is printed as the day's own duration: a legend that says `15m switch`
		// when the switch cost is 45m is a legend about another day.
		const items = canvas.getAllByRole('listitem');

		expect(items).toHaveLength(4);
		expect(items[3]).toHaveTextContent('45m switch');

		// Warming up is the one thing both bands do, so its swatch names the pattern in
		// grey — a rail's own hatch is amber or green, and a key cannot be both.
		const warmup = items[0].firstElementChild!;

		expect(warmup).toHaveClass('text-ty-ghost');
		expect(warmup).not.toHaveClass(BAND_HATCH_CLASS.warning);
	}}
/>

<Story
	name="No switch cost"
	args={{
		switchHours: 0,
	}}
	play={async ({ canvas }) => {
		// No rail draws a switch segment at 0, so the legend has none to explain.
		expect(canvas.getAllByRole('listitem')).toHaveLength(3);
	}}
/>
