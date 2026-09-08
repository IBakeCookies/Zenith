<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { expect, fn, waitFor, within } from 'storybook/test';
	import type { AdviceDisplay, AdviceFact } from '$lib/presentation/utils/plan-advice-descriptor';
	import PlanAdviceCard from '$lib/presentation/component/plan-advice-card.svelte';

	/* The three day-level readings, shaped as `buildAdviceDisplay` and
	   `describeDeferDestination` hand them: a label, the reading, and the line
	   under it. */
	const nextBlock: AdviceFact = {
		label: 'Next 15 minutes',
		primary: '“Tax return”',
		secondary: '+2.4% plan value',
	};

	const noBlock: AdviceFact = {
		label: 'Next 15 minutes',
		primary: 'Nothing more would get done',
		secondary: null,
	};

	const switching: AdviceFact = {
		label: 'Switching',
		primary: '30m of today reserved · 6% of the budget',
		secondary: 'at 15m a switch · no switch cost +10.4% · at 30m −8.7%',
	};

	const noSwitching: AdviceFact = {
		label: 'Switching',
		primary: 'Pays for no switching',
		secondary: 'at 15m a switch',
	};

	/* One reading for the card, not one per lever: every defer below sends the
	   task to the same day (ROADMAP item 21). */
	const tomorrow: AdviceFact = {
		label: 'Tomorrow',
		primary: '4 tasks · 6h to spend',
		secondary: '3 of them funded',
	};

	/* Shaped exactly as `buildAdviceDisplay` returns it: the bands are the
	   presentation policy's output (utils/band.ts), and every number is one the
	   model would have produced by re-solving the day. */
	const advice: AdviceDisplay = {
		unfunded: [
			'“Inbox zero” gets no hours — dropping “Tax return” would fund it.',
			'“Repaint the shed” gets no hours — your Physical pool is full.',
		],
		unfundedMustDo: ['“Renew the passport” gets no hours, and nothing on offer today reaches it.'],
		marginal: nextBlock,
		switchCost: switching,
		rows: [
			{
				axis: 'burnoutRisk',
				label: 'Burnout Risk',
				before: '82%',
				beforeBand: 'critical',
				options: [
					{
						lever: {
							kind: 'defer-task',
							taskId: 1,
							title: 'Tax return',
						},
						action: 'Move “Tax return” off today',
						after: '54%',
						afterBand: 'warning',
						cost: '−6.2%',
						profileFlip: 'Day Profile → Cruise',
						applyLabel: null,
						isUnpriced: false,
					},
					{
						lever: {
							kind: 'set-budget',
							hours: 6.5,
						},
						action: 'Set the budget to 6.5h',
						after: '71%',
						afterBand: 'warning',
						cost: 'costs no plan value',
						profileFlip: null,
						applyLabel: 'Set 6.5h',
						isUnpriced: false,
					},
				],
			},
			{
				axis: 'cognitiveLoad',
				label: 'Cognitive Load',
				before: '88%',
				beforeBand: 'critical',
				options: [
					{
						lever: {
							kind: 'defer-task',
							taskId: 2,
							title: 'Migrate the database',
						},
						action: 'Move “Migrate the database” off today',
						after: '41%',
						afterBand: 'success',
						cost: '−18.4%',
						profileFlip: null,
						applyLabel: null,
						isUnpriced: false,
					},
					/* The unpriced lever, always last and costed in hours rather than in
					   plan value: Σ P̄ rises with the budget, so a percentage here would
					   read as the extra hour being free. */
					{
						lever: {
							kind: 'set-budget',
							hours: 9,
						},
						action: 'Set the budget to 9h',
						after: '78%',
						afterBand: 'warning',
						cost: 'costs an extra hour of your day',
						profileFlip: null,
						applyLabel: 'Add the hour',
						isUnpriced: true,
					},
				],
			},
		],
	};

	/* Two tasks may share a title, so an option's own words are not an identity —
	   the card has to render both defer levers, and both unfunded lines. */
	const sharedTitle: AdviceDisplay = {
		unfunded: [
			'“Email” gets no hours, and nothing on offer today reaches it.',
			'“Email” gets no hours, and nothing on offer today reaches it.',
		],
		unfundedMustDo: [],
		marginal: noBlock,
		switchCost: noSwitching,
		rows: [
			{
				axis: 'burnoutRisk',
				label: 'Burnout Risk',
				before: '82%',
				beforeBand: 'critical',
				options: [
					{
						lever: {
							kind: 'defer-task',
							taskId: 1,
							title: 'Email',
						},
						action: 'Move “Email” off today',
						after: '54%',
						afterBand: 'warning',
						cost: '−6.2%',
						profileFlip: null,
						applyLabel: null,
						isUnpriced: false,
					},
					{
						lever: {
							kind: 'defer-task',
							taskId: 2,
							title: 'Email',
						},
						action: 'Move “Email” off today',
						after: '61%',
						afterBand: 'warning',
						cost: '−4.1%',
						profileFlip: null,
						applyLabel: null,
						isUnpriced: false,
					},
				],
			},
		],
	};

	const { Story } = defineMeta({
		title: 'Component/Plan Advice Card',
		component: PlanAdviceCard,
		tags: ['autodocs'],
		args: {
			advice,
			destination: tomorrow,
			isBusy: false,
			isStale: false,
			hasError: false,
			oncheck: fn(),
			onapply: fn(),
			onapplybudget: fn(),
		},
	});
