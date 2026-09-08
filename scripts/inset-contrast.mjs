// Check the recessed surface rung against the card it is cut into, in every
// theme:
//   npm run storybook   # this one drives :6006, like hover-contrast.mjs
//   node scripts/inset-contrast.mjs           # all 46
//   node scripts/inset-contrast.mjs abyss     # one theme
// Same chromium prerequisite as hover-contrast.mjs (see .claude/skills/verify/SKILL.md).
//
// `--surface-inset` is DERIVED from `--surface-card` per side — a step down on a
// light page and up on a dark one (base.css) — so no theme declares the pair
// this measures and changing the step changes all 46 at once. That derivation
// replaced 45 hand-set declarations, 22 of which put black at alpha over a page
// already at L 0.09-0.16: a well cut into a floor that was already the bottom,
// measured 1.013-1.079 against its own card, i.e. invisible. This script is the
// regression check for the thing that fixed, and the reason the step is the
// number it is.
//
// Measured from RENDERED PIXELS, because computed style cannot answer the
// question: the token resolves to oklch(from ... ) with alpha, so what the eye
// gets only exists after compositing over the theme's own card — which is
// itself translucent over a page, a gradient or a background photo on most
// themes.
//
// It has to be the inset against ITS OWN CARD and not against the page, which
// is why this drives a story built for it rather than Theme > Swatches: every
// swatch there sits on the page, and an inset that reads clearly against the
// page can still vanish into the card it actually lives in. That was the exact
// failure the derivation fixed.
//
// Reads per theme, all CONTRAST RATIOS:
//   step — the well reads as distinct from the card around it
//   cr, and five more — `--ty-secondary` and `--ty-silent` composited over
//   the inset, the card and the page, plus the primary/secondary and
//   secondary/silent rung steps composited on each of those three surfaces
//
// step is a ratio and not a difference of luminances for the reason
// hover-contrast.mjs gives at length: relative luminance is compressed near
// black, so one unchanging tint measures a 27x spread of dL across this
// catalogue and a dL threshold can only ever be calibrated for one end of it.
//
// MIN_STEP is hover-contrast.mjs's bound and carries that script's calibration,
// not a fresh one: it sits between the palette caps that cannot move and the
// faintest step the design ships, so it does not flip on rounding.
//
// An animated theme can flash something bright across the sample patch
// mid-measurement — `orbit` did it once to hover-contrast at 16.5 against 1.34
// on the three runs after. Re-run the one theme before believing a wild reading
// on a theme whose scenery moves.
import { chromium } from 'playwright';
import { readFileSync } from 'fs';

// Read the catalogue instead of duplicating it — a hand-copied list silently
// stops covering new themes, which is the one thing this script is for.
const only = process.argv.slice(2);

const THEMES = [
	...readFileSync('src/lib/business/model/theme.ts', 'utf8').matchAll(/name: '([^']+)',/g),
]
	.map((m) => m[1])
	.filter((n) => n !== 'ThemeName' && (!only.length || only.includes(n)));

const MIN_STEP = 1.03;
const MIN_CR = 4.5;

/** @param {number[]} rgb */
const lum = ([r, g, b]) => {
	/** @param {number} c */
	const f = (c) => ((c /= 255) <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);

	return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};

/**
 * @param {number[]} a
 * @param {number[]} b
 */
const ratio = (a, b) => {
	const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);

	return (hi + 0.05) / (lo + 0.05);
};

const browser = await chromium.launch();

const page = await browser.newPage({
	viewport: {
		width: 900,
		height: 400,
	},
});

// any CSS colour -> the sRGB the eye gets, via the browser: these tokens are
// oklab/oklch, and the ink among them is TRANSLUCENT — `--ty-secondary` is
// `--ty-primary` at 70% over transparent (base.css). Painting it on a bare
// canvas returns the un-premultiplied colour, i.e. the label as if it were
// opaque, so the background it is actually drawn over has to go down first.
/**
 * @param {string} css
 * @param {number[]} bg
 */
const composite = (css, bg) =>
	page.evaluate(
		([c, b]) => {
			const cv = document.createElement('canvas');
			cv.width = cv.height = 1;
			const ctx = /** @type {CanvasRenderingContext2D} */ (cv.getContext('2d'));
			ctx.fillStyle = `rgb(${b[0]} ${b[1]} ${b[2]})`;
			ctx.fillRect(0, 0, 1, 1);
			ctx.fillStyle = c;
			ctx.fillRect(0, 0, 1, 1);

			return [...ctx.getImageData(0, 0, 1, 1).data].slice(0, 3);
		},
		/** @type {[string, number[]]} */ ([css, bg.map(Math.round)]),
	);

