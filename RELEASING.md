# Releasing

1. Update `version` in `package.json` and `src/version.ts` (a test checks they match), and move the
   `CHANGELOG.md` entry out of "unreleased".
2. Merge to `main`.
3. Either run the Release workflow from `main` (Actions → Release → Run workflow), which publishes
   and then tags the commit `v<version>`, or tag it yourself: `git tag v1.0.0 && git push origin v1.0.0`.

The Release workflow then tests, builds and runs `npm publish --access public --provenance`.

It signs in to npm with **trusted publishing**, so no npm token is stored in GitHub. Set it up once
on npmjs.com: the `ballotdata` package → Settings → Trusted Publisher → GitHub Actions, with
organization `EndorsedByOrg`, repository `jslib`, workflow `release.yml` and no environment. Then,
under Publishing access, choose "Require two-factor authentication and disallow tokens".

Without a trusted publisher, the workflow falls back to an npm token in the repository secret
`NPM_TOKEN`. That token must be a granular access token with "Bypass two-factor authentication"
turned on. A token that needs a one-time password fails with `EOTP`.

To publish by hand instead: `npm login`, then `npm publish --access public` from a clean checkout of
the tag. `prepack` builds `dist/` first.

If the version is already on npm (published by hand), running the workflow from `main` skips
publishing and only creates the tag.

Check what will be published with `npm pack --dry-run`.
