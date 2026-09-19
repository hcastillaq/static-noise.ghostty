# Updating the Static Noise Snapshot

`static-noise.ghostty` treats `static-noise.lock.json` as the single source of truth for its upstream contract.

There is intentionally **no automated lock update script**. Version bumps and commit changes are decided manually by maintainers.

## Update Procedure

### 1. Edit the Lockfile Manually

Open `static-noise.lock.json` and change the `version` and full 40-character `sha` to the targeted release:

```json
{
  "repository": "https://github.com/hcastillaq/static-noise.git",
  "version": "0.1.0",
  "sha": "<exact-immutable-commit-sha>"
}
```

### 2. Synchronize Vendor Files

Run the explicit snapshot synchronization command:

```bash
npm run sync:palette
```

This command will:
- Validate the lockfile format.
- Fetch the specified SHA in an isolated temporary Git workspace.
- Validate that `palette.json` matches `schemas/palette.schema.json`.
- Confirm that `palette.version` matches `lock.version`.
- Atomically update `vendor/static-noise/palette.json` and `vendor/static-noise/schemas/palette.schema.json`.

If the SHA is unreachable or the version does not match, synchronization aborts and leaves existing vendor files untouched.

### 3. Run the Verification Suite

Run the tests to ensure the new palette resolves all required tokens and generates valid Ghostty syntax:

```bash
npm test
```

### 4. Review and Commit

Review the resulting diff with `git diff`. A clean update consists of:
- The manual edit in `static-noise.lock.json`.
- The updated snapshot in `vendor/static-noise/`.
- Any required adjustments in mapping or documentation if upstream tokens changed.

### 5. Tag and Release

When ready to publish, create a git tag (e.g. `git tag v0.0.2 && git push origin v0.0.2`). The release workflow will automatically compile the theme and publish the new GitHub Release with the downloadable asset.
