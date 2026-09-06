<script lang="ts">
	import type { TagHoursBreakdown } from '$lib/business/model/tags';
	import * as m from '$lib/paraglide/messages.js';
	import { Button } from '$lib/presentation/component/ui/button';

	interface Props {
		breakdown: TagHoursBreakdown | null;
		hasFailed: boolean;
		locale: string;
		onrename: (from: string, to: string) => void;
		ondelete: (tag: string) => void;
		/** Whether saving `draft` over `from` folds two rows into one. Asked of the
		 *  caller because a component may not value-import a model. */
		willMerge: (from: string, draft: string) => boolean;
	}

	let { breakdown, hasFailed, locale, ondelete, onrename, willMerge }: Props = $props();

	// Rounded here rather than in the fold, which has to stay exact: the parts add
	// up to the "Logged hours" tile this card breaks down.
	const hours = (value: number) => (Math.round(value * 10) / 10).toLocaleString(locale);

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

<div class="card-shell mt-grid-xl rounded-xl p-box-lg">
	<h2 class="text-sm font-medium text-ty-primary">{m.ana_tag_hours()}</h2>
	<p class="mt-text-3xs text-xs text-ty-silent">{m.ana_tag_hours_hint()}</p>

	{#if hasFailed}
		<p class="mt-text-md text-sm text-danger-strong">{m.error_title()}</p>
	{:else if breakdown === null}
		<p class="mt-text-md text-sm text-ty-silent">{m.ana_loading()}</p>
	{:else if rows.length === 0}
		<p class="mt-text-md text-sm text-ty-secondary">{m.ana_tag_hours_empty()}</p>
	{:else}
		<ul class="mt-text-md grid gap-text-xs">
			{#each rows as row (row.label)}
				<li>
					<!-- The ✎ and ✕ at the far end, past the hours, where the log rows put theirs. -->
					<div class="flex flex-wrap items-center justify-between gap-x-grid-xs">
						<span class="text-xs text-ty-silent">{row.label}</span>
						<span class="flex items-center gap-grid-2xs">
							<span class="text-sm font-medium text-ty-primary">
								<span style="font-variant-numeric: tabular-nums">{hours(row.hours)}</span>
								{m.unit_hours()}
							</span>
							{#if row.tag !== undefined}
								{@const tag = row.tag}
								<!-- A tag comes off every day it was ever put on and nothing hands it
								     back, so the ✕ only arms; the confirm focuses cancel, so a stray
								     Enter cannot drop one. -->
								{#if confirmingTag === tag}
									<Button
										variant="ghost"
										size="sm"
										type="button"
										aria-label={m.ana_tag_hours_delete_confirm({
											tag,
										})}
										class="text-danger hover:text-danger-strong"
										onclick={() => remove(tag)}
									>
										{m.ana_tag_hours_delete_prompt()}
									</Button>
									<Button
										variant="ghost"
										size="sm"
										type="button"
										class="text-ty-silent"
										{@attach (node: HTMLElement) => node.focus()}
										onclick={() => (confirmingTag = null)}
									>
										{m.common_cancel()}
									</Button>
								{:else}
									<Button
										variant="ghost"
										size="icon-xs"
										type="button"
										aria-label={m.ana_tag_hours_rename({
											tag,
										})}
										class="text-ty-silent hover:text-ty-secondary"
										onclick={() => toggleEditor(tag)}
									>
										✎
									</Button>
									<Button
										variant="ghost"
										size="icon-xs"
										type="button"
										aria-label={m.ana_tag_hours_delete({
											tag,
										})}
										class="text-ty-silent hover:text-danger"
										onclick={() => (confirmingTag = tag)}
									>
										✕
									</Button>
								{/if}
							{/if}
						</span>
					</div>

					{#if row.tag !== undefined && editingTag === row.tag}
						{@const tag = row.tag}
						<form
							class="rounded-lg border border-line-soft bg-surface-page/40 p-box-lg flex flex-wrap items-end gap-grid-2xs"
							onsubmit={(e) => (e.preventDefault(), save(tag))}
						>
							<label class="flex-1 text-2xs text-ty-silent">
								{m.ana_tag_hours_rename_field()}
								<!-- Not `autofocus`: the attribute is inert on a node inserted after load. -->
								<input
									type="text"
									bind:value={draft}
									required
									{@attach (node) => node.focus()}
									class="field-input"
								/>
							</label>
							<Button
								variant="ghost"
								size="icon-xs"
								type="submit"
								aria-label={m.ana_tag_hours_rename_save()}
								class="text-brand"
							>
								✓
							</Button>
							<Button
								variant="ghost"
								size="icon-xs"
								type="button"
								aria-label={m.ana_tag_hours_rename_cancel()}
								class="text-ty-silent"
								onclick={() => (editingTag = null)}
							>
								✕
							</Button>
							{#if willMerge(tag, draft)}
								<p class="w-full text-2xs text-ty-secondary">{m.ana_tag_hours_rename_merge()}</p>
							{/if}
						</form>
					{/if}
				</li>
			{/each}
		</ul>
	{/if}
</div>
