<script lang="ts">
	/* The scale a reading sits on, in the band it reads in — which is what makes
	   an out-of-the-ordinary reading findable without reading any of the numbers.
	   The fill stops at the end of its track; the value does not, because over
	   100% is the reading.

	   Where it sits is the caller's: a tile sets its distance from the note above
	   it, a row the width it takes between the label and the hours. */

	import type { MetricTrack } from '$lib/presentation/type';
	import { cn } from '$lib/presentation/utils';
	import { BAND_BAR_CLASS, type Band } from '$lib/presentation/utils/band';

	interface Props {
		track: MetricTrack;
		band: Band;
		class?: string;
	}

	let { track, band, class: className }: Props = $props();
</script>

{#if track.kind === 'pips'}
	<!-- Not `band-track`: its fill would show through the gaps in the colour an
	     unfilled pip already is, and the pips would read as one bar. Each pip is
	     its own track. -->
	<div class={cn('flex h-1 gap-grid-2xs', className)}>
		{#each Array(track.total), index}
			<span
				class="band-fill flex-1 {index < track.filled ? BAND_BAR_CLASS[band] : 'bg-surface-inset'}"
			></span>
		{/each}
	</div>
{:else}
	<div class={cn('band-track', className)}>
		<div
			class="band-fill {BAND_BAR_CLASS[band]}"
			style="width: {Math.min(100, Math.max(0, (track.filled / track.total) * 100))}%"
		></div>
	</div>
{/if}
