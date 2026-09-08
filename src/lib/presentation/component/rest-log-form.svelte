<script lang="ts">
	import * as m from '$lib/paraglide/messages.js';
	import { cn } from '$lib/presentation/utils';
	import * as Tooltip from '$lib/presentation/component/ui/tooltip';
	import MeasurementFormActions from '$lib/presentation/component/measurement-form-actions.svelte';
	import {
		MEASUREMENT_FORM_CLASS,
		MEASUREMENT_MINUTES_CLASS,
		RATING_INPUT_CLASS,
	} from '$lib/presentation/utils/measurement-prompt';

	/** The five numbers a break is, as this form holds them — minutes on the way in,
	 *  hours on the way out, since MATH.md §8.9 fits r in hours. */
	type RestDraft = {
		minutes: number | null;
		mindBefore: number | null;
		mindAfter: number | null;
		bodyBefore: number | null;
		bodyAfter: number | null;
	};

	interface Props {
		/** The break this editor opened on, when it opened on a stored one — the
		 *  analytics history's ✎, which is ☕'s only editor. Omitted for a
		 *  break being logged for the first time. */
		seed?: RestDraft;
		/** A completed pre/post pair, in the units MATH.md §8.9 fits r from: hours
		 *  rested, and both capacities rated 0–10 before and after. */
		onsave: (entry: {
			hours: number;
			mindBefore: number;
			mindAfter: number;
			bodyBefore: number;
			bodyAfter: number;
		}) => void;
		oncancel: () => void;
		class?: string;
	}

	let {
		seed = {
			minutes: null,
			mindBefore: null,
			mindAfter: null,
			bodyBefore: null,
			bodyAfter: null,
		},
		onsave,
		oncancel,
		class: className,
	}: Props = $props();

	const id = $props.id();

	// The ☕ editor's own draft, unlike the 🪫 one: a break has no task row to hang off
	// and no completion that opens it, so nothing outside this form gates on it.
	//
	// Why a copy, and why re-opening is a remount: presentation/AGENTS.md, "A seeded editor
	// copies its seed at mount".
	// svelte-ignore state_referenced_locally -- deliberately initial-value only
	let draft = $state<RestDraft>({
		...seed,
	});

	function save() {
		const minutes = Number(draft.minutes);
		const { mindBefore, mindAfter, bodyBefore, bodyAfter } = draft;

		if (!minutes || minutes <= 0) return;

		// An empty rating is not a rating of 0 — `Number(null)` is a finite 0. MATH.md
		// §8.9 reads the pair as a decay (`d_after = d_before · e^(−r·m·g)`), so a blank
		// "after" invents "the break left me at zero", which fits r → ∞ and drags the
		// estimate to its upper bound. 0 is legitimate, so the test is emptiness, not
		// falsiness. `required` on the fields is what makes the refusal visible.
		if (mindBefore === null || mindAfter === null || bodyBefore === null || bodyAfter === null)
			return;

		onsave({
			hours: minutes / 60,
			mindBefore,
			mindAfter,
			bodyBefore,
			bodyAfter,
		});
	}
</script>

<Tooltip.Provider>
	<form
		class={cn(MEASUREMENT_FORM_CLASS, 'border-info-tint', className)}
		onsubmit={(e) => (e.preventDefault(), save())}
	>
		<label class="flex items-center gap-grid-2xs">
			{m.energy_rest_rested_label()}
			<!-- Always focuses: both ways in are a click asking for this editor — the ☕ button
		     and the analytics ✎ — so the caret is always
		     asked for. Not `autofocus` — the document's autofocus-processed flag is set
		     at load, so the attribute is inert on any node inserted afterwards. -->
			<input
				id="{id}-minutes"
				type="number"
				min="1"
				max="480"
				placeholder={m.task_minutes_placeholder()}
				{@attach (node) => node.focus()}
				bind:value={draft.minutes}
				required
				class={MEASUREMENT_MINUTES_CLASS.info}
			/>
		</label>
		<span class="flex items-center gap-grid-2xs">
			{m.energy_rest_before_label()}
			<Tooltip.Root>
				<Tooltip.Trigger>
					{#snippet child({ props })}
						<label class="flex items-center gap-grid-2xs">
							<span class="font-medium text-mind">{m.energy_drain_mind_label()}</span>
							<input
								{...props}
								id="{id}-mind-before"
								type="number"
								min="0"
								max="10"
								step="1"
								bind:value={draft.mindBefore}
								required
								class={RATING_INPUT_CLASS.mind}
							/>
						</label>
					{/snippet}
				</Tooltip.Trigger>
				<Tooltip.Content side="top">
					<p>{m.energy_rest_mind_title()}</p>
				</Tooltip.Content>
			</Tooltip.Root>
			<Tooltip.Root>
				<Tooltip.Trigger>
					{#snippet child({ props })}
						<label class="flex items-center gap-grid-2xs">
							<span class="font-medium text-body">{m.energy_drain_body_label()}</span>
							<input
								{...props}
								id="{id}-body-before"
								type="number"
								min="0"
								max="10"
								step="1"
								bind:value={draft.bodyBefore}
								required
								class={RATING_INPUT_CLASS.body}
							/>
						</label>
					{/snippet}
				</Tooltip.Trigger>
				<Tooltip.Content side="top">
					<p>{m.energy_rest_body_title()}</p>
				</Tooltip.Content>
			</Tooltip.Root>
		</span>
		<span class="flex items-center gap-grid-2xs">
			{m.energy_rest_after_label()}
			<Tooltip.Root>
				<Tooltip.Trigger>
					{#snippet child({ props })}
						<label class="flex items-center gap-grid-2xs">
							<span class="font-medium text-mind">{m.energy_drain_mind_label()}</span>
							<input
								{...props}
								id="{id}-mind-after"
								type="number"
								min="0"
								max="10"
								step="1"
								bind:value={draft.mindAfter}
								required
								class={RATING_INPUT_CLASS.mind}
							/>
						</label>
					{/snippet}
				</Tooltip.Trigger>
				<Tooltip.Content side="top">
					<p>{m.energy_rest_mind_title()}</p>
				</Tooltip.Content>
			</Tooltip.Root>
			<Tooltip.Root>
				<Tooltip.Trigger>
					{#snippet child({ props })}
						<label class="flex items-center gap-grid-2xs">
							<span class="font-medium text-body">{m.energy_drain_body_label()}</span>
							<input
								{...props}
								id="{id}-body-after"
								type="number"
								min="0"
								max="10"
								step="1"
								bind:value={draft.bodyAfter}
								required
								class={RATING_INPUT_CLASS.body}
							/>
						</label>
					{/snippet}
				</Tooltip.Trigger>
				<Tooltip.Content side="top">
					<p>{m.energy_rest_body_title()}</p>
				</Tooltip.Content>
			</Tooltip.Root>
		</span>
		<MeasurementFormActions accentClass="text-info" {oncancel} />
	</form>
</Tooltip.Provider>
