// A Stop hook: refuse to finish while the working tree fails checks the repo
// already has.
//
// The eval that motivated this measured 294 scored rule-outcomes across five
// sweeps. Rules eslint already enforces were still broken about a third of the
// time — `convention.no-relative-import` 6/10, R1 37/57 — and an agent that had
// run the linter could not have failed either. So the gap was never the wording
// of the rule; it was that nothing made the check run. Prose competes for
// attention, a hook does not.
//
// Prettier and eslint are scoped to the changed files on purpose: a
// pre-existing error somewhere untouched must not block a finish, or the hook
// trains people to disable it. `check` and the doc scripts take no paths and
// cannot be — `check` only skips the stops where nothing but `.md` changed, so
// a docs-only finish does not pay 17 s to type-check prose.
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

const LINTABLE = /\.(m?js|ts|svelte)$/u;

const run = (file, args) => {
	try {
		execFileSync(file, args, {
			encoding: 'utf8',
			stdio: 'pipe',
		});

		return null;
	} catch (error) {
		return `${error.stdout ?? ''}${error.stderr ?? ''}`.trim();
	}
};

// `stop_hook_active` is true when this hook already blocked once and the model
// is stopping again. Blocking twice on the same turn is how a Stop hook turns
// into a loop, so the second stop is always allowed through.
const input = JSON.parse(readFileSync(0, 'utf8') || '{}');

if (input.stop_hook_active) process.exit(0);

// Existence is re-checked immediately before each command that takes paths, not
// once up front: the repo is edited in parallel and this hook runs for seconds
// rather than milliseconds — mostly `check` — so a scratch file can be deleted
// inside the window, and eslint exits on ENOENT, a failure with no fix reported
// as one to fix. An empty surviving list means "nothing left to hand this
// command", never "nothing changed": deleting a file is a change, and it is the
// change most likely to break `check`.
const runOverPaths = (file, args, candidates) => {
	const paths = candidates.filter((path) => existsSync(path));

	return paths.length ? run(file, [...args, ...paths]) : null;
};

// `-z` rather than the plain format, which mangles exactly the two cases this
// list must not lose: it quotes any path holding a space, and it writes a
// rename as `old -> new`, one string that is neither path. Both then read as
// files that do not exist, and a stop whose only change is a rename checks
// nothing at all. `-z` NUL-terminates each record, quotes nothing, and puts a
// rename's destination FIRST with the source as a second record: keep the
// survivor, skip the source.
const records = execFileSync('git', ['status', '--porcelain', '-z'], {
	encoding: 'utf8',
})
	.split('\0')
	.filter(Boolean);

const paths = [];

for (let index = 0; index < records.length; index++) {
	const record = records[index];

	paths.push(record.slice(3));

	// Either column can carry the rename: `R ` is staged, ` R` is the work tree.
	if ('RC'.includes(record[0]) || 'RC'.includes(record[1])) index++;
}

if (!paths.length) process.exit(0);

const code = paths.filter((path) => LINTABLE.test(path));
// The one stop `check` sits out. Not eslint's file list: a `messages/*.json`
// value ending in `@` fails `check` inside generated code with no source file
// changed at all (docs/testing.md), so anything that is not prose has to run it.
const proseOnly = paths.every((path) => path.endsWith('.md'));

const failures = [
	// `--ignore-unknown`: `npm run lint` passes prettier a directory and it skips
	// files it has no parser for; passing paths explicitly makes those a hard
	// error instead, so a touched Dockerfile would block finishing on nothing.
	runOverPaths('npx', ['prettier', '--check', '--ignore-unknown'], paths),
	runOverPaths('npx', ['eslint', '--no-warn-ignored'], code),
	// The only type check the repo has — eslint enables no type-checked rule set,
	// so a type error is invisible to everything above it here. It reads the
	// project, not a file list, so it runs whole-tree or not at all.
	proseOnly ? null : run('npm', ['run', 'check']),
	// The same six `npm run lint` holds. These take no paths, so each one reads
	// the whole tree rather than the changed files — the scoping above is
	// prettier's and eslint's alone.
	...[
		'math-index',
		'math-citations',
		'probe-registry',
		'brief-size',
		'comment-density',
		'file-names',
	].map((script) => run('node', [`scripts/${script}.mjs`, '--check'])),
].filter(Boolean);

if (!failures.length) process.exit(0);

console.error(
	`AGENTS.md §3 is not satisfied — these checks fail on your working tree. ` +
		`Fix them, do not describe them:\n\n${failures.join('\n\n')}`,
);

process.exit(2);
