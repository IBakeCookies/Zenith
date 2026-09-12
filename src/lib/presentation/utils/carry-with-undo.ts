import type { SessionStore } from '$lib/business/store/session-store.svelte';
import { showUndoToast } from '$lib/presentation/utils/toast';
import * as m from '$lib/paraglide/messages.js';

/**
 * The two tomorrow moves, each offered back while its toast lives —
 * `removeTaskWithUndo` for the carry control and for the advice card's lever. The
 * way back is read off the store right after the move (`undoCarry` is a stash, since
 * both moves answer whether they moved) so a later move cannot re-aim this toast.
 * The count is read before the carry empties it.
 */
export async function carryUnfinishedWithUndo(session: SessionStore) {
	const count = session.carryableCount;

	if (!(await session.carryUnfinishedToTomorrow())) return;

	const undo = session.undoCarry;

	showUndoToast(
		m.carry_toast({
			count,
		}),
		m.common_undo(),
		() => void undo?.(),
	);
}

export async function moveTaskToTomorrowWithUndo(session: SessionStore, id: number) {
	const task = session.tasks.find((t) => t.id === id);

	if (!task || !(await session.moveTaskToTomorrow(id))) return;

	const undo = session.undoCarry;

	showUndoToast(
		m.move_toast({
			title: task.title,
		}),
		m.common_undo(),
		() => void undo?.(),
	);
}
