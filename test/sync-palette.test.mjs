import { execFile } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { describe, expect, it } from 'vitest';
import { syncPalette } from '../scripts/sync-palette.mjs';

const execFileAsync = promisify(execFile);

describe('syncPalette script', () => {
  it('extracts files from a local Git repository fixture and preserves lock immutability', async () => {
    const tmpRoot = await mkdtemp(path.join(os.tmpdir(), 'fixture-test-'));
    const fixtureRepo = path.join(tmpRoot, 'upstream.git');
    const workingRepo = path.join(tmpRoot, 'upstream-working');
    const localTarget = path.join(tmpRoot, 'target-project');
    const vendorDir = path.join(localTarget, 'vendor', 'static-noise');
    const lockPath = path.join(localTarget, 'static-noise.lock.json');

    try {
      await mkdir(fixtureRepo, { recursive: true });
      await execFileAsync('git', ['init', '--bare', fixtureRepo]);

      await mkdir(workingRepo, { recursive: true });
      await execFileAsync('git', ['init', workingRepo]);
      await execFileAsync('git', ['-C', workingRepo, 'remote', 'add', 'origin', fixtureRepo]);

      await mkdir(path.join(workingRepo, 'schemas'), { recursive: true });
      const schemaContent = JSON.stringify({
        $schema: 'http://json-schema.org/draft-07/schema#',
        type: 'object',
        required: ['version', 'name'],
        properties: {
          version: { type: 'string' },
          name: { type: 'string' }
        }
      });
      const paletteContent = JSON.stringify({
        version: '0.0.1',
        name: 'Static Noise'
      });

      await writeFile(path.join(workingRepo, 'schemas', 'palette.schema.json'), schemaContent, 'utf8');
      await writeFile(path.join(workingRepo, 'palette.json'), paletteContent, 'utf8');

      await execFileAsync('git', ['-C', workingRepo, 'add', '.']);
      await execFileAsync('git', ['-C', workingRepo, '-c', 'user.name=Tester', '-c', 'user.email=tester@example.com', 'commit', '-m', 'Initial']);
      await execFileAsync('git', ['-C', workingRepo, 'tag', 'v0.0.1']);
      await execFileAsync('git', ['-C', workingRepo, 'push', 'origin', 'HEAD', '--tags']);

      const { stdout: commitShaRaw } = await execFileAsync('git', ['-C', workingRepo, 'rev-parse', 'HEAD']);
      const commitSha = commitShaRaw.trim();

      await mkdir(localTarget, { recursive: true });
      const lockContent = JSON.stringify({
        repository: fixtureRepo,
        version: '0.0.1',
        sha: commitSha
      }, null, 2);
      await writeFile(lockPath, lockContent, 'utf8');

      const originalLockRaw = await readFile(lockPath, 'utf8');

      const result = await syncPalette({
        repoRoot: localTarget,
        lockPath,
        vendorDir
      });

      const afterLockRaw = await readFile(lockPath, 'utf8');
      expect(afterLockRaw).toBe(originalLockRaw);
      expect(result.sha).toBe(commitSha);

      const vendoredPalette = JSON.parse(await readFile(path.join(vendorDir, 'palette.json'), 'utf8'));
      expect(vendoredPalette.version).toBe('0.0.1');
    } finally {
      await rm(tmpRoot, { recursive: true, force: true }).catch(() => {});
    }
  });

  it('fails atomically when palette version does not match lock', async () => {
    const tmpRoot = await mkdtemp(path.join(os.tmpdir(), 'fixture-fail-test-'));
    const fixtureRepo = path.join(tmpRoot, 'upstream.git');
    const workingRepo = path.join(tmpRoot, 'upstream-working');
    const localTarget = path.join(tmpRoot, 'target-project');
    const vendorDir = path.join(localTarget, 'vendor', 'static-noise');
    const lockPath = path.join(localTarget, 'static-noise.lock.json');

    try {
      await mkdir(fixtureRepo, { recursive: true });
      await execFileAsync('git', ['init', '--bare', fixtureRepo]);

      await mkdir(workingRepo, { recursive: true });
      await execFileAsync('git', ['init', workingRepo]);
      await execFileAsync('git', ['-C', workingRepo, 'remote', 'add', 'origin', fixtureRepo]);

      await mkdir(path.join(workingRepo, 'schemas'), { recursive: true });
      await writeFile(path.join(workingRepo, 'schemas', 'palette.schema.json'), JSON.stringify({ type: 'object' }), 'utf8');
      await writeFile(path.join(workingRepo, 'palette.json'), JSON.stringify({ version: '0.0.2', name: 'Static Noise' }), 'utf8');

      await execFileAsync('git', ['-C', workingRepo, 'add', '.']);
      await execFileAsync('git', ['-C', workingRepo, '-c', 'user.name=Tester', '-c', 'user.email=tester@example.com', 'commit', '-m', 'Mismatch']);
      await execFileAsync('git', ['-C', workingRepo, 'tag', 'v0.0.1']);
      await execFileAsync('git', ['-C', workingRepo, 'push', 'origin', 'HEAD', '--tags']);

      const { stdout: commitShaRaw } = await execFileAsync('git', ['-C', workingRepo, 'rev-parse', 'HEAD']);
      const commitSha = commitShaRaw.trim();

      await mkdir(localTarget, { recursive: true });
      await writeFile(lockPath, JSON.stringify({
        repository: fixtureRepo,
        version: '0.0.1',
        sha: commitSha
      }), 'utf8');

      await mkdir(vendorDir, { recursive: true });
      const sentinel = path.join(vendorDir, 'sentinel.txt');
      await writeFile(sentinel, 'initial-state', 'utf8');

      await expect(syncPalette({
        repoRoot: localTarget,
        lockPath,
        vendorDir
      })).rejects.toThrow(/Palette declared version/);

      const stillThere = await readFile(sentinel, 'utf8');
      expect(stillThere).toBe('initial-state');
    } finally {
      await rm(tmpRoot, { recursive: true, force: true }).catch(() => {});
    }
  });
});
