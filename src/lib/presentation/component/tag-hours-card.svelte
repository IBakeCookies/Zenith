<script lang="ts">
	import Check from '@lucide/svelte/icons/check';
	import Pencil from '@lucide/svelte/icons/pencil';
	import X from '@lucide/svelte/icons/x';
	import type { TagHoursBreakdown } from '$lib/business/model/tags';
	import * as m from '$lib/paraglide/messages.js';
	import MetricTrack from '$lib/presentation/component/metric-track.svelte';
	import { cn } from '$lib/presentation/utils';

	interface Props {
		breakdown: TagHoursBreakdown | null;
		hasFailed: boolean;
		locale: string;
		onrename: (from: string, to: string) => void;
		ondelete: (tag: string) => void;
		/** Whether saving `draft` over `from` folds two rows into one. Asked of the
		 *  caller because a component may not value-import a model. */
		willMerge: (from: string, draft: string) => boolean;
		class?: string;
	}

	let {
		breakdown,
		hasFailed,
		locale,
		ondelete,
		onrename,
		willMerge,
		class: className,
	}: Props = $props();

	const id = $props.id();

	// Rounded here rather than in the fold, which has to stay exact: the parts add
	// up to the "Logged hours" tile this card breaks down.
	const hours = (value: number) =>
		value.toLocaleString(locale, {
			maximumFractionDigits: 1,
		});

	// The untagged row last, and only when there is one: it is the coverage
	// disclosure, not a slot the card always keeps. `tag` is absent on it — it is
	// not a tag, so it does not get a rename button.
	const rows = $derived(
		breakdown === null
			? []
			: [
					...breakdown.tags.map((row) => ({
						label: row.tag,
						tag: row.tag,
						hours: row.hours,
					})),
					...(breakdown.untaggedHours > 0
						? [
								{
									label: m.ana_tag_hours_untagged(),
									tag: undefined,
									hours: breakdown.untaggedHours,
								},
							]
						: []),
				],
	);

	// The rows' own sum, never the "Logged hours" tile: a task carrying two tags
	// counts under both, so against the tile a bar could overrun its own track.
	const total = $derived(rows.reduce((sum, row) => sum + row.hours, 0));

	let editingTag = $state<string | null>(null);
	let draft = $state('');
	let confirmingTag = $state<string | null>(null);

	// A range change takes rows out of the list, and neither of the two above
	// names a row that has to still be there: coming back would re-open the editor
	// on a stale draft, or re-arm the delete — focused, since its cancel attaches
	// focus. The page does the same for the log rows on the same event.
	$effect(() => {
		if (editingTag !== null && !rows.some((row) => row.tag === editingTag)) editingTag = null;

		if (confirmingTag !== null && !rows.some((row) => row.tag === confirmingTag))
			confirmingTag = null;
	});

	// The ✎ toggles, the way the log rows' does.
	function toggleEditor(tag: string) {
		if (editingTag === tag) {
			editingTag = null;

			return;
		}

		editingTag = tag;
		draft = tag;
	}

	function save(tag: string) {
		// `required` passes on a field holding only spaces, and the store normalizes
		// that to the empty tag and refuses it — closing here would report a rename
		// that never ran.
		if (draft.trim().length === 0) return;

		editingTag = null;
		onrename(tag, draft);
	}

	function remove(tag: string) {
		confirmingTag = null;
		ondelete(tag);
	}
</script>

