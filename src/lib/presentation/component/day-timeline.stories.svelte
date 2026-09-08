<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { expect } from 'storybook/test';
	import type { DayBlock } from '$lib/presentation/utils/day-timeline';
	import DayTimeline from '$lib/presentation/component/day-timeline.svelte';

	const block: DayBlock = {
		id: 1,
		hours: 1,
		startOffset: 0,
		warmupHours: 1,
		inFlowHours: 0,
		ghostHours: 0.1,
		switchHours: 0,
		band: 'warning',
		isCompleted: false,
	};

	const { Story } = defineMeta({
		title: 'Component/Day Timeline',
		component: DayTimeline,
		tags: ['autodocs'],
		args: {
			totalHours: 3,
			blocks: [block],
		},
	});
</script>

<Story
	name="One tick per hour"
	play={async ({ canvas }) => {
		for (const tick of ['0h', '1h', '2h', '3h']) {
			await expect(canvas.getByText(tick)).toBeVisible();
		}
	}}
/>

<Story
	name="No time of day"
	play={async ({ canvas }) => {
		// Offsets from the day's zero, never a clock: `availableHours` is intended work,
		// not a span of the day (presentation/AGENTS.md).
		expect(canvas.queryByText(/\d{2}:\d{2}/)).toBeNull();
	}}
/>

<Story
	name="Nothing funded"
	args={{
		blocks: [],
	}}
	play={async ({ canvas }) => {
		// A day with tasks and no funded block still has something to say.
		await expect(canvas.getByText('Nothing is funded today')).toBeInTheDocument();
	}}
/>
