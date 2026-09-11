<script lang="ts">
	import * as m from '$lib/paraglide/messages.js';
	import { cn } from '$lib/presentation/utils';
	import { BAND_HATCH_CLASS } from '$lib/presentation/utils/band';
	import { type DayBlock, RAIL_SEGMENT_CLASS } from '$lib/presentation/utils/day-timeline';
	import { formatDuration } from '$lib/presentation/utils/duration-format';

	interface Props {
		block: DayBlock;
		/** The day the block is a share of. */
		totalHours: number;
		class?: string;
	}

	let { block, totalHours, class: className }: Props = $props();

	const share = (hours: number) => (hours / totalHours) * 100;
	// One hue per rail: the hatch's stripes and the ghost's dashes are both
	// `currentColor`, so nothing on a rail contradicts the row's verdict.
	const ink = $derived(BAND_HATCH_CLASS[block.band]);
</script>

<!-- `overflow-hidden` is what clips a block past the day's end. The ghost comes last
     so its dashes paint over the switch fill they share the track with. -->
<div
	class={cn(
		'relative h-2 lg:h-3 overflow-hidden rounded-lg bg-surface-inset',
		block.isCompleted && 'opacity-60',
		className,
	)}
>
	<div
		class="absolute inset-y-0 {RAIL_SEGMENT_CLASS.warmup} {ink}"
		style="left: {share(block.startOffset)}%; width: {share(block.warmupHours)}%"
	>
		<span class="sr-only">{m.day_legend_warmup()}</span>
	</div>
	{#if block.inFlowHours > 0}
		<div
			class="absolute inset-y-0 {RAIL_SEGMENT_CLASS.inFlow}"
			style="left: {share(block.startOffset + block.warmupHours)}%; width: {share(
				block.inFlowHours,
			)}%"
		>
			<span class="sr-only">{m.day_legend_in_flow()}</span>
		</div>
	{/if}
	{#if block.switchHours > 0}
		<div
			class="absolute top-1/2 -translate-y-1/2 h-1/4 {RAIL_SEGMENT_CLASS.switch}"
			style="left: {share(block.startOffset + block.hours)}%; width: {share(block.switchHours)}%"
		>
			<span class="sr-only"
				>{m.day_legend_switch({
					duration: formatDuration(block.switchHours),
				})}</span
			>
		</div>
	{/if}
	{#if block.ghostHours > 0}
		<div
			class="absolute inset-y-0 {RAIL_SEGMENT_CLASS.ghost} {ink}"
			style="left: {share(block.startOffset + block.hours)}%; width: {share(block.ghostHours)}%"
		>
			<span class="sr-only">{m.day_legend_ghost()}</span>
		</div>
	{/if}
</div>
