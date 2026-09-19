import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { ghosttyAnsiIndices, ghosttyCoreMapping, ghosttyDerivedMapping } from '../src/ghostty-mapping.mjs';
import { resolveNamedPath } from '../src/resolve-token.mjs';

const vendorDir = path.resolve('vendor/static-noise');
const HEX_COLOR = /^#[0-9A-Fa-f]{6}$/;

describe('ghostty mapping integrity', () => {
  it('contains no hardcoded hexadecimal colors in mapping declarations', () => {
    for (const [key, mapping] of Object.entries({ ...ghosttyCoreMapping, ...ghosttyDerivedMapping })) {
      expect(HEX_COLOR.test(mapping.tokenPath), `${key} must use a token path, not a hex color`).toBe(false);
      expect(mapping.tokenPath.length).toBeGreaterThan(0);
    }
  });

  it('resolves every core and derived Ghostty field against the vendored palette', async () => {
    const palette = JSON.parse(await readFile(path.join(vendorDir, 'palette.json'), 'utf8'));

    for (const [key, mapping] of Object.entries({ ...ghosttyCoreMapping, ...ghosttyDerivedMapping })) {
      const color = resolveNamedPath(palette, mapping.tokenPath);
      expect(HEX_COLOR.test(color), `${key} (${mapping.tokenPath}) must resolve to a valid hex color`).toBe(true);
    }
  });

  it('resolves exactly 16 ANSI projections', async () => {
    const palette = JSON.parse(await readFile(path.join(vendorDir, 'palette.json'), 'utf8'));
    expect(ghosttyAnsiIndices).toHaveLength(16);

    for (const name of ghosttyAnsiIndices) {
      const color = resolveNamedPath(palette, `projections.ansi.${name}`);
      expect(HEX_COLOR.test(color), `ANSI ${name} must resolve to a hex color`).toBe(true);
    }
  });

  it('fails visibly if a required token path is removed', () => {
    const brokenPalette = {
      semantic: {
        surface: {},
        content: { primary: { $type: 'color', $value: '#FFFFFF' } }
      }
    };

    expect(() => resolveNamedPath(brokenPalette, ghosttyCoreMapping.background.tokenPath)).toThrow(/Missing or invalid token path/);
  });
});
