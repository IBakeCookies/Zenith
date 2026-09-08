<script lang="ts">
	import * as m from '$lib/paraglide/messages.js';
	import { cn } from '$lib/presentation/utils';
	import { BAND_HATCH_CLASS } from '$lib/presentation/utils/band';
	import { RAIL_SEGMENT_CLASS } from '$lib/presentation/utils/day-timeline';
	import { formatDuration } from '$lib/presentation/utils/duration-format';

	interface Props {
		/** The day's own switch cost, printed as a duration. */
		switchHours: number;
		class?: string;
	}

	let { switchHours, class: className }: Props = $props();

	// No rail draws a switch segment at 0, so there is none to explain.
	// Warming up is the one thing both bands do, so its key is grey: a rail's own hatch
	// is amber or green and a key cannot be both. A shortfall only ever reads amber.
	const items = $derived([
		[`${RAIL_SEGMENT_CLASS.warmup} ${BAND_HATCH_CLASS.neutral}`, m.day_legend_warmup()],
		[RAIL_SEGMENT_CLASS.inFlow, m.day_legend_in_flow()],
		[`${RAIL_SEGMENT_CLASS.ghost} ${BAND_HATCH_CLASS.warning}`, m.day_legend_ghost()],
		...(switchHours > 0
			? [
					[
						RAIL_SEGMENT_CLASS.switch,
						m.day_legend_switch({
							duration: formatDuration(switchHours),
						}),
					],
				]
			: []),
	]);
</script>

<ul
	class={cn(
		'flex flex-wrap items-center gap-x-text-md gap-y-text-2xs text-2xs text-ty-silent',
		className,
	)}
>
	{#each items as [swatch, label] (swatch)}
		<li class="flex items-center gap-text-xs">
			<span class="h-1.5 w-6 shrink-0 rounded-lg {swatch}" aria-hidden="true"></span>
			{label}
		</li>
	{/each}
</ul>
