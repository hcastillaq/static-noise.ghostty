import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ghosttyAnsiIndices, ghosttyCoreMapping, ghosttyDerivedMapping } from './ghostty-mapping.mjs';
import { readAndValidateLock } from './lock.mjs';
import { resolveNamedPath } from './resolve-token.mjs';

export async function renderTheme(options = {}) {
  const repoRoot = options.repoRoot || path.resolve('.');
  const lockPath = options.lockPath || path.join(repoRoot, 'static-noise.lock.json');
  const vendorDir = options.vendorDir || path.join(repoRoot, 'vendor', 'static-noise');

  const lock = await readAndValidateLock(lockPath);
  const paletteRaw = await readFile(path.join(vendorDir, 'palette.json'), 'utf8');
  const palette = JSON.parse(paletteRaw);

  if (palette.version !== lock.version) {
    throw new Error(`Palette version (${palette.version}) does not match lock version (${lock.version}). Run 'npm run sync:palette' first.`);
  }

  const lines = [
    '# Static Noise for Ghostty',
    `# Upstream version: ${lock.version}`,
    `# Upstream commit: ${lock.sha}`,
    '# Generated file -- do not edit manually',
    ''
  ];

  for (const [key, mapping] of Object.entries(ghosttyCoreMapping)) {
    const color = resolveNamedPath(palette, mapping.tokenPath);
    lines.push(`${key} = ${color}`);
  }

  lines.push('');
  for (const [key, mapping] of Object.entries(ghosttyDerivedMapping)) {
    const color = resolveNamedPath(palette, mapping.tokenPath);
    lines.push(`${key} = ${color}`);
  }

  lines.push('');
  lines.push('palette-generate = true');
  lines.push('');

  ghosttyAnsiIndices.forEach((name, index) => {
    const color = resolveNamedPath(palette, `projections.ansi.${name}`);
    lines.push(`palette = ${index}=${color}`);
  });

  lines.push('');
  return lines.join('\n');
}

export async function generateThemeFile(options = {}) {
  const repoRoot = options.repoRoot || path.resolve('.');
  const outputPath = options.outputPath || path.join(repoRoot, 'dist', 'Static Noise');
  const content = await renderTheme(options);

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, content, 'utf8');
  return { outputPath, content };
}

export async function checkThemeFreshness(options = {}) {
  const repoRoot = options.repoRoot || path.resolve('.');
  const outputPath = options.outputPath || path.join(repoRoot, 'dist', 'Static Noise');

  const expected = await renderTheme(options);
  let actual;
  try {
    actual = await readFile(outputPath, 'utf8');
  } catch (error) {
    throw new Error(`Generated theme missing at ${outputPath}. Run 'npm run generate' first. (${error.message})`);
  }

  if (actual !== expected) {
    throw new Error(`Committed theme at ${outputPath} is stale or was modified manually. Run 'npm run generate' to update.`);
  }

  return true;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const checkOnly = process.argv.includes('--check');
  try {
    if (checkOnly) {
      await checkThemeFreshness();
      console.log('Generated theme is up to date.');
    } else {
      const { outputPath } = await generateThemeFile();
      console.log(`Generated theme written to ${outputPath}`);
    }
  } catch (error) {
    console.error(`Theme generation failed: ${error.message}`);
    process.exit(1);
  }
}