</script>

<Story
	name="Not calculated yet"
	args={{
		advice: null,
	}}
	play={async ({ args, canvas, userEvent }) => {
		// The search costs a full solve per candidate, so the reading waits, not the card.
		await expect(canvas.getByText('Adjust the plan')).toBeVisible();
		await expect(canvas.getByText('Nothing has been priced for this day yet.')).toBeVisible();

		await expect(canvas.queryByText('Burnout Risk')).not.toBeInTheDocument();

		const check = canvas.getByRole('button', {
			name: 'Check my day',
		});

		await expect(check).toBeEnabled();
		await userEvent.click(check);

		await expect(args.oncheck).toHaveBeenCalledOnce();
	}}
/>

<Story
	name="Findings"
	play={async ({ args, canvas, canvasElement, userEvent }) => {
		// One sentence; what plan value IS moved onto the column head that prices in it.
		await expect(
			canvas.getByText(
				'Each option is re-solved by the same optimizer that built your plan, so these are the numbers you would actually get.',
			),
		).toBeVisible();

		// The three day-level readings are tiles, never rows: none of them is a lever.
		const tile = (label: string) => within(canvas.getByText(label).parentElement!);

		await expect(tile('Next 15 minutes').getByText('“Tax return”')).toBeVisible();
		await expect(tile('Next 15 minutes').getByText('+2.4% plan value')).toBeVisible();

		await expect(
			tile('Switching').getByText('30m of today reserved · 6% of the budget'),
		).toBeVisible();

		await expect(
			tile('Switching').getByText('at 15m a switch · no switch cost +10.4% · at 30m −8.7%'),
		).toBeVisible();

		await expect(tile('Tomorrow').getByText('4 tasks · 6h to spend')).toBeVisible();
		await expect(tile('Tomorrow').getByText('3 of them funded')).toBeVisible();

		expect(canvas.getAllByText('Lever')).toHaveLength(2);
		expect(canvas.getAllByText('Reading')).toHaveLength(2);
		expect(canvas.getAllByText('Plan value')).toHaveLength(2);

		// The head names the unit the cells are priced in, and explains it.
		await userEvent.hover(canvas.getAllByText('Plan value')[0]);

		const body = within(canvasElement.ownerDocument.body);

		await waitFor(() =>
			expect(body.getByText(/^Anything priced in plan value is a change/)).toBeVisible(),
		);

		await userEvent.unhover(canvas.getAllByText('Plan value')[0]);

		// Every option shows the reading it produces (before → after) AND its price —
		// the bare figure under the head that names its unit.
		await expect(canvas.getByText('Burnout Risk')).toBeVisible();

		const taxReturn = within(canvas.getByText('Move “Tax return” off today').closest('li')!);

		await expect(taxReturn.getByText('82%')).toBeVisible();
		await expect(taxReturn.getByText('54%')).toBeVisible();
		await expect(taxReturn.getByText('−6.2%')).toBeVisible();
		await expect(taxReturn.getByText('Day Profile → Cruise')).toBeVisible();

		const budget = within(canvas.getByText('Set the budget to 6.5h').closest('li')!);

		await expect(budget.getByText('costs no plan value')).toBeVisible();

		// Bands are otherwise colour alone (WCAG 1.4.1); the repeated before is
		// uncoloured, so it carries none.
		expect(canvas.getAllByText('(Critical)')).toHaveLength(2);
		expect(canvas.getAllByText('(Caution)')).toHaveLength(3);

		await expect(
			canvas.getByText('“Inbox zero” gets no hours — dropping “Tax return” would fund it.'),
		).toHaveClass('text-ty-secondary');

		await expect(
			canvas.getByText('“Repaint the shed” gets no hours — your Physical pool is full.'),
		).toHaveClass('text-ty-secondary');

		// Louder than the two above: the flag left that task no per-task lever.
		await expect(
			canvas.getByText(
				'“Renew the passport” gets no hours, and nothing on offer today reaches it.',
			),
		).toHaveClass('text-warning-strong');

		// Both lever kinds are performable (the budget is a choice about the day),
		// and each button must say what it does: which task it moves, or which
		// budget it sets.
		expect(
			canvas.getAllByRole('button', {
				name: /to tomorrow/i,
			}),
		).toHaveLength(2);

		await userEvent.click(
			canvas.getByRole('button', {
				name: 'Move “Tax return” to tomorrow',
			}),
		);

		await expect(args.onapply).toHaveBeenCalledOnce();
		await expect(args.onapply).toHaveBeenCalledWith(1);

		await userEvent.click(
			canvas.getByRole('button', {
				name: 'Set 6.5h',
			}),
		);

		// The lever's hours, not the label's: applying is the only way to reach the
		// budget the model actually priced.
		await expect(args.onapplybudget).toHaveBeenCalledOnce();
		await expect(args.onapplybudget).toHaveBeenCalledWith(6.5);

		// The unpriced increase is performable too — refusing to apply an option the
		// card shows is worse — but it never reads as one more priced option: its own
		// words in the price column, and a dashed rule above it.
		const hour = canvas.getByRole('button', {
			name: 'Add the hour',
		});

		const unpriced = hour.closest('li')!;

		await expect(unpriced).toHaveClass('border-dashed');
		await expect(within(unpriced).getByText('costs an extra hour of your day')).toBeVisible();

		await userEvent.click(hour);
		await expect(args.onapplybudget).toHaveBeenCalledTimes(2);
		await expect(args.onapplybudget).toHaveBeenLastCalledWith(9);
	}}
