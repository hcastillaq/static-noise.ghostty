import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { checkThemeFreshness, generateThemeFile, renderTheme } from '../src/generate-theme.mjs';
import { resolveNamedPath } from '../src/resolve-token.mjs';

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

    const palette = JSON.parse(await readFile(path.resolve('vendor/static-noise/palette.json'), 'utf8'));
    for (let i = 0; i < 16; i += 1) {
      const lineMatch = content.match(new RegExp(`^palette = ${i}=(#[0-9A-F]{6})$`, 'm'));
      expect(lineMatch).not.toBeNull();
      const expectedColor = resolveNamedPath(palette, `projections.ansi.${['black','red','green','yellow','blue','magenta','cyan','white','brightBlack','brightRed','brightGreen','brightYellow','brightBlue','brightMagenta','brightCyan','brightWhite'][i]}`);
      expect(lineMatch[1]).toBe(expectedColor);
    }
  });

  it('passes checkThemeFreshness on committed output', async () => {
    const fresh = await checkThemeFreshness();
    expect(fresh).toBe(true);
  });

  it('rejects stale or missing theme in checkThemeFreshness', async () => {
    const missingPath = path.resolve('dist/non-existent-theme');
    await expect(checkThemeFreshness({ outputPath: missingPath })).rejects.toThrow(/Generated theme missing at/);

    const tmpStale = path.resolve('.context/compound-engineering/stale-theme.tmp');
    await generateThemeFile({ outputPath: tmpStale });
    const { writeFile, unlink } = await import('node:fs/promises');
    await writeFile(tmpStale, 'background = #000000\n', 'utf8');

    try {
      await expect(checkThemeFreshness({ outputPath: tmpStale })).rejects.toThrow(/is stale or was modified manually/);
    } finally {
      await unlink(tmpStale).catch(() => {});
    }
  });
});
