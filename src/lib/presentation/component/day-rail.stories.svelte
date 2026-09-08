<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { expect } from 'storybook/test';
	import { BAND_BAR_CLASS, BAND_HATCH_CLASS } from '$lib/presentation/utils/band';
	import type { DayBlock } from '$lib/presentation/utils/day-timeline';
	import DayRail from '$lib/presentation/component/day-rail.svelte';

	/* One hour funded of a 1.1h time-to-flow: the block the rail exists for. */
	const block = (over: Partial<DayBlock> = {}): DayBlock => ({
		id: 1,
		hours: 1,
		startOffset: 0,
		warmupHours: 1,
		inFlowHours: 0,
		ghostHours: 0.1,
		switchHours: 0,
		band: 'warning',
		isCompleted: false,
		...over,
	});

	/** A segment, by the name it gives a screen reader; the track is its parent. */
	const segment = (
		canvas: { getByText: (name: string | RegExp) => HTMLElement },
		name: string | RegExp,
	) => canvas.getByText(name).parentElement!;

	const share = (element: Element) =>
		element.getBoundingClientRect().width / element.parentElement!.getBoundingClientRect().width;

	const { Story } = defineMeta({
		title: 'Component/Day Rail',
		component: DayRail,
		render: template,
		tags: ['autodocs'],
		args: {
			totalHours: 3,
			block: block(),
		},
	});
</script>

{#snippet template(args: { totalHours: number; block: DayBlock })}
	<div class="max-w-sm">
		<DayRail {...args} />
	</div>
{/snippet}

<Story
	name="Short of flow"
	play={async ({ canvas }) => {
		// Hatch for the hour funded, a dashed ghost for the six minutes flow still needed
		// right after it, and nothing solid: the task never got there.
		const warmup = segment(canvas, 'warming up');
		const ghost = segment(canvas, 'what flow still needs');

		expect(share(warmup)).toBeCloseTo(1 / 3, 2);
		expect(ghost.getBoundingClientRect().left).toBeCloseTo(warmup.getBoundingClientRect().right, 0);
		expect(canvas.queryByText('in flow')).toBeNull();

		// Every segment of a rail is inked by the block's band, so a rail short of flow
		// reads amber throughout rather than mixing the flow hue into its tail.
		expect(warmup).toHaveClass(BAND_HATCH_CLASS.warning);
		expect(ghost).toHaveClass(BAND_HATCH_CLASS.warning);
	}}
/>

<Story
	name="Past flow"
	args={{
		block: block({
			hours: 1.5,
			warmupHours: 1,
			inFlowHours: 0.5,
			ghostHours: 0,
			band: 'success',
		}),
	}}
	play={async ({ canvas }) => {
		expect(share(segment(canvas, 'warming up'))).toBeCloseTo(1 / 3, 2);
		expect(share(segment(canvas, 'in flow'))).toBeCloseTo(1 / 6, 2);
		expect(canvas.queryByText('what flow still needs')).toBeNull();

		// In flow is the success band's own fill, and the warm-up before it inks to match:
		// one rail, one hue, said by whether the plan reaches flow at all.
		expect(segment(canvas, 'in flow')).toHaveClass(BAND_BAR_CLASS.success);
		expect(segment(canvas, 'warming up')).toHaveClass(BAND_HATCH_CLASS.success);
	}}
/>

<Story
	name="With a switch cost"
	args={{
		block: block({
			switchHours: 0.25,
		}),
	}}
	play={async ({ canvas }) => {
		// Drawn, not left as empty track: a gap on a rail three rows from the next rail
		// is not readable as a thing.
		const warmup = segment(canvas, 'warming up');
		const switching = segment(canvas, /switch$/);

		expect(share(switching)).toBeCloseTo(1 / 12, 2);

		expect(switching.getBoundingClientRect().left).toBeCloseTo(
			warmup.getBoundingClientRect().right,
			0,
		);
	}}
/>

<Story
	name="Last block"
	play={async ({ canvas }) => {
		// The last block's switch leads nowhere.
		expect(canvas.queryByText(/switch$/)).toBeNull();
	}}
/>

<Story
	name="Past the day's end"
	args={{
		block: block({
			startOffset: 2,
			hours: 1.5,
			warmupHours: 1,
			inFlowHours: 0.5,
			ghostHours: 0,
			band: 'success',
		}),
	}}
	play={async ({ canvas }) => {
		// Switch costs push the last block past `availableHours`; the track clips its tail
		// rather than scaling the day's `0h…Nh` to it. Hit-tested just past the track's
		// right edge, since a clipped box still reports its full rectangle.
		const track = segment(canvas, 'warming up').parentElement!;
		const { right, top, height } = track.getBoundingClientRect();
		const beyond = document.elementFromPoint(right + 2, top + height / 2);

		expect(beyond).not.toBeNull();
		expect(track.contains(beyond)).toBe(false);
	}}
/>

<Story
	name="Finished"
	args={{
		block: block({
			isCompleted: true,
		}),
	}}
	play={async ({ canvas }) => {
		// The rail is the plan, which does not move when a box is ticked; it dims like
		// the row's title and nothing else marks it.
		expect(segment(canvas, 'warming up').parentElement).toHaveClass('opacity-60');
	}}
/>

<Story
	name="Named without colour"
	args={{
		block: block({
			switchHours: 0.25,
		}),
	}}
	play={async ({ canvas }) => {
		// Hatch and solid already separate the segments without colour (WCAG 1.4.1); the
		// names are for the reader who gets neither.
		for (const name of ['warming up', 'what flow still needs', /switch$/]) {
			expect(canvas.getByText(name)).toHaveClass('sr-only');
		}
	}}
/>
