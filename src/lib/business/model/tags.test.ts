import { describe, it, expect } from 'vitest';
import type { DailySession, DrainObservationRecord, Task } from '$lib/data/type';
import {
	collectTags,
	removeTagFromTasks,
	renameTagInTasks,
	tagHours,
	toStoredTags,
} from '$lib/business/model/tags';
import { loggedHours } from '$lib/business/model/metric/history';

const RANGE_START = '2026-07-14';

function task(id: number, tags?: string[]): Task {
	return {
		id,
		title: `task ${id}`,
		physicalDifficulty: 3,
		mentalDifficulty: 5,
		enjoyment: 5,
		createdAt: '2026-07-14',
		completed: false,
		...(tags && {
			tags,
		}),
	};
}

function day(date: string, tasks: Task[]): DailySession {
	return {
		date,
		tasks,
		availableHours: 6,
		switchCost: 0.25,
		updatedAt: 0,
	};
}

function drain(date: string, taskId: number, hours: number): DrainObservationRecord {
	return {
		date,
		taskId,
		taskTitle: `task ${taskId}`,
		hours,
		cognitiveDemand: 0.5,
		physicalDemand: 0.3,
		mindDrain: 6,
		bodyDrain: 2,
		createdAt: 0,
	};
}

describe('tagHours', () => {
	it('names each tag’s logged hours, most first', () => {
		const days = [day('2026-07-15', [task(1, ['exercise']), task(2, ['school'])])];
		const rows = [drain('2026-07-15', 1, 2), drain('2026-07-15', 2, 5)];

		expect(tagHours(rows, days, RANGE_START)).toEqual({
			tags: [
				{
					tag: 'school',
					hours: 5,
				},
				{
					tag: 'exercise',
					hours: 2,
				},
			],
			untaggedHours: 0,
		});
	});

	// The card breaks the "Logged hours" tile down, so the parts have to add up to it.
	// Single-tag tasks only: a two-tag hour counts under both by design (below).
	it('adds up to loggedHours over single-tag days', () => {
		let seed = 7;
		const random = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
		// One day object per date, holding every task logged on it: `tagHours` keys its
		// lookup by date, so tasks split across two objects for one date would be
		// unfindable and the identity would hold by everything falling to untagged.
		const tasksByDate = new Map<string, Task[]>();
		const rows: DrainObservationRecord[] = [];

		for (let index = 0; index < 60; index++) {
			const date = `2026-07-${String(10 + (index % 20)).padStart(2, '0')}`;
			const id = index + 1;
			const pick = Math.floor(random() * 3);
			const held = tasksByDate.get(date) ?? [];

			held.push(task(id, pick === 2 ? undefined : [['exercise', 'school'][pick]]));
			tasksByDate.set(date, held);
			rows.push(drain(date, id, Math.round(random() * 800) / 100));
		}

		const days = [...tasksByDate].map(([date, tasks]) => day(date, tasks));
		const { tags, untaggedHours } = tagHours(rows, days, RANGE_START);
		const total = tags.reduce((sum, row) => sum + row.hours, 0) + untaggedHours;

		// Both sides carry real weight, or the identity would hold on a join that
		// never matched and sent every hour to the untagged row.
		expect(tags.map((row) => row.tag).sort()).toEqual(['exercise', 'school']);
		expect(untaggedHours).toBeGreaterThan(0);
		expect(tags.reduce((sum, row) => sum + row.hours, 0)).toBeGreaterThan(untaggedHours);

		expect(Math.round(total * 10) / 10 + 0).toBeCloseTo(loggedHours(rows, RANGE_START), 10);
	});

	it('counts a two-tag task’s hours once under each tag', () => {
		const days = [day('2026-07-15', [task(1, ['exercise', 'self care'])])];

		expect(tagHours([drain('2026-07-15', 1, 2)], days, RANGE_START).tags).toEqual([
			{
				tag: 'exercise',
				hours: 2,
			},
			{
				tag: 'self care',
				hours: 2,
			},
		]);
	});

	// One definition of "the same tag": case and spacing are not three tags.
	it('folds every spelling of one tag into one row', () => {
		const days = [
			day('2026-07-15', [task(1, ['Exercise'])]),
			day('2026-07-16', [task(2, ['EXERCISE'])]),
			day('2026-07-17', [task(3, ['  exercise  '])]),
		];

		const rows = [drain('2026-07-15', 1, 1), drain('2026-07-16', 2, 1), drain('2026-07-17', 3, 1)];

		expect(tagHours(rows, days, RANGE_START).tags).toEqual([
			{
				tag: 'exercise',
				hours: 3,
			},
		]);
	});

	it('counts the rows loggedHours counts, and no others', () => {
		const days = [
			day('2026-07-01', [task(1, ['exercise'])]),
			day('2026-07-15', [task(2, ['exercise']), task(3, ['exercise'])]),
		];

		const rows = [
			drain('2026-07-01', 1, 4), // before the range
			drain('2026-07-15', 2, 0), // not a session
			drain('2026-07-15', 3, 2),
		];

		expect(tagHours(rows, days, RANGE_START).tags).toEqual([
			{
				tag: 'exercise',
				hours: 2,
			},
		]);
	});

	it('reads a log whose task is gone as untagged', () => {
		const days = [day('2026-07-15', [task(1, ['exercise'])])];

		expect(tagHours([drain('2026-07-15', 99, 3)], days, RANGE_START)).toEqual({
			tags: [],
			untaggedHours: 3,
		});
	});

	it('says nothing was logged in an empty range', () => {
		expect(tagHours([], [], RANGE_START)).toEqual({
			tags: [],
			untaggedHours: 0,
		});
	});
});

