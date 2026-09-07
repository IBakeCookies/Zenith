<script lang="ts">
	import * as m from '$lib/paraglide/messages.js';
	import { cn } from '$lib/presentation/utils';
	import { buttonVariants } from '$lib/presentation/component/ui/button';

	interface Props {
		mustDoToday: boolean;
		class?: string;
	}

	let { mustDoToday = $bindable(), class: className }: Props = $props();

	const id = $props.id();
</script>

<!-- A button's look on a real checkbox: `input-overlay` (tokens.css) is what keeps the
     native control under the button recipe. The focus ring has to be `has-*`, not
     `peer-*`: the input is inside the label, so the two are never siblings. -->
<label
	title={m.form_must_do_today_title()}
	class={cn(
		buttonVariants({
			variant: mustDoToday ? 'secondary' : 'outline',
		}),
		'has-focus-visible:border-ring has-focus-visible:ring-ring/50 relative has-focus-visible:ring-3',
		className,
	)}
>
	<input {id} type="checkbox" bind:checked={mustDoToday} class="input-overlay" />
	{m.form_must_do_today()}
</label>
