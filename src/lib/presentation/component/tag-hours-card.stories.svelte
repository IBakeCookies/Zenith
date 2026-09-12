<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { expect, fn, userEvent, within } from 'storybook/test';
	import TagHoursCard from '$lib/presentation/component/tag-hours-card.svelte';
	import { tagHours } from '$lib/business/model/tags';
	import type { DailySession, DrainObservationRecord } from '$lib/business/type';

	const { Story } = defineMeta({
		title: 'Component/Tag Hours Card',
		component: TagHoursCard,
		tags: ['autodocs'],
		args: {
			hasFailed: false,
			locale: 'en-US',
			onrename: () => {},
			ondelete: fn(),
			// The card asks its caller, which is `SessionStore.willMergeTag`; here
			// the two rows the fixture below carries are the whole vocabulary.
			willMerge: (from: string, draft: string) => draft !== from && draft === 'school',
		},
	});

	const RANGE_START = '2026-07-14';

	const day = (tasks: DailySession['tasks']): DailySession => ({
		date: '2026-07-15',
		tasks,
		availableHours: 6,
		switchCost: 0.25,
		updatedAt: 0,
	});

	const drain = (taskId: number, hours: number): DrainObservationRecord => ({
		date: '2026-07-15',
		taskId,
		taskTitle: `task ${taskId}`,
		hours,
		cognitiveDemand: 0.5,
		physicalDemand: 0.3,
		mindDrain: 6,
		bodyDrain: 2,
		createdAt: 0,
	});

	const task = (id: number, tags?: string[]) => ({
		id,
		title: `task ${id}`,
		physicalDifficulty: 3,
		mentalDifficulty: 5,
		enjoyment: 5,
		createdAt: '2026-07-15',
		completed: false,
		...(tags && {
			tags,
		}),
	});

	// Through the real fold rather than a hand-written breakdown, so the card is read on
	// what the store actually hands it.
	const twoTags = tagHours(
		[drain(1, 2), drain(2, 5)],
		[day([task(1, ['exercise']), task(2, ['school'])])],
		RANGE_START,
	);

	const withUntagged = tagHours([drain(1, 3)], [day([task(1)])], RANGE_START);

	// Two tags and an untagged remainder, so every row on the card is drawn against
	// the same denominator: the 1.5 h the rows themselves add up to.
	const withShares = tagHours(
		[drain(1, 0.8), drain(2, 0.5), drain(3, 0.2)],
		[day([task(1, ['school']), task(2, ['exercise']), task(3)])],
		RANGE_START,
	);

	// A tag long enough to outgrow the label column, beside a short one.
	const longTag = tagHours(
		[drain(1, 2), drain(2, 1)],
		[day([task(1, ['adjhwjkahdajkhdwjkahd-and-then-some']), task(2, ['gym'])])],
		RANGE_START,
	);

	/** Where a row's bar starts, rounded — rows line up when they all report one x. */
	const trackLeft = (row: HTMLElement) =>
		Math.round(row.querySelector('.band-track')!.getBoundingClientRect().left);

	/** A row's bar, as a whole percentage — the share the reader actually sees. */
	const fillPercent = (row: HTMLElement) =>
		Math.round(parseFloat(row.querySelector<HTMLElement>('.band-track > div')!.style.width));
</script>

<Story
	name="Hours per tag"
	args={{
		breakdown: twoTags,
	}}
	play={async ({ canvas }) => {
		// Each tag's own hours, biggest first: the card answers "where did my week go"
		const rows = canvas.getAllByRole('listitem');

		await expect(within(rows[0]).getByText('school')).toBeInTheDocument();
		await expect(within(rows[0]).getByText('5')).toBeInTheDocument();
		await expect(within(rows[1]).getByText('exercise')).toBeInTheDocument();
		await expect(within(rows[1]).getByText('2')).toBeInTheDocument();
	}}
/>

<Story
	name="Each row against the range"
	args={{
		breakdown: withShares,
	}}
	play={async ({ canvas }) => {
		// The denominator is the rows' own sum and not the Logged hours tile: a task
		// with two tags counts under both, so against the tile a bar could overrun
		// its track.
		const rows = canvas.getAllByRole('listitem');

		expect(fillPercent(rows[0])).toBe(53);
		expect(fillPercent(rows[1])).toBe(33);
		expect(fillPercent(rows[2])).toBe(13);

		// One column for every row: the untagged row carries no ✎ ✕ pair, and without
		// a shared grid its bar would start where theirs do not.
		expect(new Set(rows.map(trackLeft)).size).toBe(1);
	}}
/>

