/* One reading of the optimizer's blocks for the two components that draw them — the bar
   and the schedule list are two paints of one plan (presentation/AGENTS.md, "A finished
   task's blocks read as finished"), so the questions they ask of it are asked once. */

import type { EvaluatedBlock } from '$lib/business/model/zenith-energy';

/** Floating-point dust, not free time: the optimizer's hours rarely sum to the window
 *  exactly, and a 1e-12 tail is a segment nobody can hit and a row of zeroes. */
export const FREE_EPSILON = 1e-6;

export const isBlockDone = (block: EvaluatedBlock, completedTaskIds: number[]) =>
	block.taskId !== null && completedTaskIds.includes(block.taskId);
