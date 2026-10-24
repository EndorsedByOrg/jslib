# Releasing

1. Update `version` in `package.json` and `src/version.ts` (a test checks they match), and move the
   `CHANGELOG.md` entry out of "unreleased".
2. Merge to `main`.
3. Tag it: `git tag v1.0.0 && git push origin v1.0.0`.

The Release workflow then tests, builds and runs `npm publish --provenance --access public`. It
needs an npm automation token in the repository secret `NPM_TOKEN` (npmjs.com → Access Tokens →
Generate New Token → Automation), from an npm account that owns the `ballotdata` package name.

To publish by hand instead: `npm login`, then `npm publish --access public` from a clean checkout of
the tag. `prepack` builds `dist/` first.

Check what will be published with `npm pack --dry-run`.
