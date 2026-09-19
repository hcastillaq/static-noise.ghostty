import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { checkThemeFreshness, renderTheme } from '../src/generate-theme.mjs';

const distPath = path.resolve('dist/Static Noise');

describe('generated Ghostty theme', () => {
  it('is deterministic across multiple renders', async () => {
    const first = await renderTheme();
    const second = await renderTheme();
    expect(first).toBe(second);
  });

  it('contains expected metadata header, core keys, and 16 palette entries', async () => {
    const content = await readFile(distPath, 'utf8');

    expect(content).toContain('# Upstream version: 0.0.1');
    expect(content).toContain('# Upstream commit: 3a1440055e1c87aec61ac885f137aad7f816d3ec');
    expect(content).toContain('background = #0F1117');
    expect(content).toContain('foreground = #E6E2D6');
    expect(content).toContain('cursor-color = #72EAD5');
    expect(content).toContain('cursor-text = #0F1117');
    expect(content).toContain('selection-background = #242B3D');
    expect(content).toContain('selection-foreground = #E6E2D6');
    expect(content).toContain('split-divider-color = #6E7588');
    expect(content).toContain('search-background = #443B25');
    expect(content).toContain('search-foreground = #E6E2D6');
    expect(content).toContain('search-selected-background = #72EAD5');
    expect(content).toContain('search-selected-foreground = #0F1117');
    expect(content).toContain('palette-generate = true');

    for (let i = 0; i < 16; i += 1) {
      expect(content).toMatch(new RegExp(`^palette = ${i}=#[0-9A-F]{6}$`, 'm'));
    }
  });

  it('passes checkThemeFreshness on committed output', async () => {
    const fresh = await checkThemeFreshness();
    expect(fresh).toBe(true);
  });
});
