import { execFile } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import Ajv from 'ajv';
import { readAndValidateLock } from '../src/lock.mjs';

const execFileAsync = promisify(execFile);

export async function syncPalette(options = {}) {
  const repoRoot = options.repoRoot || path.resolve('.');
  const lockPath = options.lockPath || path.join(repoRoot, 'static-noise.lock.json');
  const vendorDir = options.vendorDir || path.join(repoRoot, 'vendor', 'static-noise');
  const lock = await readAndValidateLock(lockPath);

  const tmpBase = path.join(os.tmpdir(), 'static-noise-sync-');
  const tmpDir = await mkdtemp(tmpBase);

  try {
    await execFileAsync('git', ['init', '-q', tmpDir]);
    await execFileAsync('git', ['-C', tmpDir, 'remote', 'add', 'origin', lock.repository]);

    let fetchSucceeded = false;
    try {
      await execFileAsync('git', ['-C', tmpDir, 'fetch', '--depth=1', '-q', 'origin', lock.sha]);
      await execFileAsync('git', ['-C', tmpDir, 'checkout', '-q', 'FETCH_HEAD']);
      fetchSucceeded = true;
    } catch {
      fetchSucceeded = false;
    }

    if (!fetchSucceeded) {
      const fallbackTagRef = `refs/tags/v${lock.version}`;
      await execFileAsync('git', ['-C', tmpDir, 'fetch', '--depth=1', '-q', 'origin', fallbackTagRef]);
      await execFileAsync('git', ['-C', tmpDir, 'checkout', '-q', 'FETCH_HEAD']);
    }

    const { stdout: resolvedCommitRaw } = await execFileAsync('git', ['-C', tmpDir, 'rev-parse', 'HEAD']);
    const resolvedCommit = resolvedCommitRaw.trim();

    if (resolvedCommit !== lock.sha) {
      throw new Error(`Resolved commit (${resolvedCommit}) does not match lock SHA (${lock.sha})`);
    }

    const paletteRaw = await readFile(path.join(tmpDir, 'palette.json'), 'utf8');
    const schemaRaw = await readFile(path.join(tmpDir, 'schemas', 'palette.schema.json'), 'utf8');

    const palette = JSON.parse(paletteRaw);
    const schema = JSON.parse(schemaRaw);

    if (palette.version !== lock.version) {
      throw new Error(`Palette declared version (${palette.version}) does not match locked version (${lock.version})`);
    }

    const ajv = new Ajv({ allErrors: true, strict: false });
    const validate = ajv.compile(schema);
    const valid = validate(palette);
    if (!valid) {
      throw new Error(`Palette failed schema validation: ${ajv.errorsText(validate.errors)}`);
    }

    await mkdir(vendorDir, { recursive: true });
    await writeFile(path.join(vendorDir, 'palette.json'), paletteRaw, 'utf8');
    await writeFile(path.join(vendorDir, 'palette.schema.json'), schemaRaw, 'utf8');

    return {
      version: lock.version,
      sha: lock.sha,
      vendorDir
    };
  } finally {
    await rm(tmpDir, { recursive: true, force: true }).catch(() => {});
  }
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  try {
    const result = await syncPalette();
    console.log(`Synchronized Static Noise ${result.version} (${result.sha}) into ${result.vendorDir}`);
  } catch (error) {
    console.error(`Synchronization failed: ${error.message}`);
    process.exit(1);
  }
}
