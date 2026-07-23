/**
 * @see https://prettier.io/docs/configuration
 * @type {import('prettier').Config}
 */
const config = {
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
};

export default config;
