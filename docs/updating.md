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
- Clone or fetch the specified SHA in an isolated temporary Git workspace.
- Validate that `palette.json` matches `palette.schema.json`.
- Confirm that `palette.version` matches `lock.version`.
- Atomically update `vendor/static-noise/palette.json` and `vendor/static-noise/palette.schema.json`.

If the SHA is unreachable or the version does not match, synchronization aborts and leaves existing vendor files untouched.

### 3. Regenerate the Theme

Regenerate the distributable Ghostty configuration:

```bash
npm run generate
```

### 4. Run the Verification Suite

Run all tests and validators:

```bash
npm run check
```

### 5. Review and Commit

Review the resulting diff with `git diff`. A clean update should consist of:
- The manual edit in `static-noise.lock.json`.
- The updated snapshot in `vendor/static-noise/`.
- The regenerated theme in `dist/Static Noise`.
- Any required adjustments in mapping or documentation if upstream tokens changed.
