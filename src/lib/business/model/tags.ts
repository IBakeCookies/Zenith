/**
 * The labels a user puts on a task, and what the analytics screen's range of
 * 🪫 logs adds up to under each of them.
 *
 * A tag enters no formula: the allocator, the energy mode and the plan advice
 * never read one. This is a fold over rows the model already defines, joined to
 * the stored day by `date` + `taskId` — so re-tagging a task re-attributes the
 * hours it already logged, which is the point of a label.
 */

import type { DailySession, DrainObservationRecord, Task } from '$lib/data/type';
import { normalizeTitle } from '$lib/business/utils/title';

export interface TagHours {
	tag: string;
	hours: number;
}

export interface TagHoursBreakdown {
	tags: TagHours[];
	untaggedHours: number;
}

type TaggedDay = {
	date: string;
	tasks: Task[];
};

/** A tag is typed free-hand like a title, so "the same tag" is the same question
 *  as "the same title" and gets the one answer there is (AGENTS.md R3). */
export const normalizeTag = normalizeTitle;

/** The tags of one task as they are stored: normalized, deduped, and absent
 *  rather than `[]` — a stored empty array is a claim where there is none. */
export function toStoredTags(raw: unknown): string[] | undefined {
	if (!Array.isArray(raw)) return undefined;

	const tags = [
		...new Set(
			raw
				.filter((tag): tag is string => typeof tag === 'string')
				.map(normalizeTag)
				.filter((tag) => tag.length > 0),
		),
	];

	return tags.length > 0 ? tags : undefined;
}

/** Every tag the stored days carry, alphabetically and once each — the tag
 *  field's `<datalist>`, which is the user's own history and nothing else. */
export function collectTags(sessions: DailySession[]): string[] {
	const tags = new Set<string>();

	for (const session of sessions)
		for (const task of session.tasks) for (const tag of task.tags ?? []) tags.add(tag);

	return [...tags].sort((a, b) => a.localeCompare(b));
}

/**
 * One tag respelled across a list of tasks. Returns the list — and each task —
 * unchanged by IDENTITY when nothing carries `from`, which is what tells a
 * caller not to write that day. A task already carrying `to` keeps it once, or
 * the card would count its hours twice.
 *
 * Matched — and deduped — on the NORMALIZED tag, the way `tagHours` reads one: a
 * stored spelling that only a restored backup can carry (`Deep Work`) shows up
 * under the row the user is renaming, so a rename that missed it would leave the
 * row it was told to fix standing, and one left beside `to` would have the task's
 * hours counted under it twice.
 */
export function renameTagInTasks(tasks: Task[], from: string, to: string): Task[] {
	const oldTag = normalizeTag(from);
	const newTag = normalizeTag(to);
	let hasChanged = false;

	const renamed = tasks.map((task) => {
		if (!task.tags?.some((tag) => normalizeTag(tag) === oldTag)) return task;

		hasChanged = true;

		const tags: string[] = [];

		for (const tag of task.tags) {
			const kept = normalizeTag(tag) === oldTag ? newTag : tag;

			if (!tags.some((held) => normalizeTag(held) === normalizeTag(kept))) tags.push(kept);
		}

		return {
			...task,
			tags,
		};
	});

	return hasChanged ? renamed : tasks;
}

/**
 * One tag taken off a list of tasks — the card's delete. Identity on both levels
 * where nothing carried it, like the rename above, and normalized the same way.
 * A task left with no tag loses the field rather than keeping `[]`, which is the
 * shape `toStoredTags` says a stored task has.
 */
export function removeTagFromTasks(tasks: Task[], tag: string): Task[] {
	const dropped = normalizeTag(tag);
	let hasChanged = false;

	const left = tasks.map((task) => {
		if (!task.tags?.some((held) => normalizeTag(held) === dropped)) return task;

		hasChanged = true;

		const tags = task.tags.filter((held) => normalizeTag(held) !== dropped);

		const kept: Task = {
			...task,
			tags,
		};

		// Deleted, not set to `undefined`: a stored task that kept the key would
		// carry an empty claim, which is the shape `toStoredTags` refuses.
		if (tags.length === 0) delete kept.tags;

		return kept;
	});

	return hasChanged ? left : tasks;
}

/**
 * The range's 🪫-logged hours per tag, most first, plus what was logged on
 * tasks carrying none. A task with two tags counts its hours under both, so the
 * rows can add up to more than the total.
 */
export function tagHours(
	drain: DrainObservationRecord[],
	days: TaggedDay[],
	rangeStart: string,
): TagHoursBreakdown {
	const tasksByDate = new Map(
		days.map((day) => [day.date, new Map(day.tasks.map((task) => [task.id, task]))]),
	);

	const hoursByTag = new Map<string, number>();
	let untaggedHours = 0;

	for (const row of drain) {
		// `loggedHours`' filter, spelled the same way: this card breaks that total
		// down, and two rules would put two numbers that disagree on one screen.
		if (!(row.date >= rangeStart && row.hours > 0)) continue;

		const tags = tasksByDate.get(row.date)?.get(row.taskId)?.tags;

		// A log whose task is gone reads as untagged rather than being dropped, or
		// the breakdown would silently stop adding up to the tile above it.
		if (!tags || tags.length === 0) {
			untaggedHours += row.hours;
			continue;
		}

		for (const tag of tags) {
			const key = normalizeTag(tag);

			hoursByTag.set(key, (hoursByTag.get(key) ?? 0) + row.hours);
		}
	}

	return {
		// Unrounded: the parts have to add up to what `loggedHours` was given, and
		// the card is what rounds a row to a tenth for display.
		tags: [...hoursByTag]
			.map(([tag, hours]) => ({
				tag,
				hours,
			}))
			.sort((a, b) => b.hours - a.hours || a.tag.localeCompare(b.tag)),
		untaggedHours,
	};
}