/>

<Story
	name="On a phone"
	globals={{
		viewport: {
			value: 'mobile1',
			isRotated: false,
		},
	}}
	play={async ({ canvas }) => {
		// 320px: tiles stack, each lever stacks with its button beside it, no overflow.
		const card = canvas.getByText('Adjust the plan').closest('.card-shell')!;

		expect(card.scrollWidth).toBeLessThanOrEqual(card.clientWidth);

		const box = (element: Element) => element.getBoundingClientRect();
		const switching = box(canvas.getByText('Switching').parentElement!);
		const tomorrow = box(canvas.getByText('Tomorrow').parentElement!);

		expect(tomorrow.top).toBeGreaterThanOrEqual(switching.bottom);

		// The reading sits under its lever, so its head has nothing to sit over.
		for (const head of canvas.getAllByText('Reading')) await expect(head).not.toBeVisible();

		await expect(canvas.getAllByText('Lever')[0]).toBeVisible();
		await expect(canvas.getAllByText('Plan value')[0]).toBeVisible();

		const action = box(canvas.getByText('Move “Tax return” off today'));
		const reading = box(canvas.getByText('54%').parentElement!);

		expect(reading.top).toBeGreaterThanOrEqual(action.bottom);
		expect(Math.abs(reading.left - action.left)).toBeLessThan(1);
	}}
/>

<Story
	name="Solving"
	args={{
		advice: null,
		isBusy: true,
	}}
	play={async ({ canvas }) => {
		// A second request is blocked while the search is running.
		await expect(
			canvas.getByRole('button', {
				name: 'Solving…',
			}),
		).toBeDisabled();

		await expect(canvas.getByText('Nothing has been priced for this day yet.')).toBeVisible();
	}}
/>

<Story
	name="First check failed"
	args={{
		advice: null,
		hasError: true,
	}}
	play={async ({ canvas }) => {
		// The first check threw: the banner reads inside the card, with no reading behind it.
		const banner = canvas.getByText('The check failed. Try again.');

		await expect(banner).toBeVisible();
		expect(banner.closest('.card-shell')).not.toBeNull();

		await expect(
			canvas.getByRole('button', {
				name: 'Check my day',
			}),
		).toBeEnabled();
	}}
/>

