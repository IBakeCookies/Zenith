<script lang="ts">
	import type { Snippet } from 'svelte';
	import * as Tooltip from '$lib/presentation/component/ui/tooltip';
	import { cn } from '$lib/presentation/utils';

	interface Props {
		title: string;
		hint: string;
		children: Snippet;
		class?: string;
	}

	let { title, hint, children, class: className }: Props = $props();
</script>

<div class={cn('card-shell p-box-md sm:p-box-xl', className)}>
	<!-- Its own provider so the card stands alone; nesting inside a page-level one is
	     harmless. -->
	<Tooltip.Provider>
		<Tooltip.Root>
			<Tooltip.Trigger>
				{#snippet child({ props })}
					<h3
						{...props}
						class="hint-underline w-fit text-xs font-semibold tracking-wider text-ty-secondary uppercase"
					>
						{title}
					</h3>
				{/snippet}
			</Tooltip.Trigger>
			<Tooltip.Content side="left">
				<p>{hint}</p>
			</Tooltip.Content>
		</Tooltip.Root>
		{@render children()}
	</Tooltip.Provider>
</div>
