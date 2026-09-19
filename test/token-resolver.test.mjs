import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { resolveNamedPath, resolveToken } from '../src/resolve-token.mjs';

const vendorDir = path.resolve('vendor/static-noise');

describe('token resolver', () => {
  it('resolves direct hexadecimal values uppercase', () => {
    expect(resolveToken({}, '#0f1117')).toBe('#0F1117');
    expect(resolveToken({}, '#72ead5')).toBe('#72EAD5');
  });

  it('resolves nested references recursively from the vendored palette', async () => {
    const palette = JSON.parse(await readFile(path.join(vendorDir, 'palette.json'), 'utf8'));

    expect(resolveNamedPath(palette, 'semantic.surface.canvas')).toBe('#0F1117');
    expect(resolveNamedPath(palette, 'semantic.content.primary')).toBe('#E6E2D6');
    expect(resolveNamedPath(palette, 'semantic.interaction.focus')).toBe('#72EAD5');
    expect(resolveNamedPath(palette, 'semantic.interaction.onFocus')).toBe('#0F1117');
    expect(resolveNamedPath(palette, 'projections.ansi.cyan')).toBe('#72EAD5');
  });

  it('fails with clear error when a reference path is missing', () => {
    const palette = {
      semantic: {
        surface: {
          canvas: { $type: 'color', $value: '{primitives.neutral.missing}' }
        }
      }
    };

    expect(() => resolveNamedPath(palette, 'semantic.surface.canvas')).toThrow(/Missing or invalid token path: primitives\.neutral\.missing/);
  });

  it('detects and reports circular references', () => {
    const palette = {
      a: { $type: 'color', $value: '{b}' },
      b: { $type: 'color', $value: '{c}' },
      c: { $type: 'color', $value: '{a}' }
    };

    expect(() => resolveNamedPath(palette, 'a')).toThrow(/Circular token reference detected: a -> b -> c -> a/);
  });
});
