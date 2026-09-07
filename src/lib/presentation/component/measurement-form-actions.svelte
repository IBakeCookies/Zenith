<script lang="ts">
	import Check from '@lucide/svelte/icons/check';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import X from '@lucide/svelte/icons/x';
	import * as m from '$lib/paraglide/messages.js';

	type Props = {
		accentClass?: string;
		oncancel: () => void;
	} & (
		| {
				ondelete?: undefined;
				deleteLabel?: undefined;
				deleteTitle?: undefined;
		  }
		| {
				ondelete: (() => void) | undefined;
				deleteLabel: string;
				deleteTitle: string;
		  }
	);

	let { accentClass = 'text-flow', oncancel, ondelete, deleteLabel, deleteTitle }: Props = $props();
</script>

<span class="ml-auto flex items-center gap-grid-2xs">
	{#if ondelete}
		<button
			type="button"
			onclick={ondelete}
			aria-label={deleteLabel}
			title={deleteTitle}
			class="row-action text-ty-silent hover:text-danger"
		>
			<Trash2 />
		</button>
	{/if}
	<button type="submit" aria-label={m.common_save()} class={['row-action', accentClass]}>
		<Check />
	</button>
	<button
		type="button"
		onclick={oncancel}
		aria-label={m.common_cancel()}
		class="row-action text-ty-silent"
	>
		<X />
	</button>
</span>