<Story
	name="Stale"
	args={{
		isStale: true,
	}}
	play={async ({ canvas }) => {
		// The day was edited after the advice was calculated.
		await expect(canvas.getByText('Your day has changed since this was calculated.')).toBeVisible();

		// The numbers stay; the levers do not. Each option is priced as the ONE next
		// move on the day that was solved, so on any other day they are wrong
		// together — including the budget lever, which is priced the same way.
		await expect(canvas.getByText('Move “Migrate the database” off today')).toBeVisible();

		await expect(
			canvas.getByRole('button', {
				name: 'Move “Migrate the database” to tomorrow',
			}),
		).toBeDisabled();

		await expect(
			canvas.getByRole('button', {
				name: 'Add the hour',
			}),
		).toBeDisabled();

		// Recheck is the way out of stale, so it is the one button that stays live.
		await expect(
			canvas.getByRole('button', {
				name: 'Recheck',
			}),
		).toBeEnabled();
	}}
/>

<Story
	name="Error"
	args={{
		// The last check threw; the advice shown predates the failure.
		hasError: true,
	}}
/>

<Story
	name="Nothing to fix"
	args={{
		advice: {
			rows: [],
			unfunded: [],
			unfundedMustDo: [],
			marginal: noBlock,
			switchCost: noSwitching,
		},
		destination: null,
	}}
	play={async ({ canvas }) => {
		// A destination read that answered nothing prints no tile; the advice beside it stands.
		await expect(
			canvas.getByText('Nothing reads badly enough to act on. This day is fine.'),
		).toBeVisible();

		await expect(canvas.queryByText('Tomorrow')).not.toBeInTheDocument();

		// The shadow price is a reading, not a finding: a day with nothing to fix
		// still answers what the next block would buy.
		await expect(canvas.getByText('Nothing more would get done')).toBeVisible();
	}}
/>

<Story
	name="An axis nothing can improve"
	args={{
		advice: {
			rows: [
				{
					axis: 'energyBalance',
					label: 'Energy Balance',
					before: 'Cognitive Heavy 100%',
					beforeBand: 'warning',
					options: [],
				},
			],
			unfunded: [],
			unfundedMustDo: [],
			marginal: nextBlock,
			switchCost: noSwitching,
		},
	}}
	play={async ({ canvas }) => {
		// A day of nothing but cognitive tasks: Energy Balance reads 100% and no lever moves it, since
		// the share is invariant under both. The row has to appear anyway — silence here is what let
		// the card call such a day fine while the dashboard banded the same reading Caution.
		await expect(canvas.getByText('Cognitive Heavy 100%')).toBeVisible();
		await expect(canvas.getByText('(Caution)')).toBeInTheDocument();

		// Why the menu is empty, said out loud: an axis with a reading and no rows
		// under it otherwise reads as a rendering failure.
		await expect(
			canvas.getByText('No task move and no budget change improves this.'),
		).toBeVisible();

		await expect(
			canvas.queryByText(/Nothing reads badly enough to act on/),
		).not.toBeInTheDocument();

		expect(
			canvas.queryAllByRole('button', {
				name: /to tomorrow|Set |Add the hour/,
			}),
		).toEqual([]);
	}}
/>

<Story
	name="Two tasks share a title"
	args={{
		advice: sharedTitle,
	}}
	play={async ({ args, canvas, userEvent }) => {
		// Two unfunded tasks on one branch spell one sentence twice.
		expect(
			canvas.getAllByText('“Email” gets no hours, and nothing on offer today reaches it.'),
		).toHaveLength(2);

		// Identical words, distinct levers: the card renders both and applies each by its task id.
		const applies = canvas.getAllByRole('button', {
			name: 'Move “Email” to tomorrow',
		});

		expect(applies).toHaveLength(2);

		await userEvent.click(applies[1]);
		await expect(args.onapply).toHaveBeenCalledOnce();
		await expect(args.onapply).toHaveBeenCalledWith(2);
	}}
/>

<Story
	name="Only an unfunded read"
	args={{
		advice: {
			rows: [],
			unfunded: [
				'“Inbox zero” gets no hours — dropping “Tax return” would fund it.',
				'“Repaint the shed” gets no hours — your Physical pool is full.',
			],
			unfundedMustDo: [],
			marginal: nextBlock,
			switchCost: switching,
		},
	}}
	play={async ({ canvas }) => {
		// Unfunded is a read, not a band: every axis can be in band (`rows: []`) while work still gets
		// no hours — and "this day is fine" printed under that negates it.
		await expect(
			canvas.getByText('“Inbox zero” gets no hours — dropping “Tax return” would fund it.'),
		).toBeVisible();

		await expect(
			canvas.queryByText(/Nothing reads badly enough to act on/),
		).not.toBeInTheDocument();
	}}
