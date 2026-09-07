# Project decisions

A chronological log of decisions specific to `@mikode13/code-style`. Cross-project
decisions live in [`Mikode13/engineering`](https://github.com/Mikode13/engineering); this
file records only what a future maintainer of this package could not derive from those.

## The repository formats itself through its own published entry point

**Decision.** `prettier.config.mjs` contains
`export { default } from '@mikode13/code-style/prettier';` — the same line the code
formatting standard tells consumers to write — rather than a relative import of
`./src/prettier.mjs`.

**Context.** Node resolves a package's own name through its `exports` map, so the
published specifier works inside the package that defines it. That makes the repository a
consumer of its own contract: a renamed file, a broken `exports` entry, or a `files` list
that stops shipping `src` breaks this repository's own `format:check` before it can reach
anyone else.

The sibling [`Mikode13/tsconfig`](https://github.com/Mikode13/tsconfig) cannot do this and
extends its presets by relative path instead, because TypeScript's `extends` resolution
does not implement Node's self-reference. The difference is a limitation of that tool, not
a difference of policy.

**Consequences.** The documented consumer form is exercised on every commit. The
configuration is loaded through `node_modules/@mikode13/code-style`, a symlink pnpm does
not create for the root package, so this only works because Node resolves self-references
without one — a plain `pnpm add @mikode13/code-style` inside this repository would be
wrong and is not needed.

## The options are verified by formatting code, not by reading them

**Decision.** `tests/integration/` runs the real Prettier formatter with the shipped
options over small inputs and asserts the output. Asserting the option object itself is
kept as one complementary test, not as the coverage.

**Context.** An option assertion proves what the file says, which is the part nobody gets
wrong. It cannot prove that the value still reaches the formatter, that the entry point
still resolves, or that a Prettier upgrade has not changed what an option means. Formatting
real code observes all three.

The one object-shape test exists for a different reason: the code formatting standard
documents this exact object, so a change to a value has to change that document too. The
test makes the omission visible in review rather than after the release.

**Consequences.** The suite needs Prettier as a real development dependency and pins its
expectations to Prettier's actual output, so a genuine upstream change in formatting will
surface here as a failing test — which is the intended signal, not noise. Verified by
mutation: flipping `useTabs` fails five tests, `singleQuote` five, `trailingComma` four,
and `printWidth` and `arrowParens` two each.

## The publishable file set is listed explicitly

**Decision.** `scripts/pack-check.mjs` compares `pnpm pack --dry-run --json` against a
hard-coded set of expected files, and separately checks that every entry point the
manifest declares resolves to a file inside the tarball.

**Context.** `files` publishes `src` wholesale, so a file added there ships to every MiKode
repository the moment it is committed. A check derived from the directory would agree with
whatever is present and never notice. Listing the four expected files means widening the
public surface requires editing this script, which puts it in the diff.

Entry points are checked separately because a manifest can promise a path the package does
not contain; a file-set comparison alone passes while `import` fails for consumers.

**Consequences.** Adding a published file is a two-line change instead of one. That is the
point.

## Stable publication is enabled at 1.0.0

**Decision.** Enable automated publication through the shared release workflow, and make
the first automated release `1.0.0` rather than continuing the `0.x` line.

**Context.** `0.1.0` was published manually, before the release pipeline existed. The
automated npm publication standard requires a package with existing `0.x` versions to
reconcile its newest npm version with a Git tag on the released commit before activating.
No tag existed; `v0.1.0` now points at `20068c3`, the only commit containing the released
source.

The formatting options have not changed since they were written and are now covered by
tests, so `1.0.0` describes a contract the package already honoured rather than promising
something new.

Three corrections ship in the same change because none of them can wait for a release
boundary that this pull request is itself creating:

- `engines` moves from `>=20` to `^22.13.0 || ^24.0.0`. Raising the floor of a published
  package is a breaking change, which is why it belongs here and not in a later patch.
- `repository.url` uses the canonical `Mikode13` owner casing. npm's provenance
  verification compares it against the signed attestation and rejects a lowercase owner
  with a `422`, at the publish step, after the tag has already been pushed. The sibling
  [`Mikode13/tsconfig`](https://github.com/Mikode13/tsconfig/blob/main/docs/decisions.md)
  hit exactly that.
- `LICENSE` was regenerated from the canonical template. The published `0.1.0` names the
  software `@mikode/code-style`, a scope that does not exist, and its MIT grant had lost
  the clauses that carry the Commons Clause condition into copies. The licensor,
  copyright year, and effective license are unchanged.

**Consequences.** The source `package.json` stays at `0.0.0-development`; the real version
exists only in npm, the Git tag, and the GitHub Release. Version bumps are never committed,
and the repository has no `CHANGELOG.md`. Consumers on Node.js 20 stay on `0.1.0`, which
remains installable. `0.1.0` keeps the license text it shipped with, because a published
npm version can never be overwritten.
