import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GHOSTTY_ANSI_NAMES, ghosttyCoreMapping, ghosttyDerivedMapping } from './ghostty-mapping.mjs';
import { readAndValidateLock } from './lock.mjs';
import { resolveNamedPath } from './resolve-token.mjs';

/**
 * Pure generator function: given a validated palette object and lock metadata,
 * produces the complete string content of a Ghostty theme file.
 */
export function buildThemeContent(palette, lockMetadata) {
  if (palette.version !== lockMetadata.version) {
    throw new Error(
      `Snapshot palette version (${palette.version}) does not match lockfile version (${lockMetadata.version}). ` +
      `Run 'npm run sync:palette' to update the vendored snapshot.`
    );
  }

  const lines = [
    '# Static Noise for Ghostty',
    `# Upstream version: ${lockMetadata.version}`,
    `# Upstream commit: ${lockMetadata.sha}`,
    '# Generated file -- do not edit manually',
    ''
  ];

  for (const [configKey, mapping] of Object.entries(ghosttyCoreMapping)) {
    const hexColor = resolveNamedPath(palette, mapping.tokenPath);
    lines.push(`${configKey} = ${hexColor}`);
  }

  lines.push('');
  for (const [configKey, mapping] of Object.entries(ghosttyDerivedMapping)) {
    const hexColor = resolveNamedPath(palette, mapping.tokenPath);
    lines.push(`${configKey} = ${hexColor}`);
  }

  lines.push('');
  lines.push('palette-generate = true');
  lines.push('');

  GHOSTTY_ANSI_NAMES.forEach((ansiName, index) => {
    const hexColor = resolveNamedPath(palette, `projections.ansi.${ansiName}`);
    lines.push(`palette = ${index}=${hexColor}`);
  });

  lines.push('');
  return lines.join('\n');
}

/**
 * Loads the active lock and palette snapshot from disk and renders the theme.
 */
export async function renderTheme(options = {}) {
  const repoRoot = options.repoRoot || path.resolve('.');
  const lockPath = options.lockPath || path.join(repoRoot, 'static-noise.lock.json');
  const vendorDir = options.vendorDir || path.join(repoRoot, 'vendor', 'static-noise');

  const lock = await readAndValidateLock(lockPath);
  const paletteRaw = await readFile(path.join(vendorDir, 'palette.json'), 'utf8');
  const palette = JSON.parse(paletteRaw);

  return buildThemeContent(palette, lock);
}

/**
 * Writes the rendered theme to the distribution destination.
 */
export async function generateThemeFile(options = {}) {
  const repoRoot = options.repoRoot || path.resolve('.');
  const outputPath = options.outputPath || path.join(repoRoot, 'dist', 'Static Noise');
  const content = await renderTheme(options);

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, content, 'utf8');
  return { outputPath, content };
}

/**
 * Compares current distribution file on disk against expected output without modifying it.
 */
export async function checkThemeFreshness(options = {}) {
  const repoRoot = options.repoRoot || path.resolve('.');
  const outputPath = options.outputPath || path.join(repoRoot, 'dist', 'Static Noise');

  const expectedContent = await renderTheme(options);
  let actualContent;
  try {
    actualContent = await readFile(outputPath, 'utf8');
  } catch (error) {
    throw new Error(`Generated theme missing at ${outputPath}. Run 'npm run generate' first. (${error.message})`);
  }

  if (actualContent !== expectedContent) {
    throw new Error(`Committed theme at ${outputPath} is stale or was modified manually. Run 'npm run generate' to update.`);
  }

  return true;
}

// Entrypoint execution
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const isCheckMode = process.argv.includes('--check');
  try {
    if (isCheckMode) {
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
