<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { expect, fn } from 'storybook/test';
	import NumberInput from './number-input.svelte';

	const { Story } = defineMeta({
		title: 'UI/Number Input',
		component: NumberInput,
		tags: ['autodocs'],
		args: {
			min: 0,
			max: 24,
			step: 0.25,
			unit: 'hrs',
			accent: 'focus-within:border-brand/50',
			ariaLabel: 'Available hours',
		},
	});
</script>

<script lang="ts">
	// The component is controlled (value + onchange), so the story owns the value
	let hours = $state(6);
	let minutes = $state(0);
</script>

<Story name="Hours">
	{#snippet template(args)}
		<div class="max-w-48">
			<NumberInput {...args} value={hours} onchange={(next) => (hours = next)} />
		</div>
	{/snippet}
</Story>

<Story
	name="Stepping"
	args={{
		value: 6,
		step: 0.5,
		onchange: fn(),
	}}
	play={async ({ args, canvas, userEvent }) => {
		// The steppers report in the field's own increments; the component is controlled, so with
		// nothing writing the value back both steps start from the same 6
		await userEvent.click(
			canvas.getByRole('button', {
				name: 'Increase',
			}),
		);

		await expect(args.onchange).toHaveBeenCalledOnce();
		await expect(args.onchange).toHaveBeenCalledWith(6.5);

		await userEvent.click(
			canvas.getByRole('button', {
				name: 'Decrease',
			}),
		);

		await expect(args.onchange).toHaveBeenLastCalledWith(5.5);
	}}
/>

<Story
	name="At minimum"
	args={{
		// At the minimum the − stepper disables; the field itself stays editable
		min: 0,
		max: 60,
		step: 5,
		unit: 'min',
		ariaLabel: 'Switch cost',
	}}
>
	{#snippet template(args)}
		<div class="max-w-48">
			<NumberInput {...args} value={minutes} onchange={(next) => (minutes = next)} />
		</div>
	{/snippet}
</Story>

<Story
	name="Keyboard focus"
	args={{
		value: 6,
		onchange: fn(),
	}}
	play={async ({ canvas, userEvent }) => {
		// The state axe never sees: it reads a story at rest, so the ring is asserted here or
		// nowhere. The ring is a box-shadow on the WRAPPER, and the field's own shadow chain
		// stays all-zero — `@tailwindcss/forms` gives it one, which `focus:ring-0` zeroes.
		const field = canvas.getByRole('spinbutton', {
			name: 'Available hours',
		});

		const wrapper = field.parentElement!.parentElement!;

		await expect(getComputedStyle(wrapper).boxShadow).not.toContain('0px 0px 0px 2px');

		// The steppers are `tabindex={-1}`, so the field takes the first tab
		await userEvent.tab();

		await expect(field).toHaveFocus();
		await expect(field.matches(':focus-visible')).toBe(true);
		await expect(getComputedStyle(wrapper).boxShadow).toContain('0px 0px 0px 2px');
		await expect(getComputedStyle(field).boxShadow).not.toMatch(/[1-9]\d*px/);
	}}
/>

<Story name="Accents" asChild>
	<div class="flex flex-wrap gap-grid-sm">
		<div class="max-w-40">
			<NumberInput
				value={8}
				onchange={() => {}}
				min={0}
				max={16}
				step={0.5}
				unit="hrs"
				ariaLabel="Cognitive pool"
				accent="focus-within:border-mind/50"
			/>
		</div>
		<div class="max-w-40">
			<NumberInput
				value={4}
				onchange={() => {}}
				min={0}
				max={16}
				step={0.5}
				unit="hrs"
				ariaLabel="Physical pool"
				accent="focus-within:border-body/50"
			/>
		</div>
	</div>
</Story>