<Story
	name="A long tag keeps the bars in line"
	args={{
		breakdown: longTag,
	}}
	play={async ({ canvas }) => {
		// The label column sizes to the longest label the card holds, capped — so a tag
		// nobody would shorten still leaves every bar starting at the same x.
		const rows = canvas.getAllByRole('listitem');

		expect(new Set(rows.map(trackLeft)).size).toBe(1);
	}}
/>

<Story
	name="The caveat reads under the rows"
	args={{
		breakdown: withShares,
	}}
	play={async ({ canvas }) => {
		// The hint says what the card shows; why the rows can out-total the tile is a
		// fact about the rows, so it reads after them.
		expect(canvas.getByText(/Where the range/).textContent).not.toMatch(/under both/);

		const note = canvas.getByText(/counts its hours under both/);

		expect(note.previousElementSibling!.tagName).toBe('UL');
	}}
/>

<Story
	name="Untagged hours are shown"
	args={{
		breakdown: withUntagged,
	}}
	play={async ({ canvas }) => {
		// The untagged row IS the coverage disclosure: hidden, the card would silently
		// disagree with the Logged hours tile above it
		const rows = canvas.getAllByRole('listitem');

		await expect(rows).toHaveLength(1);
		await expect(within(rows[0]).getByText('Untagged')).toBeInTheDocument();
		await expect(within(rows[0]).getByText('3')).toBeInTheDocument();
	}}
/>

<Story
	name="A tag named like the untagged row"
	args={{
		breakdown: {
			tags: [
				{
					tag: 'Untagged',
					hours: 2,
				},
			],
			untaggedHours: 3,
		},
	}}
	play={async ({ canvas }) => {
		// Hand-built, because `tagHours` lower-cases a tag and this locale's untagged
		// label is capitalised: zh's is 无标签, which normalizes to itself, so the two
		// labels really do collide and a duplicate key takes the whole card down.
		const rows = canvas.getAllByRole('listitem');

		await expect(rows).toHaveLength(2);
		await expect(within(rows[0]).getByText('2')).toBeInTheDocument();
		await expect(within(rows[1]).getByText('3')).toBeInTheDocument();
	}}
/>

<Story
	name="Nothing logged"
	args={{
		breakdown: tagHours([], [], RANGE_START),
	}}
	play={async ({ canvas, canvasElement }) => {
		// A range with no 🪫 sessions says so, rather than showing an empty box
		await expect(canvas.getByText('No hours logged in this range.')).toBeInTheDocument();

		// And nothing to take a share of draws no scale — an empty track would say
		// every tag got none of a total that exists.
		expect(canvasElement.querySelectorAll('.band-track')).toHaveLength(0);
	}}
/>

<Story
	name="Renaming onto an existing tag"
	args={{
		breakdown: twoTags,
	}}
	play={async ({ canvas }) => {
		// The merge warning is the only thing standing between a typo fix and two rows
		// silently becoming one
		await userEvent.click(
			canvas.getByRole('button', {
				name: 'Rename exercise',
			}),
		);

		const field = canvas.getByLabelText('New tag name');

		await userEvent.clear(field);
		await userEvent.type(field, 'school');

		await expect(canvas.getByText('Saving merges these two tags into one.')).toBeInTheDocument();
	}}
/>

<Story
	name="Deleting asks first"
	args={{
		breakdown: twoTags,
	}}
	play={async ({ canvas, args }) => {
		// A tag comes off every day it was ever put on, and nothing hands it back —
		// so the first press only arms
		await userEvent.click(
			canvas.getByRole('button', {
				name: 'Delete exercise',
			}),
		);

		await expect(args.ondelete).not.toHaveBeenCalled();

		await expect(
			canvas.getByRole('button', {
				name: 'Cancel',
			}),
		).toBeInTheDocument();

		await userEvent.click(
			canvas.getByRole('button', {
				name: 'Delete exercise everywhere',
			}),
		);

		await expect(args.ondelete).toHaveBeenCalledWith('exercise');
	}}
/>

<Story
	name="The pencil closes what it opened"
	args={{
		breakdown: twoTags,
	}}
	play={async ({ canvas }) => {
		// The log rows' ✎ toggles; a second press here left the editor open, so the
		// only way out was the ✕ beside it
		const pencil = canvas.getByRole('button', {
			name: 'Rename exercise',
		});

		await userEvent.click(pencil);
		await expect(canvas.getByLabelText('New tag name')).toBeInTheDocument();

		await userEvent.click(pencil);
		await expect(canvas.queryByLabelText('New tag name')).not.toBeInTheDocument();
	}}
/>
