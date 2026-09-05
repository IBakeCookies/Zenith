<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { expect } from 'storybook/test';
	import type { Metric } from '$lib/presentation/type';
	import MetricHeadlineStrip from '$lib/presentation/component/metric-headline-strip.svelte';

	/* The band is the banding policy's output (utils/band.ts) — the component owns
	   the colour and the screen-reader wording it renders from it. */
	const metrics: Metric[] = [
		// The four headline readings, drawn as tiles — two banded, two not, so the
		// grid is exercised with both. The rest are here to prove they are NOT.
		{
			headline: true,
			group: 'worth',
			label: 'Completion Rate',
			value: '45%',
			description: 'Priority-weighted progress through the plan.',
			band: 'neutral',
		},
		{
			headline: true,
			group: 'worth',
			label: 'Flow Coverage',
			value: '3/4',
			description: 'Tasks funded past their time-to-flow.',
			band: 'neutral',
		},
		{
			headline: true,
			group: 'fit',
			label: 'Human Capacity',
			value: '104%',
			description: 'Planned load against the capacity pools — may read over 100%.',
			band: 'warning',
		},
		{
			headline: true,
			group: 'endurance',
			label: 'Burnout Risk',
			value: 'Critical',
			description: 'Sustained load against recovery over the trailing window.',
			band: 'critical',
		},
		{
			group: 'worth',
			label: 'Fallow Gain',
			value: '+18%',
			description: 'Improvement over a naive equal split of the same hours.',
			band: 'success',
		},
		{
			group: 'worth',
			label: 'Yield Index',
			value: '82%',
			description: 'Share of the achievable output this allocation reaches.',
			band: 'success',
		},
		{
			group: 'fit',
			label: 'Time Scarcity',
			value: '62%',
			description: 'How stretched the time budget is against demand.',
			band: 'warning',
		},
		{
			group: 'fit',
			label: 'Primary Bottleneck',
			// A task title, so this is the row that stress-tests a long value against
			// its label. Neutral on purpose: naming a task is not a verdict on it.
			value: 'Write the quarterly report',
			description: 'Largest draw on the capacity pool that binds the day.',
			band: 'neutral',
		},
	];

	const { Story } = defineMeta({
		title: 'Component/Metric Headline Strip',
		component: MetricHeadlineStrip,
		tags: ['autodocs'],
		args: {
			metrics,
			momentum: 0.4,
		},
	});
</script>

<Story
	name="Upward momentum"
	play={async ({ canvas, canvasElement }) => {
		// The verdict on the day, before the setup that produces it: four tiles and
		// nothing else. The reference readings are a separate card under the plan.
		await expect(canvas.getByText('Burnout Risk')).toBeVisible();
		await expect(canvas.getByText('104%')).toBeVisible();
		expect(canvas.queryByText('Yield Index')).toBeNull();

		// Momentum is one badge carrying its own tooltip: the state alone named
		// nothing once the label it sat beside was gone.
		await expect(canvas.getByText('Momentum: Upward')).toBeVisible();

		// Each judged band carries text a screen reader hears; the two neutral tiles
		// (Completion Rate and Flow Coverage) are the default value colour, make no
		// claim, and stay silent.
		await expect(canvas.getByText('(Critical)')).toBeInTheDocument();
		expect(canvasElement.querySelectorAll('.sr-only')).toHaveLength(2);
	}}
/>

<Story
	name="Reset required"
	args={{
		momentum: -0.4,
	}}
	play={async ({ canvas }) => {
		await expect(canvas.getByText('Momentum: Reset Reqd')).toBeVisible();
	}}
/>

<Story
	name="Stable"
	args={{
		momentum: 0,
	}}
	play={async ({ canvas }) => {
		await expect(canvas.getByText('Momentum: Stable')).toBeVisible();
	}}
/>

<Story
	name="No momentum"
	args={{
		momentum: null,
	}}
	play={async ({ canvas }) => {
		// No history yet: the badge names the reading and reads N/A
		await expect(canvas.getByText('Momentum: N/A')).toBeVisible();
	}}
/>
