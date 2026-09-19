import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { GHOSTTY_ANSI_NAMES, ghosttyCoreMapping, ghosttyDerivedMapping } from '../src/ghostty-mapping.mjs';
import { resolveNamedPath } from '../src/resolve-token.mjs';

const vendorPalettePath = path.resolve('vendor/static-noise/palette.json');
const HEX_COLOR_PATTERN = /^#[0-9A-Fa-f]{6}$/;

describe('Static Noise mapping contract for Ghostty', () => {
  it('defines only abstract token paths without hardcoded color literals', () => {
    const allMappings = { ...ghosttyCoreMapping, ...ghosttyDerivedMapping };

    for (const [key, config] of Object.entries(allMappings)) {
      expect(typeof config.tokenPath).toBe('string');
      expect(HEX_COLOR_PATTERN.test(config.tokenPath), `${key} must not be a hex color`).toBe(false);
    }
  });

  it('resolves every core and derived Ghostty option to a valid color using the vendored snapshot', async () => {
    const raw = await readFile(vendorPalettePath, 'utf8');
    const palette = JSON.parse(raw);
    const allMappings = { ...ghosttyCoreMapping, ...ghosttyDerivedMapping };

    for (const [key, config] of Object.entries(allMappings)) {
      const resolved = resolveNamedPath(palette, config.tokenPath);
      expect(resolved, `Option '${key}' failed resolution`).toMatch(HEX_COLOR_PATTERN);
    }
  });

  it('maps exactly 16 ANSI projections into valid colors in index order', async () => {
    const raw = await readFile(vendorPalettePath, 'utf8');
    const palette = JSON.parse(raw);

    expect(GHOSTTY_ANSI_NAMES).toHaveLength(16);

    for (const ansiName of GHOSTTY_ANSI_NAMES) {
      const resolved = resolveNamedPath(palette, `projections.ansi.${ansiName}`);
      expect(resolved, `ANSI projection '${ansiName}' failed resolution`).toMatch(HEX_COLOR_PATTERN);
    }
  });

  it('rejects circular references and non-existent tokens with explicit errors', () => {
    const circularPalette = {
      a: { $type: 'color', $value: '{b}' },
      b: { $type: 'color', $value: '{a}' }
    };
    expect(() => resolveNamedPath(circularPalette, 'a')).toThrow(/Circular token reference/);

    const emptyPalette = {};
    expect(() => resolveNamedPath(emptyPalette, 'semantic.missing.token')).toThrow(/Missing or invalid token path/);
  });
});
