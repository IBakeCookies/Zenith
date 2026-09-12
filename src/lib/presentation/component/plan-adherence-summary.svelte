<script lang="ts">
	/* The verdict first, then the two matches it was read from, each drawn as a
	   bar on a 0–100% scale — never scaled to each other, which would draw a
	   four-point gap as a landslide. Both fills are neutral: a low match says the
	   planner was wrong as readily as that the user strayed. */

	import type { PlanAudit } from '$lib/business/model/plan-audit';
	import type { MetricTrack as Track } from '$lib/presentation/type';
	import * as m from '$lib/paraglide/messages.js';
	import MetricTrack from '$lib/presentation/component/metric-track.svelte';
	import { formatDecimals } from '$lib/presentation/utils/number-format';
	import { adherenceVerdict } from '$lib/presentation/utils/plan-audit-descriptor';

	interface Props {
		audit: PlanAudit;
		locale: string;
		class?: string;
	}

	let { audit, locale, class: className }: Props = $props();

	const match = (label: string, overlap: number): { label: string; track: Track } => ({
		label,
		track: {
			kind: 'bar',
			filled: Math.round(overlap * 100),
			total: 100,
		},
	});

	const matches = $derived([
		match(m.ana_adherence_classic(), audit.classicOverlap),
		match(m.ana_adherence_energy(), audit.energyOverlap),
	]);

	const spreads = $derived(
		(
			[
				[m.ana_adherence_spread_you(), audit.actualTaskSpread],
				[m.ana_adherence_spread_classic(), audit.classicTaskSpread],
				[m.ana_adherence_spread_energy(), audit.energyTaskSpread],
			] as const
		).map(([label, value]) => ({
			label,
			value: formatDecimals(value, 1, locale),
		})),
	);
</script>

<div class={className}>
	<p class="text-sm text-ty-primary">
		{adherenceVerdict(audit)} ·
		<span class="text-ty-silent"
			>{audit.usedCount === 1
				? m.ana_adherence_days_one()
				: m.ana_adherence_days_other({
						count: audit.usedCount,
					})}</span
		>
	</p>

	<!-- label · bar · figure on one line, the reading `tag-hours-card.svelte` gives
	     its rows beside this card. Subgrid for the same reason: one label column for
	     both rows, sized to the longer of the two rather than to a guess. -->
	<ul class="mt-text-md grid grid-cols-[auto_1fr_auto] items-center gap-x-grid-xs gap-y-text-xs">
		{#each matches as { label, track } (label)}
			<li class="col-span-3 grid grid-cols-subgrid items-center">
				<span class="max-w-40 text-xs text-ty-silent">{label}</span>
				<MetricTrack {track} band="neutral" class="min-w-0" />
				<span class="text-sm font-medium tabular-nums text-ty-primary">{track.filled}%</span>
			</li>
		{/each}
	</ul>

	<div class="mt-text-md flex flex-wrap items-baseline gap-x-grid-lg gap-y-text-2xs">
		<span class="text-xs text-ty-silent">{m.ana_adherence_spread()}</span>
		{#each spreads as { label, value } (label)}
			<span class="figure-cell">
				<span class="figure">{value}</span>
				<span>{label}</span>
			</span>
		{/each}
	</div>
</div>
