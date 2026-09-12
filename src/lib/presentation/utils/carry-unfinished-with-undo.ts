import type { SessionStore } from '$lib/business/store/session-store.svelte';
import { showUndoToast } from '$lib/presentation/utils/toast';
import * as m from '$lib/paraglide/messages.js';

/**
 * Carry the day's unfinished tasks now and offer them back while the toast lives —
 * `removeTaskWithUndo` for the carry control. The count is read before the move
 * empties it.
 */
export async function carryUnfinishedWithUndo(session: SessionStore) {
	const count = session.carryableCount;
	const carried = await session.carryUnfinishedToTomorrow();

	if (!carried) return;

	const undo = session.undoCarry;

	showUndoToast(
		m.carry_toast({
			count,
		}),
		m.common_undo(),
		() => void undo?.(),
	);
}
