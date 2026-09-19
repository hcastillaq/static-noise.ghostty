import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { readAndValidateLock } from '../src/lock.mjs';

const lockPath = path.resolve('static-noise.lock.json');

describe('static-noise.lock.json contract', () => {
  it('reads the committed lock without rewriting or modifying it', async () => {
    const originalRaw = await readFile(lockPath, 'utf8');
    const lock = await readAndValidateLock(lockPath);
    const afterRaw = await readFile(lockPath, 'utf8');

    expect(afterRaw).toBe(originalRaw);
    expect(lock.repository).toBe('https://github.com/hcastillaq/static-noise.git');
    expect(lock.version).toBe('0.0.1');
    expect(lock.sha).toBe('3a1440055e1c87aec61ac885f137aad7f816d3ec');
  });

  it('rejects unexpected keys or missing keys', async () => {
    const invalidJson = JSON.stringify({
      repository: 'https://github.com/hcastillaq/static-noise.git',
      version: '0.0.1'
    });

    await expect(readAndValidateLockFromMemory(invalidJson)).rejects.toThrow(/Lockfile must contain exactly/);
  });

  it('rejects invalid SHA formats', async () => {
    const shortSha = JSON.stringify({
      repository: 'https://github.com/hcastillaq/static-noise.git',
      version: '0.0.1',
      sha: '3a14400'
    });
    const upperSha = JSON.stringify({
      repository: 'https://github.com/hcastillaq/static-noise.git',
      version: '0.0.1',
      sha: '3A1440055E1C87AEC61AC885F137AAD7F816D3EC'
    });

    await expect(readAndValidateLockFromMemory(shortSha)).rejects.toThrow(/Invalid commit SHA/);
    await expect(readAndValidateLockFromMemory(upperSha)).rejects.toThrow(/Invalid commit SHA/);
  });
});

async function readAndValidateLockFromMemory(jsonString) {
  const tmpPath = path.resolve(`.context/compound-engineering/test-lock-${Date.now()}-${Math.random().toString(36).slice(2)}.json`);
  const { writeFile, unlink, mkdir } = await import('node:fs/promises');
  await mkdir(path.dirname(tmpPath), { recursive: true });
  await writeFile(tmpPath, jsonString, 'utf8');
  try {
    return await readAndValidateLock(tmpPath);
  } finally {
    await unlink(tmpPath).catch(() => {});
  }
}
