<script lang="ts">
	import type { Metric, MetricGroup } from '$lib/presentation/type';
	import * as m from '$lib/paraglide/messages.js';
	import { cn } from '$lib/presentation/utils';
	import MetricBandText from '$lib/presentation/component/metric-band-text.svelte';
	import MetricLabel from '$lib/presentation/component/metric-label.svelte';
	import { BAND_TEXT_CLASS } from '$lib/presentation/utils/band';

	interface Props {
		metrics: Metric[];
		class?: string;
	}

	let { metrics, class: className }: Props = $props();

	// A column per question, in the order a day is asked about. Every reading
	// answers one, the headline four included — they are repeated here rather than
	// left out, because a column titled with a question that omits the reading
	// answering it best is worse than reading a number twice, and the tiles are a
	// screen away above the day's setup. Empty columns are dropped: a title over
	// nothing is a question the card cannot answer.
	const questions: { group: MetricGroup; title: string }[] = [
		{
			group: 'fit',
			title: m.metric_group_fit(),
		},
		{
			group: 'worth',
			title: m.metric_group_worth(),
		},
		{
			group: 'cost',
			title: m.metric_group_cost(),
		},
		{
			group: 'endurance',
			title: m.metric_group_endurance(),
		},
	];

	const columns = $derived(
		questions
			.map((question) => ({
				...question,
				readings: metrics.filter((item) => item.group === question.group),
			}))
			.filter((column) => column.readings.length > 0),
	);
</script>

<!-- A grid of four columns, not the `columns-4` flow this was: the flow keeps a
     reading's descriptor neighbours beside it but has nowhere to hang a heading,
     and the heading is what makes a reading findable by the question that sent
     the reader looking for it. -->
<div class={cn('card-shell p-box-md sm:p-box-xl', className)}>
	<div class="grid grid-cols-1 gap-grid-lg sm:grid-cols-2 lg:grid-cols-4">
		{#each columns as column (column.group)}
			<section>
				<!-- `h2`, not `h3`: the page's only heading above these is the sr-only
				     `h1`, and skipping a level is what `heading-order` catches. -->
				<h2 class="mb-text-2xs text-xs font-semibold text-ty-primary">{column.title}</h2>
				{#each column.readings as item (item.label)}
					<div
						class="flex items-baseline justify-between gap-text-xs border-b border-line-soft py-text-2xs"
					>
						<MetricLabel text={item.label} description={item.description} />
						<!-- A `span`, not a `p`: `e2e/time-budget.e2e.ts` tells the headline tile from
						     this row by which of the two draws its value in a direct-child `<p>`. -->
						<span
							class="text-right text-sm font-semibold tabular-nums capitalize {BAND_TEXT_CLASS[
								item.band
							]}">{item.value}</span
						>
						<MetricBandText band={item.band} />
					</div>
				{/each}
			</section>
		{/each}
	</div>
</div>
