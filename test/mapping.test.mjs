import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { ghosttyAnsiIndices, ghosttyCoreMapping, ghosttyDerivedMapping } from '../src/ghostty-mapping.mjs';
import { resolveNamedPath, resolveToken } from '../src/resolve-token.mjs';

const vendorDir = path.resolve('vendor/static-noise');
const HEX_COLOR = /^#[0-9A-Fa-f]{6}$/;

describe('token resolution and mapping contract', () => {
  it('resolves direct and nested references without circular loops', () => {
    const testPalette = {
      primitives: {
        accent: { blue: { $type: 'color', $value: '#83BFFF' } }
      },
      semantic: {
        action: { $type: 'color', $value: '{primitives.accent.blue}' }
      }
    };

    expect(resolveNamedPath(testPalette, 'semantic.action')).toMatch(HEX_COLOR);

    const circular = {
      a: { $type: 'color', $value: '{b}' },
      b: { $type: 'color', $value: '{a}' }
    };
    expect(() => resolveNamedPath(circular, 'a')).toThrow(/Circular/);
  });

  it('contains no hardcoded hex colors in mapping definitions', () => {
    const allMappings = { ...ghosttyCoreMapping, ...ghosttyDerivedMapping };
    for (const [key, mapping] of Object.entries(allMappings)) {
      expect(HEX_COLOR.test(mapping.tokenPath), `${key} should reference a token path, not a literal color`).toBe(false);
      expect(typeof mapping.tokenPath).toBe('string');
    }
  });

  it('resolves all Ghostty options and 16 ANSI projections to valid hex colors in current snapshot', async () => {
    const palette = JSON.parse(await readFile(path.join(vendorDir, 'palette.json'), 'utf8'));
    const allMappings = { ...ghosttyCoreMapping, ...ghosttyDerivedMapping };

    for (const [key, mapping] of Object.entries(allMappings)) {
      const color = resolveNamedPath(palette, mapping.tokenPath);
      expect(color, `${key} (${mapping.tokenPath}) must resolve to a valid hex color`).toMatch(HEX_COLOR);
    }

    expect(ghosttyAnsiIndices).toHaveLength(16);
    for (const name of ghosttyAnsiIndices) {
      const color = resolveNamedPath(palette, `projections.ansi.${name}`);
      expect(color, `projections.ansi.${name} must resolve to a valid hex color`).toMatch(HEX_COLOR);
    }
  });

  it('fails with a descriptive error when a required token path does not exist', () => {
    const emptyPalette = { semantic: {} };
    expect(() => resolveNamedPath(emptyPalette, 'semantic.surface.canvas')).toThrow(/Missing or invalid token path/);
  });
});
