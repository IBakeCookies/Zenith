<script lang="ts">
	import Pause from '@lucide/svelte/icons/pause';
	import Play from '@lucide/svelte/icons/play';
	import Square from '@lucide/svelte/icons/square';
	import X from '@lucide/svelte/icons/x';
	import * as m from '$lib/paraglide/messages.js';
	import { formatDuration } from '$lib/presentation/utils/duration-format';
	import { playAlarmSound } from '$lib/presentation/utils/alarm-sound';
	import { showToast, showUndoToast } from '$lib/presentation/utils/toast';
	import { cn } from '$lib/presentation/utils';
	import {
		getElapsedMinutes,
		getRemainingMinutes,
		isAlarmDue,
		pauseTimer,
		runTimer,
		setTarget,
		stopTimer,
		type SessionTimer,
	} from '$lib/business/utils/session-timer';
	import { Button } from '$lib/presentation/component/ui/button';
	import { NumberInput } from '$lib/presentation/component/ui/number-input';

	interface Props {
		today: string;
		/** The day's session clock. Bindable: `SessionTimerStore`'s, so a session started
		 *  on one screen counts on the other and its reading stays the page's. */
		timer: SessionTimer | null;
		getSuggestedMinutes: () => number;
		class?: string;
	}

	let { today, timer = $bindable(), getSuggestedMinutes, class: className }: Props = $props();

	const STEP_MINUTES = 15;
	const MAX_MINUTES = 960;
	const toMinutes = (ms: number) => Math.round(ms / 60_000);

	// Only while running: a paused or stopped reading has nothing left to count.
	let now = $state(Date.now());
	// svelte-ignore state_referenced_locally -- one solve per mount, never per edit
	let targetMinutes = $state(timer?.targetMs ? toMinutes(timer.targetMs) : getSuggestedMinutes());
	let hasAlarmSounded = $state(false);

	// The phase alone: re-aiming a running session writes `timer`, and a rebuilt
	// interval would restart the second it was in the middle of counting.
	$effect(() => {
		if (!isRunning) return;

		now = Date.now();

		const tick = setInterval(() => {
			now = Date.now();

			if (!timer || !isAlarmDue(timer, now)) return;

			showToast.info(m.timer_alarm_toast());
			playAlarmSound();
			hasAlarmSounded = true;
			// Cleared as it rings: no state in which a target exists and has been announced.
			timer = setTarget(timer, null);
		}, 1000);

		return () => clearInterval(tick);
	});

	const elapsedMinutes = $derived(timer ? getElapsedMinutes(timer, now) : 0);
	const remainingMinutes = $derived(timer ? getRemainingMinutes(timer, now) : null);

	const isRunning = $derived(timer?.phase === 'running');
	const isStopped = $derived(timer?.phase === 'stopped');
	// The mark clears itself as it rings, and a restored timer whose target failed
	// validation has none either — so only this clock's own alarm tells the two apart.
	const hasRung = $derived(hasAlarmSounded && timer !== null && timer.targetMs === null);

	const progress = $derived.by(() => {
		if (timer === null || timer.targetMs === null) return hasRung ? 100 : 0;

		return Math.min(100, ((elapsedMinutes * 60_000) / timer.targetMs) * 100);
	});

	const accentClass = $derived(
		!isStopped && hasRung ? 'bg-flow' : isRunning ? 'bg-brand' : 'bg-ty-ghost',
	);

	// One control per role, each outliving every transition it triggers: a phase per
	// `{#if}` unmounted the very button the keyboard had just activated, so focus fell
	// to `<body>` and the next Tab restarted at the top of the document.
	const primaryLabel = $derived(
		timer ? (isRunning ? m.timer_pause() : m.timer_resume()) : m.timer_start(),
	);
	const terminalLabel = $derived(isStopped ? m.timer_discard() : m.timer_stop());

	function onPrimaryClick() {
		if (isRunning && timer) timer = pauseTimer(timer, Date.now());
		else if (timer) timer = runTimer(timer, today, Date.now());
		else timer = runTimer(null, today, Date.now(), targetMinutes * 60_000);
	}

	// A length typed over a session already under way re-aims it, which is the only way
	// to set a second countdown once the first has rung and cleared itself.
	function onLengthChange(minutes: number) {
		targetMinutes = minutes;

		// The field is not clamped until it is left, so the `0` on the way to `15` must
		// not re-aim a running session at zero and ring it a second later.
		if (timer && minutes >= STEP_MINUTES) timer = setTarget(timer, minutes * 60_000);
	}

	function onTerminalClick() {
		if (!timer) return;

		if (!isStopped) {
			timer = stopTimer(timer, Date.now());

			return;
		}

		const discarded = timer;

		timer = null;

		// Refuses onto an occupied clock, the way the sibling undos refuse a moved day:
		// `getPendingMinutes` would seed the next 🪫 editor from a session nobody worked.
		showUndoToast(m.timer_discard_toast(), m.common_undo(), () => {
			if (timer === null) timer = discarded;
		});
	}
</script>

