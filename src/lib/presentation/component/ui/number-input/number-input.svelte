<script lang="ts">
	import { cn } from '$lib/presentation/utils';
	import * as m from '$lib/paraglide/messages.js';

	interface Props {
		value: number;
		onchange: (value: number) => void;
		min?: number;
		max?: number;
		step?: number;
		unit?: string; // small suffix label inside the field, e.g. "hrs"
		/** Only where a visible `<label for>` points at it. Left out, the field still
		 *  gets one — a form control with neither `id` nor `name` is what the browser
		 *  warns about. */
		id?: string;
		// Only for a field with no visible <label for={id}> — otherwise the label
		// already names it and this would override it with a second name.
		ariaLabel?: string;
		// Focus accent, passed as a literal class so Tailwind can see it,
		// e.g. "focus-within:border-brand-line"
		accent?: string;
		/** Merged over the wrapper's own chrome, so a caller that IS the bordered
		 *  object can drop the border, fill and ring rather than nest a second one. */
		class?: string;
	}

	let {
		value,
		onchange,
		min,
		max,
		step = 1,
		unit,
		id,
		ariaLabel,
		accent = 'focus-within:border-brand-line',
		class: className,
	}: Props = $props();

	const autoId = $props.id();

	// Decimal places of the step, so 0.25-stepping never shows 0.35000000000000003
	const stepDecimals = $derived((String(step).split('.')[1] ?? '').length);

	function clamp(v: number): number {
		if (min !== undefined && v < min) return min;

		if (max !== undefined && v > max) return max;

		return v;
	}

	function stepBy(direction: 1 | -1) {
		const next = clamp((Number(value) || 0) + direction * step);
		onchange(Number(next.toFixed(stepDecimals)));
	}

	function handleInput(e: Event & { currentTarget: HTMLInputElement }) {
		// Don't clamp mid-typing (it fights the user); clamp on blur/steppers.
		const n = e.currentTarget.valueAsNumber;

		if (Number.isFinite(n)) onchange(n);
	}

	function handleBlur(e: FocusEvent & { currentTarget: HTMLInputElement }) {
		const n = e.currentTarget.valueAsNumber;
		onchange(Number.isFinite(n) ? clamp(n) : (min ?? 0));
	}

	const atMin = $derived(min !== undefined && value <= min);
	const atMax = $derived(max !== undefined && value >= max);
</script>

<div
	class={cn(
		'flex items-stretch rounded-lg border border-line-strong bg-input transition-colors has-focus-visible:ring-2 has-focus-visible:ring-ring',
		accent,
		className,
	)}
>
	<button
		type="button"
		tabindex={-1}
		aria-label={m.number_input_decrease()}
		disabled={atMin}
		onclick={() => stepBy(-1)}
		class="number-step rounded-l-lg px-2.5 text-sm"
	>
		−
	</button>
	<div class="relative min-w-0 flex-1">
		<input
			id={id ?? autoId}
			type="number"
			aria-label={ariaLabel}
			{min}
			{max}
			{step}
			{value}
			oninput={handleInput}
			onblur={handleBlur}
			class="w-full border-0 bg-transparent py-1.5 pr-8 pl-1 text-center text-sm text-ty-primary outline-none focus:ring-0"
		/>
		{#if unit}
			<span
				class="pointer-events-none absolute top-1/2 right-1 -translate-y-1/2 text-2xs font-medium tracking-wide text-ty-silent uppercase"
			>
				{unit}
			</span>
		{/if}
	</div>
	<button
		type="button"
		tabindex={-1}
		aria-label={m.number_input_increase()}
		disabled={atMax}
		onclick={() => stepBy(1)}
		class="number-step rounded-r-lg px-2.5 text-sm"
	>
		+
	</button>
</div>
