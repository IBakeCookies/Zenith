<script lang="ts">
	import * as m from '$lib/paraglide/messages.js';
	import { BAND_BAR_CLASS, BAND_TEXT_CLASS, bandLabel } from '$lib/presentation/utils/band';
	import { cn } from '$lib/presentation/utils';
	import type { DayTimeline } from '$lib/presentation/utils/day-timeline';
	import { scrollByDrag } from '$lib/presentation/utils/drag-scroll';
	import { formatDuration, formatDurationBand } from '$lib/presentation/utils/duration-format';

	let {
		totalHours,
		minimumBlockWidths,
		blocks,
		class: className,
	}: DayTimeline & { class?: string } = $props();

	const share = (hours: number) => hours / totalHours;
</script>

<!-- No card and no visible title: the strip reads inside the Plan card, under its
     heading. The name stays for a screen reader — nothing else says what these are. -->
<section class={cn(className)}>
	<h3 class="sr-only">{m.day_timeline_title()}</h3>
	{#if blocks.length === 0}
		<p class="text-sm text-ty-secondary">{m.day_timeline_empty()}</p>
	{:else}
		<!-- The strip scrolls sideways in its own container and the DOCUMENT does not: the
		     one place on either task screen that still scrolls at all. -->
		<!-- svelte-ignore a11y_no_noninteractive_tabindex -- a scrollable region has to be
		     scrollable by keyboard, and a block is not focusable -->
		<div
			class="nice-scrollbar mt-text-md cursor-grab overflow-x-auto active:cursor-grabbing"
			tabindex="0"
			{@attach scrollByDrag}
		>
			<!-- The floor is the TRACK's width, so every block keeps its share of the day and
			     the strip grows rather than one shrinking below reading — `--spacer-day-block`. -->
			<div
				class="relative h-16 bg-surface-inset"
				style="width: max(100%, calc(var(--spacing-day-block) * {minimumBlockWidths}))"
			>
				{#each blocks as block (block.id)}
					{@const label = bandLabel(block.band)}
					<div
						class="absolute inset-y-0 flex flex-col gap-text-2xs rounded-md bg-surface-inset px-box-3xs py-text-2xs"
						class:opacity-60={block.isCompleted}
						style="left: {share(block.startOffset) * 100}%; width: {share(block.hours) * 100}%"
					>
						<div class="flex items-baseline gap-text-3xs">
							<p
								class="capitalize min-w-0 flex-1 truncate text-2xs {block.isCompleted
									? 'text-ty-silent line-through'
									: 'text-ty-primary'}"
							>
								{#if !block.isCompleted}
									<span class="text-flow">#{block.position}</span>
								{/if}
								{block.title}
							</p>
							<p class="shrink-0 text-2xs text-ty-secondary tabular-nums">
								{formatDuration(block.hours)}
							</p>
						</div>
						<!-- The ± is ϕ's own, so only the arrival carries one. The sentence wears the
						     band its bar is filled with — the two are one reading — and a finished block
						     goes quiet, since `opacity-60` takes a band under 4.5:1. -->
						<p
							class="truncate text-2xs {BAND_TEXT_CLASS[
								block.isCompleted ? 'neutral' : block.band
							]}"
						>
							{block.band === 'success'
								? m.flow_reached({
										duration: formatDurationBand(block.flowHours, block.flowHoursStd),
									})
								: m.flow_short({
										duration: formatDuration(block.flowHours - block.hours),
									})}
						</p>
						<!-- How far the allocation gets toward flow arrival, in the band's own fill.
						     `mt-auto` pins it to the block's floor, so the bars read against each other
						     whether or not each block kept its sentence. -->
						<div class="mt-auto h-1 w-full rounded-full bg-surface-card">
							<div
								class="h-full rounded-full {BAND_BAR_CLASS[block.band]}"
								style="width: {Math.min(1, block.hours / block.flowHours) * 100}%"
							></div>
						</div>
						<!-- Colour is otherwise the only thing separating the two bands (WCAG 1.4.1). -->
						{#if label}
							<span class="sr-only">{label}</span>
						{/if}
						{#if block.isCompleted}
							<span class="sr-only">{m.day_timeline_done()}</span>
						{/if}
					</div>
				{/each}
			</div>
		</div>
	{/if}
</section>
