import { updated } from '$app/state';
import * as m from '$lib/paraglide/messages.js';
import { showUpdateToast } from '$lib/presentation/utils/toast';

/**
 * Offer the new build when the user comes back to a tab that was loaded before a
 * deploy, and return the teardown for the `(app)` layout's `onMount` to return.
 * Why a refocus and not a timer, and why `check()` needs no guard around it:
 * docs/deployment.md.
 */
export function watchVersionUpdates() {
	const onVisibilityChange = async () => {
		if (document.visibilityState !== 'visible') return;

		if (await updated.check()) {
			showUpdateToast(m.version_update(), m.version_update_reload(), () => location.reload());
		}
	};

	document.addEventListener('visibilitychange', onVisibilityChange);

	return () => document.removeEventListener('visibilitychange', onVisibilityChange);
}
