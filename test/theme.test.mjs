import { readFile, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { checkThemeFreshness, renderTheme } from '../src/generate-theme.mjs';
import { GHOSTTY_ANSI_NAMES, ghosttyCoreMapping, ghosttyDerivedMapping } from '../src/ghostty-mapping.mjs';
import { readAndValidateLock } from '../src/lock.mjs';

const HEX_COLOR_PATTERN = /^#[0-9A-Fa-f]{6}$/;

describe('Ghostty theme generation and distribution contract', () => {
  it('generates a syntactically valid Ghostty theme with all required keys from active lock', async () => {
    const lock = await readAndValidateLock();
    const rendered = await renderTheme();

    // Headers must reference current lock dynamically without hardcoding specific numbers
    expect(rendered).toContain(`# Upstream version: ${lock.version}`);
    expect(rendered).toContain(`# Upstream commit: ${lock.sha}`);
    expect(rendered).toContain('palette-generate = true');

    // Every mapped key must be present with key = #RRGGBB syntax
    const expectedKeys = [
      ...Object.keys(ghosttyCoreMapping),
      ...Object.keys(ghosttyDerivedMapping)
    ];

    for (const key of expectedKeys) {
      const match = rendered.match(new RegExp(`^${key} = (#[0-9A-Fa-f]{6})$`, 'm'));
      expect(match, `Ghostty configuration key '${key}' missing or invalid`).not.toBeNull();
    }

    // Every ANSI index 0 to 15 must be emitted with a valid hex color
    for (let index = 0; index < GHOSTTY_ANSI_NAMES.length; index += 1) {
      const match = rendered.match(new RegExp(`^palette = ${index}=(#[0-9A-Fa-f]{6})$`, 'm'));
      expect(match, `ANSI slot ${index} missing or invalid in generated theme`).not.toBeNull();
    }
  });

  it('guarantees committed dist/Static Noise matches exact generator output', async () => {
    const isFresh = await checkThemeFreshness();
    expect(isFresh).toBe(true);
  });

  it('detects when distribution file is missing or modified', async () => {
    const missingFile = path.resolve('dist/non-existent-theme-file');
    await expect(checkThemeFreshness({ outputPath: missingFile })).rejects.toThrow(/Generated theme missing/);

    const testStaleFile = path.resolve('dist/.stale-test.tmp');
    await writeFile(testStaleFile, '# Outdated theme content\n', 'utf8');

    try {
      await expect(checkThemeFreshness({ outputPath: testStaleFile })).rejects.toThrow(/is stale or was modified manually/);
    } finally {
      await unlink(testStaleFile).catch(() => {});
    }
  });
});
