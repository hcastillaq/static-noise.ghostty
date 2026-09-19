import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildThemeContent } from '../src/generate-theme.mjs';
import { GHOSTTY_ANSI_NAMES, ghosttyCoreMapping, ghosttyDerivedMapping } from '../src/ghostty-mapping.mjs';
import { readAndValidateLock } from '../src/lock.mjs';

const vendorPalettePath = path.resolve('vendor/static-noise/palette.json');

describe('Ghostty theme generator logic', () => {
  it('generates valid Ghostty configuration syntax in memory', async () => {
    const lock = await readAndValidateLock();
    const palette = JSON.parse(await readFile(vendorPalettePath, 'utf8'));

    const content = buildThemeContent(palette, lock);

    // Verify dynamic metadata header
    expect(content).toContain(`# Upstream version: ${lock.version}`);
    expect(content).toContain(`# Upstream commit: ${lock.sha}`);
    expect(content).toContain('palette-generate = true');

    // Verify all mapped options exist with valid hex color pattern
    const expectedKeys = [
      ...Object.keys(ghosttyCoreMapping),
      ...Object.keys(ghosttyDerivedMapping)
    ];

    for (const key of expectedKeys) {
      const match = content.match(new RegExp(`^${key} = (#[0-9A-Fa-f]{6})$`, 'm'));
      expect(match, `Ghostty configuration key '${key}' missing or invalid`).not.toBeNull();
    }

    // Verify all 16 ANSI projections are defined with valid hex colors
    for (let index = 0; index < GHOSTTY_ANSI_NAMES.length; index += 1) {
      const match = content.match(new RegExp(`^palette = ${index}=(#[0-9A-Fa-f]{6})$`, 'm'));
      expect(match, `ANSI slot ${index} missing or invalid in generated theme`).not.toBeNull();
    }
  });

  it('fails if the palette snapshot version does not match the lockfile version', () => {
    const lock = { repository: 'https://github.com/test/repo', version: '0.0.1', sha: 'a'.repeat(40) };
    const mismatchedPalette = { version: '0.0.2' };

    expect(() => buildThemeContent(mismatchedPalette, lock)).toThrow(/Snapshot palette version/);
  });
});
