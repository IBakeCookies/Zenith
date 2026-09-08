<script lang="ts">
	import * as m from '$lib/paraglide/messages.js';
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import type { AdviceDisplay, AdviceFact } from '$lib/presentation/utils/plan-advice-descriptor';
	import { BAND_TEXT_CLASS, bandLabel, type Band } from '$lib/presentation/utils/band';
	import { Button } from '$lib/presentation/component/ui/button';
	import MetricLabel from '$lib/presentation/component/metric-label.svelte';
	import { cn } from '$lib/presentation/utils';

	interface Props {
		/** Null until the user asks: the search costs a full solve per candidate. */
		advice: AdviceDisplay | null;
		isBusy: boolean;
		/** The day moved after this was calculated (presentation/AGENTS.md, Components). */
		isStale: boolean;
		/** What the day every defer lever sends to already holds (ROADMAP item 21). */
		destination: AdviceFact | null;
		/** The last check failed; the advice shown (if any) predates the failure. */
		hasError: boolean;
		oncheck: () => void;
		/** Perform a defer-task option: move that task to tomorrow's plan. */
		onapply: (taskId: number) => void;
		/**
		 * Takes the lever's UNROUNDED hours: only the label rounds, so a budget
		 * retyped from what the card shows is one the model never priced.
		 */
		onapplybudget: (hours: number) => void;
		class?: string;
	}

	let {
		advice,
		isBusy,
		isStale,
		destination,
		hasError,
		oncheck,
		onapply,
		onapplybudget,
		class: className,
	}: Props = $props();
</script>

