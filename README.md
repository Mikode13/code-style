# @mikode/code-style

Shared formatting configuration that keeps code style consistent across Mikode projects
without duplicating rules in every repository.

> **Status:** Experimental. The API may change before version `1.0.0`.

## Installation

Install the package alongside Prettier 3:

```sh
pnpm add --save-dev @mikode/code-style prettier
```

## Usage

Create `prettier.config.mjs` in the root of the consuming project:

```js
export { default } from '@mikode/code-style/prettier';
```

Prettier will then apply the shared configuration. For example:

```sh
pnpm exec prettier . --write
```

## Included rules

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

Indentation uses actual tab characters. `tabWidth` defines their visual width; it does not
convert them to spaces.

The package currently shares a Prettier configuration. The `@mikode/code-style` name is not
permanently tied to a specific tool, although its initial scope is deliberately small.

## Verification and publishing

```sh
pnpm install
pnpm run format:check
pnpm run pack:check
npm login
pnpm publish --access public
```

Publishing is manual. Public scoped packages require `--access public`.
