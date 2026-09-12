<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { expect, within } from 'storybook/test';
	import type { PlanAudit } from '$lib/business/model/plan-audit';
	import PlanAdherenceSummary from '$lib/presentation/component/plan-adherence-summary.svelte';
	import { BAND_BAR_CLASS } from '$lib/presentation/utils/band';

	/* A 15-point gap: inside the tie band, so the verdict names neither planner
	   and the two bars have to carry the comparison on their own. */
	const audit: PlanAudit = {
		usedCount: 30,
		days: [],
		classicOverlap: 0.41,
		energyOverlap: 0.56,
		actualTaskSpread: 1.2,
		classicTaskSpread: 3.2,
		energyTaskSpread: 1.6,
	};

	/** A planner's row: its label, its percentage and the bar under them. */
	const row = (canvas: { getByText: (text: string) => HTMLElement }, label: string) =>
		canvas.getByText(label).closest('li')!;

	const fill = (element: Element) => element.querySelector<HTMLElement>('.band-track > div')!;

	const { Story } = defineMeta({
		title: 'Component/Plan Adherence Summary',
		component: PlanAdherenceSummary,
		tags: ['autodocs'],
		args: {
			audit,
			locale: 'en-US',
		},
	});
</script>

<Story
	name="A tie"
	play={async ({ canvas }) => {
		// The verdict and the day count lead the card, on one line.
		await expect(
			canvas.getByText(/^Both planners describe your days about equally well so far/),
		).toHaveTextContent('based on 30 logged days');

		// Each match is a bar at its own percentage, on a 0–100% scale.
		expect(fill(row(canvas, 'Classic plan match')).style.width).toBe('41%');
		expect(fill(row(canvas, 'Energy plan match')).style.width).toBe('56%');

		// Neither bar judges its reading: a 41% would band `warning`, and is not.
		expect(fill(row(canvas, 'Classic plan match'))).toHaveClass(BAND_BAR_CLASS.neutral);
		expect(fill(row(canvas, 'Energy plan match'))).toHaveClass(BAND_BAR_CLASS.neutral);

		// The three spreads read as one line of labelled figures.
		await expect(within(canvas.getByText('you').parentElement!).getByText('1.2')).toBeVisible();

		await expect(within(canvas.getByText('classic').parentElement!).getByText('3.2')).toBeVisible();

		await expect(within(canvas.getByText('energy').parentElement!).getByText('1.6')).toBeVisible();
	}}
/>

<Story
	name="One logged day"
	args={{
		audit: {
			...audit,
			usedCount: 1,
		},
	}}
	play={async ({ canvas }) => {
		await expect(canvas.getByText(/based on 1 logged day$/)).toBeVisible();
	}}
/>
