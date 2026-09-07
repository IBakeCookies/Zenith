import { describe, it, expect } from 'vitest';
import { normalizeTitle } from '$lib/business/utils/title';

describe('normalizeTitle', () => {
	it('matches titles that differ only in case or spacing', () => {
		expect(normalizeTitle('  Gym   Session ')).toBe('gym session');
		expect(normalizeTitle('gym session')).toBe('gym session');
	});

	it('keeps titles that differ in their words apart', () => {
		expect(normalizeTitle('Gym')).not.toBe(normalizeTitle('Gymnastics'));
	});

	// One accent, two encodings, and where the text came from picks which: a
	// keyboard composes é, but macOS stores filenames decomposed, so a title
	// pasted from one arrives as e + ◌́. Two keys for one word hides the rating
	// under whichever spelling the user is not typing today. Escaped, because
	// the two spellings are indistinguishable on this line.
	it('matches titles that differ only in how an accent is encoded', () => {
		expect(normalizeTitle('Caf\u00e9')).toBe('caf\u00e9'); // composed
		expect(normalizeTitle('Cafe\u0301')).toBe('caf\u00e9'); // decomposed
	});

	it('reduces a title of nothing but spaces to the empty key', () => {
		expect(normalizeTitle('   ')).toBe('');
	});
});
