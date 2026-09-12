<script lang="ts">
	import type { Metric } from '$lib/presentation/type';
	import * as m from '$lib/paraglide/messages.js';
	import { cn } from '$lib/presentation/utils';
	import * as Tooltip from '$lib/presentation/component/ui/tooltip';
	import { Badge } from '$lib/presentation/component/ui/badge';
	import MetricBandText from '$lib/presentation/component/metric-band-text.svelte';
	import MetricLabel from '$lib/presentation/component/metric-label.svelte';
	import MetricTrack from '$lib/presentation/component/metric-track.svelte';
	import { BAND_TEXT_CLASS } from '$lib/presentation/utils/band';

	interface Props {
		metrics: Metric[];
		momentum: number | null;
		class?: string;
	}

	let { metrics, momentum, class: className }: Props = $props();

	// Every reading at equal weight is a spreadsheet: Burnout Risk read exactly
	// like Avg Enjoyment. The headline readings are the verdict on the day and
	// come before the setup that produces it; the rest read under the plan.
	const headline = $derived(metrics.filter((item) => item.headline));

	// Only the sign is rendered, by both the badge's fill and its wording. `-0`
	// (Math.round of a small negative) compares equal to 0, so it reads as stable.
	const trend = $derived(momentum === null ? null : Math.sign(momentum));
</script>

<div class={cn('card-shell p-box-md sm:p-box-xl', className)}>
	<!-- Momentum is the leading column of the same row the tiles sit in, so the
	     verdict reads as one line and not two stacked ones; below `lg` there is no
	     width for a fifth column and it keeps a row of its own. -->
	<div class="grid grid-cols-2 gap-grid-sm lg:grid-cols-[auto_repeat(4,minmax(0,1fr))]">
		<!-- Momentum names itself inside the badge: the state alone ("Stable") is a
		     word with no subject once nothing sits beside it, so the badge is both the
		     reading and its own tooltip trigger. tailwind-merge lets `class` win the
		     fill and the ink, so the variant only picks tinted vs. plain: a
		     `destructive` branch would style nothing and name a severity the warning
		     fill contradicts. -->
		<div class="col-span-2 lg:col-span-1 lg:border-r lg:border-line-soft lg:pr-box-md">
			<Tooltip.Provider>
				<Tooltip.Root>
					<Tooltip.Trigger>
						{#snippet child({ props })}
							<Badge
								{...props}
								variant={trend ? 'default' : 'outline'}
								class={trend === 1
									? 'bg-success-tint text-success-strong'
									: trend === -1
										? 'bg-warning-tint text-warning-strong'
										: ''}
							>
								{m.momentum_badge({
									state:
										trend === null
											? m.na_value()
											: trend === 1
												? m.momentum_upward()
												: trend === -1
													? m.momentum_reset_required()
													: m.momentum_stable(),
								})}
							</Badge>
						{/snippet}
					</Tooltip.Trigger>
					<Tooltip.Content side="left">
						<p>{m.momentum_tooltip()}</p>
					</Tooltip.Content>
				</Tooltip.Root>
			</Tooltip.Provider>
		</div>

		{#each headline as item (item.label)}
			<div>
				<MetricLabel text={item.label} description={item.description} />
				<p
					class="mt-text-3xs text-2xl font-medium leading-tight tabular-nums capitalize wrap-anywhere {BAND_TEXT_CLASS[
						item.band
					]}"
				>
					{item.value}
				</p>
				<MetricBandText band={item.band} />
				{#if item.track}
					<MetricTrack track={item.track} band={item.band} class="mt-text-2xs" />
				{/if}
			</div>
		{/each}
	</div>
</div>
