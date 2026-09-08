<script lang="ts">
	import * as m from '$lib/paraglide/messages.js';
	import { cn } from '$lib/presentation/utils';
	import type { DayTimeline } from '$lib/presentation/utils/day-timeline';
	import { formatOffset } from '$lib/presentation/utils/duration-format';

	let { totalHours, blocks, class: className }: DayTimeline & { class?: string } = $props();

	const ticks = $derived(
		Array.from(
			{
				length: Math.floor(totalHours) + 1,
			},
			(_, hour) => hour,
		),
	);
</script>

<!-- The axis reads inside the Plan card above the ledger, and the rails on the rows
     share its scale: `px-box-2xs` is the row's own padding, so `0h` sits over offset
     zero of every rail. The name stays for a screen reader. -->
<section class={cn('px-box-2xs', className)}>
	<h3 class="sr-only">{m.day_timeline_title()}</h3>
	{#if blocks.length === 0}
		<p class="text-sm text-ty-secondary">{m.day_timeline_empty()}</p>
	{:else}
		<div class="relative h-4 border-b border-line-strong text-2xs text-ty-silent tabular-nums">
			{#each ticks as hour (hour)}
				<span class="absolute -translate-x-1/2" style="left: {(hour / totalHours) * 100}%">
					{formatOffset(hour)}
				</span>
			{/each}
		</div>
	{/if}
</section>