describe('toStoredTags', () => {
	it('normalizes, dedupes and drops what is left of nothing', () => {
		expect(toStoredTags(['  Exercise ', 'EXERCISE', '   ', 'self  care'])).toEqual([
			'exercise',
			'self care',
		]);
	});

	// Absent, never `[]`: a stored empty array is a claim where there is none.
	it('is undefined when no tag survives', () => {
		expect(toStoredTags([' ', 42])).toBeUndefined();
		expect(toStoredTags(undefined)).toBeUndefined();
	});
});

describe('collectTags', () => {
	it('lists every tag the stored days carry, alphabetically and once each', () => {
		const days = [
			day('2026-07-15', [task(1, ['school']), task(2, ['exercise'])]),
			day('2026-07-16', [task(3, ['exercise']), task(4)]),
		];

		expect(collectTags(days)).toEqual(['exercise', 'school']);
	});
});

describe('renameTagInTasks', () => {
	// The two cases a task can be in, over random lists: it carries the old
	// spelling (alone or beside the new one) or it does not. A rename onto a tag
	// the task already has must leave one tag, not a duplicate the card would
	// count twice; a day no task of which carries the old spelling must come back
	// identical, because that is what tells the caller not to write it.
	it('leaves `to` exactly once on any task that carried either', () => {
		let seed = 11;
		const random = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
		const vocabulary = ['dep work', 'deep work', 'school', 'exercise'];

		for (let round = 0; round < 200; round++) {
			const tasks = Array.from(
				{
					length: 1 + Math.floor(random() * 4),
				},
				(_, index) => {
					const picked = vocabulary.filter(() => random() < 0.4);

					return task(index + 1, picked.length > 0 ? picked : undefined);
				},
			);

			const renamed = renameTagInTasks(tasks, 'dep work', 'deep work');

			if (!tasks.some((t) => t.tags?.includes('dep work'))) {
				expect(renamed).toBe(tasks);
				continue;
			}

			expect(renamed).not.toBe(tasks);

			for (const [index, after] of renamed.entries()) {
				const before = tasks[index].tags ?? [];

				if (!before.includes('dep work')) {
					expect(after).toBe(tasks[index]);
					continue;
				}

				expect(after.tags?.filter((tag) => tag === 'deep work')).toEqual(['deep work']);
				expect(after.tags).not.toContain('dep work');
			}
		}
	});

	// Reachable through `$importAllStores`, which puts a restored record back
	// unvalidated: `tagHours` keys on the normalized tag but adds the row's hours
	// once per raw one, so two spellings left side by side count the day twice.
	it('leaves one spelling behind when the task already carried `to` in another case', () => {
		const renamed = renameTagInTasks([task(1, ['dep work', 'Deep Work'])], 'dep work', 'deep work');

		expect(renamed[0].tags).toEqual(['deep work']);
	});
});

describe('removeTagFromTasks', () => {
	// Identity when nothing carries the tag, for the reason the rename has it: it is
	// what tells the caller not to write that day.
	it('returns the list unchanged when no task carries the tag', () => {
		const tasks = [task(1, ['school']), task(2)];

		expect(removeTagFromTasks(tasks, 'errand')).toBe(tasks);
	});

	// `toStoredTags` says a tagless task carries no `tags` field, not `[]` — the
	// delete has to leave the record in the shape a read validates.
	it('takes the tag off, and the field with it when nothing is left', () => {
		const tasks = [task(1, ['errand', 'school']), task(2, ['errand']), task(3, ['school'])];
		const left = removeTagFromTasks(tasks, 'errand');

		expect(left[0].tags).toEqual(['school']);
		expect('tags' in left[1]).toBe(false);
		expect(left[2]).toBe(tasks[2]);
	});

	// Matched the way `tagHours` reads one, or the row the user pressed ✕ on would
	// come back on the next reload (the rename fold's argument, same fold).
	it('matches every spelling of the tag', () => {
		expect(removeTagFromTasks([task(1, ['  Errand '])], 'errand')[0].tags).toBeUndefined();
	});
});
