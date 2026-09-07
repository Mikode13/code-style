import { execFile } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

const repositoryRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

const manifest = JSON.parse(await readFile(path.join(repositoryRoot, 'package.json'), 'utf8'));

// Listed explicitly rather than walked from `src`, because `files` publishes that directory
// wholesale: a new file there becomes part of the public surface the moment it is committed.
// Requiring an edit here makes that a decision rather than an accident. npm always includes
// `package.json` and `README.md`; the licensing standard requires `LICENSE` in every
// published artifact.
const expected = new Set(['LICENSE', 'README.md', 'package.json', 'src/prettier.mjs']);

const { stdout } = await execFileAsync('pnpm', ['pack', '--dry-run', '--json'], {
	cwd: repositoryRoot,
});

// `pnpm pack` prints the lifecycle output of `prepare` before the JSON document.
const packed = JSON.parse(stdout.slice(stdout.indexOf('{')));
const actual = new Set(packed.files.map(file => file.path));

const missing = [...expected].filter(file => !actual.has(file)).sort();
const unexpected = [...actual].filter(file => !expected.has(file)).sort();

const problems = [];

if (missing.length > 0) {
	problems.push(`Missing from the tarball:\n${missing.map(file => `  - ${file}`).join('\n')}`);
}

if (unexpected.length > 0) {
	problems.push(
		`Unexpected in the tarball:\n${unexpected.map(file => `  - ${file}`).join('\n')}\n` +
			'  Anything under `src` ships to consumers. Either add it to the expected set here\n' +
			'  deliberately, or keep it out of `src`.',
	);
}

// The manifest's own promises to consumers: a declared entry point that is absent from the
// tarball produces a package that fails on `import`, which a file-set check alone can miss.
const entryPoints = [
	['main', manifest.main],
	['types', manifest.types],
	...Object.entries(manifest.exports ?? {}).map(([key, value]) => [`exports["${key}"]`, value]),
	...Object.entries(manifest.bin ?? {}).map(([key, value]) => [`bin.${key}`, value]),
];

const unresolved = entryPoints
	.filter(([, target]) => typeof target === 'string')
	.filter(([, target]) => !actual.has(path.posix.normalize(target.replace(/^\.\//, ''))));

if (unresolved.length > 0) {
	problems.push(
		`Declared entry points absent from the tarball:\n${unresolved
			.map(([field, target]) => `  - ${field} -> ${target}`)
			.join('\n')}`,
	);
}

if (problems.length > 0) {
	process.stderr.write(`${problems.join('\n\n')}\n`);
	process.exit(1);
}

process.stdout.write(
	`The publishable tarball contains exactly the ${expected.size} expected files, ` +
		`and every declared entry point is present.\n`,
);
