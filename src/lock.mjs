import { readFile } from 'node:fs/promises';
import path from 'node:path';

const SHA_REGEX = /^[0-9a-f]{40}$/;
const SEMVER_REGEX = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;
const REPO_REGEX = /^https:\/\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+(?:\/[A-Za-z0-9_.-]+)*?(?:\.git)?$/;

export async function readAndValidateLock(filePath = path.resolve('static-noise.lock.json')) {
  const content = await readFile(filePath, 'utf8');
  let data;
  try {
    data = JSON.parse(content);
  } catch (error) {
    throw new Error(`Invalid JSON in lockfile: ${error.message}`);
  }

  const expectedKeys = ['repository', 'version', 'sha'];
  const actualKeys = Object.keys(data);
  if (actualKeys.length !== expectedKeys.length || !expectedKeys.every((key) => actualKeys.includes(key))) {
    throw new Error(`Lockfile must contain exactly repository, version, and sha. Received: ${actualKeys.join(', ')}`);
  }

  if (typeof data.repository !== 'string' || !REPO_REGEX.test(data.repository)) {
    throw new Error(`Invalid repository URL: ${data.repository}`);
  }

  if (typeof data.version !== 'string' || !SEMVER_REGEX.test(data.version)) {
    throw new Error(`Invalid semantic version: ${data.version}`);
  }

  if (typeof data.sha !== 'string' || !SHA_REGEX.test(data.sha)) {
    throw new Error(`Invalid commit SHA (must be 40 lowercase hex characters): ${data.sha}`);
  }

  return { ...data, rawContent: content };
}