<div class={cn('card-shell rounded-xl p-box-lg', className)}>
	<h2 class="text-sm font-medium text-ty-primary">{m.ana_tag_hours()}</h2>
	<p class="mt-text-3xs text-xs text-ty-silent">{m.ana_tag_hours_hint()}</p>

	{#if hasFailed}
		<p class="mt-text-md text-sm text-danger-strong">{m.error_title()}</p>
	{:else if breakdown === null}
		<p class="mt-text-md text-sm text-ty-silent">{m.ana_loading()}</p>
	{:else if rows.length === 0}
		<p class="mt-text-md text-sm text-ty-secondary">{m.ana_tag_hours_empty()}</p>
	{:else}
		<!-- A grid, not a row of flex boxes: the label column has to be one width for
		     every row, or a long tag — or the ✎ ✕ pair a tag row has and the untagged row
		     has not — starts that row's bar at its own x. The list owns the three
		     columns and each row takes them by subgrid, so the column sizes to the
		     longest label the card actually holds rather than to a guess. -->
		<ul class="mt-text-md grid grid-cols-[auto_1fr_auto] items-center gap-x-grid-xs gap-y-text-xs">
			<!-- Keyed on the tag, never the label: a locale whose untagged label is a legal
			     tag (zh's 无标签) collides, and a duplicate key crashes the card. -->
			{#each rows as row (row.tag ?? null)}
				<li class="col-span-3 grid grid-cols-subgrid items-center">
					<div class="flex items-center gap-grid-2xs">
						<!-- Capped and wrapping: an unbroken 40-character tag would otherwise push
						     the column past the track it is supposed to leave room for. -->
						<div class="max-w-40 text-xs break-words text-ty-silent">{row.label}</div>

						{#if row.tag !== undefined}
							{@const tag = row.tag}
							<!-- A tag comes off every day it was ever put on and nothing hands it
							     back, so the ✕ only arms; the confirm focuses cancel, so a stray
							     Enter cannot drop one. -->
							{#if confirmingTag === tag}
								<button
									type="button"
									aria-label={m.ana_tag_hours_delete_confirm({
										tag,
									})}
									class="row-action text-xs font-medium text-danger hover:text-danger-strong"
									onclick={() => remove(tag)}
								>
									{m.ana_tag_hours_delete_prompt()}
								</button>
								<button
									type="button"
									class="row-action text-xs text-ty-silent hover:text-ty-secondary"
									{@attach (node: HTMLElement) => node.focus()}
									onclick={() => (confirmingTag = null)}
								>
									{m.common_cancel()}
								</button>
							{:else}
								<button
									type="button"
									aria-label={m.ana_tag_hours_rename({
										tag,
									})}
									class="row-action text-ty-silent hover:text-ty-secondary"
									onclick={() => toggleEditor(tag)}
								>
									<Pencil />
								</button>
								<button
									type="button"
									aria-label={m.ana_tag_hours_delete({
										tag,
									})}
									class="row-action text-ty-silent hover:text-danger"
									onclick={() => (confirmingTag = tag)}
								>
									<X />
								</button>
							{/if}
						{/if}
					</div>

					<!-- Between the label column and the hours, so the row reads
					     label · share · hours. Unbanded: nothing here judges a tag. -->
					<MetricTrack
						track={{
							kind: 'bar',
							filled: row.hours,
							total,
						}}
						band="neutral"
						class="min-w-0"
					/>

					<span class="text-sm font-medium text-ty-primary">
						<span class="tabular-nums">{hours(row.hours)}</span>
						{m.unit_hours()}
					</span>

					{#if row.tag !== undefined && editingTag === row.tag}
						{@const tag = row.tag}
						<form
							class="col-span-3 flex flex-wrap items-end gap-grid-2xs rounded-lg border border-line-soft bg-surface-wash p-box-lg"
							onsubmit={(e) => (e.preventDefault(), save(tag))}
						>
							<label class="flex-1 text-2xs text-ty-silent">
								{m.ana_tag_hours_rename_field()}
								<!-- Not `autofocus`: the attribute is inert on a node inserted after load. -->
								<input
									id="{id}-rename"
									type="text"
									bind:value={draft}
									required
									aria-describedby={willMerge(tag, draft) ? `${id}-merge` : undefined}
									{@attach (node) => node.focus()}
									class="field-input"
								/>
							</label>
							<button
								type="submit"
								aria-label={m.ana_tag_hours_rename_save()}
								class="row-action text-brand"
							>
								<Check />
							</button>
							<button
								type="button"
								aria-label={m.ana_tag_hours_rename_cancel()}
								class="row-action text-ty-silent hover:text-ty-primary"
								onclick={() => (editingTag = null)}
							>
								<X />
							</button>
							<!-- `role="alert"`, and named from the field: the merge is irreversible and
							     appears mid-typing, so it has to reach a reader who cannot see it. -->
							{#if willMerge(tag, draft)}
								<p id="{id}-merge" role="alert" class="w-full text-2xs text-ty-secondary">
									{m.ana_tag_hours_rename_merge()}
								</p>
							{/if}
						</form>
					{/if}
				</li>
			{/each}
		</ul>
		<!-- After the rows, not in the hint: why they can out-total the tile is a fact
		     about the rows themselves. -->
		<p class="mt-text-xs text-xs text-ty-silent">{m.ana_tag_hours_double_count()}</p>
	{/if}
</div>
