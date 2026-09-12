<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { expect, within } from 'storybook/test';
	import type { ModelRow } from '$lib/presentation/utils/calibration-descriptor';
	import ModelParameterTable from '$lib/presentation/component/model-parameter-table.svelte';

	/* Shaped as `calibrationRows` returns it: every row fitted and off its default,
	   with a three-day history — so a cell printing the wrong one of the two
	   numbers cannot pass by coincidence. */
	const rows: ModelRow[] = [
		{
			label: 'Time to flow · typical task',
			value: '≈ 38 min',
			defaultValue: '45 min',
			evidence:
				'14.0 ⚡ logs, recency-weighted · fit 6.0 min closer than default over 12 predicted logs',
			trend: {
				values: [0.75, 0.7, 0.63],
				defaultValue: 0.75,
				ariaLabel: 'Time to flow · typical task over the last 3 recorded days: 45 min to 38 min',
			},
		},
		{
			label: 'Recovery rate',
			value: '≈ 1.07 ± 0.12 /h',
			defaultValue: '0.70',
			evidence: '92 ratings',
			trend: {
				values: [0.7, 0.9, 1.07],
				defaultValue: 0.7,
				ariaLabel: 'Recovery rate over the last 3 recorded days: 0.70 /h to 1.07 /h',
			},
		},
		{
			label: 'Cognitive drain rate',
			value: '≈ 0.41 ± 0.06 /h',
			defaultValue: '0.35',
			evidence: '92 ratings',
			trend: {
				values: [0.35, 0.38, 0.41],
				defaultValue: 0.35,
				ariaLabel: 'Cognitive drain rate over the last 3 recorded days: 0.35 /h to 0.41 /h',
			},
		},
		{
			label: 'Physical drain rate',
			value: '≈ 0.22 ± 0.05 /h',
			defaultValue: '0.20',
			evidence: '92 ratings',
			trend: {
				values: [0.2, 0.21, 0.22],
				defaultValue: 0.2,
				ariaLabel: 'Physical drain rate over the last 3 recorded days: 0.20 /h to 0.22 /h',
			},
		},
		{
			label: 'Free-time value',
			value: '≈ 0.55 ± 0.09 out/h',
			defaultValue: '0.50',
			evidence: '21 days',
			trend: {
				values: [0.5, 0.52, 0.55],
				defaultValue: 0.5,
				ariaLabel: 'Free-time value over the last 3 recorded days: 0.50 out/h to 0.55 out/h',
			},
		},
	];

	/** One parameter's row, by its label. */
	const row = (canvas: { getByText: (text: string) => HTMLElement }, label: string) =>
		within(canvas.getByText(label).closest('li')!);

	const { Story } = defineMeta({
		title: 'Component/Model Parameter Table',
		component: ModelParameterTable,
		tags: ['autodocs'],
		args: {
			rows,
		},
	});
</script>

<Story
	name="Every parameter fitted"
	play={async ({ canvas }) => {
		// Five named columns, so a fit sits beside the default it is anchored to.
		await expect(canvas.getByText('Default')).toBeVisible();
		await expect(canvas.getByText('Evidence')).toBeVisible();

		const recovery = row(canvas, 'Recovery rate');

		await expect(recovery.getByText('≈ 1.07 ± 0.12 /h')).toBeVisible();
		await expect(recovery.getByText('0.70')).toBeVisible();

		// The evidence no longer repeats the default the cell beside it prints.
		await expect(recovery.getByText('92 ratings')).toBeVisible();
	}}
/>

<Story
	name="Cognitive drain not fitted"
	args={{
		rows: rows.map((item) =>
			item.label === 'Cognitive drain rate'
				? {
						...item,
						value: '0.35 /h',
						evidence: '0 ratings',
						trend: null,
					}
				: item,
		),
	}}
	play={async ({ canvas }) => {
		// The same number twice, and no ≈: that absence is how the card marks a
		// value nothing moved.
		const cognitive = row(canvas, 'Cognitive drain rate');

		await expect(cognitive.getByText('0.35 /h')).toBeVisible();
		expect(cognitive.queryByText(/≈/)).toBeNull();
	}}
/>

<Story
	name="No history yet"
	args={{
		rows: rows.map((item) =>
			item.label === 'Free-time value'
				? {
						...item,
						trend: null,
					}
				: item,
		),
	}}
	play={async ({ canvas }) => {
		expect(row(canvas, 'Free-time value').queryByRole('img')).toBeNull();

		// The control: a row with a history still draws its line.
		expect(row(canvas, 'Recovery rate').queryByRole('img')).not.toBeNull();
	}}
/>
