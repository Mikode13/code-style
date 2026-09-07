# @mikode13/code-style

Shared Prettier configuration that keeps formatting consistent across MiKode projects
without duplicating options in every repository.

## Why

Formatting is only settled once. When each repository keeps its own option object, the
values drift, review comments turn into style arguments, and a change of policy has to be
applied by hand everywhere. This package is the single executable source of the MiKode
formatting options: a repository re-exports it and inherits any later change through a
normal dependency update.

It implements the
[code formatting standard](https://github.com/Mikode13/engineering/blob/main/standards/code-formatting.md)
in `Mikode13/engineering`, accepted in
[ADR 0001](https://github.com/Mikode13/engineering/blob/main/adr/0001-use-prettier.md).

## Status

Stable. The package exports one entry point, `@mikode13/code-style/prettier`, and its
options are covered by tests that format real code.

The scope is deliberately small: this package configures Prettier and nothing else.
Linting rules live in
[`@mikode13/code-quality`](https://github.com/Mikode13/code-quality) and compiler options
in [`@mikode13/tsconfig`](https://github.com/Mikode13/tsconfig). The package name is not
permanently tied to Prettier, but adding a second tool needs a decision, not just a file.

Prettier 3 is a peer dependency, so the consuming project chooses the exact version.
Node.js 22.13+ and Node.js 24 are supported.

## Install

```sh
pnpm add --save-dev @mikode13/code-style prettier
```

## Usage

Create `prettier.config.mjs` at the root of the consuming project:

```js
export { default } from '@mikode13/code-style/prettier';
```

Prettier then applies the shared configuration:

```sh
pnpm exec prettier . --write
```

Do not copy the option object into a local `.prettierrc.json`. A copy stops receiving
changes to the shared policy, which is the entire reason this package exists.

## Included options

```js
{
	// JavaScript and TypeScript
	singleQuote: true,
	semi: true,
	trailingComma: 'all',
	arrowParens: 'avoid',
	quoteProps: 'as-needed',

	// Indentation
	useTabs: true,
	tabWidth: 2,

	// Line length and line endings
	printWidth: 100,
	endOfLine: 'lf',

	// Objects and JSX
	bracketSpacing: true,
	bracketSameLine: false,
	jsxSingleQuote: false,

	// Markdown, HTML, and multiline objects
	proseWrap: 'preserve',
	objectWrap: 'preserve',
	singleAttributePerLine: false,
}
```

Indentation uses real tab characters. `tabWidth` describes how wide a tab is rendered; it
does not convert tabs to spaces.

This listing is for reading. `src/prettier.mjs` is the executable source, and the code
formatting standard is the policy it implements — the two are kept in step deliberately,
so a change to either belongs in the same pull request.

## Development

```sh
pnpm install --frozen-lockfile
pnpm run check      # prettier --check, eslint --max-warnings 0, tsc --noEmit
pnpm test           # formats real code with the shipped options, fully offline
pnpm run pack:check # asserts the exact published file set
```

`pre-push` runs `pnpm run check && pnpm test`. CI repeats both and adds `pack:check`.

## Releases

Versions are derived from Conventional Commit titles by `semantic-release` and published
automatically from `main`. The npm registry, Git tags, and GitHub Releases are the
authoritative history; the `version` field in this repository stays at
`0.0.0-development` and is never committed with a real version.

## License

This project is source-available under the MIT License with the
[Commons Clause License Condition v1.0](https://commonsclause.com/). See
[LICENSE](./LICENSE) for the complete text. It is not OSI open source: the Commons
Clause restricts selling the software or a service whose value derives substantially
from it.