<div class={cn('card-shell p-box-md sm:p-box-xl', className)}>
	<div class="flex items-start justify-between gap-grid-xs">
		<div class="min-w-0">
			<h3 class="text-xs font-semibold text-ty-secondary uppercase tracking-wider">
				{m.advice_title()}
			</h3>
			<p class="mt-text-xs text-xs text-ty-silent">{m.advice_desc()}</p>
		</div>
		<Button variant="outline" size="sm" disabled={isBusy} onclick={oncheck}>
			{isBusy ? m.advice_working() : advice === null ? m.advice_check() : m.advice_recheck()}
		</Button>
	</div>

	{#if hasError}
		<p
			class="mt-grid-sm rounded-lg border border-danger-tint bg-danger-wash p-box-sm text-xs text-danger-strong"
		>
			{m.advice_error()}
		</p>
	{/if}

	{#if advice === null}
		<p class="mt-grid-sm text-sm text-ty-secondary">{m.advice_unrun()}</p>
	{:else}
		<!-- Also the only statement of WHY the levers below are disabled: a disabled
		     button is not focusable, so it cannot carry that reason itself. It reads
		     before them, and Recheck — the way out — stays enabled beside it. -->
		{#if isStale}
			<p
				class="mt-grid-sm rounded-lg border border-warning-tint bg-warning-wash p-box-sm text-xs text-warning-strong"
			>
				{m.advice_stale()}
			</p>
		{/if}

		<!-- The day-level readings, tiled: none of the three is a lever, so none is a
		     row in the menu below. A missing destination leaves two tiles, never an
		     empty third (ROADMAP item 21). -->
		<div class="mt-grid-sm grid gap-text-xs sm:grid-flow-col sm:auto-cols-fr">
			{#each [advice.marginal, advice.switchCost] as fact (fact.label)}
				{@render tile(fact)}
			{/each}
			{#if destination}
				{@render tile(destination)}
			{/if}
		</div>

		<!-- One paragraph per task, never one joined sentence: each carries its own
		     reason, and two run together read as one claim about both. Keyed by
		     position, never by the words: two tasks sharing a title and a branch
		     spell the same sentence, and a duplicate key crashes the card. -->
		{#each advice.unfunded as sentence, index (index)}
			<p class="mt-grid-sm text-xs text-ty-secondary">{sentence}</p>
		{/each}

		<!-- Louder than the plain unfunded lines: the menu below has no lever for these. -->
		{#each advice.unfundedMustDo as sentence, index (index)}
			<p class="mt-grid-sm text-xs text-warning-strong">{sentence}</p>
		{/each}

		{#if advice.rows.length > 0}
			<ul class="mt-grid-sm space-y-grid-sm">
				{#each advice.rows as row (row.axis)}
					<li class="rounded-xl border border-line-soft p-box-sm">
						<div class="flex items-baseline justify-between gap-grid-xs">
							<span class="text-xs font-medium text-ty-secondary">{row.label}</span>
							<span class={cn('text-sm font-semibold', BAND_TEXT_CLASS[row.beforeBand])}
								>{row.before}</span
							>
							{@render bandText(row.beforeBand)}
						</div>
						<!-- An axis the search came back empty on, said out loud: a reading with
						     nothing under it otherwise reads as a rendering failure. -->
						{#if row.options.length === 0}
							<p class="mt-text-xs text-xs text-ty-silent">{m.advice_no_lever()}</p>
						{:else}
							<!-- One grid owns the tracks; the head, the list and every option are
							     subgrids of it, so auto-sized columns line up down the axis while
							     the options stay a real list. Below sm the reading sits under its
							     lever, so the head that named it has nothing to sit over. -->
							<div
								class="mt-text-xs grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-text-md gap-y-text-xs sm:grid-cols-[minmax(0,1fr)_auto_auto_auto]"
							>
								<div class="col-span-full grid grid-cols-subgrid text-xs text-ty-silent">
									<span>{m.advice_col_lever()}</span>
									<span class="hidden sm:block">{m.advice_col_reading()}</span>
									<MetricLabel
										text={m.advice_col_plan_value()}
										description={m.advice_plan_value_tooltip()}
										class="text-right text-ty-silent sm:col-start-3"
									/>
								</div>
								<ul class="col-span-full grid grid-cols-subgrid gap-y-text-xs">
									<!-- Keyed on the lever, never the option's words: two tasks sharing a
									     title spell the same action, and a duplicate key crashes the card. -->
									{#each row.options as option (option.lever)}
										{@const lever = option.lever}
										<!-- Every option is ruled off from the one above; the unpriced increase gets a
										     dashed rule, because it is off the frontier and priced in something else. -->
										<li
											class={cn(
												'col-span-full grid grid-cols-subgrid items-center gap-y-text-xs border-t border-line-soft pt-text-xs',
												option.isUnpriced && 'border-dashed',
											)}
										>
											<span
												class="col-start-1 row-start-1 flex min-w-0 flex-col gap-y-text-2xs text-xs"
											>
												<span class="wrap-break-word text-ty-primary">{option.action}</span>
												{#if option.profileFlip}
													<span class="text-ty-silent">{option.profileFlip}</span>
												{/if}
											</span>
											<span
												class="col-start-1 row-start-2 flex items-center gap-text-2xs text-xs sm:col-start-2 sm:row-start-1"
											>
												<span class="text-ty-silent">{row.before}</span>
												<ArrowRight class="size-3 text-ty-silent" aria-hidden="true" />
												<span class={cn('font-semibold', BAND_TEXT_CLASS[option.afterBand])}
													>{option.after}</span
												>
												{@render bandText(option.afterBand)}
											</span>
											<span
												class="col-start-2 row-start-1 text-right text-xs text-ty-silent sm:col-start-3"
												>{option.cost}</span
											>
											<!-- A deferral prices "off today" while the button commits to a
											     destination: the aria-label carries both, and the task title. -->
											<span
												class="col-start-2 row-start-2 justify-self-end sm:col-start-4 sm:row-start-1"
											>
												{#if lever.kind === 'defer-task'}
													<Button
														variant="outline"
														size="sm"
														disabled={isBusy || isStale}
														aria-label={m.advice_apply_label({
															title: lever.title,
														})}
														onclick={() => onapply(lever.taskId)}
													>
														{m.advice_apply()}
													</Button>
												{:else}
													<Button
														variant="outline"
														size="sm"
														disabled={isBusy || isStale}
														onclick={() => onapplybudget(lever.hours)}
													>
														{option.applyLabel}
													</Button>
												{/if}
											</span>
										</li>
									{/each}
								</ul>
							</div>
						{/if}
					</li>
				{/each}
			</ul>
			<!-- Unfunded tasks are a read, not a band: a day can be in band everywhere
			     and still leave work with no hours, which "this day is fine" negates. -->
		{:else if advice.unfunded.length === 0 && advice.unfundedMustDo.length === 0}
			<p class="mt-grid-sm text-xs text-success-strong">{m.advice_clear()}</p>
		{/if}
	{/if}
</div>

{#snippet tile(fact: AdviceFact)}
	<div class="min-w-0 rounded-lg bg-surface-inset p-box-sm">
		<span class="block text-xs tracking-wider text-ty-silent uppercase">{fact.label}</span>
		<span class="block text-sm font-semibold wrap-break-word text-ty-primary">{fact.primary}</span>
		{#if fact.secondary !== null}
			<span class="block text-xs text-ty-silent">{fact.secondary}</span>
		{/if}
	</div>
{/snippet}

<!-- The band is otherwise carried by colour alone (WCAG 1.4.1). Sibling of the
     value, never nested, so the value element's text stays exactly the reading. -->
{#snippet bandText(band: Band)}
	{@const judged = bandLabel(band)}
	{#if judged}
		<span class="sr-only">({judged})</span>
	{/if}
{/snippet}
