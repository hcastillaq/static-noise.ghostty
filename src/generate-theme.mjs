import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GHOSTTY_ANSI_NAMES, ghosttyCoreMapping, ghosttyDerivedMapping } from './ghostty-mapping.mjs';
import { readAndValidateLock } from './lock.mjs';
import { resolveNamedPath } from './resolve-token.mjs';

/**
 * Pure generator function: given a palette and lock metadata,
 * builds the Ghostty configuration file string.
 */
export function buildThemeContent(palette, lockMetadata) {
  if (palette.version !== lockMetadata.version) {
    throw new Error(
      `Snapshot palette version (${palette.version}) does not match lockfile version (${lockMetadata.version}). ` +
      `Run 'npm run sync:palette' first.`
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
 * Loads palette and lock from disk and writes dist/Static Noise.
 */
export async function generateThemeFile(options = {}) {
  const repoRoot = options.repoRoot || path.resolve('.');
  const lockPath = options.lockPath || path.join(repoRoot, 'static-noise.lock.json');
  const vendorDir = options.vendorDir || path.join(repoRoot, 'vendor', 'static-noise');
  const outputPath = options.outputPath || path.join(repoRoot, 'dist', 'Static Noise');

  const lock = await readAndValidateLock(lockPath);
  const palette = JSON.parse(await readFile(path.join(vendorDir, 'palette.json'), 'utf8'));

  const content = buildThemeContent(palette, lock);

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, content, 'utf8');

  return { outputPath, content };
}

// CLI entrypoint: npm run generate
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const { outputPath } = await generateThemeFile();
    console.log(`Generated theme written to ${outputPath}`);
  } catch (error) {
    console.error(`Theme generation failed: ${error.message}`);
    process.exit(1);
  }
}
