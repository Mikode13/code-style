# AGENTS.md

## What this repository is

`@mikode13/code-style` is the executable implementation of the MiKode
[code formatting standard](https://github.com/Mikode13/engineering/blob/main/standards/code-formatting.md),
accepted in
[ADR 0001](https://github.com/Mikode13/engineering/blob/main/adr/0001-use-prettier.md).
It publishes one entry point, `@mikode13/code-style/prettier`, and nothing else.

## Constraint specific to this repository

The published options are policy, not preference. The code formatting standard documents
the exact option object this package must export, so this repository and that document
must agree exactly. Changing an option here without changing the standard silently forks
policy from its implementation.

A consuming project re-exports the configuration and does not override it. Overriding an
option locally is not a project-level exception; it requires a new or superseding ADR.

## Why there is no TypeScript source

This repository publishes configuration, not code, so it has no `src/**/*.ts`, no build,
and no compiled output. `files` publishes `src` verbatim, which means anything added
there becomes part of the public surface immediately. TypeScript and Vitest exist only to
verify what ships: `tests/integration/` loads the configuration through the published
`exports` entry and formats real code with it.

`prettier.config.mjs` re-exports `@mikode13/code-style/prettier` — the package's own name,
resolved by Node's self-reference — so the repository formats itself through exactly the
entry point consumers use. See [`docs/decisions.md`](docs/decisions.md).

## Local validation

```sh
pnpm install --frozen-lockfile
pnpm run check      # prettier --check, eslint --max-warnings 0, tsc --noEmit
pnpm test           # formats real code with the shipped options, fully offline
pnpm run pack:check # asserts the exact published file set
```

`pre-push` runs `pnpm run check && pnpm test`. CI repeats both and adds `pack:check`.

### Hazards

- Changing an option changes published formatting for every MiKode repository at once.
  The integration tests fail when an option stops taking effect, and the code formatting
  standard must be updated in the same change.
- Adding a file under `src` publishes it. `scripts/pack-check.mjs` lists the expected
  tarball contents explicitly so that stays a decision rather than an accident.
- Never add package-manager enforcement to a lifecycle script that npm runs during `pack`
  or `publish`. It breaks publication outright; see the sibling decision in
  [`Mikode13/tsconfig`](https://github.com/Mikode13/tsconfig/blob/main/docs/decisions.md).

## Engineering standards

This repository follows the active standards in
[`Mikode13/engineering`](https://github.com/Mikode13/engineering/blob/main/standards/README.md).
Do not duplicate their content here; read them there when a change touches package
management, code quality, formatting, git workflow, testing, publication, or CI.

## Releases

Publication is automated. `package.json` stays at `0.0.0-development` in source control;
semantic-release calculates the real version from Conventional Commits and publishes it
through npm Trusted Publishing after the required CI result passes on `main`. Never
hand-edit the version or publish manually.