// mean sRGB over a clip, decoded by the same browser rather than by a decoder
// here. A patch and not one pixel, for hover-contrast's reason: a single sample
// lands on antialiasing at a rounded corner or on one bright spot of a
// background photo and reports a change that is not there.
/** @param {{ x: number; y: number; width: number; height: number }} clip */
const sample = async (clip) => {
	const png = (
		await page.screenshot({
			clip,
		})
	).toString('base64');

	return page.evaluate(async (b64) => {
		const bin = atob(b64);
		const buf = new Uint8Array(bin.length);

		for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);

		const img = await createImageBitmap(new Blob([buf]));
		const cv = new OffscreenCanvas(img.width, img.height);
		const ctx = /** @type {OffscreenCanvasRenderingContext2D} */ (cv.getContext('2d'));
		ctx.drawImage(img, 0, 0);

		const px = ctx.getImageData(0, 0, img.width, img.height).data;
		const sum = [0, 0, 0];

		for (let i = 0; i < px.length; i += 4) for (let c = 0; c < 3; c++) sum[c] += px[i + c];

		return sum.map((v) => v / (px.length / 4));
	}, png);
};

/** @param {number[]} values */
const median = (values) => {
	const sorted = [...values].sort((a, b) => a - b);
	const mid = Math.floor(sorted.length / 2);

	return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

const fails = [];
/** @type {{ theme: string; step: number; cr: number; secPageCr: number; secCardCr: number; silPageCr: number; silCardCr: number; silInsetCr: number; rung: Record<'page' | 'card' | 'inset', { ps: number; ss: number }> }[]} */
const results = [];

for (const theme of THEMES) {
	await page.goto(
		`http://localhost:6006/iframe.html?id=theme--inset-on-card&globals=theme:${theme}`,
		{
			waitUntil: 'networkidle',
		},
	);

	const well = page.getByTestId('inset-well');
	const card = page.getByTestId('inset-card');

	await well.waitFor();

	const wellBox = await well.boundingBox();
	const cardBox = await card.boundingBox();

	// A locator that matches nothing times out rather than returning null, so null
	// means the element is in the DOM with no box — a zero-size or hidden ancestor.
	if (!wellBox || !cardBox) throw new Error(`${theme}: inset-well or inset-card has no box`);

	// The strip between the two labels: inside the well, clear of its rounded
	// corners and of both label glyphs.
	const inset = {
		x: Math.round(wellBox.x + wellBox.width / 2) - 8,
		y: Math.round(wellBox.y) + 3,
		width: 16,
		height: Math.round(wellBox.height) - 6,
	};

	// The card's own padding, left of the well: the surface the well is cut into.
	// `p-box-xl` is what leaves room for this, so it is a fact of the story.
	const around = {
		x: Math.round(cardBox.x) + 4,
		y: Math.round(wellBox.y) + 3,
		width: 8,
		height: Math.round(wellBox.height) - 6,
	};

	// The bare page, left of the card: the third surface content sits on.
	if (cardBox.x < 12) throw new Error(`${theme}: card too close to the page edge to sample`);

	const pagePatch = {
		x: Math.round(cardBox.x) - 12,
		y: Math.round(wellBox.y) + 3,
		width: 8,
		height: Math.round(wellBox.height) - 6,
	};

	// Let scenery settle before sampling: hover-contrast is documented flaky for
	// want of exactly this, and an animated theme is the case it misreads.
	await page.waitForTimeout(400);

	const insetPx = await sample(inset);
	const cardPx = await sample(around);
	const pagePx = await sample(pagePatch);
	const primaryCss = await card.evaluate((n) => getComputedStyle(n).color);

	const secondaryCss = await well.evaluate(
		(n) => getComputedStyle(/** @type {Element} */ (n.firstElementChild)).color,
	);

	const silentCss = await page.getByTestId('silent-ink').evaluate((n) => getComputedStyle(n).color);
	const primaryOnPage = await composite(primaryCss, pagePx);
	const primaryOnCard = await composite(primaryCss, cardPx);
	const primaryOnInset = await composite(primaryCss, insetPx);
	const secondaryOnPage = await composite(secondaryCss, pagePx);
	const secondaryOnCard = await composite(secondaryCss, cardPx);
	const secondaryOnInset = await composite(secondaryCss, insetPx);
	const silentOnPage = await composite(silentCss, pagePx);
	const silentOnCard = await composite(silentCss, cardPx);
	const silentOnInset = await composite(silentCss, insetPx);
	const step = ratio(insetPx, cardPx);
	const cr = ratio(secondaryOnInset, insetPx);
	const secPageCr = ratio(secondaryOnPage, pagePx);
	const secCardCr = ratio(secondaryOnCard, cardPx);
	const silPageCr = ratio(silentOnPage, pagePx);
	const silCardCr = ratio(silentOnCard, cardPx);
	const silInsetCr = ratio(silentOnInset, insetPx);

	const rung = {
		page: {
			ps: ratio(primaryOnPage, secondaryOnPage),
			ss: ratio(secondaryOnPage, silentOnPage),
		},
		card: {
			ps: ratio(primaryOnCard, secondaryOnCard),
			ss: ratio(secondaryOnCard, silentOnCard),
		},
		inset: {
			ps: ratio(primaryOnInset, secondaryOnInset),
			ss: ratio(secondaryOnInset, silentOnInset),
		},
	};

	console.log(
		`${theme.padEnd(14)} step=${step.toFixed(3)} cr=${cr.toFixed(2)} ` +
			`sec(page=${secPageCr.toFixed(2)} card=${secCardCr.toFixed(2)}) ` +
			`sil(page=${silPageCr.toFixed(2)} card=${silCardCr.toFixed(2)} inset=${silInsetCr.toFixed(2)}) ` +
			`rung(page=${rung.page.ps.toFixed(2)}/${rung.page.ss.toFixed(2)} ` +
			`card=${rung.card.ps.toFixed(2)}/${rung.card.ss.toFixed(2)} ` +
			`inset=${rung.inset.ps.toFixed(2)}/${rung.inset.ss.toFixed(2)})`,
	);

	results.push({
		theme,
		step,
		cr,
		secPageCr,
		secCardCr,
		silPageCr,
		silCardCr,
		silInsetCr,
		rung,
	});

	if (step < MIN_STEP)
		fails.push(`${theme}: inset invisible against its card (step ${step.toFixed(3)})`);

	if (cr < MIN_CR) fails.push(`${theme}: log-row label ${cr.toFixed(2)}:1 on the inset`);

	if (secCardCr < MIN_CR) fails.push(`${theme}: secondary ${secCardCr.toFixed(2)}:1 on the card`);

	if (silCardCr < MIN_CR) fails.push(`${theme}: silent ${silCardCr.toFixed(2)}:1 on the card`);

	if (silInsetCr < MIN_CR) fails.push(`${theme}: silent ${silInsetCr.toFixed(2)}:1 on the inset`);

	for (const [well, steps] of Object.entries(rung)) {
		if (steps.ps < MIN_STEP)
			fails.push(`${theme}: ${well} primary/secondary step ${steps.ps.toFixed(3)}`);

		if (steps.ss < MIN_STEP)
			fails.push(`${theme}: ${well} secondary/silent step ${steps.ss.toFixed(3)}`);
	}
}

await browser.close();

console.log('\nsummary:');

for (const [
	label,
	pick,
	checked,
] of /** @type {[string, (r: (typeof results)[number]) => number, boolean][]} */ ([
	['secondary/page', (r) => r.secPageCr, false],
	['secondary/card', (r) => r.secCardCr, true],
	['secondary/inset (cr)', (r) => r.cr, true],
	['silent/page', (r) => r.silPageCr, false],
	['silent/card', (r) => r.silCardCr, true],
	['silent/inset', (r) => r.silInsetCr, true],
])) {
	const values = results.map(pick);
	const under = checked ? results.filter((r) => pick(r) < MIN_CR).map((r) => r.theme) : [];

	console.log(
		`  ${label}: min=${Math.min(...values).toFixed(2)} median=${median(values).toFixed(2)}${
			checked ? ` under ${MIN_CR}: ${under.length ? under.join(', ') : 'none'}` : ''
		}`,
	);
}

for (const well of /** @type {const} */ (['page', 'card', 'inset'])) {
	for (const [key, label] of /** @type {[string, string][]} */ ([
		['ps', 'primary/secondary'],
		['ss', 'secondary/silent'],
	])) {
		const values = results.map((r) => r.rung[well][/** @type {'ps' | 'ss'} */ (key)]);

		const under = results
			.filter((r) => r.rung[well][/** @type {'ps' | 'ss'} */ (key)] < MIN_STEP)
			.map((r) => r.theme);

		console.log(
			`  ${well} ${label} step: min=${Math.min(...values).toFixed(3)} under ${MIN_STEP}: ${under.length ? under.join(', ') : 'none'}`,
		);
	}
}

if (fails.length) {
	console.log(`\n${fails.length} findings:`);
	for (const f of fails) console.log(`  ${f}`);
} else {
	console.log('\nno findings');
}
