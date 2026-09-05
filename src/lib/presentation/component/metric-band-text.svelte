<script lang="ts">
	import { bandLabel, type Band } from '$lib/presentation/utils/band';

	interface Props {
		band: Band;
	}

	let { band }: Props = $props();

	const judged = $derived(bandLabel(band));
</script>

<!-- A reading's band is otherwise carried by colour alone (WCAG 1.4.1), so each
     judged band also gets text only a screen reader hears. Rendered as a sibling
     of the value, never nested: that keeps the value element's text content
     exactly the reading, which is what the e2e assertions and any consumer of the
     rendered number match on. A screen reader reads the two in sequence either way. -->
{#if judged}
	<span class="sr-only">({judged})</span>
{/if}