{#snippet divider()}
	<span class="w-px self-stretch bg-line-soft"></span>
{/snippet}

<!-- One bounded object whose outline never changes: the length field and Start occupy
     the same two segments the reading and its controls take over, so no control is
     ever seen to vanish, and progress rides the bottom edge rather than taking a
     third number in the row. 46px on a phone, where a 44px hit target cannot fit in
     the 34px the desktop row gives it. -->
<div
	class={cn(
		'overflow-hidden relative flex shrink-0 rounded-lg border transition-colors has-focus-visible:ring-2 has-focus-visible:ring-ring',
		isStopped ? 'bg-surface-inset' : 'bg-input',
		!isStopped && hasRung ? 'border-flow-line' : 'border-border',
		className,
	)}
>
	<div class="pointer-events-none absolute inset-x-0 bottom-0 h-0.75 bg-line-soft">
		<div
			class="h-full transition-[width] duration-1000 ease-linear {accentClass}"
			style="width: {progress}%"
		></div>
	</div>

	{#if timer}
		<div class="flex items-center gap-2 px-2.5">
			<span
				class="size-1.5 shrink-0 rounded-full {accentClass} {isRunning
					? 'animate-pulse motion-reduce:animate-none'
					: ''}"
			></span>

			<!-- The one number this object exists to produce, and the only one at full ink
			     while it counts. "<1m" for the whole first minute, because "0m" reads as a
			     clock that never started. -->
			<span
				class="text-sm font-semibold tabular-nums {isRunning
					? 'text-ty-primary'
					: 'text-ty-secondary'}"
			>
				{elapsedMinutes === 0 ? m.timer_under_a_minute() : formatDuration(elapsedMinutes / 60)}
			</span>

			{#if remainingMinutes !== null}
				<span class="text-xs whitespace-nowrap tabular-nums text-ty-silent"
					>{m.timer_time_left({
						duration: formatDuration(remainingMinutes / 60),
					})}</span
				>
			{/if}

			<!-- Only a stopped reading is waiting on anything, and neither the minutes nor
			     the ✕ says what for. Visible only: the status below already announces the
			     phase, and a screen reader reads this line where it stands. -->
			{#if isStopped}
				<span class="text-xs whitespace-nowrap text-ty-silent">{m.timer_pending_drain()}</span>
			{/if}
		</div>
	{/if}

	<!-- Gone once the reading is final: a stopped clock has nothing left to aim, and
	     discarding it is the only way back to a fresh one. Demoted while a session
	     runs — the loudest thing in the row must not be the one that has done its job
	     — but still typeable, since re-aiming is the only way to set a second countdown. -->
	{#if !isStopped}
		{#if timer}{@render divider()}{/if}
		<!-- The clock IS the bordered, filled, ringed object, so the field drops all three
		     rather than drawing a second one inside it. -->
		<NumberInput
			value={targetMinutes}
			onchange={onLengthChange}
			min={STEP_MINUTES}
			max={MAX_MINUTES}
			step={STEP_MINUTES}
			unit={m.timer_length_unit()}
			ariaLabel={m.timer_length_label()}
			class="max-w-30 self-center rounded-none border-0 bg-transparent transition-opacity has-focus-visible:ring-0 {timer
				? 'opacity-70 hover:opacity-100 focus-within:opacity-100'
				: ''}"
		/>
	{/if}

	{@render divider()}

	<div class="flex">
		<!-- No Start on a stopped timer: the reading cannot be silently replaced by a
		     second run, and discarding it is the only way back to a fresh clock. -->
		{#if !isStopped}
			<!-- One button across the phases, so the keyboard keeps the control it just
			     activated. A word until there is a reading — a bare glyph is the whole
			     invitation to measure a session — and Pause then takes over the same
			     slot rather than reappearing smaller somewhere else. -->
			<Button
				variant="ghost"
				size={timer ? 'icon-sm' : 'sm'}
				class="focus-visible:ring-0 focus-visible:inset-ring-2 focus-visible:inset-ring-ring {timer
					? ''
					: 'rounded-none px-2.5'}"
				aria-label={primaryLabel}
				onclick={onPrimaryClick}
			>
				{#if isRunning}
					<Pause />
				{:else}
					<Play class={timer ? '' : 'text-brand'} />
				{/if}
				{#if !timer}{m.timer_start()}{/if}
			</Button>
		{/if}

		{#if timer}
			<Button
				variant="ghost"
				size="icon-sm"
				class="hover:text-brand-strong focus-visible:ring-0 focus-visible:inset-ring-2 focus-visible:inset-ring-ring"
				aria-label={terminalLabel}
				onclick={onTerminalClick}
			>
				{#if isStopped}
					<X />
				{:else}
					<Square />
				{/if}
			</Button>
		{/if}
	</div>

	<!-- The transition, not the count: the readout ticks all session, so a live
	     region on it would read the minutes out one by one. This says what the
	     clock now offers, which changes exactly once per phase. -->
	<span class="sr-only" role="status">
		{isStopped ? terminalLabel : primaryLabel}
	</span>
</div>
