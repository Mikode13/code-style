import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { format, resolveConfig, type Options } from 'prettier';
import { beforeAll, describe, expect, it } from 'vitest';

const repositoryRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

/**
 * The specifier a consuming project writes. Node resolves a package's own name through its
 * `exports` map, so this repository can load the configuration exactly the way a consumer
 * does instead of reaching into `src` by relative path. A renamed file, a broken `exports`
 * entry, or a missing `files` entry fails here rather than in the first project that
 * upgrades.
 */
const publishedSpecifier = '@mikode13/code-style/prettier';

let published: Options;

beforeAll(async () => {
	const resolved = import.meta.resolve(publishedSpecifier);
	const loaded = (await import(resolved)) as { default: Options };
	published = loaded.default;
});

/** Formats `source` with the published configuration and nothing else. */
async function formatted(
	source: string,
	parser: Options['parser'] = 'typescript',
): Promise<string> {
	return format(source, { ...published, parser });
}

describe('published entry point', () => {
	it('resolves to the file the manifest promises to publish', () => {
		expect(import.meta.resolve(publishedSpecifier)).toBe(
			pathToFileURL(path.join(repositoryRoot, 'src', 'prettier.mjs')).href,
		);
	});

	it('is what this repository formats itself with', async () => {
		const own = await resolveConfig(path.join(repositoryRoot, 'README.md'));

		expect(own).toStrictEqual(published);
	});

	/**
	 * The published options are policy, not preference: the code formatting standard in
	 * `Mikode13/engineering` documents this exact object. Changing a value here without
	 * changing that document forks the policy from its implementation, so this test exists
	 * to make the change impossible to miss in review.
	 */
	it('exports exactly the options the code formatting standard documents', () => {
		expect(published).toStrictEqual({
			singleQuote: true,
			semi: true,
			trailingComma: 'all',
			arrowParens: 'avoid',
			quoteProps: 'as-needed',
			useTabs: true,
			tabWidth: 2,
			printWidth: 100,
			endOfLine: 'lf',
			bracketSpacing: true,
			bracketSameLine: false,
			jsxSingleQuote: false,
			proseWrap: 'preserve',
			objectWrap: 'preserve',
			singleAttributePerLine: false,
		});
	});
});

describe('formatting behaviour', () => {
	it('indents with tab characters rather than spaces', async () => {
		const output = await formatted('function outer() {\nreturn 1;\n}\n');

		expect(output).toBe('function outer() {\n\treturn 1;\n}\n');
	});

	it('rewrites double-quoted strings as single-quoted', async () => {
		const output = await formatted('const greeting = "hello";\n');

		expect(output).toBe("const greeting = 'hello';\n");
	});

	it('adds a missing statement terminator', async () => {
		const output = await formatted('const total = 1 + 2\n');

		expect(output).toBe('const total = 1 + 2;\n');
	});

	it('drops the parentheses around a single arrow parameter', async () => {
		const output = await formatted('const identity = (value) => value;\n');

		expect(output).toBe('const identity = value => value;\n');
	});

	it('adds a trailing comma to a multi-line literal', async () => {
		const output = await formatted('const settings = {\n\tfirst: 1,\n\tsecond: 2\n};\n');

		expect(output).toBe('const settings = {\n\tfirst: 1,\n\tsecond: 2,\n};\n');
	});

	it('quotes object properties only where the syntax requires it', async () => {
		const output = await formatted("const map = { 'plain': 1, 'needs-quotes': 2 };\n");

		expect(output).toBe("const map = { plain: 1, 'needs-quotes': 2 };\n");
	});

	it('keeps spaces inside object braces', async () => {
		const output = await formatted('const shorthand = {value};\n');

		expect(output).toBe('const shorthand = { value };\n');
	});

	// `send('x'.repeat(n)');` is exactly `n + 9` columns wide, so these two cases sit on either
	// side of the 100-column boundary and would both pass under a wrong but nearby printWidth.
	it('keeps a call of exactly 100 columns on one line', async () => {
		const source = `send('${'x'.repeat(91)}');\n`;

		expect(source.trimEnd()).toHaveLength(100);
		await expect(formatted(source)).resolves.toBe(source);
	});

	it('breaks a call one column past the limit across lines', async () => {
		const argument = `'${'x'.repeat(92)}'`;
		const source = `send(${argument});\n`;

		expect(source.trimEnd()).toHaveLength(101);
		await expect(formatted(source)).resolves.toBe(`send(\n\t${argument},\n);\n`);
	});

	it('normalises carriage returns to line feeds', async () => {
		const output = await formatted('const first = 1;\r\nconst second = 2;\r\n');

		expect(output).not.toContain('\r');
		expect(output).toBe('const first = 1;\nconst second = 2;\n');
	});

	it('preserves an object the author already expanded over several lines', async () => {
		const output = await formatted('const point = {\n\tx: 1, y: 2\n};\n');

		expect(output).toBe('const point = {\n\tx: 1,\n\ty: 2,\n};\n');
	});

	it('collapses an object the author wrote on one line', async () => {
		const output = await formatted('const point = { x: 1, y: 2 };\n');

		expect(output).toBe('const point = { x: 1, y: 2 };\n');
	});

	it('double-quotes JSX attributes while JavaScript strings stay single-quoted', async () => {
		// The input has each convention on the wrong side, so a formatter that ignored either
		// `jsxSingleQuote` or `singleQuote` would leave one of them untouched.
		const output = await formatted(
			'const element = <Button kind=\'primary\' onPress={() => track("press")}>Go</Button>;\n',
			'babel',
		);

		expect(output).toBe(
			'const element = (\n\t<Button kind="primary" onPress={() => track(\'press\')}>\n\t\tGo\n\t</Button>\n);\n',
		);
	});

	it('keeps several JSX attributes on one line when they fit', async () => {
		const output = await formatted(
			'const element = <Button kind="primary" size="large" tone="neutral">Go</Button>;\n',
			'babel',
		);

		expect(output).toBe(
			'const element = (\n\t<Button kind="primary" size="large" tone="neutral">\n\t\tGo\n\t</Button>\n);\n',
		);
	});

	it('puts the closing bracket of a broken JSX tag on its own line', async () => {
		// `bracketSameLine` only has an observable effect once the attribute list itself breaks,
		// so this element carries enough attributes to exceed 100 columns.
		const output = await formatted(
			'const element = <Button kind="primary" size="large" tone="neutral" alignment="center" ' +
				'emphasis="strong" onPress={handlePress}>Go</Button>;\n',
			'babel',
		);

		expect(output).toBe(
			'const element = (\n' +
				'\t<Button\n' +
				'\t\tkind="primary"\n' +
				'\t\tsize="large"\n' +
				'\t\ttone="neutral"\n' +
				'\t\talignment="center"\n' +
				'\t\temphasis="strong"\n' +
				'\t\tonPress={handlePress}\n' +
				'\t>\n' +
				'\t\tGo\n' +
				'\t</Button>\n' +
				');\n',
		);
	});

	it('leaves prose line breaks in Markdown exactly where the author put them', async () => {
		const paragraph = `${'word '.repeat(40).trimEnd()}\n`;

		await expect(formatted(paragraph, 'markdown')).resolves.toBe(paragraph);
	});
});
