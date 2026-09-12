<script lang="ts">
	/* One grid owns the five tracks; the head and every row are subgrids of it
	   (presentation/AGENTS.md, settled decisions). Below sm a row folds to three
	   lines — parameter over fitted, sparkline over default, evidence full width —
	   so the fitted and default numbers stack on one right edge, which is the
	   comparison the card exists for. The head has nothing to sit over there, so
	   the default cell says its own name instead. */

	import type { ModelRow } from '$lib/presentation/utils/calibration-descriptor';
	import * as m from '$lib/paraglide/messages.js';
	import { cn } from '$lib/presentation/utils';
	import ParamTrend from '$lib/presentation/component/param-trend.svelte';

	interface Props {
		rows: ModelRow[];
		class?: string;
	}

	let { rows, class: className }: Props = $props();
</script>

<div
	class={cn(
		'grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-text-md gap-y-text-xs sm:grid-cols-[minmax(0,1fr)_auto_auto_auto_minmax(0,2fr)]',
		className,
	)}
>
	<div class="col-span-full hidden grid-cols-subgrid text-xs text-ty-silent sm:grid">
		<span>{m.ana_model_col_parameter()}</span>
		<span>{m.ana_model_col_trend()}</span>
		<span class="text-right">{m.ana_model_col_fitted()}</span>
		<span class="text-right">{m.ana_model_col_default()}</span>
		<span>{m.ana_model_col_evidence()}</span>
	</div>
	<ul class="col-span-full grid grid-cols-subgrid gap-y-text-xs">
		{#each rows as row (row.label)}
			<li
				class="col-span-full grid grid-cols-subgrid items-center gap-y-text-3xs border-t border-line-soft pt-text-xs"
			>
				<span class="col-start-1 row-start-1 text-xs text-ty-silent">{row.label}</span>
				{#if row.trend}
					<ParamTrend
						values={row.trend.values}
						defaultValue={row.trend.defaultValue}
						ariaLabel={row.trend.ariaLabel}
						class="col-start-1 row-start-2 sm:col-start-2 sm:row-start-1"
					/>
				{/if}
				<span
					class="col-start-2 row-start-1 text-right text-sm font-medium tabular-nums text-ty-primary sm:col-start-3"
					>{row.value}</span
				>
				<span
					class="col-start-2 row-start-2 text-right text-xs tabular-nums text-ty-silent sm:col-start-4 sm:row-start-1"
				>
					<span class="sm:sr-only">{m.ana_model_default_prefix()}</span>
					<span>{row.defaultValue}</span>
				</span>
				<span
					class="col-span-full row-start-3 text-xs text-ty-silent sm:col-span-1 sm:col-start-5 sm:row-start-1"
					>{row.evidence}</span
				>
			</li>
		{/each}
	</ul>
</div>