/>

<Story
	name="Only a pinned unfunded read"
	args={{
		advice: {
			rows: [],
			unfunded: [],
			unfundedMustDo: [
				'“Renew the passport” gets no hours, and nothing on offer today reaches it.',
			],
			marginal: nextBlock,
			switchCost: switching,
		},
	}}
	play={async ({ canvas }) => {
		// Each read alone, because the gate must check both: a day whose only unfunded task is pinned
		// reports nothing in `unfunded`.
		await expect(
			canvas.getByText(
				'“Renew the passport” gets no hours, and nothing on offer today reaches it.',
			),
		).toBeVisible();

		await expect(
			canvas.queryByText(/Nothing reads badly enough to act on/),
		).not.toBeInTheDocument();
	}}
/>

<Story
	name="An unfunded task names the one to drop"
	args={{
		advice: {
			rows: [],
			unfunded: [
				'“Renew the passport” gets no hours — dropping “Inbox” would fund it.',
				'“Read the report” gets no hours — a budget of 9h would fund it.',
			],
			unfundedMustDo: [],
			marginal: nextBlock,
			switchCost: noSwitching,
		},
	}}
	play={async ({ canvas }) => {
		// Queried by exact text, which is what pins one line per task: two reasons
		// run together in one paragraph would still contain both sentences.
		const line = canvas.getByText(
			'“Renew the passport” gets no hours — dropping “Inbox” would fund it.',
		);

		await expect(line).toHaveTextContent('“Renew the passport”');
		await expect(line).toHaveTextContent('dropping “Inbox”');
	}}
/>

<Story
	name="A must-do unfunded task keeps its own line"
	args={{
		advice: {
			rows: [],
			unfunded: [
				'“Inbox zero” gets no hours, and nothing on offer today reaches it.',
				'“Read the report” gets no hours — a budget of 9h would fund it.',
			],
			unfundedMustDo: ['“Renew the passport” gets no hours — your Cognitive pool is full.'],
			marginal: nextBlock,
			switchCost: noSwitching,
		},
	}}
	play={async ({ canvas }) => {
		// The flag promises the day, not the hours — the reason it now carries does
		// not change that.
		await expect(
			canvas.getByText('“Renew the passport” gets no hours — your Cognitive pool is full.'),
		).toHaveClass('text-warning-strong');

		await expect(
			canvas.getByText('“Inbox zero” gets no hours, and nothing on offer today reaches it.'),
		).toHaveClass('text-ty-secondary');

		await expect(
			canvas.getByText('“Read the report” gets no hours — a budget of 9h would fund it.'),
		).toHaveClass('text-ty-secondary');
	}}
/>

<Story
	name="Flow coverage"
	args={{
		advice: {
			rows: [
				{
					axis: 'flowCoverage',
					label: 'Flow Coverage',
					before: '60%',
					beforeBand: 'warning',
					options: [
						{
							lever: {
								kind: 'defer-task',
								taskId: 1,
								title: 'Design error boundary',
							},
							action: 'Move “Design error boundary” off today',
							after: '100%',
							afterBand: 'success',
							cost: '−26.4%',
							profileFlip: null,
							applyLabel: null,
							isUnpriced: false,
						},
					],
				},
			],
			unfunded: [],
			unfundedMustDo: [],
			marginal: noBlock,
			switchCost: noSwitching,
		},
	}}
	play={async ({ args, canvas, userEvent }) => {
		// A ninth axis, and no markup of its own.
		await expect(canvas.getByText('Flow Coverage')).toBeVisible();
		await expect(canvas.getByText('Move “Design error boundary” off today')).toBeVisible();
		await expect(canvas.getByText('100%')).toBeVisible();
		await expect(canvas.getByText('−26.4%')).toBeVisible();

		await userEvent.click(
			canvas.getByRole('button', {
				name: 'Move “Design error boundary” to tomorrow',
			}),
		);

		await expect(args.onapply).toHaveBeenCalledOnce();
		await expect(args.onapply).toHaveBeenCalledWith(1);
	}}
/>
