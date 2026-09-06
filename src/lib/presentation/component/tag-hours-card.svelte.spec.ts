import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import TagHoursCard from '$lib/presentation/component/tag-hours-card.svelte';

/** A spec and not a story `play`: the range switch that drops a row is a rerender
 *  with different props, which a play function cannot drive (docs/testing.md). */
describe('tag-hours-card.svelte', () => {
	const props = {
		breakdown: {
			tags: [
				{
					tag: 'errand',
					hours: 4,
				},
			],
			untaggedHours: 0,
		},
		hasFailed: false,
		locale: 'en-US',
		onrename: () => {},
		ondelete: () => {},
		willMerge: () => false,
	};

	const narrowed = {
		...props,
		breakdown: {
			tags: [],
			untaggedHours: 0,
		},
	};

	it('disarms a delete whose row the range took away', async () => {
		const { rerender } = render(TagHoursCard, props);

		await page
			.getByRole('button', {
				name: 'Delete errand',
			})
			.click();

		await expect
			.element(
				page.getByRole('button', {
					name: 'Delete errand everywhere',
				}),
			)
			.toBeVisible();

		await rerender(narrowed);
		await rerender(props);

		// Re-armed, the row would also steal focus: the confirm's cancel attaches it.
		await expect
			.element(
				page.getByRole('button', {
					name: 'Delete errand everywhere',
				}),
			)
			.not.toBeInTheDocument();
	});

	it('closes an editor whose row the range took away', async () => {
		const { rerender } = render(TagHoursCard, props);

		await page
			.getByRole('button', {
				name: 'Rename errand',
			})
			.click();

		await expect.element(page.getByLabelText('New tag name')).toBeVisible();

		await rerender(narrowed);
		await rerender(props);

		await expect.element(page.getByLabelText('New tag name')).not.toBeInTheDocument();
	});
});
