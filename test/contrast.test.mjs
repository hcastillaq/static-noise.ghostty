import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { contrastRatio } from './helpers/colors.mjs';

const distPath = path.resolve('dist/Static Noise');

function parseThemeKeyValue(content) {
  const map = new Map();
  for (const rawLine of content.split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const [key, value] = line.split('=').map((part) => part.trim());
    map.set(key, value);
  }
  return map;
}

describe('contrast compliance for Ghostty theme', () => {
  it('meets at least 4.5:1 for explicit text, cursor, selection, and search pairs', async () => {
    const content = await readFile(distPath, 'utf8');
    const theme = parseThemeKeyValue(content);

    const fgBg = contrastRatio(theme.get('foreground'), theme.get('background'));
    const cursorPair = contrastRatio(theme.get('cursor-text'), theme.get('cursor-color'));
    const selectionPair = contrastRatio(theme.get('selection-foreground'), theme.get('selection-background'));
    const searchPair = contrastRatio(theme.get('search-foreground'), theme.get('search-background'));
    const searchSelectedPair = contrastRatio(theme.get('search-selected-foreground'), theme.get('search-selected-background'));

    expect(fgBg).toBeGreaterThanOrEqual(4.5);
    expect(cursorPair).toBeGreaterThanOrEqual(4.5);
    expect(selectionPair).toBeGreaterThanOrEqual(4.5);
    expect(searchPair).toBeGreaterThanOrEqual(4.5);
    expect(searchSelectedPair).toBeGreaterThanOrEqual(4.5);
  });

  it('keeps structural split divider at or above 3:1 against the canvas', async () => {
    const content = await readFile(distPath, 'utf8');
    const theme = parseThemeKeyValue(content);

    const dividerCanvas = contrastRatio(theme.get('split-divider-color'), theme.get('background'));
    expect(dividerCanvas).toBeGreaterThanOrEqual(3.0);
  });
});
