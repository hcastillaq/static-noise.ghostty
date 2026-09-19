import { readFile, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { checkThemeFreshness, generateThemeFile, renderTheme } from '../src/generate-theme.mjs';
import { ghosttyCoreMapping, ghosttyDerivedMapping } from '../src/ghostty-mapping.mjs';
import { readAndValidateLock } from '../src/lock.mjs';

const distPath = path.resolve('dist/Static Noise');
const HEX_COLOR = /^#[0-9A-Fa-f]{6}$/;

describe('Ghostty theme structure and freshness', () => {
  it('renders deterministically with valid Ghostty syntax', async () => {
    const lock = await readAndValidateLock();
    const rendered = await renderTheme();

    // Verify metadata headers reflect the active lock without hardcoding literal values
    expect(rendered).toContain(`# Upstream version: ${lock.version}`);
    expect(rendered).toContain(`# Upstream commit: ${lock.sha}`);
    expect(rendered).toContain('palette-generate = true');

    // Verify all mapped configuration keys exist and carry a valid hex value
    const allExpectedKeys = [
      ...Object.keys(ghosttyCoreMapping),
      ...Object.keys(ghosttyDerivedMapping)
    ];

    for (const key of allExpectedKeys) {
      const match = rendered.match(new RegExp(`^${key} = (#[0-9A-Fa-f]{6})$`, 'm'));
      expect(match, `Key '${key}' should be present with a valid hex color`).not.toBeNull();
    }

    // Verify exactly 16 ANSI palette entries with valid hex colors
    for (let i = 0; i < 16; i += 1) {
      const match = rendered.match(new RegExp(`^palette = ${i}=(#[0-9A-Fa-f]{6})$`, 'm'));
      expect(match, `ANSI slot ${i} should have a valid hex color`).not.toBeNull();
    }
  });

  it('passes freshness check on the committed distribution file', async () => {
    const isFresh = await checkThemeFreshness();
    expect(isFresh).toBe(true);
  });

  it('detects when the distribution file is missing or modified', async () => {
    const missing = path.resolve('dist/does-not-exist');
    await expect(checkThemeFreshness({ outputPath: missing })).rejects.toThrow(/Generated theme missing/);

    const tmpStale = path.resolve('dist/.test-stale.tmp');
    await writeFile(tmpStale, '# Stale theme content\n', 'utf8');

    try {
      await expect(checkThemeFreshness({ outputPath: tmpStale })).rejects.toThrow(/is stale or was modified manually/);
    } finally {
      await unlink(tmpStale).catch(() => {});
    }
  });
});
