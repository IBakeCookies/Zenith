<script module lang="ts">
	import type { Task, TaskImportance } from '$lib/business/type';

	/** `mustDoToday`, `importance` and `tags` are required here though optional on a
	 *  stored task: absence there means never flagged / normal / untagged, while a
	 *  control always answers the question. */
	export type TaskEdit = Pick<
		Task,
		'title' | 'physicalDifficulty' | 'mentalDifficulty' | 'enjoyment'
	> & { mustDoToday: boolean; importance: TaskImportance; tags: string[] };
</script>

<script lang="ts">
	import X from '@lucide/svelte/icons/x';
	import * as m from '$lib/paraglide/messages.js';
	import { normalizeTitle } from '$lib/business/utils/title';
	import { cn } from '$lib/presentation/utils';
	import TaskImportanceSelect from '$lib/presentation/component/task-importance-select.svelte';

	interface Props {
		draft: TaskEdit;
		/** The user's own past tags, offered by the field's `<datalist>`. Both forms
		 *  pass it — unlike the title suggestions, which only the add form reads,
		 *  because a picked TAG rewrites nothing. */
		tagVocabulary?: string[];
		class?: string;
	}

	let { draft = $bindable(), tagVocabulary = [], class: className }: Props = $props();

	let entry = $state('');

	// `$props.id()` rather than a literal: both forms can be mounted at once, and one
	// shared list id would point the row editor's field at the dialog's options.
	// Svelte allows one call per component, so the list id is suffixed off it.
	const id = $props.id();
	const listId = `${id}-tag-list`;

	function addTag(raw: string) {
		// The write side's own answer to "the same tag" (`toStoredTags` normalizes
		// then dedupes), or the chips promise a tag the save folds away.
		const tag = normalizeTitle(raw);

		if (tag && !draft.tags.includes(tag)) draft.tags = [...draft.tags, tag];
	}

	function handleTagInput(e: Event & { currentTarget: HTMLInputElement }) {
		// One tag per comma, so a list typed or pasted in one go lands as a list;
		// what follows the last comma is still being typed.
		const fragments = e.currentTarget.value.split(',');

		entry = fragments.pop() ?? '';

		for (const fragment of fragments) addTag(fragment);

		// Written back rather than left to the binding: a lone comma leaves `entry`
		// unchanged, so nothing re-renders and the comma would stay in the field for
		// the next keystroke to file as a tag of its own.
		e.currentTarget.value = entry;
	}

	function handleTagKeydown(e: KeyboardEvent) {
		if (e.key !== 'Enter') return;

		// The form must not see this Enter, or the first tag deploys the task.
		e.preventDefault();
		addTag(entry);
		entry = '';
	}

	// Typing a tag and going straight for the submit files it: the field is a
	// half-finished chip, not a draft the submit may drop — and an uncommitted one
	// would otherwise survive `emptyDraft()` and land on the NEXT task.
	function handleTagBlur() {
		addTag(entry);
		entry = '';
	}

	// Enjoyment's minimum is 1 because MATH.md §1 declares βᵤ ∈ [1,10]: a 0 puts β
	// outside [1,2], the range every fit was built on.
	const sliders = [
		{
			key: 'physicalDifficulty',
			label: m.form_physical_difficulty(),
			min: 0,
			accent: 'accent-body',
		},
		{
			key: 'mentalDifficulty',
			label: m.form_mental_difficulty(),
			min: 0,
			accent: 'accent-mind',
		},
		{
			key: 'enjoyment',
			label: m.form_enjoyment(),
			min: 1,
			accent: 'accent-brand',
		},
	] as const;
</script>

<div class={cn('@container space-y-grid-lg', className)}>
	<!-- Three across where the fields have the room — the ledger's inline editor,
	     which is as wide as the table — and one per line in the dialog's field
	     column, where three short tracks are harder to drag than three long ones.
	     A container query rather than a breakpoint: the same component is in both,
	     and neither width is the viewport's (`--container-task-fields`). -->
	<div class="grid gap-grid-lg @task-fields:grid-cols-3">
		{#each sliders as slider (slider.key)}
			<!-- The wrapping label is what names the range input -->
			<label class="grid grid-cols-[auto_1fr_2ch] items-center gap-x-grid-xs">
				<span class="text-xs font-medium text-ty-secondary">{slider.label}</span>
				<input
					id="{id}-{slider.key}"
					type="range"
					min={slider.min}
					max="10"
					bind:value={draft[slider.key]}
					class="range-track {slider.accent}"
				/>
				<span class="text-right text-xs font-medium text-ty-primary tabular-nums"
					>{draft[slider.key]}</span
				>
			</label>
		{/each}
	</div>

	<div class="space-y-grid-lg border-t border-line-soft pt-grid-lg">
		<!-- A rule under the sliders: the three ratings describe the WORK, and what
	     follows describes the task's place in the day. -->
		<TaskImportanceSelect bind:importance={draft.importance} />

		<div class="space-y-text-xs">
			<label class="block text-xs font-medium text-ty-secondary">
				{m.form_tags()}
				<input
					id="{id}-tags"
					type="text"
					list={listId}
					value={entry}
					oninput={handleTagInput}
					onkeydown={handleTagKeydown}
					onblur={handleTagBlur}
					placeholder={m.form_tags_placeholder()}
					class="field-input"
				/>
			</label>
			<datalist id={listId}>
				{#each tagVocabulary as tag (tag)}
					<option value={tag}></option>
				{/each}
			</datalist>
			{#if draft.tags.length > 0}
				<div class="flex flex-wrap gap-grid-2xs">
					{#each draft.tags as tag (tag)}
						<span
							class="flex items-center gap-text-2xs rounded-full bg-surface-inset px-box-2xs py-text-3xs text-xs text-ty-secondary"
						>
							{tag}
							<button
								type="button"
								aria-label={m.form_tag_remove({
									tag,
								})}
								onclick={() => (draft.tags = draft.tags.filter((t) => t !== tag))}
								class="row-action text-ty-silent hover:text-ty-primary"
							>
								<X />
							</button>
						</span>
					{/each}
				</div>
			{/if}
		</div>
	</div>
</div>
