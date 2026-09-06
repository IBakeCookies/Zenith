<script lang="ts">
	import * as Tooltip from '$lib/presentation/component/ui/tooltip';

	interface Props {
		text: string;
		description: string;
	}

	let { text, description }: Props = $props();
</script>

<!-- A reading's label is a dotted-underlined tooltip trigger, and the day's two
     metric sections sit either side of the day's setup drawing the same one. -->
<Tooltip.Provider>
	<Tooltip.Root>
		<Tooltip.Trigger>
			{#snippet child({ props })}
				<span {...props} class="hint-underline text-xs text-ty-secondary">
					{text}
				</span>
			{/snippet}
		</Tooltip.Trigger>
		<Tooltip.Content>
			<p>{description}</p>
		</Tooltip.Content>
	</Tooltip.Root>
</Tooltip.Provider>
