/**
 * The one definition of "the same task title" (AGENTS.md R3) — the title map is
 * keyed with it, every lookup goes through it, `normalizeTag` IS it, and it is
 * what makes a query match in any case or spacing. A second spelling of this
 * rule would make a remembered rating unreachable from the title that produced
 * it, and let the tag field show two chips the save then folds into one.
 *
 * In `utils/` rather than beside its model callers because the tag field's own
 * duplicate guard has to ask the same question, and a component may not reach a
 * model (`presentation-not-to-business-model`).
 *
 * NFC last, not first: lowercasing can decompose what it folds, so composing
 * afterwards is the one call that leaves every accent in a single spelling.
 */
export function normalizeTitle(title: string): string {
	return title.trim().toLowerCase().replace(/\s+/g, ' ').normalize('NFC');
}
